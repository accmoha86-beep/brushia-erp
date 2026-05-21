import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WholesaleService } from './services/wholesale.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Wholesale')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('wholesale')
export class WholesaleController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get('price-lists')
  @RequirePermissions('catalog:read')
  async listPriceLists(@CurrentUser() user: any) {
    return this.wholesaleService.listPriceLists(user.tenantId);
  }

  @Get('price-lists/:id')
  @RequirePermissions('catalog:read')
  async getPriceList(@CurrentUser() user: any, @Param('id') id: string) {
    return this.wholesaleService.getPriceList(user.tenantId, id);
  }

  @Post('price-lists')
  @RequirePermissions('catalog:create')
  async createPriceList(@CurrentUser() user: any, @Body() dto: any) {
    return this.wholesaleService.createPriceList(user.tenantId, dto);
  }

  @Put('price-lists/:id')
  @RequirePermissions('catalog:write')
  async updatePriceList(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.wholesaleService.updatePriceList(user.tenantId, id, dto);
  }

  @Post('price-lists/:id/items')
  @RequirePermissions('catalog:write')
  async addPriceListItems(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { items: any[] }) {
    return this.wholesaleService.addPriceListItems(user.tenantId, id, dto.items);
  }

  @Get('customer/:customerId/prices')
  @RequirePermissions('sales:read')
  async getCustomerPrices(@CurrentUser() user: any, @Param('customerId') customerId: string) {
    return this.wholesaleService.getCustomerPrices(user.tenantId, customerId);
  }
}