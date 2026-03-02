// app/components/HistoryModal.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';

export default function HistoryModal() {
  const { history, deleteHistory, closeMonth, items, theme } = useShoppingStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#13131A] border-white/5' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-500' : 'text-gray-400';

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
          className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
        >
          ← Volver al historial
        </button>

        <div className={`${cardBg} border rounded-2xl p-4 space-y-4`}>
          <div>
            <h3 className={`text-lg font-bold ${text} capitalize`}>{selectedRecord.month}</h3>
            <p className={`text-xs ${subtext}`}>{new Date(selectedRecord.closedAt).toLocaleDateString('es-BR', { dateStyle: 'long' })}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3`}>
              <p className={`text-xs ${subtext}`}>Presupuesto</p>
              <p className={`text-base font-bold ${text}`}>R$ {selectedRecord.totalBudget.toFixed(0)}</p>
            </div>
            <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3`}>
              <p className={`text-xs ${subtext}`}>Gastado</p>
              <p className="text-base font-bold text-blue-400">R$ {selectedRecord.totalSpent.toFixed(0)}</p>
            </div>
            <div className={`${selectedRecord.totalSpent > selectedRecord.totalBudget && selectedRecord.totalBudget > 0 ? 'bg-red-500/10' : isDark ? 'bg-green-500/10' : 'bg-green-50'} rounded-xl p-3`}>
              <p className={`text-xs ${subtext}`}>Items</p>
              <p className={`text-base font-bold ${selectedRecord.totalSpent > selectedRecord.totalBudget && selectedRecord.totalBudget > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {selectedRecord.items.length}
              </p>
            </div>
          </div>

          {topCategories.length > 0 && (
            <div>
              <p className={`text-xs font-semibold ${subtext} uppercase tracking-wider mb-2`}>Top categorías</p>
              <div className="space-y-1">
                {topCategories.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className={`text-sm ${text}`}>{cat}</span>
                    <span className={`text-sm ${subtext}`}>R$ {amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className={`text-xs font-semibold ${subtext} uppercase tracking-wider mb-2`}>Todos los productos ({selectedRecord.items.length})</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {selectedRecord.items.map(item => (
                <div key={item.id} className={`flex items-center justify-between py-1.5 px-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
                  <div className="flex items-center gap-2">
                    <span>{item.isPurchased ? '✅' : '⬜'}</span>
                    <span className={`text-sm ${text}`}>{item.name}</span>
                  </div>
                  <span className={`text-xs ${subtext}`}>R$ {(item.estimatedPrice * item.quantity).toFixed(2)}</span>
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
        <div className={`${cardBg} border rounded-2xl p-4 space-y-3`}>
          <div>
            <h3 className={`text-sm font-semibold ${text}`}>📦 Cerrar mes actual</h3>
            <p className={`text-xs ${subtext} mt-1`}>
              Guarda {items.length} productos en el historial y empieza un mes nuevo.
            </p>
          </div>
          {showCloseConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => { closeMonth(); setShowCloseConfirm(false); }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold"
              >
                Sí, cerrar mes
              </button>
              <button
                onClick={() => setShowCloseConfirm(false)}
                className={`flex-1 py-2.5 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'} rounded-xl text-sm font-semibold`}
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
        <div className={`${cardBg} border rounded-2xl p-10 text-center`}>
          <p className="text-4xl mb-3 opacity-20">📅</p>
          <p className={`text-sm ${subtext}`}>No hay historial aún</p>
          <p className={`text-xs ${subtext} mt-1`}>Cierra el mes actual para guardar un registro</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className={`text-xs font-semibold ${subtext} uppercase tracking-wider`}>Meses anteriores</p>
          {history.map(record => {
            const savingsRate = record.totalBudget > 0
              ? ((record.totalBudget - record.totalSpent) / record.totalBudget * 100)
              : null;
            return (
              <button
                key={record.id}
                onClick={() => setSelectedMonth(record.id)}
                className={`w-full ${cardBg} border rounded-2xl p-4 flex items-center gap-4 hover:border-blue-500/30 transition-all text-left`}
              >
                <div className={`w-10 h-10 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span>📅</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${text} capitalize`}>{record.month}</p>
                  <p className={`text-xs ${subtext}`}>{record.items.length} items · R$ {record.totalSpent.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end">
                  {savingsRate !== null && (
                    <span className={`text-xs font-semibold ${savingsRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {savingsRate >= 0 ? `+${savingsRate.toFixed(0)}%` : `${savingsRate.toFixed(0)}%`}
                    </span>
                  )}
                  <svg className={`w-4 h-4 ${subtext}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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