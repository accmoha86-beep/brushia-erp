import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/audit.service';
import { OutboxService } from '../../outbox/outbox.service';
import { TRecordMovement, TBulkMovement, TReserveStock, TTransferStock, TStockQuery, TMovementQuery } from '../dto/inventory.dto';
import { IInventoryService } from '@brushia/shared/contracts';

/**
 * INVENTORY TRANSACTION ENGINE
 * 
 * Core invariants:
 * 1. Stock levels are DERIVED from movements — never updated directly
 * 2. Movements are IMMUTABLE — append-only ledger (DB trigger enforces)
 * 3. Cost updates use WEIGHTED AVERAGE method
 * 4. Reservations hold stock for pending sales
 * 5. All mutations use advisory locks to prevent race conditions
 * 6. Every mutation writes to outbox for event propagation
 */
@Injectable()
export class InventoryService implements IInventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // STOCK LEVEL QUERIES
  // ═══════════════════════════════════════════════════════

  async getStockLevels(tenantId: string, query: TStockQuery) {
    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 100);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT sl.*, p.name as product_name, p.sku, p.image_url, p.barcode,
        c.name as category_name, l.name as location_name,
        v.name as variant_name, v.sku as variant_sku,
        CASE WHEN sl.quantity <= sl.reorder_point THEN true ELSE false END as is_low_stock,
        sl.quantity * COALESCE(sl.weighted_avg_cost, p.cost_price) as stock_value
      FROM inventory.stock_levels sl
      INNER JOIN catalog.products p ON p.id = sl.product_id
      LEFT JOIN catalog.product_variants v ON v.id = sl.variant_id
      LEFT JOIN catalog.categories c ON c.id = p.category_id
      INNER JOIN inventory.locations l ON l.id = sl.location_id
      WHERE sl.tenant_id = $1`;

    const params: any[] = [tenantId];
    let idx = 2;

    if (query.location_id) {
      sql += ` AND sl.location_id = $${idx++}`;
      params.push(query.location_id);
    }

    if (query.category_id) {
      sql += ` AND p.category_id = $${idx++}`;
      params.push(query.category_id);
    }

    if (query.below_reorder === 'true') {
      sql += ` AND sl.quantity <= sl.reorder_point`;
    }

    if (query.search) {
      sql += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR v.name ILIKE $${idx})`;
      params.push(`%${query.search}%`);
      idx++;
    }

    sql += ` ORDER BY p.name ASC, v.sort_order ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await this.db.query(sql, params);

    return {
      data: result.rows,
      pagination: { page, limit, total: result.rows.length, hasMore: result.rows.length === limit },
    };
  }

  async getAvailableStock(tenantId: string, productId: string, variantId: string | null, locationId: string): Promise<number> {
    const result = await this.db.queryOne(
      `SELECT 
        COALESCE(sl.quantity, 0) as on_hand,
        COALESCE(sl.reserved_quantity, 0) as reserved,
        COALESCE(sl.quantity, 0) - COALESCE(sl.reserved_quantity, 0) as available
       FROM inventory.stock_levels sl
       WHERE sl.product_id = $1 AND sl.location_id = $3 AND sl.tenant_id = $4
         AND ($2::uuid IS NULL AND sl.variant_id IS NULL OR sl.variant_id = $2)`,
      [productId, variantId, locationId, tenantId],
    );

    return result ? parseInt(result.available) : 0;
  }

  async checkAvailability(tenantId: string, items: Array<{ product_id: string; variant_id?: string; location_id: string; quantity: number }>) {
    const results: Array<{ product_id: string; variant_id?: string; location_id: string; requested: number; available: number; sufficient: boolean }> = [];

    for (const item of items) {
      const available = await this.getAvailableStock(tenantId, item.product_id, item.variant_id || null, item.location_id);
      results.push({
        ...item,
        requested: item.quantity,
        available,
        sufficient: available >= item.quantity,
      });
    }

    return {
      items: results,
      allAvailable: results.every(r => r.sufficient),
    };
  }

  // ═══════════════════════════════════════════════════════
  // STOCK MUTATIONS (THE ENGINE CORE)
  // ═══════════════════════════════════════════════════════

  /**
   * Record a single inventory movement.
   * This is the ONLY way stock levels change.
   * 
   * Uses advisory lock to prevent race conditions on the same product+location.
   */
  async recordMovement(tenantId: string, userId: string, dto: TRecordMovement): Promise<any> {
    return this.db.transaction(async (client) => {
      // 1. Acquire advisory lock on product+location combination
      const lockKey = this.computeLockKey(dto.product_id, dto.location_id);
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

      // 2. Get or create stock level record
      let stockLevel = await client.query(
        `SELECT * FROM inventory.stock_levels 
         WHERE product_id = $1 AND location_id = $2 AND tenant_id = $3
           AND ($4::uuid IS NULL AND variant_id IS NULL OR variant_id = $4)
         FOR UPDATE`,
        [dto.product_id, dto.location_id, tenantId, dto.variant_id || null],
      ).then(r => r.rows[0]);

      if (!stockLevel) {
        // Create initial stock level
        stockLevel = await client.query(
          `INSERT INTO inventory.stock_levels (tenant_id, product_id, variant_id, location_id, quantity, reserved_quantity, weighted_avg_cost)
           VALUES ($1, $2, $3, $4, 0, 0, 0)
           RETURNING *`,
          [tenantId, dto.product_id, dto.variant_id || null, dto.location_id],
        ).then(r => r.rows[0]);
      }

      const currentQty = parseInt(stockLevel.quantity);
      const newQty = currentQty + dto.quantity;

      // 3. Validate: cannot go negative (unless it's an adjustment)
      if (newQty < 0 && !['adjustment_out', 'damage', 'stock_take'].includes(dto.movement_type)) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${currentQty}, Requested: ${Math.abs(dto.quantity)}`
        );
      }

      // 4. Calculate new weighted average cost (only on incoming movements)
      let newAvgCost = parseInt(stockLevel.weighted_avg_cost) || 0;
      if (dto.quantity > 0 && dto.unit_cost && dto.unit_cost > 0) {
        // Weighted average = (existing_value + new_value) / (existing_qty + new_qty)
        const existingValue = currentQty * newAvgCost;
        const newValue = dto.quantity * dto.unit_cost;
        newAvgCost = newQty > 0 ? Math.round((existingValue + newValue) / newQty) : dto.unit_cost;
      }

      // 5. Record the immutable movement
      const movement = await client.query(
        `INSERT INTO inventory.stock_movements (
          tenant_id, product_id, variant_id, location_id,
          movement_type, quantity, unit_cost, total_cost,
          quantity_before, quantity_after,
          reference_type, reference_id, notes, performed_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [
          tenantId, dto.product_id, dto.variant_id || null, dto.location_id,
          dto.movement_type, dto.quantity, dto.unit_cost || 0,
          (dto.unit_cost || 0) * Math.abs(dto.quantity),
          currentQty, newQty,
          dto.reference_type, dto.reference_id, dto.notes, userId,
        ],
      ).then(r => r.rows[0]);

      // 6. Update stock level
      await client.query(
        `UPDATE inventory.stock_levels 
         SET quantity = $3, weighted_avg_cost = $4, updated_at = NOW()
         WHERE product_id = $1 AND location_id = $5 AND tenant_id = $6
           AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
        [dto.product_id, dto.variant_id || null, newQty, newAvgCost, dto.location_id, tenantId],
      );

      // 7. Write outbox event
      await this.outbox.write(client, {
        tenant_id: tenantId,
        event_type: 'inventory.stock_moved',
        aggregate_type: 'stock_level',
        aggregate_id: stockLevel.id,
        payload: {
          product_id: dto.product_id,
          variant_id: dto.variant_id,
          location_id: dto.location_id,
          movement_type: dto.movement_type,
          quantity: dto.quantity,
          quantity_before: currentQty,
          quantity_after: newQty,
          unit_cost: dto.unit_cost,
          new_avg_cost: newAvgCost,
        },
      });

      // 8. Check low stock alert
      const reorderPoint = parseInt(stockLevel.reorder_point) || 0;
      if (newQty <= reorderPoint && currentQty > reorderPoint) {
        await this.outbox.write(client, {
          tenant_id: tenantId,
          event_type: 'inventory.low_stock_alert',
          aggregate_type: 'stock_level',
          aggregate_id: stockLevel.id,
          payload: {
            product_id: dto.product_id,
            variant_id: dto.variant_id,
            location_id: dto.location_id,
            current_quantity: newQty,
            reorder_point: reorderPoint,
          },
        });
        this.logger.warn(`LOW STOCK ALERT: Product ${dto.product_id} at location ${dto.location_id} = ${newQty} (reorder: ${reorderPoint})`);
      }

      // 9. Audit log
      await this.audit.logInTransaction(client, {
        tenantId, userId,
        action: `inventory.${dto.movement_type}`,
        entity_type: 'stock_movement',
        entity_id: movement.id,
        new_values: {
          product_id: dto.product_id,
          quantity: dto.quantity,
          before: currentQty,
          after: newQty,
        },
      });

      this.logger.log(`Stock movement: ${dto.movement_type} qty=${dto.quantity} product=${dto.product_id} loc=${dto.location_id} [${currentQty} → ${newQty}]`);

      return {
        movement,
        stock_level: { quantity: newQty, weighted_avg_cost: newAvgCost },
      };
    });
  }

  /**
   * Record multiple movements atomically.
   * All succeed or all fail — single transaction.
   */
  async recordBulkMovements(tenantId: string, userId: string, dto: TBulkMovement) {
    return this.db.transaction(async (client) => {
      const results: any[] = [];

      for (const movement of dto.movements) {
        // Use the same transaction client for each movement
        const lockKey = this.computeLockKey(movement.product_id, movement.location_id);
        await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

        let stockLevel = await client.query(
          `SELECT * FROM inventory.stock_levels 
           WHERE product_id = $1 AND location_id = $2 AND tenant_id = $3
             AND ($4::uuid IS NULL AND variant_id IS NULL OR variant_id = $4)
           FOR UPDATE`,
          [movement.product_id, movement.location_id, tenantId, movement.variant_id || null],
        ).then(r => r.rows[0]);

        if (!stockLevel) {
          stockLevel = await client.query(
            `INSERT INTO inventory.stock_levels (tenant_id, product_id, variant_id, location_id, quantity, reserved_quantity, weighted_avg_cost)
             VALUES ($1, $2, $3, $4, 0, 0, 0) RETURNING *`,
            [tenantId, movement.product_id, movement.variant_id || null, movement.location_id],
          ).then(r => r.rows[0]);
        }

        const currentQty = parseInt(stockLevel.quantity);
        const newQty = currentQty + movement.quantity;

        if (newQty < 0 && !['adjustment_out', 'damage', 'stock_take'].includes(movement.movement_type)) {
          throw new BadRequestException(
            `Insufficient stock for product ${movement.product_id}. Available: ${currentQty}, Requested: ${Math.abs(movement.quantity)}`
          );
        }

        let newAvgCost = parseInt(stockLevel.weighted_avg_cost) || 0;
        if (movement.quantity > 0 && movement.unit_cost && movement.unit_cost > 0) {
          const existingValue = currentQty * newAvgCost;
          const newValue = movement.quantity * movement.unit_cost;
          newAvgCost = newQty > 0 ? Math.round((existingValue + newValue) / newQty) : movement.unit_cost;
        }

        const mv = await client.query(
          `INSERT INTO inventory.stock_movements (
            tenant_id, product_id, variant_id, location_id,
            movement_type, quantity, unit_cost, total_cost,
            quantity_before, quantity_after,
            reference_type, reference_id, notes, performed_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
          [
            tenantId, movement.product_id, movement.variant_id || null, movement.location_id,
            movement.movement_type, movement.quantity, movement.unit_cost || 0,
            (movement.unit_cost || 0) * Math.abs(movement.quantity),
            currentQty, newQty,
            movement.reference_type || dto.reference_type, movement.reference_id || dto.reference_id,
            movement.notes, userId,
          ],
        ).then(r => r.rows[0]);

        await client.query(
          `UPDATE inventory.stock_levels 
           SET quantity = $3, weighted_avg_cost = $4, updated_at = NOW()
           WHERE product_id = $1 AND location_id = $5 AND tenant_id = $6
             AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
          [movement.product_id, movement.variant_id || null, newQty, newAvgCost, movement.location_id, tenantId],
        );

        results.push({ movement: mv, stock: { quantity: newQty, weighted_avg_cost: newAvgCost } });
      }

      // Single outbox event for the batch
      await this.outbox.write(client, {
        tenant_id: tenantId,
        event_type: 'inventory.bulk_movement',
        aggregate_type: 'stock_level',
        aggregate_id: dto.reference_id || results[0]?.movement?.id || 'batch',
        payload: {
          count: results.length,
          reference_type: dto.reference_type,
          reference_id: dto.reference_id,
        },
      });

      return { count: results.length, movements: results };
    });
  }

  // ═══════════════════════════════════════════════════════
  // RESERVATIONS
  // ═══════════════════════════════════════════════════════

  async reserveStock(tenantId: string, userId: string, dto: TReserveStock) {
    return this.db.transaction(async (client) => {
      const lockKey = this.computeLockKey(dto.product_id, dto.location_id);
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

      const stockLevel = await client.query(
        `SELECT * FROM inventory.stock_levels 
         WHERE product_id = $1 AND location_id = $2 AND tenant_id = $3
           AND ($4::uuid IS NULL AND variant_id IS NULL OR variant_id = $4)
         FOR UPDATE`,
        [dto.product_id, dto.location_id, tenantId, dto.variant_id || null],
      ).then(r => r.rows[0]);

      if (!stockLevel) throw new NotFoundException('No stock record found for this product at this location');

      const available = parseInt(stockLevel.quantity) - parseInt(stockLevel.reserved_quantity);
      if (available < dto.quantity) {
        throw new BadRequestException(`Insufficient available stock. Available: ${available}, Requested: ${dto.quantity}`);
      }

      // Create reservation
      const reservation = await client.query(
        `INSERT INTO inventory.stock_reservations (
          tenant_id, product_id, variant_id, location_id,
          quantity, reference_type, reference_id, expires_at, reserved_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [tenantId, dto.product_id, dto.variant_id || null, dto.location_id, dto.quantity, dto.reference_type, dto.reference_id, dto.expires_at, userId],
      ).then(r => r.rows[0]);

      // Update reserved quantity
      await client.query(
        `UPDATE inventory.stock_levels 
         SET reserved_quantity = reserved_quantity + $3, updated_at = NOW()
         WHERE product_id = $1 AND location_id = $4 AND tenant_id = $5
           AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
        [dto.product_id, dto.variant_id || null, dto.quantity, dto.location_id, tenantId],
      );

      this.logger.log(`Stock reserved: qty=${dto.quantity} product=${dto.product_id} ref=${dto.reference_type}:${dto.reference_id}`);

      return reservation;
    });
  }

  async releaseReservation(tenantId: string, userId: string, reservationId: string, convertToMovement = false) {
    return this.db.transaction(async (client) => {
      const reservation = await client.query(
        `SELECT * FROM inventory.stock_reservations WHERE id = $1 AND tenant_id = $2 AND status = 'active' FOR UPDATE`,
        [reservationId, tenantId],
      ).then(r => r.rows[0]);

      if (!reservation) throw new NotFoundException('Active reservation not found');

      const lockKey = this.computeLockKey(reservation.product_id, reservation.location_id);
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

      if (convertToMovement) {
        // Mark reservation as fulfilled
        await client.query(
          `UPDATE inventory.stock_reservations SET status = 'fulfilled', fulfilled_at = NOW() WHERE id = $1`,
          [reservationId],
        );

        // Decrease reserved quantity
        await client.query(
          `UPDATE inventory.stock_levels 
           SET reserved_quantity = GREATEST(reserved_quantity - $3, 0), updated_at = NOW()
           WHERE product_id = $1 AND location_id = $4 AND tenant_id = $5
             AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
          [reservation.product_id, reservation.variant_id, reservation.quantity, reservation.location_id, tenantId],
        );

        // The actual stock deduction is done separately via recordMovement
      } else {
        // Cancel reservation — release held stock
        await client.query(
          `UPDATE inventory.stock_reservations SET status = 'cancelled', fulfilled_at = NOW() WHERE id = $1`,
          [reservationId],
        );

        await client.query(
          `UPDATE inventory.stock_levels 
           SET reserved_quantity = GREATEST(reserved_quantity - $3, 0), updated_at = NOW()
           WHERE product_id = $1 AND location_id = $4 AND tenant_id = $5
             AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
          [reservation.product_id, reservation.variant_id, reservation.quantity, reservation.location_id, tenantId],
        );
      }

      return { released: true, converted: convertToMovement };
    });
  }

  // ═══════════════════════════════════════════════════════
  // TRANSFERS
  // ═══════════════════════════════════════════════════════

  async transferStock(tenantId: string, userId: string, dto: TTransferStock) {
    if (dto.from_location_id === dto.to_location_id) {
      throw new BadRequestException('Cannot transfer to the same location');
    }

    return this.db.transaction(async (client) => {
      // Lock both locations in consistent order to prevent deadlocks
      const [lockA, lockB] = [dto.from_location_id, dto.to_location_id].sort();
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [this.computeLockKey(dto.product_id, lockA)]);
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [this.computeLockKey(dto.product_id, lockB)]);

      // Create transfer record
      const transfer = await client.query(
        `INSERT INTO inventory.stock_transfers (
          tenant_id, from_location_id, to_location_id, status, notes, created_by
        ) VALUES ($1, $2, $3, 'completed', $4, $5) RETURNING *`,
        [tenantId, dto.from_location_id, dto.to_location_id, dto.notes, userId],
      ).then(r => r.rows[0]);

      // Transfer item record
      await client.query(
        `INSERT INTO inventory.stock_transfer_items (
          tenant_id, transfer_id, product_id, variant_id, quantity
        ) VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, transfer.id, dto.product_id, dto.variant_id || null, dto.quantity],
      );

      // Check source stock
      const sourceStock = await client.query(
        `SELECT * FROM inventory.stock_levels 
         WHERE product_id = $1 AND location_id = $2 AND tenant_id = $3
           AND ($4::uuid IS NULL AND variant_id IS NULL OR variant_id = $4)
         FOR UPDATE`,
        [dto.product_id, dto.from_location_id, tenantId, dto.variant_id || null],
      ).then(r => r.rows[0]);

      if (!sourceStock || parseInt(sourceStock.quantity) - parseInt(sourceStock.reserved_quantity) < dto.quantity) {
        const available = sourceStock ? parseInt(sourceStock.quantity) - parseInt(sourceStock.reserved_quantity) : 0;
        throw new BadRequestException(`Insufficient available stock at source. Available: ${available}, Requested: ${dto.quantity}`);
      }

      const unitCost = parseInt(sourceStock.weighted_avg_cost) || 0;

      // Deduct from source
      const fromQty = parseInt(sourceStock.quantity);
      await client.query(
        `UPDATE inventory.stock_levels SET quantity = quantity - $3, updated_at = NOW()
         WHERE product_id = $1 AND location_id = $4 AND tenant_id = $5
           AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
        [dto.product_id, dto.variant_id || null, dto.quantity, dto.from_location_id, tenantId],
      );

      // Record OUT movement
      await client.query(
        `INSERT INTO inventory.stock_movements (
          tenant_id, product_id, variant_id, location_id,
          movement_type, quantity, unit_cost, total_cost,
          quantity_before, quantity_after,
          reference_type, reference_id, notes, performed_by
        ) VALUES ($1,$2,$3,$4,'transfer_out',$5,$6,$7,$8,$9,'transfer',$10,$11,$12)`,
        [
          tenantId, dto.product_id, dto.variant_id || null, dto.from_location_id,
          -dto.quantity, unitCost, unitCost * dto.quantity,
          fromQty, fromQty - dto.quantity,
          transfer.id, dto.notes, userId,
        ],
      );

      // Ensure destination stock level exists
      await client.query(
        `INSERT INTO inventory.stock_levels (tenant_id, product_id, variant_id, location_id, quantity, reserved_quantity, weighted_avg_cost)
         VALUES ($1, $2, $3, $4, 0, 0, 0)
         ON CONFLICT (tenant_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'), location_id) DO NOTHING`,
        [tenantId, dto.product_id, dto.variant_id || null, dto.to_location_id],
      );

      const destStock = await client.query(
        `SELECT * FROM inventory.stock_levels 
         WHERE product_id = $1 AND location_id = $2 AND tenant_id = $3
           AND ($4::uuid IS NULL AND variant_id IS NULL OR variant_id = $4)
         FOR UPDATE`,
        [dto.product_id, dto.to_location_id, tenantId, dto.variant_id || null],
      ).then(r => r.rows[0]);

      const toQty = parseInt(destStock.quantity);

      // Add to destination with cost carry-over
      const destAvgCost = parseInt(destStock.weighted_avg_cost) || 0;
      const newDestAvgCost = (toQty + dto.quantity) > 0
        ? Math.round(((toQty * destAvgCost) + (dto.quantity * unitCost)) / (toQty + dto.quantity))
        : unitCost;

      await client.query(
        `UPDATE inventory.stock_levels SET quantity = quantity + $3, weighted_avg_cost = $6, updated_at = NOW()
         WHERE product_id = $1 AND location_id = $4 AND tenant_id = $5
           AND ($2::uuid IS NULL AND variant_id IS NULL OR variant_id = $2)`,
        [dto.product_id, dto.variant_id || null, dto.quantity, dto.to_location_id, tenantId, newDestAvgCost],
      );

      // Record IN movement
      await client.query(
        `INSERT INTO inventory.stock_movements (
          tenant_id, product_id, variant_id, location_id,
          movement_type, quantity, unit_cost, total_cost,
          quantity_before, quantity_after,
          reference_type, reference_id, notes, performed_by
        ) VALUES ($1,$2,$3,$4,'transfer_in',$5,$6,$7,$8,$9,'transfer',$10,$11,$12)`,
        [
          tenantId, dto.product_id, dto.variant_id || null, dto.to_location_id,
          dto.quantity, unitCost, unitCost * dto.quantity,
          toQty, toQty + dto.quantity,
          transfer.id, dto.notes, userId,
        ],
      );

      // Outbox
      await this.outbox.write(client, {
        tenant_id: tenantId,
        event_type: 'inventory.stock_transferred',
        aggregate_type: 'stock_transfer',
        aggregate_id: transfer.id,
        payload: {
          product_id: dto.product_id,
          from_location: dto.from_location_id,
          to_location: dto.to_location_id,
          quantity: dto.quantity,
        },
      });

      this.logger.log(`Stock transferred: qty=${dto.quantity} product=${dto.product_id} from=${dto.from_location_id} to=${dto.to_location_id}`);

      return transfer;
    });
  }

  // ═══════════════════════════════════════════════════════
  // MOVEMENT HISTORY
  // ═══════════════════════════════════════════════════════

  async getMovements(tenantId: string, query: TMovementQuery) {
    const page = parseInt(query.page);
    const limit = Math.min(parseInt(query.limit), 100);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT sm.*, p.name as product_name, p.sku, l.name as location_name,
        v.name as variant_name, u.display_name as performed_by_name
      FROM inventory.stock_movements sm
      INNER JOIN catalog.products p ON p.id = sm.product_id
      LEFT JOIN catalog.product_variants v ON v.id = sm.variant_id
      INNER JOIN inventory.locations l ON l.id = sm.location_id
      LEFT JOIN iam.users u ON u.id = sm.performed_by
      WHERE sm.tenant_id = $1`;

    const params: any[] = [tenantId];
    let idx = 2;

    if (query.product_id) {
      sql += ` AND sm.product_id = $${idx++}`;
      params.push(query.product_id);
    }

    if (query.location_id) {
      sql += ` AND sm.location_id = $${idx++}`;
      params.push(query.location_id);
    }

    if (query.movement_type) {
      sql += ` AND sm.movement_type = $${idx++}`;
      params.push(query.movement_type);
    }

    if (query.date_from) {
      sql += ` AND sm.created_at >= $${idx++}`;
      params.push(query.date_from);
    }

    if (query.date_to) {
      sql += ` AND sm.created_at <= $${idx++}`;
      params.push(query.date_to);
    }

    sql += ` ORDER BY sm.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await this.db.query(sql, params);
    return { data: result.rows, pagination: { page, limit, hasMore: result.rows.length === limit } };
  }

  // ═══════════════════════════════════════════════════════
  // VALUATION
  // ═══════════════════════════════════════════════════════

  async getInventoryValuation(tenantId: string, locationId?: string) {
    let sql = `
      SELECT sl.product_id, sl.variant_id, sl.location_id,
        p.name as product_name, p.sku, v.name as variant_name, l.name as location_name,
        sl.quantity, sl.weighted_avg_cost,
        sl.quantity * sl.weighted_avg_cost as total_value
      FROM inventory.stock_levels sl
      INNER JOIN catalog.products p ON p.id = sl.product_id
      LEFT JOIN catalog.product_variants v ON v.id = sl.variant_id
      INNER JOIN inventory.locations l ON l.id = sl.location_id
      WHERE sl.tenant_id = $1 AND sl.quantity > 0`;
    
    const params: any[] = [tenantId];
    
    if (locationId) {
      sql += ` AND sl.location_id = $2`;
      params.push(locationId);
    }

    sql += ` ORDER BY p.name ASC`;

    const result = await this.db.query(sql, params);
    
    const totalValue = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.total_value), 0);
    const totalUnits = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.quantity), 0);

    return {
      items: result.rows,
      summary: {
        total_items: result.rows.length,
        total_units: totalUnits,
        total_value: totalValue,
        total_value_formatted: `EGP ${(totalValue / 100).toFixed(2)}`,
      },
    };
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  /**
   * Compute a deterministic advisory lock key from product_id + location_id.
   * Uses a simple hash to fit within bigint range.
   */
  private computeLockKey(productId: string, locationId: string): number {
    const combined = `${productId}:${locationId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}\n