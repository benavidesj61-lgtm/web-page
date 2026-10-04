import type {
  ContactErrorCode,
  ContactErrorResponse,
  ContactSuccessResponse,
} from '../schemas/contact';

/*
 * Netlify's [[headers]] rules cover static files only, so API responses carry their own
 * hardening: no caching, no MIME sniffing, no framing and no resources allowed to load.
 */
const API_HEADERS: Readonly<Record<string, string>> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

const STATUS: Record<ContactErrorCode, number> = {
  method_not_allowed: 405,
  forbidden: 403,
  unsupported_media_type: 415,
  payload_too_large: 413,
  invalid_json: 400,
  validation: 400,
  too_fast: 400,
  challenge_failed: 403,
  rate_limited: 429,
  unavailable: 503,
};

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...API_HEADERS, ...headers } });
}

export function success(): Response {
  const body: ContactSuccessResponse = { ok: true };
  return json(200, body);
}

export function failure(
  error: ContactErrorCode,
  extra: Pick<ContactErrorResponse, 'fields'> = {},
  headers: Record<string, string> = {},
): Response {
  const body: ContactErrorResponse = { ok: false, error, ...extra };
  return json(STATUS[error], body, headers);
}
