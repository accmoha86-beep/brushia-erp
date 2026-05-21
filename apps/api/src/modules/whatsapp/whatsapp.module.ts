import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppService } from './services/whatsapp.service';
import { WhatsAppMetaService } from './services/whatsapp-meta.service';
import { WhatsAppBotService } from './services/whatsapp-bot.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [WhatsAppController, WhatsAppWebhookController],
  providers: [WhatsAppService, WhatsAppMetaService, WhatsAppBotService],
  exports: [WhatsAppService, WhatsAppMetaService, WhatsAppBotService],
})
export class WhatsAppModule {}
