import type { APIRoute } from 'astro';
import { absoluteUrl } from '@/utils/url';

// Generated so the sitemap URL always follows SITE.url.
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap-index.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
