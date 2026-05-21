import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendMessagePayload {
  to: string;
  type: 'text' | 'interactive' | 'image' | 'template';
  text?: { body: string; preview_url?: boolean };
  interactive?: any;
  image?: { link: string; caption?: string };
  template?: any;
}

@Injectable()
export class WhatsAppMetaService {
  private readonly logger = new Logger(WhatsAppMetaService.name);
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly verifyToken: string;
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN', 'brushia-whatsapp-verify-2024');
    this.apiUrl = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
    this.configured = !!(this.phoneNumberId && this.accessToken);

    if (!this.configured) {
      this.logger.warn('WhatsApp Cloud API not configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN');
    }
  }

  isConfigured(): boolean { return this.configured; }
  getVerifyToken(): string { return this.verifyToken; }

  async sendMessage(payload: SendMessagePayload): Promise<any> {
    if (!this.configured) {
      this.logger.warn('WhatsApp not configured, message not sent');
      return { status: 'not_configured', message: 'WhatsApp API credentials not set' };
    }

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: payload.to,
      type: payload.type,
      ...(payload.text && { text: payload.text }),
      ...(payload.interactive && { interactive: payload.interactive }),
      ...(payload.image && { image: payload.image }),
      ...(payload.template && { template: payload.template }),
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`WhatsApp API error: ${JSON.stringify(data)}`);
        throw new Error(data.error?.message || 'WhatsApp API error');
      }
      this.logger.log(`Message sent to ${payload.to}: ${payload.type}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
      throw error;
    }
  }

  // ---- Helper methods for common message types ----

  async sendText(to: string, text: string): Promise<any> {
    return this.sendMessage({ to, type: 'text', text: { body: text } });
  }

  async sendButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.title.substring(0, 20) },
          })),
        },
      },
    });
  }

  async sendList(to: string, bodyText: string, buttonText: string, sections: any[]): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText.substring(0, 20),
          sections: sections.map(s => ({
            title: s.title?.substring(0, 24),
            rows: s.rows.slice(0, 10).map((r: any) => ({
              id: r.id,
              title: r.title?.substring(0, 24),
              description: r.description?.substring(0, 72),
            })),
          })),
        },
      },
    });
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<any> {
    return this.sendMessage({ to, type: 'image', image: { link: imageUrl, caption } });
  }

  async markAsRead(messageId: string): Promise<void> {
    if (!this.configured) return;
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });
    } catch (e) {
      this.logger.warn(`Failed to mark message ${messageId} as read`);
    }
  }
}
