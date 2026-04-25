// app/components/HistoryModal.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { CalendarDays, Package, CheckSquare, Square, ChevronRight, BarChart3 as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';

export default function HistoryModal() {
  const { history, deleteHistory, closeMonth, items } = useShoppingStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const cardCls = "bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4";

  const selectedRecord = history.find(h => h.id === selectedMonth);

  if (selectedRecord) {
    const purchasedItems = selectedRecord.items.filter(i => i.isPurchased);
    const topCategories = Object.entries(
      selectedRecord.items.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + i.estimatedPrice * i.quantity;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([,a],[,b]) => b-a).slice(0, 3);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedMonth(null)}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          ← Volver al historial
        </button>

        <div className={`${cardCls} space-y-4`}>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] capitalize">{selectedRecord.month}</h3>
            <p className="text-xs text-[var(--text-secondary)]">{new Date(selectedRecord.closedAt).toLocaleDateString('es-BR', { dateStyle: 'long' })}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--text-secondary)]">Presupuesto</p>
              <p className="text-base font-bold text-[var(--text-primary)]">R$ {selectedRecord.totalBudget.toFixed(0)}</p>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3">
              <p className="text-xs text-[var(--text-secondary)]">Gastado</p>
              <p className="text-base font-bold text-blue-400">R$ {selectedRecord.totalSpent.toFixed(0)}</p>
            </div>
            <div className={`${selectedRecord.totalSpent > selectedRecord.totalBudget && selectedRecord.totalBudget > 0 ? 'bg-red-500/10' : 'bg-green-500/10'} rounded-xl p-3`}>
              <p className="text-xs text-[var(--text-secondary)]">Items</p>
              <p className={`text-base font-bold ${selectedRecord.totalSpent > selectedRecord.totalBudget && selectedRecord.totalBudget > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {selectedRecord.items.length}
              </p>
            </div>
          </div>

          {topCategories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Top categorías</p>
              <div className="space-y-1">
                {topCategories.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-primary)]">{cat}</span>
                    <span className="text-sm text-[var(--text-secondary)]">R$ {amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Todos los productos ({selectedRecord.items.length})</p>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
              {selectedRecord.items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1.5 px-3 bg-[var(--bg-elevated)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--accent)]">{item.isPurchased ? <CheckSquare size={16} /> : <Square size={16} />}</span>
                    <span className="text-sm text-[var(--text-primary)]">{item.name}</span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">R$ {(item.estimatedPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => { deleteHistory(selectedRecord.id); setSelectedMonth(null); }}
          className="w-full py-3 rounded-2xl text-sm font-medium text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
        >
          Eliminar este registro
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Close current month */}
      {items.length > 0 && (
        <div className={`${cardCls} space-y-3`}>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Package size={16} className="text-[var(--text-secondary)]" /> Cerrar mes actual
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
                className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl text-sm font-semibold hover:brightness-110 transition-colors"
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
        </div>
      )}

      {/* History list */}
      {history.length === 0 ? (
        <div className={`${cardCls} p-10 text-center flex flex-col items-center`}>
          <CalendarDays size={40} className="mb-3 opacity-20 text-[var(--text-primary)]" />
          <p className="text-sm text-[var(--text-secondary)]">No hay historial aún</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Cierra el mes actual para guardar un registro</p>
        </div>
      ) : (
        <>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Meses anteriores</p>
          {history.map(record => {
            const savingsRate = record.totalBudget > 0
              ? ((record.totalBudget - record.totalSpent) / record.totalBudget * 100)
              : null;
            return (
              <button
                key={record.id}
                onClick={() => setSelectedMonth(record.id)}
                className={`w-full ${cardCls} flex items-center gap-4 hover:border-[var(--accent)] transition-all text-left group`}
              >
                <div className="w-10 h-10 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform text-[var(--text-secondary)]">
                  <CalendarDays size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{record.month}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{record.items.length} items · R$ {record.totalSpent.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end">
                  {savingsRate !== null && (
                    <span className={`text-xs font-semibold ${savingsRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {savingsRate >= 0 ? `+${savingsRate.toFixed(0)}%` : `${savingsRate.toFixed(0)}%`}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Monthly Comparison Chart */}
        {history.length >= 2 && (
          <div className={`${cardCls}`}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-3">
              <BarChartIcon size={16} className="text-[var(--text-secondary)]" /> Comparación mensual
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...history].reverse().slice(-6).map(h => ({
                  name: h.month.split(' ')[0]?.substring(0, 3) || h.month.substring(0, 3),
                  gasto: h.totalSpent,
                  presupuesto: h.totalBudget,
                }))}
                >
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