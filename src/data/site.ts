/**
 * Single source of truth for business data. Edit this file to change contact details,
 * address, hours, social links or navigation across the whole site.
 * SITE.url must match `site` in astro.config.mjs.
 */
export const SITE = {
  name: 'LE SCENT',
  legalName: 'LE SCENT El Salvador',
  url: 'https://lescent.com.sv',
  locale: 'es_SV',
  lang: 'es',
  currency: 'USD',
  tagline: 'Perfumes & decants originales',
  description:
    'Perfumes originales sellados y decants de 3, 5 y 10 ml en El Salvador. Regalos corporativos, asesoría personalizada y cotizaciones para empresas.',
  defaultOgImage: '/og-default.jpg',
  /** Shown on the contact and thank-you pages; keep it a promise the team can meet. */
  responseTime: 'un día hábil',
} as const;

export const CONTACT = {
  phone: {
    display: '+503 7529-2926',
    /** E.164 format, used for tel: links and structured data. */
    e164: '+50375292926',
  },
  email: 'lescetsv@gmail.com',
  address: {
    /** Leave empty to show only the city; the map and JSON-LD adapt automatically. */
    street: '',
    city: 'San Salvador',
    region: 'San Salvador',
    country: 'SV',
    countryName: 'El Salvador',
  },
} as const;

export interface OpeningHours {
  label: string;
  hours: string;
  /** schema.org day names, used for JSON-LD. */
  days: readonly string[];
  opens: string;
  closes: string;
}

export const OPENING_HOURS: readonly OpeningHours[] = [
  {
    label: 'Lunes a viernes',
    hours: '8:00 a. m. – 5:00 p. m.',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '17:00',
  },
];

export const CLOSED_DAYS_LABEL = 'Sábado y domingo';

export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok';

export interface SocialLink {
  network: SocialNetwork;
  label: string;
  handle: string;
  href: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    network: 'instagram',
    label: 'Instagram',
    handle: '@lescent.sv',
    href: 'https://www.instagram.com/lescent.sv/',
  },
  {
    network: 'facebook',
    label: 'Facebook',
    handle: 'lescent.sv',
    href: 'https://www.facebook.com/lescent.sv',
  },
  {
    network: 'tiktok',
    label: 'TikTok',
    handle: '@lescent.sv',
    href: 'https://www.tiktok.com/@lescent.sv',
  },
];

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Catálogo', href: '/catalogo/' },
  { label: 'Empresas', href: '/#por-que-elegirnos' },
  { label: 'Preguntas', href: '/#preguntas-frecuentes' },
  { label: 'Contacto', href: '/contacto/' },
];

/**
 * Contact form delivery through Netlify Forms. `name` must match the hidden `form-name`
 * field and the form's `name` attribute; Netlify detects the form at deploy time.
 */
export const CONTACT_FORM = {
  name: 'contacto',
  honeypotField: 'sitio-web',
  successPath: '/gracias/',
} as const;
