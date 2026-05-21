import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const SALT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  /**
   * Uses bcryptjs with 12 rounds — strong enough for enterprise,
   * fast enough for dev (pure JS, no native bindings needed).
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /** Alias for compare — used by AuthService */
  async verify(password: string, hash: string): Promise<boolean> {
    return this.compare(password, hash);
  }

  /** Validate password strength rules */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
      // Only require letters, not necessarily uppercase
    }
    // For now, basic validation — can be made stricter later
    return { valid: errors.length === 0, errors };
  }

  /** Generate a cryptographically secure random token */
  generateToken(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /** SHA-256 hash for refresh tokens (stored in DB, not reversible) */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
