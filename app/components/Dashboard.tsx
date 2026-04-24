// app/components/Dashboard.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';

const ACCENT_OPTIONS = [
  { id: 'blue',   label: 'Azul',     hex: '#3B82F6' },
  { id: 'green',  label: 'Verde',    hex: '#30D158' },
  { id: 'orange', label: 'Naranja',  hex: '#FF9F0A' },
  { id: 'pink',   label: 'Rojo',     hex: '#FF375F' },
  { id: 'purple', label: 'Morado',   hex: '#BF5AF2' },
  { id: 'teal',   label: 'Celeste',  hex: '#5AC8FA' },
] as const;

export default function Dashboard() {
  const { items, totalBudget, month, theme, accentColor, shoppingMode, toggleTheme, setAccentColor, toggleShoppingMode } = useShoppingStore();
  const [mounted, setMounted] = useState(false);
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const purchased = items.filter(i => i.isPurchased).length;
    const pending = totalItems - purchased;
    const totalEstimated = items.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
    const remaining = totalBudget - totalEstimated;
    const progress = totalItems > 0 ? (purchased / totalItems) * 100 : 0;
    const isOver = totalBudget > 0 && remaining < 0;
    return { totalItems, purchased, pending, totalEstimated, remaining, progress, isOver };
  }, [items, totalBudget]);

  const { totalItems, purchased, pending, totalEstimated, remaining, progress, isOver } = stats;
  const isDark = theme === 'dark';

  // SVG circle progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (progress / 100) * circumference;

  return (
    <div className="space-y-4">

      {/* ── HERO CARD ── */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{
          background: isDark
            ? `radial-gradient(ellipse at top right, rgba(var(--accent-rgb), 0.18) 0%, transparent 60%), var(--bg-card)`
            : `radial-gradient(ellipse at top right, rgba(var(--accent-rgb), 0.10) 0%, transparent 60%), var(--bg-card)`,
          border: '1px solid var(--border)',
        }}
      >
        {/* Decorative glow blob */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: `var(--accent)` }}
        />

        <div className="relative z-10 flex items-start justify-between gap-4">

          {/* Left: text + budget */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-50 font-display mb-1">
              {month}
            </p>
            <h1 className="font-display text-3xl font-800 leading-none tracking-tight" style={{ fontWeight: 800 }}>
              {totalBudget > 0 ? (
                <span className={isOver ? 'text-red-400' : ''} style={isOver ? {} : { color: 'var(--accent)' }}>
                  R$ {Math.abs(remaining).toFixed(0)}
                </span>
              ) : (
                <span style={{ color: 'var(--accent)' }}>Mis Compras</span>
              )}
            </h1>
            {totalBudget > 0 && (
              <p className="text-xs mt-1 opacity-50">
                {isOver ? `⚠️ excedido del presupuesto` : `disponible de R$ ${totalBudget.toFixed(0)}`}
              </p>
            )}

            {/* Mini stats row */}
            <div className="flex items-center gap-4 mt-4">
              <div>
                <p className="text-2xl font-bold font-display leading-none">{pending}</p>
                <p className="text-xs opacity-40 mt-0.5">pendientes</p>
              </div>
              <div className="w-px h-8 opacity-10" style={{ background: 'currentColor' }} />
              <div>
                <p className="text-2xl font-bold font-display leading-none">{purchased}</p>
                <p className="text-xs opacity-40 mt-0.5">comprados</p>
              </div>
              <div className="w-px h-8 opacity-10" style={{ background: 'currentColor' }} />
              <div>
                <p className="text-2xl font-bold font-display leading-none">R${totalEstimated.toFixed(0)}</p>
                <p className="text-xs opacity-40 mt-0.5">estimado</p>
              </div>
            </div>
          </div>

          {/* Right: circular progress */}
          <div className="relative flex-shrink-0 w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Track */}
              <circle cx="60" cy="60" r={radius} fill="none"
                strokeWidth="8" stroke="currentColor" strokeOpacity="0.08"
              />
              {/* Progress */}
              <circle cx="60" cy="60" r={radius} fill="none"
                strokeWidth="8"
                stroke="var(--accent)"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.32,0.72,0,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-display leading-none">{Math.round(progress)}%</span>
              <span className="text-[10px] opacity-40 mt-0.5">listo</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {totalItems > 0 && (
          <div className="relative mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }}
            />
          </div>
        )}
      </div>

      {/* ── SHOPPING MODE BANNER ── */}
      {shoppingMode ? (
        <div
          className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 animate-scale-in"
          style={{ background: 'var(--accent-soft)', border: '1px solid rgba(var(--accent-rgb), 0.25)' }}
        >
          {/* Ping indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }} />
            <div className="absolute inset-0 rounded-full shopping-active-ring" style={{ background: 'var(--accent)', opacity: 0.5 }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Modo Compras Activo</p>
            <p className="text-xs opacity-60">Pantalla encendida · {pending} productos pendientes</p>
          </div>
          <button
            onClick={toggleShoppingMode}
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(var(--accent-rgb), 0.2)', color: 'var(--accent)' }}
          >
            Salir
          </button>
        </div>
      ) : (
        <button
          onClick={toggleShoppingMode}
          className="w-full relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 card-hover transition-all"
          style={{
            background: isDark ? 'var(--bg-card)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-soft)' }}
          >
            <span className="text-xl">🛒</span>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold">Iniciar Modo Compras</p>
            <p className="text-xs opacity-40">Pantalla siempre encendida · tachado animado</p>
          </div>
          <svg className="w-4 h-4 opacity-30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* ── CONTROLES DE TEMA ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>

        {/* Tema oscuro/claro */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
            <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
          </div>
          <span className="text-sm font-medium flex-1 text-left">
            {isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          </span>
          <div
            className="w-10 h-6 rounded-full relative transition-all flex-shrink-0"
            style={{ background: isDark ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
              style={{ left: isDark ? '18px' : '2px' }}
            />
          </div>
        </button>

        {/* Color acento */}
        <button
          onClick={() => setShowAccentPicker(!showAccentPicker)}
          className="w-full flex items-center gap-3 px-4 py-3.5 transition-all"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
            <span className="text-lg">🎨</span>
          </div>
          <span className="text-sm font-medium flex-1 text-left">Color de acento</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ background: ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex }} />
            <svg className={`w-4 h-4 opacity-30 transition-transform ${showAccentPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Picker de colores */}
        {showAccentPicker && (
          <div className="px-4 pb-4 grid grid-cols-6 gap-2 animate-slide-up" style={{ borderTop: '1px solid var(--border)' }}>
            {ACCENT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setAccentColor(opt.id); setShowAccentPicker(false); }}
                className="flex flex-col items-center gap-1.5 pt-3"
                title={opt.label}
              >
                <div
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background: opt.hex,
                    boxShadow: accentColor === opt.id ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${opt.hex}` : 'none',
                    transform: accentColor === opt.id ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
                <span className="text-[9px] opacity-50">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}