import { getCollection, type CollectionEntry } from 'astro:content';
import type { BadgeVariant } from '@/components/ui/Badge.astro';

export type Product = CollectionEntry<'productos'>;

/** Products published within this many days get the "Nuevo" badge. */
export const NEW_PRODUCT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ProductBadge {
  variant: BadgeVariant;
  label: string;
}

let cache: Product[] | undefined;

/** All products, newest first. Fails the build if two products share an id or slug. */
export async function getProducts(): Promise<Product[]> {
  if (cache) return cache;
  const products = await getCollection('productos');
  assertUnique(products, (product) => product.data.id, 'id');
  assertUnique(products, (product) => product.data.slug, 'slug');
  cache = products.sort(
    (a, b) => b.data.fechaPublicacion.getTime() - a.data.fechaPublicacion.getTime(),
  );
  return cache;
}

function assertUnique(products: Product[], key: (product: Product) => string, field: string) {
  const seen = new Map<string, string>();
  for (const product of products) {
    const value = key(product);
    const previous = seen.get(value);
    if (previous) {
      throw new Error(
        `[productos] El campo "${field}" debe ser único: "${value}" se repite en "${previous}" y "${product.filePath ?? product.id}".`,
      );
    }
    seen.set(value, product.filePath ?? product.id);
  }
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.data.destacado).slice(0, limit);
}

export function getProductUrl(product: Product): string {
  return `/catalogo/${product.data.slug}/`;
}

export function isNewProduct(product: Product, now: Date = new Date()): boolean {
  return now.getTime() - product.data.fechaPublicacion.getTime() <= NEW_PRODUCT_DAYS * DAY_MS;
}

export function isOnSale(product: Product): boolean {
  return product.data.precioAnterior !== undefined;
}

export function getProductBadges(product: Product): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if (!product.data.disponible) badges.push({ variant: 'soldout', label: 'Agotado' });
  if (isOnSale(product)) badges.push({ variant: 'sale', label: 'Oferta' });
  if (isNewProduct(product)) badges.push({ variant: 'new', label: 'Nuevo' });
  return badges;
}

/** Other products from the same category, newest first. */
export function getRelatedProducts(product: Product, all: Product[], limit = 4): Product[] {
  const others = all.filter((candidate) => candidate.data.slug !== product.data.slug);
  return others.filter((c) => c.data.categoria === product.data.categoria).slice(0, limit);
}
