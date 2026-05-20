-- Seed 0001: Brushia Default Data
-- Run after all migrations to populate a new tenant with defaults.
-- Replace $TENANT_ID with actual tenant UUID.

-- This seed creates:
-- 1. Company settings
-- 2. Default warehouse
-- 3. Default branch
-- 4. Chart of accounts (Egyptian standard)
-- 5. Tax rates
-- 6. Bank accounts
-- 7. Fiscal year 2024-2025
-- 8. Default POS register
-- 9. Loyalty program
-- 10. Categories & sample products

-- ═══════════════════════════════════════════════════════════
-- Company Settings
-- ═══════════════════════════════════════════════════════════
INSERT INTO settings.company_settings (tenant_id, company_name, company_name_ar, currency, currency_symbol, default_tax_rate, prices_include_tax)
VALUES ('$TENANT_ID', 'Brushia', 'بروشيا', 'EGP', 'ج.م', 14.00, true);

-- ═══════════════════════════════════════════════════════════
-- Default Warehouse + Branch
-- ═══════════════════════════════════════════════════════════
INSERT INTO inventory.warehouses (id, tenant_id, code, name, name_ar, warehouse_type, city, governorate, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', '$TENANT_ID', 'WH-MAIN', 'Main Warehouse', 'المستودع الرئيسي', 'standard', 'Cairo', 'Cairo', true);

INSERT INTO settings.branches (id, tenant_id, branch_code, name, city, governorate, warehouse_id, is_main)
VALUES ('00000000-0000-0000-0000-000000000002', '$TENANT_ID', 'BR-MAIN', 'Main Branch', 'Cairo', 'Cairo', '00000000-0000-0000-0000-000000000001', true);

-- ═══════════════════════════════════════════════════════════
-- Tax Rates
-- ═══════════════════════════════════════════════════════════
INSERT INTO accounting.tax_rates (tenant_id, name, name_ar, rate, tax_type, is_default) VALUES
('$TENANT_ID', 'VAT 14%', 'ضريبة القيمة المضافة ١٤٪', 14.00, 'vat', true),
('$TENANT_ID', 'VAT Exempt', 'معفى من الضريبة', 0.00, 'exempt', false);

-- ═══════════════════════════════════════════════════════════
-- Egyptian Chart of Accounts (52 accounts)
-- ═══════════════════════════════════════════════════════════
-- ASSETS (1000-1999)
INSERT INTO accounting.chart_of_accounts (tenant_id, account_code, name, name_ar, account_type, normal_balance, is_header, is_postable, is_system) VALUES
('$TENANT_ID', '1000', 'Assets', 'الأصول', 'asset', 'debit', true, false, true),
('$TENANT_ID', '1100', 'Current Assets', 'الأصول المتداولة', 'asset', 'debit', true, false, true),
('$TENANT_ID', '1110', 'Cash on Hand', 'النقدية بالخزينة', 'asset', 'debit', false, true, true),
('$TENANT_ID', '1120', 'Cash in Bank - CIB', 'البنك التجاري الدولي', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1121', 'Vodafone Cash', 'فودافون كاش', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1122', 'InstaPay', 'إنستاباي', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1200', 'Accounts Receivable', 'العملاء والذمم المدينة', 'asset', 'debit', false, true, true),
('$TENANT_ID', '1300', 'Inventory', 'المخزون', 'asset', 'debit', false, true, true),
('$TENANT_ID', '1310', 'Inventory - Makeup', 'مخزون - مكياج', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1320', 'Inventory - Brushes', 'مخزون - فرش', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1330', 'Inventory - In Transit', 'مخزون في الطريق', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1400', 'Prepaid Expenses', 'مصروفات مدفوعة مقدماً', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1500', 'VAT Receivable', 'ضريبة مدخلات', 'asset', 'debit', false, true, true),
-- FIXED ASSETS
('$TENANT_ID', '1600', 'Fixed Assets', 'الأصول الثابتة', 'asset', 'debit', true, false, false),
('$TENANT_ID', '1610', 'Equipment', 'معدات', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1620', 'Furniture & Fixtures', 'أثاث وتجهيزات', 'asset', 'debit', false, true, false),
('$TENANT_ID', '1690', 'Accumulated Depreciation', 'مجمع الإهلاك', 'contra_asset', 'credit', false, true, false),

-- LIABILITIES (2000-2999)
('$TENANT_ID', '2000', 'Liabilities', 'الالتزامات', 'liability', 'credit', true, false, true),
('$TENANT_ID', '2100', 'Accounts Payable', 'الموردون والذمم الدائنة', 'liability', 'credit', false, true, true),
('$TENANT_ID', '2200', 'VAT Payable', 'ضريبة مخرجات', 'liability', 'credit', false, true, true),
('$TENANT_ID', '2300', 'Accrued Expenses', 'مصروفات مستحقة', 'liability', 'credit', false, true, false),
('$TENANT_ID', '2400', 'Customer Deposits', 'أمانات العملاء', 'liability', 'credit', false, true, false),
('$TENANT_ID', '2500', 'Store Credit Liability', 'التزام رصيد المتجر', 'liability', 'credit', false, true, false),
('$TENANT_ID', '2600', 'Commissions Payable', 'عمولات مستحقة', 'liability', 'credit', false, true, false),

-- EQUITY (3000-3999)
('$TENANT_ID', '3000', 'Equity', 'حقوق الملكية', 'equity', 'credit', true, false, true),
('$TENANT_ID', '3100', 'Owner Capital', 'رأس المال', 'equity', 'credit', false, true, true),
('$TENANT_ID', '3200', 'Retained Earnings', 'أرباح مرحلة', 'equity', 'credit', false, true, true),
('$TENANT_ID', '3300', 'Owner Drawings', 'المسحوبات الشخصية', 'equity', 'debit', false, true, false),

-- REVENUE (4000-4999)
('$TENANT_ID', '4000', 'Revenue', 'الإيرادات', 'revenue', 'credit', true, false, true),
('$TENANT_ID', '4100', 'Sales Revenue', 'إيرادات المبيعات', 'revenue', 'credit', false, true, true),
('$TENANT_ID', '4110', 'POS Sales', 'مبيعات نقطة البيع', 'revenue', 'credit', false, true, false),
('$TENANT_ID', '4120', 'Online Sales', 'مبيعات إلكترونية', 'revenue', 'credit', false, true, false),
('$TENANT_ID', '4130', 'Wholesale Sales', 'مبيعات الجملة', 'revenue', 'credit', false, true, false),
('$TENANT_ID', '4140', 'Exhibition Sales', 'مبيعات المعارض', 'revenue', 'credit', false, true, false),
('$TENANT_ID', '4200', 'Shipping Revenue', 'إيرادات الشحن', 'revenue', 'credit', false, true, false),
('$TENANT_ID', '4900', 'Sales Returns', 'مردودات المبيعات', 'contra_revenue', 'debit', false, true, true),

-- COGS (5000-5999)
('$TENANT_ID', '5000', 'Cost of Goods Sold', 'تكلفة البضاعة المباعة', 'cost_of_goods_sold', 'debit', true, false, true),
('$TENANT_ID', '5100', 'COGS - Products', 'تكلفة المنتجات', 'cost_of_goods_sold', 'debit', false, true, true),
('$TENANT_ID', '5200', 'COGS - Shipping (China)', 'تكلفة الشحن من الصين', 'cost_of_goods_sold', 'debit', false, true, false),
('$TENANT_ID', '5300', 'COGS - Customs & Clearance', 'تكلفة الجمارك والتخليص', 'cost_of_goods_sold', 'debit', false, true, false),
('$TENANT_ID', '5400', 'Inventory Adjustments', 'تسويات المخزون', 'cost_of_goods_sold', 'debit', false, true, false),

-- EXPENSES (6000-6999)
('$TENANT_ID', '6000', 'Operating Expenses', 'المصروفات التشغيلية', 'expense', 'debit', true, false, true),
('$TENANT_ID', '6100', 'Rent Expense', 'إيجار', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6200', 'Salaries & Wages', 'رواتب وأجور', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6300', 'Marketing & Advertising', 'تسويق وإعلان', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6400', 'Shipping Expense (Local)', 'مصروف شحن محلي', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6500', 'Packaging Materials', 'مواد التغليف', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6600', 'Utilities', 'مرافق (كهرباء/مياه/إنترنت)', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6700', 'Software & Subscriptions', 'برمجيات واشتراكات', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6800', 'Exhibition Expenses', 'مصروفات المعارض', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6900', 'Depreciation Expense', 'مصروف الإهلاك', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6950', 'Bank Fees', 'عمولات بنكية', 'expense', 'debit', false, true, false),
('$TENANT_ID', '6990', 'Other Expenses', 'مصروفات أخرى', 'expense', 'debit', false, true, false);

-- ═══════════════════════════════════════════════════════════
-- Bank Accounts (linked to GL)
-- ═══════════════════════════════════════════════════════════
INSERT INTO accounting.bank_accounts (tenant_id, bank_name, account_name, account_type, currency, account_id) 
SELECT '$TENANT_ID', 'Cash Box', 'Cash Box', 'cash', 'EGP', id FROM accounting.chart_of_accounts WHERE tenant_id = '$TENANT_ID' AND account_code = '1110';

INSERT INTO accounting.bank_accounts (tenant_id, bank_name, account_name, account_number, account_type, currency, account_id)
SELECT '$TENANT_ID', 'CIB', 'CIB Business Account', '', 'checking', 'EGP', id FROM accounting.chart_of_accounts WHERE tenant_id = '$TENANT_ID' AND account_code = '1120';

INSERT INTO accounting.bank_accounts (tenant_id, bank_name, account_name, account_type, currency, account_id)
SELECT '$TENANT_ID', 'Vodafone Cash', 'Vodafone Cash Wallet', 'mobile_wallet', 'EGP', id FROM accounting.chart_of_accounts WHERE tenant_id = '$TENANT_ID' AND account_code = '1121';

INSERT INTO accounting.bank_accounts (tenant_id, bank_name, account_name, account_type, currency, account_id)
SELECT '$TENANT_ID', 'InstaPay', 'InstaPay Account', 'digital', 'EGP', id FROM accounting.chart_of_accounts WHERE tenant_id = '$TENANT_ID' AND account_code = '1122';

-- ═══════════════════════════════════════════════════════════
-- Fiscal Year 2024-2025
-- ═══════════════════════════════════════════════════════════
INSERT INTO accounting.fiscal_years (tenant_id, name, start_date, end_date, is_current) VALUES
('$TENANT_ID', 'FY 2024-2025', '2024-07-01', '2025-06-30', true);

-- ═══════════════════════════════════════════════════════════
-- POS Register
-- ═══════════════════════════════════════════════════════════
INSERT INTO pos.registers (tenant_id, register_number, name, warehouse_id) VALUES
('$TENANT_ID', 'REG-001', 'Main Register', '00000000-0000-0000-0000-000000000001');

-- ═══════════════════════════════════════════════════════════
-- Loyalty Program
-- ═══════════════════════════════════════════════════════════
INSERT INTO crm.loyalty_programs (tenant_id, name, points_per_egp, silver_threshold, gold_threshold, platinum_threshold, point_value_piasters, min_redeem_points, max_redeem_percent) VALUES
('$TENANT_ID', 'Brushia Rewards', 1.0, 500, 2000, 5000, 100, 100, 50.00);

-- ═══════════════════════════════════════════════════════════
-- Product Categories
-- ═══════════════════════════════════════════════════════════
INSERT INTO catalog.categories (id, tenant_id, name, name_ar, slug, sort_order) VALUES
('00000000-0000-0000-0001-000000000001', '$TENANT_ID', 'Makeup', 'مكياج', 'makeup', 1),
('00000000-0000-0000-0001-000000000002', '$TENANT_ID', 'Lashes', 'رموش', 'lashes', 2),
('00000000-0000-0000-0001-000000000003', '$TENANT_ID', 'Concealer', 'كونسيلر', 'concealer', 3),
('00000000-0000-0000-0001-000000000004', '$TENANT_ID', 'Brushes', 'فرش', 'brushes', 4),
('00000000-0000-0000-0001-000000000005', '$TENANT_ID', 'Brush Sets', 'أطقم فرش', 'brush-sets', 5),
('00000000-0000-0000-0001-000000000006', '$TENANT_ID', 'Other Makeup', 'أخرى', 'other-makeup', 6);
