// app/components/HistoryModal.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import {
  CalendarDays, Package, CheckSquare, Square, ChevronRight,
  BarChart3 as BarChartIcon, Pencil, Check, X, Search,
  ArrowUpDown, TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Layers, Trash2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryModal() {
  const { history, deleteHistory, closeMonth, items, renameHistoryMonth } = useShoppingStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'spent' | 'items'>('recent');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      renameHistoryMonth(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const filteredHistory = history
    .filter(h => h.month.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
      if (sortBy === 'items') return b.items.length - a.items.length;
      return b.closedAt - a.closedAt;
    });

  const selectedRecord = history.find(h => h.id === selectedMonth);

  // ── DETAIL VIEW ──
  if (selectedRecord) {
    const purchasedCount = selectedRecord.items.filter(i => i.isPurchased).length;
    const completionRate = selectedRecord.items.length > 0
      ? Math.round((purchasedCount / selectedRecord.items.length) * 100) : 0;
    const savings = selectedRecord.totalBudget - selectedRecord.totalSpent;
    const overBudget = savings < 0 && selectedRecord.totalBudget > 0;

    const categoryBreakdown = Object.entries(
      selectedRecord.items.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + i.estimatedPrice * i.quantity;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([, a], [, b]) => b - a);

    const totalCatAmount = categoryBreakdown.reduce((s, [, v]) => s + v, 0);

    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setSelectedMonth(null)}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          ← Volver al historial
        </button>

        {/* Header card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 space-y-5 gradient-card">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] capitalize">{selectedRecord.month}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Cerrado el {new Date(selectedRecord.closedAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${overBudget ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
              {overBudget ? 'Sobre presupuesto' : 'Dentro del presupuesto'}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <DollarSign size={13} />
                <span className="text-[11px] uppercase tracking-wider font-semibold">Presupuesto</span>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">R$ {selectedRecord.totalBudget.toFixed(0)}</p>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-400">
                <ShoppingCart size={13} />
                <span className="text-[11px] uppercase tracking-wider font-semibold">Gastado</span>
              </div>
              <p className="text-lg font-bold text-blue-400">R$ {selectedRecord.totalSpent.toFixed(0)}</p>
            </div>
            <div className={`rounded-xl p-3.5 space-y-1 ${overBudget ? 'bg-red-500/8' : 'bg-green-500/8'}`}>
              <div className={`flex items-center gap-1.5 ${overBudget ? 'text-red-400' : 'text-green-400'}`}>
                {overBudget ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                <span className="text-[11px] uppercase tracking-wider font-semibold">{overBudget ? 'Exceso' : 'Ahorro'}</span>
              </div>
              <p className={`text-lg font-bold ${overBudget ? 'text-red-400' : 'text-green-400'}`}>
                R$ {Math.abs(savings).toFixed(0)}
              </p>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <Layers size={13} />
                <span className="text-[11px] uppercase tracking-wider font-semibold">Completado</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-[var(--text-primary)]">{completionRate}%</p>
                <span className="text-[10px] text-[var(--text-secondary)]">{purchasedCount}/{selectedRecord.items.length}</span>
              </div>
            </div>
          </div>

          {/* Budget progress */}
          {selectedRecord.totalBudget > 0 && (
            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mb-1.5">
                <span>Uso del presupuesto</span>
                <span>{Math.min(100, Math.round((selectedRecord.totalSpent / selectedRecord.totalBudget) * 100))}%</span>
              </div>
              <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: overBudget ? '#FF453A' : 'var(--accent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (selectedRecord.totalSpent / selectedRecord.totalBudget) * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Desglose por categoría</p>
            <div className="space-y-2.5">
              {categoryBreakdown.map(([cat, amount]) => {
                const pct = totalCatAmount > 0 ? (amount / totalCatAmount) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--text-primary)]">{cat}</span>
                      <span className="text-[var(--text-secondary)] tabular-nums">R$ {amount.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--accent)', opacity: 0.4 + (pct / 100) * 0.6 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Product list */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Productos ({selectedRecord.items.length})
          </p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-hide">
            {selectedRecord.items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex items-center justify-between py-2 px-3 bg-[var(--bg-elevated)] rounded-xl"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className={item.isPurchased ? 'text-green-400' : 'text-[var(--text-tertiary)]'}>
                    {item.isPurchased ? <CheckSquare size={15} /> : <Square size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`text-sm block truncate ${item.isPurchased ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{item.category} · x{item.quantity}</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)] ml-2 tabular-nums">
                  R$ {(item.estimatedPrice * item.quantity).toFixed(2)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => setShowDeleteConfirm(selectedRecord.id)}
          className="w-full py-3 rounded-2xl text-sm font-medium text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
        >
          Eliminar este registro
        </button>

        <AnimatePresence>
          {showDeleteConfirm === selectedRecord.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-hidden"
            >
              <button
                onClick={() => { deleteHistory(selectedRecord.id); setSelectedMonth(null); setShowDeleteConfirm(null); }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl text-sm font-semibold"
              >
                Cancelar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-4">
      {/* Close current month */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 space-y-3 gradient-card"
        >
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Package size={16} className="text-orange-400" /> Cerrar mes actual
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Guarda {items.length} productos en el historial y empieza un mes nuevo.
            </p>
          </div>
          {showCloseConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => { closeMonth(); setShowCloseConfirm(false); }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Sí, cerrar mes
              </button>
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="w-full py-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl text-sm font-semibold hover:bg-orange-500/20 transition-all"
            >
              Cerrar mes y archivar →
            </button>
          )}
        </motion.div>
      )}

      {/* History list */}
      {history.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-10 text-center flex flex-col items-center">
          <CalendarDays size={40} className="mb-3 opacity-20 text-[var(--text-primary)]" />
          <p className="text-sm text-[var(--text-secondary)]">No hay historial aún</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Cierra el mes actual para guardar un registro</p>
        </div>
      ) : (
        <>
          {/* Search & Sort toolbar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Buscar mes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <button
              onClick={() => setSortBy(s => s === 'recent' ? 'spent' : s === 'spent' ? 'items' : 'recent')}
              className="px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center gap-1.5"
              title={`Ordenar: ${sortBy === 'recent' ? 'Reciente' : sortBy === 'spent' ? 'Gasto' : 'Items'}`}
            >
              <ArrowUpDown size={14} />
              <span className="text-[11px] font-semibold hidden min-[380px]:inline">
                {sortBy === 'recent' ? 'Reciente' : sortBy === 'spent' ? 'Gasto' : 'Items'}
              </span>
            </button>
          </div>

          {/* Global summary */}
          {history.length >= 2 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Meses</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{history.length}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold text-[var(--accent)]">
                  R$ {history.reduce((s, h) => s + h.totalSpent, 0).toFixed(0)}
                </p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Promedio</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  R$ {(history.reduce((s, h) => s + h.totalSpent, 0) / history.length).toFixed(0)}
                </p>
              </div>
            </div>
          )}

          {/* Month cards */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Meses anteriores ({filteredHistory.length})
            </p>
            <AnimatePresence>
              {filteredHistory.map((record, idx) => {
                const savingsRate = record.totalBudget > 0
                  ? ((record.totalBudget - record.totalSpent) / record.totalBudget * 100) : null;
                const isEditing = editingId === record.id;

                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)]/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[var(--accent-soft)] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <CalendarDays size={20} className="text-[var(--accent)]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                              className="flex-1 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--accent)] rounded-lg px-2 py-1 focus:outline-none min-w-0"
                            />
                            <button onClick={saveEdit} className="p-1 text-green-400 hover:bg-green-400/10 rounded-lg min-h-0">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg min-h-0">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-[var(--text-primary)] capitalize truncate">{record.month}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditing(record.id, record.month); }}
                              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity min-h-0"
                              title="Editar nombre"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {record.items.length} items · R$ {record.totalSpent.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          {savingsRate !== null && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${savingsRate >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {savingsRate >= 0 ? `+${savingsRate.toFixed(0)}%` : `${savingsRate.toFixed(0)}%`}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedMonth(record.id)}
                          className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-colors min-h-0"
                        >
                          <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                        </button>
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    {record.totalBudget > 0 && (
                      <div className="mt-3 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (record.totalSpent / record.totalBudget) * 100)}%`,
                            background: record.totalSpent > record.totalBudget ? '#FF453A' : 'var(--accent)',
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredHistory.length === 0 && searchQuery && (
              <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
                No se encontraron resultados para &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Monthly Comparison Chart */}
          {history.length >= 2 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
                <BarChartIcon size={16} className="text-[var(--accent)]" /> Comparación mensual
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...history].reverse().slice(-6).map(h => ({
                    name: h.month.split(' ')[0]?.substring(0, 3) || h.month.substring(0, 3),
                    gasto: h.totalSpent,
                    presupuesto: h.totalBudget,
                  }))}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `R$${v}`} />
                    <RechartsTooltip
                      formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2)}`, name === 'gasto' ? 'Gastado' : 'Presupuesto']}
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Bar dataKey="presupuesto" fill="rgba(var(--accent-rgb), 0.2)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="gasto" radius={[6, 6, 0, 0]}>
                      {[...history].reverse().slice(-6).map((h, i) => (
                        <Cell key={i} fill={h.totalSpent > h.totalBudget && h.totalBudget > 0 ? '#FF453A' : 'var(--accent)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(var(--accent-rgb), 0.2)' }} />
                  <span className="text-[10px] text-[var(--text-secondary)]">Presupuesto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--accent)' }} />
                  <span className="text-[10px] text-[var(--text-secondary)]">Gastado</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}