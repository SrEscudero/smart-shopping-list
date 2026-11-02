import type { Product } from '../store/useShoppingStore';

export type SaleUnit = 'ud' | 'kg' | 'l' | 'paquete';
export type ContentUnit = 'ud' | 'g' | 'kg' | 'ml' | 'l';
export type BaseUnit = 'ud' | 'kg' | 'l';
export interface PantryItem { id: string; name: string; quantity: number; unit: BaseUnit; updatedAt: number }
export interface PriceEntry { id: string; productId: string; name: string; store: string; currency: string; price: number; unit: BaseUnit; recordedAt: number }
export interface ReceiptLine { name: string; quantity: number; price: number; category: string; unit?: SaleUnit; packSize?: number; packUnit?: ContentUnit; targetId?: string }
export interface ReceiptRecord { id: string; store: string; date: number; total: number; currency: string }
export interface ShoppingSnapshot { items: Product[]; pantry: PantryItem[]; priceHistory: PriceEntry[]; receipts: ReceiptRecord[] }
export interface FamilySnapshot { items: Product[]; totalBudget: number; month: string; currency: string }
export interface FamilyConnection { token: string; listId: string | null; revision: number; baseline: FamilySnapshot }
