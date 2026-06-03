import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { WhatsAppMetaService } from './whatsapp-meta.service';

@Injectable()
export class WhatsAppNotificationsService {
  private readonly logger = new Logger(WhatsAppNotificationsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly meta: WhatsAppMetaService,
  ) {}

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmation(tenantId: string, dto: { phone: string; order_number: string; total: number; customer_name: string }) {
    const template = await this.db.queryOne(
      `SELECT * FROM whatsapp.notification_templates
       WHERE tenant_id = $1 AND template_type = 'order_confirmation' AND is_active = true LIMIT 1`,
      [tenantId],
    );

    let message = template?.content ||
      '✅ تم تأكيد طلبك رقم {{order_number}} بقيمة {{total}} جنيه. سيتم التحضير والشحن في أقرب وقت! 💄';

    message = message
      .replace(/\{\{order_number\}\}/g, dto.order_number)
      .replace(/\{\{total\}\}/g, String(dto.total))
      .replace(/\{\{customer_name\}\}/g, dto.customer_name);

    const result = await this.meta.sendText(dto.phone, message);

    // Track send count
    if (template) {
      await this.db.query(
        `UPDATE whatsapp.notification_templates SET send_count = send_count + 1 WHERE id = $1`,
        [template.id],
      );
    }

    return { sent: true, phone: dto.phone, message, meta_response: result };
  }

  /**
   * Send shipping update to customer
   */
  async sendShippingUpdate(tenantId: string, dto: { phone: string; order_number: string; tracking_number: string; delivery_date: string }) {
    const template = await this.db.queryOne(
      `SELECT * FROM whatsapp.notification_templates
       WHERE tenant_id = $1 AND template_type = 'shipping_update' AND is_active = true LIMIT 1`,
      [tenantId],
    );

    let message = template?.content ||
      '🚚 طلبك رقم {{order_number}} تم شحنه! رقم التتبع: {{tracking_number}}. التوصيل المتوقع: {{delivery_date}}';

    message = message
      .replace(/\{\{order_number\}\}/g, dto.order_number)
      .replace(/\{\{tracking_number\}\}/g, dto.tracking_number)
      .replace(/\{\{delivery_date\}\}/g, dto.delivery_date);

    const result = await this.meta.sendText(dto.phone, message);

    if (template) {
      await this.db.query(
        `UPDATE whatsapp.notification_templates SET send_count = send_count + 1 WHERE id = $1`,
        [template.id],
      );
    }

    return { sent: true, phone: dto.phone, message, meta_response: result };
  }

  /**
   * Broadcast promo to multiple phones
   */
  async sendPromoBroadcast(tenantId: string, dto: { phones: string[]; promo_details: string; promo_code: string; discount: number }) {
    const template = await this.db.queryOne(
      `SELECT * FROM whatsapp.notification_templates
       WHERE tenant_id = $1 AND template_type = 'promo_broadcast' AND is_active = true LIMIT 1`,
      [tenantId],
    );

    let messageTemplate = template?.content ||
      '🎉 عرض خاص من بروشيا! {{promo_details}} استخدمي كود: {{promo_code}} للحصول على خصم {{discount}}% 💄';

    messageTemplate = messageTemplate
      .replace(/\{\{promo_details\}\}/g, dto.promo_details)
      .replace(/\{\{promo_code\}\}/g, dto.promo_code)
      .replace(/\{\{discount\}\}/g, String(dto.discount));

    const results: { phone: string; success: boolean; error?: string }[] = [];

    for (const phone of dto.phones) {
      try {
        await this.meta.sendText(phone, messageTemplate);
        results.push({ phone, success: true });
      } catch (error) {
        this.logger.error(`Failed to send promo to ${phone}: ${error.message}`);
        results.push({ phone, success: false, error: error.message });
      }
    }

    if (template) {
      await this.db.query(
        `UPDATE whatsapp.notification_templates SET send_count = send_count + $2 WHERE id = $1`,
        [template.id, results.filter(r => r.success).length],
      );
    }

    return {
      total: dto.phones.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }
}
