// app/components/StatsPanel.tsx
"use client";

import { useMemo } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { CATEGORY_CONFIG } from '../../utils/constants';

export default function StatsPanel() {
  const { items, totalBudget } = useShoppingStore();

  const stats = useMemo(() => {
    const total = items.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
    const spent = items.filter(i => i.isPurchased).reduce((a, i) => a + (i.finalPrice || i.estimatedPrice) * i.quantity, 0);
    const purchased = items.filter(i => i.isPurchased).length;
    const rate = items.length > 0 ? (purchased / items.length) * 100 : 0;

    const byCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.estimatedPrice * item.quantity;
      return acc;
    }, {} as Record<string, number>);

    const byStore = items.reduce((acc, item) => {
      if (item.store) acc[item.store] = (acc[item.store] || 0) + item.estimatedPrice * item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return { total, spent, purchased, rate, byCategory, byStore };
  }, [items]);

  const sortedCategories = useMemo(() => Object.entries(stats.byCategory).sort(([,a],[,b]) => b-a), [stats.byCategory]);
  const sortedStores = useMemo(() => Object.entries(stats.byStore).sort(([,a],[,b]) => b-a), [stats.byStore]);
  const maxCat = sortedCategories[0]?.[1] || 1;
  const maxStore = sortedStores[0]?.[1] || 1;

  const cardCls = "bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4";

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total estimado', value: `R$ ${stats.total.toFixed(2)}`, icon: '💰', color: 'text-blue-400' },
          { label: 'Ya gastado', value: `R$ ${stats.spent.toFixed(2)}`, icon: '🛒', color: 'text-green-400' },
          { label: 'Items comprados', value: `${stats.purchased}/${items.length}`, icon: '✅', color: 'text-purple-400' },
          { label: 'Completado', value: `${stats.rate.toFixed(0)}%`, icon: '📈', color: 'text-orange-400' },
        ].map(card => (
          <div key={card.label} className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{card.icon}</span>
              <span className="text-xs text-[var(--text-secondary)]">{card.label}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Completion Ring */}
      {items.length > 0 && (
        <div className={`${cardCls} flex items-center gap-4`}>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="8"/>
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke={stats.rate > 80 ? '#34C759' : stats.rate > 50 ? '#FF9500' : '#007AFF'}
                strokeWidth="8"
                strokeDasharray={`${stats.rate * 1.634} 163.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--text-primary)]">{stats.rate.toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Progreso de compras</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {stats.purchased} de {items.length} productos comprados
            </p>
            {totalBudget > 0 && (
              <p className={`text-xs mt-1 ${stats.total > totalBudget ? 'text-red-400' : 'text-green-400'}`}>
                {stats.total > totalBudget
                  ? `⚠️ Excede en R$ ${(stats.total - totalBudget).toFixed(2)}`
                  : `✓ Dentro del presupuesto`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* By Category */}
      {sortedCategories.length > 0 && (
        <div className={`${cardCls} space-y-3`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">📊 Por categoría</h3>
          {sortedCategories.map(([cat, amount]) => (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: CATEGORY_CONFIG[cat]?.color || '#8E8E93' }}>{cat}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">R$ {amount.toFixed(2)}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(amount / maxCat) * 100}%`, backgroundColor: CATEGORY_CONFIG[cat]?.color || '#8E8E93' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By Store */}
      {sortedStores.length > 1 && (
        <div className={`${cardCls} space-y-3`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">🏪 Por tienda</h3>
          {sortedStores.map(([store, amount]) => (
            <div key={store} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--bg-input)] rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                🏪
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">{store}</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-2 flex-shrink-0">R$ {amount.toFixed(2)}</span>
                </div>
                <div className="w-full h-1 bg-[var(--bg-input)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${(amount / maxStore) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className={`${cardCls} p-10 text-center`}>
          <p className="text-4xl mb-3 opacity-20">📊</p>
          <p className="text-sm text-[var(--text-secondary)]">Agrega productos para ver estadísticas</p>
        </div>
      )}
    </div>
  );
}