import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const createTenantSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  email: z.string().email(),
  phone: z.string().regex(/^\+[0-9]{10,15}$/).optional(),
  plan: z.enum(['trial', 'starter', 'professional', 'enterprise']).optional(),
  legalName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  commercialReg: z.string().max(50).optional(),
  governorate: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  currency: z.string().length(3).optional(),
});

const updateTenantSchema = createTenantSchema.partial();

export class CreateTenantDto extends createZodDto(createTenantSchema) {}
export class UpdateTenantDto extends createZodDto(updateTenantSchema) {}
