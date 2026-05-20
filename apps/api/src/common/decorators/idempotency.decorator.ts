import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY = 'IDEMPOTENCY';
export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-idempotency-key'];
  },
);
