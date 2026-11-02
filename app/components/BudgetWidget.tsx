// app/components/BudgetWidget.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { Sun, Moon, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { budgetForecast } from '../../utils/planning';

interface BudgetWidgetProps {
  compact?: boolean;
  full?: boolean;
}

export default function BudgetWidget({ compact = false, full = false }: BudgetWidgetProps) {
  const { totalBudget, setBudget, items, theme, toggleTheme, currency } = useShoppingStore();
  const c = currency || 'R$';
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val >= 0) setBudget(val);
    else setInputValue(totalBudget.toString());
  };

  const forecast = budgetForecast(items, totalBudget);
  const totalSpent = forecast.spent;
  const remaining = forecast.remaining;
  const progress = totalBudget > 0 ? Math.min((forecast.projected / totalBudget) * 100, 100) : 0;
  const isOver = totalBudget > 0 && remaining < 0;

  // COMPACT - just show remaining in header
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {totalBudget > 0 && (
          <div className="hidden sm:flex flex-col items-end">
            <span className={`text-xs font-medium ${isOver ? 'text-red-400' : 'text-green-400'}`}>
              {isOver ? '−' : '+'}{c} {Math.abs(remaining).toFixed(2)}
            </span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-sm transition-all"
          style={{
            background: 'var(--bg-elevated)',
            color: theme === 'dark' ? '#FBBF24' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
          title="Cambiar tema"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    );
  }

  // FULL - card with progress bar
  if (full) {
    return (
      <div
        className="rounded-2xl p-4 space-y-3 card-glow"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--text-secondary)' }}><Wallet size={18} /></span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Presupuesto</span>
          </div>
          <button
            onClick={() => { setInputValue(totalBudget.toString()); setIsEditing(!isEditing); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c}</span>
            <input
              ref={inputRef}
              type="number"
              placeholder="0.00"
              className="min-w-0 flex-1 text-2xl font-bold bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              aria-label="Presupuesto mensual" min="0" step="0.01"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="text-white px-4 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)' }}>
              Guardar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Presupuesto</p>
              <p className="text-base font-bold break-words" style={{ color: 'var(--text-primary)' }}>
                {c} {totalBudget > 0 ? totalBudget.toFixed(2) : '—'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Previsto al terminar</p>
              <p className="text-base font-bold break-words" style={{ color: 'var(--accent)' }}>
                {c} {forecast.projected.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: isOver ? 'var(--danger-soft)' : 'var(--success-soft)' }}>
              <p className="text-xs mb-1" style={{ color: isOver ? 'var(--danger)' : 'var(--success)' }}>
                {isOver ? 'Excedido' : 'Disponible'}
              </p>
              <p className="text-base font-bold break-words" style={{ color: isOver ? 'var(--danger)' : 'var(--success)' }}>
                {totalBudget > 0 ? `${c} ${Math.abs(remaining).toFixed(2)}` : '—'}
              </p>
            </div>
          </div>
        )}

        <div className="forecast-split"><span>Ya pagado<strong>{c} {totalSpent.toFixed(2)}</strong></span><span>Falta comprar<strong>{c} {forecast.pending.toFixed(2)}</strong></span></div>
        {forecast.unpriced > 0 && <p className="text-xs muted">{forecast.unpriced} productos pendientes tienen precio 0. Revisa sus precios para una previsión completa.</p>}
        {isOver && <div className="notice-warning"><strong>Necesitas recortar {c} {forecast.excess.toFixed(2)}</strong>
          {forecast.optional.length ? <><p className="text-xs mt-1">Puedes aplazar estos productos opcionales:</p>{forecast.optional.map(p => <div key={p.id} className="planning-row"><span>{p.name}</span><span>{c} {(p.estimatedPrice * p.quantity).toFixed(2)}</span></div>)}<p className="text-xs mt-1">Ajusta cantidades desde la lista. Los productos esenciales se conservan.</p></> : <p className="text-xs mt-1">Marca productos como opcionales al editarlos para ver qué puedes aplazar.</p>}
        </div>}
        {/* Animated progress bar */}
        {totalBudget > 0 && !isEditing && (
          <div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  background: isOver
                    ? 'var(--danger)'
                    : progress > 80
                      ? 'var(--warning)'
                      : `linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.7))`,
                  boxShadow: `0 0 8px rgba(var(--accent-rgb), 0.3)`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span>{progress.toFixed(0)}% usado</span>
              <span>{c} {totalSpent.toFixed(2)} gastado</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}