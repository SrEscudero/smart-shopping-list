// app/components/ProductCard.tsx
"use client";

import { useState } from 'react';
import { Product } from '../../store/useShoppingStore';

const CATEGORY_COLORS: Record<string, string> = {
  'Frutas y Verduras': '#34C759',
  'Carnes y Pescados': '#FF3B30',
  'Lácteos y Huevos': '#FFCC00',
  'Panadería': '#FF9500',
  'Bebidas': '#5AC8FA',
  'Limpieza': '#32ADE6',
  'Cuidado Personal': '#AF52DE',
  'Despensa': '#A2845E',
  'Congelados': '#00C7BE',
  'Mascotas': '#FF6B9D',
  'Bebés': '#FF2D55',
  'Electrónica': '#007AFF',
  'Ropa': '#BF5AF2',
  'Otros': '#8E8E93',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Frutas y Verduras': '🥦',
  'Carnes y Pescados': '🥩',
  'Lácteos y Huevos': '🥛',
  'Panadería': '🍞',
  'Bebidas': '🧃',
  'Limpieza': '🧹',
  'Cuidado Personal': '🧴',
  'Despensa': '🥫',
  'Congelados': '🧊',
  'Mascotas': '🐾',
  'Bebés': '👶',
  'Electrónica': '📱',
  'Ropa': '👕',
  'Otros': '📦',
};

interface ProductCardProps {
  item: Product;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (data: Partial<Product>) => void;
  isDark: boolean;
}

export default function ProductCard({ item, onToggle, onRemove, onUpdate, isDark }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [tempPrice, setTempPrice] = useState(item.estimatedPrice.toString());
  const [tempQty, setTempQty] = useState(item.quantity.toString());

  const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Otros'];
  const icon = CATEGORY_ICONS[item.category] || '📦';
  const total = item.estimatedPrice * item.quantity;

  const bg = isDark ? 'bg-[#13131A]' : 'bg-white';
  const subtext = isDark ? 'text-gray-500' : 'text-gray-400';
  const hoverBg = isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50';

  return (
    <div className={`${bg} ${hoverBg} transition-colors`}>
      {/* Main Row */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        
        {/* Checkbox - big touch target */}
        <button
          onClick={onToggle}
          className={`w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
            item.isPurchased
              ? 'border-blue-500 bg-blue-500'
              : isDark ? 'border-gray-600' : 'border-gray-300'
          }`}
        >
          {item.isPurchased && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Category dot + Content */}
        <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <span className={`font-semibold text-sm leading-snug ${item.isPurchased ? 'line-through opacity-40' : isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-medium" style={{ color }}>
                  {icon} {item.category}
                </span>
                {item.store && item.store !== 'Varias' && (
                  <span className={`text-xs ${subtext}`}>· {item.store}</span>
                )}
                {item.note && (
                  <span className={`text-xs ${subtext} italic`}>· {item.note}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price & Qty (quick inline edit) */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Total */}
          <span className={`text-sm font-bold ${item.isPurchased ? 'opacity-40' : isDark ? 'text-white' : 'text-gray-900'}`}>
            R$ {total.toFixed(2)}
          </span>
          {/* Unit × qty */}
          <div className={`flex items-center gap-1 text-xs ${subtext}`}>
            {editingQty ? (
              <input
                autoFocus
                type="number"
                min="1"
                className="w-12 bg-blue-500/20 text-blue-400 text-center rounded px-1 py-0 text-xs focus:outline-none"
                value={tempQty}
                onChange={e => setTempQty(e.target.value)}
                onBlur={() => { onUpdate({ quantity: parseInt(tempQty) || 1 }); setEditingQty(false); }}
                onKeyDown={e => e.key === 'Enter' && (onUpdate({ quantity: parseInt(tempQty) || 1 }), setEditingQty(false))}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <button onClick={() => { setTempQty(item.quantity.toString()); setEditingQty(true); }} className={`hover:text-blue-400 transition-colors px-1`}>
                ×{item.quantity}
              </button>
            )}
            <span>·</span>
            {editingPrice ? (
              <input
                autoFocus
                type="number"
                step="0.01"
                className="w-16 bg-blue-500/20 text-blue-400 text-center rounded px-1 py-0 text-xs focus:outline-none"
                value={tempPrice}
                onChange={e => setTempPrice(e.target.value)}
                onBlur={() => { onUpdate({ estimatedPrice: parseFloat(tempPrice) || 0 }); setEditingPrice(false); }}
                onKeyDown={e => e.key === 'Enter' && (onUpdate({ estimatedPrice: parseFloat(tempPrice) || 0 }), setEditingPrice(false))}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <button onClick={() => { setTempPrice(item.estimatedPrice.toString()); setEditingPrice(true); }} className="hover:text-blue-400 transition-colors px-1">
                R${item.estimatedPrice.toFixed(2)}
              </button>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setIsExpanded(!isExpanded)} className={`${subtext} p-1 flex-shrink-0`}>
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Actions */}
      {isExpanded && (
        <div className={`px-4 pb-3 pt-0 flex items-center gap-2 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-medium py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Eliminar
          </button>

          {/* Note input */}
          <input
            type="text"
            placeholder="Agregar nota..."
            className={`flex-1 text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-white/5 text-gray-300 placeholder:text-gray-600' : 'bg-gray-100 text-gray-700 placeholder:text-gray-400'} focus:outline-none focus:ring-1 focus:ring-blue-500/50`}
            value={item.note || ''}
            onChange={e => onUpdate({ note: e.target.value })}
          />

          {/* Priority */}
          <select
            value={item.priority || 'media'}
            onChange={e => onUpdate({ priority: e.target.value as any })}
            className={`text-xs px-2 py-2 rounded-lg border-0 focus:outline-none ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
          >
            <option value="alta">🔴 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">🟢 Baja</option>
          </select>
        </div>
      )}

      {/* Color accent bar at left */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}