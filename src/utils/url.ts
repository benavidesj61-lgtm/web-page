import { SITE } from '@/config/site';

/** Absolute URL for canonical tags, Open Graph and JSON-LD. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).href;
}
