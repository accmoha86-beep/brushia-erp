/**
 * Web app environment validation.
 */

import { z } from 'zod';

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Brushia ERP'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function validateWebEnv(): WebEnv {
  const result = webEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!result.success) {
    throw new Error(
      'Web environment validation failed:\n' +
      result.error.issues.map((i) => `  ${i.path}: ${i.message}`).join('\n'),
    );
  }

  return result.data;
}
