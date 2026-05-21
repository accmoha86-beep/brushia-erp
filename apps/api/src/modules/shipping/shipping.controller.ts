import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './services/shipping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('shipments')
  @RequirePermissions('shipping:read')
  async list(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.shippingService.list(user.tenantId, status);
  }

  @Get('shipments/:id')
  @RequirePermissions('shipping:read')
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.shippingService.getById(user.tenantId, id);
  }

  @Post('shipments')
  @RequirePermissions('shipping:create')
  async create(@CurrentUser() user: any, @Body() dto: any) {
    return this.shippingService.create(user.tenantId, user.id, dto);
  }

  @Put('shipments/:id/status')
  @RequirePermissions('shipping:write')
  async updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { status: string; tracking_number?: string }) {
    return this.shippingService.updateStatus(user.tenantId, id, dto);
  }

  @Get('stats')
  @RequirePermissions('shipping:read')
  async getStats(@CurrentUser() user: any) {
    return this.shippingService.getStats(user.tenantId);
  }

  @Get('governorates')
  async getGovernorates() {
    return { data: ['Cairo','Giza','Alexandria','Qalyubia','Dakahlia','Sharqia','Gharbia','Monufia','Beheira','Kafr El Sheikh','Damietta','Port Said','Ismailia','Suez','North Sinai','South Sinai','Red Sea','New Valley','Matrouh','Fayoum','Beni Suef','Minya','Asyut','Sohag','Qena','Luxor','Aswan'] };
  }
}