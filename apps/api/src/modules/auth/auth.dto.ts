import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const loginSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(1),
  deviceType: z.enum(['web', 'pos', 'mobile', 'api']).optional(),
});

const registerSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().regex(/^\+[0-9]{10,15}$/).optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export class LoginDto extends createZodDto(loginSchema) {}
export class RegisterDto extends createZodDto(registerSchema) {}
export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
