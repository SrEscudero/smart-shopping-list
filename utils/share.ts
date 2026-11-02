import type { SaleUnit, ContentUnit } from '../types/planning';
import { Product } from '../store/useShoppingStore';
import { ImportableProduct } from './csv';

interface SharedProduct {
  n?: unknown;
  p?: unknown;
  q?: unknown;
  c?: unknown;
  s?: unknown;
  u?: unknown; z?: unknown; v?: unknown; o?: unknown; r?: unknown;
}

export const encodeSharedProducts = (items: Product[]) => {
  const data = items.map((item) => ({
    n: item.name,
    p: item.estimatedPrice,
    q: item.quantity,
    c: item.category,
    s: item.store,
    u: item.unit, z: item.packSize, v: item.packUnit, o: item.isOptional, r: item.isRecurring,
  }));

  return btoa(encodeURIComponent(JSON.stringify(data)));
};

export const decodeSharedProducts = (encoded: string): ImportableProduct[] => {
  const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as SharedProduct[];
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item) => item !== null && typeof item === 'object')
    .map((item) => ({
      name: String(item.n ?? '').trim(),
      estimatedPrice: Number(item.p) || 0,
      quantity: Number(item.q) || 1,
      category: String(item.c ?? 'Otros').trim() || 'Otros',
      store: String(item.s ?? 'Varias').trim() || 'Varias',
      unit: (['ud', 'kg', 'l', 'paquete'].includes(String(item.u)) ? item.u : 'ud') as SaleUnit,
      packSize: typeof item.z === 'number' && item.z > 0 && Number.isFinite(item.z) ? item.z : undefined,
      packUnit: (['ud', 'g', 'kg', 'ml', 'l'].includes(String(item.v)) ? item.v : undefined) as ContentUnit | undefined,
      isOptional: item.o === true, isRecurring: item.r === true,
    }))
    .filter((item) => item.name.length > 0 && Number.isFinite(item.estimatedPrice) && item.estimatedPrice >= 0 && Number.isFinite(item.quantity) && item.quantity > 0);
};
