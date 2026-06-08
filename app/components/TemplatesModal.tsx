// app/components/TemplatesModal.tsx
"use client";

import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useShoppingStore, Product } from '../../store/useShoppingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Plus, Trash2, X, Copy, Download } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptic';

interface Template {
  id: string;
  name: string;
  items: Array<{ name: string; estimatedPrice: number; quantity: number; category: string; store: string }>;
  createdAt: number;
}

const STORAGE_KEY = 'shopping-templates';

function loadTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveTemplates(templates: Template[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TemplatesModal({ open, onClose }: TemplatesModalProps) {
  const items = useShoppingStore(s => s.items);
  const addMultipleProducts = useShoppingStore(s => s.addMultipleProducts);
  const currency = useShoppingStore(s => s.currency);
  const c = currency || 'R$';

  const [templates, setTemplates] = useState<Template[]>(() => loadTemplates());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!open || typeof window === 'undefined') return null;

  const handleSaveTemplate = () => {
    if (!newName.trim() || items.length === 0) return;
    const template: Template = {
      id: Date.now().toString(36),
      name: newName.trim(),
      items: items.map(i => ({
        name: i.name,
        estimatedPrice: i.estimatedPrice,
        quantity: i.quantity,
        category: i.category,
        store: i.store,
      })),
      createdAt: Date.now(),
    };
    const updated = [template, ...templates];
    setTemplates(updated);
    saveTemplates(updated);
    setNewName('');
    setShowCreateForm(false);
    triggerHaptic('success');
  };

  const handleUseTemplate = (template: Template) => {
    addMultipleProducts(template.items.map(i => ({
      ...i,
      store: i.store || 'Varias',
    })));
    triggerHaptic('success');
    onClose();
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    setDeleteConfirm(null);
    triggerHaptic('light');
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col justify-end"
        >
          <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(4px)' }} onClick={onClose} />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full rounded-t-3xl overflow-hidden"
            style={{ background: 'var(--bg-card)', maxHeight: '80vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(128,128,128,0.3)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                  <Bookmark size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Plantillas</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{templates.length} guardadas</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', minHeight: 'unset' }}>
                <X size={17} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
              {/* Save current as template */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  disabled={items.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all mb-4 disabled:opacity-30"
                  style={{ background: 'var(--accent)', color: 'white', minHeight: 'unset', boxShadow: '0 4px 16px var(--accent-glow)' }}
                >
                  <Plus size={18} /> Guardar lista actual como plantilla
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-2xl p-4 space-y-3 mb-4"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <input
                    type="text"
                    placeholder="Nombre de la plantilla..."
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                    className="w-full text-sm px-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  />
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Se guardarán {items.length} productos como plantilla
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', minHeight: 'unset' }}>
                      Cancelar
                    </button>
                    <button onClick={handleSaveTemplate} disabled={!newName.trim()}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                      style={{ background: 'var(--accent)', minHeight: 'unset' }}>
                      Guardar
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Templates list */}
              {templates.length === 0 ? (
                <div className="py-12 text-center">
                  <Bookmark size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No tienes plantillas guardadas</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Agrega productos y guarda tu lista como plantilla</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template, i) => {
                    const total = template.items.reduce((a, t) => a + t.estimatedPrice * t.quantity, 0);
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4 space-y-2"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{template.name}</h4>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {template.items.length} productos · {c}{total.toFixed(2)}
                            </p>
                          </div>
                          {deleteConfirm === template.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(template.id)}
                                className="text-xs px-2 py-1 rounded-lg font-bold text-red-400 bg-red-500/10"
                                style={{ minHeight: 'unset' }}>Sí</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-2 py-1 rounded-lg font-bold"
                                style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)', minHeight: 'unset' }}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(template.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ color: 'var(--text-tertiary)', minHeight: 'unset' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Preview items */}
                        <div className="flex flex-wrap gap-1">
                          {template.items.slice(0, 5).map((item, j) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 rounded-md"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                              {item.name}
                            </span>
                          ))}
                          {template.items.length > 5 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md"
                              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                              +{template.items.length - 5} más
                            </span>
                          )}
                        </div>

                        <button onClick={() => handleUseTemplate(template)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', minHeight: 'unset' }}>
                          <Copy size={14} /> Usar esta plantilla
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
