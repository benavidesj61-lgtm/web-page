/** Plain data (no image imports) so it can be used by content.config.ts. */
export const CATEGORY_SLUGS = ['perfumes', 'decants', 'sets-corporativos'] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

export const CATEGORIES: Record<CategorySlug, Category> = {
  perfumes: {
    slug: 'perfumes',
    name: 'Perfumes originales',
    description:
      'Frascos completos y sellados de las casas más reconocidas, con garantía de autenticidad.',
  },
  decants: {
    slug: 'decants',
    name: 'Decants',
    description:
      'Fragancias de lujo en 5 y 10 ml, extraídas del frasco original. Pruebe antes de invertir.',
  },
  'sets-corporativos': {
    slug: 'sets-corporativos',
    name: 'Sets y regalos corporativos',
    description:
      'Estuches listos para regalar a clientes y colaboradores, con presentación personalizada.',
  },
};

export const CATEGORY_LIST: readonly Category[] = CATEGORY_SLUGS.map((slug) => CATEGORIES[slug]);
