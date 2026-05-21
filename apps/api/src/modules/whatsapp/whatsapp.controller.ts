import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './services/whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('conversations')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List WhatsApp conversations' })
  async listConversations(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('assigned_to') assignedTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.whatsappService.listConversations(user.tenantId, {
      status, search, assignedTo, page: +(page || 1), limit: +(limit || 50),
    });
  }

  @Get('stats')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'WhatsApp statistics' })
  async stats(@CurrentUser() user: any) {
    return this.whatsappService.getStats(user.tenantId);
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

  @Put('conversations/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Update conversation' })
  async updateConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.whatsappService.updateConversation(user.tenantId, id, dto);
  }

  @Post('conversations/:id/messages')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Add message to conversation' })
  async addMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.whatsappService.addMessage(user.tenantId, id, user.id, dto);
  }

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
}
