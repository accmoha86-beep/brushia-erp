# Critical Workflow: Complete POS Sale

## Transaction Flow

```mermaid
sequenceDiagram
    participant C as Cashier (POS)
    participant O as SaleTransactionOrchestrator
    participant DB as PostgreSQL
    participant Ob as Outbox

    C->>O: processSale(items, payments, customer)
    O->>DB: BEGIN TRANSACTION

    Note over O,DB: Step 1: Idempotency Check
    O->>DB: SELECT FROM idempotency_keys
    DB-->>O: null (new request)

    Note over O,DB: Step 2: Calculate Totals
    O->>O: VAT-inclusive math (14%)

    Note over O,DB: Step 3: Validate Payments
    O->>O: sum(payments) >= grandTotal

    Note over O,DB: Step 4: Inventory (Advisory Locks)
    loop For each item (sorted by productId)
        O->>DB: pg_advisory_xact_lock(hash)
        O->>DB: SELECT available_quantity FOR UPDATE
        O->>DB: UPDATE stock_levels (deduct)
        O->>DB: INSERT stock_movements (immutable)
    end

    Note over O,DB: Step 5: Create Sales Order
    O->>DB: INSERT INTO sales.orders
    DB-->>O: orderId, receiptNumber

    Note over O,DB: Step 6: Line Items
    loop For each item
        O->>DB: INSERT INTO sales.order_items
    end

    Note over O,DB: Step 7: Record Payments
    loop For each payment method
        O->>DB: INSERT INTO sales.payments
    end

    Note over O,DB: Step 8: Journal Entries
    O->>DB: INSERT journal_entry (Revenue)
    O->>DB: INSERT lines: DEBIT Cash/Card/VF
    O->>DB: INSERT lines: CREDIT Revenue + VAT
    O->>DB: INSERT journal_entry (COGS)
    O->>DB: INSERT lines: DEBIT COGS
    O->>DB: INSERT lines: CREDIT Inventory Asset

    Note over O,DB: Step 9: Customer + Loyalty
    O->>DB: UPDATE crm.customers (stats)
    O->>DB: INSERT crm.loyalty_points

    Note over O,DB: Step 10: Audit Log
    O->>DB: INSERT public.audit_log

    Note over O,DB: Step 11: Outbox Event
    O->>Ob: INSERT public.outbox (SaleCompleted)

    Note over O,DB: Step 12: Record Idempotency
    O->>DB: INSERT idempotency_keys

    O->>DB: COMMIT ✅

    DB-->>O: Transaction committed
    O-->>C: SaleReceipt { orderId, receiptNumber, ... }

    Note over C: Receipt printed 🧾
```

## Atomicity Guarantees

| Scenario | Behavior |
|---|---|
| Insufficient stock | ROLLBACK — no order, no payment, no JE |
| Insufficient payment | ROLLBACK — nothing changes |
| DB connection lost mid-transaction | ROLLBACK — PostgreSQL auto-rollback |
| Duplicate idempotency key | Return cached receipt — no re-processing |
| Concurrent sale for same product | Advisory lock serializes — safe |

## Journal Entry Structure

### Revenue Entry
```
DEBIT  1101 Cash Box           1,000.00
DEBIT  1103 Vodafone Cash      1,525.00
CREDIT 4101 Sales Revenue      2,127.19
CREDIT 2301 VAT Output           297.81
```

### COGS Entry
```
DEBIT  5101 Cost of Goods Sold   920.00
CREDIT 1301 Inventory Asset      920.00
```

## Invariants Enforced

1. **Stock movements are immutable** — DB trigger blocks UPDATE/DELETE
2. **Journal entries must balance** — debit_total = credit_total (DB trigger)
3. **Posted JEs cannot be modified** — only voided
4. **Advisory locks prevent overselling** — sorted to prevent deadlocks
5. **Idempotency keys prevent double-charge** — 24hr TTL
6. **RLS isolates tenant data** — SET LOCAL app.tenant_id
7. **Negative stock blocked** — CHECK constraint on stock_levels
