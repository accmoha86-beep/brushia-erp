import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './services/inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { IdempotencyKey } from '../../common/decorators/idempotency.decorator';
import {
  RecordMovementDto, BulkMovementDto, ReserveStockDto, ReleaseReservationDto,
  TransferStockDto, StockQueryDto, MovementQueryDto,
} from './dto/inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Stock Levels ──────────────────────────────────────
  @Get('stock')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'List stock levels with filters' })
  async getStockLevels(
    @CurrentUser() user: any,
    @Query(new ZodValidationPipe(StockQueryDto)) query: any,
  ) {
    return this.inventoryService.getStockLevels(user.tenantId, query);
  }

  @Get('stock/availability')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Check stock availability for items' })
  async checkAvailability(
    @CurrentUser() user: any,
    @Body() items: Array<{ product_id: string; variant_id?: string; location_id: string; quantity: number }>,
  ) {
    return this.inventoryService.checkAvailability(user.tenantId, items);
  }

  @Get('valuation')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Get inventory valuation report' })
  async getValuation(
    @CurrentUser() user: any,
    @Query('location_id') locationId?: string,
  ) {
    return this.inventoryService.getInventoryValuation(user.tenantId, locationId);
  }

  // ─── Movements ─────────────────────────────────────────
  @Post('movements')
  @RequirePermissions('inventory:write')
  @IdempotencyKey()
  @ApiOperation({ summary: 'Record a single stock movement' })
  async recordMovement(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(RecordMovementDto)) dto: any,
  ) {
    return this.inventoryService.recordMovement(user.tenantId, user.id, dto);
  }

  @Post('movements/bulk')
  @RequirePermissions('inventory:write')
  @IdempotencyKey()
  @ApiOperation({ summary: 'Record multiple movements atomically' })
  async recordBulkMovements(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(BulkMovementDto)) dto: any,
  ) {
    return this.inventoryService.recordBulkMovements(user.tenantId, user.id, dto);
  }

  @Get('movements')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'List stock movement history' })
  async getMovements(
    @CurrentUser() user: any,
    @Query(new ZodValidationPipe(MovementQueryDto)) query: any,
  ) {
    return this.inventoryService.getMovements(user.tenantId, query);
  }

  // ─── Reservations ──────────────────────────────────────
  @Post('reservations')
  @RequirePermissions('inventory:write')
  @IdempotencyKey()
  @ApiOperation({ summary: 'Reserve stock for a pending order' })
  async reserveStock(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(ReserveStockDto)) dto: any,
  ) {
    return this.inventoryService.reserveStock(user.tenantId, user.id, dto);
  }

  @Post('reservations/:id/release')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Release or fulfill a stock reservation' })
  async releaseReservation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReleaseReservationDto)) dto: any,
  ) {
    return this.inventoryService.releaseReservation(user.tenantId, user.id, id, dto.convert_to_movement);
  }

  // ─── Transfers ─────────────────────────────────────────
  @Post('transfers')
  @RequirePermissions('inventory:write')
  @IdempotencyKey()
  @ApiOperation({ summary: 'Transfer stock between locations' })
  async transferStock(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(TransferStockDto)) dto: any,
  ) {
    return this.inventoryService.transferStock(user.tenantId, user.id, dto);
  }
}