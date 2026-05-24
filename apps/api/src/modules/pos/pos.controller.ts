import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { POSService } from './services/pos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateRegisterDto, OpenSessionDto, CloseSessionDto,
  POSTransactionDto, HoldOrderDto, CashMovementDto,
} from './dto/pos.dto';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pos')
export class POSController {
  constructor(private readonly posService: POSService) {}

  // ─── Registers ─────────────────────────────────────────
  @Get('registers')
  @RequirePermissions('pos:read')
  @ApiOperation({ summary: 'List POS registers' })
  async listRegisters(
    @CurrentUser() user: any,
    @Query('location_id') locationId?: string,
  ) {
    return this.posService.listRegisters(user.tenantId, locationId);
  }

  @Post('registers')
  @RequirePermissions('pos:manage')
  @ApiOperation({ summary: 'Create POS register' })
  async createRegister(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateRegisterDto)) dto: any,
  ) {
    return this.posService.createRegister(user.tenantId, user.id, dto);
  }

  // ─── Sessions ──────────────────────────────────────────
  @Post('sessions/open')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Open a POS session (start shift)' })
  async openSession(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(OpenSessionDto)) dto: any,
  ) {
    return this.posService.openSession(user.tenantId, user.id, dto);
  }

  @Post('sessions/:id/close')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Close a POS session (end shift)' })
  async closeSession(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CloseSessionDto)) dto: any,
  ) {
    return this.posService.closeSession(user.tenantId, user.id, id, dto);
  }

  @Get('sessions/active')
  @RequirePermissions('pos:read')
  @ApiOperation({ summary: 'Get current user active session' })
  async getActiveSession(@CurrentUser() user: any) {
    return this.posService.getActiveSession(user.tenantId, user.id);
  }

  // ─── Transactions ──────────────────────────────────────
  @Post('transactions')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Process a POS sale' })
  async processSale(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(POSTransactionDto)) dto: any,
  ) {
    return this.posService.processSale(user.tenantId, user.id, dto);
  }

  @Post('test-transaction')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Debug POS transaction' })
  async testTransaction(
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    try {
      return await this.posService.processSale(user.tenantId, user.id, dto);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        detail: error.detail,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 5),
      };
    }
  }

  // ─── Held Orders ───────────────────────────────────────
  @Post('held-orders')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Hold (park) an order' })
  async holdOrder(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(HoldOrderDto)) dto: any,
  ) {
    return this.posService.holdOrder(user.tenantId, user.id, dto);
  }

  @Get('held-orders/:sessionId')
  @RequirePermissions('pos:read')
  @ApiOperation({ summary: 'List held orders for a session' })
  async listHeldOrders(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.posService.listHeldOrders(user.tenantId, sessionId);
  }

  @Post('held-orders/:id/retrieve')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Retrieve a held order back to cart' })
  async retrieveHeldOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.posService.retrieveHeldOrder(user.tenantId, user.id, id);
  }

  @Post('held-orders/:id/void')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Void a held order' })
  async voidHeldOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.posService.voidHeldOrder(user.tenantId, user.id, id);
  }

  // ─── Cash Movements ───────────────────────────────────
  @Post('cash-movements')
  @RequirePermissions('pos:create')
  @ApiOperation({ summary: 'Record cash in/out movement' })
  async recordCashMovement(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CashMovementDto)) dto: any,
  ) {
    return this.posService.recordCashMovement(user.tenantId, user.id, dto);
  }

  // ─── Summaries ─────────────────────────────────────────
  @Get('daily-summary/:registerId')
  @RequirePermissions('pos:read')
  @ApiOperation({ summary: 'Get daily summary for a register' })
  async getDailySummary(
    @CurrentUser() user: any,
    @Param('registerId') registerId: string,
    @Query('date') date?: string,
  ) {
    return this.posService.getDailySummary(user.tenantId, registerId, date);
  }

  @Get('sales-summary/:locationId')
  @RequirePermissions('pos:read')
  @ApiOperation({ summary: 'Get sales summary for a location over date range' })
  async getSalesSummary(
    @CurrentUser() user: any,
    @Param('locationId') locationId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.posService.getSalesSummary(user.tenantId, locationId, from, to);
  }
}
