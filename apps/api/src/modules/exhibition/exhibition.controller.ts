import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExhibitionService } from './services/exhibition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Exhibitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('exhibitions')
export class ExhibitionController {
  constructor(private readonly exhibitionService: ExhibitionService) {}

  @Get()
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'List exhibition events' })
  async list(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exhibitionService.list(user.tenantId, {
      status, city, page: +(page || 1), limit: +(limit || 50),
    });
  }

  @Get(':id')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Get event detail with expenses' })
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.exhibitionService.getById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Create exhibition event' })
  async create(@CurrentUser() user: any, @Body() dto: any) {
    return this.exhibitionService.create(user.tenantId, user.id, dto);
  }

  @Put(':id')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Update exhibition event' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.exhibitionService.update(user.tenantId, id, dto);
  }

  @Put(':id/status')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Update event status' })
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    return this.exhibitionService.updateStatus(user.tenantId, id, dto.status);
  }

  @Post(':id/expenses')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Add event expense' })
  async addExpense(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.exhibitionService.addExpense(user.tenantId, id, dto);
  }

  @Delete(':id/expenses/:expenseId')
  @RequirePermissions('inventory:write')
  @ApiOperation({ summary: 'Remove event expense' })
  async removeExpense(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.exhibitionService.removeExpense(user.tenantId, id, expenseId);
  }

  @Get(':id/pnl')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Get event P&L' })
  async getPnl(@CurrentUser() user: any, @Param('id') id: string) {
    return this.exhibitionService.getPnl(user.tenantId, id);
  }
}
