import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockCountingService } from './services/stock-counting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Stock Counts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock-counts')
export class StockCountingController {
  constructor(private readonly stockCountingService: StockCountingService) {}

  @Get()
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'List stock counts' })
  async list(
    @CurrentUser() user: any,
    @Query('warehouse_id') warehouseId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockCountingService.list(user.tenantId, {
      warehouseId, status, page: +(page || 1), limit: +(limit || 50),
    });
  }

  @Get(':id')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Get stock count detail with items' })
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stockCountingService.getById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Create stock count' })
  async create(@CurrentUser() user: any, @Body() dto: any) {
    return this.stockCountingService.create(user.tenantId, user.id, dto);
  }

  @Put(':id/items')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Update counted quantities' })
  async updateItems(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { items: Array<{ id: string; counted_qty: number }> },
  ) {
    return this.stockCountingService.updateItems(user.tenantId, id, dto.items);
  }

  @Post(':id/complete')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Complete stock count' })
  async complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stockCountingService.complete(user.tenantId, id, user.id);
  }

  @Post(':id/cancel')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Cancel stock count' })
  async cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.stockCountingService.cancel(user.tenantId, id);
  }
}
