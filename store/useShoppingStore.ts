// store/useShoppingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type BaseCategory =
  | 'Frutas y Verduras' | 'Carnes y Pescados' | 'Lácteos y Huevos'
  | 'Panadería' | 'Bebidas' | 'Limpieza' | 'Cuidado Personal'
  | 'Despensa' | 'Congelados' | 'Mascotas' | 'Bebés'
  | 'Electrónica' | 'Ropa' | 'Otros';

export type AccentColor = 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'teal';
export type ListDensity = 'compact' | 'normal' | 'spacious';
export type CurrencySymbol = 'R$' | '$' | '€' | '£' | '¥' | 'CLP' | 'ARS' | 'COP' | 'MXN' | 'PEN' | 'UYU';

export interface Product {
  id: string;
  name: string;
  category: BaseCategory | string;
  estimatedPrice: number;
  finalPrice?: number;
  quantity: number;
  isPurchased: boolean;
  store: string;
  note?: string;
  priority?: 'alta' | 'media' | 'baja';
  isRecurring?: boolean;
  addedAt: number;
}

export interface MonthHistory {
  id: string;
  month: string;
  year: number;
  totalBudget: number;
  items: Product[];
  closedAt: number;
  totalSpent: number;
}

export interface ShoppingStore {
  month: string;
  totalBudget: number;
  items: Product[];
  theme: 'dark' | 'light';
  accentColor: AccentColor;
  shoppingMode: boolean;
  history: MonthHistory[];
  currency: CurrencySymbol;
  listDensity: ListDensity;

  setBudget: (amount: number) => void;
  setMonth: (name: string) => void;
  setCurrency: (currency: CurrencySymbol) => void;
  setListDensity: (density: ListDensity) => void;
  addProduct: (product: Omit<Product, 'id' | 'isPurchased' | 'addedAt'> & { id?: string }) => void;
  // NUEVO: Función para agregar múltiples productos a la vez (ideal para importaciones CSV)
  addMultipleProducts: (products: Omit<Product, 'id' | 'isPurchased' | 'addedAt'>[]) => void;
  toggleProduct: (id: string, finalPrice?: number) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updatedProduct: Partial<Product>) => void;
  toggleRecurring: (id: string) => void;
  clearPurchased: () => void;
  clearAll: () => void;
  closeMonth: () => void;
  deleteHistory: (id: string) => void;
  renameHistoryMonth: (id: string, newName: string) => void;
  toggleTheme: () => void;
  setAccentColor: (color: AccentColor) => void;
  toggleShoppingMode: () => void;
  reorderItems: (oldIndex: number, newIndex: number) => void;

  getStats: () => {
    totalItems: number;
    purchasedItems: number;
    pendingItems: number;
    totalEstimated: number;
    totalSpent: number;
    remainingBudget: number;
    completionRate: number;
    topCategory: string;
    topStore: string;
    avgItemPrice: number;
  };
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
      totalBudget: 0,
      items: [],
      theme: 'dark',
      accentColor: 'blue',
      shoppingMode: false,
      history: [],
      currency: 'R$',
      listDensity: 'normal',

      setBudget: (amount) => set({ totalBudget: amount }),
      setMonth: (name) => set({ month: name }),
      setCurrency: (currency) => set({ currency }),
      setListDensity: (density) => set({ listDensity: density }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setAccentColor: (color) => set({ accentColor: color }),
      toggleShoppingMode: () => set((s) => ({ shoppingMode: !s.shoppingMode })),

      addProduct: (product) => set((s) => ({
        items: [...s.items, { ...product, id: product.id || uuidv4(), isPurchased: false, addedAt: Date.now() }]
      })),

      // NUEVA IMPLEMENTACIÓN: Agrega un array de productos generando IDs y fechas
      addMultipleProducts: (products) => set((s) => {
        const now = Date.now();
        const newItems = products.map((product, index) => ({
          ...product,
          id: uuidv4(),
          isPurchased: false,
          addedAt: now + index
        }));
        return { items: [...s.items, ...newItems] };
      }),

      toggleProduct: (id, finalPrice) => set((s) => ({
        items: s.items.map(item =>
          item.id === id
            ? { ...item, isPurchased: !item.isPurchased, finalPrice: finalPrice ?? item.estimatedPrice }
            : item
        )
      })),

      removeProduct: (id) => set((s) => ({
        items: s.items.filter(item => item.id !== id)
      })),

      updateProduct: (id, updated) => set((s) => ({
        items: s.items.map(item => item.id === id ? { ...item, ...updated } : item)
      })),

      toggleRecurring: (id) => set((s) => ({
        items: s.items.map(item => item.id === id ? { ...item, isRecurring: !item.isRecurring } : item)
      })),

      clearPurchased: () => set((s) => ({
        items: s.items.filter(item => !item.isPurchased)
      })),

      clearAll: () => set({ items: [] }),

      reorderItems: (oldIndex, newIndex) => set((s) => {
        const newItems = [...s.items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        return { items: newItems };
      }),

      closeMonth: () => set((s) => {
        const totalSpent = s.items.reduce((acc, item) => {
          return acc + (item.isPurchased ? (item.finalPrice || item.estimatedPrice) : item.estimatedPrice) * item.quantity;
        }, 0);
        const record: MonthHistory = {
          id: uuidv4(),
          month: s.month,
          year: new Date().getFullYear(),
          totalBudget: s.totalBudget,
          items: [...s.items],
          closedAt: Date.now(),
          totalSpent,
        };
        // Carry over recurring items to the new month
        const now = Date.now();
        const recurringItems: Product[] = s.items
          .filter(item => item.isRecurring)
          .map((item, idx) => ({
            ...item,
            id: uuidv4(),
            isPurchased: false,
            finalPrice: undefined,
            addedAt: now + idx,
          }));
        return {
          history: [record, ...s.history],
          items: recurringItems,
          totalBudget: 0,
          shoppingMode: false,
          month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        };
      }),

      deleteHistory: (id) => set((s) => ({
        history: s.history.filter(h => h.id !== id)
      })),

      renameHistoryMonth: (id, newName) => set((s) => ({
        history: s.history.map(h => h.id === id ? { ...h, month: newName } : h)
      })),

      getStats: () => {
        const { items, totalBudget } = get();
        const totalItems = items.length;
        const purchasedItems = items.filter(i => i.isPurchased).length;
        const pendingItems = totalItems - purchasedItems;
        const totalEstimated = items.reduce((acc, i) => acc + i.estimatedPrice * i.quantity, 0);
        const totalSpent = items.filter(i => i.isPurchased).reduce((acc, i) => acc + (i.finalPrice || i.estimatedPrice) * i.quantity, 0);
        const remainingBudget = totalBudget - totalEstimated;
        const completionRate = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;
        const categoryCount: Record<string, number> = {};
        const storeCount: Record<string, number> = {};
        items.forEach(i => {
          categoryCount[i.category] = (categoryCount[i.category] || 0) + i.estimatedPrice * i.quantity;
          if (i.store) storeCount[i.store] = (storeCount[i.store] || 0) + 1;
        });
        const topCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || '—';
        const topStore = Object.entries(storeCount).sort(([, a], [, b]) => b - a)[0]?.[0] || '—';
        const avgItemPrice = totalItems > 0 ? totalEstimated / totalItems : 0;
        return { totalItems, purchasedItems, pendingItems, totalEstimated, totalSpent, remainingBudget, completionRate, topCategory, topStore, avgItemPrice };
      },
    }),
    { name: 'shopping-v3' }
  )
);