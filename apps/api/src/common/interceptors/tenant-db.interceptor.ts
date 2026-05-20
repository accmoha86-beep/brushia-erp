import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../database/database.constants';

/**
 * Sets the PostgreSQL session variable for RLS tenant isolation.
 * 
 * This interceptor runs before every request handler and sets:
 *   SET LOCAL app.current_tenant_id = '<uuid>';
 * 
 * PostgreSQL RLS policies then use:
 *   current_setting('app.current_tenant_id')
 * to filter rows automatically.
 * 
 * SET LOCAL is transaction-scoped, so it's automatically cleared
 * when the transaction/connection is returned to the pool.
 */
@Injectable()
export class TenantDbInterceptor implements NestInterceptor {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (tenantId) {
      // SET LOCAL is transaction-scoped and safe for connection pooling
      this.db.execute(
        `SELECT set_config('app.current_tenant_id', '${tenantId}', true)`,
      );
    }

    return next.handle();
  }
}
