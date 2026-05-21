import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './services/loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('tiers')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List loyalty tiers' })
  async listTiers(@CurrentUser() user: any) {
    return this.loyaltyService.listTiers(user.tenantId);
  }

  @Post('tiers')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Create loyalty tier' })
  async createTier(@CurrentUser() user: any, @Body() dto: any) {
    return this.loyaltyService.createTier(user.tenantId, dto);
  }

  @Put('tiers/:id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Update loyalty tier' })
  async updateTier(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.loyaltyService.updateTier(user.tenantId, id, dto);
  }

  @Get('transactions')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List loyalty transactions' })
  async listTransactions(
    @CurrentUser() user: any,
    @Query('customer_id') customerId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.loyaltyService.listTransactions(user.tenantId, {
      customerId, type, page: +(page || 1), limit: +(limit || 50),
    });
  }

  @Post('earn')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Earn loyalty points' })
  async earn(@CurrentUser() user: any, @Body() dto: any) {
    return this.loyaltyService.earnPoints(user.tenantId, user.id, dto);
  }

  @Post('redeem')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Redeem loyalty points' })
  async redeem(@CurrentUser() user: any, @Body() dto: any) {
    return this.loyaltyService.redeemPoints(user.tenantId, user.id, dto);
  }

  @Get('stats')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Loyalty program statistics' })
  async stats(@CurrentUser() user: any) {
    return this.loyaltyService.getStats(user.tenantId);
  }
}
