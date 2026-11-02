// app/components/Dashboard.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useShoppingStore, CurrencySymbol, ListDensity, ThemeMode, CardStyle } from '../../store/useShoppingStore';
import { ShoppingCart, Sun, Moon, Monitor, Palette, ChevronDown, Pencil, Check, X, DollarSign, LayoutList, Sparkles, Clock, Layers, Volume2, VolumeX, Plus, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackupRestore from './BackupRestore';
import BudgetWidget from './BudgetWidget';

const ACCENT_OPTIONS = [
  { id: 'slate',      label: 'Pizarra',    hex: '#64748B' },
  { id: 'monochrome', label: 'Monocromo',  hex: '#27272A' },
  { id: 'titanium',   label: 'Titanio',    hex: '#71717A' },
  { id: 'copper',     label: 'Cobre',      hex: '#C2956B' },
  { id: 'gold',       label: 'Oro',        hex: '#C5A059' },
  { id: 'rose',       label: 'Rosa Taupe', hex: '#D48C8C' },
  { id: 'sage',       label: 'Salvia',     hex: '#6B8F71' },
  { id: 'coral',      label: 'Coral',      hex: '#E07A5F' },
  { id: 'navy',       label: 'Naval',      hex: '#3D5A80' },
  { id: 'blue',       label: 'Índigo',     hex: '#6366F1' },
  { id: 'green',      label: 'Esmeralda',  hex: '#10B981' },
  { id: 'orange',     label: 'Ámbar',      hex: '#F59E0B' },
  { id: 'pink',       label: 'Magenta',    hex: '#EC4899' },
  { id: 'purple',     label: 'Violeta',    hex: '#A855F7' },
  { id: 'teal',       label: 'Cian',       hex: '#06B6D4' },
] as const;

const CARD_STYLE_OPTIONS: { id: CardStyle; label: string; desc: string }[] = [
  { id: 'classic', label: 'Clásico Elevado', desc: 'Sombra suave y bordes pulidos' },
  { id: 'minimal', label: 'Minimal Plano', desc: 'Bordes finos sin sombra' },
  { id: 'glass', label: 'Cristal Blur', desc: 'Vidrio translúcido' },
];

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

function getGreeting(): { text: string; period: string } {
  const h = new Date().getHours();
  if (h < 6) return { text: 'Buenas noches', period: 'night' };
  if (h < 12) return { text: 'Buenos días', period: 'morning' };
  if (h < 18) return { text: 'Buenas tardes', period: 'afternoon' };
  return { text: 'Buenas noches', period: 'night' };
}

export default function Dashboard({ onOpenList, onAddProduct }: { onOpenList: () => void; onAddProduct: () => void }) {
  const {
    items, totalBudget, month, theme, accentColor, shoppingMode, currency, listDensity, cardStyle, soundEnabled,
    setTheme, setAccentColor, toggleShoppingMode, setMonth, setCurrency, setListDensity, setCardStyle, toggleSound
  } = useShoppingStore();

  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showDensityPicker, setShowDensityPicker] = useState(false);
  const [showCardStylePicker, setShowCardStylePicker] = useState(false);
  const [editingMonth, setEditingMonth] = useState(false);
  const [monthValue, setMonthValue] = useState(month);
  const monthInputRef = useRef<HTMLInputElement>(null);


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

  const { totalItems, purchased, pending, totalEstimated, progress, recurringCount } = stats;
  const c = currency || 'R$';

  return (
    <div className="space-y-5">
      <section className="monthly-hero" aria-label="Resumen del mes">
        <div className="flex items-center justify-between gap-3">
          <p className="hero-eyebrow"><Clock size={14} /> {getGreeting().text}</p>
          <span className="hero-badge">PLAN MENSUAL</span>
        </div>
        <h2 className="hero-title">Tu mes, bien organizado.</h2>
        <p className="hero-description">Lo que necesitas. Dentro de tu presupuesto.</p>
        <div className="mt-5">
          {editingMonth ? (
            <div className="flex gap-2">
              <input ref={monthInputRef} aria-label="Mes de la lista" value={monthValue}
                onChange={e => setMonthValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveMonth(); if (e.key === 'Escape') setEditingMonth(false); }}
                className="min-w-0 flex-1 rounded-xl px-3 bg-white/10 border border-white/30" />
              <button onClick={saveMonth} aria-label="Guardar mes" className="p-2"><Check size={18} /></button>
              <button onClick={() => setEditingMonth(false)} aria-label="Cancelar edición" className="p-2"><X size={18} /></button>
            </div>
          ) : (
            <button onClick={startEditMonth} className="hero-month" aria-label="Editar mes de la lista">{month}<Pencil size={14} /></button>
          )}
        </div>
        <div className="hero-metrics">
          <div><strong>{pending}</strong><span>Por comprar</span></div>
          <div><strong>{purchased}</strong><span>En el carrito</span></div>
          <div><strong className="hero-money">{c} {totalEstimated.toFixed(2)}</strong><span>Total estimado</span></div>
        </div>
        <div className="hero-progress" role="progressbar" aria-label="Productos comprados" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2 gap-2 text-white/80"><span>{purchased} de {totalItems} productos listos</span><span>{Math.round(progress)}%</span></div>
        {recurringCount > 0 && <p className="flex gap-2 items-center mt-3 text-xs text-white/80"><Sparkles size={14} />{recurringCount} productos se repetirán al cerrar el mes</p>}
        <div className="hero-actions">
          <button onClick={onAddProduct}><Plus size={18} /> Agregar producto</button>
          <button onClick={onOpenList}>Ver mi lista <ArrowUpRight size={18} /></button>
        </div>
      </section>
      <BudgetWidget full />
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
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Compra en curso · {pending} pendientes</p>
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
          onClick={() => { toggleShoppingMode(); onOpenList(); }}
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
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Una vista sencilla para comprar</p>
          </div>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
            <svg width="8" height="14" fill="none" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </motion.button>
      )}

      <details className="settings-panel">
        <summary><SlidersHorizontal size={18} /><span>Personaliza tu experiencia<small>Tema, moneda y copias de seguridad</small></span><ChevronDown size={18} /></summary>
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
              className="px-5 py-4 flex flex-wrap justify-center gap-3 overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
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

        {/* Card Style Preset */}
        <button onClick={() => setShowCardStylePicker(!showCardStylePicker)} className="ios-list-item w-full text-left">
          <div className="btn-icon" style={{ width: 40, height: 40, minHeight: 'unset', border: 'none', background: 'var(--bg-elevated)' }}>
            <Layers size={18} />
          </div>
          <span className="text-sm font-semibold flex-1">Estilo de tarjetas</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold capitalize text-[var(--accent)]">
              {CARD_STYLE_OPTIONS.find(c => c.id === cardStyle)?.label || 'Clásico'}
            </span>
            <motion.div animate={{ rotate: showCardStylePicker ? 180 : 0 }}>
              <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
            </motion.div>
          </div>
        </button>
        <AnimatePresence>
          {showCardStylePicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3 space-y-1.5 overflow-hidden">
              {CARD_STYLE_OPTIONS.map((opt, i) => (
                <motion.button key={opt.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setCardStyle(opt.id); setShowCardStylePicker(false); }}
                  className={`chip w-full justify-between ${cardStyle === opt.id ? 'chip-active' : ''}`}
                  style={{ minHeight: 'unset', padding: '12px 16px' }}>
                  <div>
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[10px] ml-2 opacity-60 block text-left">{opt.desc}</span>
                  </div>
                  {cardStyle === opt.id && <Check size={14} />}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sound FX Toggle */}
        <div className="ios-list-item">
          <div className="btn-icon" style={{ width: 40, height: 40, minHeight: 'unset', border: 'none', background: 'var(--bg-elevated)' }}>
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold block">Efectos de sonido</span>
            <span className="text-[11px] text-[var(--text-tertiary)] block">Sonido al completar ítems</span>
          </div>
          <button
            role="switch" aria-checked={soundEnabled} aria-label="Efectos de sonido"
            onClick={toggleSound}
            className={`w-12 h-7 rounded-full p-1 transition-colors relative flex items-center ${soundEnabled ? 'bg-[var(--accent)]' : 'bg-gray-500/30'}`}
            style={{ minHeight: 'unset' }}
          >
            <motion.div
              animate={{ x: soundEnabled ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>
      </div>

      {/* ═══ BACKUP/RESTORE ═══ */}
      <BackupRestore />
      </details>
    </div>
  );
}