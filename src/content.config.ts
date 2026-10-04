import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './data/categories';

// Lowercase words joined by single hyphens; written without nested quantifiers (no ReDoS risk).
const SLUG_PATTERN = /^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/;
const price = (field: string) =>
  z.number().positive(`El "${field}" debe ser un número mayor que 0 (ej. 45 o 94.95).`);

const productos = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/productos',
    // Key entries by file name: the default (frontmatter slug) silently drops duplicated slugs,
    // which would hide them from the uniqueness check in utils/products.ts.
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z
      .object({
        id: z.string().regex(/^LS-\d{3,}$/, 'El "id" debe tener el formato LS-001.'),
        slug: z
          .string()
          .regex(
            SLUG_PATTERN,
            'El "slug" solo admite minúsculas, números y guiones (ej. lattafa-yara-100-ml).',
          ),
        nombre: z.string().min(3, 'El "nombre" debe tener al menos 3 caracteres.'),
        marca: z.string().min(2, 'La "marca" debe tener al menos 2 caracteres.'),
        categoria: z.enum(CATEGORY_SLUGS, {
          error: `La "categoria" debe ser una de: ${CATEGORY_SLUGS.join(', ')}.`,
        }),
        /** Price of the sealed bottle (or the set). `null` shows "Precio a consultar". */
        precio: price('precio').nullable(),
        precioAnterior: price('precioAnterior').optional(),
        /** Bottle size in ml, shown as "Sellado · 100 ml". */
        contenidoMl: z.number().int().positive().optional(),
        decants: z
          .array(z.object({ ml: z.number().int().positive(), precio: price('decants.precio') }))
          .optional(),
        descripcion: z
          .string()
          .min(40, 'La "descripcion" debe tener al menos 40 caracteres.')
          .max(
            200,
            'La "descripcion" debe tener máximo 200 caracteres (se usa en tarjetas y SEO).',
          ),
        imagenes: z
          .array(
            z.object({
              src: image(),
              alt: z
                .string()
                .min(15, 'Cada imagen necesita un texto "alt" descriptivo (mínimo 15 caracteres).'),
            }),
          )
          .min(1, 'Cada producto necesita al menos una imagen.'),
        disponible: z.boolean(),
        destacado: z.boolean(),
        fechaPublicacion: z.coerce.date(),
        caracteristicas: z.array(z.string()).optional(),
        etiquetas: z.array(z.string()).optional(),
        sku: z.string().optional(),
      })
      .refine(
        (data) =>
          data.precioAnterior === undefined ||
          (data.precio !== null && data.precioAnterior > data.precio),
        {
          message:
            'El "precioAnterior" debe ser mayor que el "precio" (y el precio no puede ser null) para mostrarse como oferta.',
          path: ['precioAnterior'],
        },
      ),
});

export const collections = { productos };
