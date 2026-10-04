import { SITE } from '@/config/site';

const priceFormatter = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: SITE.currency,
  minimumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

export function discountPercentage(price: number, previousPrice: number): number {
  return Math.round(((previousPrice - price) / previousPrice) * 100);
}
