// app/components/HistoryModal.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';

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
                    <span>{item.isPurchased ? '✅' : '⬜'}</span>
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
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">📦 Cerrar mes actual</h3>
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
        <div className={`${cardCls} p-10 text-center`}>
          <p className="text-4xl mb-3 opacity-20">📅</p>
          <p className="text-sm text-[var(--text-secondary)]">No hay historial aún</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Cierra el mes actual para guardar un registro</p>
        </div>
      ) : (
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
                <div className="w-10 h-10 bg-[var(--bg-elevated)] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span>📅</span>
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
                  <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}