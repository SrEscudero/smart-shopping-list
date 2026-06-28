// app/components/StatsPanel.tsx
"use client";

import { useMemo } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { CATEGORY_CONFIG } from '../../utils/constants';
import { CircleDollarSign, ShoppingCart, CheckCircle2, TrendingUp, BarChart3, Store, ArrowUpDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'framer-motion';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: {
    initial: { opacity: 0, y: 16, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } },
  },
};

export default function StatsPanel() {
  const { items, totalBudget, currency } = useShoppingStore();
  const c = currency || 'R$';

  const stats = useMemo(() => {
    const total = items.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
    const spent = items.filter(i => i.isPurchased).reduce((a, i) => a + (i.finalPrice || i.estimatedPrice) * i.quantity, 0);
    const estimatedOfPurchased = items.filter(i => i.isPurchased).reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
    const purchased = items.filter(i => i.isPurchased).length;
    const rate = items.length > 0 ? (purchased / items.length) * 100 : 0;
    const priceDiff = spent - estimatedOfPurchased;
    const accuracyRate = estimatedOfPurchased > 0 ? ((1 - Math.abs(priceDiff) / estimatedOfPurchased) * 100) : 0;

    const byCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.estimatedPrice * item.quantity;
      return acc;
    }, {} as Record<string, number>);

    const byStore = items.reduce((acc, item) => {
      if (item.store) acc[item.store] = (acc[item.store] || 0) + item.estimatedPrice * item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return { total, spent, purchased, rate, byCategory, byStore, priceDiff, accuracyRate, estimatedOfPurchased };
  }, [items]);

  const sortedCategories = useMemo(() => Object.entries(stats.byCategory).sort(([,a],[,b]) => b-a), [stats.byCategory]);
  const sortedStores = useMemo(() => Object.entries(stats.byStore).sort(([,a],[,b]) => b-a), [stats.byStore]);
  const maxStore = sortedStores[0]?.[1] || 1;
  const cardCls = "bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 card-glow";

  return (
    <motion.div className="space-y-4" variants={stagger.container} initial="initial" animate="animate">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total estimado', value: `${c} ${stats.total.toFixed(2)}`, icon: <CircleDollarSign size={18} />, color: 'var(--accent)' },
          { label: 'Ya gastado', value: `${c} ${stats.spent.toFixed(2)}`, icon: <ShoppingCart size={18} />, color: 'var(--success)' },
          { label: 'Items comprados', value: `${stats.purchased}/${items.length}`, icon: <CheckCircle2 size={18} />, color: '#A855F7' },
          { label: 'Completado', value: `${stats.rate.toFixed(0)}%`, icon: <TrendingUp size={18} />, color: 'var(--warning)' },
        ].map(card => (
          <motion.div key={card.label} className={cardCls} variants={stagger.item}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: 'var(--text-secondary)' }}>{card.icon}</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{card.label}</span>
            </div>
            <p className="text-xl font-bold font-display" style={{ color: card.color }}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Estimated vs Real comparison */}
      {stats.purchased > 0 && stats.estimatedOfPurchased > 0 && (
        <motion.div className={`${cardCls} space-y-3`} variants={stagger.item}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <ArrowUpDown size={16} className="text-[var(--text-secondary)]" /> Estimado vs Real
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Estimado</p>
              <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{c} {stats.estimatedOfPurchased.toFixed(0)}</p>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Real</p>
              <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>{c} {stats.spent.toFixed(0)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${stats.priceDiff > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: stats.priceDiff > 0 ? '#FF453A' : '#30D158' }}>
                {stats.priceDiff > 0 ? 'Más caro' : 'Ahorro'}
              </p>
              <p className="text-sm font-bold" style={{ color: stats.priceDiff > 0 ? '#FF453A' : '#30D158' }}>
                {c} {Math.abs(stats.priceDiff).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-[var(--text-secondary)]">Precisión de estimación</span>
            <span className="text-xs font-bold" style={{ color: stats.accuracyRate > 90 ? '#30D158' : stats.accuracyRate > 70 ? '#FF9F0A' : '#FF453A' }}>
              {stats.accuracyRate.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stats.accuracyRate)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ background: stats.accuracyRate > 90 ? '#30D158' : stats.accuracyRate > 70 ? '#FF9F0A' : '#FF453A' }} />
          </div>
        </motion.div>
      )}

      {/* Completion Ring */}
      {items.length > 0 && (
        <motion.div className={`${cardCls} flex items-center gap-4`} variants={stagger.item}>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="8"/>
              <motion.circle cx="32" cy="32" r="26" fill="none"
                stroke={stats.rate > 80 ? 'var(--success)' : stats.rate > 50 ? 'var(--warning)' : 'var(--accent)'}
                strokeWidth="8" strokeLinecap="round"
                initial={{ strokeDasharray: '0 163.4' }}
                animate={{ strokeDasharray: `${stats.rate * 1.634} 163.4` }}
                transition={{ duration: 1, ease: 'easeOut' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--text-primary)]">{stats.rate.toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Progreso de compras</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{stats.purchased} de {items.length} productos comprados</p>
            {totalBudget > 0 && (
              <p className={`text-xs mt-1 ${stats.total > totalBudget ? 'text-red-400' : 'text-green-400'}`}>
                {stats.total > totalBudget ? `Excede en ${c} ${(stats.total - totalBudget).toFixed(2)}` : `Dentro del presupuesto`}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* By Category (Donut Chart) */}
      {sortedCategories.length > 0 && (
        <motion.div className={cardCls} variants={stagger.item}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-[var(--text-secondary)]" /> Distribución por categoría
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sortedCategories.map(([cat, amount]) => ({ name: cat, value: amount, color: CATEGORY_CONFIG[cat]?.color || '#8E8E93' }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} stroke="none">
                  {sortedCategories.map(([cat]) => (<Cell key={`cell-${cat}`} fill={CATEGORY_CONFIG[cat]?.color || '#8E8E93'} />))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `${c} ${Number(value).toFixed(2)}`}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {sortedCategories.map(([cat, amount]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_CONFIG[cat]?.color || '#8E8E93' }} />
                <span className="text-xs text-[var(--text-secondary)] truncate flex-1">{cat}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{c}{amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* By Store */}
      {sortedStores.length > 1 && (
        <motion.div className={`${cardCls} space-y-3`} variants={stagger.item}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Store size={16} className="text-[var(--text-secondary)]" /> Por tienda
          </h3>
          {sortedStores.map(([store, amount]) => (
            <div key={store} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}><Store size={16} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">{store}</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-2 flex-shrink-0">{c} {amount.toFixed(2)}</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(amount / maxStore) * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ background: 'var(--accent)' }} />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {items.length === 0 && (
        <motion.div className={`${cardCls} p-10 text-center flex flex-col items-center`} variants={stagger.item}>
          <BarChart3 size={40} className="mb-3 opacity-20 text-[var(--text-primary)] animate-float" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Agrega productos para ver estadísticas</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Las gráficas aparecerán automáticamente</p>
        </motion.div>
      )}
    </motion.div>
  );
}