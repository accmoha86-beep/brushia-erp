import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionService } from './services/commission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get()
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'List salespersons with commission stats' })
  async list(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commissionService.listSalespersons(user.tenantId, {
      search, status, page: +(page || 1), limit: +(limit || 50),
    });
  }

  @Get('rules')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'List commission rules' })
  async listRules(@CurrentUser() user: any) {
    return this.commissionService.listRules(user.tenantId);
  }

  @Get('report')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Commission report by date range' })
  async report(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.commissionService.getReport(user.tenantId, from, to);
  }

  @Get('salespersons/:id')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Get salesperson detail with commission history' })
  async getSalesperson(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commissionService.getSalesperson(user.tenantId, id);
  }

  @Post('salespersons')
  @RequirePermissions('reports:write')
  @ApiOperation({ summary: 'Create salesperson' })
  async createSalesperson(@CurrentUser() user: any, @Body() dto: any) {
    return this.commissionService.createSalesperson(user.tenantId, dto);
  }

  @Put('salespersons/:id')
  @RequirePermissions('reports:write')
  @ApiOperation({ summary: 'Update salesperson' })
  async updateSalesperson(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.commissionService.updateSalesperson(user.tenantId, id, dto);
  }

  @Post('calculate')
  @RequirePermissions('reports:write')
  @ApiOperation({ summary: 'Calculate commission for an order' })
  async calculate(@CurrentUser() user: any, @Body() dto: any) {
    return this.commissionService.calculateCommission(user.tenantId, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('reports:write')
  @ApiOperation({ summary: 'Approve a pending commission' })
  async approve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commissionService.approveCommission(user.tenantId, id, user.id);
  }

  @Post(':id/pay')
  @RequirePermissions('reports:write')
  @ApiOperation({ summary: 'Mark commission as paid' })
  async pay(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { payment_reference: string },
  ) {
    return this.commissionService.payCommission(user.tenantId, id, dto.payment_reference);
  }
}
