// app/components/CategorySummary.tsx
"use client";

import { useShoppingStore } from '../../store/useShoppingStore';
import { CATEGORY_CONFIG } from '../../utils/constants';

export default function CategorySummary() {
  const { items, currency } = useShoppingStore();
  const c = currency || 'R$';

  const expensesByCategory = items.reduce((acc, item) => {
    const cost = item.estimatedPrice * item.quantity;
    acc[item.category] = (acc[item.category] || 0) + cost;
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  if (totalSpent === 0) return null;

  const sorted = Object.entries(expensesByCategory)
    .sort(([,a],[,b]) => b-a)
    .map(([cat, amount]) => ({
      cat, amount,
      pct: (amount / totalSpent) * 100,
      color: CATEGORY_CONFIG[cat]?.color || '#8E8E93',
    }));

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Desglose</span>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{c} {totalSpent.toFixed(2)}</span>
      </div>

      {/* Segmented bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex gap-px">
        {sorted.map(({ cat, pct, color }) => (
          <div
            key={cat}
            className="h-full transition-all duration-500 hover:brightness-110"
            style={{ width: `${pct}%`, backgroundColor: color }}
            title={`${cat}: ${c} ${expensesByCategory[cat].toFixed(2)} (${pct.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Legend - compact */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {sorted.map(({ cat, pct, color }) => (
          <div key={cat} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {cat.split(' ')[0]} <span style={{ color: 'var(--text-tertiary)' }}>{pct.toFixed(0)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}