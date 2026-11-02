export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isAmount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export const validProducts = (v: unknown): boolean => Array.isArray(v) &&
  new Set(v.map(p => isRecord(p) ? p.id : undefined)).size === v.length &&
  v.every(p => isRecord(p) && typeof p.id === 'string' && p.id.length > 0 &&
    typeof p.name === 'string' && p.name.trim().length > 0 && typeof p.category === 'string' &&
    typeof p.store === 'string' && typeof p.isPurchased === 'boolean' && isAmount(p.addedAt) &&
    isAmount(p.estimatedPrice) && isAmount(p.quantity) && p.quantity > 0 &&
    (p.unit === undefined || (typeof p.unit === 'string' && ['ud', 'kg', 'l', 'paquete'].includes(p.unit))) &&
    (p.packSize === undefined || (isAmount(p.packSize) && p.packSize > 0)) &&
    (p.packUnit === undefined || (typeof p.packUnit === 'string' && ['ud', 'g', 'kg', 'ml', 'l'].includes(p.packUnit))) &&
    (p.isOptional === undefined || typeof p.isOptional === 'boolean') &&
    (p.purchasedAt === undefined || isAmount(p.purchasedAt)) &&
    (p.finalPrice === undefined || isAmount(p.finalPrice)) &&
    (p.note === undefined || typeof p.note === 'string') &&
    (p.isRecurring === undefined || typeof p.isRecurring === 'boolean') &&
    (p.priority === undefined || (typeof p.priority === 'string' && ['alta', 'media', 'baja'].includes(p.priority))));
