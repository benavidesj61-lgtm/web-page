import * as z from 'zod/mini';

export const CATALOG_INDEX_PATH = '/catalogo/indice.json';
const CACHE_TTL_MS = 5 * 60 * 1000;

const catalogIndexSchema = z.array(
  z.object({ slug: z.string(), id: z.string(), nombre: z.string() }),
);

export type CatalogEntry = z.infer<typeof catalogIndexSchema>[number];

let cache: { origin: string; expires: number; entries: Map<string, CatalogEntry> } | undefined;

/**
 * The function cannot read Astro content collections, so it reads the prerendered index of
 * the same deploy. Product names in emails come from here, never from the submitted form.
 */
export async function loadCatalog(
  origin: string,
  fetchImpl: typeof fetch = fetch,
  now: number = Date.now(),
): Promise<Map<string, CatalogEntry> | null> {
  if (cache && cache.origin === origin && cache.expires > now) return cache.entries;
  try {
    const response = await fetchImpl(new URL(CATALOG_INDEX_PATH, origin), {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const parsed = catalogIndexSchema.safeParse(await response.json());
    if (!parsed.success) return null;
    const entries = new Map(parsed.data.map((entry) => [entry.slug, entry]));
    cache = { origin, expires: now + CACHE_TTL_MS, entries };
    return entries;
  } catch {
    return null;
  }
}

export function clearCatalogCache(): void {
  cache = undefined;
}
