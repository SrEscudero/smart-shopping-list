// store/useShoppingStore.ts
import { isRecord, isAmount, validProducts } from '../utils/validation';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { SaleUnit, ContentUnit, PantryItem, PriceEntry, ReceiptLine, ReceiptRecord, ShoppingSnapshot, FamilyConnection, FamilySnapshot } from '../types/planning';
import { budgetForecast, recordPrice, unitContent, productKey, roundQuantity, roundMoney } from '../utils/planning';

export type BaseCategory =
  | 'Frutas y Verduras' | 'Carnes y Pescados' | 'Lácteos y Huevos'
  | 'Panadería' | 'Bebidas' | 'Limpieza' | 'Cuidado Personal'
  | 'Despensa' | 'Congelados' | 'Mascotas' | 'Bebés'
  | 'Electrónica' | 'Ropa' | 'Otros';

export type AccentColor = 'blue' | 'green' | 'orange' | 'pink' | 'purple' | 'teal' | 'slate' | 'copper' | 'sage' | 'coral' | 'navy' | 'monochrome' | 'gold' | 'rose' | 'titanium';
export type CardStyle = 'classic' | 'minimal' | 'glass';
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
  purchasedAt?: number;
  unit?: SaleUnit;
  packSize?: number;
  packUnit?: ContentUnit;
  isOptional?: boolean;
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
  month?: string;
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
  cardStyle: CardStyle;
  soundEnabled: boolean;

  pantry: PantryItem[];
  priceHistory: PriceEntry[];
  receipts: ReceiptRecord[];
  family: FamilyConnection | null;
  setPantryItem: (item: Omit<PantryItem, 'id' | 'updatedAt'> & { id?: string }) => void;
  removePantryItem: (id: string) => void;
  createPlannedList: (name: string, products: Product[], budget: number) => void;
  confirmReceipt: (id: string, store: string, lines: ReceiptLine[]) => boolean;
  setFamily: (connection: FamilyConnection | null) => void;
  applyFamilySnapshot: (snapshot: FamilySnapshot, revision: number) => void;

  // Multiple lists
  lists: ShoppingList[];
  activeListId: string | null;
  mainList: { items: Product[]; totalBudget: number; month?: string };

  // Undo stack (non-persisted at runtime, but we keep last state)
  _undoStack: ShoppingSnapshot[];
  _redoStack: ShoppingSnapshot[];

  // Budget alerts
  budgetAlertDismissed: boolean;

  setBudget: (amount: number) => void;
  setMonth: (name: string) => void;
  setCurrency: (currency: CurrencySymbol) => void;
  setListDensity: (density: ListDensity) => void;
  setCardStyle: (style: CardStyle) => void;
  toggleSound: () => void;
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

function isValidBackup(data: unknown): data is Partial<ShoppingStore> & { items: Product[] } {
  if (!isRecord(data) || !validProducts(data.items)) return false;
  if (data.version !== undefined && (![4, 5, 6].includes(Number(data.version)))) return false;
  if (data.month !== undefined && (typeof data.month !== 'string' || !data.month.trim())) return false;
  if (data.totalBudget !== undefined && !isAmount(data.totalBudget)) return false;
  if (data.lists !== undefined && (!Array.isArray(data.lists) ||
    new Set(data.lists.map(l => isRecord(l) ? l.id : undefined)).size !== data.lists.length ||
    !data.lists.every(l => isRecord(l) && typeof l.id === 'string' && l.id.length > 0 &&
      typeof l.name === 'string' && (l.month === undefined || typeof l.month === 'string') && validProducts(l.items) && isAmount(l.totalBudget) && isAmount(l.createdAt)))) return false;
  if (data.activeListId != null && (!Array.isArray(data.lists) || !data.lists.some(l => l.id === data.activeListId))) return false;
  if (data.mainList !== undefined && (!isRecord(data.mainList) || !validProducts(data.mainList.items) || !isAmount(data.mainList.totalBudget) || (data.mainList.month !== undefined && typeof data.mainList.month !== 'string'))) return false;
  if (data.history !== undefined && (!Array.isArray(data.history) || !data.history.every(h =>
    isRecord(h) && typeof h.id === 'string' && typeof h.month === 'string' && isAmount(h.year) &&
    validProducts(h.items) && isAmount(h.totalBudget) && isAmount(h.totalSpent) && isAmount(h.closedAt)))) return false;
  if (data.pantry !== undefined && (!Array.isArray(data.pantry) || !data.pantry.every(p => isRecord(p) && typeof p.id === 'string' && typeof p.name === 'string' && isAmount(p.quantity) && ['ud', 'kg', 'l'].includes(String(p.unit)) && isAmount(p.updatedAt)))) return false;
  if (data.priceHistory !== undefined && (!Array.isArray(data.priceHistory) || !data.priceHistory.every(p => isRecord(p) && typeof p.id === 'string' && typeof p.productId === 'string' && typeof p.name === 'string' && typeof p.store === 'string' && typeof p.currency === 'string' && isAmount(p.price) && isAmount(p.recordedAt) && ['ud', 'kg', 'l'].includes(String(p.unit))))) return false;
  if (data.receipts !== undefined && (!Array.isArray(data.receipts) || !data.receipts.every(p => isRecord(p) && typeof p.id === 'string' && typeof p.store === 'string' && typeof p.currency === 'string' && isAmount(p.date) && isAmount(p.total)))) return false;
  const options: Record<string, readonly string[]> = {
    theme: ['light', 'dark', 'auto'], listDensity: ['compact', 'normal', 'spacious'],
    cardStyle: ['classic', 'minimal', 'glass'],
    currency: ['R$', '$', '€', '£', '¥', 'CLP', 'ARS', 'COP', 'MXN', 'PEN', 'UYU'],
    accentColor: ['blue', 'green', 'orange', 'pink', 'purple', 'teal', 'slate', 'copper', 'sage', 'coral', 'navy', 'monochrome', 'gold', 'rose', 'titanium'],
  };
  return Object.entries(options).every(([key, values]) => data[key] === undefined || (typeof data[key] === 'string' && values.includes(data[key]))) &&
    (data.soundEnabled === undefined || typeof data.soundEnabled === 'boolean');
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      month: new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
      totalBudget: 0,
      items: [],
      theme: 'light',
      accentColor: 'green',
      shoppingMode: false,
      history: [],
      currency: 'R$',
      listDensity: 'normal',
      cardStyle: 'classic',
      soundEnabled: true,
      pantry: [],
      priceHistory: [],
      receipts: [],
      family: null,
      lists: [],
      activeListId: null,
      mainList: { items: [], totalBudget: 0 },
      _undoStack: [],
      _redoStack: [],
      budgetAlertDismissed: false,

      setBudget: (amount) => {
        if (Number.isFinite(amount) && amount >= 0) set({ totalBudget: amount, budgetAlertDismissed: false });
      },
      setMonth: (name) => set({ month: name }),
      setCurrency: (currency) => set({ currency }),
      setListDensity: (density) => set({ listDensity: density }),
      setCardStyle: (style) => set({ cardStyle: style }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleTheme: () => set((s) => ({
        theme: s.theme === 'dark' ? 'light' : s.theme === 'light' ? 'auto' : 'dark'
      })),
      setTheme: (mode) => set({ theme: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      toggleShoppingMode: () => set((s) => ({ shoppingMode: !s.shoppingMode })),

      // Push current items to undo stack before mutation
      _pushUndo: () => set((s) => ({
        _undoStack: [...s._undoStack.slice(-9), { items: s.items, pantry: s.pantry, priceHistory: s.priceHistory, receipts: s.receipts }],
        _redoStack: [],
      })),

      addProduct: (product) => {
        if (!validProducts([{ ...product, id: product.id || 'new', isPurchased: false, addedAt: Date.now() }])) return;
        get()._pushUndo();
        set((s) => ({
          items: [...s.items, { ...product, id: product.id || uuidv4(), isPurchased: false, addedAt: Date.now() }]
        }));
      },

      addMultipleProducts: (products) => {
        products = products.filter(p => validProducts([{ ...p, id: 'new', isPurchased: false, addedAt: Date.now() }]));
        if (!products.length) return;
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
        if (!get().items.some(i => i.id === id) || (finalPrice !== undefined && !isAmount(finalPrice))) return;
        get()._pushUndo();
        set(s => {
          const items = s.items.map(item => item.id === id ? { ...item, isPurchased: !item.isPurchased, purchasedAt: !item.isPurchased ? Date.now() : undefined, finalPrice: finalPrice ?? item.finalPrice ?? item.estimatedPrice } : item);
          return { items, priceHistory: recordPrice(items.find(i => i.id === id)!, s.currency, s.priceHistory) };
        });
      },

      removeProduct: (id) => {
        get()._pushUndo();
        set((s) => ({
          items: s.items.filter(item => item.id !== id)
        }));
      },

      updateProduct: (id, updated) => {
        const current = get().items.find(i => i.id === id);
        if (!current || !validProducts([{ ...current, ...updated, id }])) return;
        get()._pushUndo();
        set(s => {
          const product = { ...current, ...updated, id };
          return { items: s.items.map(i => i.id === id ? product : i), priceHistory: recordPrice(product, s.currency, s.priceHistory) };
        });
      },

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
          _redoStack: [...s._redoStack, { items: s.items, pantry: s.pantry, priceHistory: s.priceHistory, receipts: s.receipts }],
          ...prev,
        };
      }),

      redo: () => set((s) => {
        if (s._redoStack.length === 0) return s;
        const next = s._redoStack[s._redoStack.length - 1];
        return {
          _redoStack: s._redoStack.slice(0, -1),
          _undoStack: [...s._undoStack, { items: s.items, pantry: s.pantry, priceHistory: s.priceHistory, receipts: s.receipts }],
          ...next,
        };
      }),

      canUndo: () => get()._undoStack.length > 0,
      canRedo: () => get()._redoStack.length > 0,

      closeMonth: () => set((s) => {
        const totalSpent = s.items.reduce((acc, item) => {
          return acc + (item.isPurchased ? (item.finalPrice ?? item.estimatedPrice) * item.quantity : 0);
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
            purchasedAt: undefined,
            addedAt: now + idx,
          }));
        return {
          history: [record, ...s.history],
          items: recurringItems,
          totalBudget: 0,
          shoppingMode: false,
          month: new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
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
        const targetId = id || null;
        if (targetId === s.activeListId) return s;
        const target = targetId ? s.lists.find(l => l.id === targetId) : s.mainList;
        if (!target) return s;
        return {
          lists: s.lists.map(l => l.id === s.activeListId
            ? { ...l, items: [...s.items], totalBudget: s.totalBudget, month: s.month } : l),
          mainList: s.activeListId ? s.mainList : { items: [...s.items], totalBudget: s.totalBudget, month: s.month },
          activeListId: targetId,
          items: [...target.items],
          totalBudget: target.totalBudget,
          month: target.month || s.month,
          _undoStack: [],
          _redoStack: [],
          budgetAlertDismissed: false,
        };
      }),

      deleteList: (id) => {
        if (get().activeListId === id) get().switchList('');
        set(s => ({ lists: s.lists.filter(l => l.id !== id) }));
      },

      renameList: (id, name) => set((s) => ({
        lists: s.lists.map(l => l.id === id ? { ...l, name } : l)
      })),

      setPantryItem: (input) => {
        if (!input.name.trim() || !isAmount(input.quantity) || !['ud', 'kg', 'l'].includes(input.unit)) return;
        get()._pushUndo();
        set(s => {
          const previous = input.id ? s.pantry.find(p => p.id === input.id) : s.pantry.find(p => productKey(p.name) === productKey(input.name) && p.unit === input.unit);
          const item = { ...input, name: input.name.trim(), id: previous?.id || uuidv4(), updatedAt: Date.now() };
          return { pantry: [...s.pantry.filter(p => p.id !== item.id), item] };
        });
      },
      removePantryItem: (id) => { get()._pushUndo(); set(s => ({ pantry: s.pantry.filter(p => p.id !== id) })); },
      createPlannedList: (name, products, budget) => {
        if (!name.trim() || !validProducts(products) || !isAmount(budget)) return;
        const id = uuidv4();
        set(s => ({ lists: [...s.lists, { id, name: name.trim(), month: name.trim(), items: products.map(p => ({ ...p, id: uuidv4(), isPurchased: false, finalPrice: undefined, purchasedAt: undefined, addedAt: Date.now() })), totalBudget: budget, createdAt: Date.now() }] }));
        get().switchList(id);
        set({ month: name.trim() });
      },
      confirmReceipt: (receiptId, storeName, lines) => {
        const s = get();
        if (!receiptId || !storeName.trim() || !lines.length || s.receipts.some(r => r.id === receiptId)) return false;
        const targets = lines.flatMap(l => l.targetId ? [l.targetId] : []);
        if (new Set(targets).size !== targets.length || targets.some(id => !s.items.some(i => i.id === id && !i.isPurchased))) return false;
        const now = Date.now();
        const products: Product[] = lines.map(l => ({ id: l.targetId || uuidv4(), name: l.name.trim(), category: l.category, quantity: l.quantity, estimatedPrice: l.price, finalPrice: l.price, unit: l.unit, packSize: l.packSize, packUnit: l.packUnit, store: storeName.trim(), isPurchased: true, addedAt: now, purchasedAt: now }));
        if (!validProducts(products) || products.some(p => !unitContent(p))) return false;
        if (products.some(p => { const target = s.items.find(i => i.id === p.id); return target && JSON.stringify(unitContent(target)) !== JSON.stringify(unitContent(p)); })) return false;
        get()._pushUndo();
        let items = [...s.items];
        let pantry = [...s.pantry];
        let priceHistory = [...s.priceHistory];
        for (const p of products) {
          const target = items.find(i => i.id === p.id);
          if (target) {
            const sameSize = JSON.stringify(unitContent(target)) === JSON.stringify(unitContent(p));
            items = items.filter(i => i.id !== p.id);
            if (sameSize && target.quantity > p.quantity) items.push({ ...target, id: uuidv4(), quantity: roundQuantity(target.quantity - p.quantity) });
          }
          items.push({ ...target, ...p });
          priceHistory = recordPrice(p, s.currency, priceHistory);
          const content = unitContent(p)!;
          const existing = pantry.find(i => productKey(i.name) === productKey(p.name) && i.unit === content.unit);
          const stock = { id: existing?.id || uuidv4(), name: p.name, unit: content.unit, quantity: roundQuantity((existing?.quantity || 0) + content.amount * p.quantity), updatedAt: now };
          pantry = [...pantry.filter(i => i.id !== stock.id), stock];
        }
        set({ items, pantry, priceHistory, receipts: [...s.receipts, { id: receiptId, store: storeName.trim(), date: now, currency: s.currency, total: roundMoney(products.reduce((n, p) => n + p.quantity * p.estimatedPrice, 0)) }] });
        return true;
      },
      setFamily: (family) => set({ family }),
      applyFamilySnapshot: (snapshot, revision) => set(s => ({
        items: snapshot.items, totalBudget: snapshot.totalBudget, month: snapshot.month, currency: snapshot.currency as CurrencySymbol,
        family: s.family ? { ...s.family, revision, baseline: snapshot } : null,
        _undoStack: [], _redoStack: [],
        priceHistory: snapshot.items.reduce((entries, p) => p.isPurchased ? recordPrice(p, snapshot.currency, entries) : entries, s.priceHistory),
      })),

      // Backup/Restore
      exportBackup: () => {
        const s = get();
        const backup = {
          version: 6,
          exportedAt: Date.now(),
          month: s.month,
          totalBudget: s.totalBudget,
          items: s.items,
          history: s.history,
          pantry: s.pantry,
          priceHistory: s.priceHistory,
          receipts: s.receipts,
          lists: s.lists.map(l => l.id === s.activeListId ? { ...l, items: s.items, totalBudget: s.totalBudget, month: s.month } : l),
          activeListId: s.activeListId,
          mainList: s.activeListId ? s.mainList : { items: s.items, totalBudget: s.totalBudget, month: s.month },
          cardStyle: s.cardStyle,
          soundEnabled: s.soundEnabled,
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
          if (!isValidBackup(data)) {
            return { success: false, message: 'Formato de backup inválido.' };
          }
          set({
            month: data.month || get().month,
            totalBudget: data.totalBudget || 0,
            items: data.items,
            pantry: data.pantry || [],
            priceHistory: data.priceHistory || [],
            receipts: data.receipts || [],
            family: null,
            history: data.history || get().history,
            lists: data.lists || [],
            activeListId: data.activeListId || null,
            mainList: data.mainList || { items: data.activeListId ? [] : data.items, totalBudget: data.activeListId ? 0 : (data.totalBudget ?? 0) },
            cardStyle: data.cardStyle || get().cardStyle,
            soundEnabled: data.soundEnabled ?? get().soundEnabled,
            shoppingMode: false,
            budgetAlertDismissed: false,
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
        const totalSpent = items.filter(i => i.isPurchased).reduce((acc, i) => acc + (i.finalPrice ?? i.estimatedPrice) * i.quantity, 0);
        const remainingBudget = budgetForecast(items, totalBudget).remaining;
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
        const { _undoStack: undoStack, _redoStack: redoStack, ...rest } = state;
        void undoStack;
        void redoStack;
        return rest;
      },
    }
  )
);
