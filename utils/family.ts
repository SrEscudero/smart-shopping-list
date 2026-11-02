import type { FamilySnapshot } from '../types/planning';
import type { Product } from '../store/useShoppingStore';
import { isRecord, isAmount, validProducts } from './validation';

export function validFamilySnapshot(value: unknown): value is FamilySnapshot {
  return isRecord(value) && Object.keys(value).every(k => ['items', 'totalBudget', 'month', 'currency'].includes(k)) && validProducts(value.items) && (value.items as unknown[]).length <= 500 &&
    isAmount(value.totalBudget) && typeof value.month === 'string' && value.month.length <= 100 &&
    typeof value.currency === 'string' && ['R$', '$', '€', '£', '¥', 'CLP', 'ARS', 'COP', 'MXN', 'PEN', 'UYU'].includes(value.currency);
}
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Merge independent edits; conflicting edits or delete/edit pairs require review. */
export function mergeFamily(base: FamilySnapshot, local: FamilySnapshot, remote: FamilySnapshot): FamilySnapshot | null {
  let conflict = false;
  function mergeValue<T>(b: T, l: T, r: T): T {
    if (equal(l, b)) return r;
    if (equal(r, b) || equal(l, r)) return l;
    conflict = true; return l;
  }
  const items: Product[] = [];
  const baseItems = new Map(base.items.map(i => [i.id, i]));
  const localItems = new Map(local.items.map(i => [i.id, i]));
  const remoteItems = new Map(remote.items.map(i => [i.id, i]));
  for (const id of new Set([...remoteItems.keys(), ...localItems.keys(), ...baseItems.keys()])) {
    const b = baseItems.get(id), l = localItems.get(id), r = remoteItems.get(id);
    if (!b || !l || !r) { const item = mergeValue(b, l, r); if (item) items.push(item); continue; }
    const merged: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)])) {
      const k = key as keyof Product;
      merged[key] = mergeValue(b[k], l[k], r[k]);
    }
    items.push(merged as unknown as Product);
  }
  const result = { items, totalBudget: mergeValue(base.totalBudget, local.totalBudget, remote.totalBudget), month: mergeValue(base.month, local.month, remote.month), currency: mergeValue(base.currency, local.currency, remote.currency) };
  return conflict ? null : result;
}
