import { Product } from '../store/useShoppingStore';
import { ImportableProduct } from './csv';

interface SharedProduct {
  n?: unknown;
  p?: unknown;
  q?: unknown;
  c?: unknown;
  s?: unknown;
}

export const encodeSharedProducts = (items: Product[]) => {
  const data = items.map((item) => ({
    n: item.name,
    p: item.estimatedPrice,
    q: item.quantity,
    c: item.category,
    s: item.store,
  }));

  return btoa(encodeURIComponent(JSON.stringify(data)));
};

export const decodeSharedProducts = (encoded: string): ImportableProduct[] => {
  const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as SharedProduct[];
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      name: String(item.n ?? '').trim(),
      estimatedPrice: Number(item.p) || 0,
      quantity: Number(item.q) || 1,
      category: String(item.c ?? 'Otros').trim() || 'Otros',
      store: String(item.s ?? 'Varias').trim() || 'Varias',
    }))
    .filter((item) => item.name.length > 0);
};
