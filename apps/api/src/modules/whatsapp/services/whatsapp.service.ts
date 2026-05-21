import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class WhatsAppService {
  constructor(private readonly db: DatabaseService) {}

  async listConversations(tenantId: string, filters: any) {
    const { status, search, assignedTo, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['wc.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (status) { conditions.push(`wc.status = $${idx}`); params.push(status); idx++; }
    if (search) {
      conditions.push(`(wc.customer_name ILIKE $${idx} OR wc.customer_phone ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (assignedTo) { conditions.push(`wc.assigned_to = $${idx}`); params.push(assignedTo); idx++; }

    const where = conditions.join(' AND ');
    const countResult = await this.db.query(
      `SELECT COUNT(*)::int as total FROM whatsapp.conversations wc WHERE ${where}`, params,
    );
    const result = await this.db.query(
      `SELECT wc.*,
        (SELECT COUNT(*)::int FROM whatsapp.messages m WHERE m.conversation_id = wc.id AND m.is_read = false AND m.direction = 'inbound') as unread_count
       FROM whatsapp.conversations wc WHERE ${where}
       ORDER BY wc.last_message_at DESC NULLS LAST, wc.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return { data: result.rows, pagination: { total: countResult.rows[0].total, page, limit } };
  }

  async getConversation(tenantId: string, id: string) {
    const conversation = await this.db.queryOne(
      'SELECT * FROM whatsapp.conversations WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    if (!conversation) throw new NotFoundException('Conversation not found');

    const messages = await this.db.query(
      `SELECT * FROM whatsapp.messages WHERE conversation_id = $1 AND tenant_id = $2 ORDER BY created_at ASC`,
      [id, tenantId],
    );

    return { ...conversation, messages: messages.rows };
  }

  async createConversation(tenantId: string, userId: string, dto: any) {
    const { customer_phone, customer_name, customer_id, notes } = dto;
    if (!customer_phone) throw new BadRequestException('customer_phone is required');

    const result = await this.db.queryOne(
      `INSERT INTO whatsapp.conversations (tenant_id, customer_phone, customer_name, customer_id, notes, status, assigned_to)
       VALUES ($1, $2, $3, $4, $5, 'open', $6) RETURNING *`,
      [tenantId, customer_phone, customer_name || null, customer_id || null, notes || null, userId],
    );
    return result;
  }

  async updateConversation(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['status', 'assigned_to', 'tags', 'notes'].includes(key)) {
        if (key === 'tags') {
          sets.push(`tags = $${idx}`);
          params.push(JSON.stringify(val));
        } else {
          sets.push(`${key} = $${idx}`);
          params.push(val);
        }
        idx++;
      }
    }
    if (sets.length === 0) throw new BadRequestException('No valid fields to update');
    sets.push('updated_at = NOW()');

    const result = await this.db.queryOne(
      `UPDATE whatsapp.conversations SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  async addMessage(tenantId: string, conversationId: string, userId: string, dto: any) {
    const { direction, content, message_type, product_ids } = dto;
    if (!direction || !content) throw new BadRequestException('direction and content are required');

    // Verify conversation exists
    const convo = await this.db.queryOne(
      'SELECT id FROM whatsapp.conversations WHERE id = $1 AND tenant_id = $2',
      [conversationId, tenantId],
    );
    if (!convo) throw new NotFoundException('Conversation not found');

    const message = await this.db.queryOne(
      `INSERT INTO whatsapp.messages (tenant_id, conversation_id, direction, content, message_type, product_ids, sent_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, conversationId, direction, content, message_type || 'text',
       product_ids ? JSON.stringify(product_ids) : null, userId],
    );

    // Update conversation last_message_at and message_count
    await this.db.query(
      `UPDATE whatsapp.conversations SET last_message_at = NOW(), message_count = message_count + 1, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [conversationId, tenantId],
    );

    return message;
  }

  async convertToOrder(tenantId: string, conversationId: string, userId: string, dto: any) {
    const { items, shipping_address } = dto;
    if (!items || !items.length) throw new BadRequestException('items are required');

    // Verify conversation exists
    const convo = await this.db.queryOne(
      'SELECT * FROM whatsapp.conversations WHERE id = $1 AND tenant_id = $2',
      [conversationId, tenantId],
    );
    if (!convo) throw new NotFoundException('Conversation not found');

    // Generate order number
    const orderNum = await this.db.queryOne(
      `SELECT 'SO-' || LPAD((COUNT(*) + 1)::text, 6, '0') as next_number FROM sales.sales_orders WHERE tenant_id = $1`,
      [tenantId],
    );

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.unit_price || 0) * (item.quantity || 0);
    }

    // Create sales order
    const order = await this.db.queryOne(
      `INSERT INTO sales.sales_orders
        (tenant_id, order_number, customer_id, status, subtotal, total_amount, source, shipping_address, created_by)
       VALUES ($1, $2, $3, 'pending', $4, $4, 'whatsapp', $5, $6) RETURNING *`,
      [tenantId, orderNum.next_number, convo.customer_id, subtotal,
       shipping_address ? JSON.stringify(shipping_address) : null, userId],
    );

    // Create order items
    for (const item of items) {
      await this.db.query(
        `INSERT INTO sales.order_items (tenant_id, order_id, product_id, variant_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, order.id, item.product_id, item.variant_id || null,
         item.quantity, item.unit_price, (item.quantity || 0) * (item.unit_price || 0)],
      );
    }

    // Link conversation to order
    await this.db.query(
      `UPDATE whatsapp.conversations SET sales_order_id = $3, status = 'converted', converted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [conversationId, tenantId, order.id],
    );

    return { conversation_id: conversationId, order };
  }

  async getStats(tenantId: string) {
    const result = await this.db.queryOne(
      `SELECT
        COUNT(*)::int as total_conversations,
        COUNT(*) FILTER (WHERE status = 'open')::int as open_conversations,
        COUNT(*) FILTER (WHERE status = 'converted')::int as converted_conversations,
        COUNT(*) FILTER (WHERE status = 'closed')::int as closed_conversations,
        CASE WHEN COUNT(*) > 0
          THEN ROUND(COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*)::numeric * 100, 2)
          ELSE 0
        END as conversion_rate
       FROM whatsapp.conversations WHERE tenant_id = $1`,
      [tenantId],
    );

    const recentActivity = await this.db.queryOne(
      `SELECT
        COUNT(*)::int as messages_24h,
        COUNT(DISTINCT conversation_id)::int as active_conversations_24h
       FROM whatsapp.messages WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [tenantId],
    );

    return { ...result, recent_activity: recentActivity };
  }
}
