import { CONTACT, SITE } from '@/data/site';

export const PHONE_HREF = `tel:${CONTACT.phone.e164}`;

/** Builds a mailto: link; encodeURIComponent keeps spaces as %20, which every mail client reads. */
export function buildMailtoHref(subject?: string, body?: string): string {
  const params = [
    subject ? `subject=${encodeURIComponent(subject)}` : '',
    body ? `body=${encodeURIComponent(body)}` : '',
  ].filter(Boolean);
  return `mailto:${CONTACT.email}${params.length > 0 ? `?${params.join('&')}` : ''}`;
}

export function getProductMailtoHref(productName: string): string {
  return buildMailtoHref(
    `Consulta sobre ${productName} | ${SITE.name}`,
    `Hola, ${SITE.name}. Me interesa el producto "${productName}". ¿Podrían darme más información sobre disponibilidad y entrega?`,
  );
}

/** "Street, City, Country" without empty parts, so the site works before the street is set. */
export function formatAddress(): string {
  const { street, city, countryName } = CONTACT.address;
  return [street, city, countryName].filter(Boolean).join(', ');
}

export function getMapEmbedUrl(): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(formatAddress())}&z=15&output=embed`;
}

export function getMapLinkUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress())}`;
}
