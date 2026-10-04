import { describe, expect, it } from 'vitest';
import { createMemoryStore, createRateLimiter, hashKey } from '../src/lib/server/rate-limit';

describe('rate limiter', () => {
  it('allows the limit, blocks the next request and recovers after the window', async () => {
    let now = 1_000_000;
    const limiter = createRateLimiter(createMemoryStore(), {
      limit: 5,
      windowMs: 60_000,
      now: () => now,
    });
    for (let i = 0; i < 5; i++) expect((await limiter.hit('ip')).allowed).toBe(true);
    const blocked = await limiter.hit('ip');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect((await limiter.hit('otra-ip')).allowed).toBe(true);
    now += 60_001;
    expect((await limiter.hit('ip')).allowed).toBe(true);
  });

  it('stores a hash, never the raw IP', async () => {
    const key = await hashKey('contacto', '203.0.113.7');
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).not.toContain('203');
    expect(await hashKey('contacto', '203.0.113.7')).toBe(key);
  });
});
