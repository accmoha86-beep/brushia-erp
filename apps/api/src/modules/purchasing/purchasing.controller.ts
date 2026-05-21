import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasingService } from './services/purchasing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Purchasing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  // ─── Vendors ───────────────────────────────────────────
  @Get('vendors')
  @RequirePermissions('purchasing:read')
  async listVendors(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.purchasingService.listVendors(user.tenantId, search);
  }

  @Get('vendors/:id')
  @RequirePermissions('purchasing:read')
  async getVendor(@CurrentUser() user: any, @Param('id') id: string) {
    return this.purchasingService.getVendor(user.tenantId, id);
  }

  @Post('vendors')
  @RequirePermissions('purchasing:create')
  async createVendor(@CurrentUser() user: any, @Body() dto: any) {
    return this.purchasingService.createVendor(user.tenantId, dto);
  }

  @Put('vendors/:id')
  @RequirePermissions('purchasing:write')
  async updateVendor(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.purchasingService.updateVendor(user.tenantId, id, dto);
  }

  // ─── Purchase Orders ───────────────────────────────────
  @Get('orders')
  @RequirePermissions('purchasing:read')
  async listPOs(@CurrentUser() user: any, @Query('status') status?: string, @Query('vendor_id') vendorId?: string) {
    return this.purchasingService.listPOs(user.tenantId, { status, vendorId });
  }

  @Get('orders/:id')
  @RequirePermissions('purchasing:read')
  async getPO(@CurrentUser() user: any, @Param('id') id: string) {
    return this.purchasingService.getPO(user.tenantId, id);
  }

  @Post('orders')
  @RequirePermissions('purchasing:create')
  async createPO(@CurrentUser() user: any, @Body() dto: any) {
    return this.purchasingService.createPO(user.tenantId, user.id, dto);
  }

  @Put('orders/:id/status')
  @RequirePermissions('purchasing:write')
  async updatePOStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.purchasingService.updatePOStatus(user.tenantId, id, dto.status);
  }

  @Post('orders/:id/receive')
  @RequirePermissions('purchasing:write')
  @ApiOperation({ summary: 'Receive goods against a PO' })
  async receivePO(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.purchasingService.receivePO(user.tenantId, user.id, id, dto);
  }

  @Get('stats')
  @RequirePermissions('purchasing:read')
  async getStats(@CurrentUser() user: any) {
    return this.purchasingService.getStats(user.tenantId);
  }
}