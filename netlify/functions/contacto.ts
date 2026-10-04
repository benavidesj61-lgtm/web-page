import { handleContactRequest } from '../../src/lib/server/contact-handler';
import { readServerEnv } from '../../src/lib/server/env';
import { createBlobStore, createRateLimiter } from '../../src/lib/server/rate-limit';

/** Subset of Netlify's Functions v2 context that this function uses. */
interface NetlifyContext {
  ip?: string;
}

// 5 attempts per IP every 15 minutes, shared across instances through Netlify Blobs.
const rateLimiter = createRateLimiter(createBlobStore('contacto-rate-limit'), {
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

export default async function contacto(request: Request, context: NetlifyContext) {
  return handleContactRequest(request, {
    env: readServerEnv(process.env),
    rateLimiter,
    ip: context.ip ?? '',
  });
}

export const config = {
  path: ['/api/contacto', '/api/contacto/'],
};
