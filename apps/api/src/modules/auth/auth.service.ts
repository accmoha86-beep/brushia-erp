import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;        // user id
  tid: string;        // tenant id
  email: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Register a new user within a tenant.
   */
  async register(data: {
    tenantId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    // Validate password strength
    const strength = this.passwordService.validateStrength(data.password);
    if (!strength.valid) {
      throw new BadRequestException(strength.errors);
    }

    // Check uniqueness
    const existing = await this.authRepo.findUserByEmail(data.tenantId, data.email);
    if (existing) {
      throw new ConflictException('Email already registered in this organization');
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(data.password);

    // Create user
    const user = await this.authRepo.createUser({
      tenantId: data.tenantId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Authenticate a user and issue tokens.
   */
  async login(data: {
    tenantId: string;
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
    deviceType?: 'web' | 'pos' | 'mobile' | 'api';
  }): Promise<AuthTokens & { user: Record<string, unknown> }> {
    // Find user
    const user = await this.authRepo.findUserByEmail(data.tenantId, data.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if locked
    if (user.status === 'locked') {
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        throw new ForbiddenException(
          'Account is temporarily locked. Try again later.',
        );
      }
      // Lock expired — will be reset on successful login
    }

    // Check if inactive
    if (user.status === 'inactive') {
      throw new ForbiddenException('Account is deactivated. Contact your administrator.');
    }

    // Verify password
    const isValid = await this.passwordService.verify(data.password, user.passwordHash);
    if (!isValid) {
      // Increment failed attempts (trigger handles locking at 5)
      await this.authRepo.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Success — update last login, reset failed attempts
    await this.authRepo.updateLastLogin(user.id);

    // Get permissions
    const permissions = await this.authRepo.getUserPermissions(user.id);

    // Create session
    const { refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      tenantId: data.tenantId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceType: data.deviceType,
    });

    // Issue access token
    const payload: JwtPayload = {
      sub: user.id,
      tid: data.tenantId,
      email: user.email,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    const { passwordHash: _, ...safeUser } = user;

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      user: safeUser as Record<string, unknown>,
    };
  }

  /**
   * Refresh access token using refresh token rotation.
   */
  async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    const result = await this.sessionService.rotateRefreshToken(rawRefreshToken);

    if (!result) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get fresh permissions
    const permissions = await this.authRepo.getUserPermissions(result.userId);
    const user = await this.authRepo.findUserById(result.userId);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    const payload: JwtPayload = {
      sub: result.userId,
      tid: result.tenantId,
      email: user.email,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: result.refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    };
  }

  /**
   * Logout — revoke the session.
   */
  async logout(refreshToken: string) {
    const tokenHash = this.passwordService.hashToken(refreshToken);
    // We don't throw if not found — logout is always successful from the client's perspective
    await this.sessionService.revokeSession(tokenHash);
  }

  /**
   * Change password — requires current password.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isValid = await this.passwordService.verify(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password
    const strength = this.passwordService.validateStrength(newPassword);
    if (!strength.valid) {
      throw new BadRequestException(strength.errors);
    }

    // Hash and update
    const newHash = await this.passwordService.hash(newPassword);
    await this.authRepo.updatePassword(userId, newHash);

    // Revoke all sessions except current (force re-login everywhere)
    await this.sessionService.revokeAllUserSessions(userId);
  }
}
