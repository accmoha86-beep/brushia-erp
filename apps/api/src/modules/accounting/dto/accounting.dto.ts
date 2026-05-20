import { z } from 'zod';

// ─── Chart of Accounts ───────────────────────────────────
export const CreateAccountDto = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  name_ar: z.string().max(200).optional(),
  account_type: z.enum([
    'asset', 'liability', 'equity', 'revenue', 'expense',
    'contra_asset', 'contra_liability', 'contra_revenue', 'contra_expense',
  ]),
  parent_id: z.string().uuid().optional(),
  description: z.string().optional(),
  is_bank_account: z.boolean().default(false),
  currency: z.string().length(3).default('EGP'),
  is_active: z.boolean().default(true),
});

export const UpdateAccountDto = CreateAccountDto.partial();

// ─── Journal Entries ─────────────────────────────────────
export const JournalEntryLineDto = z.object({
  account_id: z.string().uuid(),
  debit: z.number().int().min(0).default(0),   // In piasters
  credit: z.number().int().min(0).default(0),   // In piasters
  description: z.string().optional(),
  reference_type: z.string().max(50).optional(),
  reference_id: z.string().uuid().optional(),
});

export const CreateJournalEntryDto = z.object({
  entry_date: z.string(), // YYYY-MM-DD
  reference_number: z.string().max(50).optional(),
  description: z.string().min(1).max(500),
  source: z.enum(['manual', 'sales', 'purchase', 'inventory', 'pos', 'expense', 'bank', 'adjustment']),
  reference_type: z.string().max(50).optional(),
  reference_id: z.string().uuid().optional(),
  lines: z.array(JournalEntryLineDto).min(2), // At least 2 lines (debit + credit)
  auto_post: z.boolean().default(false),
}).refine(data => {
  const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);
  return totalDebit === totalCredit && totalDebit > 0;
}, { message: 'Journal entry must balance: total debits must equal total credits and be > 0' });

export const VoidJournalEntryDto = z.object({
  reason: z.string().min(1).max(500),
});

// ─── Financial Reports ───────────────────────────────────
export const TrialBalanceQueryDto = z.object({
  as_of_date: z.string().optional(), // YYYY-MM-DD, defaults to today
  account_type: z.string().optional(),
});

export const ProfitLossQueryDto = z.object({
  from_date: z.string(), // YYYY-MM-DD
  to_date: z.string(),   // YYYY-MM-DD
  compare_from: z.string().optional(),
  compare_to: z.string().optional(),
});

export const BalanceSheetQueryDto = z.object({
  as_of_date: z.string(), // YYYY-MM-DD
});

export const CashFlowQueryDto = z.object({
  from_date: z.string(),
  to_date: z.string(),
});

export type TCreateAccount = z.infer<typeof CreateAccountDto>;
export type TCreateJournalEntry = z.infer<typeof CreateJournalEntryDto>;
