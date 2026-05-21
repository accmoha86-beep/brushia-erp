import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const path = req.path.toLowerCase();

    // Skip tenant check for health, auth, docs, webhook, and tenant lookup endpoints
    if (
      path.includes('/health') ||
      path.includes('/auth/login') ||
      path.includes('/auth/register') ||
      path.includes('/docs') ||
      path.includes('/webhook') ||
      path.includes('/tenants/slug') ||
      path === '/' ||
      path === '/api' ||
      path === '/api/'
    ) {
      return next();
    }

    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    if (!tenantId) {
      throw new ForbiddenException({
        code: 'TENANT_REQUIRED',
        message: 'X-Tenant-Id header is required',
      });
    }

    (req as Request & { tenantId: string }).tenantId = tenantId;
    next();
  }
}
