/**
 * Contact form contract shared by the browser (UX validation) and the Netlify Function
 * (authoritative validation). `zod/mini` keeps the client bundle small.
 * Relative imports only: this file is also bundled by Netlify's function bundler.
 */
import * as z from 'zod/mini';

export const CONTACT_FORM = {
  endpoint: '/api/contacto/',
  successPath: '/gracias/',
  /** Honeypot input name: humans never see it, bots tend to fill it. */
  honeypotField: 'sitio-web',
  turnstileField: 'cf-turnstile-response',
  /** Turnstile action name, checked on the server so a token from another form is rejected. */
  turnstileAction: 'contacto',
  /** Submissions completed faster than this are treated as automated. */
  minFillMs: 3000,
} as const;

export const CONTACT_LIMITS = {
  nombre: { min: 2, max: 100 },
  correo: { max: 120 },
  telefono: { minDigits: 8, maxDigits: 15, max: 20 },
  producto: { max: 120 },
  mensaje: { min: 10, max: 2000 },
  turnstileToken: { max: 2048 },
} as const;

/** Upper bound for the raw JSON body; anything larger is rejected before parsing. */
export const MAX_BODY_BYTES = 16 * 1024;

// Each pattern is linear (no nested quantifiers) and only runs after the length check aborts long input.
const NAME_PATTERN = /^[\p{L}\p{M}' .-]+$/u;
const EMAIL_PATTERN = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>().]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;
const SLUG_PATTERN = /^[a-z0-9-]+$/;
// Control characters other than tab and line breaks never belong in a message.
// eslint-disable-next-line no-control-regex -- matching control characters is the point.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const noControlChars = (message: string) =>
  z.refine<string>((value) => !CONTROL_CHARS.test(value), message);

const countDigits = (value: string) => value.replace(/\D/g, '').length;

export const contactFieldsSchema = z.strictObject({
  nombre: z.string().check(
    z.trim(),
    z.minLength(1, { error: 'Escriba su nombre.', abort: true }),
    z.minLength(CONTACT_LIMITS.nombre.min, {
      error: 'El nombre debe tener al menos 2 caracteres.',
      abort: true,
    }),
    z.maxLength(CONTACT_LIMITS.nombre.max, {
      error: 'El nombre debe tener máximo 100 caracteres.',
      abort: true,
    }),
    z.regex(NAME_PATTERN, 'Use solo letras, espacios, puntos, apóstrofos o guiones.'),
  ),
  correo: z.string().check(
    z.trim(),
    z.minLength(1, { error: 'Escriba su correo electrónico.', abort: true }),
    z.maxLength(CONTACT_LIMITS.correo.max, {
      error: 'El correo debe tener máximo 120 caracteres.',
      abort: true,
    }),
    z.regex(EMAIL_PATTERN, 'Escriba un correo válido, por ejemplo nombre@empresa.com.'),
  ),
  telefono: z.string().check(
    z.trim(),
    z.minLength(1, { error: 'Escriba su número de teléfono.', abort: true }),
    z.maxLength(CONTACT_LIMITS.telefono.max, {
      error: 'El teléfono debe tener máximo 20 caracteres.',
      abort: true,
    }),
    z.regex(PHONE_PATTERN, {
      error: 'Use solo números, espacios, guiones, paréntesis o el signo +.',
      abort: true,
    }),
    z.refine(
      (value: string) =>
        countDigits(value) >= CONTACT_LIMITS.telefono.minDigits &&
        countDigits(value) <= CONTACT_LIMITS.telefono.maxDigits,
      'Escriba un teléfono válido de 8 a 15 dígitos, por ejemplo 7529-2926.',
    ),
  ),
  /** Product slug or empty. The server also checks that the slug exists in the catalog. */
  producto: z.string().check(
    z.trim(),
    z.maxLength(CONTACT_LIMITS.producto.max, { error: 'Producto no válido.', abort: true }),
    z.refine((value: string) => value === '' || SLUG_PATTERN.test(value), 'Producto no válido.'),
  ),
  mensaje: z.string().check(
    z.trim(),
    z.minLength(1, { error: 'Cuéntenos en qué podemos ayudarle.', abort: true }),
    z.minLength(CONTACT_LIMITS.mensaje.min, {
      error: 'El mensaje debe tener al menos 10 caracteres.',
      abort: true,
    }),
    z.maxLength(CONTACT_LIMITS.mensaje.max, {
      error: 'El mensaje debe tener máximo 2000 caracteres.',
      abort: true,
    }),
    noControlChars('El mensaje contiene caracteres no permitidos.'),
  ),
});

export type ContactFields = z.infer<typeof contactFieldsSchema>;
export type ContactFieldName = keyof ContactFields;

export const CONTACT_FIELD_NAMES = Object.keys(contactFieldsSchema.shape) as ContactFieldName[];

/** Exact body the browser sends. Unknown keys are rejected (whitelist). */
export const contactRequestSchema = z.strictObject({
  ...contactFieldsSchema.shape,
  [CONTACT_FORM.turnstileField]: z
    .string()
    .check(z.minLength(1), z.maxLength(CONTACT_LIMITS.turnstileToken.max)),
  // Accepted so bots that fill it get a silent success; the handler drops those requests.
  [CONTACT_FORM.honeypotField]: z.string().check(z.maxLength(500)),
});

export type ContactRequest = z.infer<typeof contactRequestSchema>;

/** Error codes the API returns. Clients map them to copy; no internal detail is ever exposed. */
export type ContactErrorCode =
  | 'method_not_allowed'
  | 'forbidden'
  | 'unsupported_media_type'
  | 'payload_too_large'
  | 'invalid_json'
  | 'validation'
  | 'too_fast'
  | 'challenge_failed'
  | 'rate_limited'
  | 'unavailable';

export interface ContactErrorResponse {
  ok: false;
  error: ContactErrorCode;
  /** Only for `validation`: names of the invalid fields, never the rejected values. */
  fields?: ContactFieldName[];
}

export interface ContactSuccessResponse {
  ok: true;
}

/** First message per field, in the field order of the form. */
export function getFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Partial<Record<ContactFieldName, string>> {
  const errors: Partial<Record<ContactFieldName, string>> = {};
  for (const issue of issues) {
    const [field] = issue.path;
    if (typeof field !== 'string' || !isContactFieldName(field)) continue;
    errors[field] ??= issue.message;
  }
  return errors;
}

export function isContactFieldName(value: string): value is ContactFieldName {
  return (CONTACT_FIELD_NAMES as readonly string[]).includes(value);
}
