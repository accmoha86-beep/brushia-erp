import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, lt } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.constants';
import * as schema from '@brushia/db';
import { PasswordService } from './password.service';

@Injectable()
export class SessionService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Create a new session with a hashed refresh token.
   * Returns the raw refresh token (sent to client once, never stored raw).
   */
  async createSession(data: {
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: 'web' | 'pos' | 'mobile' | 'api';
  }): Promise<{ sessionId: string; refreshToken: string }> {
    const refreshToken = this.passwordService.generateToken(64);
    const refreshTokenHash = this.passwordService.hashToken(refreshToken);

    // Default session: 7 days for web, 30 days for POS (needs longer offline)
    const expiryDays = data.deviceType === 'pos' ? 30 : 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const [session] = await this.db
      .insert(schema.sessions)
      .values({
        userId: data.userId,
        tenantId: data.tenantId,
        refreshTokenHash,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceType: data.deviceType ?? 'web',
        expiresAt,
      })
      .returning();

    return { sessionId: session.id, refreshToken };
  }

  /**
   * Validate and rotate a refresh token.
   * Implements refresh token rotation: old token is invalidated,
   * new token is issued. If an old token is reused, ALL sessions
   * for that user are revoked (compromise detection).
   */
  async rotateRefreshToken(rawToken: string): Promise<{
    sessionId: string;
    userId: string;
    tenantId: string;
    refreshToken: string;
  } | null> {
    const tokenHash = this.passwordService.hashToken(rawToken);

    const [session] = await this.db
      .select()
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.refreshTokenHash, tokenHash),
          eq(schema.sessions.isActive, true),
        ),
      );

    if (!session) {
      // Token not found — might be a reuse attack.
      // In production: revoke ALL sessions for this user
      // and trigger security alert.
      return null;
    }

    if (new Date() > session.expiresAt) {
      // Session expired — revoke it
      await this.revokeSession(session.id);
      return null;
    }

    // Revoke old session
    await this.revokeSession(session.id);

    // Create new session (rotation)
    const newRefreshToken = this.passwordService.generateToken(64);
    const newTokenHash = this.passwordService.hashToken(newRefreshToken);

    const expiryDays = session.deviceType === 'pos' ? 30 : 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const [newSession] = await this.db
      .insert(schema.sessions)
      .values({
        userId: session.userId,
        tenantId: session.tenantId,
        refreshTokenHash: newTokenHash,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceType: session.deviceType,
        expiresAt,
      })
      .returning();

    return {
      sessionId: newSession.id,
      userId: session.userId,
      tenantId: session.tenantId,
      refreshToken: newRefreshToken,
    };
  }

  async revokeSession(sessionId: string) {
    await this.db
      .update(schema.sessions)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(schema.sessions.id, sessionId));
  }

  /**
   * Revoke ALL sessions for a user.
   * Used for: password change, compromise detection, admin lockout.
   */
  async revokeAllUserSessions(userId: string) {
    await this.db
      .update(schema.sessions)
      .set({ isActive: false, revokedAt: new Date() })
      .where(and(eq(schema.sessions.userId, userId), eq(schema.sessions.isActive, true)));
  }

  /**
   * Cleanup expired sessions (called by background job).
   */
  async cleanupExpiredSessions() {
    const result = await this.db
      .update(schema.sessions)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.sessions.isActive, true),
          lt(schema.sessions.expiresAt, new Date()),
        ),
      )
      .returning({ id: schema.sessions.id });

    return result.length;
  }
}
