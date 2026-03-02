// app/components/StatsPanel.tsx
"use client";

import { useShoppingStore } from '../../store/useShoppingStore';

const CATEGORY_COLORS: Record<string, string> = {
  'Frutas y Verduras': '#34C759', 'Carnes y Pescados': '#FF3B30',
  'Lácteos y Huevos': '#FFCC00', 'Panadería': '#FF9500',
  'Bebidas': '#5AC8FA', 'Limpieza': '#32ADE6',
  'Cuidado Personal': '#AF52DE', 'Despensa': '#A2845E',
  'Congelados': '#00C7BE', 'Mascotas': '#FF6B9D',
  'Bebés': '#FF2D55', 'Electrónica': '#007AFF',
  'Ropa': '#BF5AF2', 'Otros': '#8E8E93',
};

export default function StatsPanel() {
  const { items, totalBudget, theme } = useShoppingStore();
  const isDark = theme === 'dark';

  const stats = (() => {
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
  })();

  const cardBg = isDark ? 'bg-[#13131A] border-white/5' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-500' : 'text-gray-400';
  const barBg = isDark ? 'bg-white/5' : 'bg-gray-100';

  const sortedCategories = Object.entries(stats.byCategory).sort(([,a],[,b]) => b-a);
  const sortedStores = Object.entries(stats.byStore).sort(([,a],[,b]) => b-a);
  const maxCat = sortedCategories[0]?.[1] || 1;
  const maxStore = sortedStores[0]?.[1] || 1;

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
          <div key={card.label} className={`${cardBg} border rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{card.icon}</span>
              <span className={`text-xs ${subtext}`}>{card.label}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Completion Ring */}
      {items.length > 0 && (
        <div className={`${cardBg} border rounded-2xl p-4 flex items-center gap-4`}>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke={isDark ? '#ffffff10' : '#f3f4f6'} strokeWidth="8"/>
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke={stats.rate > 80 ? '#34C759' : stats.rate > 50 ? '#FF9500' : '#007AFF'}
                strokeWidth="8"
                strokeDasharray={`${stats.rate * 1.634} 163.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${text}`}>{stats.rate.toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${text}`}>Progreso de compras</p>
            <p className={`text-xs ${subtext} mt-1`}>
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
        <div className={`${cardBg} border rounded-2xl p-4 space-y-3`}>
          <h3 className={`text-sm font-semibold ${text}`}>📊 Por categoría</h3>
          {sortedCategories.map(([cat, amount]) => (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium`} style={{ color: CATEGORY_COLORS[cat] || '#8E8E93' }}>{cat}</span>
                <span className={`text-xs font-semibold ${text}`}>R$ {amount.toFixed(2)}</span>
              </div>
              <div className={`w-full h-1.5 ${barBg} rounded-full overflow-hidden`}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(amount / maxCat) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] || '#8E8E93' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By Store */}
      {sortedStores.length > 1 && (
        <div className={`${cardBg} border rounded-2xl p-4 space-y-3`}>
          <h3 className={`text-sm font-semibold ${text}`}>🏪 Por tienda</h3>
          {sortedStores.map(([store, amount]) => (
            <div key={store} className="flex items-center gap-3">
              <div className={`w-8 h-8 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
                🏪
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${text} truncate`}>{store}</span>
                  <span className={`text-xs ${subtext} ml-2 flex-shrink-0`}>R$ {amount.toFixed(2)}</span>
                </div>
                <div className={`w-full h-1 ${barBg} rounded-full overflow-hidden`}>
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
        <div className={`${cardBg} border rounded-2xl p-10 text-center`}>
          <p className="text-4xl mb-3 opacity-20">📊</p>
          <p className={`text-sm ${subtext}`}>Agrega productos para ver estadísticas</p>
        </div>
      )}
    </div>
  );
}