/** Plain data (no image imports) so it can be used by content.config.ts. */
export const CATEGORY_SLUGS = ['disenador', 'arabes', 'sets-corporativos'] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
}

export const CATEGORIES: Record<CategorySlug, Category> = {
  disenador: {
    slug: 'disenador',
    name: 'Perfumes de diseñador',
    shortName: 'Diseñador',
    description:
      'Las fragancias icónicas de Chanel, Jean Paul Gaultier, Versace, Valentino y Paco Rabanne, selladas o en decants.',
  },
  arabes: {
    slug: 'arabes',
    name: 'Perfumes árabes',
    shortName: 'Árabes',
    description:
      'Lattafa, Armaf, Afnan y Rasasi: perfumería oriental intensa, de gran duración y excelente relación calidad-precio.',
  },
  'sets-corporativos': {
    slug: 'sets-corporativos',
    name: 'Sets corporativos',
    shortName: 'Sets',
    description:
      'Estuches de decants listos para regalar a clientes y colaboradores, con tarjeta personalizada y cotización por volumen.',
  },
};

export const CATEGORY_LIST: readonly Category[] = CATEGORY_SLUGS.map((slug) => CATEGORIES[slug]);
