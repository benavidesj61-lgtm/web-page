import { SITE } from '@/data/site';

const formatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: SITE.currency,
  minimumFractionDigits: 2,
});

export const PRICE_ON_REQUEST_LABEL = 'Precio a consultar';

/** "$94.95"; Salvadoran Spanish uses the dollar sign and a decimal point. */
export function formatPrice(value: number): string {
  return formatter.format(value);
}

export function getDiscountPercent(price: number, previousPrice: number): number {
  return Math.round(((previousPrice - price) / previousPrice) * 100);
}
