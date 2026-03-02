// store/useShoppingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ShoppingState } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ShoppingStore extends ShoppingState {
  setBudget: (amount: number) => void;
  addProduct: (product: Omit<Product, 'id' | 'isPurchased'>) => void;
  toggleProduct: (id: string, finalPrice?: number) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updatedProduct: Partial<Product>) => void;
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set) => ({
      // Mantenemos el formato en portugués de Brasil para el mes
      month: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
      totalBudget: 0,
      items: [],

      setBudget: (amount) => set({ totalBudget: amount }),

      addProduct: (product) => set((state) => ({
        items: [...state.items, { ...product, id: uuidv4(), isPurchased: false }]
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
    }),
    {
      name: 'shopping-storage', // Este es el nombre con el que se guarda en el LocalStorage
    }
  )
);