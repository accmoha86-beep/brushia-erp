/**
 * Accounting Module Contract
 * Other modules post journal entries through this interface.
 * The Accounting Engine ensures double-entry integrity.
 */

export interface JournalLine {
  accountCode: string;      // e.g., '1110' for Cash
  description?: string;
  debitAmount: number;       // Minor units, 0 if credit
  creditAmount: number;      // Minor units, 0 if debit
  costCenter?: string;
}

export interface PostJournalEntryRequest {
  tenantId: string;
  entryDate: Date;
  description: string;
  sourceModule: string;      // 'sales', 'purchasing', 'inventory', etc.
  sourceType: string;        // 'sales_order', 'purchase_order', etc.
  sourceId: string;
  lines: JournalLine[];
  idempotencyKey: string;    // REQUIRED
  createdBy: string;
}

export interface IAccountingService {
  /** Post a journal entry (validates debits = credits) */
  postJournalEntry(request: PostJournalEntryRequest): Promise<{ journalEntryId: string; entryNumber: string }>;
  
  /** Void a journal entry (creates reversing entry) */
  voidJournalEntry(tenantId: string, journalEntryId: string, reason: string, voidedBy: string): Promise<{ reversalId: string }>;
  
  /** Get account balance */
  getAccountBalance(tenantId: string, accountCode: string): Promise<number>;
  
  /** Get account balances for date range */
  getTrialBalance(tenantId: string, fromDate: Date, toDate: Date): Promise<Array<{ accountCode: string; name: string; debit: number; credit: number; balance: number }>>;
  
  /** Record a bank transaction */
  recordBankTransaction(tenantId: string, bankAccountId: string, amount: number, type: string, description: string, referenceId?: string): Promise<{ transactionId: string }>;
}
