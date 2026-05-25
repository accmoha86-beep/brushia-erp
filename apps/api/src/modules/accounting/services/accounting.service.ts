import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { AuditService } from '../../audit/audit.service';
import { OutboxService } from '../../outbox/outbox.service';
import { TCreateAccount, TCreateJournalEntry } from '../dto/accounting.dto';
import { IAccountingService } from '@brushia/shared';

/**
 * ACCOUNTING ENGINE
 * 
 * Core invariants:
 * 1. Every journal entry MUST balance (debits = credits) — enforced by DB trigger
 * 2. Posted entries are IMMUTABLE — can only be voided with reversing entry
 * 3. All money is in piasters (minor unit) — no floating point
 * 4. Fiscal periods control when entries can be posted
 * 5. Account balances are DERIVED from journal entry lines — never stored
 */
@Injectable()
export class AccountingService implements IAccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // CHART OF ACCOUNTS
  // ═══════════════════════════════════════════════════════

  async createAccount(tenantId: string, userId: string, dto: TCreateAccount) {
    // Check code uniqueness
    const existing = await this.db.queryOne(
      `SELECT id FROM accounting.chart_of_accounts WHERE account_number = $1 AND tenant_id = $2`,
      [dto.account_number || dto.code, tenantId],
    );
    if (existing) throw new ConflictException(`Account code "${dto.account_number || dto.code}" already exists`);

    // Validate parent
    if (dto.parent_id) {
      const parent = await this.db.queryOne(
        `SELECT id, account_type FROM accounting.chart_of_accounts WHERE id = $1 AND tenant_id = $2`,
        [dto.parent_id, tenantId],
      );
      if (!parent) throw new NotFoundException('Parent account not found');
    }

    const result = await this.db.query(
      `INSERT INTO accounting.chart_of_accounts (
        tenant_id, account_number, name, name_ar, account_type, parent_id,
        description, is_bank_account, currency, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [tenantId, dto.account_number || dto.code, dto.name, dto.name_ar, dto.account_type, dto.parent_id,
       dto.description, dto.is_bank_account, dto.currency, dto.is_active],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'account.created',
      entity_type: 'chart_of_accounts',
      entity_id: result.rows[0].id,
      new_values: { code: dto.account_number || dto.code, name: dto.name },
    });

    return result.rows[0];
  }

  async getChartOfAccounts(tenantId: string, filters?: { account_type?: string; is_active?: boolean }) {
    let sql = `
      SELECT coa.*, 
        p.name as parent_name, p.code as parent_code,
        (SELECT COUNT(*) FROM accounting.chart_of_accounts c2 WHERE c2.parent_id = coa.id AND c2.tenant_id = $1) as child_count
      FROM accounting.chart_of_accounts coa
      LEFT JOIN accounting.chart_of_accounts p ON p.id = coa.parent_id
      WHERE coa.tenant_id = $1`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters?.account_type) {
      sql += ` AND coa.account_type = $${idx++}`;
      params.push(filters.account_type);
    }

    if (filters?.is_active !== undefined) {
      sql += ` AND coa.is_active = $${idx++}`;
      params.push(filters.is_active);
    }

    sql += ` ORDER BY coa.account_number ASC`;
    const result = await this.db.query(sql, params);
    return result.rows;
  }

  async getAccountTree(tenantId: string) {
    const accounts = await this.getChartOfAccounts(tenantId);
    return this.buildTree(accounts);
  }

  private buildTree(accounts: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const acc of accounts) {
      map.set(acc.id, { ...acc, children: [] });
    }

    for (const acc of accounts) {
      const node = map.get(acc.id)!;
      if (acc.parent_id && map.has(acc.parent_id)) {
        map.get(acc.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  // ═══════════════════════════════════════════════════════
  // JOURNAL ENTRIES
  // ═══════════════════════════════════════════════════════

  /**
   * Create a journal entry with balanced lines.
   * This is the ONLY way accounting balances change.
   * 
   * Can be called within a transaction (for POS sales, etc.)
   * or standalone (for manual entries).
   */
  async createJournalEntry(tenantId: string, userId: string, dto: TCreateJournalEntry, txClient?: any) {
    const client = txClient || this.db;
    const isExternalTx = !!txClient;

    const execute = async (c: any) => {
      // 1. Validate all accounts exist and are active
      const accountIds = [...new Set(dto.lines.map(l => l.account_id))];
      const accounts = await c.query(
        `SELECT id, code, name, account_type, is_active 
         FROM accounting.chart_of_accounts 
         WHERE id = ANY($1) AND tenant_id = $2`,
        [accountIds, tenantId],
      );

      if (accounts.rows.length !== accountIds.length) {
        const found = new Set(accounts.rows.map((a: any) => a.id));
        const missing = accountIds.filter(id => !found.has(id));
        throw new NotFoundException(`Accounts not found: ${missing.join(', ')}`);
      }

      const inactiveAccounts = accounts.rows.filter((a: any) => !a.is_active);
      if (inactiveAccounts.length > 0) {
        throw new BadRequestException(`Cannot post to inactive accounts: ${inactiveAccounts.map((a: any) => a.code).join(', ')}`);
      }

      // 2. Validate fiscal period is open (safe — skips if table missing)
      const fpExists = await c.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='accounting' AND table_name='fiscal_periods') as e`,
      ).then((r: any) => r.rows[0]?.e);
      if (fpExists) {
        const fiscalPeriod = await c.query(
          `SELECT id, status FROM accounting.fiscal_periods
           WHERE tenant_id = $1 AND start_date <= $2 AND end_date >= $2`,
          [tenantId, dto.entry_date],
        ).then((r: any) => r.rows[0]);
        if (fiscalPeriod && fiscalPeriod.status === 'closed') {
          throw new BadRequestException(`Cannot post to closed fiscal period for date ${dto.entry_date}`);
        }
      }

      // 3. Generate entry number
      const entryNumber = await this.generateEntryNumber(c, tenantId, dto.source);

      // 4. Calculate totals
      const totalDebit = dto.lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = dto.lines.reduce((sum, l) => sum + l.credit, 0);

      // 5. Create journal entry
      const entry = await c.query(
        `INSERT INTO accounting.journal_entries (
          tenant_id, entry_number, entry_date, description, source,
          reference_type, reference_id, total_debit, total_credit,
          status, fiscal_period_id, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          tenantId, entryNumber, dto.entry_date, dto.description, dto.source,
          dto.reference_type, dto.reference_id, totalDebit, totalCredit,
          dto.auto_post ? 'posted' : 'draft',
          fiscalPeriod?.id || null, userId,
        ],
      ).then((r: any) => r.rows[0]);

      // 6. Create entry lines
      for (let i = 0; i < dto.lines.length; i++) {
        const line = dto.lines[i];
        await c.query(
          `INSERT INTO accounting.journal_lines (
            tenant_id, journal_entry_id, line_number, account_id,
            debit, credit, description, reference_type, reference_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            tenantId, entry.id, i + 1, line.account_id,
            line.debit, line.credit, line.description,
            line.reference_type, line.reference_id,
          ],
        );
      }

      // 7. Auto-post if requested
      if (dto.auto_post) {
        await c.query(
          `UPDATE accounting.journal_entries SET posted_at = NOW() WHERE id = $1`,
          [entry.id],
        );
      }

      // 8. Outbox event
      if (isExternalTx) {
        await this.outbox.write(c, {
          tenant_id: tenantId,
          event_type: 'accounting.journal_entry_created',
          aggregate_type: 'journal_entry',
          aggregate_id: entry.id,
          payload: {
            entry_number: entryNumber,
            source: dto.source,
            total_debit: totalDebit,
            total_credit: totalCredit,
            auto_posted: dto.auto_post,
          },
        });
      }

      this.logger.log(`Journal entry created: ${entryNumber} debit=${totalDebit} credit=${totalCredit} source=${dto.source}`);

      return { ...entry, lines: dto.lines };
    };

    if (isExternalTx) {
      return execute(client);
    } else {
      return this.db.transaction(execute);
    }
  }

  /**
   * Post a draft journal entry.
   */
  async postJournalEntry(tenantId: string, userId: string, entryId: string) {
    const entry = await this.db.queryOne(
      `SELECT * FROM accounting.journal_entries WHERE id = $1 AND tenant_id = $2`,
      [entryId, tenantId],
    );
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.status === 'posted') throw new ConflictException('Entry is already posted');
    if (entry.status === 'voided') throw new ConflictException('Cannot post a voided entry');

    await this.db.query(
      `UPDATE accounting.journal_entries SET status = 'posted', posted_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [entryId, tenantId],
    );

    await this.audit.log({
      tenantId, userId,
      action: 'journal_entry.posted',
      entity_type: 'journal_entry',
      entity_id: entryId,
      new_values: { entry_number: entry.entry_number },
    });

    return { ...entry, status: 'posted' };
  }

  /**
   * Void a posted journal entry by creating a reversing entry.
   */
  async voidJournalEntry(tenantId: string, userId: string, entryId: string, reason: string) {
    return this.db.transaction(async (client) => {
      const entry = await client.query(
        `SELECT je.*, array_agg(json_build_object(
          'account_id', jel.account_id,
          'debit', jel.debit,
          'credit', jel.credit,
          'description', jel.description
        )) as lines
        FROM accounting.journal_entries je
        INNER JOIN accounting.journal_lines jel ON jel.journal_entry_id = je.id
        WHERE je.id = $1 AND je.tenant_id = $2
        GROUP BY je.id`,
        [entryId, tenantId],
      ).then(r => r.rows[0]);

      if (!entry) throw new NotFoundException('Journal entry not found');
      if (entry.status !== 'posted') throw new BadRequestException('Can only void posted entries');

      // Mark original as voided
      await client.query(
        `UPDATE accounting.journal_entries SET status = 'voided', voided_at = NOW(), voided_by = $3, void_reason = $4
         WHERE id = $1 AND tenant_id = $2`,
        [entryId, tenantId, userId, reason],
      );

      // Create reversing entry (swap debits and credits)
      const reversingLines = entry.lines.map((l: any) => ({
        account_id: l.account_id,
        debit: l.credit,    // Swapped
        credit: l.debit,    // Swapped
        description: `Reversal: ${l.description || ''}`,
      }));

      const reversal = await this.createJournalEntry(tenantId, userId, {
        entry_date: new Date().toISOString().split('T')[0],
        description: `VOID: ${entry.description} — Reason: ${reason}`,
        source: entry.source,
        reference_type: 'void',
        reference_id: entryId,
        lines: reversingLines,
        auto_post: true,
      }, client);

      // Link the reversal
      await client.query(
        `UPDATE accounting.journal_entries SET reversing_entry_id = $3 WHERE id = $1 AND tenant_id = $2`,
        [entryId, tenantId, reversal.id],
      );

      await this.audit.log({
        tenantId, userId,
        action: 'journal_entry.voided',
        entity_type: 'journal_entry',
        entity_id: entryId,
        new_values: { reason, reversing_entry_id: reversal.id },
      });

      return { voided_entry: entryId, reversing_entry: reversal };
    });
  }

  async getJournalEntry(tenantId: string, entryId: string) {
    const entry = await this.db.queryOne(
      `SELECT je.*, u.display_name as created_by_name
       FROM accounting.journal_entries je
       LEFT JOIN iam.users u ON u.id = je.created_by
       WHERE je.id = $1 AND je.tenant_id = $2`,
      [entryId, tenantId],
    );
    if (!entry) throw new NotFoundException('Journal entry not found');

    const lines = await this.db.query(
      `SELECT jel.*, coa.account_number as account_code, coa.name as account_name, coa.account_type
       FROM accounting.journal_lines jel
       INNER JOIN accounting.chart_of_accounts coa ON coa.id = jel.account_id
       WHERE jel.journal_entry_id = $1 AND jel.tenant_id = $2
       ORDER BY jel.line_number ASC`,
      [entryId, tenantId],
    );

    entry.lines = lines.rows;
    return entry;
  }

  async listJournalEntries(tenantId: string, filters: { source?: string; status?: string; from_date?: string; to_date?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT je.*, u.display_name as created_by_name,
        (SELECT COUNT(*) FROM accounting.journal_lines jel WHERE jel.journal_entry_id = je.id) as line_count
      FROM accounting.journal_entries je
      LEFT JOIN iam.users u ON u.id = je.created_by
      WHERE je.tenant_id = $1`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters.source) {
      sql += ` AND je.source = $${idx++}`;
      params.push(filters.source);
    }
    if (filters.status) {
      sql += ` AND je.status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters.from_date) {
      sql += ` AND je.entry_date >= $${idx++}`;
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      sql += ` AND je.entry_date <= $${idx++}`;
      params.push(filters.to_date);
    }

    sql += ` ORDER BY je.entry_date DESC, je.entry_number DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await this.db.query(sql, params);
    return { data: result.rows, pagination: { page, limit, hasMore: result.rows.length === limit } };
  }

  // ═══════════════════════════════════════════════════════
  // FINANCIAL REPORTS
  // ═══════════════════════════════════════════════════════

  async getTrialBalance(tenantId: string, asOfDate?: string) {
    const date = asOfDate || new Date().toISOString().split('T')[0];

    const result = await this.db.query(
      `SELECT coa.id, coa.account_number, coa.name, coa.name_ar, coa.account_type,
        COALESCE(SUM(jel.debit), 0) as total_debit,
        COALESCE(SUM(jel.credit), 0) as total_credit,
        COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as balance
       FROM accounting.chart_of_accounts coa
       LEFT JOIN accounting.journal_lines jel ON jel.account_id = coa.id AND jel.tenant_id = $1
       LEFT JOIN accounting.journal_entries je ON je.id = jel.journal_entry_id 
         AND je.status = 'posted' AND je.entry_date <= $2
       WHERE coa.tenant_id = $1 AND coa.is_active = true
       GROUP BY coa.id, coa.account_number, coa.name, coa.name_ar, coa.account_type
       HAVING COALESCE(SUM(jel.debit), 0) != 0 OR COALESCE(SUM(jel.credit), 0) != 0
       ORDER BY coa.account_number ASC`,
      [tenantId, date],
    );

    const totals = result.rows.reduce((acc: any, row: any) => ({
      total_debit: acc.total_debit + parseInt(row.total_debit),
      total_credit: acc.total_credit + parseInt(row.total_credit),
    }), { total_debit: 0, total_credit: 0 });

    return {
      as_of_date: date,
      accounts: result.rows,
      totals,
      is_balanced: totals.total_debit === totals.total_credit,
    };
  }

  async getProfitAndLoss(tenantId: string, fromDate: string, toDate: string) {
    const result = await this.db.query(
      `SELECT coa.id, coa.account_number, coa.name, coa.account_type,
        COALESCE(SUM(jel.debit), 0) as total_debit,
        COALESCE(SUM(jel.credit), 0) as total_credit
       FROM accounting.chart_of_accounts coa
       INNER JOIN accounting.journal_lines jel ON jel.account_id = coa.id AND jel.tenant_id = $1
       INNER JOIN accounting.journal_entries je ON je.id = jel.journal_entry_id 
         AND je.status = 'posted' AND je.entry_date BETWEEN $2 AND $3
       WHERE coa.tenant_id = $1 AND coa.account_type IN ('revenue', 'expense', 'contra_revenue', 'contra_expense')
       GROUP BY coa.id, coa.account_number, coa.name, coa.account_type
       ORDER BY coa.account_number ASC`,
      [tenantId, fromDate, toDate],
    );

    const revenue = result.rows
      .filter((r: any) => r.account_type === 'revenue')
      .reduce((sum: number, r: any) => sum + (parseInt(r.total_credit) - parseInt(r.total_debit)), 0);

    const contraRevenue = result.rows
      .filter((r: any) => r.account_type === 'contra_revenue')
      .reduce((sum: number, r: any) => sum + (parseInt(r.total_debit) - parseInt(r.total_credit)), 0);

    const expenses = result.rows
      .filter((r: any) => r.account_type === 'expense')
      .reduce((sum: number, r: any) => sum + (parseInt(r.total_debit) - parseInt(r.total_credit)), 0);

    const netRevenue = revenue - contraRevenue;
    const netIncome = netRevenue - expenses;

    return {
      period: { from: fromDate, to: toDate },
      revenue: { total: revenue, contra: contraRevenue, net: netRevenue },
      expenses: { total: expenses },
      net_income: netIncome,
      accounts: result.rows,
    };
  }

  async getBalanceSheet(tenantId: string, asOfDate: string) {
    const result = await this.db.query(
      `SELECT coa.id, coa.account_number, coa.name, coa.account_type,
        COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as balance
       FROM accounting.chart_of_accounts coa
       LEFT JOIN accounting.journal_lines jel ON jel.account_id = coa.id AND jel.tenant_id = $1
       LEFT JOIN accounting.journal_entries je ON je.id = jel.journal_entry_id 
         AND je.status = 'posted' AND je.entry_date <= $2
       WHERE coa.tenant_id = $1 AND coa.account_type IN ('asset', 'liability', 'equity', 'contra_asset', 'contra_liability')
       GROUP BY coa.id, coa.account_number, coa.name, coa.account_type
       HAVING COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) != 0
       ORDER BY coa.account_number ASC`,
      [tenantId, asOfDate],
    );

    const assets = result.rows
      .filter((r: any) => r.account_type === 'asset')
      .reduce((sum: number, r: any) => sum + parseInt(r.balance), 0);

    const contraAssets = result.rows
      .filter((r: any) => r.account_type === 'contra_asset')
      .reduce((sum: number, r: any) => sum + parseInt(r.balance), 0);

    const liabilities = result.rows
      .filter((r: any) => r.account_type === 'liability')
      .reduce((sum: number, r: any) => sum + Math.abs(parseInt(r.balance)), 0);

    const equity = result.rows
      .filter((r: any) => r.account_type === 'equity')
      .reduce((sum: number, r: any) => sum + Math.abs(parseInt(r.balance)), 0);

    // Get retained earnings (P&L for all time up to date)
    const pl = await this.getProfitAndLoss(tenantId, '1900-01-01', asOfDate);

    return {
      as_of_date: asOfDate,
      assets: { total: assets - Math.abs(contraAssets), accounts: result.rows.filter((r: any) => r.account_type === 'asset' || r.account_type === 'contra_asset') },
      liabilities: { total: liabilities, accounts: result.rows.filter((r: any) => r.account_type === 'liability') },
      equity: { total: equity + pl.net_income, retained_earnings: pl.net_income, accounts: result.rows.filter((r: any) => r.account_type === 'equity') },
      is_balanced: (assets - Math.abs(contraAssets)) === (liabilities + equity + pl.net_income),
    };
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  private async generateEntryNumber(client: any, tenantId: string, source: string): Promise<string> {
    const prefix = source === 'manual' ? 'JE' : source.toUpperCase().substring(0, 3);
    const year = new Date().getFullYear();
    
    const result = await client.query(
      `SELECT COUNT(*) + 1 as next_num 
       FROM accounting.journal_entries 
       WHERE tenant_id = $1 AND EXTRACT(YEAR FROM entry_date) = $2`,
      [tenantId, year],
    );

    const num = String(result.rows[0].next_num).padStart(6, '0');
    return `${prefix}-${year}-${num}`;
  }

  /**
   * Create standard journal entries for common business operations.
   * These are convenience methods used by other engines.
   */

  async postSaleEntry(tenantId: string, userId: string, params: {
    orderId: string;
    totalAmount: number;
    costOfGoods: number;
    taxAmount: number;
    paymentMethod: string;
    entryDate: string;
  }, txClient: any) {
    // Debit: Cash/Bank (or Accounts Receivable)
    // Credit: Sales Revenue + VAT Payable
    // Debit: Cost of Goods Sold
    // Credit: Inventory Asset

    const cashAccountCode = params.paymentMethod === 'cash' ? '1000' : '1010'; // Cash vs Bank

    const lines: any[] = [
      // Revenue recognition
      { account_id: await this.getAccountIdByCode(tenantId, cashAccountCode), debit: params.totalAmount, credit: 0, description: 'Payment received' },
      { account_id: await this.getAccountIdByCode(tenantId, '4000'), debit: 0, credit: params.totalAmount - params.taxAmount, description: 'Sales revenue' },
    ];

    if (params.taxAmount > 0) {
      lines.push({ account_id: await this.getAccountIdByCode(tenantId, '2100'), debit: 0, credit: params.taxAmount, description: 'VAT collected' });
    }

    // COGS entry
    if (params.costOfGoods > 0) {
      lines.push(
        { account_id: await this.getAccountIdByCode(tenantId, '5000'), debit: params.costOfGoods, credit: 0, description: 'Cost of goods sold' },
        { account_id: await this.getAccountIdByCode(tenantId, '1300'), debit: 0, credit: params.costOfGoods, description: 'Inventory reduction' },
      );
    }

    return this.createJournalEntry(tenantId, userId, {
      entry_date: params.entryDate,
      description: `Sale: Order ${params.orderId}`,
      source: 'sales',
      reference_type: 'sales_order',
      reference_id: params.orderId,
      lines,
      auto_post: true,
    }, txClient);
  }

  async postPurchaseEntry(tenantId: string, userId: string, params: {
    poId: string;
    totalAmount: number;
    taxAmount: number;
    entryDate: string;
  }, txClient?: any) {
    const lines: any[] = [
      { account_id: await this.getAccountIdByCode(tenantId, '1300'), debit: params.totalAmount - params.taxAmount, credit: 0, description: 'Inventory received' },
      { account_id: await this.getAccountIdByCode(tenantId, '2000'), debit: 0, credit: params.totalAmount, description: 'Accounts payable' },
    ];

    if (params.taxAmount > 0) {
      try { lines.push({ account_id: await this.getAccountIdByCode(tenantId, '1400'), debit: params.taxAmount, credit: 0, description: 'VAT receivable' }); } catch(e) { /* Account 1400 not yet seeded */ }
    }

    return this.createJournalEntry(tenantId, userId, {
      entry_date: params.entryDate,
      description: `Purchase: PO ${params.poId}`,
      source: 'purchase',
      reference_type: 'purchase_order',
      reference_id: params.poId,
      lines,
      auto_post: true,
    }, txClient);
  }

  private async getAccountIdByCode(tenantId: string, code: string): Promise<string> {
    const result = await this.db.queryOne(
      `SELECT id FROM accounting.chart_of_accounts WHERE account_number = $1 AND tenant_id = $2`,
      [code, tenantId],
    );
    if (!result) throw new NotFoundException(`Account with code "${code}" not found. Run seed migration first.`);
    return result.id;
  }

  // ─── Cost Centers (مراكز التكلفة) ────────────────────────

  async getCostCenters(tenantId: string, filters?: { type?: string; is_active?: boolean }) {
    let query = `SELECT cc.*, b.name as branch_name, b.code as branch_code,
      (SELECT COUNT(*) FROM accounting.journal_lines jl WHERE jl.cost_center_id = cc.id) as transaction_count,
      (SELECT COALESCE(SUM(jl.debit), 0) FROM accounting.journal_lines jl WHERE jl.cost_center_id = cc.id) as total_debits,
      (SELECT COALESCE(SUM(jl.credit), 0) FROM accounting.journal_lines jl WHERE jl.cost_center_id = cc.id) as total_credits
    FROM accounting.cost_centers cc
    LEFT JOIN pos.branches b ON cc.branch_id = b.id
    WHERE cc.tenant_id = $1`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (filters?.type) {
      query += ` AND cc.type = $${idx++}`;
      params.push(filters.type);
    }
    if (filters?.is_active !== undefined) {
      query += ` AND cc.is_active = $${idx++}`;
      params.push(filters.is_active);
    }
    query += ` ORDER BY cc.type, cc.code`;

    const rows = await this.db.query(query, params);
    return { data: rows, total: rows.length };
  }

  async getCostCenterById(tenantId: string, id: string) {
    const cc = await this.db.queryOne(
      `SELECT cc.*, b.name as branch_name, b.code as branch_code
       FROM accounting.cost_centers cc
       LEFT JOIN pos.branches b ON cc.branch_id = b.id
       WHERE cc.id = $1 AND cc.tenant_id = $2`,
      [id, tenantId],
    );
    if (!cc) throw new NotFoundException('Cost center not found');
    return cc;
  }

  async createCostCenter(tenantId: string, dto: any) {
    const result = await this.db.queryOne(
      `INSERT INTO accounting.cost_centers (tenant_id, code, name, name_ar, type, parent_id, branch_id, is_active, budget_amount, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [tenantId, dto.code, dto.name, dto.name_ar || null, dto.type || 'branch',
       dto.parent_id || null, dto.branch_id || null, dto.is_active !== false,
       dto.budget_amount || 0, dto.description || null],
    );
    return result;
  }

  async updateCostCenter(tenantId: string, id: string, dto: any) {
    const fields: string[] = [];
    const values: any[] = [id, tenantId];
    let idx = 3;

    for (const key of ['code', 'name', 'name_ar', 'type', 'parent_id', 'branch_id', 'is_active', 'budget_amount', 'description']) {
      if (dto[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(dto[key]);
      }
    }
    if (fields.length === 0) throw new BadRequestException('No fields to update');

    fields.push(`updated_at = NOW()`);
    const result = await this.db.queryOne(
      `UPDATE accounting.cost_centers SET ${fields.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      values,
    );
    if (!result) throw new NotFoundException('Cost center not found');
    return result;
  }

  async deleteCostCenter(tenantId: string, id: string) {
    const txnCount = await this.db.queryOne(
      `SELECT COUNT(*) as cnt FROM accounting.journal_lines WHERE cost_center_id = $1`,
      [id],
    );
    if (Number(txnCount?.cnt) > 0) {
      throw new BadRequestException('Cannot delete cost center with existing transactions. Deactivate it instead.');
    }
    const result = await this.db.queryOne(
      `DELETE FROM accounting.cost_centers WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId],
    );
    if (!result) throw new NotFoundException('Cost center not found');
    return { message: 'Cost center deleted' };
  }

  async getCostCenterReport(tenantId: string, costCenterId: string, startDate?: string, endDate?: string) {
    // Verify cost center exists
    const cc = await this.getCostCenterById(tenantId, costCenterId);

    let dateFilter = '';
    const params: any[] = [costCenterId, tenantId];
    let idx = 3;
    if (startDate) { dateFilter += ` AND je.date >= $${idx++}`; params.push(startDate); }
    if (endDate) { dateFilter += ` AND je.date <= $${idx++}`; params.push(endDate); }

    // Get income vs expense breakdown
    const summary = await this.db.query(
      `SELECT 
        coa.account_type,
        COUNT(DISTINCT je.id) as entry_count,
        COALESCE(SUM(jl.debit), 0) as total_debit,
        COALESCE(SUM(jl.credit), 0) as total_credit
       FROM accounting.journal_lines jl
       JOIN accounting.journal_entries je ON jl.entry_id = je.id
       JOIN accounting.chart_of_accounts coa ON jl.account_id = coa.id
       WHERE jl.cost_center_id = $1 AND je.tenant_id = $2 AND je.status = 'posted' ${dateFilter}
       GROUP BY coa.account_type
       ORDER BY coa.account_type`,
      params,
    );

    // Get recent transactions
    const recentTxns = await this.db.query(
      `SELECT je.entry_number, je.date, je.description, jl.debit, jl.credit,
        coa.account_number, coa.name as account_name
       FROM accounting.journal_lines jl
       JOIN accounting.journal_entries je ON jl.entry_id = je.id
       JOIN accounting.chart_of_accounts coa ON jl.account_id = coa.id
       WHERE jl.cost_center_id = $1 AND je.tenant_id = $2 ${dateFilter}
       ORDER BY je.date DESC, je.entry_number DESC
       LIMIT 50`,
      [costCenterId, tenantId, ...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])],
    );

    return {
      costCenter: cc,
      summary,
      recentTransactions: recentTxns,
      budgetAmount: Number(cc.budget_amount || 0),
      totalSpent: summary.reduce((sum: number, r: any) => sum + Number(r.total_debit || 0), 0),
    };
  }

  async getCostCenterComparison(tenantId: string, startDate?: string, endDate?: string) {
    let dateFilter = '';
    const params: any[] = [tenantId];
    let idx = 2;
    if (startDate) { dateFilter += ` AND je.date >= $${idx++}`; params.push(startDate); }
    if (endDate) { dateFilter += ` AND je.date <= $${idx++}`; params.push(endDate); }

    const data = await this.db.query(
      `SELECT 
        cc.id, cc.code, cc.name, cc.name_ar, cc.type, cc.budget_amount,
        COUNT(DISTINCT je.id) as transaction_count,
        COALESCE(SUM(jl.debit), 0) as total_debits,
        COALESCE(SUM(jl.credit), 0) as total_credits,
        COALESCE(SUM(CASE WHEN coa.account_type = 'revenue' THEN jl.credit ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN coa.account_type = 'expense' THEN jl.debit ELSE 0 END), 0) as expenses
       FROM accounting.cost_centers cc
       LEFT JOIN accounting.journal_lines jl ON cc.id = jl.cost_center_id
       LEFT JOIN accounting.journal_entries je ON jl.entry_id = je.id AND je.status = 'posted' ${dateFilter}
       LEFT JOIN accounting.chart_of_accounts coa ON jl.account_id = coa.id
       WHERE cc.tenant_id = $1 AND cc.is_active = true
       GROUP BY cc.id, cc.code, cc.name, cc.name_ar, cc.type, cc.budget_amount
       ORDER BY revenue DESC`,
      params,
    );

    return { data, total: data.length };
  }
}
