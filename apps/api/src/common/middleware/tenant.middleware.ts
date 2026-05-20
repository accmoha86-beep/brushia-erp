import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Extracts tenant context from request.
 * Every API call (except auth endpoints) must include tenant context.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly excludedPaths = ['/health', '/auth/login', '/auth/register', '/docs'];

  use(req: Request, _res: Response, next: NextFunction): void {
    // Skip tenant check for excluded paths
    if (this.excludedPaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    if (!tenantId) {
      throw new ForbiddenException({
        code: 'TENANT_REQUIRED',
        message: 'X-Tenant-Id header is required',
      });
    }

    // Attach to request for downstream use
    (req as Request & { tenantId: string }).tenantId = tenantId;
    next();
  }
}
