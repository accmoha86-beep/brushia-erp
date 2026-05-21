import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPerms) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.permissions) return false;

    // Wildcard: admin with '*' permission bypasses all checks
    if (user.permissions.includes('*')) return true;

    return requiredPerms.every(p => user.permissions.includes(p));
  }
}
