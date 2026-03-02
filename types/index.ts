// types/index.ts

// 1. Tipos de Categorías (Actualizado con las nuevas secciones del supermercado)
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
  | 'Otros';

// 2. Interfaz del Producto
export interface Product {
  id: string;                      // Identificador único (UUID)
  name: string;                    // Nombre del producto (ej. "Manzanas")
  category: BaseCategory | string; // Asignado por la IA o manualmente
  estimatedPrice: number;          // Lo que crees que va a costar
  finalPrice?: number;             // Lo que realmente costó (al marcar checkbox)
  quantity: number;                // Cantidad
  isPurchased: boolean;            // ¿Ya está en el carrito?
  store: string;                   // Tienda (ej. "Stok Center", "Atacadão")
}

// 3. Interfaz del Estado Global (Zustand)
export interface ShoppingState {
  month: string;                   // Ej: "março de 2026"
  totalBudget: number;             // El dinero total disponible para el mes
  items: Product[];                // La lista completa de productos
}