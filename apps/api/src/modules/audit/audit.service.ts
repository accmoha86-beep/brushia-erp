import { Injectable, Logger } from '@nestjs/common';

export interface AuditEntry {
  tenantId: string;
  userId?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  [key: string]: any;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  /**
   * Write an audit log entry.
   * Fire-and-forget — audit failures must NEVER block business operations.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      // TODO: Implement proper audit logging to iam.audit_logs table
      this.logger.debug(`Audit: ${entry.action} on ${entry.entity_type || 'unknown'}/${entry.entity_id || 'unknown'}`);
    } catch (error) {
      // NEVER throw — audit failure must not break business operations
      this.logger.error('Failed to write audit log', { error });
    }
  }

  async logWithinTransaction(tx: any, entry: AuditEntry): Promise<void> {
    // No-op for now
    this.logger.debug(`Audit (tx): ${entry.action}`);
  }

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
