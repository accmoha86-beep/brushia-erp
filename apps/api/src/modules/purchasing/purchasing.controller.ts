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

  // ═══ Vendors ═══════════════════════════════════════
  @Get('vendors')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'List all vendors' })
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

  // ═══ Purchase Orders ═══════════════════════════════
  @Get('orders')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'List purchase orders with filters' })
  async listPOs(@CurrentUser() user: any, @Query('status') status?: string, @Query('vendor_id') vendorId?: string) {
    return this.purchasingService.listPOs(user.tenantId, { status, vendorId });
  }

  @Get('orders/:id')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'Get PO with items and GRNs' })
  async getPO(@CurrentUser() user: any, @Param('id') id: string) {
    return this.purchasingService.getPO(user.tenantId, id);
  }

  @Post('orders')
  @RequirePermissions('purchasing:create')
  @ApiOperation({ summary: 'Create purchase order with items and landed costs' })
  async createPO(@CurrentUser() user: any, @Body() dto: any) {
    return this.purchasingService.createPO(user.tenantId, user.id, dto);
  }

  @Put('orders/:id')
  @RequirePermissions('purchasing:write')
  @ApiOperation({ summary: 'Update PO details (draft/submitted only)' })
  async updatePO(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.purchasingService.updatePO(user.tenantId, id, dto);
  }

  @Put('orders/:id/status')
  @RequirePermissions('purchasing:write')
  @ApiOperation({ summary: 'Update PO status (with transition validation)' })
  async updatePOStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.purchasingService.updatePOStatus(user.tenantId, id, dto.status, user.id);
  }

  @Post('orders/:id/receive')
  @RequirePermissions('purchasing:write')
  @ApiOperation({ summary: 'Receive goods against a PO (legacy — creates GRN)' })
  async receivePO(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.purchasingService.receivePO(user.tenantId, user.id, id, dto);
  }

  // ═══ Goods Receive Notes (GRN) ═════════════════════
  @Get('grn')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'List all goods receive notes' })
  async listGRNs(@CurrentUser() user: any, @Query('po_id') poId?: string) {
    return this.purchasingService.listGRNs(user.tenantId, poId);
  }

  @Get('grn/:id')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'Get GRN with items' })
  async getGRN(@CurrentUser() user: any, @Param('id') id: string) {
    return this.purchasingService.getGRN(user.tenantId, id);
  }

  @Post('grn')
  @RequirePermissions('purchasing:create')
  @ApiOperation({ summary: 'Create goods receive note from PO' })
  async createGRN(@CurrentUser() user: any, @Body() dto: any) {
    return this.purchasingService.createGRN(user.tenantId, user.id, dto);
  }

  @Post('grn/:id/accept')
  @RequirePermissions('purchasing:write')
  @ApiOperation({ summary: 'Accept/reject GRN items — updates stock levels' })
  async acceptGRN(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.purchasingService.acceptGRN(user.tenantId, user.id, id, dto);
  }

  // ═══ Vendor Bills ══════════════════════════════════
  @Get('bills')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'List vendor bills' })
  async listBills(@CurrentUser() user: any, @Query('status') status?: string, @Query('vendor_id') vendorId?: string) {
    return this.purchasingService.listBills(user.tenantId, { status, vendorId });
  }

  @Get('bills/:id')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'Get bill with payments' })
  async getBill(@CurrentUser() user: any, @Param('id') id: string) {
    return this.purchasingService.getBill(user.tenantId, id);
  }

  @Post('bills')
  @RequirePermissions('purchasing:create')
  @ApiOperation({ summary: 'Create vendor bill' })
  async createBill(@CurrentUser() user: any, @Body() dto: any) {
    return this.purchasingService.createBill(user.tenantId, user.id, dto);
  }

  @Put('bills/:id/status')
  @RequirePermissions('purchasing:write')
  @ApiOperation({ summary: 'Update bill status' })
  async updateBillStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.purchasingService.updateBillStatus(user.tenantId, id, dto.status);
  }

  @Post('bills/:id/pay')
  @RequirePermissions('purchasing:write')
  @ApiOperation({ summary: 'Record payment against a vendor bill' })
  async payBill(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.purchasingService.payBill(user.tenantId, user.id, id, dto);
  }

  // ═══ Stats ═════════════════════════════════════════
  @Get('stats')
  @RequirePermissions('purchasing:read')
  @ApiOperation({ summary: 'Purchasing dashboard stats' })
  async getStats(@CurrentUser() user: any) {
    return this.purchasingService.getStats(user.tenantId);
  }
}
