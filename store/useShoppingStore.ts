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
export type ThemeMode = 'dark' | 'light' | 'auto';

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

export interface ShoppingList {
  id: string;
  name: string;
  items: Product[];
  totalBudget: number;
  createdAt: number;
}

export interface ShoppingStore {
  month: string;
  totalBudget: number;
  items: Product[];
  theme: ThemeMode;
  accentColor: AccentColor;
  shoppingMode: boolean;
  history: MonthHistory[];
  currency: CurrencySymbol;
  listDensity: ListDensity;

  // Multiple lists
  lists: ShoppingList[];
  activeListId: string | null;

  // Undo stack (non-persisted at runtime, but we keep last state)
  _undoStack: Product[][];
  _redoStack: Product[][];

  // Budget alerts
  budgetAlertDismissed: boolean;

  setBudget: (amount: number) => void;
  setMonth: (name: string) => void;
  setCurrency: (currency: CurrencySymbol) => void;
  setListDensity: (density: ListDensity) => void;
  addProduct: (product: Omit<Product, 'id' | 'isPurchased' | 'addedAt'> & { id?: string }) => void;
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
  setTheme: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleShoppingMode: () => void;
  reorderItems: (oldIndex: number, newIndex: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  _pushUndo: () => void;

  // Multiple lists
  createList: (name: string) => void;
  switchList: (id: string) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, name: string) => void;

  // Backup/Restore
  exportBackup: () => string;
  importBackup: (json: string) => { success: boolean; message: string };

  // Budget alerts
  dismissBudgetAlert: () => void;

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
      lists: [],
      activeListId: null,
      _undoStack: [],
      _redoStack: [],
      budgetAlertDismissed: false,

      setBudget: (amount) => set({ totalBudget: amount, budgetAlertDismissed: false }),
      setMonth: (name) => set({ month: name }),
      setCurrency: (currency) => set({ currency }),
      setListDensity: (density) => set({ listDensity: density }),
      toggleTheme: () => set((s) => ({
        theme: s.theme === 'dark' ? 'light' : s.theme === 'light' ? 'auto' : 'dark'
      })),
      setTheme: (mode) => set({ theme: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      toggleShoppingMode: () => set((s) => ({ shoppingMode: !s.shoppingMode })),

      // Push current items to undo stack before mutation
      _pushUndo: () => set((s) => ({
        _undoStack: [...s._undoStack.slice(-9), [...s.items]],
        _redoStack: [],
      })),

      addProduct: (product) => {
        get()._pushUndo();
        set((s) => ({
          items: [...s.items, { ...product, id: product.id || uuidv4(), isPurchased: false, addedAt: Date.now() }]
        }));
      },

      addMultipleProducts: (products) => {
        get()._pushUndo();
        set((s) => {
          const now = Date.now();
          const newItems = products.map((product, index) => ({
            ...product,
            id: uuidv4(),
            isPurchased: false,
            addedAt: now + index
          }));
          return { items: [...s.items, ...newItems] };
        });
      },

      toggleProduct: (id, finalPrice) => {
        get()._pushUndo();
        set((s) => ({
          items: s.items.map(item =>
            item.id === id
              ? { ...item, isPurchased: !item.isPurchased, finalPrice: finalPrice ?? item.finalPrice ?? item.estimatedPrice }
              : item
          )
        }));
      },

      removeProduct: (id) => {
        get()._pushUndo();
        set((s) => ({
          items: s.items.filter(item => item.id !== id)
        }));
      },

      updateProduct: (id, updated) => set((s) => ({
        items: s.items.map(item => item.id === id ? { ...item, ...updated } : item)
      })),

      toggleRecurring: (id) => set((s) => ({
        items: s.items.map(item => item.id === id ? { ...item, isRecurring: !item.isRecurring } : item)
      })),

      clearPurchased: () => {
        get()._pushUndo();
        set((s) => ({
          items: s.items.filter(item => !item.isPurchased)
        }));
      },

      clearAll: () => {
        get()._pushUndo();
        set({ items: [] });
      },

      reorderItems: (oldIndex, newIndex) => set((s) => {
        const newItems = [...s.items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        return { items: newItems };
      }),

      // Undo/Redo
      undo: () => set((s) => {
        if (s._undoStack.length === 0) return s;
        const prev = s._undoStack[s._undoStack.length - 1];
        return {
          _undoStack: s._undoStack.slice(0, -1),
          _redoStack: [...s._redoStack, [...s.items]],
          items: prev,
        };
      }),

      redo: () => set((s) => {
        if (s._redoStack.length === 0) return s;
        const next = s._redoStack[s._redoStack.length - 1];
        return {
          _redoStack: s._redoStack.slice(0, -1),
          _undoStack: [...s._undoStack, [...s.items]],
          items: next,
        };
      }),

      canUndo: () => get()._undoStack.length > 0,
      canRedo: () => get()._redoStack.length > 0,

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
          _undoStack: [],
          _redoStack: [],
          budgetAlertDismissed: false,
        };
      }),

      deleteHistory: (id) => set((s) => ({
        history: s.history.filter(h => h.id !== id)
      })),

      renameHistoryMonth: (id, newName) => set((s) => ({
        history: s.history.map(h => h.id === id ? { ...h, month: newName } : h)
      })),

      // Multiple Lists
      createList: (name) => set((s) => {
        const newList: ShoppingList = {
          id: uuidv4(),
          name,
          items: [],
          totalBudget: 0,
          createdAt: Date.now(),
        };
        return { lists: [...s.lists, newList] };
      }),

      switchList: (id) => set((s) => {
        const list = s.lists.find(l => l.id === id);
        if (!list) return s;
        // Save current items to the previously active list (or main)
        const updatedLists = s.activeListId
          ? s.lists.map(l => l.id === s.activeListId ? { ...l, items: [...s.items], totalBudget: s.totalBudget } : l)
          : s.lists;

        return {
          lists: updatedLists,
          activeListId: id,
          items: [...list.items],
          totalBudget: list.totalBudget,
          _undoStack: [],
          _redoStack: [],
        };
      }),

      deleteList: (id) => set((s) => ({
        lists: s.lists.filter(l => l.id !== id),
        activeListId: s.activeListId === id ? null : s.activeListId,
      })),

      renameList: (id, name) => set((s) => ({
        lists: s.lists.map(l => l.id === id ? { ...l, name } : l)
      })),

      // Backup/Restore
      exportBackup: () => {
        const s = get();
        const backup = {
          version: 4,
          exportedAt: Date.now(),
          month: s.month,
          totalBudget: s.totalBudget,
          items: s.items,
          history: s.history,
          lists: s.lists,
          currency: s.currency,
          accentColor: s.accentColor,
          theme: s.theme,
          listDensity: s.listDensity,
        };
        return JSON.stringify(backup, null, 2);
      },

      importBackup: (json) => {
        try {
          const data = JSON.parse(json);
          if (!data.items || !Array.isArray(data.items)) {
            return { success: false, message: 'Formato de backup inválido.' };
          }
          set({
            month: data.month || get().month,
            totalBudget: data.totalBudget || 0,
            items: data.items,
            history: data.history || get().history,
            lists: data.lists || [],
            currency: data.currency || get().currency,
            accentColor: data.accentColor || get().accentColor,
            theme: data.theme || get().theme,
            listDensity: data.listDensity || get().listDensity,
            _undoStack: [],
            _redoStack: [],
          });
          return { success: true, message: `Backup restaurado: ${data.items.length} productos, ${(data.history || []).length} meses.` };
        } catch {
          return { success: false, message: 'Error al leer el archivo de backup.' };
        }
      },

      dismissBudgetAlert: () => set({ budgetAlertDismissed: true }),

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
    {
      name: 'shopping-v3',
      partialize: (state) => {
        // Exclude undo/redo stacks from persistence
        const { _undoStack, _redoStack, ...rest } = state;
        return rest;
      },
    }
  )
);