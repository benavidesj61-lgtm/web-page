import type { APIRoute } from 'astro';
import { getProducts } from '@/utils/products';

/**
 * Public product index (slug, id, name) read by the contact function to validate the
 * "producto" field and to put the real product name in the email. Contains only public data.
 */
export const GET: APIRoute = async () => {
  const products = await getProducts();
  const index = products.map(({ data }) => ({ slug: data.slug, id: data.id, nombre: data.nombre }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
