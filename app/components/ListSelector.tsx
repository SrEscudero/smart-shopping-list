// app/components/ListSelector.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { Layers, Plus, Check, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListSelector() {
  const { lists, activeListId, createList, switchList, deleteList, renameList } = useShoppingStore();
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList(newListName.trim());
    setNewListName('');
  };

  const handleStartRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      renameList(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Selector trigger bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Layers size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Lista activa</p>
            <p className="text-xs font-bold truncate text-[var(--text-primary)]">
              {activeListId ? lists.find(l => l.id === activeListId)?.name || 'Principal' : 'Principal'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
          style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border)', minHeight: 'unset' }}
        >
          Gestionar ({lists.length + 1})
        </button>
      </div>

      {/* Lists Management Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-2xl mx-auto rounded-t-3xl p-5 space-y-4 shadow-2xl"
              style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}
            >
              {/* Handle */}
              <div className="flex justify-center">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(128,128,128,0.3)' }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={20} className="text-[var(--accent)]" />
                  <h3 className="text-base font-bold font-display text-[var(--text-primary)]">Mis Listas de Compras</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]"
                  style={{ minHeight: 'unset' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Create New List Form */}
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva lista (ej. Farmacia, Ferretería)..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white disabled:opacity-40 flex items-center gap-1.5 transition-all"
                  style={{ background: 'var(--accent)', minHeight: 'unset' }}
                >
                  <Plus size={16} /> Crear
                </button>
              </form>

              {/* List of Shopping Lists */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {/* Default Main List option */}
                <div
                  onClick={() => { switchList(''); setShowModal(false); }}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${!activeListId ? 'border-2 border-[var(--accent)]' : 'border border-[var(--border)]'}`}
                  style={{ background: !activeListId ? 'var(--accent-soft)' : 'var(--bg-elevated)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--bg-card)', color: 'var(--accent)' }}>
                      P
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">Lista Principal</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">Lista predeterminada</p>
                    </div>
                  </div>
                  {!activeListId && <Check size={18} className="text-[var(--accent)]" />}
                </div>

                {/* User Created Lists */}
                {lists.map(list => {
                  const isActive = activeListId === list.id;
                  const isEditing = editingId === list.id;

                  return (
                    <div
                      key={list.id}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all ${isActive ? 'border-2 border-[var(--accent)]' : 'border border-[var(--border)]'}`}
                      style={{ background: isActive ? 'var(--accent-soft)' : 'var(--bg-elevated)' }}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[var(--accent)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleSaveRename(list.id)}
                          />
                          <button
                            onClick={() => handleSaveRename(list.id)}
                            className="p-1 text-green-400 hover:bg-green-400/10 rounded-lg"
                            style={{ minHeight: 'unset' }}
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => { switchList(list.id); setShowModal(false); }}
                          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold uppercase"
                            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                            {list.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate text-[var(--text-primary)]">{list.name}</p>
                            <p className="text-[11px] text-[var(--text-tertiary)]">{list.items?.length || 0} items</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        {!isEditing && (
                          <button
                            onClick={() => handleStartRename(list.id, list.name)}
                            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                            style={{ minHeight: 'unset' }}
                            title="Renombrar"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteList(list.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          style={{ minHeight: 'unset' }}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
