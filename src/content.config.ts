import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './data/categories';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const productos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/productos' }),
  schema: ({ image }) =>
    z
      .object({
        id: z.string().regex(/^LS-\d{3,}$/, 'El "id" debe tener el formato LS-001.'),
        slug: z
          .string()
          .regex(
            SLUG_PATTERN,
            'El "slug" solo admite minúsculas, números y guiones (ej. mi-perfume-100-ml).',
          ),
        nombre: z.string().min(3, 'El "nombre" debe tener al menos 3 caracteres.'),
        marca: z.string().optional(),
        categoria: z.enum(CATEGORY_SLUGS, {
          error: `La "categoria" debe ser una de: ${CATEGORY_SLUGS.join(', ')}.`,
        }),
        precio: z.number().positive('El "precio" debe ser un número mayor que 0.'),
        precioAnterior: z.number().positive().optional(),
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
      .refine((data) => data.precioAnterior === undefined || data.precioAnterior > data.precio, {
        message: 'El "precioAnterior" debe ser mayor que el "precio" para mostrarse como oferta.',
        path: ['precioAnterior'],
      }),
});

export const collections = { productos };
