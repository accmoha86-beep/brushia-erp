import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
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

  @Get("accounts/:id")
  @RequirePermissions("accounting:read")
  @ApiOperation({ summary: "Get account by ID" })
  async getAccountById(@CurrentUser() user: any, @Param("id") id: string) {
    return this.accountingService.getAccountById(user.tenantId, id);
  }

  @Put("accounts/:id")
  @RequirePermissions("accounting:write")
  @ApiOperation({ summary: "Update account" })
  async updateAccount(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.accountingService.updateAccount(user.tenantId, user.id, id, dto);
  }

  @Delete("accounts/:id")
  @RequirePermissions("accounting:write")
  @ApiOperation({ summary: "Delete account" })
  async deleteAccount(@CurrentUser() user: any, @Param("id") id: string) {
    return this.accountingService.deleteAccount(user.tenantId, user.id, id);
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

  // ─── Cost Centers (مراكز التكلفة) ────────────────────────

  @Get('cost-centers')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'List cost centers' })
  async getCostCenters(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('is_active') isActive?: string,
  ) {
    return this.accountingService.getCostCenters(user.tenantId, {
      type,
      is_active: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('cost-centers/comparison')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Compare cost centers side by side' })
  async getCostCenterComparison(
    @CurrentUser() user: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.accountingService.getCostCenterComparison(user.tenantId, startDate, endDate);
  }

  @Get('cost-centers/:id')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Get cost center details' })
  async getCostCenterById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.accountingService.getCostCenterById(user.tenantId, id);
  }

  @Get('cost-centers/:id/report')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Get cost center P&L report' })
  async getCostCenterReport(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.accountingService.getCostCenterReport(user.tenantId, id, startDate, endDate);
  }

  @Post('cost-centers')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Create cost center' })
  async createCostCenter(
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.accountingService.createCostCenter(user.tenantId, dto);
  }

  @Put('cost-centers/:id')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Update cost center' })
  async updateCostCenter(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.accountingService.updateCostCenter(user.tenantId, id, dto);
  }

  @Delete('cost-centers/:id')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Delete cost center' })
  async deleteCostCenter(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.accountingService.deleteCostCenter(user.tenantId, id);
  }

  // ─── Auxiliary Accounts (حسابات مساعدة) ────────────────────

  @Get('auxiliary-accounts')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'List auxiliary accounts (sub-ledgers)' })
  async getAuxiliaryAccounts(
    @CurrentUser() user: any,
    @Query('entity_type') entityType?: string,
    @Query('account_id') accountId?: string,
  ) {
    return this.accountingService.getAuxiliaryAccounts(user.tenantId, { entity_type: entityType, account_id: accountId });
  }

  @Get('auxiliary-accounts/:id')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Get auxiliary account details' })
  async getAuxiliaryAccountById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.accountingService.getAuxiliaryAccountById(user.tenantId, id);
  }

  @Get('auxiliary-accounts/:id/statement')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Get auxiliary account statement' })
  async getAuxiliaryStatement(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.accountingService.getAuxiliaryStatement(user.tenantId, id, startDate, endDate);
  }

  @Post('auxiliary-accounts')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Create auxiliary account' })
  async createAuxiliaryAccount(@CurrentUser() user: any, @Body() dto: any) {
    return this.accountingService.createAuxiliaryAccount(user.tenantId, dto);
  }

  @Put('auxiliary-accounts/:id')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Update auxiliary account' })
  async updateAuxiliaryAccount(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.accountingService.updateAuxiliaryAccount(user.tenantId, id, dto);
  }

  // ─── Bank Accounts ────────────────────────────────────────

  @Get('bank-accounts')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'List bank accounts' })
  async getBankAccounts(@CurrentUser() user: any) {
    return this.accountingService.getBankAccounts(user.tenantId);
  }

  @Post('bank-accounts')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Create bank account' })
  async createBankAccount(@CurrentUser() user: any, @Body() dto: any) {
    return this.accountingService.createBankAccount(user.tenantId, dto);
  }

  @Put('bank-accounts/:id')
  @RequirePermissions('accounting:write')
  @ApiOperation({ summary: 'Update bank account' })
  async updateBankAccount(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.accountingService.updateBankAccount(user.tenantId, id, dto);
  }

  // ─── VAT Report ────────────────────────────────────────────

  @Get('reports/vat')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'VAT Report (14% Egypt)' })
  async getVATReport(
    @CurrentUser() user: any,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.accountingService.getVATReport(
      user.tenantId,
      startDate || '2026-01-01',
      endDate || new Date().toISOString().split('T')[0],
    );
  }

  // ─── Budget Report ─────────────────────────────────────────

  @Get('reports/budget')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Budget vs Actual by cost center' })
  async getBudgetReport(@CurrentUser() user: any) {
    return this.accountingService.getBudgetReport(user.tenantId);
  }
}
