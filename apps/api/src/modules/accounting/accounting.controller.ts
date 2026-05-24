import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountingService } from './services/accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateAccountDto, UpdateAccountDto, CreateJournalEntryDto, VoidJournalEntryDto,
  TrialBalanceQueryDto, ProfitLossQueryDto, BalanceSheetQueryDto,
} from './dto/accounting.dto';

@ApiTags('Accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ─── Chart of Accounts ─────────────────────────────────
  @Post('accounts')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Create account' })
  async createAccount(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateAccountDto)) dto: any,
  ) {
    return this.accountingService.createAccount(user.tenantId, user.id, dto);
  }

  @Get('accounts')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'List chart of accounts' })
  async getAccounts(
    @CurrentUser() user: any,
    @Query('account_type') accountType?: string,
    @Query('is_active') isActive?: string,
  ) {
    return this.accountingService.getChartOfAccounts(user.tenantId, {
      account_type: accountType,
      is_active: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('accounts/tree')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Get chart of accounts as tree' })
  async getAccountTree(@CurrentUser() user: any) {
    return this.accountingService.getAccountTree(user.tenantId);
  }

  // ─── Journal Entries ───────────────────────────────────
  @Post('journal-entries')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Create journal entry' })
  async createJournalEntry(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateJournalEntryDto)) dto: any,
  ) {
    return this.accountingService.createJournalEntry(user.tenantId, user.id, dto);
  }

  @Get('journal-entries')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'List journal entries' })
  async listJournalEntries(
    @CurrentUser() user: any,
    @Query('source') source?: string,
    @Query('status') status?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountingService.listJournalEntries(user.tenantId, {
      source, status, from_date: fromDate, to_date: toDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('journal-entries/:id')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Get journal entry with lines' })
  async getJournalEntry(@CurrentUser() user: any, @Param('id') id: string) {
    return this.accountingService.getJournalEntry(user.tenantId, id);
  }

  @Post('journal-entries/:id/post')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Post a draft journal entry' })
  async postEntry(@CurrentUser() user: any, @Param('id') id: string) {
    return this.accountingService.postJournalEntry(user.tenantId, user.id, id);
  }

  @Post('journal-entries/:id/void')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Void a posted entry (creates reversing entry)' })
  async voidEntry(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(VoidJournalEntryDto)) dto: any,
  ) {
    return this.accountingService.voidJournalEntry(user.tenantId, user.id, id, dto.reason);
  }

  // ─── Financial Reports ─────────────────────────────────
  @Get('reports/trial-balance')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Trial balance report' })
  async getTrialBalance(
    @CurrentUser() user: any,
    @Query('as_of_date') asOfDate?: string,
  ) {
    return this.accountingService.getTrialBalance(user.tenantId, asOfDate);
  }

  @Get('reports/profit-loss')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Profit & Loss statement' })
  async getProfitLoss(
    @CurrentUser() user: any,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    return this.accountingService.getProfitAndLoss(user.tenantId, fromDate, toDate);
  }

  @Get('reports/balance-sheet')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Balance sheet' })
  async getBalanceSheet(
    @CurrentUser() user: any,
    @Query('as_of_date') asOfDate: string,
  ) {
    return this.accountingService.getBalanceSheet(user.tenantId, asOfDate);
  }
}
