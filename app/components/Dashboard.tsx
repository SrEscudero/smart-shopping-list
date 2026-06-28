// app/components/Dashboard.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useShoppingStore, CurrencySymbol, ListDensity, ThemeMode } from '../../store/useShoppingStore';
import { ShoppingCart, Sun, Moon, Monitor, Palette, ChevronDown, Pencil, Check, X, DollarSign, LayoutList, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackupRestore from './BackupRestore';

const ACCENT_OPTIONS = [
  { id: 'blue',   label: 'Índigo',   hex: '#6366F1' },
  { id: 'green',  label: 'Esmeralda',hex: '#10B981' },
  { id: 'orange', label: 'Ámbar',    hex: '#F59E0B' },
  { id: 'pink',   label: 'Rosa',     hex: '#EC4899' },
  { id: 'purple', label: 'Violeta',  hex: '#A855F7' },
  { id: 'teal',   label: 'Cian',     hex: '#06B6D4' },
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '🌙 Buenas noches';
  if (h < 12) return '☀️ Buenos días';
  if (h < 18) return '🌤️ Buenas tardes';
  return '🌙 Buenas noches';
}

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

  // Donut chart calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (progress / 100) * circumference;

  return (
    <div className="space-y-5">
      {/* ═══ HERO CARD — Animated Mesh Gradient ═══ */}
      <div
        className={`relative overflow-hidden p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Animated gradient blobs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 pointer-events-none animate-morph animate-glow-pulse"
          style={{ background: `radial-gradient(ellipse, rgba(var(--accent-rgb), 0.12) 0%, transparent 70%)` }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 pointer-events-none animate-morph animate-glow-pulse"
          style={{ background: `radial-gradient(ellipse, rgba(var(--accent-rgb), 0.06) 0%, transparent 70%)`, animationDelay: '4s' }} />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Greeting */}
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>{getGreeting()}</p>

            {/* Month label */}
            {editingMonth ? (
              <div className="flex items-center gap-1.5 mb-2">
                <input ref={monthInputRef} value={monthValue} onChange={e => setMonthValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveMonth(); if (e.key === 'Escape') setEditingMonth(false); }}
                  className="text-[11px] font-bold uppercase tracking-[0.15em] bg-[var(--bg-elevated)] border border-[var(--accent)] px-3 py-1.5 focus:outline-none text-[var(--text-primary)] min-w-0 flex-1"
                  style={{ borderRadius: 'var(--radius-sm)' }} />
                <button onClick={saveMonth} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg" style={{ minHeight: 'unset' }}><Check size={14} /></button>
                <button onClick={() => setEditingMonth(false)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg" style={{ minHeight: 'unset' }}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={startEditMonth} className="flex items-center gap-2 mb-2 group" style={{ minHeight: 'unset' }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-tertiary)' }}>{month}</span>
                <Pencil size={10} className="opacity-0 group-hover:opacity-50 transition-opacity text-[var(--accent)]" />
              </button>
            )}

            {/* Main number with counter animation */}
            <h1 className="font-display font-900 leading-[0.9] tracking-tight" style={{ fontSize: 'clamp(2.2rem, 8vw, 3.2rem)' }}>
              {totalBudget > 0 ? (
                <motion.span
                  key={remaining.toFixed(0)}
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  className={isOver ? 'text-red-400' : ''}
                  style={isOver ? {} : { color: 'var(--accent)' }}
                >
                  {c}{Math.abs(remaining).toFixed(0)}
                </motion.span>
              ) : (
                <span style={{ color: 'var(--accent)' }}>Mis Compras</span>
              )}
            </h1>
            {totalBudget > 0 && (
              <p className="text-[12px] mt-1.5 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {isOver ? 'Excedido del presupuesto' : `disponible de ${c}${totalBudget.toFixed(0)}`}
              </p>
            )}

            {/* Mini stats row with stagger animation */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { value: pending, label: 'pendientes', color: 'var(--text-primary)' },
                { value: purchased, label: 'comprados', color: 'var(--success)' },
                { value: `${c}${totalEstimated.toFixed(0)}`, label: 'estimado', color: 'var(--accent)' },
              ].map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <div className="w-px h-8 flex-shrink-0" style={{ background: 'var(--border)' }} />}
                  <div className="min-w-0">
                    <motion.p
                      key={String(stat.value)}
                      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="text-xl font-bold font-display leading-none"
                      style={{ color: stat.color }}
                    >{stat.value}</motion.p>
                    <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {recurringCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Sparkles size={12} /> {recurringCount} recurrente{recurringCount > 1 ? 's' : ''}
              </motion.div>
            )}
          </div>

          {/* Progress ring with gradient stroke */}
          <div className="relative flex-shrink-0 w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                stroke="var(--border)" strokeOpacity="0.8" />
              <motion.circle cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                stroke="var(--accent)" strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${strokeDash} ${circumference}` }}
                transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
                style={{ filter: `drop-shadow(0 0 8px rgba(var(--accent-rgb), 0.4))` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={Math.round(progress)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-lg font-bold font-display leading-none"
              >{Math.round(progress)}%</motion.span>
              <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>listo</span>
            </div>
          </div>
        </div>

        {/* Progress bar with glow */}
        {totalItems > 0 && (
          <div className="relative mt-5 h-[5px] overflow-hidden" style={{ borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)' }}>
            <motion.div
              className="absolute left-0 top-0 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
              style={{ borderRadius: 'var(--radius-full)', background: `linear-gradient(90deg, var(--accent), rgba(var(--accent-rgb), 0.7))`, boxShadow: `0 0 12px rgba(var(--accent-rgb), 0.4)` }}
            />
          </div>
        )}
      </div>

      {/* ═══ SHOPPING MODE — Dynamic Island Style ═══ */}
      {shoppingMode ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative overflow-hidden flex items-center gap-4 px-5 py-4"
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid rgba(var(--accent-rgb), 0.2)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          {/* Breathing dot */}
          <div className="relative flex-shrink-0">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }} />
            <div className="absolute inset-0 rounded-full shopping-active-ring" style={{ background: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>Modo Compras Activo</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Pantalla encendida · {pending} pendientes</p>
          </div>
          <button onClick={toggleShoppingMode}
            className="flex-shrink-0 text-xs font-bold px-4 py-2 transition-all"
            style={{ background: 'rgba(var(--accent-rgb), 0.2)', color: 'var(--accent)', borderRadius: 'var(--radius-full)', minHeight: 'unset' }}>
            Salir
          </button>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleShoppingMode}
          className="w-full relative overflow-hidden flex items-center gap-4 px-5 py-4 transition-all card-glow"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 text-[var(--accent)]"
            style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)' }}>
            <ShoppingCart size={22} strokeWidth={2.5} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Iniciar Modo Compras</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Pantalla siempre encendida</p>
          </div>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            <svg width="8" height="14" fill="none" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </motion.button>
      )}

      {/* ═══ SETTINGS — iOS Grouped List ═══ */}
      <div className="ios-list">
        {/* Theme selector — Segmented Control */}
        <div className="ios-list-item">
          <div className="btn-icon" style={{ width: 40, height: 40, minHeight: 'unset', border: 'none', background: 'var(--bg-elevated)' }}>
            {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
          </div>
          <span className="text-sm font-semibold flex-1">Tema</span>
          <div className="segmented-control" style={{ width: 'auto' }}>
            {THEME_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setTheme(opt.id)} data-active={theme === opt.id ? 'true' : undefined}
                className="flex items-center gap-1 !px-3 !py-1.5 !text-[11px]">
                {opt.icon}<span className="hidden min-[360px]:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <button onClick={() => setShowAccentPicker(!showAccentPicker)} className="ios-list-item w-full text-left">
          <div className="btn-icon" style={{ width: 40, height: 40, minHeight: 'unset', border: 'none', background: 'var(--bg-elevated)' }}>
            <Palette size={18} />
          </div>
          <span className="text-sm font-semibold flex-1">Color de acento</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full" style={{ background: ACCENT_OPTIONS.find(a => a.id === accentColor)?.hex, boxShadow: `0 0 0 2px var(--bg-card), 0 0 0 4px var(--border)` }} />
            <motion.div animate={{ rotate: showAccentPicker ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
            </motion.div>
          </div>
        </button>
        <AnimatePresence>
          {showAccentPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-5 py-4 flex justify-center gap-3 overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
              {ACCENT_OPTIONS.map((opt, i) => (
                <motion.button key={opt.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setAccentColor(opt.id); setShowAccentPicker(false); }}
                  className="flex flex-col items-center gap-2" title={opt.label}>
                  <div className="w-10 h-10 rounded-full transition-all"
                    style={{
                      background: opt.hex,
                      boxShadow: accentColor === opt.id
                        ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${opt.hex}, 0 4px 16px ${opt.hex}44`
                        : `0 2px 8px ${opt.hex}33`,
                      transform: accentColor === opt.id ? 'scale(1.15)' : 'scale(1)',
                    }} />
                  <span className="text-[9px] font-semibold" style={{ color: accentColor === opt.id ? opt.hex : 'var(--text-tertiary)' }}>{opt.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Currency */}
        <button onClick={() => setShowCurrencyPicker(!showCurrencyPicker)} className="ios-list-item w-full text-left">
          <div className="btn-icon" style={{ width: 40, height: 40, minHeight: 'unset', border: 'none', background: 'var(--bg-elevated)' }}>
            <DollarSign size={18} />
          </div>
          <span className="text-sm font-semibold flex-1">Moneda</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{c}</span>
            <motion.div animate={{ rotate: showCurrencyPicker ? 180 : 0 }}><ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} /></motion.div>
          </div>
        </button>
        <AnimatePresence>
          {showCurrencyPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3 grid grid-cols-2 gap-1.5 overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
              {CURRENCY_OPTIONS.map((opt, i) => (
                <motion.button key={opt.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => { setCurrency(opt.id); setShowCurrencyPicker(false); }}
                  className={`chip ${currency === opt.id ? 'chip-active' : ''}`}
                  style={{ justifyContent: 'flex-start', minHeight: 'unset', padding: '10px 14px' }}>
                  <span className="font-bold text-xs">{opt.id}</span>
                  <span className="text-[11px] opacity-70 truncate">{opt.label.split(' ').slice(1).join(' ')}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Density */}
        <button onClick={() => setShowDensityPicker(!showDensityPicker)} className="ios-list-item w-full text-left">
          <div className="btn-icon" style={{ width: 40, height: 40, minHeight: 'unset', border: 'none', background: 'var(--bg-elevated)' }}>
            <LayoutList size={18} />
          </div>
          <span className="text-sm font-semibold flex-1">Densidad</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold capitalize" style={{ color: 'var(--accent)' }}>{listDensity || 'normal'}</span>
            <motion.div animate={{ rotate: showDensityPicker ? 180 : 0 }}><ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} /></motion.div>
          </div>
        </button>
        <AnimatePresence>
          {showDensityPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3 space-y-1.5 overflow-hidden">
              {DENSITY_OPTIONS.map((opt, i) => (
                <motion.button key={opt.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setListDensity(opt.id); setShowDensityPicker(false); }}
                  className={`chip w-full justify-between ${listDensity === opt.id ? 'chip-active' : ''}`}
                  style={{ minHeight: 'unset', padding: '12px 16px' }}>
                  <div><span className="text-sm font-semibold">{opt.label}</span><span className="text-[10px] ml-2 opacity-60">{opt.desc}</span></div>
                  {listDensity === opt.id && <Check size={14} />}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ BACKUP/RESTORE ═══ */}
      <BackupRestore />
    </div>
  );
}