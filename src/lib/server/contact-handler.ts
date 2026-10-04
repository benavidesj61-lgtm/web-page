import {
  CONTACT_FORM,
  MAX_BODY_BYTES,
  contactRequestSchema,
  getFieldErrors,
  type ContactFieldName,
} from '../schemas/contact';
import { loadCatalog } from './catalog';
import { buildContactEmail, sendWithResend } from './email';
import type { ServerEnv } from './env';
import { failure, success } from './http';
import { hashKey, type RateLimiter } from './rate-limit';
import { verifyTurnstile } from './turnstile';

export interface ContactDependencies {
  env: ServerEnv | null;
  rateLimiter: RateLimiter;
  /** Client IP as reported by the platform (never taken from a request header we don't control). */
  ip: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

type Log = (reason: string) => void;
// Only the reason is logged: no names, emails, messages or IPs end up in the logs.
const logRejection: Log = (reason) => console.warn('[contacto] Solicitud rechazada:', reason);

/** Reads at most `limit` bytes; a missing or lying Content-Length cannot bypass the cap. */
async function readBody(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/**
 * The only server endpoint of the site. Every check runs here, in order from cheapest to most
 * expensive, and every rejection returns a generic error code.
 */
export async function handleContactRequest(
  request: Request,
  { env, rateLimiter, ip, fetchImpl = fetch, now = Date.now }: ContactDependencies,
): Promise<Response> {
  if (request.method !== 'POST') {
    return failure('method_not_allowed', {}, { Allow: 'POST' });
  }

  // CSRF: browsers always send Origin on cross-site POSTs; only this site's pages may call the API.
  const requestOrigin = new URL(request.url).origin;
  if (request.headers.get('origin') !== requestOrigin) {
    logRejection('origin');
    return failure('forbidden');
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return failure('unsupported_media_type');
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) return failure('payload_too_large');
  const raw = await readBody(request, MAX_BODY_BYTES);
  if (raw === null) return failure('payload_too_large');

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return failure('invalid_json');
  }

  const parsed = contactRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const fields = Object.keys(getFieldErrors(parsed.error.issues)) as ContactFieldName[];
    logRejection('validation');
    return failure('validation', { fields });
  }
  const data = parsed.data;

  // Bots that fill the honeypot get a normal-looking success, so they learn nothing.
  if (data[CONTACT_FORM.honeypotField] !== '') {
    logRejection('honeypot');
    return success();
  }

  if (!env) return failure('unavailable');

  const limit = await rateLimiter.hit(await hashKey('contacto', ip || 'sin-ip'));
  if (!limit.allowed) {
    logRejection('rate_limit');
    return failure('rate_limited', {}, { 'Retry-After': String(limit.retryAfterSeconds) });
  }

  const challenge = await verifyTurnstile({
    token: data[CONTACT_FORM.turnstileField],
    secret: env.TURNSTILE_SECRET_KEY,
    ip,
    fetchImpl,
  });
  const expectedHost = new URL(request.url).hostname;
  if (
    !challenge.success ||
    challenge.action !== CONTACT_FORM.turnstileAction ||
    (challenge.hostname !== null && challenge.hostname !== expectedHost)
  ) {
    logRejection(`turnstile ${challenge.errorCodes.join(',') || 'mismatch'}`);
    return failure('challenge_failed');
  }

  // The challenge timestamp comes from Cloudflare, so the client cannot fake the fill time.
  if (!challenge.challengeTs || now() - challenge.challengeTs.getTime() < CONTACT_FORM.minFillMs) {
    logRejection('too_fast');
    return failure('too_fast');
  }

  let product = null;
  if (data.producto !== '') {
    const catalog = await loadCatalog(requestOrigin, fetchImpl);
    if (!catalog) return failure('unavailable');
    product = catalog.get(data.producto) ?? null;
    if (!product) {
      logRejection('unknown_product');
      return failure('validation', { fields: ['producto'] });
    }
  }

  const sent = await sendWithResend({
    apiKey: env.RESEND_API_KEY,
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    replyTo: data.correo,
    email: buildContactEmail(data, product, new Date(now())),
    // A retried request with the same token must not send the email twice.
    idempotencyKey: await hashKey('resend', data[CONTACT_FORM.turnstileField]),
    fetchImpl,
  });
  if (!sent) return failure('unavailable');

  return success();
}
