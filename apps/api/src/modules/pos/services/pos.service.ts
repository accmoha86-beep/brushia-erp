import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { SalesService } from '../../sales/services/sales.service';
import { AuditService } from '../../audit/audit.service';
import { OutboxService } from '../../outbox/outbox.service';
import { TOpenSession, TCloseSession, TPOSTransaction, THoldOrder, TCashMovement } from '../dto/pos.dto';

/**
 * POS ENGINE
 * 
 * Manages register-based point of sale operations:
 * - Register and session lifecycle
 * - POS transactions (delegates to Sales Engine for the actual sale)
 * - Held orders (park/retrieve)
 * - Cash drawer movements
 * - Daily summaries
 * 
 * The POS Engine is a thin orchestrator — actual sale logic lives in SalesService.
 */
@Injectable()
export class POSService {
  private readonly logger = new Logger(POSService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly sales: SalesService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // REGISTER MANAGEMENT
  // ═══════════════════════════════════════════════════════

  async listRegisters(tenantId: string, locationId?: string) {
    let sql = `
      SELECT r.*, w.name as warehouse_name,
        (SELECT COUNT(*) FROM pos.sessions s WHERE s.register_id = r.id AND s.status = 'open') as open_sessions
      FROM pos.registers r
      LEFT JOIN inventory.warehouses w ON w.id = r.location_id
      WHERE r.tenant_id = $1`;
    const params: any[] = [tenantId];

    if (locationId) {
      sql += ` AND r.location_id = $2`;
      params.push(locationId);
    }

    sql += ` ORDER BY r.name ASC`;
    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async createRegister(tenantId: string, userId: string, dto: any) {
    // Auto-generate code if not provided
    const codeResult = await this.db.queryOne(
      `SELECT COUNT(*) + 1 as next FROM pos.registers WHERE tenant_id = $1`,
      [tenantId],
    );
    const code = dto.code || `POS-${String(codeResult.next).padStart(3, '0')}`;

    const result = await this.db.query(
      `INSERT INTO pos.registers (tenant_id, name, code, location_id, device_name, receipt_header, receipt_footer)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, dto.name, code, dto.location_id, dto.device_name, dto.receipt_header, dto.receipt_footer],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'register.created',
      entity_type: 'register',
      entity_id: result.rows[0].id,
      new_values: dto,
    });

    return result.rows[0];
  }

  // ═══════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════

  async openSession(tenantId: string, userId: string, dto: TOpenSession) {
    // Verify register exists
    const register = await this.db.queryOne(
      `SELECT * FROM pos.registers WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [dto.register_id, tenantId],
    );
    if (!register) throw new NotFoundException('Register not found or inactive');

    // Check no open session exists for this user on this register
    const existingSession = await this.db.queryOne(
      `SELECT id FROM pos.sessions WHERE register_id = $1 AND cashier_id = $2 AND tenant_id = $3 AND status = 'open'`,
      [dto.register_id, userId, tenantId],
    );
    if (existingSession) throw new ConflictException('You already have an open session on this register');

    // Generate session number
    const sessionNumber = await this.generateSessionNumber(tenantId);

    const session = await this.db.query(
      `INSERT INTO pos.sessions (
        tenant_id, register_id, session_number, cashier_id,
        opening_cash, current_cash, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $5, 'open', $6) RETURNING *`,
      [tenantId, dto.register_id, sessionNumber, userId, dto.opening_cash, dto.notes],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'pos_session.opened',
      entity_type: 'pos_session',
      entity_id: session.rows[0].id,
      new_values: { register: register.name, opening_cash: dto.opening_cash },
    });

    this.logger.log(`POS session opened: ${sessionNumber} register=${register.name} cashier=${userId}`);

    return { ...session.rows[0], register_name: register.name };
  }

  async closeSession(tenantId: string, userId: string, sessionId: string, dto: TCloseSession) {
    return this.db.transaction(async (client) => {
      const session = await client.query(
        `SELECT s.*, r.name as register_name, r.location_id
         FROM pos.sessions s
         INNER JOIN pos.registers r ON r.id = s.register_id
         WHERE s.id = $1 AND s.tenant_id = $2 AND s.status = 'open' FOR UPDATE`,
        [sessionId, tenantId],
      ).then(r => r.rows[0]);

      if (!session) throw new NotFoundException('Open session not found');
      if (session.cashier_id !== userId) throw new BadRequestException('Only the session cashier can close this session');

      // Check for held orders
      const heldOrders = await client.query(
        `SELECT COUNT(*) as count FROM pos.held_orders WHERE session_id = $1 AND tenant_id = $2 AND status = 'held'`,
        [sessionId, tenantId],
      );
      if (parseInt(heldOrders.rows[0].count) > 0) {
        throw new BadRequestException('Cannot close session with held orders. Complete or void them first.');
      }

      // Calculate expected cash
      const transactions = await client.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN pt.method = 'cash' THEN pt.amount ELSE 0 END), 0) as cash_sales,
          COALESCE(SUM(CASE WHEN pt.method = 'card' THEN pt.amount ELSE 0 END), 0) as card_sales,
          COALESCE(SUM(CASE WHEN pt.method = 'vodafone_cash' THEN pt.amount ELSE 0 END), 0) as vodafone_sales,
          COALESCE(SUM(CASE WHEN pt.method = 'instapay' THEN pt.amount ELSE 0 END), 0) as instapay_sales,
          COUNT(DISTINCT pt.transaction_id) as transaction_count
         FROM pos.transaction_payments pt
         INNER JOIN pos.transactions t ON t.id = pt.transaction_id
         WHERE t.session_id = $1 AND t.tenant_id = $2 AND t.status = 'completed'`,
        [sessionId, tenantId],
      ).then(r => r.rows[0]);

      // Get cash movements
      const cashMovements = await client.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0) as total_in,
          COALESCE(SUM(CASE WHEN type = 'cash_out' THEN amount ELSE 0 END), 0) as total_out
         FROM pos.cash_movements WHERE session_id = $1 AND tenant_id = $2`,
        [sessionId, tenantId],
      ).then(r => r.rows[0]);

      const expectedCash = parseInt(session.opening_cash) 
        + parseInt(transactions.cash_sales) 
        + parseInt(cashMovements.total_in) 
        - parseInt(cashMovements.total_out);

      const cashDifference = dto.closing_cash - expectedCash;

      // Calculate total sales
      const totalSales = parseInt(transactions.cash_sales) 
        + parseInt(transactions.card_sales) 
        + parseInt(transactions.vodafone_sales) 
        + parseInt(transactions.instapay_sales);

      // Close the session
      await client.query(
        `UPDATE pos.sessions SET 
          status = 'closed',
          closing_cash = $3,
          expected_cash = $4,
          cash_difference = $5,
          total_sales = $6,
          total_transactions = $7,
          total_cash_sales = $8,
          total_card_sales = $9,
          closed_at = NOW(),
          close_notes = $10,
          updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [
          sessionId, tenantId,
          dto.closing_cash, expectedCash, cashDifference,
          totalSales, parseInt(transactions.transaction_count),
          parseInt(transactions.cash_sales), parseInt(transactions.card_sales),
          dto.notes,
        ],
      );

      // Create daily summary
      await client.query(
        `INSERT INTO pos.daily_summaries (
          tenant_id, register_id, summary_date, session_id,
          opening_cash, closing_cash, expected_cash, cash_difference,
          total_sales, total_transactions, total_refunds,
          cash_sales, card_sales, mobile_sales
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12)
        ON CONFLICT (tenant_id, register_id, summary_date) DO UPDATE SET
          closing_cash = EXCLUDED.closing_cash,
          total_sales = pos.daily_summaries.total_sales + EXCLUDED.total_sales,
          total_transactions = pos.daily_summaries.total_transactions + EXCLUDED.total_transactions`,
        [
          tenantId, session.register_id, sessionId,
          parseInt(session.opening_cash), dto.closing_cash, expectedCash, cashDifference,
          totalSales, parseInt(transactions.transaction_count),
          parseInt(transactions.cash_sales), parseInt(transactions.card_sales),
          parseInt(transactions.vodafone_sales) + parseInt(transactions.instapay_sales),
        ],
      );

      await this.audit.logWithinTransaction(client, {
        tenantId, userId,
        action: 'pos_session.closed',
        entity_type: 'pos_session',
        entity_id: sessionId,
        new_values: {
          closing_cash: dto.closing_cash,
          expected_cash: expectedCash,
          difference: cashDifference,
          total_sales: totalSales,
        },
      });

      this.logger.log(`POS session closed: ${session.session_number} sales=${totalSales} diff=${cashDifference}`);

      return {
        session_number: session.session_number,
        register_name: session.register_name,
        opening_cash: parseInt(session.opening_cash),
        closing_cash: dto.closing_cash,
        expected_cash: expectedCash,
        cash_difference: cashDifference,
        total_sales: totalSales,
        transaction_count: parseInt(transactions.transaction_count),
        cash_sales: parseInt(transactions.cash_sales),
        card_sales: parseInt(transactions.card_sales),
        vodafone_sales: parseInt(transactions.vodafone_sales),
        instapay_sales: parseInt(transactions.instapay_sales),
      };
    });
  }

  async getActiveSession(tenantId: string, userId: string) {
    const session = await this.db.queryOne(
      `SELECT s.*, r.name as register_name, r.location_id, w.name as warehouse_name
       FROM pos.sessions s
       INNER JOIN pos.registers r ON r.id = s.register_id
       LEFT JOIN inventory.warehouses w ON w.id = r.location_id
       WHERE s.cashier_id = $1 AND s.tenant_id = $2 AND s.status = 'open'`,
      [userId, tenantId],
    );
    return session;
  }

  // ═══════════════════════════════════════════════════════
  // POS TRANSACTIONS (SALES)
  // ═══════════════════════════════════════════════════════

  /**
   * Process a POS sale.
   * Delegates to SalesService for the actual business logic.
   * POS adds: register/session tracking, receipt number, cash drawer update.
   */
  async processSale(tenantId: string, userId: string, dto: TPOSTransaction) {
    return this.db.transaction(async (client) => {
      // 1. Validate session
      const session = await client.query(
        `SELECT s.*, r.location_id FROM pos.sessions s
         INNER JOIN pos.registers r ON r.id = s.register_id
         WHERE s.id = $1 AND s.tenant_id = $2 AND s.status = 'open' FOR UPDATE`,
        [dto.session_id, tenantId],
      ).then(r => r.rows[0]);

      if (!session) throw new NotFoundException('Active POS session not found');

      // 2. Determine payment method
      const isSplit = dto.payments.length > 1;
      const primaryMethod = dto.payments[0].method;

      // 3. Create sales order via Sales Engine
      const order = await this.sales.createOrder(tenantId, userId, {
        customer_id: dto.customer_id,
        location_id: session.location_id,
        source: 'pos',
        items: dto.items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          discount_percentage: item.discount_percentage,
        })),
        order_discount_amount: dto.order_discount_amount,
        order_discount_percentage: dto.order_discount_percentage,
        coupon_code: dto.coupon_code,
        is_taxable: true,
        tax_rate: 14, // Egypt VAT
        shipping_amount: 0,
        payment_method: isSplit ? 'split' : primaryMethod,
        payments: isSplit ? dto.payments : undefined,
        loyalty_points_used: dto.loyalty_points_used,
        salesperson_id: dto.salesperson_id,
        notes: dto.notes,
      });

      // 4. Generate receipt number
      const receiptNumber = await this.generateReceiptNumber(client, tenantId, session.register_id);

      // 5. Create POS transaction record
      const transaction = await client.query(
        `INSERT INTO pos.transactions (
          tenant_id, session_id, order_id, receipt_number,
          subtotal, discount_amount, tax_amount, grand_total,
          status, cashier_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'completed',$9)
        RETURNING *`,
        [
          tenantId, dto.session_id, order.id, receiptNumber,
          order.subtotal, order.discount_amount, order.tax_amount, order.grand_total,
          userId,
        ],
      ).then(r => r.rows[0]);

      // 6. Record POS-specific payment details
      for (const payment of dto.payments) {
        await client.query(
          `INSERT INTO pos.transaction_payments (
            tenant_id, transaction_id, method, amount, reference, tendered, change_amount
          ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            tenantId, transaction.id, payment.method, payment.amount,
            payment.reference,
            payment.method === 'cash' ? payment.amount : null,
            payment.method === 'cash' ? Math.max(0, payment.amount - parseInt(order.grand_total)) : 0,
          ],
        );
      }

      // 7. Update session cash tracking
      const cashAmount = dto.payments
        .filter(p => p.method === 'cash')
        .reduce((sum, p) => sum + p.amount, 0);

      if (cashAmount > 0) {
        await client.query(
          `UPDATE pos.sessions SET current_cash = current_cash + $3, updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2`,
          [dto.session_id, tenantId, cashAmount],
        );
      }

      this.logger.log(`POS sale: ${receiptNumber} total=${order.grand_total} session=${session.session_number}`);

      return {
        transaction_id: transaction.id,
        receipt_number: receiptNumber,
        order_number: order.order_number,
        order_id: order.id,
        grand_total: parseInt(order.grand_total),
        items: order.items,
        payments: dto.payments,
        change: dto.payments[0].method === 'cash' 
          ? Math.max(0, dto.payments[0].amount - parseInt(order.grand_total)) 
          : 0,
      };
    });
  }

  // ═══════════════════════════════════════════════════════
  // HELD ORDERS
  // ═══════════════════════════════════════════════════════

  async holdOrder(tenantId: string, userId: string, dto: THoldOrder) {
    const holdNumber = `HOLD-${Date.now().toString(36).toUpperCase()}`;

    const result = await this.db.query(
      `INSERT INTO pos.held_orders (
        tenant_id, session_id, hold_number, customer_name,
        items, notes, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'held', $7)
      RETURNING *`,
      [
        tenantId, dto.session_id, holdNumber, dto.customer_name,
        JSON.stringify(dto.items), dto.notes, userId,
      ],
    );

    this.logger.log(`Order held: ${holdNumber}`);
    return result.rows[0];
  }

  async listHeldOrders(tenantId: string, sessionId: string) {
    const result = await this.db.query(
      `SELECT ho.*, u.display_name as created_by_name
       FROM pos.held_orders ho
       LEFT JOIN iam.users u ON u.id = ho.created_by
       WHERE ho.session_id = $1 AND ho.tenant_id = $2 AND ho.status = 'held'
       ORDER BY ho.created_at DESC`,
      [sessionId, tenantId],
    );
    return result.rows.map((row: any) => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    }));
  }

  async retrieveHeldOrder(tenantId: string, userId: string, heldOrderId: string) {
    const order = await this.db.queryOne(
      `SELECT * FROM pos.held_orders WHERE id = $1 AND tenant_id = $2 AND status = 'held'`,
      [heldOrderId, tenantId],
    );
    if (!order) throw new NotFoundException('Held order not found');

    // Mark as retrieved
    await this.db.query(
      `UPDATE pos.held_orders SET status = 'retrieved', updated_at = NOW() WHERE id = $1`,
      [heldOrderId],
    );

    return {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    };
  }

  async voidHeldOrder(tenantId: string, userId: string, heldOrderId: string) {
    await this.db.query(
      `UPDATE pos.held_orders SET status = 'voided', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [heldOrderId, tenantId],
    );
    return { voided: true };
  }

  // ═══════════════════════════════════════════════════════
  // CASH MOVEMENTS
  // ═══════════════════════════════════════════════════════

  async recordCashMovement(tenantId: string, userId: string, dto: TCashMovement) {
    const session = await this.db.queryOne(
      `SELECT * FROM pos.sessions WHERE id = $1 AND tenant_id = $2 AND status = 'open'`,
      [dto.session_id, tenantId],
    );
    if (!session) throw new NotFoundException('Active session not found');

    const result = await this.db.query(
      `INSERT INTO pos.cash_movements (
        tenant_id, session_id, type, amount, reason, reference, performed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, dto.session_id, dto.type, dto.amount, dto.reason, dto.reference, userId],
    );

    // Update session cash
    const cashDelta = dto.type === 'cash_in' ? dto.amount : -dto.amount;
    await this.db.query(
      `UPDATE pos.sessions SET current_cash = current_cash + $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [dto.session_id, tenantId, cashDelta],
    );

    await this.audit.log({
      tenantId, userId,
      action: `pos.${dto.type}`,
      entity_type: 'cash_movement',
      entity_id: result.rows[0].id,
      new_values: { type: dto.type, amount: dto.amount, reason: dto.reason },
    });

    return result.rows[0];
  }

  // ═══════════════════════════════════════════════════════
  // DAILY SUMMARY
  // ═══════════════════════════════════════════════════════

  async getDailySummary(tenantId: string, registerId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const summary = await this.db.queryOne(
      `SELECT * FROM pos.daily_summaries 
       WHERE register_id = $1 AND tenant_id = $2 AND summary_date = $3`,
      [registerId, tenantId, targetDate],
    );

    if (!summary) {
      return {
        date: targetDate,
        total_sales: 0,
        total_transactions: 0,
        cash_sales: 0,
        card_sales: 0,
        mobile_sales: 0,
      };
    }

    return summary;
  }

  async getSalesSummary(tenantId: string, locationId: string, dateFrom: string, dateTo: string) {
    const result = await this.db.query(
      `SELECT 
        summary_date,
        SUM(total_sales) as total_sales,
        SUM(total_transactions) as total_transactions,
        SUM(cash_sales) as cash_sales,
        SUM(card_sales) as card_sales,
        SUM(mobile_sales) as mobile_sales
       FROM pos.daily_summaries ds
       INNER JOIN pos.registers r ON r.id = ds.register_id
       WHERE ds.tenant_id = $1 AND r.location_id = $2 
         AND ds.summary_date BETWEEN $3 AND $4
       GROUP BY summary_date
       ORDER BY summary_date DESC`,
      [tenantId, locationId, dateFrom, dateTo],
    );

    return result.rows;
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  private async generateSessionNumber(tenantId: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const result = await this.db.queryOne(
      `SELECT COUNT(*) + 1 as next FROM pos.sessions WHERE tenant_id = $1 AND opened_at::date = CURRENT_DATE`,
      [tenantId],
    );
    return `S-${today}-${String(result.next).padStart(3, '0')}`;
  }

  private async generateReceiptNumber(client: any, tenantId: string, registerId: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const result = await client.query(
      `SELECT COUNT(*) + 1 as next FROM pos.transactions t
       INNER JOIN pos.sessions s ON s.id = t.session_id
       WHERE t.tenant_id = $1 AND s.register_id = $2 AND t.created_at::date = CURRENT_DATE`,
      [tenantId, registerId],
    );
    return `RCT-${today}-${String(result.rows[0].next).padStart(5, '0')}`;
  }
}
