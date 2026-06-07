// app/components/Dashboard.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useShoppingStore, CurrencySymbol, ListDensity, ThemeMode } from '../../store/useShoppingStore';
import { ShoppingCart, Sun, Moon, Monitor, Palette, ChevronRight, ChevronDown, Pencil, Check, X, DollarSign, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackupRestore from './BackupRestore';

const ACCENT_OPTIONS = [
  { id: 'blue',   label: 'Azul',     hex: '#3B82F6' },
  { id: 'green',  label: 'Verde',    hex: '#30D158' },
  { id: 'orange', label: 'Naranja',  hex: '#FF9F0A' },
  { id: 'pink',   label: 'Rojo',     hex: '#FF375F' },
  { id: 'purple', label: 'Morado',   hex: '#BF5AF2' },
  { id: 'teal',   label: 'Celeste',  hex: '#5AC8FA' },
] as const;

const CURRENCY_OPTIONS: { id: CurrencySymbol; label: string }[] = [
  { id: 'R$', label: 'R$ Real' }, { id: '$', label: '$ Dólar' }, { id: '€', label: '€ Euro' },
  { id: '£', label: '£ Libra' }, { id: 'ARS', label: 'ARS Peso AR' }, { id: 'CLP', label: 'CLP Peso CL' },
  { id: 'COP', label: 'COP Peso CO' }, { id: 'MXN', label: 'MXN Peso MX' },
  { id: 'PEN', label: 'PEN Sol' }, { id: 'UYU', label: 'UYU Peso UY' },
];

const DENSITY_OPTIONS: { id: ListDensity; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compacta', desc: 'Más items visibles' },
  { id: 'normal', label: 'Normal', desc: 'Equilibrado' },
  { id: 'spacious', label: 'Espaciosa', desc: 'Más espacio' },
];

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'dark', label: 'Oscuro', icon: <Moon size={14} /> },
  { id: 'light', label: 'Claro', icon: <Sun size={14} /> },
  { id: 'auto', label: 'Auto', icon: <Monitor size={14} /> },
];

export default function Dashboard() {
  const {
    items, totalBudget, month, theme, accentColor, shoppingMode, currency, listDensity,
    setTheme, setAccentColor, toggleShoppingMode, setMonth, setCurrency, setListDensity
  } = useShoppingStore();
  const [mounted, setMounted] = useState(false);
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDensityPicker, setShowDensityPicker] = useState(false);
  const [editingMonth, setEditingMonth] = useState(false);
  const [monthValue, setMonthValue] = useState(month);
  const monthInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);
  useEffect(() => { if (editingMonth && monthInputRef.current) { monthInputRef.current.focus(); monthInputRef.current.select(); } }, [editingMonth]);

  const startEditMonth = () => { setMonthValue(month); setEditingMonth(true); };
  const saveMonth = () => { if (monthValue.trim()) setMonth(monthValue.trim()); setEditingMonth(false); };

  const stats = useMemo(() => {
    const totalItems = items.length;
    const purchased = items.filter(i => i.isPurchased).length;
    const pending = totalItems - purchased;
    const totalEstimated = items.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
    const remaining = totalBudget - totalEstimated;
    const progress = totalItems > 0 ? (purchased / totalItems) * 100 : 0;
    const isOver = totalBudget > 0 && remaining < 0;
    const recurringCount = items.filter(i => i.isRecurring).length;
    return { totalItems, purchased, pending, totalEstimated, remaining, progress, isOver, recurringCount };
  }, [items, totalBudget]);

  const { totalItems, purchased, pending, totalEstimated, remaining, progress, isOver, recurringCount } = stats;
  const c = currency || 'R$';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (progress / 100) * circumference;

  // Resolve effective theme for display
  const effectiveTheme = theme === 'auto'
    ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  const isDark = effectiveTheme === 'dark';

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
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: `var(--accent)` }} />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingMonth ? (
              <div className="flex items-center gap-1.5 mb-1">
                <input ref={monthInputRef} value={monthValue} onChange={e => setMonthValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveMonth(); if (e.key === 'Escape') setEditingMonth(false); }}
                  className="text-xs font-semibold uppercase tracking-widest font-display bg-[var(--bg-elevated)] border border-[var(--accent)] rounded-lg px-2 py-1 focus:outline-none text-[var(--text-primary)] min-w-0 flex-1" />
                <button onClick={saveMonth} className="p-1 text-green-400 hover:bg-green-400/10 rounded-lg" style={{ minHeight: 'unset' }}><Check size={14} /></button>
                <button onClick={() => setEditingMonth(false)} className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg" style={{ minHeight: 'unset' }}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={startEditMonth} className="flex items-center gap-1.5 mb-1 group" style={{ minHeight: 'unset' }}>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-50 font-display">{month}</p>
                <Pencil size={10} className="opacity-0 group-hover:opacity-50 transition-opacity text-[var(--accent)]" />
              </button>
            )}
            <h1 className="font-display text-3xl font-800 leading-none tracking-tight" style={{ fontWeight: 800 }}>
              {totalBudget > 0 ? (
                <span className={isOver ? 'text-red-400' : ''} style={isOver ? {} : { color: 'var(--accent)' }}>{c} {Math.abs(remaining).toFixed(0)}</span>
              ) : (
                <span style={{ color: 'var(--accent)' }}>Mis Compras</span>
              )}
            </h1>
            {totalBudget > 0 && <p className="text-xs mt-1 opacity-50">{isOver ? `Excedido del presupuesto` : `disponible de ${c} ${totalBudget.toFixed(0)}`}</p>}
            <div className="flex items-center gap-4 mt-4">
              {[
                { value: pending, label: 'pendientes' },
                { value: purchased, label: 'comprados' },
                { value: `${c}${totalEstimated.toFixed(0)}`, label: 'estimado' },
              ].map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <div className="w-px h-8 opacity-10 flex-shrink-0" style={{ background: 'currentColor' }} />}
                  <div>
                    <motion.p key={String(stat.value)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-2xl font-bold font-display leading-none">{stat.value}</motion.p>
                    <p className="text-xs opacity-40 mt-0.5">{stat.label}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {recurringCount > 0 && (
              <p className="text-[10px] mt-2 px-2 py-0.5 rounded-full inline-block" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                🔄 {recurringCount} producto{recurringCount > 1 ? 's' : ''} recurrente{recurringCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="relative flex-shrink-0 w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" stroke="currentColor" strokeOpacity="0.08" />
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" stroke="var(--accent)" strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`} style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.32,0.72,0,1)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-display leading-none">{Math.round(progress)}%</span>
              <span className="text-[10px] opacity-40 mt-0.5">listo</span>
            </div>
          </div>
        </div>
        {totalItems > 0 && (
          <div className="relative mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }} />
          </div>
        )}
      </div>

      {/* ── SHOPPING MODE ── */}
      {shoppingMode ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'var(--accent-soft)', border: '1px solid rgba(var(--accent-rgb), 0.25)' }}>
          <div className="relative flex-shrink-0"><div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }} /><div className="absolute inset-0 rounded-full shopping-active-ring" style={{ background: 'var(--accent)', opacity: 0.5 }} /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Modo Compras Activo</p><p className="text-xs opacity-60">Pantalla encendida · {pending} productos pendientes</p></div>
          <button onClick={toggleShoppingMode} className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all" style={{ background: 'rgba(var(--accent-rgb), 0.2)', color: 'var(--accent)' }}>Salir</button>
        </motion.div>
      ) : (
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={toggleShoppingMode}
          className="w-full relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 transition-all gradient-card"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--accent)]" style={{ background: 'var(--accent-soft)' }}><ShoppingCart size={20} strokeWidth={2.5} /></div>
          <div className="text-left flex-1"><p className="text-sm font-semibold">Iniciar Modo Compras</p><p className="text-xs opacity-40">Pantalla siempre encendida · tachado animado</p></div>
          <ChevronRight size={16} className="opacity-30 flex-shrink-0" />
        </motion.button>
      )}

      {/* ── CONTROLES ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {/* Theme selector (3-way: dark/light/auto) */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]" style={{ background: 'var(--bg-elevated)' }}>
            {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
          </div>
          <span className="text-sm font-medium flex-1">Tema</span>
          <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            {THEME_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setTheme(opt.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-all"
                style={{
                  background: theme === opt.id ? 'var(--accent)' : 'transparent',
                  color: theme === opt.id ? '#fff' : 'var(--text-secondary)',
                  minHeight: 'unset',
                }}>
                {opt.icon}<span className="hidden min-[360px]:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color acento */}
        <button onClick={() => setShowAccentPicker(!showAccentPicker)} className="w-full flex items-center gap-3 px-4 py-3.5 transition-all" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]" style={{ background: 'var(--bg-elevated)' }}><Palette size={18} /></div>
          <span className="text-sm font-medium flex-1 text-left">Color de acento</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ background: ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex }} />
            <motion.div animate={{ rotate: showAccentPicker ? 180 : 0 }} transition={{ duration: 0.25 }}><ChevronDown size={16} className="opacity-30" /></motion.div>
          </div>
        </button>
        <AnimatePresence>
          {showAccentPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
              className="px-4 pb-4 grid grid-cols-6 gap-2 overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
              {ACCENT_OPTIONS.map((opt, i) => (
                <motion.button key={opt.id} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => { setAccentColor(opt.id); setShowAccentPicker(false); }} className="flex flex-col items-center gap-1.5 pt-3" title={opt.label}>
                  <div className="w-8 h-8 rounded-full transition-all" style={{ background: opt.hex, boxShadow: accentColor === opt.id ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${opt.hex}` : 'none', transform: accentColor === opt.id ? 'scale(1.15)' : 'scale(1)' }} />
                  <span className="text-[9px] opacity-50">{opt.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Moneda */}
        <button onClick={() => setShowCurrencyPicker(!showCurrencyPicker)} className="w-full flex items-center gap-3 px-4 py-3.5 transition-all" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]" style={{ background: 'var(--bg-elevated)' }}><DollarSign size={18} /></div>
          <span className="text-sm font-medium flex-1 text-left">Moneda</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--accent)]">{c}</span>
            <motion.div animate={{ rotate: showCurrencyPicker ? 180 : 0 }} transition={{ duration: 0.25 }}><ChevronDown size={16} className="opacity-30" /></motion.div>
          </div>
        </button>
        <AnimatePresence>
          {showCurrencyPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
              className="px-4 pb-3 grid grid-cols-2 gap-1.5 overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
              {CURRENCY_OPTIONS.map((opt, i) => (
                <motion.button key={opt.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => { setCurrency(opt.id); setShowCurrencyPicker(false); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-sm"
                  style={{ background: currency === opt.id ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: currency === opt.id ? 'var(--accent)' : 'var(--text-secondary)', border: currency === opt.id ? '1px solid rgba(var(--accent-rgb), 0.3)' : '1px solid transparent', minHeight: 'unset' }}>
                  <span className="font-bold text-xs">{opt.id}</span>
                  <span className="text-[11px] opacity-70 truncate">{opt.label.split(' ').slice(1).join(' ')}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Densidad */}
        <button onClick={() => setShowDensityPicker(!showDensityPicker)} className="w-full flex items-center gap-3 px-4 py-3.5 transition-all">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]" style={{ background: 'var(--bg-elevated)' }}><LayoutList size={18} /></div>
          <span className="text-sm font-medium flex-1 text-left">Densidad de lista</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--accent)] capitalize">{listDensity || 'normal'}</span>
            <motion.div animate={{ rotate: showDensityPicker ? 180 : 0 }} transition={{ duration: 0.25 }}><ChevronDown size={16} className="opacity-30" /></motion.div>
          </div>
        </button>
        <AnimatePresence>
          {showDensityPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="px-4 pb-3 space-y-1.5 overflow-hidden">
              {DENSITY_OPTIONS.map((opt, i) => (
                <motion.button key={opt.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setListDensity(opt.id); setShowDensityPicker(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: listDensity === opt.id ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: listDensity === opt.id ? 'var(--accent)' : 'var(--text-secondary)', border: listDensity === opt.id ? '1px solid rgba(var(--accent-rgb), 0.3)' : '1px solid transparent', minHeight: 'unset' }}>
                  <div><span className="text-sm font-semibold">{opt.label}</span><span className="text-[10px] ml-2 opacity-60">{opt.desc}</span></div>
                  {listDensity === opt.id && <Check size={14} />}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BACKUP/RESTORE ── */}
      <BackupRestore />
    </div>
  );
}