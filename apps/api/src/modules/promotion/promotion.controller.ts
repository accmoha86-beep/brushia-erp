import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionService } from './services/promotion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  @RequirePermissions('sales:read')
  async list(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.promotionService.list(user.tenantId, status);
  }

  @Get('validate/:code')
  @RequirePermissions('sales:read')
  async validate(@CurrentUser() user: any, @Param('code') code: string, @Query('order_amount') orderAmount?: string) {
    return this.promotionService.validateCode(user.tenantId, code, +(orderAmount || 0));
  }

  @Get(':id')
  @RequirePermissions('sales:read')
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.promotionService.getById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('sales:create')
  async create(@CurrentUser() user: any, @Body() dto: any) {
    return this.promotionService.create(user.tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('sales:write')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.promotionService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('sales:delete')
  async deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.promotionService.deactivate(user.tenantId, id);
  }
}