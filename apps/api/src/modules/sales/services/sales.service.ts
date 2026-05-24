import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { AccountingService } from '../../accounting/services/accounting.service';
import { AuditService } from '../../audit/audit.service';
import { OutboxService } from '../../outbox/outbox.service';
import { TCreateSalesOrder, TCancelOrder, TOrderQuery } from '../dto/sales.dto';
import { ISalesService } from '@brushia/shared';

/**
 * SALES ENGINE
 * 
 * Orchestrates the complete sales workflow:
 * Order → Payment → Inventory Deduction → Accounting Entry → Audit → Events
 * 
 * All in a single database transaction.
 */
@Injectable()
export class SalesService implements ISalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly inventory: InventoryService,
    private readonly accounting: AccountingService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Create a complete sales order.
   * 
   * This is the MAIN entry point for all sales (POS, web, WhatsApp, etc.)
   * Everything happens in one transaction — atomicity guaranteed.
   */
  async createOrder(tenantId: string, userId: string, dto: TCreateSalesOrder) {
    return this.db.transaction(async (client) => {
      // Resolve warehouse_id from either warehouse_id or location_id in the DTO
      const warehouseId = (dto as any).warehouse_id || dto.location_id;
      // ─── 1. Calculate line items ─────────────────────
      let subtotal = 0;
      let totalDiscount = 0;
      let totalCostOfGoods = 0;
      const orderItems: any[] = [];

      for (const item of dto.items) {
        // Get product info + current cost
        const product = await client.query(
          `SELECT p.*, COALESCE(
            (SELECT sl.weighted_avg_cost FROM inventory.stock_levels sl 
             WHERE sl.product_id = p.id AND sl.warehouse_id = $3 AND sl.tenant_id = $2
             LIMIT 1), p.cost_price
           ) as current_cost
           FROM catalog.products p WHERE p.id = $1 AND p.tenant_id = $2`,
          [item.product_id, tenantId, warehouseId],
        ).then(r => r.rows[0]);

        if (!product) throw new NotFoundException(`Product ${item.product_id} not found`);

        // Check price list override for wholesale
        let unitPrice = item.unit_price;
        if (dto.price_list_id) {
          const plPrice = await client.query(
            `SELECT price FROM catalog.price_list_items 
             WHERE price_list_id = $1 AND product_id = $2 AND tenant_id = $3`,
            [dto.price_list_id, item.product_id, tenantId],
          ).then(r => r.rows[0]);
          if (plPrice) unitPrice = parseInt(plPrice.price);
        }

        // Calculate line totals
        const lineSubtotal = unitPrice * item.quantity;
        const itemDiscount = item.discount_amount > 0 
          ? item.discount_amount 
          : Math.round(lineSubtotal * (item.discount_percentage / 100));
        const lineTotal = lineSubtotal - itemDiscount;
        const lineCost = parseInt(product.current_cost) * item.quantity;

        subtotal += lineSubtotal;
        totalDiscount += itemDiscount;
        totalCostOfGoods += lineCost;

        orderItems.push({
          ...item,
          unit_price: unitPrice,
          discount_amount: itemDiscount,
          line_subtotal: lineSubtotal,
          line_total: lineTotal,
          unit_cost: parseInt(product.current_cost),
          product_name: product.name,
          product_sku: product.sku,
        });
      }

      // ─── 2. Apply order-level discounts ──────────────
      let orderDiscount = dto.order_discount_amount;
      if (dto.order_discount_percentage > 0) {
        orderDiscount = Math.round(subtotal * (dto.order_discount_percentage / 100));
      }
      totalDiscount += orderDiscount;

      // ─── 3. Calculate tax ────────────────────────────
      const taxableAmount = subtotal - totalDiscount;
      const taxAmount = dto.is_taxable ? Math.round(taxableAmount * (dto.tax_rate / 100)) : 0;

      // ─── 4. Calculate total ──────────────────────────
      const grandTotal = taxableAmount + taxAmount + dto.shipping_amount;

      // Apply loyalty points discount
      let loyaltyDiscount = 0;
      if (dto.loyalty_points_used > 0 && dto.customer_id) {
        // 1 point = 1 piaster (configurable)
        loyaltyDiscount = dto.loyalty_points_used;
      }
      const finalTotal = grandTotal - loyaltyDiscount;

      // ─── 5. Generate order number ────────────────────
      const orderNumber = await this.generateOrderNumber(client, tenantId, dto.source);

      // ─── 6. Create order ─────────────────────────────
      const order = await client.query(
        `INSERT INTO sales.sales_orders (
          tenant_id, order_number, customer_id, warehouse_id, source, status,
          subtotal, discount_amount, tax_amount, tax_rate, shipping_amount,
          loyalty_discount, grand_total,
          payment_method, price_list_id, salesperson_id, notes, created_by
        ) VALUES ($1,$2,$3,$4,$5,'confirmed',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING *`,
        [
          tenantId, orderNumber, dto.customer_id, warehouseId, dto.source,
          subtotal, totalDiscount, taxAmount, dto.tax_rate, dto.shipping_amount,
          loyaltyDiscount, finalTotal,
          dto.payment_method, dto.price_list_id, dto.salesperson_id, dto.notes, userId,
        ],
      ).then(r => r.rows[0]);

      // ─── 7. Create order items ───────────────────────
      for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i];
        await client.query(
          `INSERT INTO sales.order_items (
            tenant_id, order_id, line_number, product_id, variant_id,
            name, sku, quantity, unit_price, cost_price,
            discount_amount, tax_amount, total
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            tenantId, order.id, i + 1, item.product_id, item.variant_id,
            item.product_name, item.product_sku, item.quantity, item.unit_price, item.unit_cost,
            item.discount_amount,
            dto.is_taxable ? Math.round(item.line_total * (dto.tax_rate / 100)) : 0,
            item.line_total,
          ],
        );
      }

      // ─── 8. Record payments ──────────────────────────
      if (dto.payment_method === 'split' && dto.payments) {
        for (const payment of dto.payments) {
          const splitPayNum = await this.generatePaymentNumber(client, tenantId);
          await client.query(
            `INSERT INTO sales.payments (
              tenant_id, order_id, payment_number, method, amount, reference, received_by, status
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,'completed')`,
            [tenantId, order.id, splitPayNum, payment.method, payment.amount, payment.reference, userId],
          );
        }
      } else {
        const singlePayNum = await this.generatePaymentNumber(client, tenantId);
        await client.query(
          `INSERT INTO sales.payments (
            tenant_id, order_id, payment_number, method, amount, received_by, status
          ) VALUES ($1,$2,$3,$4,$5,$6,'completed')`,
          [tenantId, order.id, singlePayNum, dto.payment_method, finalTotal, userId],
        );
      }

      // ─── 9. Deduct inventory ─────────────────────────
      for (const item of orderItems) {
        const lockKey = this.computeLockKey(item.product_id, warehouseId);
        await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

        // Get current stock
        const stockLevel = await client.query(
          `SELECT * FROM inventory.stock_levels
           WHERE product_id = $1 AND warehouse_id = $2 AND tenant_id = $3
             AND ($4::uuid IS NULL AND variant_id IS NULL OR variant_id = $4)
           FOR UPDATE`,
          [item.product_id, warehouseId, tenantId, item.variant_id || null],
        ).then(r => r.rows[0]);

        const currentQty = stockLevel ? parseInt(stockLevel.qty_on_hand) : 0;
        const newQty = currentQty - item.quantity;

        if (newQty < 0) {
          throw new BadRequestException(
            `Insufficient stock for ${item.product_name} (${item.product_sku}). Available: ${currentQty}, Ordered: ${item.quantity}`
          );
        }

        // Record movement
        await client.query(
          `INSERT INTO inventory.stock_movements (
            tenant_id, product_id, variant_id, warehouse_id,
            movement_type, quantity, unit_cost, total_cost,
            balance_after, avg_cost_after,
            reference_type, reference_id, performed_by
          ) VALUES ($1,$2,$3,$4,'sale',$5,$6,$7,$8,$9,'sales_order',$10,$11)`,
          [
            tenantId, item.product_id, item.variant_id || null, warehouseId,
            -item.quantity, item.unit_cost, item.unit_cost * item.quantity,
            newQty, 0,
            order.id, userId,
          ],
        );

        // Update stock level
        await client.query(
          `UPDATE inventory.stock_levels SET qty_on_hand = $3, updated_at = NOW()
           WHERE product_id = $1 AND warehouse_id = $4 AND tenant_id = $5
             AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
          [item.product_id, item.variant_id || null, newQty, warehouseId, tenantId],
        );
      }

      // ─── 10. Post accounting entry ───────────────────
      await this.accounting.postSaleEntry(tenantId, userId, {
        orderId: order.id,
        totalAmount: finalTotal,
        costOfGoods: totalCostOfGoods,
        taxAmount,
        paymentMethod: dto.payment_method === 'split' ? 'cash' : dto.payment_method,
        entryDate: new Date().toISOString().split('T')[0],
      }, client);

      // ─── 11. Update customer stats ───────────────────
      if (dto.customer_id) {
        await client.query(
          `UPDATE sales.customers SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + $3,
            last_order_at = NOW(),
            updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2`,
          [dto.customer_id, tenantId, finalTotal],
        );

        // Award loyalty points (1 point per EGP spent)
        const pointsEarned = Math.floor(finalTotal / 100); // 1 point per 1 EGP
        if (pointsEarned > 0) {
          await client.query(
            `UPDATE sales.customers SET loyalty_points = loyalty_points + $3, updated_at = NOW()
             WHERE id = $1 AND tenant_id = $2`,
            [dto.customer_id, tenantId, pointsEarned],
          );
        }

        // Deduct loyalty points if used
        if (dto.loyalty_points_used > 0) {
          await client.query(
            `UPDATE sales.customers SET loyalty_points = loyalty_points - $3, updated_at = NOW()
             WHERE id = $1 AND tenant_id = $2`,
            [dto.customer_id, tenantId, dto.loyalty_points_used],
          );
        }
      }

      // ─── 12. Write outbox event ──────────────────────
      await this.outbox.write(client, {
        tenant_id: tenantId,
        event_type: 'sales.order_created',
        aggregate_type: 'sales_order',
        aggregate_id: order.id,
        payload: {
          order_number: orderNumber,
          customer_id: dto.customer_id,
          source: dto.source,
          grand_total: finalTotal,
          item_count: orderItems.length,
          payment_method: dto.payment_method,
        },
      });

      // ─── 13. Audit log ──────────────────────────────
      await this.audit.logInTransaction(client, {
        tenantId, userId,
        action: 'sales_order.created',
        entity_type: 'sales_order',
        entity_id: order.id,
        new_values: {
          order_number: orderNumber,
          grand_total: finalTotal,
          items: orderItems.length,
          source: dto.source,
        },
      });

      this.logger.log(`Sale completed: ${orderNumber} total=${finalTotal} items=${orderItems.length} source=${dto.source}`);

      return {
        ...order,
        items: orderItems,
        cost_of_goods: totalCostOfGoods,
        profit: finalTotal - totalCostOfGoods,
      };
    });
  }

  async cancelOrder(tenantId: string, userId: string, orderId: string, dto: TCancelOrder) {
    return this.db.transaction(async (client) => {
      const order = await client.query(
        `SELECT * FROM sales.sales_orders WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [orderId, tenantId],
      ).then(r => r.rows[0]);

      if (!order) throw new NotFoundException('Order not found');
      if (['cancelled', 'returned'].includes(order.status)) {
        throw new BadRequestException(`Order is already ${order.status}`);
      }

      // Get order items for restocking
      const items = await client.query(
        `SELECT * FROM sales.order_items WHERE order_id = $1 AND tenant_id = $2`,
        [orderId, tenantId],
      );

      // Cancel the order
      await client.query(
        `UPDATE sales.sales_orders SET status = 'cancelled', cancel_reason = $3, cancelled_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [orderId, tenantId, dto.reason],
      );

      // Restock if requested
      if (dto.restock) {
        for (const item of items.rows) {
          const lockKey = this.computeLockKey(item.product_id, order.warehouse_id);
          await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

          const stockLevel = await client.query(
            `SELECT * FROM inventory.stock_levels
             WHERE product_id = $1 AND warehouse_id = $2 AND tenant_id = $3
               AND ($4::uuid IS NULL AND variant_id IS NULL OR variant_id = $4)
             FOR UPDATE`,
            [item.product_id, order.warehouse_id, tenantId, item.variant_id],
          ).then(r => r.rows[0]);

          const currentQty = stockLevel ? parseInt(stockLevel.qty_on_hand) : 0;
          const newQty = currentQty + parseInt(item.quantity);

          await client.query(
            `INSERT INTO inventory.stock_movements (
              tenant_id, product_id, variant_id, warehouse_id,
              movement_type, quantity, unit_cost, total_cost,
              balance_after, avg_cost_after,
              reference_type, reference_id, notes, performed_by
            ) VALUES ($1,$2,$3,$4,'sale_return',$5,$6,$7,$8,$9,'sales_order',$10,$11,$12)`,
            [
              tenantId, item.product_id, item.variant_id, order.warehouse_id,
              parseInt(item.quantity), parseInt(item.unit_cost), parseInt(item.unit_cost) * parseInt(item.quantity),
              newQty, 0,
              orderId, `Cancelled: ${dto.reason}`, userId,
            ],
          );

          await client.query(
            `UPDATE inventory.stock_levels SET qty_on_hand = $3, updated_at = NOW()
             WHERE product_id = $1 AND warehouse_id = $4 AND tenant_id = $5
               AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
            [item.product_id, item.variant_id, newQty, order.warehouse_id, tenantId],
          );
        }
      }

      // Void the journal entry
      // Find the JE for this order
      const je = await client.query(
        `SELECT id FROM accounting.journal_entries 
         WHERE reference_type = 'sales_order' AND reference_id = $1 AND tenant_id = $2 AND status = 'posted'`,
        [orderId, tenantId],
      ).then(r => r.rows[0]);

      if (je) {
        await this.accounting.voidJournalEntry(tenantId, userId, je.id, `Order cancelled: ${dto.reason}`);
      }

      // Restore customer stats
      if (order.customer_id) {
        await client.query(
          `UPDATE sales.customers SET 
            total_orders = GREATEST(total_orders - 1, 0),
            total_spent = GREATEST(total_spent - $3, 0),
            updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2`,
          [order.customer_id, tenantId, parseInt(order.grand_total)],
        );
      }

      // Outbox
      await this.outbox.write(client, {
        tenant_id: tenantId,
        event_type: 'sales.order_cancelled',
        aggregate_type: 'sales_order',
        aggregate_id: orderId,
        payload: { reason: dto.reason, restock: dto.restock },
      });

      this.logger.log(`Order cancelled: ${order.order_number} reason=${dto.reason} restock=${dto.restock}`);

      return { ...order, status: 'cancelled' };
    });
  }

  async getOrder(tenantId: string, orderId: string) {
    const order = await this.db.queryOne(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone,
        w.name as warehouse_name, u.display_name as created_by_name,
        sp.name as salesperson_name
       FROM sales.sales_orders o
       LEFT JOIN sales.customers c ON c.id = o.customer_id
       LEFT JOIN inventory.warehouses w ON w.id = o.warehouse_id
       LEFT JOIN iam.users u ON u.id = o.created_by
       LEFT JOIN hr.salespersons sp ON sp.id = o.salesperson_id
       WHERE o.id = $1 AND o.tenant_id = $2`,
      [orderId, tenantId],
    );
    if (!order) throw new NotFoundException('Order not found');

    const items = await this.db.query(
      `SELECT * FROM sales.order_items WHERE order_id = $1 AND tenant_id = $2 ORDER BY line_number ASC`,
      [orderId, tenantId],
    );

    const payments = await this.db.query(
      `SELECT * FROM sales.payments WHERE order_id = $1 AND tenant_id = $2`,
      [orderId, tenantId],
    );

    order.items = items.rows;
    order.payments = payments.rows;
    return order;
  }

  async listOrders(tenantId: string, query: TOrderQuery) {
    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 100);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT o.*, c.name as customer_name, w.name as warehouse_name,
        (SELECT COUNT(*) FROM sales.order_items oi WHERE oi.order_id = o.id) as item_count
      FROM sales.sales_orders o
      LEFT JOIN sales.customers c ON c.id = o.customer_id
      LEFT JOIN inventory.warehouses w ON w.id = o.warehouse_id
      WHERE o.tenant_id = $1`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (query.status) {
      sql += ` AND o.status = $${idx++}`;
      params.push(query.status);
    }
    if (query.source) {
      sql += ` AND o.source = $${idx++}`;
      params.push(query.source);
    }
    if (query.customer_id) {
      sql += ` AND o.customer_id = $${idx++}`;
      params.push(query.customer_id);
    }
    if (query.location_id) {
      sql += ` AND o.warehouse_id = $${idx++}`;
      params.push(query.location_id);
    }
    if (query.date_from) {
      sql += ` AND o.created_at >= $${idx++}`;
      params.push(query.date_from);
    }
    if (query.date_to) {
      sql += ` AND o.created_at <= $${idx++}`;
      params.push(query.date_to);
    }
    if (query.search) {
      sql += ` AND (o.order_number ILIKE $${idx} OR c.name ILIKE $${idx})`;
      params.push(`%${query.search}%`);
      idx++;
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await this.db.query(sql, params);
    return { data: result.rows, pagination: { page, limit, hasMore: result.rows.length === limit } };
  }

  async recordPayment(tenantId: string, userId: string, orderId: string, payment: { method: string; amount: number; reference?: string }) {
    const order = await this.db.queryOne(
      `SELECT * FROM sales.sales_orders WHERE id = $1 AND tenant_id = $2`,
      [orderId, tenantId],
    );
    if (!order) throw new NotFoundException('Order not found');

    const payNum = `PAY-${Date.now().toString(36).toUpperCase()}`;
    const result = await this.db.query(
      `INSERT INTO sales.payments (tenant_id, order_id, payment_number, method, amount, reference, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed') RETURNING *`,
      [tenantId, orderId, payNum, payment.method, payment.amount, payment.reference],
    );

    return result.rows[0];
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  private async generateOrderNumber(client: any, tenantId: string, source: string): Promise<string> {
    const prefix = source === 'pos' ? 'POS' : source === 'wholesale' ? 'WS' : 'SO';
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

    const result = await client.query(
      `SELECT COUNT(*) + 1 as next_num 
       FROM sales.sales_orders 
       WHERE tenant_id = $1 AND created_at::date = CURRENT_DATE`,
      [tenantId],
    );

    const num = String(result.rows[0].next_num).padStart(4, '0');
    return `${prefix}-${today}-${num}`;
  }


  private async generatePaymentNumber(client: any, tenantId: string): Promise<string> {
    const result = await client.query(
      `SELECT COUNT(*) + 1 as next_num FROM sales.payments WHERE tenant_id = $1`,
      [tenantId],
    );
    return `PAY-${String(result.rows[0].next_num).padStart(6, '0')}`;
  }

  private computeLockKey(productId: string, locationId: string): number {
    const combined = `${productId}:${locationId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
