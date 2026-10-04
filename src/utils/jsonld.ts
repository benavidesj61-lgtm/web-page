import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs.astro';
import { CONTACT, OPENING_HOURS, SITE, SOCIAL_LINKS } from '@/data/site';
import { absoluteUrl } from './url';

export type JsonLd = Record<string, unknown>;

export const BUSINESS_ID = `${SITE.url}/#negocio`;

export function buildLocalBusinessSchema(): JsonLd {
  const { street, city, region, country } = CONTACT.address;
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': BUSINESS_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    description: SITE.description,
    url: SITE.url,
    image: absoluteUrl(SITE.defaultOgImage),
    logo: absoluteUrl('/icon-512.png'),
    telephone: CONTACT.phone.e164,
    email: CONTACT.email,
    currenciesAccepted: SITE.currency,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      ...(street ? { streetAddress: street } : {}),
      addressLocality: city,
      addressRegion: region,
      addressCountry: country,
    },
    areaServed: { '@type': 'Country', name: CONTACT.address.countryName },
    openingHoursSpecification: OPENING_HOURS.map((slot) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: slot.days.map((day) => `https://schema.org/${day}`),
      opens: slot.opens,
      closes: slot.closes,
    })),
    sameAs: SOCIAL_LINKS.map((social) => social.href),
  };
}

export function buildBreadcrumbSchema(items: readonly BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

interface ProductSchemaInput {
  name: string;
  description: string;
  url: string;
  images: readonly string[];
  brand: string;
  category: string;
  sku?: string | undefined;
  price: number | null;
  sizeMl?: number | undefined;
  decants?: readonly { ml: number; precio: number }[] | undefined;
  available: boolean;
}

/** One Offer per purchasable presentation (sealed bottle and each decant size). */
export function buildProductSchema(input: ProductSchemaInput): JsonLd {
  const url = absoluteUrl(input.url);
  const availability = `https://schema.org/${input.available ? 'InStock' : 'OutOfStock'}`;
  const offer = (name: string, price: number, available = input.available) => ({
    '@type': 'Offer',
    name,
    price: price.toFixed(2),
    priceCurrency: SITE.currency,
    availability: available ? availability : 'https://schema.org/OutOfStock',
    url,
    seller: { '@id': BUSINESS_ID },
  });

  const offers = [
    ...(input.price === null
      ? []
      : [offer(input.sizeMl ? `Sellado ${input.sizeMl} ml` : input.name, input.price)]),
    // Decants come from opened bottles, so they stay available when the sealed bottle is sold out.
    ...(input.decants ?? []).map((decant) => offer(`Decant ${decant.ml} ml`, decant.precio, true)),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    url,
    image: input.images.map((image) => absoluteUrl(image)),
    brand: { '@type': 'Brand', name: input.brand },
    category: input.category,
    ...(input.sku ? { sku: input.sku } : {}),
    ...(offers.length > 0 ? { offers } : {}),
  };
}
