import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './services/sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { IdempotencyKey } from '../../common/decorators/idempotency.decorator';
import { CreateSalesOrderDto, CancelOrderDto, OrderQueryDto } from './dto/sales.dto';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('orders')
  @RequirePermissions('sales:create')
  @IdempotencyKey()
  @ApiOperation({ summary: 'Create a sales order (POS, web, WhatsApp, wholesale)' })
  async createOrder(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateSalesOrderDto)) dto: any,
  ) {
    try {
      return await this.salesService.createOrder(user.tenantId, user.id, dto);
    } catch (error) {
      console.error('CREATE_ORDER_ERROR:', error);
      throw error;
    }
  }

  @Get('orders')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'List orders with filters' })
  async listOrders(
    @CurrentUser() user: any,
    @Query(new ZodValidationPipe(OrderQueryDto)) query: any,
  ) {
    return this.salesService.listOrders(user.tenantId, query);
  }

  @Get('orders/:id')
  @RequirePermissions('sales:read')
  @ApiOperation({ summary: 'Get order details with items and payments' })
  async getOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.salesService.getOrder(user.tenantId, id);
  }

  @Post('orders/:id/cancel')
  @RequirePermissions('sales:delete')
  @ApiOperation({ summary: 'Cancel an order with optional restocking' })
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelOrderDto)) dto: any,
  ) {
    return this.salesService.cancelOrder(user.tenantId, user.id, id, dto);
  }

  @Post('orders/:id/payments')
  @RequirePermissions('sales:create')
  @ApiOperation({ summary: 'Record additional payment for order' })
  async recordPayment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() payment: { method: string; amount: number; reference?: string },
  ) {
    return this.salesService.recordPayment(user.tenantId, user.id, id, payment);
  }

  @Post('test-sale')
  @RequirePermissions('sales:create')
  @ApiOperation({ summary: 'Test sale — returns detailed errors' })
  async testSale(
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    try {
      const result = await this.salesService.createOrder(user.tenantId, user.id, dto);
      return { success: true, result };
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

}
