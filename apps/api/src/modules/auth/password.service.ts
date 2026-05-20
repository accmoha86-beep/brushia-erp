import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  /**
   * Hash a plain-text password.
   * Uses bcrypt with 12 rounds — strong enough for enterprise,
   * fast enough for UX.
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash.
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hash a token (refresh token, API key, etc.) using SHA-256.
   * Used for token storage — we never store raw tokens.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a cryptographically secure random token.
   */
  generateToken(length: number = 48): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Validate password strength.
   * Enterprise requirements:
   * - Min 8 chars
   * - At least 1 uppercase
   * - At least 1 lowercase
   * - At least 1 digit
   * - At least 1 special char
   */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Must contain at least one digit');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Must contain at least one special character');

    return { valid: errors.length === 0, errors };
  }
}
