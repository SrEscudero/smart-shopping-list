// app/components/StatsPanel.tsx
"use client";

import { useMemo } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { CATEGORY_CONFIG } from '../../utils/constants';
import { CircleDollarSign, ShoppingCart, CheckCircle2, TrendingUp, BarChart3, Store } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

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
          { label: 'Total estimado', value: `R$ ${stats.total.toFixed(2)}`, icon: <CircleDollarSign size={18} />, color: 'text-blue-400' },
          { label: 'Ya gastado', value: `R$ ${stats.spent.toFixed(2)}`, icon: <ShoppingCart size={18} />, color: 'text-green-400' },
          { label: 'Items comprados', value: `${stats.purchased}/${items.length}`, icon: <CheckCircle2 size={18} />, color: 'text-purple-400' },
          { label: 'Completado', value: `${stats.rate.toFixed(0)}%`, icon: <TrendingUp size={18} />, color: 'text-orange-400' },
        ].map(card => (
          <div key={card.label} className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[var(--text-secondary)]">{card.icon}</span>
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
                  ? `Excede en R$ ${(stats.total - totalBudget).toFixed(2)}`
                  : `Dentro del presupuesto`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* By Category (Donut Chart) */}
      {sortedCategories.length > 0 && (
        <div className={`${cardCls}`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-[var(--text-secondary)]" /> Distribución por categoría
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={sortedCategories.map(([cat, amount]) => ({ name: cat, value: amount, color: CATEGORY_CONFIG[cat]?.color || '#8E8E93' }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} stroke="none"
                >
                  {sortedCategories.map(([cat]) => (
                    <Cell key={`cell-${cat}`} fill={CATEGORY_CONFIG[cat]?.color || '#8E8E93'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {sortedCategories.map(([cat, amount]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_CONFIG[cat]?.color || '#8E8E93' }} />
                <span className="text-xs text-[var(--text-secondary)] truncate flex-1">{cat}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">R${amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Store */}
      {sortedStores.length > 1 && (
        <div className={`${cardCls} space-y-3`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Store size={16} className="text-[var(--text-secondary)]" /> Por tienda
          </h3>
          {sortedStores.map(([store, amount]) => (
            <div key={store} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--bg-input)] rounded-lg flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0">
                <Store size={16} />
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
        <div className={`${cardCls} p-10 text-center flex flex-col items-center`}>
          <BarChart3 size={40} className="mb-3 opacity-20 text-[var(--text-primary)]" />
          <p className="text-sm text-[var(--text-secondary)]">Agrega productos para ver estadísticas</p>
        </div>
      )}
    </div>
  );
}