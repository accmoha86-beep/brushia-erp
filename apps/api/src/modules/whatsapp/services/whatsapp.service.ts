import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly db: DatabaseService) {}

  // ════════════════════════════════════════════
  // CONVERSATIONS
  // ════════════════════════════════════════════

  async listConversations(tenantId: string, filters: any) {
    const { status, priority, search, assignedTo, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['wc.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (status) { conditions.push(`wc.status = $${idx}`); params.push(status); idx++; }
    if (priority) { conditions.push(`wc.priority = $${idx}`); params.push(priority); idx++; }
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
        (SELECT COUNT(*)::int FROM whatsapp.messages m WHERE m.conversation_id = wc.id AND m.read_at IS NULL AND m.direction = 'inbound') as unread_count
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

  async getMessages(tenantId: string, conversationId: string) {
    const result = await this.db.query(
      `SELECT * FROM whatsapp.messages WHERE conversation_id = $1 AND tenant_id = $2 ORDER BY created_at ASC`,
      [conversationId, tenantId],
    );
    return result.rows;
  }

  async createConversation(tenantId: string, userId: string, dto: any) {
    const { customer_phone, customer_name, customer_id, notes } = dto;
    if (!customer_phone) throw new BadRequestException('customer_phone is required');

    const result = await this.db.queryOne(
      `INSERT INTO whatsapp.conversations (tenant_id, customer_phone, customer_name, customer_id, notes, status, assigned_to, source)
       VALUES ($1, $2, $3, $4, $5, 'open', $6, 'manual') RETURNING *`,
      [tenantId, customer_phone, customer_name || null, customer_id || null, notes || null, userId],
    );
    return result;
  }

  async updateConversation(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['status', 'assigned_to', 'tags', 'notes', 'bot_enabled', 'bot_state', 'priority'].includes(key)) {
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

  async resolveConversation(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `UPDATE whatsapp.conversations SET status = 'closed', resolved_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId],
    );
    if (!result) throw new NotFoundException('Conversation not found');
    return result;
  }

  async addMessage(tenantId: string, conversationId: string, userId: string, dto: any) {
    const { direction, content, message_type, product_ids } = dto;
    if (!direction || !content) throw new BadRequestException('direction and content are required');

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

    await this.db.query(
      `UPDATE whatsapp.conversations SET last_message_at = NOW(), message_count = message_count + 1, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [conversationId, tenantId],
    );

    return message;
  }

  async markMessagesRead(tenantId: string, conversationId: string) {
    await this.db.query(
      `UPDATE whatsapp.messages SET read_at = NOW()
       WHERE conversation_id = $1 AND tenant_id = $2 AND read_at IS NULL AND direction = 'inbound'`,
      [conversationId, tenantId],
    );
  }

  async convertToOrder(tenantId: string, conversationId: string, userId: string, dto: any) {
    const { items, shipping_address } = dto;
    if (!items || !items.length) throw new BadRequestException('items are required');

    const convo = await this.db.queryOne(
      'SELECT * FROM whatsapp.conversations WHERE id = $1 AND tenant_id = $2',
      [conversationId, tenantId],
    );
    if (!convo) throw new NotFoundException('Conversation not found');

    const orderNum = await this.db.queryOne(
      `SELECT 'SO-' || LPAD((COUNT(*) + 1)::text, 6, '0') as next_number FROM sales.sales_orders WHERE tenant_id = $1`,
      [tenantId],
    );

    let subtotal = 0;
    for (const item of items) {
      subtotal += (item.unit_price || 0) * (item.quantity || 0);
    }
    const taxAmount = Math.round(subtotal * 0.14);
    const total = subtotal + taxAmount;

    const order = await this.db.queryOne(
      `INSERT INTO sales.sales_orders
        (tenant_id, order_number, customer_id, status, order_type, channel, subtotal, tax_amount, total, payment_status, shipping_address, created_by, notes)
       VALUES ($1, $2, $3, 'confirmed', 'retail', 'whatsapp', $4, $5, $6, 'unpaid', $7, $8, $9) RETURNING *`,
      [tenantId, orderNum.next_number, convo.customer_id, subtotal, taxAmount, total,
       shipping_address ? JSON.stringify(shipping_address) : null, userId,
       `WhatsApp order from ${convo.customer_phone}`],
    );

    for (const item of items) {
      const product = await this.db.queryOne(
        'SELECT sku, name FROM catalog.products WHERE id = $1', [item.product_id],
      );
      await this.db.query(
        `INSERT INTO sales.order_items (order_id, product_id, variant_id, sku, name, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [order.id, item.product_id, item.variant_id || null,
         product?.sku || 'WA-ITEM', product?.name || 'WhatsApp Item',
         item.quantity, item.unit_price, (item.quantity || 0) * (item.unit_price || 0)],
      );
    }

    await this.db.query(
      `UPDATE whatsapp.conversations SET sales_order_id = $3, status = 'converted', converted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [conversationId, tenantId, order.id],
    );

    return { conversation_id: conversationId, order };
  }

  // ════════════════════════════════════════════
  // BOT FLOWS
  // ════════════════════════════════════════════

  async listBotFlows(tenantId: string) {
    const result = await this.db.query(
      `SELECT * FROM whatsapp.bot_flows WHERE tenant_id = $1 ORDER BY sort_order, created_at`,
      [tenantId],
    );
    return result.rows;
  }

  async createBotFlow(tenantId: string, dto: any) {
    const { name, trigger_keywords, response_type, response_content, buttons, list_sections, is_active, sort_order } = dto;
    return this.db.queryOne(
      `INSERT INTO whatsapp.bot_flows (tenant_id, name, trigger_keywords, response_type, response_content, buttons, list_sections, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, name, trigger_keywords || '{}', response_type || 'text', response_content,
       JSON.stringify(buttons || []), JSON.stringify(list_sections || []),
       is_active !== false, sort_order || 0],
    );
  }

  async updateBotFlow(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['name', 'trigger_keywords', 'response_type', 'response_content', 'is_active', 'sort_order'].includes(key)) {
        sets.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      } else if (['buttons', 'list_sections'].includes(key)) {
        sets.push(`${key} = $${idx}`);
        params.push(JSON.stringify(val));
        idx++;
      }
    }
    if (sets.length === 0) throw new BadRequestException('No valid fields');
    sets.push('updated_at = NOW()');

    const result = await this.db.queryOne(
      `UPDATE whatsapp.bot_flows SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );
    if (!result) throw new NotFoundException('Bot flow not found');
    return result;
  }

  async deleteBotFlow(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `DELETE FROM whatsapp.bot_flows WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId],
    );
    if (!result) throw new NotFoundException('Bot flow not found');
    return { deleted: true };
  }

  // ════════════════════════════════════════════
  // QUICK REPLIES
  // ════════════════════════════════════════════

  async listQuickReplies(tenantId: string) {
    const result = await this.db.query(
      `SELECT * FROM whatsapp.quick_replies WHERE tenant_id = $1 ORDER BY shortcut`,
      [tenantId],
    );
    return result.rows;
  }

  async createQuickReply(tenantId: string, dto: any) {
    const { shortcut, title, content, category } = dto;
    return this.db.queryOne(
      `INSERT INTO whatsapp.quick_replies (tenant_id, shortcut, title, content, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, shortcut, title, content, category || 'general'],
    );
  }

  async updateQuickReply(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['shortcut', 'title', 'content', 'category', 'is_active'].includes(key)) {
        sets.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
    }
    if (sets.length === 0) throw new BadRequestException('No valid fields');
    sets.push('updated_at = NOW()');

    const result = await this.db.queryOne(
      `UPDATE whatsapp.quick_replies SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );
    if (!result) throw new NotFoundException('Quick reply not found');
    return result;
  }

  async deleteQuickReply(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `DELETE FROM whatsapp.quick_replies WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId],
    );
    if (!result) throw new NotFoundException('Quick reply not found');
    return { deleted: true };
  }

  // ════════════════════════════════════════════
  // NOTIFICATION TEMPLATES
  // ════════════════════════════════════════════

  async listNotificationTemplates(tenantId: string) {
    const result = await this.db.query(
      `SELECT * FROM whatsapp.notification_templates WHERE tenant_id = $1 ORDER BY template_type, created_at`,
      [tenantId],
    );
    return result.rows;
  }

  async createNotificationTemplate(tenantId: string, dto: any) {
    const { name, template_type, content, variables } = dto;
    return this.db.queryOne(
      `INSERT INTO whatsapp.notification_templates (tenant_id, name, template_type, content, variables)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, name, template_type, content, variables || '{}'],
    );
  }

  async updateNotificationTemplate(tenantId: string, id: string, dto: any) {
    const sets: string[] = [];
    const params: any[] = [id, tenantId];
    let idx = 3;

    for (const [key, val] of Object.entries(dto)) {
      if (['name', 'template_type', 'content', 'variables', 'is_active'].includes(key)) {
        sets.push(`${key} = $${idx}`);
        params.push(key === 'variables' ? `{${val.join(',')}}` : val);
        idx++;
      }
    }
    if (sets.length === 0) throw new BadRequestException('No valid fields');
    sets.push('updated_at = NOW()');

    const result = await this.db.queryOne(
      `UPDATE whatsapp.notification_templates SET ${sets.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      params,
    );
    if (!result) throw new NotFoundException('Template not found');
    return result;
  }

  async deleteNotificationTemplate(tenantId: string, id: string) {
    const result = await this.db.queryOne(
      `DELETE FROM whatsapp.notification_templates WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId],
    );
    if (!result) throw new NotFoundException('Template not found');
    return { deleted: true };
  }

  // ════════════════════════════════════════════
  // WHATSAPP ORDERS
  // ════════════════════════════════════════════

  async listWhatsAppOrders(tenantId: string, filters: any) {
    const { status, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;
    const conditions = ['wo.tenant_id = $1'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (status) { conditions.push(`wo.status = $${idx}`); params.push(status); idx++; }

    const where = conditions.join(' AND ');
    const countResult = await this.db.query(
      `SELECT COUNT(*)::int as total FROM whatsapp.orders wo WHERE ${where}`, params,
    );
    const result = await this.db.query(
      `SELECT wo.* FROM whatsapp.orders wo WHERE ${where}
       ORDER BY wo.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return { data: result.rows, pagination: { total: countResult.rows[0].total, page, limit } };
  }

  async getWhatsAppOrder(tenantId: string, id: string) {
    const order = await this.db.queryOne(
      'SELECT * FROM whatsapp.orders WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    if (!order) throw new NotFoundException('WhatsApp order not found');
    return order;
  }

  async updateWhatsAppOrderStatus(tenantId: string, id: string, status: string) {
    const result = await this.db.queryOne(
      `UPDATE whatsapp.orders SET status = $3, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, status],
    );
    if (!result) throw new NotFoundException('WhatsApp order not found');
    return result;
  }

  async syncWhatsAppOrderToSales(tenantId: string, waOrderId: string, userId: string) {
    const waOrder = await this.getWhatsAppOrder(tenantId, waOrderId);
    if (waOrder.sales_order_id) throw new BadRequestException('Order already synced to sales');

    const orderNum = await this.db.queryOne(
      `SELECT 'SO-' || LPAD((COUNT(*) + 1)::text, 6, '0') as next_number FROM sales.sales_orders WHERE tenant_id = $1`,
      [tenantId],
    );

    const items = typeof waOrder.items === 'string' ? JSON.parse(waOrder.items) : (waOrder.items || []);
    const order = await this.db.queryOne(
      `INSERT INTO sales.sales_orders
        (tenant_id, order_number, status, order_type, channel, subtotal, tax_amount, shipping_amount, total, payment_status, shipping_address, created_by, notes)
       VALUES ($1, $2, 'confirmed', 'retail', 'whatsapp', $3, $4, $5, $6, 'unpaid', $7, $8, $9) RETURNING *`,
      [tenantId, orderNum.next_number, waOrder.subtotal, waOrder.tax_amount, waOrder.shipping_amount, waOrder.total,
       waOrder.shipping_address ? JSON.stringify(waOrder.shipping_address) : null, userId,
       `Synced from WhatsApp order ${waOrder.order_number}`],
    );

    for (const item of items) {
      await this.db.query(
        `INSERT INTO sales.order_items (order_id, product_id, variant_id, sku, name, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [order.id, item.productId || item.product_id, item.variantId || item.variant_id || null,
         item.sku || 'WA-ITEM', item.productName || item.name || 'WhatsApp Item',
         item.quantity, item.unitPrice || item.unit_price,
         (item.quantity || 0) * (item.unitPrice || item.unit_price || 0)],
      );
    }

    await this.db.query(
      `UPDATE whatsapp.orders SET sales_order_id = $3, synced_at = NOW(), status = 'synced', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [waOrderId, tenantId, order.id],
    );

    return { whatsapp_order_id: waOrderId, sales_order: order };
  }

  // ════════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════════

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

    const totalMessages = await this.db.queryOne(
      `SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE direction = 'inbound')::int as inbound,
        COUNT(*) FILTER (WHERE direction = 'outbound')::int as outbound
       FROM whatsapp.messages WHERE tenant_id = $1`,
      [tenantId],
    );

    const botFlowCount = await this.db.queryOne(
      `SELECT COUNT(*)::int as total FROM whatsapp.bot_flows WHERE tenant_id = $1 AND is_active = true`,
      [tenantId],
    );

    const templateCount = await this.db.queryOne(
      `SELECT COUNT(*)::int as total FROM whatsapp.notification_templates WHERE tenant_id = $1 AND is_active = true`,
      [tenantId],
    );

    return {
      ...result,
      recent_activity: recentActivity,
      messages: totalMessages,
      active_bot_flows: botFlowCount?.total || 0,
      active_templates: templateCount?.total || 0,
    };
  }

  async getDailyStats(tenantId: string, days: number) {
    const result = await this.db.query(
      `SELECT
        d.stat_date::text as date,
        COALESCE(s.messages_sent, 0) as messages_sent,
        COALESCE(s.messages_received, 0) as messages_received,
        COALESCE(s.conversations_opened, 0) as conversations_opened,
        COALESCE(s.orders_created, 0) as orders_created
       FROM generate_series(
         CURRENT_DATE - INTERVAL '1 day' * $2,
         CURRENT_DATE,
         INTERVAL '1 day'
       ) AS d(stat_date)
       LEFT JOIN whatsapp.daily_stats s ON s.stat_date = d.stat_date AND s.tenant_id = $1
       ORDER BY d.stat_date`,
      [tenantId, days],
    );
    return result.rows;
  }
}
