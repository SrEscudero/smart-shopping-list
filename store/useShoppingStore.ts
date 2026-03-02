// store/useShoppingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type BaseCategory =
  | 'Frutas y Verduras'
  | 'Carnes y Pescados'
  | 'Lácteos y Huevos'
  | 'Panadería'
  | 'Bebidas'
  | 'Limpieza'
  | 'Cuidado Personal'
  | 'Despensa'
  | 'Congelados'
  | 'Mascotas'
  | 'Bebés'
  | 'Electrónica'
  | 'Ropa'
  | 'Otros';

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
  // Estado actual
  month: string;
  totalBudget: number;
  items: Product[];
  theme: 'dark' | 'light';
  
  // Historial
  history: MonthHistory[];
  
  // Acciones de presupuesto
  setBudget: (amount: number) => void;
  
  // Acciones de productos
  addProduct: (product: Omit<Product, 'id' | 'isPurchased' | 'addedAt'>) => void;
  toggleProduct: (id: string, finalPrice?: number) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updatedProduct: Partial<Product>) => void;
  clearPurchased: () => void;
  clearAll: () => void;
  
  // Acciones de mes
  closeMonth: () => void;
  deleteHistory: (id: string) => void;
  
  // Tema
  toggleTheme: () => void;
  
  // Estadísticas calculadas
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
      history: [],

      setBudget: (amount) => set({ totalBudget: amount }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      addProduct: (product) => set((state) => ({
        items: [...state.items, {
          ...product,
          id: uuidv4(),
          isPurchased: false,
          addedAt: Date.now(),
        }]
      })),

      toggleProduct: (id, finalPrice) => set((state) => ({
        items: state.items.map(item =>
          item.id === id
            ? { ...item, isPurchased: !item.isPurchased, finalPrice: finalPrice ?? item.estimatedPrice }
            : item
        )
      })),

      removeProduct: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),

      updateProduct: (id, updatedProduct) => set((state) => ({
        items: state.items.map(item =>
          item.id === id ? { ...item, ...updatedProduct } : item
        )
      })),

      clearPurchased: () => set((state) => ({
        items: state.items.filter(item => !item.isPurchased)
      })),

      clearAll: () => set({ items: [] }),

      closeMonth: () => set((state) => {
        const totalSpent = state.items.reduce((acc, item) => {
          return acc + (item.isPurchased ? (item.finalPrice || item.estimatedPrice) : item.estimatedPrice) * item.quantity;
        }, 0);

        const record: MonthHistory = {
          id: uuidv4(),
          month: state.month,
          year: new Date().getFullYear(),
          totalBudget: state.totalBudget,
          items: [...state.items],
          closedAt: Date.now(),
          totalSpent,
        };

        return {
          history: [record, ...state.history],
          items: [],
          totalBudget: 0,
          month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        };
      }),

      deleteHistory: (id) => set((state) => ({
        history: state.history.filter(h => h.id !== id)
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

        const topCategory = Object.entries(categoryCount).sort(([,a],[,b]) => b-a)[0]?.[0] || '-';
        const topStore = Object.entries(storeCount).sort(([,a],[,b]) => b-a)[0]?.[0] || '-';
        const avgItemPrice = totalItems > 0 ? totalEstimated / totalItems : 0;

        return { totalItems, purchasedItems, pendingItems, totalEstimated, totalSpent, remainingBudget, completionRate, topCategory, topStore, avgItemPrice };
      }
    }),
    { name: 'shopping-v2' }
  )
);