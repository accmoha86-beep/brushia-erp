import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportingService } from './services/reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('dashboard')
  @RequirePermissions('reports:read')
  async getDashboard(@CurrentUser() user: any) {
    return this.reportingService.getDashboard(user.tenantId);
  }

  @Get('sales-summary')
  @RequirePermissions('reports:read')
  async getSalesSummary(@CurrentUser() user: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportingService.getSalesSummary(user.tenantId, from, to);
  }

  @Get('inventory-summary')
  @RequirePermissions('reports:read')
  async getInventorySummary(@CurrentUser() user: any) {
    return this.reportingService.getInventorySummary(user.tenantId);
  }

  @Get('top-products')
  @RequirePermissions('reports:read')
  async getTopProducts(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.reportingService.getTopProducts(user.tenantId, +(limit || 10));
  }

  @Get('revenue-by-day')
  @RequirePermissions('reports:read')
  async getRevenueByDay(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.reportingService.getRevenueByDay(user.tenantId, +(days || 7));
  }

  @Get('customer-insights')
  @RequirePermissions('reports:read')
  async getCustomerInsights(@CurrentUser() user: any) {
    return this.reportingService.getCustomerInsights(user.tenantId);
  }

  @Get('commission-report')
  @RequirePermissions('reports:read')
  async getCommissionReport(@CurrentUser() user: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportingService.getCommissionReport(user.tenantId, from, to);
  }
}