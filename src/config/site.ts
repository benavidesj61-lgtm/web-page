/**
 * Single source of truth for business data. Edit this file to change contact
 * details, address, hours or social links across the whole site.
 * SITE.url must match `site` in astro.config.mjs.
 */
export const SITE = {
  name: 'LE SCENT',
  legalName: 'LE SCENT El Salvador',
  url: 'https://lescent.com.sv',
  locale: 'es_SV',
  lang: 'es',
  currency: 'USD',
  tagline: 'Perfumes y decants originales',
  description:
    'Perfumes originales y decants de marcas de lujo en El Salvador. Regalos corporativos, asesoría personalizada y atención directa por WhatsApp.',
  defaultOgImage: '/og-default.jpg',
} as const;

export const CONTACT = {
  /** International format without symbols, used to build wa.me links. */
  whatsappNumber: '50375292926',
  whatsappDisplay: '+503 7529-2926',
  phoneHref: 'tel:+50375292926',
  email: 'ventas@lescent.com.sv',
  address: {
    street: 'Paseo General Escalón, Colonia Escalón',
    city: 'San Salvador',
    region: 'San Salvador',
    country: 'SV',
    countryName: 'El Salvador',
  },
  geo: { latitude: 13.7036, longitude: -89.2364 },
  mapQuery: 'Paseo General Escalón, San Salvador, El Salvador',
} as const;

export interface OpeningHours {
  label: string;
  hours: string;
  /** schema.org days, used for JSON-LD. */
  days: readonly string[];
  opens: string;
  closes: string;
}

export const OPENING_HOURS: readonly OpeningHours[] = [
  {
    label: 'Lunes a viernes',
    hours: '9:00 a. m. – 6:00 p. m.',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  {
    label: 'Sábado',
    hours: '9:00 a. m. – 1:00 p. m.',
    days: ['Saturday'],
    opens: '09:00',
    closes: '13:00',
  },
];

export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok';

export interface SocialLink {
  network: SocialNetwork;
  label: string;
  href: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { network: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/lescent.sv' },
  { network: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/lescent.sv' },
  { network: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@lescent.sv' },
];

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/catalogo/' },
  { label: 'Corporativo', href: '/#por-que-elegirnos' },
  { label: 'Preguntas', href: '/#preguntas-frecuentes' },
  { label: 'Contacto', href: '/contacto/' },
];
