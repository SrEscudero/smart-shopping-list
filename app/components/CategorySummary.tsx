// app/components/CategorySummary.tsx
"use client";

import { useShoppingStore } from '../../store/useShoppingStore';

export default function CategorySummary() {
  const { items, totalBudget } = useShoppingStore();

  // 1. Sumar los gastos por categoría
  const expensesByCategory = items.reduce((acc, item) => {
    const cost = item.estimatedPrice * item.quantity;
    acc[item.category] = (acc[item.category] || 0) + cost;
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

  // Si no hay gastos aún, no mostramos la barra
  if (totalSpent === 0) return null;

  // 2. Definir una paleta de colores vibrantes estilo Apple
  const categoryColors: Record<string, string> = {
    'Frutas y Verduras': 'bg-[#34C759]', // Green
    'Carnes y Pescados': 'bg-[#FF3B30]', // Red
    'Lácteos y Huevos': 'bg-[#FFCC00]',  // Yellow
    'Panadería': 'bg-[#FF9500]',         // Orange
    'Bebidas': 'bg-[#5AC8FA]',           // Light Blue
    'Limpieza': 'bg-[#32ADE6]',          // Cyan
    'Cuidado Personal': 'bg-[#AF52DE]',  // Purple
    'Despensa': 'bg-[#A2845E]',          // Brown
    'Congelados': 'bg-[#00C7BE]',        // Teal
    'Mascotas': 'bg-[#FF2D55]',          // Pink
    'Bebés': 'bg-[#FF6482]',             // Soft Pink
    'Otros': 'bg-[#8E8E93]',             // Gray
  };

  // 3. Ordenar categorías de mayor a menor gasto
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpent) * 100,
      color: categoryColors[category] || categoryColors['Otros'],
    }));

  return (
    <div className="bg-[#1C1C1C] p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-800 mb-6 w-full">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-white font-semibold tracking-tight">Resumen por Categoría</h3>
        <span className="text-sm text-gray-400">Total: R$ {totalSpent.toFixed(2)}</span>
      </div>

      {/* BARRA DE PROGRESO ESTILO APPLE */}
      <div className="w-full h-3 sm:h-4 bg-gray-800 rounded-full overflow-hidden flex mb-4">
        {sortedCategories.map((cat) => (
          <div
            key={cat.category}
            style={{ width: `${cat.percentage}%` }}
            className={`h-full ${cat.color} transition-all duration-500 hover:brightness-110`}
            title={`${cat.category}: R$ ${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* LEYENDA (Puntitos de colores) */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {sortedCategories.map((cat) => (
          <div key={cat.category} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
            <span className="text-xs text-gray-300">
              {cat.category} <span className="text-gray-500 ml-1">{cat.percentage.toFixed(0)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}