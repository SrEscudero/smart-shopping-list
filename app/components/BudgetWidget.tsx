// app/components/BudgetWidget.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { Sun, Moon, Wallet } from 'lucide-react';

interface BudgetWidgetProps {
  compact?: boolean;
  full?: boolean;
}

export default function BudgetWidget({ compact = false, full = false }: BudgetWidgetProps) {
  const { totalBudget, setBudget, items, theme, toggleTheme } = useShoppingStore();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val >= 0) setBudget(val);
    else setInputValue(totalBudget.toString());
  };

  const totalEstimated = items.reduce((acc, i) => acc + i.estimatedPrice * i.quantity, 0);
  const totalSpent = items.filter(i => i.isPurchased).reduce((acc, i) => acc + (i.finalPrice || i.estimatedPrice) * i.quantity, 0);
  const remaining = totalBudget - totalEstimated;
  const progress = totalBudget > 0 ? Math.min((totalEstimated / totalBudget) * 100, 100) : 0;
  const isOver = remaining < 0;

  // COMPACT - just show remaining in header
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {totalBudget > 0 && (
          <div className={`flex flex-col items-end`}>
            <span className={`text-xs font-medium ${isOver ? 'text-red-400' : 'text-green-400'}`}>
              {isOver ? '−' : '+'}R$ {Math.abs(remaining).toFixed(0)}
            </span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl text-sm ${isDark ? 'bg-white/5 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
          title="Cambiar tema"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    );
  }

  // FULL - card with progress bar
  if (full) {
    return (
      <div className={`${isDark ? 'bg-[#13131A]' : 'bg-white'} rounded-2xl border ${isDark ? 'border-white/5' : 'border-gray-200'} p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)]"><Wallet size={18} /></span>
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Presupuesto</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setInputValue(totalBudget.toString()); setIsEditing(!isEditing); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'}`}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>R$</span>
            <input
              ref={inputRef}
              type="number"
              placeholder="0.00"
              className={`flex-1 text-2xl font-bold bg-transparent focus:outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold">
              Guardar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Presupuesto</p>
              <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                R$ {totalBudget > 0 ? totalBudget.toFixed(0) : '—'}
              </p>
            </div>
            <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Estimado</p>
              <p className={`text-base font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                R$ {totalEstimated.toFixed(0)}
              </p>
            </div>
            <div className={`${isOver ? 'bg-red-500/10' : isDark ? 'bg-green-500/10' : 'bg-green-50'} rounded-xl p-3`}>
              <p className={`text-xs ${isOver ? 'text-red-400' : isDark ? 'text-green-400' : 'text-green-600'} mb-1`}>
                {isOver ? 'Excedido' : 'Disponible'}
              </p>
              <p className={`text-base font-bold ${isOver ? 'text-red-400' : isDark ? 'text-green-400' : 'text-green-600'}`}>
                {totalBudget > 0 ? `R$ ${Math.abs(remaining).toFixed(0)}` : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {totalBudget > 0 && !isEditing && (
          <div>
            <div className={`w-full h-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-full overflow-hidden`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : progress > 80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={`flex justify-between mt-1 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              <span>{progress.toFixed(0)}% usado</span>
              <span>R$ {totalSpent.toFixed(2)} gastado</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}