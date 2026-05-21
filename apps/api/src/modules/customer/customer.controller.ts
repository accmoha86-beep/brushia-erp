import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './services/customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List customers with filters' })
  async list(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('tier') tier?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerService.list(user.tenantId, { search, type, tier, city, page: +(page||1), limit: +(limit||50) });
  }

  @Get('stats')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Get customer statistics' })
  async getStats(@CurrentUser() user: any) {
    return this.customerService.getStats(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Get customer details' })
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customerService.getById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('sales:create')
  @ApiOperation({ summary: 'Create a customer' })
  async create(@CurrentUser() user: any, @Body() dto: any) {
    return this.customerService.create(user.tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Update a customer' })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.customerService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('sales:delete')
  @ApiOperation({ summary: 'Deactivate a customer' })
  async deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customerService.deactivate(user.tenantId, id);
  }

  @Get(':id/orders')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Get customer order history' })
  async getOrders(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customerService.getOrders(user.tenantId, id);
  }

  @Post(':id/loyalty/add')
  @RequirePermissions('sales:write')
  @ApiOperation({ summary: 'Add loyalty points' })
  async addLoyaltyPoints(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { points: number; reason: string }) {
    return this.customerService.addLoyaltyPoints(user.tenantId, id, dto.points, dto.reason);
  }
}