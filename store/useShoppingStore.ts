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

  setBudget: (amount: number) => void;
  addProduct: (product: Omit<Product, 'id' | 'isPurchased' | 'addedAt'> & { id?: string }) => void;
  // NUEVO: Función para agregar múltiples productos a la vez (ideal para importaciones CSV)
  addMultipleProducts: (products: Omit<Product, 'id' | 'isPurchased' | 'addedAt'>[]) => void;
  toggleProduct: (id: string, finalPrice?: number) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updatedProduct: Partial<Product>) => void;
  clearPurchased: () => void;
  clearAll: () => void;
  closeMonth: () => void;
  deleteHistory: (id: string) => void;
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

      setBudget: (amount) => set({ totalBudget: amount }),
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
        return {
          history: [record, ...s.history],
          items: [],
          totalBudget: 0,
          shoppingMode: false,
          month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        };
      }),

      deleteHistory: (id) => set((s) => ({
        history: s.history.filter(h => h.id !== id)
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