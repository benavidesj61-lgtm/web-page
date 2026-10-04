import * as z from 'zod/mini';
import { CONTACT } from '../../data/site';

/** Server-only configuration. Values come from Netlify environment variables, never from code. */
const serverEnvSchema = z.object({
  TURNSTILE_SECRET_KEY: z.string().check(z.minLength(1)),
  RESEND_API_KEY: z.string().check(z.minLength(1)),
  CONTACT_TO_EMAIL: z._default(z.email(), CONTACT.email),
  CONTACT_FROM_EMAIL: z._default(
    z.string().check(z.minLength(3)),
    'LE SCENT <onboarding@resend.dev>',
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates the environment once per request. Empty strings count as missing so a blank
 * variable in the hosting panel fails loudly instead of sending unauthenticated requests.
 * Only variable names are logged, never values.
 */
export function readServerEnv(source: Record<string, string | undefined>): ServerEnv | null {
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value.trim() !== ''),
  );
  const result = serverEnvSchema.safeParse(cleaned);
  if (result.success) return result.data;
  const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
  console.error('[contacto] Configuración incompleta o inválida:', names.join(', '));
  return null;
}
