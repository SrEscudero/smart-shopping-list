import type { Product } from '../store/useShoppingStore';
import type { BaseUnit, PantryItem, PriceEntry } from '../types/planning';

export const productKey = (name: string) => name.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
export const roundQuantity = (n: number) => Math.round(n * 1000) / 1000;
export const roundMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function unitContent(product: Pick<Product, 'unit' | 'packSize' | 'packUnit'>): { amount: number; unit: BaseUnit } | null {
  if (product.unit !== 'paquete') return { amount: 1, unit: product.unit || 'ud' };
  if (!product.packSize || !Number.isFinite(product.packSize) || product.packSize <= 0 || !product.packUnit) return null;
  const unit = product.packUnit === 'g' ? 'kg' : product.packUnit === 'ml' ? 'l' : product.packUnit;
  return { amount: product.packSize / (['g', 'ml'].includes(product.packUnit) ? 1000 : 1), unit };
}
export function unitPrice(product: Pick<Product, 'unit' | 'packSize' | 'packUnit' | 'estimatedPrice' | 'finalPrice' | 'isPurchased'>) {
  const content = unitContent(product);
  if (!content) return null;
  return { price: (product.isPurchased ? product.finalPrice ?? product.estimatedPrice : product.estimatedPrice) / content.amount, unit: content.unit };
}
export function budgetForecast(items: Product[], budget: number) {
  const spent = roundMoney(items.filter(i => i.isPurchased).reduce((n, i) => n + (i.finalPrice ?? i.estimatedPrice) * i.quantity, 0));
  const pending = roundMoney(items.filter(i => !i.isPurchased).reduce((n, i) => n + i.estimatedPrice * i.quantity, 0));
  const projected = roundMoney(spent + pending);
  return { spent, pending, projected, remaining: roundMoney(budget - projected), excess: budget > 0 ? Math.max(0, roundMoney(projected - budget)) : 0,
    optional: items.filter(i => !i.isPurchased && i.isOptional).sort((a, b) => b.estimatedPrice * b.quantity - a.estimatedPrice * a.quantity),
    unpriced: items.filter(i => !i.isPurchased && i.estimatedPrice === 0).length };
}

/** Pantry quantities are reserved across duplicate source rows, never subtracted twice. */
export function planMonth(source: Product[], pantry: PantryItem[]): Product[] {
  const stock = new Map<string, number>();
  pantry.forEach(p => { const key = `${productKey(p.name)}:${p.unit}`; stock.set(key, (stock.get(key) || 0) + p.quantity); });
  return source.flatMap(p => {
    const content = unitContent(p);
    let quantity = p.quantity;
    if (content) {
      const key = `${productKey(p.name)}:${content.unit}`;
      const available = stock.get(key) || 0;
      const needed = p.quantity * content.amount;
      stock.set(key, Math.max(0, available - needed));
      const remaining = Math.max(0, needed - available) / content.amount;
      quantity = p.unit === 'kg' || p.unit === 'l' ? roundQuantity(remaining) : Math.ceil(remaining - 1e-9);
    }
    return quantity > 0 ? [{ ...p, quantity, estimatedPrice: p.finalPrice ?? p.estimatedPrice, isPurchased: false, finalPrice: undefined, purchasedAt: undefined }] : [];
  });
}

export function priceChange(product: Product, entries: PriceEntry[], currency: string) {
  const current = unitPrice(product);
  if (!current) return null;
  const previous = entries.filter(e => e.productId !== product.id && e.currency === currency && e.unit === current.unit && productKey(e.name) === productKey(product.name)).sort((a, b) => b.recordedAt - a.recordedAt)[0];
  if (!previous || previous.price <= 0) return null;
  return { previous, current: current.price, percent: (current.price - previous.price) / previous.price * 100, unit: current.unit };
}
export function recordPrice(product: Product, currency: string, entries: PriceEntry[]): PriceEntry[] {
  const remaining = entries.filter(e => e.productId !== product.id);
  const price = unitPrice(product);
  if (!product.isPurchased || !price) return remaining;
  return [...remaining, { id: product.id, productId: product.id, name: product.name, store: product.store, currency, price: price.price, unit: price.unit, recordedAt: product.purchasedAt ?? Date.now() }];
}
