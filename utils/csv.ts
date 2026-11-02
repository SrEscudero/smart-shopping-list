import type { SaleUnit, ContentUnit } from '../types/planning';
import { Product } from '../store/useShoppingStore';

export type ImportableProduct = Omit<Product, 'id' | 'isPurchased' | 'addedAt'>;

const escapeCsvCell = (value: string | number | undefined) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

export const productsToCsv = (items: Product[]) => {
  const headers = ['Nombre', 'Categoria', 'Precio Estimado', 'Cantidad', 'Tienda', 'Nota', 'Unidad', 'Contenido', 'Unidad Contenido', 'Opcional', 'Recurrente'];
  const rows = items.map((item) => [
    item.name,
    item.category,
    item.estimatedPrice,
    item.quantity,
    item.store,
    item.note,
    item.unit, item.packSize, item.packUnit, item.isOptional ? 1 : 0, item.isRecurring ? 1 : 0,
  ].map(escapeCsvCell).join(','));

  return [headers.join(','), ...rows].join('\n');
};

export const parseCsvRows = (input: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value !== '')) rows.push(row);

  return rows;
};

export const csvToProducts = (input: string): ImportableProduct[] => {
  const [, ...rows] = parseCsvRows(input);

  return rows
    .map(([name = '', category = '', price = '', qty = '', store = '', note = '', unit = 'ud', packSize = '', packUnit = '', optional = '', recurring = '']) => ({
      name: name.trim(),
      category: category.trim() || 'Otros',
      estimatedPrice: Number.parseFloat(price.replace(',', '.')) || 0,
      quantity: Number.parseFloat(qty.replace(',', '.')) || 1,
      store: store.trim() || 'Varias',
      note: note.trim() || undefined,
      unit: (['ud', 'kg', 'l', 'paquete'].includes(unit) ? unit : 'ud') as SaleUnit,
      packSize: packSize ? Number(packSize.replace(',', '.')) : undefined,
      packUnit: (['ud', 'g', 'kg', 'ml', 'l'].includes(packUnit) ? packUnit : undefined) as ContentUnit | undefined,
      isOptional: optional === '1', isRecurring: recurring === '1',
    }))
    .filter((product) => product.name.length > 0 && Number.isFinite(product.estimatedPrice) && product.estimatedPrice >= 0 && Number.isFinite(product.quantity) && product.quantity > 0)
    .sort((a, b) => a.category === b.category
      ? a.name.localeCompare(b.name)
      : a.category.localeCompare(b.category));
};
