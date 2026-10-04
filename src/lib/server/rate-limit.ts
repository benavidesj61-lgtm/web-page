import { getStore } from '@netlify/blobs';

export interface RateLimitDecision {
  allowed: boolean;
  /** Seconds until the oldest counted request leaves the window. */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  /** Counts this attempt and reports whether it is within the limit. */
  hit(key: string): Promise<RateLimitDecision>;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

interface TimestampStore {
  read(key: string): Promise<number[]>;
  write(key: string, timestamps: number[]): Promise<void>;
}

/** Sliding window over a list of timestamps per key. */
export function createRateLimiter(store: TimestampStore, options: RateLimitOptions): RateLimiter {
  const now = options.now ?? Date.now;
  return {
    async hit(key) {
      const current = now();
      const recent = (await store.read(key)).filter((time) => current - time < options.windowMs);
      if (recent.length >= options.limit) {
        const oldest = Math.min(...recent);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((oldest + options.windowMs - current) / 1000)),
        };
      }
      recent.push(current);
      await store.write(key, recent);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export function createMemoryStore(): TimestampStore {
  const data = new Map<string, number[]>();
  return {
    read: async (key) => data.get(key) ?? [],
    write: async (key, timestamps) => {
      data.set(key, timestamps);
    },
  };
}

/**
 * Netlify Blobs keeps counters across function instances and cold starts. Outside Netlify
 * (local tooling) the store is unavailable, so it degrades to per-instance memory and says so:
 * Turnstile stays the primary barrier either way.
 */
export function createBlobStore(name: string): TimestampStore {
  let backend: TimestampStore | undefined;
  const resolve = (): TimestampStore => {
    if (backend) return backend;
    try {
      const store = getStore({ name, consistency: 'strong' });
      backend = {
        read: async (key) => {
          const value: unknown = await store.get(key, { type: 'json' });
          return Array.isArray(value)
            ? value.filter((item): item is number => typeof item === 'number')
            : [];
        },
        write: async (key, timestamps) => {
          await store.setJSON(key, timestamps);
        },
      };
    } catch {
      console.error('[contacto] Netlify Blobs no disponible: límite de envíos solo en memoria.');
      backend = createMemoryStore();
    }
    return backend;
  };
  return {
    read: (key) => resolve().read(key),
    write: (key, timestamps) => resolve().write(key, timestamps),
  };
}

/** IPs are personal data: only a hash is stored as the counter key. */
export async function hashKey(scope: string, value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${scope}:${value}`),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
