import { CONTACT } from '@/config/site';

export const DEFAULT_WHATSAPP_MESSAGE =
  'Hola, LE SCENT. Me gustaría recibir asesoría sobre sus perfumes y decants.';

/** Builds a wa.me link with a prefilled, URL-encoded message. */
export function buildWhatsAppUrl(message: string = DEFAULT_WHATSAPP_MESSAGE): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

interface ProductInquiry {
  name: string;
  url: string;
  price?: string;
}

export function buildProductInquiryMessage({ name, url, price }: ProductInquiry): string {
  const priceLine = price ? ` (${price})` : '';
  return `Hola, LE SCENT. Quiero consultar por el producto "${name}"${priceLine}. ¿Está disponible?\n${url}`;
}
