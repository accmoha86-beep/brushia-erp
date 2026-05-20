// ═══════════════════════════════════════════════════════════════════════════
// Brushia Test Fixtures — Realistic Egyptian beauty company data
// ═══════════════════════════════════════════════════════════════════════════
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

export interface TestFixtures {
  tenantId: string;
  locationId: string;
  cashierId: string;
  registerId: string;
  sessionId: string;
  customerId: string;
  products: TestProduct[];
  accountIds: Record<string, string>;
}

export interface TestProduct {
  id: string;
  sku: string;
  name: string;
  price: number;    // in piasters
  cost: number;     // in piasters
  stock: number;
}

export async function seedTestFixtures(pool: Pool): Promise<TestFixtures> {
  const tenantId = uuid();
  const locationId = uuid();
  const cashierId = uuid();
  const registerId = uuid();
  const sessionId = uuid();
  const customerId = uuid();

  // ── Tenant ──────────────────────────────────────────────────────────
  await pool.query(
    `INSERT INTO iam.tenants (id, name, slug, status, settings)
     VALUES ($1, 'Brushia Test', 'brushia-test', 'active', '{"currency":"EGP","vat_rate":0.14}')`,
    [tenantId]
  );

  // ── User (Cashier) ─────────────────────────────────────────────────
  await pool.query(
    `INSERT INTO iam.users (id, tenant_id, email, password_hash, first_name, last_name, status)
     VALUES ($1, $2, 'cashier@brushia.test', '$2b$10$test', 'Sara', 'Ahmed', 'active')`,
    [cashierId, tenantId]
  );

  // ── Location (Main Store) ──────────────────────────────────────────
  await pool.query(
    `INSERT INTO settings.locations (id, tenant_id, name, type, address, is_active)
     VALUES ($1, $2, 'Brushia Nasr City', 'store', 'Nasr City, Cairo, Egypt', true)`,
    [locationId, tenantId]
  );

  // ── Customer ────────────────────────────────────────────────────────
  await pool.query(
    `INSERT INTO crm.customers
     (id, tenant_id, first_name, last_name, email, phone, customer_type,
      total_orders, total_spent, loyalty_points)
     VALUES ($1, $2, 'Nour', 'Hassan', 'nour@test.com', '+201234567890', 'retail',
             0, 0, 0)`,
    [customerId, tenantId]
  );

  // ── Category ────────────────────────────────────────────────────────
  const categoryId = uuid();
  await pool.query(
    `INSERT INTO catalog.categories (id, tenant_id, name, slug, sort_order)
     VALUES ($1, $2, 'Makeup', 'makeup', 1)`,
    [categoryId, tenantId]
  );

  // ── Products ────────────────────────────────────────────────────────
  const products: TestProduct[] = [
    { id: uuid(), sku: 'BRSH-FND-001', name: 'Brushia Full Coverage Foundation', price: 45000, cost: 18000, stock: 50 },
    { id: uuid(), sku: 'BRSH-LIP-001', name: 'Brushia Matte Lipstick - Ruby Red', price: 25000, cost: 8000, stock: 100 },
    { id: uuid(), sku: 'BRSH-LSH-001', name: 'Brushia Volume Lashes - Dramatic', price: 15000, cost: 4500, stock: 200 },
    { id: uuid(), sku: 'BRSH-CON-001', name: 'Brushia HD Concealer - Medium', price: 20000, cost: 7000, stock: 75 },
    { id: uuid(), sku: 'BRSH-SET-001', name: 'Brushia Pro Brush Set (12pc)', price: 85000, cost: 32000, stock: 30 },
  ];

  for (const p of products) {
    await pool.query(
      `INSERT INTO catalog.products
       (id, tenant_id, category_id, sku, name, type, unit_price, cost_price, status)
       VALUES ($1, $2, $3, $4, $5, 'simple', $6, $7, 'active')`,
      [p.id, tenantId, categoryId, p.sku, p.name, p.price, p.cost]
    );

    // Seed stock level
    await pool.query(
      `INSERT INTO inventory.stock_levels
       (id, tenant_id, product_id, location_id, available_quantity, committed_quantity,
        weighted_avg_cost, last_counted_at)
       VALUES ($1, $2, $3, $4, $5, 0, $6, NOW())`,
      [uuid(), tenantId, p.id, locationId, p.stock, p.cost]
    );
  }

  // ── Chart of Accounts (minimum for journal entries) ─────────────────
  const accountIds: Record<string, string> = {};
  const accounts = [
    { code: '1101', name: 'Cash Box',                type: 'asset' },
    { code: '1102', name: 'Card Receivable',         type: 'asset' },
    { code: '1103', name: 'Vodafone Cash',           type: 'asset' },
    { code: '1104', name: 'InstaPay',                type: 'asset' },
    { code: '1301', name: 'Inventory Asset',         type: 'asset' },
    { code: '2201', name: 'Store Credit Liability',  type: 'liability' },
    { code: '2301', name: 'VAT Output Payable',      type: 'liability' },
    { code: '4101', name: 'Sales Revenue',           type: 'revenue' },
    { code: '4102', name: 'Sales Discounts',         type: 'contra_revenue' },
    { code: '5101', name: 'Cost of Goods Sold',      type: 'expense' },
  ];

  for (const acc of accounts) {
    const id = uuid();
    accountIds[acc.code] = id;
    await pool.query(
      `INSERT INTO accounting.chart_of_accounts
       (id, tenant_id, account_code, account_name, account_type, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [id, tenantId, acc.code, acc.name, acc.type]
    );
  }

  // ── POS Register + Session ──────────────────────────────────────────
  await pool.query(
    `INSERT INTO pos.registers (id, tenant_id, location_id, name, status)
     VALUES ($1, $2, $3, 'Register 1', 'active')`,
    [registerId, tenantId, locationId]
  );

  await pool.query(
    `INSERT INTO pos.register_sessions
     (id, tenant_id, register_id, user_id, opening_balance, status, opened_at)
     VALUES ($1, $2, $3, $4, 500000, 'open', NOW())`,
    [sessionId, tenantId, registerId, cashierId]
  );

  return { tenantId, locationId, cashierId, registerId, sessionId, customerId, products, accountIds };
}
