import * as z from 'zod/mini';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5000;

const siteverifySchema = z.object({
  success: z.boolean(),
  challenge_ts: z.optional(z.string()),
  hostname: z.optional(z.string()),
  action: z.optional(z.string()),
  'error-codes': z._default(z.array(z.string()), []),
});

export interface TurnstileResult {
  success: boolean;
  /** When the visitor solved the challenge; used for the minimum fill time. */
  challengeTs: Date | null;
  hostname: string | null;
  action: string | null;
  errorCodes: string[];
}

interface VerifyOptions {
  token: string;
  secret: string;
  ip: string;
  fetchImpl?: typeof fetch;
}

const FAILED: TurnstileResult = {
  success: false,
  challengeTs: null,
  hostname: null,
  action: null,
  errorCodes: ['verification-unavailable'],
};

/** Server-side token verification; a network error or malformed reply counts as a failure. */
export async function verifyTurnstile({
  token,
  secret,
  ip,
  fetchImpl = fetch,
}: VerifyOptions): Promise<TurnstileResult> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return FAILED;
    const parsed = siteverifySchema.safeParse(await response.json());
    if (!parsed.success) return FAILED;
    const data = parsed.data;
    const challengeTs = data.challenge_ts ? new Date(data.challenge_ts) : null;
    return {
      success: data.success,
      challengeTs: challengeTs && !Number.isNaN(challengeTs.getTime()) ? challengeTs : null,
      hostname: data.hostname ?? null,
      action: data.action ?? null,
      errorCodes: data['error-codes'],
    };
  } catch {
    return FAILED;
  }
}
