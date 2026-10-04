import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs.astro';
import { CONTACT, OPENING_HOURS, SITE, SOCIAL_LINKS } from '@/data/site';
import { absoluteUrl } from './url';

export type JsonLd = Record<string, unknown>;

const BUSINESS_ID = `${SITE.url}/#negocio`;

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

export { BUSINESS_ID };
