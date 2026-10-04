import type { ImageMetadata } from 'astro';
import disenador from '@/assets/productos/chanel-bleu-de-chanel-frasco.jpg';
import arabes from '@/assets/productos/lattafa-khamrah-frasco.jpg';
import setsCorporativos from '@/assets/productos/set-discovery-caballero.jpg';
import type { CategorySlug } from './categories';

/** Kept apart from categories.ts because content.config.ts cannot import images. */
export const CATEGORY_IMAGES: Record<CategorySlug, { src: ImageMetadata; alt: string }> = {
  disenador: {
    src: disenador,
    alt: 'Frasco de Bleu de Chanel Parfum junto a sus decants sobre fondo negro texturizado',
  },
  arabes: {
    src: arabes,
    alt: 'Frasco de cristal tallado de Lattafa Khamrah junto a sus decants sobre fondo negro',
  },
  'sets-corporativos': {
    src: setsCorporativos,
    alt: 'Set Discovery Caballero: estuche con tres decants de fragancias de diseñador',
  },
};
