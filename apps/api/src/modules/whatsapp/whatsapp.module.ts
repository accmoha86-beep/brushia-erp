import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppService } from './services/whatsapp.service';
import { WhatsAppMetaService } from './services/whatsapp-meta.service';
import { WhatsAppBotService } from './services/whatsapp-bot.service';
import { WhatsAppNotificationsService } from './services/whatsapp-notifications.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [WhatsAppController, WhatsAppWebhookController],
  providers: [WhatsAppService, WhatsAppMetaService, WhatsAppBotService, WhatsAppNotificationsService],
  exports: [WhatsAppService, WhatsAppMetaService, WhatsAppBotService, WhatsAppNotificationsService],
})
export class WhatsAppModule {}
