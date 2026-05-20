import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth.service';

/**
 * Extract the current authenticated user from the request.
 * 
 * Usage:
 * ```
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 * 
 * @Get('tenant')
 * getTenant(@CurrentUser('tid') tenantId: string) {
 *   return tenantId;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
