import { Controller, Get, Post, Query, Body, Res, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { WhatsAppMetaService } from './services/whatsapp-meta.service';
import { WhatsAppBotService } from './services/whatsapp-bot.service';

@ApiTags('WhatsApp Webhook')
@Controller('webhook/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly metaService: WhatsAppMetaService,
    private readonly botService: WhatsAppBotService,
  ) {}

  /**
   * Webhook verification — Meta sends GET request to verify
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: any,
  ) {
    this.logger.log(`Webhook verification: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === this.metaService.getVerifyToken()) {
      this.logger.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    }

    this.logger.warn('Webhook verification failed');
    return res.status(403).send('Forbidden');
  }

  /**
   * Incoming messages — Meta sends POST with message data
   */
  @Public()
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive WhatsApp messages' })
  async receiveMessage(@Body() body: any) {
    this.logger.log(`Webhook received: ${JSON.stringify(body).substring(0, 500)}`);

    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return { status: 'ok' };
      }

      // Handle message status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          this.logger.log(`Message ${status.id} status: ${status.status}`);
        }
        return { status: 'ok' };
      }

      // Handle incoming messages
      const messages = value.messages;
      if (!messages || messages.length === 0) {
        return { status: 'ok' };
      }

      for (const message of messages) {
        const phone = message.from;
        const waMessageId = message.id;
        const messageType = message.type;

        let content = '';
        let buttonPayload: string | undefined;
        let listPayload: string | undefined;

        switch (messageType) {
          case 'text':
            content = message.text?.body || '';
            break;
          case 'interactive':
            if (message.interactive?.type === 'button_reply') {
              buttonPayload = message.interactive.button_reply?.id;
              content = message.interactive.button_reply?.title || '';
            } else if (message.interactive?.type === 'list_reply') {
              listPayload = message.interactive.list_reply?.id;
              content = message.interactive.list_reply?.title || '';
            }
            break;
          case 'image':
            content = message.image?.caption || '[Image]';
            break;
          case 'document':
            content = '[Document]';
            break;
          case 'location':
            content = `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
            break;
          default:
            content = `[${messageType}]`;
        }

        // Process through bot engine
        await this.botService.processIncomingMessage(
          phone, waMessageId, messageType, content, buttonPayload, listPayload,
        );
      }
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
      // Always return 200 to Meta to prevent retries
    }

    return { status: 'ok' };
  }
}
