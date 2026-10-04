import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCatalogCache } from '../src/lib/server/catalog';
import { handleContactRequest, type ContactDependencies } from '../src/lib/server/contact-handler';
import type { ServerEnv } from '../src/lib/server/env';
import { createMemoryStore, createRateLimiter } from '../src/lib/server/rate-limit';

const ORIGIN = 'https://lescent.com.sv';
const URL_API = `${ORIGIN}/api/contacto/`;
const NOW = Date.parse('2026-10-04T15:00:00Z');
const FAKE_SECRET = 'turnstile-secret-for-tests';
const FAKE_API_KEY = 'resend-key-for-tests';

const env: ServerEnv = {
  TURNSTILE_SECRET_KEY: FAKE_SECRET,
  RESEND_API_KEY: FAKE_API_KEY,
  CONTACT_TO_EMAIL: 'ventas@lescent.com.sv',
  CONTACT_FROM_EMAIL: 'LE SCENT <contacto@lescent.com.sv>',
};

const validBody = {
  nombre: 'María López',
  correo: 'maria@empresa.com',
  telefono: '7529-2926',
  producto: 'lattafa-yara-100-ml',
  mensaje: 'Necesito 25 sets <b>para</b> clientes.',
  'cf-turnstile-response': 'token-ok',
  'sitio-web': '',
};

interface TurnstileReply {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
}

let turnstileReply: TurnstileReply;
let resendStatus: number;
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function setupFetch() {
  fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    if (url.includes('challenges.cloudflare.com')) return jsonResponse(turnstileReply);
    if (url.endsWith('/catalogo/indice.json')) {
      return jsonResponse([{ slug: 'lattafa-yara-100-ml', id: 'LS-011', nombre: 'Lattafa Yara' }]);
    }
    if (url.startsWith('https://api.resend.com'))
      return jsonResponse({ id: 'email' }, resendStatus);
    throw new Error(`Unexpected fetch ${url}`);
  });
}

function deps(overrides: Partial<ContactDependencies> = {}): ContactDependencies {
  return {
    env,
    ip: '203.0.113.7',
    rateLimiter: createRateLimiter(createMemoryStore(), {
      limit: 5,
      windowMs: 900_000,
      now: () => NOW,
    }),
    fetchImpl: fetchMock,
    now: () => NOW,
    ...overrides,
  };
}

function request(
  body: unknown = validBody,
  { method = 'POST', origin = ORIGIN, contentType = 'application/json' } = {},
): Request {
  const headers = new Headers();
  if (origin) headers.set('Origin', origin);
  if (contentType) headers.set('Content-Type', contentType);
  return new Request(URL_API, {
    method,
    headers,
    ...(method === 'GET' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

const errorOf = async (response: Response) => ((await response.json()) as { error?: string }).error;
const resendCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('resend'));

beforeEach(() => {
  clearCatalogCache();
  turnstileReply = {
    success: true,
    challenge_ts: new Date(NOW - 20_000).toISOString(),
    hostname: 'lescent.com.sv',
    action: 'contacto',
  };
  resendStatus = 200;
  setupFetch();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('handleContactRequest: transport checks', () => {
  it('answers 405 with Allow for anything but POST', async () => {
    const response = await handleContactRequest(request(undefined, { method: 'GET' }), deps());
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });

  it.each([['https://evil.example'], ['']])(
    'rejects a foreign or missing Origin (%s)',
    async (origin) => {
      const response = await handleContactRequest(request(validBody, { origin }), deps());
      expect(response.status).toBe(403);
    },
  );

  it('requires a JSON body (forms posted cross-site cannot use it without CORS)', async () => {
    const response = await handleContactRequest(
      request('nombre=x', { contentType: 'application/x-www-form-urlencoded' }),
      deps(),
    );
    expect(response.status).toBe(415);
  });

  it('rejects bodies over 16 KB even without a Content-Length header', async () => {
    const response = await handleContactRequest(
      request({ ...validBody, mensaje: 'x'.repeat(20_000) }),
      deps(),
    );
    expect(response.status).toBe(413);
  });

  it('rejects malformed JSON', async () => {
    const response = await handleContactRequest(request('{"nombre":'), deps());
    expect(await errorOf(response)).toBe('invalid_json');
  });

  it('sends hardened, non-cacheable responses', async () => {
    const response = await handleContactRequest(request(), deps());
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('handleContactRequest: field whitelist and validation', () => {
  it.each([
    ['an unexpected field', { ...validBody, precio: 1 }],
    ['a privileged field', { ...validBody, rol: 'admin' }],
    ['an invalid email', { ...validBody, correo: 'x' }],
    ['a missing token', { ...validBody, 'cf-turnstile-response': '' }],
  ])('rejects %s with 400 and sends nothing', async (_label, body) => {
    const response = await handleContactRequest(request(body), deps());
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists only field names, never the rejected values', async () => {
    const response = await handleContactRequest(
      request({ ...validBody, correo: 'mal<script>' }),
      deps(),
    );
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ ok: false, error: 'validation', fields: ['correo'] });
    expect(text).not.toContain('script');
  });

  it('rejects a product slug that is not in the catalog', async () => {
    const response = await handleContactRequest(
      request({ ...validBody, producto: 'no-existe' }),
      deps(),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ fields: ['producto'] });
    expect(resendCalls()).toHaveLength(0);
  });
});

describe('handleContactRequest: anti-bot', () => {
  it('silently accepts honeypot submissions without verifying or sending', async () => {
    const response = await handleContactRequest(
      request({ ...validBody, 'sitio-web': 'http://spam' }),
      deps(),
    );
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each<[string, Partial<TurnstileReply>]>([
    ['a failed challenge', { success: false, 'error-codes': ['invalid-input-response'] }],
    ['a token from another form', { action: 'login' }],
    ['a token issued for another site', { hostname: 'evil.example' }],
  ])('rejects %s', async (_label, reply) => {
    turnstileReply = { ...turnstileReply, ...reply };
    const response = await handleContactRequest(request(), deps());
    expect(await errorOf(response)).toBe('challenge_failed');
    expect(resendCalls()).toHaveLength(0);
  });

  it('treats an unreachable Turnstile as a failure (fail closed)', async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('network');
    });
    const response = await handleContactRequest(request(), deps());
    expect(response.status).toBe(403);
  });

  it('rejects forms completed in under 3 seconds', async () => {
    turnstileReply.challenge_ts = new Date(NOW - 1_000).toISOString();
    const response = await handleContactRequest(request(), deps());
    expect(await errorOf(response)).toBe('too_fast');
  });

  it('limits each IP to 5 attempts and answers 429 with Retry-After', async () => {
    const shared = deps();
    for (let i = 0; i < 5; i++) {
      expect((await handleContactRequest(request(), shared)).status).toBe(200);
    }
    const blocked = await handleContactRequest(request(), shared);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
});

describe('handleContactRequest: delivery', () => {
  it('sends one escaped email with the catalog name and the visitor as reply-to', async () => {
    const response = await handleContactRequest(
      request({ ...validBody, producto: 'lattafa-yara-100-ml' }),
      deps(),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const [call] = resendCalls();
    expect(call).toBeDefined();
    const init = call?.[1];
    const payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(payload['reply_to']).toBe('maria@empresa.com');
    expect(payload['to']).toEqual(['ventas@lescent.com.sv']);
    expect(String(payload['html'])).toContain('Lattafa Yara (LS-011)');
    expect(String(payload['html'])).toContain('&lt;b&gt;para&lt;/b&gt;');
    expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${FAKE_API_KEY}`);
  });

  it('never leaks secrets in responses', async () => {
    const text = await (await handleContactRequest(request(), deps())).text();
    expect(text).not.toContain(FAKE_SECRET);
    expect(text).not.toContain(FAKE_API_KEY);
  });

  it('answers a generic 503 when the email provider fails', async () => {
    resendStatus = 500;
    const response = await handleContactRequest(request(), deps());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: 'unavailable' });
  });

  it('answers 503 without contacting anyone when the server is misconfigured', async () => {
    const response = await handleContactRequest(request(), deps({ env: null }));
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
