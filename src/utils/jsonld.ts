import { CONTACT, OPENING_HOURS, SITE, SOCIAL_LINKS } from '@/config/site';
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs.astro';
import type { JsonLd } from '@/components/layout/SEO.astro';
import { CATEGORIES } from '@/data/categories';
import { getProductUrl, type Product } from './products';
import { absoluteUrl } from './url';

const businessId = `${SITE.url}/#negocio`;

export function buildLocalBusinessSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': businessId,
    name: SITE.name,
    legalName: SITE.legalName,
    description: SITE.description,
    url: absoluteUrl('/'),
    image: absoluteUrl(SITE.defaultOgImage),
    logo: absoluteUrl('/icon-512.png'),
    telephone: `+${CONTACT.whatsappNumber}`,
    email: CONTACT.email,
    priceRange: '$$',
    currenciesAccepted: SITE.currency,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.address.street,
      addressLocality: CONTACT.address.city,
      addressRegion: CONTACT.address.region,
      addressCountry: CONTACT.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: CONTACT.geo.latitude,
      longitude: CONTACT.geo.longitude,
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

export function buildProductSchema(product: Product, imageUrls: readonly string[]): JsonLd {
  const { data } = product;
  const url = absoluteUrl(getProductUrl(product));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#producto`,
    name: data.nombre,
    description: data.descripcion,
    image: imageUrls,
    sku: data.sku ?? data.id,
    productID: data.id,
    category: CATEGORIES[data.categoria].name,
    ...(data.marca && { brand: { '@type': 'Brand', name: data.marca } }),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: SITE.currency,
      price: data.precio.toFixed(2),
      availability: data.disponible
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': businessId },
    },
  };
}
