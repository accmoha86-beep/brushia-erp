import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Query, Body, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './services/whatsapp.service';
import { WhatsAppNotificationsService } from './services/whatsapp-notifications.service';
import { WhatsAppMetaService } from './services/whatsapp-meta.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly notificationsService: WhatsAppNotificationsService,
    private readonly metaService: WhatsAppMetaService,
  ) {}

  // ─── Conversations ───

  @Get('conversations')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List WhatsApp conversations' })
  async listConversations(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('assigned_to') assignedTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.whatsappService.listConversations(user.tenantId, {
      status, priority, search, assignedTo,
      page: +(page || 1), limit: +(limit || 50),
    });
  }

  @Get('conversations/:id')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Get conversation with messages' })
  async getConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.getConversation(user.tenantId, id);
  }

  @Post('conversations')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Create conversation' })
  async createConversation(@CurrentUser() user: any, @Body() dto: any) {
    return this.whatsappService.createConversation(user.tenantId, user.id, dto);
  }

  @Patch('conversations/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Update conversation' })
  async updateConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.whatsappService.updateConversation(user.tenantId, id, dto);
  }

  @Patch('conversations/:id/assign')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Assign conversation to agent' })
  async assignConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { assigned_to: string },
  ) {
    return this.whatsappService.updateConversation(user.tenantId, id, {
      assigned_to: dto.assigned_to,
    });
  }

  @Patch('conversations/:id/resolve')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Resolve conversation' })
  async resolveConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.resolveConversation(user.tenantId, id);
  }

  @Patch('conversations/:id/reopen')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Reopen conversation' })
  async reopenConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.updateConversation(user.tenantId, id, { status: 'open' });
  }

  @Patch('conversations/:id/toggle-bot')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Toggle bot on/off for conversation' })
  async toggleBot(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { enabled: boolean }) {
    return this.whatsappService.updateConversation(user.tenantId, id, { bot_enabled: dto.enabled });
  }

  // ─── Messages ───

  @Get('conversations/:id/messages')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Get conversation messages' })
  async getMessages(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.getMessages(user.tenantId, id);
  }

  @Post('conversations/:id/messages')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Send message (also sends via Meta API)' })
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const msg = await this.whatsappService.addMessage(user.tenantId, id, user.id, {
      ...dto,
      direction: 'outbound',
    });

    // Also send via Meta API if configured
    try {
      const convo = await this.whatsappService.getConversation(user.tenantId, id);
      if (convo.customer_phone && this.metaService.isConfigured()) {
        await this.metaService.sendText(convo.customer_phone, dto.content);
      }
    } catch (e) {
      // Log but don't fail — message is saved in DB regardless
    }

    return msg;
  }

  @Post('conversations/:id/messages/read')
  @RequirePermissions('sales:write')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark messages as read' })
  async markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.markMessagesRead(user.tenantId, id);
  }

  // ─── Convert to Order ───

  @Post('conversations/:id/convert')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Convert conversation to sales order' })
  async convert(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.whatsappService.convertToOrder(user.tenantId, id, user.id, dto);
  }

  // ─── Bot Flows ───

  @Get('bot-flows')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List bot flows' })
  async listBotFlows(@CurrentUser() user: any) {
    return this.whatsappService.listBotFlows(user.tenantId);
  }

  @Post('bot-flows')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Create bot flow' })
  async createBotFlow(@CurrentUser() user: any, @Body() dto: any) {
    return this.whatsappService.createBotFlow(user.tenantId, dto);
  }

  @Put('bot-flows/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Update bot flow' })
  async updateBotFlow(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.whatsappService.updateBotFlow(user.tenantId, id, dto);
  }

  @Delete('bot-flows/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Delete bot flow' })
  async deleteBotFlow(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.deleteBotFlow(user.tenantId, id);
  }

  // ─── Quick Replies ───

  @Get('quick-replies')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List quick replies' })
  async listQuickReplies(@CurrentUser() user: any) {
    return this.whatsappService.listQuickReplies(user.tenantId);
  }

  @Post('quick-replies')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Create quick reply' })
  async createQuickReply(@CurrentUser() user: any, @Body() dto: any) {
    return this.whatsappService.createQuickReply(user.tenantId, dto);
  }

  @Put('quick-replies/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Update quick reply' })
  async updateQuickReply(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.whatsappService.updateQuickReply(user.tenantId, id, dto);
  }

  @Delete('quick-replies/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Delete quick reply' })
  async deleteQuickReply(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.deleteQuickReply(user.tenantId, id);
  }

  // ─── Notification Templates ───

  @Get('notification-templates')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List notification templates' })
  async listTemplates(@CurrentUser() user: any) {
    return this.whatsappService.listNotificationTemplates(user.tenantId);
  }

  @Post('notification-templates')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Create notification template' })
  async createTemplate(@CurrentUser() user: any, @Body() dto: any) {
    return this.whatsappService.createNotificationTemplate(user.tenantId, dto);
  }

  @Put('notification-templates/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Update notification template' })
  async updateTemplate(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.whatsappService.updateNotificationTemplate(user.tenantId, id, dto);
  }

  @Delete('notification-templates/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Delete notification template' })
  async deleteTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.deleteNotificationTemplate(user.tenantId, id);
  }

  // ─── WhatsApp Orders ───

  @Get('orders')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List WhatsApp orders' })
  async listOrders(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.whatsappService.listWhatsAppOrders(user.tenantId, {
      status, page: +(page || 1), limit: +(limit || 50),
    });
  }

  @Get('orders/:id')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Get WhatsApp order detail' })
  async getOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.getWhatsAppOrder(user.tenantId, id);
  }

  @Patch('orders/:id/confirm')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Confirm WhatsApp order' })
  async confirmOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.updateWhatsAppOrderStatus(user.tenantId, id, 'confirmed');
  }

  @Patch('orders/:id/cancel')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Cancel WhatsApp order' })
  async cancelOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.updateWhatsAppOrderStatus(user.tenantId, id, 'cancelled');
  }

  @Post('orders/:id/sync-to-sales')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Sync WhatsApp order to main sales' })
  async syncToSales(@CurrentUser() user: any, @Param('id') id: string) {
    return this.whatsappService.syncWhatsAppOrderToSales(user.tenantId, id, user.id);
  }

  // ─── Notifications (Send) ───

  @Post('notifications/order-confirmation')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Send order confirmation notification' })
  async sendOrderConfirmation(@CurrentUser() user: any, @Body() dto: { phone: string; order_number: string; total: number; customer_name: string }) {
    return this.notificationsService.sendOrderConfirmation(user.tenantId, dto);
  }

  @Post('notifications/shipping-update')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Send shipping update notification' })
  async sendShippingUpdate(@CurrentUser() user: any, @Body() dto: { phone: string; order_number: string; tracking_number: string; delivery_date: string }) {
    return this.notificationsService.sendShippingUpdate(user.tenantId, dto);
  }

  @Post('notifications/promo-broadcast')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Broadcast promo to multiple phones' })
  async sendPromoBroadcast(@CurrentUser() user: any, @Body() dto: { phones: string[]; promo_details: string; promo_code: string; discount: number }) {
    return this.notificationsService.sendPromoBroadcast(user.tenantId, dto);
  }

  // ─── Stats & Connection ───

  @Get('stats')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'WhatsApp overview stats' })
  async stats(@CurrentUser() user: any) {
    return this.whatsappService.getStats(user.tenantId);
  }

  @Get('stats/daily')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Daily stats breakdown' })
  async dailyStats(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.whatsappService.getDailyStats(user.tenantId, +(days || 30));
  }

  @Get('connection-status')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Check Meta API connection status' })
  async connectionStatus() {
    return {
      configured: this.metaService.isConfigured(),
      status: this.metaService.isConfigured() ? 'connected' : 'not_configured',
    };
  }
}
