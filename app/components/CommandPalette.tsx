// app/components/CommandPalette.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, BarChart3, CalendarDays, Home, Plus, Moon, Sun, Share2, Download, Bookmark, X } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: 'home' | 'list' | 'stats' | 'history') => void;
  onAction: (action: string) => void;
}

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

export default function CommandPalette({ open, onClose, onNavigate, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, toggleTheme, theme } = useShoppingStore();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => [
    { id: 'nav-home', label: 'Ir a Inicio', icon: <Home size={16} />, category: 'Navegación', action: () => { onNavigate('home'); onClose(); } },
    { id: 'nav-list', label: 'Ir a Lista', icon: <ShoppingCart size={16} />, category: 'Navegación', action: () => { onNavigate('list'); onClose(); } },
    { id: 'nav-stats', label: 'Ir a Estadísticas', icon: <BarChart3 size={16} />, category: 'Navegación', action: () => { onNavigate('stats'); onClose(); } },
    { id: 'nav-history', label: 'Ir a Historial', icon: <CalendarDays size={16} />, category: 'Navegación', action: () => { onNavigate('history'); onClose(); } },
    { id: 'add-product', label: 'Agregar producto', icon: <Plus size={16} />, category: 'Acciones', action: () => { onAction('add'); onClose(); } },
    { id: 'toggle-theme', label: `Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`, icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, category: 'Acciones', action: () => { toggleTheme(); onClose(); } },
    { id: 'share', label: 'Compartir lista', icon: <Share2 size={16} />, category: 'Acciones', action: () => { onAction('share'); onClose(); } },
    { id: 'export', label: 'Descargar CSV', icon: <Download size={16} />, category: 'Acciones', action: () => { onAction('export'); onClose(); } },
    { id: 'templates', label: 'Ver plantillas', icon: <Bookmark size={16} />, category: 'Acciones', action: () => { onAction('templates'); onClose(); } },
    ...items.slice(0, 10).map(item => ({
      id: `product-${item.id}`,
      label: `${item.name} — ${item.category}`,
      icon: <ShoppingCart size={16} />,
      category: 'Productos',
      action: () => { onNavigate('list'); onClose(); },
    })),
  ], [items, theme, onNavigate, onClose, onAction, toggleTheme]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [query, commands]);

  const grouped = useMemo(() => {
    const map: Record<string, Command[]> = {};
    filtered.forEach(c => {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    });
    return map;
  }, [filtered]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] cmd-overlay flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar comandos, productos..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2 scrollbar-hide">
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <p className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5" style={{ color: 'var(--text-tertiary)' }}>{category}</p>
                  {cmds.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--bg-elevated)]"
                      style={{ minHeight: 'unset' }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{cmd.icon}</span>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{cmd.label}</span>
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No se encontraron resultados</p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 flex items-center gap-3 text-[10px]"
              style={{ borderTop: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
              <span>↑↓ navegar</span>
              <span>↵ seleccionar</span>
              <span>esc cerrar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
