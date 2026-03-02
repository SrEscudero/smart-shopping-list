// app/components/BudgetWidget.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';

export default function BudgetWidget() {
  const { totalBudget, setBudget, items } = useShoppingStore();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(totalBudget ? totalBudget.toString() : '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus cuando hacemos clic para editar
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const newBudget = parseFloat(inputValue);
    if (!isNaN(newBudget) && newBudget >= 0) {
      setBudget(newBudget);
    } else {
      setInputValue(totalBudget.toString()); // Revierte si el valor no es válido
    }
  };

  // Calculamos cuánto hemos gastado (sumando productos comprados o estimados)
  const totalSpent = items.reduce((acc, item) => {
    return acc + (item.isPurchased ? (item.finalPrice || 0) : item.estimatedPrice) * item.quantity;
  }, 0);

  const remaining = totalBudget - totalSpent;
  const isOverBudget = remaining < 0;

  return (
    <div className="flex gap-4">
      {/* Widget de Saldo Restante (Solo aparece si ya definiste un presupuesto) */}
      {totalBudget > 0 && (
        <div className={`bg-white/70 backdrop-blur-md px-6 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border flex flex-col items-end transition-all ${isOverBudget ? 'border-red-400/60 text-red-600' : 'border-white/60 text-black'}`}>
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Disponible</span>
          <span className="text-2xl font-bold tracking-tight">R$ {remaining.toFixed(2)}</span>
        </div>
      )}

      {/* Widget de Presupuesto Total (Editable) */}
      <div 
        className="bg-white/70 backdrop-blur-md px-6 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col items-end transition-all hover:scale-105 cursor-pointer"
        onClick={() => !isEditing && setIsEditing(true)}
        title="Clic para editar tu presupuesto"
      >
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Presupuesto Total</span>
        
        {isEditing ? (
          <div className="flex items-center text-2xl font-bold text-black tracking-tight">
            <span>R$</span>
            <input
              ref={inputRef}
              type="number"
              placeholder="1500"
              className="bg-transparent focus:outline-none w-24 text-right ml-1 placeholder:text-gray-300"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        ) : (
          <span className="text-2xl font-bold text-black tracking-tight">
            R$ {totalBudget.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}