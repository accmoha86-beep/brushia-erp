import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class PurchasingService {
  constructor(private readonly db: DatabaseService) {}

  // ═══════════════════════════════════════════════════
  // VENDORS
  // ═══════════════════════════════════════════════════
  async listVendors(tenantId: string, search?: string) {
    let query = `SELECT *, 
      (SELECT COUNT(*)::int FROM purchasing.purchase_orders WHERE vendor_id = v.id) as po_count,
      (SELECT COALESCE(SUM(total),0)::bigint FROM purchasing.purchase_orders WHERE vendor_id = v.id AND status != 'cancelled') as total_ordered
      FROM purchasing.vendors v WHERE v.tenant_id = $1`;
    const params: any[] = [tenantId];
    if (search) { query += ' AND (v.company_name ILIKE $2 OR v.vendor_code ILIKE $2 OR v.contact_name ILIKE $2)'; params.push(`%${search}%`); }
    query += ' ORDER BY v.company_name ASC';
    return (await this.db.query(query, params)).rows;
  }

  async getVendor(tenantId: string, id: string) {
    const v = await this.db.queryOne('SELECT * FROM purchasing.vendors WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }

  async createVendor(tenantId: string, dto: any) {
    const code = await this.db.queryOne(
      `SELECT 'VND-' || LPAD((COUNT(*) + 1)::text, 4, '0') as next FROM purchasing.vendors WHERE tenant_id = $1`, [tenantId]);
    return this.db.queryOne(
      `INSERT INTO purchasing.vendors (tenant_id, vendor_code, company_name, contact_name, email, phone, whatsapp, website, address_line1, city, country, payment_terms, default_currency, rating, tax_number, notes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [tenantId, code.next, dto.company_name, dto.contact_name || null, dto.email || null, dto.phone || null,
       dto.whatsapp || null, dto.website || null, dto.address_line1 || null, dto.city || null,
       dto.country || 'CN', dto.payment_terms || 'net_30', dto.default_currency || 'USD',
       dto.rating || null, dto.tax_number || null, dto.notes || null, dto.is_active !== false]);
  }

  async updateVendor(tenantId: string, id: string, dto: any) {
    const allowed = ['company_name','contact_name','email','phone','whatsapp','website','address_line1','city','country','payment_terms','default_currency','rating','tax_number','notes','is_active'];
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [k, v] of Object.entries(dto)) {
      if (allowed.includes(k)) { sets.push(`${k} = $${idx}`); params.push(v); idx++; }
    }
    if (!sets.length) return this.getVendor(tenantId, id);
    sets.push('updated_at = NOW()');
    const r = await this.db.queryOne(`UPDATE purchasing.vendors SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`, params);
    if (!r) throw new NotFoundException('Vendor not found');
    return r;
  }

  // ═══════════════════════════════════════════════════
  // PURCHASE ORDERS
  // ═══════════════════════════════════════════════════
  async listPOs(tenantId: string, filters: any) {
    let query = `SELECT po.*, v.company_name as vendor_name,
      (SELECT COUNT(*)::int FROM purchasing.purchase_order_items poi WHERE poi.purchase_order_id = po.id) as item_count,
      (SELECT COUNT(*)::int FROM purchasing.goods_receipts gr WHERE gr.purchase_order_id = po.id) as grn_count
      FROM purchasing.purchase_orders po
      LEFT JOIN purchasing.vendors v ON v.id = po.vendor_id
      WHERE po.tenant_id = $1`;
    const params: any[] = [tenantId]; let idx = 2;
    if (filters.status) { query += ` AND po.status = $${idx}`; params.push(filters.status); idx++; }
    if (filters.vendorId) { query += ` AND po.vendor_id = $${idx}`; params.push(filters.vendorId); idx++; }
    query += ' ORDER BY po.created_at DESC';
    return { data: (await this.db.query(query, params)).rows };
  }

  async getPO(tenantId: string, id: string) {
    const po = await this.db.queryOne(
      `SELECT po.*, v.company_name as vendor_name, v.contact_name as vendor_contact
       FROM purchasing.purchase_orders po
       LEFT JOIN purchasing.vendors v ON v.id = po.vendor_id
       WHERE po.id = $1 AND po.tenant_id = $2`, [id, tenantId]);
    if (!po) throw new NotFoundException('PO not found');
    const items = await this.db.query(
      `SELECT poi.*, p.name as product_name, p.sku, p.base_price
       FROM purchasing.purchase_order_items poi
       LEFT JOIN catalog.products p ON p.id = poi.product_id
       WHERE poi.purchase_order_id = $1 ORDER BY poi.created_at`, [id]);
    const grns = await this.db.query(
      `SELECT gr.*, u.email as received_by_email
       FROM purchasing.goods_receipts gr
       LEFT JOIN iam.users u ON u.id = gr.received_by
       WHERE gr.purchase_order_id = $1 AND gr.tenant_id = $2 ORDER BY gr.created_at DESC`, [id, tenantId]);
    return { ...po, items: items.rows, goods_receipts: grns.rows };
  }

  async createPO(tenantId: string, userId: string, dto: any) {
    return this.db.transaction(async (client) => {
      const num = await client.query(
        `SELECT 'PO-' || LPAD((COUNT(*) + 1)::text, 5, '0') as next FROM purchasing.purchase_orders WHERE tenant_id = $1`, [tenantId]);
      
      // Calculate subtotal from items
      let subtotal = 0;
      for (const item of (dto.items || [])) {
        subtotal += (item.quantity_ordered || item.quantity || 0) * (item.unit_cost || 0);
      }
      const taxAmount = Math.round(subtotal * 0.14); // 14% VAT
      const chinaShipping = dto.china_shipping_cost || 0;
      const chinaAgent = dto.china_agent_fee || 0;
      const egyptCustoms = dto.egypt_customs_duty || 0;
      const egyptClearance = dto.egypt_clearance_fee || 0;
      const egyptLocal = dto.egypt_local_shipping || 0;
      const otherCosts = dto.other_costs || 0;
      const totalLanded = subtotal + chinaShipping + chinaAgent + egyptCustoms + egyptClearance + egyptLocal + otherCosts;
      const total = subtotal + taxAmount;

      const po = await client.query(
        `INSERT INTO purchasing.purchase_orders 
         (tenant_id, po_number, vendor_id, warehouse_id, order_date, expected_date,
          subtotal, tax_amount, total, 
          china_shipping_cost, china_agent_fee, egypt_customs_duty, egypt_clearance_fee, egypt_local_shipping, other_costs, total_landed_cost,
          currency, exchange_rate, status, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
        [tenantId, num.rows[0].next, dto.vendor_id, dto.warehouse_id || null,
         dto.order_date || new Date().toISOString().split('T')[0], dto.expected_date || null,
         subtotal, taxAmount, total,
         chinaShipping, chinaAgent, egyptCustoms, egyptClearance, egyptLocal, otherCosts, totalLanded,
         dto.currency || 'USD', dto.exchange_rate || 1.0, 'draft', dto.notes || null, userId]);
      
      const poId = po.rows[0].id;
      
      // Insert items with landed cost allocation
      const totalQty = (dto.items || []).reduce((s: number, i: any) => s + (i.quantity_ordered || i.quantity || 0), 0);
      const landedPerUnit = totalQty > 0 ? Math.round((chinaShipping + chinaAgent + egyptCustoms + egyptClearance + egyptLocal + otherCosts) / totalQty) : 0;
      
      for (const item of (dto.items || [])) {
        const qty = item.quantity_ordered || item.quantity || 0;
        const cost = item.unit_cost || 0;
        await client.query(
          `INSERT INTO purchasing.purchase_order_items 
           (tenant_id, purchase_order_id, product_id, variant_id, sku, product_name, quantity_ordered, unit_cost, total_cost, landed_unit_cost)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [tenantId, poId, item.product_id, item.variant_id || null, item.sku || '', item.product_name || '',
           qty, cost, qty * cost, cost + landedPerUnit]);
      }
      
      return { ...po.rows[0], item_count: (dto.items || []).length, landed_per_unit: landedPerUnit };
    });
  }

  async updatePO(tenantId: string, id: string, dto: any) {
    const po = await this.getPO(tenantId, id);
    if (!['draft', 'submitted'].includes(po.status)) throw new BadRequestException('Can only edit draft/submitted POs');
    
    const allowed = ['vendor_id','warehouse_id','expected_date','currency','exchange_rate','china_shipping_cost','china_agent_fee','egypt_customs_duty','egypt_clearance_fee','egypt_local_shipping','other_costs','notes'];
    const sets: string[] = []; const params: any[] = [id, tenantId]; let idx = 3;
    for (const [k, v] of Object.entries(dto)) {
      if (allowed.includes(k)) { sets.push(`${k} = $${idx}`); params.push(v); idx++; }
    }
    if (!sets.length) return po;
    sets.push('updated_at = NOW()');
    return this.db.queryOne(`UPDATE purchasing.purchase_orders SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`, params);
  }

  async updatePOStatus(tenantId: string, id: string, status: string, userId?: string) {
    const validTransitions: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled'],
      approved: ['ordered', 'cancelled'],
      ordered: ['partial_received', 'received', 'cancelled'],
      partial_received: ['received'],
      received: ['closed'],
    };
    const po = await this.getPO(tenantId, id);
    if (!validTransitions[po.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${po.status} to ${status}`);
    }
    const extra = status === 'approved' ? ', approved_by = $4, approved_at = NOW()' : '';
    const params: any[] = [status, id, tenantId];
    if (status === 'approved') params.push(userId);
    return this.db.queryOne(
      `UPDATE purchasing.purchase_orders SET status = $1${extra}, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`, params);
  }

  // ═══════════════════════════════════════════════════
  // GOODS RECEIVE NOTES (GRN)
  // ═══════════════════════════════════════════════════
  async listGRNs(tenantId: string, poId?: string) {
    let query = `SELECT gr.*, po.po_number, v.company_name as vendor_name,
      u.email as received_by_email,
      (SELECT COUNT(*)::int FROM purchasing.goods_receipt_items gri WHERE gri.goods_receipt_id = gr.id) as item_count,
      (SELECT COALESCE(SUM(gri.quantity_received),0)::int FROM purchasing.goods_receipt_items gri WHERE gri.goods_receipt_id = gr.id) as total_qty_received
      FROM purchasing.goods_receipts gr
      JOIN purchasing.purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN purchasing.vendors v ON v.id = po.vendor_id
      LEFT JOIN iam.users u ON u.id = gr.received_by
      WHERE gr.tenant_id = $1`;
    const params: any[] = [tenantId]; let idx = 2;
    if (poId) { query += ` AND gr.purchase_order_id = $${idx}`; params.push(poId); idx++; }
    query += ' ORDER BY gr.created_at DESC';
    return (await this.db.query(query, params)).rows;
  }

  async getGRN(tenantId: string, id: string) {
    const grn = await this.db.queryOne(
      `SELECT gr.*, po.po_number, v.company_name as vendor_name
       FROM purchasing.goods_receipts gr
       JOIN purchasing.purchase_orders po ON po.id = gr.purchase_order_id
       LEFT JOIN purchasing.vendors v ON v.id = po.vendor_id
       WHERE gr.id = $1 AND gr.tenant_id = $2`, [id, tenantId]);
    if (!grn) throw new NotFoundException('GRN not found');
    const items = await this.db.query(
      `SELECT gri.*, poi.product_name, poi.sku, poi.quantity_ordered, poi.unit_cost,
              p.name as current_product_name
       FROM purchasing.goods_receipt_items gri
       JOIN purchasing.purchase_order_items poi ON poi.id = gri.po_item_id
       LEFT JOIN catalog.products p ON p.id = gri.product_id
       WHERE gri.goods_receipt_id = $1 ORDER BY gri.created_at`, [id]);
    return { ...grn, items: items.rows };
  }

  async createGRN(tenantId: string, userId: string, dto: any) {
    return this.db.transaction(async (client) => {
      // Verify PO exists and is in valid state
      const po = await client.query(
        'SELECT * FROM purchasing.purchase_orders WHERE id = $1 AND tenant_id = $2', [dto.purchase_order_id, tenantId]);
      if (!po.rows[0]) throw new NotFoundException('PO not found');
      if (!['approved', 'ordered', 'partial_received'].includes(po.rows[0].status)) {
        throw new BadRequestException('PO must be approved/ordered/partial to receive goods');
      }

      const num = await client.query(
        `SELECT 'GRN-' || LPAD((COUNT(*) + 1)::text, 5, '0') as next FROM purchasing.goods_receipts WHERE tenant_id = $1`, [tenantId]);
      
      const grn = await client.query(
        `INSERT INTO purchasing.goods_receipts (tenant_id, receipt_number, purchase_order_id, warehouse_id, status, notes, received_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, num.rows[0].next, dto.purchase_order_id, dto.warehouse_id || po.rows[0].warehouse_id, 'draft', dto.notes || null, userId]);
      
      const grnId = grn.rows[0].id;
      
      for (const item of (dto.items || [])) {
        await client.query(
          `INSERT INTO purchasing.goods_receipt_items (tenant_id, goods_receipt_id, po_item_id, product_id, variant_id, quantity_received, unit_cost, landed_unit_cost)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [tenantId, grnId, item.po_item_id, item.product_id, item.variant_id || null,
           item.quantity_received, item.unit_cost || 0, item.landed_unit_cost || 0]);
      }
      
      return grn.rows[0];
    });
  }

  async acceptGRN(tenantId: string, userId: string, id: string, dto: any) {
    return this.db.transaction(async (client) => {
      const grn = await client.query(
        'SELECT * FROM purchasing.goods_receipts WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
      if (!grn.rows[0]) throw new NotFoundException('GRN not found');
      
      let hasRejections = false;
      
      for (const item of (dto.items || [])) {
        const accepted = item.quantity_accepted || 0;
        const rejected = item.quantity_rejected || 0;
        if (rejected > 0) hasRejections = true;
        
        // Update GRN item
        await client.query(
          `UPDATE purchasing.goods_receipt_items SET quantity_accepted = $1, quantity_rejected = $2, rejection_reason = $3
           WHERE id = $4 AND goods_receipt_id = $5`,
          [accepted, rejected, item.rejection_reason || null, item.item_id, id]);
        
        // Update PO item received qty
        if (accepted > 0) {
          await client.query(
            `UPDATE purchasing.purchase_order_items SET quantity_received = quantity_received + $1 WHERE id = $2`,
            [accepted, item.po_item_id]);
          
          // Update inventory stock levels
          const warehouse_id = grn.rows[0].warehouse_id;
          await client.query(
            `INSERT INTO inventory.stock_levels (tenant_id, product_id, variant_id, warehouse_id, qty_on_hand)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (tenant_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'), warehouse_id)
             DO UPDATE SET qty_on_hand = inventory.stock_levels.qty_on_hand + $5, updated_at = NOW()`,
            [tenantId, item.product_id, item.variant_id || null, warehouse_id, accepted]);
        }
      }
      
      const status = hasRejections ? 'partial_accepted' : 'accepted';
      await client.query(
        `UPDATE purchasing.goods_receipts SET status = $1, inspected_by = $2 WHERE id = $3`,
        [status, userId, id]);
      
      // Check if all PO items fully received → update PO status
      const poId = grn.rows[0].purchase_order_id;
      const remaining = await client.query(
        `SELECT COUNT(*)::int as pending FROM purchasing.purchase_order_items 
         WHERE purchase_order_id = $1 AND quantity_received < quantity_ordered`, [poId]);
      
      const newPoStatus = remaining.rows[0].pending === 0 ? 'received' : 'partial_received';
      await client.query(
        `UPDATE purchasing.purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2`, [newPoStatus, poId]);
      
      return { success: true, grn_status: status, po_status: newPoStatus };
    });
  }

  // ═══════════════════════════════════════════════════
  // VENDOR BILLS
  // ═══════════════════════════════════════════════════
  async listBills(tenantId: string, filters: any = {}) {
    let query = `SELECT vb.*, v.company_name as vendor_name, po.po_number,
      (SELECT COUNT(*)::int FROM purchasing.bill_payments bp WHERE bp.bill_id = vb.id) as payment_count
      FROM purchasing.vendor_bills vb
      LEFT JOIN purchasing.vendors v ON v.id = vb.vendor_id
      LEFT JOIN purchasing.purchase_orders po ON po.id = vb.purchase_order_id
      WHERE vb.tenant_id = $1`;
    const params: any[] = [tenantId]; let idx = 2;
    if (filters.status) { query += ` AND vb.status = $${idx}`; params.push(filters.status); idx++; }
    if (filters.vendorId) { query += ` AND vb.vendor_id = $${idx}`; params.push(filters.vendorId); idx++; }
    query += ' ORDER BY vb.created_at DESC';
    return (await this.db.query(query, params)).rows;
  }

  async getBill(tenantId: string, id: string) {
    const bill = await this.db.queryOne(
      `SELECT vb.*, v.company_name as vendor_name, po.po_number
       FROM purchasing.vendor_bills vb
       LEFT JOIN purchasing.vendors v ON v.id = vb.vendor_id
       LEFT JOIN purchasing.purchase_orders po ON po.id = vb.purchase_order_id
       WHERE vb.id = $1 AND vb.tenant_id = $2`, [id, tenantId]);
    if (!bill) throw new NotFoundException('Bill not found');
    const payments = await this.db.query(
      `SELECT bp.*, u.email as created_by_email FROM purchasing.bill_payments bp
       LEFT JOIN iam.users u ON u.id = bp.created_by
       WHERE bp.bill_id = $1 ORDER BY bp.payment_date DESC`, [id]);
    return { ...bill, payments: payments.rows };
  }

  async createBill(tenantId: string, userId: string, dto: any) {
    const num = await this.db.queryOne(
      `SELECT 'BILL-' || LPAD((COUNT(*) + 1)::text, 5, '0') as next FROM purchasing.vendor_bills WHERE tenant_id = $1`, [tenantId]);
    const subtotal = dto.subtotal || 0;
    const taxAmount = dto.tax_amount || Math.round(subtotal * 0.14);
    const total = subtotal + taxAmount;
    return this.db.queryOne(
      `INSERT INTO purchasing.vendor_bills 
       (tenant_id, bill_number, vendor_id, purchase_order_id, bill_date, due_date, subtotal, tax_amount, total, currency, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [tenantId, num.next, dto.vendor_id, dto.purchase_order_id || null,
       dto.bill_date || new Date().toISOString().split('T')[0], dto.due_date || null,
       subtotal, taxAmount, total, dto.currency || 'EGP', 'pending', dto.notes || null, userId]);
  }

  async updateBillStatus(tenantId: string, id: string, status: string) {
    return this.db.queryOne(
      `UPDATE purchasing.vendor_bills SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]);
  }

  async payBill(tenantId: string, userId: string, billId: string, dto: any) {
    return this.db.transaction(async (client) => {
      const bill = await client.query(
        'SELECT * FROM purchasing.vendor_bills WHERE id = $1 AND tenant_id = $2', [billId, tenantId]);
      if (!bill.rows[0]) throw new NotFoundException('Bill not found');
      
      const payment = await client.query(
        `INSERT INTO purchasing.bill_payments (tenant_id, bill_id, payment_date, amount, payment_method, reference, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, billId, dto.payment_date || new Date().toISOString().split('T')[0],
         dto.amount, dto.payment_method || 'bank_transfer', dto.reference || null, userId]);
      
      // Update bill amount_paid
      const totalPaid = await client.query(
        `SELECT COALESCE(SUM(amount),0)::bigint as total FROM purchasing.bill_payments WHERE bill_id = $1`, [billId]);
      const paid = totalPaid.rows[0].total;
      const billTotal = bill.rows[0].total;
      const newStatus = paid >= billTotal ? 'paid' : 'partial';
      
      await client.query(
        `UPDATE purchasing.vendor_bills SET amount_paid = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [paid, newStatus, billId]);
      
      return payment.rows[0];
    });
  }

  // ═══════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════
  async getStats(tenantId: string) {
    const r = await this.db.queryOne(`
      SELECT
        (SELECT COUNT(*)::int FROM purchasing.purchase_orders WHERE tenant_id = $1) as total_pos,
        (SELECT COUNT(*)::int FROM purchasing.purchase_orders WHERE tenant_id = $1 AND status = 'draft') as draft_count,
        (SELECT COUNT(*)::int FROM purchasing.purchase_orders WHERE tenant_id = $1 AND status IN ('submitted','approved','ordered')) as pending_count,
        (SELECT COUNT(*)::int FROM purchasing.purchase_orders WHERE tenant_id = $1 AND status = 'received') as received_count,
        (SELECT COUNT(*)::int FROM purchasing.goods_receipts WHERE tenant_id = $1) as total_grns,
        (SELECT COUNT(*)::int FROM purchasing.vendor_bills WHERE tenant_id = $1) as total_bills,
        (SELECT COALESCE(SUM(amount_due),0)::bigint FROM purchasing.vendor_bills WHERE tenant_id = $1 AND status IN ('pending','partial','approved')) as total_payable,
        (SELECT COUNT(*)::int FROM purchasing.vendors WHERE tenant_id = $1 AND is_active = true) as vendor_count
    `, [tenantId]);
    return r;
  }

  // Legacy compat
  async receivePO(tenantId: string, userId: string, id: string, dto: any) {
    return this.createGRN(tenantId, userId, { purchase_order_id: id, warehouse_id: dto.warehouse_id, items: dto.items, notes: dto.notes });
  }
}
