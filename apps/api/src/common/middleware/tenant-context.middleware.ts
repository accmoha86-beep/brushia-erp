import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Extracts tenant context from the request.
 * 
 * Tenant identification strategy (in order):
 * 1. JWT payload (tid claim) — for authenticated requests
 * 2. X-Tenant-Id header — for public endpoints during onboarding
 * 3. Subdomain extraction — for multi-tenant SaaS (future)
 * 
 * Once identified, the tenant ID is set in the request context
 * and will be used by the database layer to SET LOCAL app.current_tenant_id
 * for PostgreSQL RLS enforcement.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Priority 1: From JWT (set by auth guard)
    const jwtTenantId = (req as any).user?.tid;
    
    // Priority 2: From header
    const headerTenantId = req.headers['x-tenant-id'] as string;

    const tenantId = jwtTenantId || headerTenantId;

    if (tenantId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }
      
      (req as any).tenantId = tenantId;
    }

    next();
  }
}
