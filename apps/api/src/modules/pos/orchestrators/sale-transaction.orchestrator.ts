// ═══════════════════════════════════════════════════════════════════════════
// Brushia ERP — Sale Transaction Orchestrator
// ═══════════════════════════════════════════════════════════════════════════
// This is the CRITICAL path. Every POS sale flows through here.
// One database transaction. All or nothing. No partial state.
//
// Flow:
//   1. Validate inputs (Zod)
//   2. BEGIN TRANSACTION
//   3. Check idempotency key (skip if duplicate)
//   4. Reserve inventory (advisory locks per SKU)
//   5. Create sales order + line items
//   6. Record payment(s) — supports split payment
//   7. Deduct reserved stock → committed movements
//   8. Post journal entries (Revenue + COGS)
//   9. Update customer stats + loyalty points
//  10. Write audit log entry
//  11. Write outbox event (for async: receipt email, analytics, etc.)
//  12. COMMIT
//  13. Return receipt data
// ═══════════════════════════════════════════════════════════════════════════
import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { InjectPool } from '../../database/database.providers';
import { z } from 'zod';

// ─── DTOs ────────────────────────────────────────────────────────────────────

/** All monetary values in minor units (piasters). 1 EGP = 100 piasters */
const SaleLineItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  /** Unit price in piasters (before discount) */
  unitPrice: z.number().int().nonnegative(),
  /** Discount per unit in piasters */
  discountPerUnit: z.number().int().nonnegative().default(0),
  /** Cost per unit in piasters (weighted average) for COGS */
  costPerUnit: z.number().int().nonnegative(),
});

const PaymentSchema = z.object({
  method: z.enum(['cash', 'card', 'vodafone_cash', 'instapay', 'store_credit']),
  /** Amount in piasters */
  amount: z.number().int().positive(),
  reference: z.string().optional(),
});

export const ProcessSaleSchema = z.object({
  /** Idempotency key — prevents double-processing */
  idempotencyKey: z.string().uuid(),
  tenantId: z.string().uuid(),
  registerId: z.string().uuid(),
  sessionId: z.string().uuid(),
  cashierId: z.string().uuid(),
  cashierName: z.string().min(1),
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  locationId: z.string().uuid(),
  items: z.array(SaleLineItemSchema).min(1),
  payments: z.array(PaymentSchema).min(1),
  /** Optional notes */
  notes: z.string().optional(),
  /** Applied promotion IDs */
  promotionIds: z.array(z.string().uuid()).default([]),
});

export type ProcessSaleInput = z.infer<typeof ProcessSaleSchema>;
export type SaleLineItem = z.infer<typeof SaleLineItemSchema>;
export type Payment = z.infer<typeof PaymentSchema>;

// ─── Result Types ────────────────────────────────────────────────────────────

export interface SaleReceipt {
  orderId: string;
  receiptNumber: string;
  timestamp: string;
  items: ReceiptLineItem[];
  subtotal: number;
  totalDiscount: number;
  vatAmount: number;
  grandTotal: number;
  payments: PaymentRecord[];
  changeAmount: number;
  loyaltyPointsEarned: number;
  cashierName: string;
  customerName?: string;
}

interface ReceiptLineItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

interface PaymentRecord {
  method: string;
  amount: number;
  reference?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VAT_RATE = 0.14; // Egypt 14% VAT
const LOYALTY_POINTS_PER_EGP = 1; // 1 point per 1 EGP spent
const RECEIPT_PREFIX = 'RCP';

// Chart of Accounts codes (from Bible v3)
const ACCOUNTS = {
  CASH: '1101',
  CARD_RECEIVABLE: '1102',
  VODAFONE_CASH: '1103',
  INSTAPAY: '1104',
  INVENTORY_ASSET: '1301',
  SALES_REVENUE: '4101',
  SALES_DISCOUNTS: '4102',
  VAT_OUTPUT: '2301',
  COGS: '5101',
  STORE_CREDIT_LIABILITY: '2201',
};

@Injectable()
export class SaleTransactionOrchestrator {
  private readonly logger = new Logger(SaleTransactionOrchestrator.name);

  constructor(@InjectPool() private readonly pool: Pool) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // THE CRITICAL METHOD — Everything happens here, in one transaction
  // ═══════════════════════════════════════════════════════════════════════════
  async processSale(input: ProcessSaleInput): Promise<SaleReceipt> {
    // Step 0: Validate input
    const validated = ProcessSaleSchema.parse(input);
    this.logger.log(`Processing sale: ${validated.idempotencyKey} | ${validated.items.length} items`);

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Set tenant context for RLS
      await client.query(`SET LOCAL app.tenant_id = '${validated.tenantId}'`);
      await client.query(`SET LOCAL app.user_id = '${validated.cashierId}'`);

      // ─── Step 1: Check Idempotency ──────────────────────────────────────
      const existing = await this.checkIdempotency(client, validated.idempotencyKey);
      if (existing) {
        await client.query('COMMIT');
        this.logger.warn(`Duplicate sale detected: ${validated.idempotencyKey}`);
        return existing as SaleReceipt;
      }

      // ─── Step 2: Calculate totals ───────────────────────────────────────
      const calc = this.calculateTotals(validated.items);

      // ─── Step 3: Validate payment covers total ──────────────────────────
      const totalPaid = validated.payments.reduce((s, p) => s + p.amount, 0);
      if (totalPaid < calc.grandTotal) {
        throw new BadRequestException(
          `Payment insufficient: paid ${totalPaid} < total ${calc.grandTotal} (amounts in piasters)`
        );
      }
      const changeAmount = totalPaid - calc.grandTotal;

      // ─── Step 4: Reserve + Deduct Inventory (with advisory locks) ──────
      await this.deductInventory(client, validated);

      // ─── Step 5: Create Sales Order ─────────────────────────────────────
      const { orderId, receiptNumber } = await this.createSalesOrder(
        client, validated, calc
      );

      // ─── Step 6: Create Line Items ──────────────────────────────────────
      await this.createLineItems(client, orderId, validated.items, validated.tenantId);

      // ─── Step 7: Record Payments ────────────────────────────────────────
      const paymentRecords = await this.recordPayments(
        client, orderId, validated.payments, changeAmount, validated.tenantId
      );

      // ─── Step 8: Post Journal Entries ───────────────────────────────────
      await this.postJournalEntries(
        client, orderId, receiptNumber, validated, calc, paymentRecords
      );

      // ─── Step 9: Update Customer Stats + Loyalty ────────────────────────
      let loyaltyPointsEarned = 0;
      if (validated.customerId) {
        loyaltyPointsEarned = await this.updateCustomerAndLoyalty(
          client, validated.customerId, calc.grandTotal, orderId, validated.tenantId
        );
      }

      // ─── Step 10: Write Audit Log ───────────────────────────────────────
      await this.writeAuditLog(client, validated, orderId, calc.grandTotal);

      // ─── Step 11: Write Outbox Event ────────────────────────────────────
      await this.writeOutboxEvent(client, orderId, validated, calc);

      // ─── Step 12: Record Idempotency ────────────────────────────────────
      const receipt: SaleReceipt = {
        orderId,
        receiptNumber,
        timestamp: new Date().toISOString(),
        items: validated.items.map(item => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discountPerUnit * item.quantity,
          lineTotal: (item.unitPrice - item.discountPerUnit) * item.quantity,
        })),
        subtotal: calc.subtotalBeforeVat,
        totalDiscount: calc.totalDiscount,
        vatAmount: calc.vatAmount,
        grandTotal: calc.grandTotal,
        payments: paymentRecords,
        changeAmount,
        loyaltyPointsEarned,
        cashierName: validated.cashierName,
        customerName: validated.customerName,
      };

      await this.recordIdempotency(client, validated.idempotencyKey, validated.tenantId, receipt);

      // ─── Step 13: COMMIT — all or nothing ───────────────────────────────
      await client.query('COMMIT');

      this.logger.log(
        `✅ Sale committed: ${receiptNumber} | ` +
        `${calc.grandTotal} piasters | ${validated.items.length} items | ` +
        `${validated.payments.length} payments`
      );

      return receipt;

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`❌ Sale rolled back: ${validated.idempotencyKey}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE — Each step isolated for clarity and testability
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Idempotency ────────────────────────────────────────────────────────
  private async checkIdempotency(client: PoolClient, key: string): Promise<unknown | null> {
    const result = await client.query(
      `SELECT response_body FROM public.idempotency_keys
       WHERE idempotency_key = $1 AND expires_at > NOW()`,
      [key]
    );
    return result.rows[0]?.response_body ?? null;
  }

  private async recordIdempotency(
    client: PoolClient, key: string, tenantId: string, response: SaleReceipt
  ): Promise<void> {
    await client.query(
      `INSERT INTO public.idempotency_keys (idempotency_key, tenant_id, operation, response_status, response_body, expires_at)
       VALUES ($1, $2, 'pos.sale', 200, $3, NOW() + INTERVAL '24 hours')
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [key, tenantId, JSON.stringify(response)]
    );
  }

  // ─── Calculations ───────────────────────────────────────────────────────
  private calculateTotals(items: SaleLineItem[]) {
    let subtotalBeforeDiscount = 0;
    let totalDiscount = 0;
    let totalCost = 0;

    for (const item of items) {
      const lineGross = item.unitPrice * item.quantity;
      const lineDiscount = item.discountPerUnit * item.quantity;
      subtotalBeforeDiscount += lineGross;
      totalDiscount += lineDiscount;
      totalCost += item.costPerUnit * item.quantity;
    }

    const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscount;

    // VAT is INCLUSIVE in Egypt retail (price shown = price paid)
    // So: grandTotal = subtotalAfterDiscount
    //     vatAmount = grandTotal - (grandTotal / 1.14)
    //     subtotalBeforeVat = grandTotal - vatAmount
    const grandTotal = subtotalAfterDiscount;
    const vatAmount = Math.round(grandTotal - (grandTotal / (1 + VAT_RATE)));
    const subtotalBeforeVat = grandTotal - vatAmount;

    return {
      subtotalBeforeDiscount,
      totalDiscount,
      subtotalBeforeVat,
      vatAmount,
      grandTotal,
      totalCost,
      grossProfit: subtotalBeforeVat - totalCost,
    };
  }

  // ─── Inventory Deduction (Advisory Locks) ───────────────────────────────
  private async deductInventory(client: PoolClient, input: ProcessSaleInput): Promise<void> {
    // Sort by productId to prevent deadlocks (consistent lock ordering)
    const sorted = [...input.items].sort((a, b) => a.productId.localeCompare(b.productId));

    for (const item of sorted) {
      const productIdForLock = item.variantId ?? item.productId;

      // Acquire advisory lock (hash of productId + locationId)
      const lockKey = this.hashForAdvisoryLock(productIdForLock, input.locationId);
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

      // Check available stock
      const stockResult = await client.query(
        `SELECT available_quantity FROM inventory.stock_levels
         WHERE product_id = $1 AND location_id = $2 AND tenant_id = $3
         FOR UPDATE`,
        [productIdForLock, input.locationId, input.tenantId]
      );

      const available = stockResult.rows[0]?.available_quantity ?? 0;
      if (available < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.sku}: available=${available}, requested=${item.quantity}`
        );
      }

      // Deduct stock
      await client.query(
        `UPDATE inventory.stock_levels
         SET available_quantity = available_quantity - $1,
             committed_quantity = committed_quantity + $1,
             updated_at = NOW()
         WHERE product_id = $2 AND location_id = $3 AND tenant_id = $4`,
        [item.quantity, productIdForLock, input.locationId, input.tenantId]
      );

      // Record immutable stock movement
      await client.query(
        `INSERT INTO inventory.stock_movements
         (id, tenant_id, product_id, location_id, movement_type, quantity, unit_cost,
          reference_type, reference_id, performed_by, notes)
         VALUES (gen_random_uuid(), $1, $2, $3, 'sale', $4, $5, 'sales_order', $6, $7, $8)`,
        [
          input.tenantId, productIdForLock, input.locationId,
          -item.quantity, // Negative = outflow
          item.costPerUnit,
          'pending', // Will be updated with orderId
          input.cashierId,
          `POS sale: ${item.quantity}x ${item.sku}`,
        ]
      );
    }
  }

  // ─── Sales Order Creation ───────────────────────────────────────────────
  private async createSalesOrder(
    client: PoolClient,
    input: ProcessSaleInput,
    calc: ReturnType<typeof this.calculateTotals>
  ): Promise<{ orderId: string; receiptNumber: string }> {
    // Generate receipt number: RCP-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seqResult = await client.query(
      `SELECT COUNT(*) + 1 as seq FROM sales.sales_orders
       WHERE tenant_id = $1 AND source = 'pos'
       AND created_at::date = CURRENT_DATE`,
      [input.tenantId]
    );
    const seq = String(seqResult.rows[0].seq).padStart(4, '0');
    const receiptNumber = `${RECEIPT_PREFIX}-${today}-${seq}`;

    const result = await client.query(
      `INSERT INTO sales.sales_orders
       (id, tenant_id, order_number, source, status, customer_id, location_id,
        subtotal, discount_total, vat_amount, grand_total, cost_total,
        payment_status, notes, created_by)
       VALUES (gen_random_uuid(), $1, $2, 'pos', 'completed', $3, $4,
               $5, $6, $7, $8, $9, 'paid', $10, $11)
       RETURNING id`,
      [
        input.tenantId, receiptNumber, input.customerId ?? null, input.locationId,
        calc.subtotalBeforeVat, calc.totalDiscount, calc.vatAmount,
        calc.grandTotal, calc.totalCost, input.notes ?? null, input.cashierId,
      ]
    );

    const orderId = result.rows[0].id;

    // Update stock movements with the real order ID
    await client.query(
      `UPDATE inventory.stock_movements
       SET reference_id = $1
       WHERE tenant_id = $2 AND reference_id = 'pending' AND performed_by = $3
       AND created_at > NOW() - INTERVAL '1 minute'`,
      [orderId, input.tenantId, input.cashierId]
    );

    return { orderId, receiptNumber };
  }

  // ─── Line Items ─────────────────────────────────────────────────────────
  private async createLineItems(
    client: PoolClient, orderId: string, items: SaleLineItem[], tenantId: string
  ): Promise<void> {
    for (const item of items) {
      const lineTotal = (item.unitPrice - item.discountPerUnit) * item.quantity;
      await client.query(
        `INSERT INTO sales.order_items
         (id, tenant_id, order_id, product_id, variant_id, sku, product_name,
          quantity, unit_price, discount_per_unit, line_total, cost_per_unit)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          tenantId, orderId, item.productId, item.variantId ?? null,
          item.sku, item.name, item.quantity, item.unitPrice,
          item.discountPerUnit, lineTotal, item.costPerUnit,
        ]
      );
    }
  }

  // ─── Payments ───────────────────────────────────────────────────────────
  private async recordPayments(
    client: PoolClient, orderId: string, payments: Payment[],
    changeAmount: number, tenantId: string
  ): Promise<PaymentRecord[]> {
    const records: PaymentRecord[] = [];

    for (const payment of payments) {
      await client.query(
        `INSERT INTO sales.payments
         (id, tenant_id, order_id, method, amount, reference, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'completed')`,
        [tenantId, orderId, payment.method, payment.amount, payment.reference ?? null]
      );
      records.push({
        method: payment.method,
        amount: payment.amount,
        reference: payment.reference,
      });
    }

    // If change was given on cash, record it
    if (changeAmount > 0) {
      await client.query(
        `INSERT INTO sales.payments
         (id, tenant_id, order_id, method, amount, reference, status)
         VALUES (gen_random_uuid(), $1, $2, 'cash', $3, 'change_given', 'completed')`,
        [tenantId, orderId, -changeAmount]
      );
    }

    return records;
  }

  // ─── Journal Entries (Double-Entry Accounting) ──────────────────────────
  private async postJournalEntries(
    client: PoolClient, orderId: string, receiptNumber: string,
    input: ProcessSaleInput,
    calc: ReturnType<typeof this.calculateTotals>,
    payments: PaymentRecord[]
  ): Promise<void> {
    // Helper to resolve account ID from code
    const getAccountId = async (code: string): Promise<string> => {
      const r = await client.query(
        `SELECT id FROM accounting.chart_of_accounts
         WHERE account_code = $1 AND tenant_id = $2`,
        [code, input.tenantId]
      );
      if (!r.rows[0]) throw new Error(`Account not found: ${code}`);
      return r.rows[0].id;
    };

    // ── Journal Entry 1: Revenue Recognition ──────────────────────────
    const revenueJeResult = await client.query(
      `INSERT INTO accounting.journal_entries
       (id, tenant_id, entry_number, entry_date, description, reference_type, reference_id,
        status, created_by)
       VALUES (gen_random_uuid(), $1, $2, CURRENT_DATE, $3, 'sales_order', $4,
               'posted', $5)
       RETURNING id`,
      [
        input.tenantId, `JE-${receiptNumber}`,
        `POS Sale: ${receiptNumber}`, orderId, input.cashierId,
      ]
    );
    const revenueJeId = revenueJeResult.rows[0].id;

    // DEBIT: Payment method account(s)
    for (const payment of payments) {
      if (payment.amount <= 0) continue;
      const accountCode = this.paymentMethodToAccount(payment.method);
      const accountId = await getAccountId(accountCode);
      await client.query(
        `INSERT INTO accounting.journal_entry_lines
         (id, tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 0)`,
        [input.tenantId, revenueJeId, accountId, `Payment: ${payment.method}`, payment.amount]
      );
    }

    // CREDIT: Sales Revenue (net of VAT)
    const revenueAccountId = await getAccountId(ACCOUNTS.SALES_REVENUE);
    await client.query(
      `INSERT INTO accounting.journal_entry_lines
       (id, tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount)
       VALUES (gen_random_uuid(), $1, $2, $3, 'Sales Revenue', 0, $4)`,
      [input.tenantId, revenueJeId, revenueAccountId, calc.subtotalBeforeVat]
    );

    // CREDIT: VAT Output
    if (calc.vatAmount > 0) {
      const vatAccountId = await getAccountId(ACCOUNTS.VAT_OUTPUT);
      await client.query(
        `INSERT INTO accounting.journal_entry_lines
         (id, tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount)
         VALUES (gen_random_uuid(), $1, $2, $3, 'VAT Output 14%', 0, $4)`,
        [input.tenantId, revenueJeId, vatAccountId, calc.vatAmount]
      );
    }

    // CREDIT: Sales Discounts (contra-revenue)
    if (calc.totalDiscount > 0) {
      const discountAccountId = await getAccountId(ACCOUNTS.SALES_DISCOUNTS);
      await client.query(
        `INSERT INTO accounting.journal_entry_lines
         (id, tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount)
         VALUES (gen_random_uuid(), $1, $2, $3, 'Sales Discounts', $4, 0)`,
        [input.tenantId, revenueJeId, discountAccountId, calc.totalDiscount]
      );
    }

    // ── Journal Entry 2: COGS Recognition ─────────────────────────────
    if (calc.totalCost > 0) {
      const cogsJeResult = await client.query(
        `INSERT INTO accounting.journal_entries
         (id, tenant_id, entry_number, entry_date, description, reference_type, reference_id,
          status, created_by)
         VALUES (gen_random_uuid(), $1, $2, CURRENT_DATE, $3, 'sales_order', $4,
                 'posted', $5)
         RETURNING id`,
        [
          input.tenantId, `JE-COGS-${receiptNumber}`,
          `COGS: ${receiptNumber}`, orderId, input.cashierId,
        ]
      );
      const cogsJeId = cogsJeResult.rows[0].id;

      // DEBIT: COGS
      const cogsAccountId = await getAccountId(ACCOUNTS.COGS);
      await client.query(
        `INSERT INTO accounting.journal_entry_lines
         (id, tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount)
         VALUES (gen_random_uuid(), $1, $2, $3, 'Cost of Goods Sold', $4, 0)`,
        [input.tenantId, cogsJeId, cogsAccountId, calc.totalCost]
      );

      // CREDIT: Inventory Asset
      const invAccountId = await getAccountId(ACCOUNTS.INVENTORY_ASSET);
      await client.query(
        `INSERT INTO accounting.journal_entry_lines
         (id, tenant_id, journal_entry_id, account_id, description, debit_amount, credit_amount)
         VALUES (gen_random_uuid(), $1, $2, $3, 'Inventory Reduction', 0, $4)`,
        [input.tenantId, cogsJeId, invAccountId, calc.totalCost]
      );
    }
  }

  // ─── Customer + Loyalty ─────────────────────────────────────────────────
  private async updateCustomerAndLoyalty(
    client: PoolClient, customerId: string, grandTotal: number,
    orderId: string, tenantId: string
  ): Promise<number> {
    // Update customer stats
    await client.query(
      `UPDATE sales.customers
       SET total_orders = total_orders + 1,
           total_spent = total_spent + $1,
           last_order_date = NOW(),
           updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [grandTotal, customerId, tenantId]
    );

    // Calculate loyalty points (1 point per EGP, grandTotal is in piasters)
    const pointsEarned = Math.floor(grandTotal / 100) * LOYALTY_POINTS_PER_EGP;

    if (pointsEarned > 0) {
      // Add loyalty points
      await client.query(
        `INSERT INTO crm.loyalty_transactions
         (id, tenant_id, customer_id, points, type, reference_type, reference_id, description)
         VALUES (gen_random_uuid(), $1, $2, $3, 'earn', 'sales_order', $4, $5)`,
        [tenantId, customerId, pointsEarned, orderId, `Earned from sale`]
      );

      // Update customer points balance
      await client.query(
        `UPDATE sales.customers
         SET loyalty_points = loyalty_points + $1
         WHERE id = $2 AND tenant_id = $3`,
        [pointsEarned, customerId, tenantId]
      );
    }

    return pointsEarned;
  }

  // ─── Audit Log ──────────────────────────────────────────────────────────
  private async writeAuditLog(
    client: PoolClient, input: ProcessSaleInput,
    orderId: string, grandTotal: number
  ): Promise<void> {
    await client.query(
      `INSERT INTO public.audit_log
       (id, tenant_id, user_id, action, entity_type, entity_id, new_values, ip_address)
       VALUES (gen_random_uuid(), $1, $2, 'pos.sale.completed', 'sales_order', $3, $4, '127.0.0.1')`,
      [
        input.tenantId, input.cashierId, orderId,
        JSON.stringify({
          receipt: `POS-${orderId.slice(0, 8)}`,
          items: input.items.length,
          grandTotal,
          payments: input.payments.map(p => ({ method: p.method, amount: p.amount })),
        }),
      ]
    );
  }

  // ─── Outbox Event ───────────────────────────────────────────────────────
  private async writeOutboxEvent(
    client: PoolClient, orderId: string,
    input: ProcessSaleInput,
    calc: ReturnType<typeof this.calculateTotals>
  ): Promise<void> {
    await client.query(
      `INSERT INTO public.outbox
       (id, tenant_id, aggregate_type, aggregate_id, event_type, payload)
       VALUES (gen_random_uuid(), $1, 'sales_order', $2, 'SaleCompleted', $3)`,
      [
        input.tenantId, orderId,
        JSON.stringify({
          orderId,
          registerId: input.registerId,
          cashierId: input.cashierId,
          customerId: input.customerId,
          locationId: input.locationId,
          itemCount: input.items.length,
          grandTotal: calc.grandTotal,
          vatAmount: calc.vatAmount,
          grossProfit: calc.grossProfit,
          payments: input.payments.map(p => ({ method: p.method, amount: p.amount })),
          timestamp: new Date().toISOString(),
        }),
      ]
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────
  private paymentMethodToAccount(method: string): string {
    const map: Record<string, string> = {
      cash: ACCOUNTS.CASH,
      card: ACCOUNTS.CARD_RECEIVABLE,
      vodafone_cash: ACCOUNTS.VODAFONE_CASH,
      instapay: ACCOUNTS.INSTAPAY,
      store_credit: ACCOUNTS.STORE_CREDIT_LIABILITY,
    };
    return map[method] ?? ACCOUNTS.CASH;
  }

  private hashForAdvisoryLock(productId: string, locationId: string): number {
    // Simple hash: combine first 8 chars of each UUID as integers
    const a = parseInt(productId.replace(/-/g, '').slice(0, 8), 16);
    const b = parseInt(locationId.replace(/-/g, '').slice(0, 8), 16);
    return (a ^ b) & 0x7fffffff; // Ensure positive 32-bit int
  }
}
