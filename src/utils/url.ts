import { SITE } from '@/data/site';

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** Home only matches itself; every other section also matches its sub-pages. */
export function isCurrentPath(href: string, pathname: string): boolean {
  if (href.includes('#')) return false;
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
