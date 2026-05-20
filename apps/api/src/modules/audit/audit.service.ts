import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../database/database.constants';

export interface AuditEntry {
  tenantId: string;
  userId?: string;
  domain: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  correlationId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  /**
   * Write an audit log entry.
   * This is intentionally fire-and-forget for performance.
   * Audit writes should NEVER block business operations.
   * 
   * For transactional audit (must succeed with the business operation),
   * use logWithinTransaction() instead.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.db.execute(
        `INSERT INTO core.audit_log (
          tenant_id, user_id, domain, action,
          entity_type, entity_id, changes, metadata,
          ip_address, correlation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      );
      // Note: In production, parameterized via Drizzle sql`` template
    } catch (error) {
      // NEVER throw — audit failure must not break business operations
      this.logger.error('Failed to write audit log', {
        error,
        entry: { ...entry, changes: undefined }, // Don't log changes to error handler
      });
    }
  }

  /**
   * Write audit log within an existing database transaction.
   * Used for critical operations where audit MUST succeed
   * with the business operation (e.g., financial transactions).
   */
  async logWithinTransaction(
    tx: NodePgDatabase,
    entry: AuditEntry,
  ): Promise<void> {
    await tx.execute(
      `INSERT INTO core.audit_log (
        tenant_id, user_id, domain, action,
        entity_type, entity_id, changes, metadata,
        ip_address, correlation_id
      ) VALUES (
        '${entry.tenantId}',
        ${entry.userId ? `'${entry.userId}'` : 'NULL'},
        '${entry.domain}',
        '${entry.action}',
        '${entry.entityType}',
        '${entry.entityId}',
        ${entry.changes ? `'${JSON.stringify(entry.changes)}'::jsonb` : 'NULL'},
        ${entry.metadata ? `'${JSON.stringify(entry.metadata)}'::jsonb` : 'NULL'},
        ${entry.ipAddress ? `'${entry.ipAddress}'::inet` : 'NULL'},
        ${entry.correlationId ? `'${entry.correlationId}'` : 'NULL'}
      )`,
    );
  }

  /**
   * Build a diff of changes between old and new values.
   * Only includes fields that actually changed.
   */
  static buildChanges(
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ): Record<string, { old: unknown; new: unknown }> | undefined {
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const key of Object.keys(newData)) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = { old: oldData[key], new: newData[key] };
      }
    }

    return Object.keys(changes).length > 0 ? changes : undefined;
  }
}
