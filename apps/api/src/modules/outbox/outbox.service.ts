import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';

interface OutboxEvent {
  tenant_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, any>;
  idempotency_key?: string;
}

/**
 * Transactional Outbox Pattern
 * 
 * Events are written to the outbox table within the same transaction
 * as the business operation. A separate poller/CDC process reads
 * unprocessed events and publishes them to the message broker.
 * 
 * This guarantees at-least-once delivery without distributed transactions.
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Write an event to the outbox within an existing transaction.
   * Must be called with the transaction client to ensure atomicity.
   */
  async write(client: PoolClient, event: OutboxEvent): Promise<string> {
    const result = await client.query(
      `INSERT INTO public.outbox_events (
        tenant_id, event_type, aggregate_type, aggregate_id, payload, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        event.tenant_id,
        event.event_type,
        event.aggregate_type,
        event.aggregate_id,
        JSON.stringify(event.payload),
        event.idempotency_key || null,
      ],
    );

    this.logger.debug(`Outbox event written: ${event.event_type} [${event.aggregate_type}:${event.aggregate_id}]`);
    return result.rows[0].id;
  }

  /**
   * Write an event outside a transaction (fire-and-forget).
   * Use only for non-critical events where eventual consistency is acceptable.
   */
  async writeAsync(event: OutboxEvent): Promise<string> {
    const result = await this.db.query(
      `INSERT INTO public.outbox_events (
        tenant_id, event_type, aggregate_type, aggregate_id, payload, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        event.tenant_id,
        event.event_type,
        event.aggregate_type,
        event.aggregate_id,
        JSON.stringify(event.payload),
        event.idempotency_key || null,
      ],
    );

    return result.rows[0].id;
  }

  /**
   * Poll for unprocessed outbox events.
   * Called by the outbox processor job.
   */
  async pollUnprocessed(limit = 100): Promise<any[]> {
    const result = await this.db.query(
      `UPDATE public.outbox_events
       SET status = 'processing', processed_at = NOW()
       WHERE id IN (
         SELECT id FROM public.outbox_events
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [limit],
    );

    return result.rows;
  }

  /**
   * Mark events as successfully published.
   */
  async markPublished(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    await this.db.query(
      `UPDATE public.outbox_events SET status = 'published', processed_at = NOW()
       WHERE id = ANY($1)`,
      [eventIds],
    );
  }

  /**
   * Mark events as failed.
   */
  async markFailed(eventIds: string[], error: string): Promise<void> {
    if (eventIds.length === 0) return;

    await this.db.query(
      `UPDATE public.outbox_events 
       SET status = 'failed', error = $2, retry_count = retry_count + 1, processed_at = NOW()
       WHERE id = ANY($1)`,
      [eventIds, error],
    );
  }
}
