import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WarehouseService } from './services/warehouse.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @RequirePermissions('inventory:read')
  async list(@CurrentUser() user: any) {
    return this.warehouseService.list(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('inventory:read')
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.warehouseService.getById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('inventory:write')
  async create(@CurrentUser() user: any, @Body() dto: any) {
    return this.warehouseService.create(user.tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('inventory:write')
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.warehouseService.update(user.tenantId, id, dto);
  }

  @Get(':id/stock')
  @RequirePermissions('inventory:read')
  async getStock(@CurrentUser() user: any, @Param('id') id: string) {
    return this.warehouseService.getStock(user.tenantId, id);
  }

  @Get(':id/movements')
  @RequirePermissions('inventory:read')
  async getMovements(@CurrentUser() user: any, @Param('id') id: string) {
    return this.warehouseService.getMovements(user.tenantId, id);
  }
}