import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class ReportingService {
  constructor(private readonly db: DatabaseService) {}

  async getDashboard(tenantId: string) {
    const [sales, inventory, customers, orders] = await Promise.all([
      this.db.queryOne(`
        SELECT COALESCE(SUM(total_amount), 0)::bigint as total_revenue,
               COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE), 0)::bigint as today_revenue,
               COUNT(*)::int as total_orders,
               COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int as today_orders
        FROM sales.sales_orders WHERE tenant_id = $1 AND status != 'cancelled'`, [tenantId]),
      this.db.queryOne(`
        SELECT COUNT(DISTINCT product_id)::int as total_products,
               SUM(qty_on_hand)::int as total_units,
               SUM(qty_on_hand * weighted_avg_cost)::bigint as total_value,
               COUNT(*) FILTER (WHERE qty_on_hand <= reorder_point)::int as low_stock_count
        FROM inventory.stock_levels WHERE tenant_id = $1`, [tenantId]),
      this.db.queryOne(`
        SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE customer_type = 'wholesale')::int as wholesale,
               SUM(loyalty_points)::int as total_points
        FROM sales.customers WHERE tenant_id = $1 AND is_active = true`, [tenantId]),
      this.db.queryOne(`
        SELECT COUNT(*) FILTER (WHERE status = 'pending')::int as pending_orders,
               COUNT(*) FILTER (WHERE status = 'confirmed')::int as confirmed_orders
        FROM sales.sales_orders WHERE tenant_id = $1`, [tenantId]),
    ]);
    return { sales, inventory, customers, orders };
  }

  async getSalesSummary(tenantId: string, from?: string, to?: string) {
    const dateFrom = from || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];
    const result = await this.db.queryOne(`
      SELECT COUNT(*)::int as order_count,
             COALESCE(SUM(total_amount), 0)::bigint as total_revenue,
             COALESCE(AVG(total_amount), 0)::bigint as avg_order_value,
             COALESCE(SUM(tax_amount), 0)::bigint as total_tax
      FROM sales.sales_orders WHERE tenant_id = $1 AND status != 'cancelled'
      AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
    `, [tenantId, dateFrom, dateTo]);

    const byPayment = await this.db.query(`
      SELECT payment_method, COUNT(*)::int as count, COALESCE(SUM(amount), 0)::bigint as total
      FROM sales.payments WHERE tenant_id = $1 AND created_at >= $2::date AND created_at < ($3::date + interval '1 day')
      GROUP BY payment_method ORDER BY total DESC
    `, [tenantId, dateFrom, dateTo]);

    return { ...result, period: { from: dateFrom, to: dateTo }, by_payment_method: byPayment.rows };
  }

  async getInventorySummary(tenantId: string) {
    const byWarehouse = await this.db.query(`
      SELECT w.name as warehouse_name, w.code,
             COUNT(DISTINCT sl.product_id)::int as sku_count,
             COALESCE(SUM(sl.qty_on_hand), 0)::int as total_units,
             COALESCE(SUM(sl.qty_on_hand * sl.weighted_avg_cost), 0)::bigint as total_value
      FROM inventory.warehouses w
      LEFT JOIN inventory.stock_levels sl ON sl.warehouse_id = w.id
      WHERE w.tenant_id = $1 AND w.is_active = true
      GROUP BY w.id, w.name, w.code ORDER BY w.name
    `, [tenantId]);

    const lowStock = await this.db.query(`
      SELECT sl.*, p.name as product_name, p.sku, w.name as warehouse_name
      FROM inventory.stock_levels sl
      JOIN catalog.products p ON p.id = sl.product_id
      JOIN inventory.warehouses w ON w.id = sl.warehouse_id
      WHERE sl.tenant_id = $1 AND sl.qty_on_hand <= sl.reorder_point
      ORDER BY sl.qty_on_hand ASC LIMIT 20
    `, [tenantId]);

    return { by_warehouse: byWarehouse.rows, low_stock_items: lowStock.rows };
  }

  async getTopProducts(tenantId: string, limit: number) {
    const result = await this.db.query(`
      SELECT p.name, p.sku, COALESCE(SUM(oi.quantity), 0)::int as units_sold,
             COALESCE(SUM(oi.quantity * oi.unit_price), 0)::bigint as revenue
      FROM sales.order_items oi
      JOIN catalog.products p ON p.id = oi.product_id
      JOIN sales.sales_orders so ON so.id = oi.order_id
      WHERE so.tenant_id = $1 AND so.status != 'cancelled'
      GROUP BY p.id, p.name, p.sku ORDER BY revenue DESC LIMIT $2
    `, [tenantId, limit]);
    return { data: result.rows };
  }

  async getRevenueByDay(tenantId: string, days: number) {
    const result = await this.db.query(`
      SELECT d.date, COALESCE(SUM(so.total_amount), 0)::bigint as revenue,
             COUNT(so.id)::int as order_count
      FROM generate_series(CURRENT_DATE - ($2 || ' days')::interval, CURRENT_DATE, '1 day') d(date)
      LEFT JOIN sales.sales_orders so ON so.tenant_id = $1 AND DATE(so.created_at) = d.date AND so.status != 'cancelled'
      GROUP BY d.date ORDER BY d.date
    `, [tenantId, days]);
    return { data: result.rows };
  }

  async getCustomerInsights(tenantId: string) {
    const byTier = await this.db.query(`
      SELECT loyalty_tier as tier, COUNT(*)::int as count, COALESCE(SUM(total_spent), 0)::bigint as total_spent
      FROM sales.customers WHERE tenant_id = $1 AND is_active = true GROUP BY loyalty_tier
    `, [tenantId]);
    const byCity = await this.db.query(`
      SELECT city, COUNT(*)::int as count FROM sales.customers WHERE tenant_id = $1 AND is_active = true AND city IS NOT NULL
      GROUP BY city ORDER BY count DESC LIMIT 10
    `, [tenantId]);
    return { by_tier: byTier.rows, by_city: byCity.rows };
  }

  async getCommissionReport(tenantId: string, from?: string, to?: string) {
    // Placeholder for commission tracking — returns salesperson performance
    const result = await this.db.query(`
      SELECT u.first_name || ' ' || u.last_name as salesperson,
             COUNT(so.id)::int as orders_count,
             COALESCE(SUM(so.total_amount), 0)::bigint as total_sales
      FROM sales.sales_orders so
      JOIN iam.users u ON u.id = so.created_by
      WHERE so.tenant_id = $1 AND so.status != 'cancelled'
      GROUP BY u.id, u.first_name, u.last_name ORDER BY total_sales DESC
    `, [tenantId]);
    return { data: result.rows };
  }
}