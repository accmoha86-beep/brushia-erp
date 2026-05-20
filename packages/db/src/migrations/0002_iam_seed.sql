-- Migration: 0002_iam_seed
-- Description: Seed default permissions and system role templates
-- Author: Brushia ERP Architecture

BEGIN;

-- =========================================================
-- PERMISSIONS SEED
-- =========================================================

-- DASHBOARD
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('dashboard.overview.read', 'dashboard', 'overview', 'read', 'View dashboard', 'Dashboard', 1);

-- CATALOG
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('catalog.products.create', 'catalog', 'products', 'create', 'Create products', 'Products', 10),
('catalog.products.read', 'catalog', 'products', 'read', 'View products', 'Products', 11),
('catalog.products.update', 'catalog', 'products', 'update', 'Edit products', 'Products', 12),
('catalog.products.delete', 'catalog', 'products', 'delete', 'Delete products', 'Products', 13),
('catalog.products.import', 'catalog', 'products', 'import', 'Import products', 'Products', 14),
('catalog.products.export', 'catalog', 'products', 'export', 'Export products', 'Products', 15),
('catalog.categories.manage', 'catalog', 'categories', 'manage', 'Manage categories', 'Products', 16);

-- INVENTORY
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('inventory.stock.read', 'inventory', 'stock', 'read', 'View stock levels', 'Inventory', 20),
('inventory.stock.adjust', 'inventory', 'stock', 'adjust', 'Adjust stock', 'Inventory', 21),
('inventory.stock.transfer', 'inventory', 'stock', 'transfer', 'Transfer between warehouses', 'Inventory', 22),
('inventory.stock.count', 'inventory', 'stock', 'count', 'Perform stock counts', 'Inventory', 23),
('inventory.stock.approve_count', 'inventory', 'stock', 'approve_count', 'Approve stock count reconciliation', 'Inventory', 24),
('inventory.movements.read', 'inventory', 'movements', 'read', 'View inventory movements', 'Inventory', 25),
('inventory.damages.create', 'inventory', 'damages', 'create', 'Record damages', 'Inventory', 26);

-- SALES
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('sales.orders.create', 'sales', 'orders', 'create', 'Create sales orders', 'Sales', 30),
('sales.orders.read', 'sales', 'orders', 'read', 'View sales orders', 'Sales', 31),
('sales.orders.update', 'sales', 'orders', 'update', 'Edit sales orders', 'Sales', 32),
('sales.orders.cancel', 'sales', 'orders', 'cancel', 'Cancel sales orders', 'Sales', 33),
('sales.orders.approve', 'sales', 'orders', 'approve', 'Approve sales orders', 'Sales', 34),
('sales.returns.create', 'sales', 'returns', 'create', 'Process returns', 'Sales', 35),
('sales.returns.approve', 'sales', 'returns', 'approve', 'Approve returns', 'Sales', 36),
('sales.invoices.create', 'sales', 'invoices', 'create', 'Create invoices', 'Sales', 37),
('sales.invoices.read', 'sales', 'invoices', 'read', 'View invoices', 'Sales', 38),
('sales.price_overrides', 'sales', 'pricing', 'override', 'Override product prices', 'Sales', 39);

-- POS
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('pos.terminal.access', 'pos', 'terminal', 'access', 'Access POS terminal', 'POS', 40),
('pos.terminal.open_shift', 'pos', 'terminal', 'open_shift', 'Open POS shift', 'POS', 41),
('pos.terminal.close_shift', 'pos', 'terminal', 'close_shift', 'Close POS shift', 'POS', 42),
('pos.terminal.void_sale', 'pos', 'terminal', 'void_sale', 'Void POS sale', 'POS', 43),
('pos.terminal.discount', 'pos', 'terminal', 'discount', 'Apply manual POS discounts', 'POS', 44),
('pos.terminal.refund', 'pos', 'terminal', 'refund', 'Process POS refunds', 'POS', 45),
('pos.reports.read', 'pos', 'reports', 'read', 'View POS shift reports', 'POS', 46);

-- PURCHASING
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('purchasing.orders.create', 'purchasing', 'orders', 'create', 'Create purchase orders', 'Purchasing', 50),
('purchasing.orders.read', 'purchasing', 'orders', 'read', 'View purchase orders', 'Purchasing', 51),
('purchasing.orders.approve', 'purchasing', 'orders', 'approve', 'Approve purchase orders', 'Purchasing', 52),
('purchasing.orders.receive', 'purchasing', 'orders', 'receive', 'Receive purchase orders', 'Purchasing', 53),
('purchasing.vendors.manage', 'purchasing', 'vendors', 'manage', 'Manage vendors', 'Purchasing', 54),
('purchasing.bills.manage', 'purchasing', 'bills', 'manage', 'Manage vendor bills', 'Purchasing', 55);

-- ACCOUNTING
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('accounting.journals.create', 'accounting', 'journals', 'create', 'Create journal entries', 'Accounting', 60),
('accounting.journals.post', 'accounting', 'journals', 'post', 'Post journal entries', 'Accounting', 61),
('accounting.journals.read', 'accounting', 'journals', 'read', 'View journal entries', 'Accounting', 62),
('accounting.accounts.manage', 'accounting', 'accounts', 'manage', 'Manage chart of accounts', 'Accounting', 63),
('accounting.periods.manage', 'accounting', 'periods', 'manage', 'Manage fiscal periods', 'Accounting', 64),
('accounting.reconcile', 'accounting', 'bank', 'reconcile', 'Reconcile bank accounts', 'Accounting', 65),
('accounting.reports.read', 'accounting', 'reports', 'read', 'View financial reports', 'Accounting', 66),
('accounting.cost_centers.manage', 'accounting', 'cost_centers', 'manage', 'Manage cost centers', 'Accounting', 67);

-- CRM
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('crm.customers.create', 'crm', 'customers', 'create', 'Create customers', 'Customers', 70),
('crm.customers.read', 'crm', 'customers', 'read', 'View customers', 'Customers', 71),
('crm.customers.update', 'crm', 'customers', 'update', 'Edit customers', 'Customers', 72),
('crm.customers.delete', 'crm', 'customers', 'delete', 'Delete customers', 'Customers', 73),
('crm.loyalty.manage', 'crm', 'loyalty', 'manage', 'Manage loyalty program', 'Customers', 74);

-- SHIPPING
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('shipping.shipments.create', 'shipping', 'shipments', 'create', 'Create shipments', 'Shipping', 80),
('shipping.shipments.read', 'shipping', 'shipments', 'read', 'View shipments', 'Shipping', 81),
('shipping.shipments.update', 'shipping', 'shipments', 'update', 'Update shipments', 'Shipping', 82);

-- PROMOTIONS
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('promotions.manage', 'promotions', 'promotions', 'manage', 'Manage promotions', 'Marketing', 90),
('promotions.wholesale.manage', 'promotions', 'wholesale', 'manage', 'Manage wholesale pricing', 'Marketing', 91);

-- REPORTS
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('reports.sales.read', 'reports', 'sales', 'read', 'View sales reports', 'Reports', 100),
('reports.inventory.read', 'reports', 'inventory', 'read', 'View inventory reports', 'Reports', 101),
('reports.financial.read', 'reports', 'financial', 'read', 'View financial reports', 'Reports', 102),
('reports.export', 'reports', 'all', 'export', 'Export reports', 'Reports', 103);

-- SETTINGS & ADMIN
INSERT INTO iam.permissions (code, module, resource, action, description, display_group, display_order) VALUES
('admin.settings.manage', 'admin', 'settings', 'manage', 'Manage system settings', 'Administration', 110),
('admin.users.manage', 'admin', 'users', 'manage', 'Manage users', 'Administration', 111),
('admin.roles.manage', 'admin', 'roles', 'manage', 'Manage roles', 'Administration', 112),
('admin.branches.manage', 'admin', 'branches', 'manage', 'Manage branches', 'Administration', 113),
('admin.audit.read', 'admin', 'audit', 'read', 'View audit log', 'Administration', 114),
('admin.api_keys.manage', 'admin', 'api_keys', 'manage', 'Manage API keys', 'Administration', 115);

COMMIT;
