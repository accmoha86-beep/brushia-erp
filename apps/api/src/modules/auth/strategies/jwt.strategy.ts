import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      issuer: 'bloom-erp',
    });
  }

  /**
   * Called after JWT verification succeeds.
   * Maps compact JWT claims to friendly property names for controllers.
   */
  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tid) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      // Friendly names for controllers
      id: payload.sub,
      tenantId: payload.tid,
      email: payload.email,
      permissions: payload.permissions,
      // Also keep original JWT claim names
      sub: payload.sub,
      tid: payload.tid,
    };
  }
}
