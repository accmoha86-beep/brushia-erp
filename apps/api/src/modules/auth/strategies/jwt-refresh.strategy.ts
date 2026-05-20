import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: true, // We handle expiry via session table
      secretOrKey: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; tid: string }) {
    return payload;
  }
}
