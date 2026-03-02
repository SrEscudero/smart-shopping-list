// app/components/ProductCard.tsx
"use client";

import { useState } from 'react';
import { Product } from '../../store/useShoppingStore';

const CATEGORY_COLORS: Record<string, string> = {
  'Frutas y Verduras': '#34C759', 'Carnes y Pescados': '#FF3B30',
  'Lácteos y Huevos': '#FFCC00', 'Panadería': '#FF9500',
  'Bebidas': '#5AC8FA', 'Limpieza': '#32ADE6',
  'Cuidado Personal': '#AF52DE', 'Despensa': '#A2845E',
  'Congelados': '#00C7BE', 'Mascotas': '#FF6B9D',
  'Bebés': '#FF2D55', 'Electrónica': '#007AFF',
  'Ropa': '#BF5AF2', 'Otros': '#8E8E93',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Frutas y Verduras': '🥦', 'Carnes y Pescados': '🥩',
  'Lácteos y Huevos': '🥛', 'Panadería': '🍞',
  'Bebidas': '🧃', 'Limpieza': '🧹',
  'Cuidado Personal': '🧴', 'Despensa': '🥫',
  'Congelados': '🧊', 'Mascotas': '🐾',
  'Bebés': '👶', 'Electrónica': '📱',
  'Ropa': '👕', 'Otros': '📦',
};

const ALL_CATEGORIES = [
  'Frutas y Verduras', 'Carnes y Pescados', 'Lácteos y Huevos',
  'Panadería', 'Bebidas', 'Limpieza', 'Cuidado Personal',
  'Despensa', 'Congelados', 'Mascotas', 'Bebés',
  'Electrónica', 'Ropa', 'Otros',
];

interface ProductCardProps {
  item: Product;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (data: Partial<Product>) => void;
  isDark: boolean;
}

export default function ProductCard({ item, onToggle, onRemove, onUpdate, isDark }: ProductCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  // Estado del modal de edición — copia local hasta guardar
  const [editName, setEditName] = useState(item.name);
  const [editPrice, setEditPrice] = useState(item.estimatedPrice.toString());
  const [editQty, setEditQty] = useState(item.quantity.toString());
  const [editStore, setEditStore] = useState(item.store || '');
  const [editCategory, setEditCategory] = useState(item.category);
  const [editNote, setEditNote] = useState(item.note || '');
  const [editPriority, setEditPriority] = useState(item.priority || 'media');

  const color = CATEGORY_COLORS[item.category] || '#8E8E93';
  const icon = CATEGORY_ICONS[item.category] || '📦';
  const total = item.estimatedPrice * item.quantity;

  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-500' : 'text-gray-400';
  const inputCls = `w-full text-sm px-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
    isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'
  }`;
  const labelCls = `text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`;

  const openEdit = () => {
    // Sincronizar estado con valores actuales antes de abrir
    setEditName(item.name);
    setEditPrice(item.estimatedPrice.toString());
    setEditQty(item.quantity.toString());
    setEditStore(item.store || '');
    setEditCategory(item.category);
    setEditNote(item.note || '');
    setEditPriority(item.priority || 'media');
    setShowEditModal(true);
  };

  const handleSave = () => {
    onUpdate({
      name: editName.trim() || item.name,
      estimatedPrice: parseFloat(editPrice) || item.estimatedPrice,
      quantity: parseInt(editQty) || 1,
      store: editStore.trim() || 'Varias',
      category: editCategory,
      note: editNote.trim() || undefined,
      priority: editPriority as 'alta' | 'media' | 'baja',
    });
    setShowEditModal(false);
  };

  const priorityConfig = {
    alta:  { label: '🔴 Alta',  bg: isDark ? 'bg-red-500/10'    : 'bg-red-50',    text: 'text-red-400'    },
    media: { label: '🟡 Media', bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50', text: 'text-yellow-500' },
    baja:  { label: '🟢 Baja',  bg: isDark ? 'bg-green-500/10'  : 'bg-green-50',  text: 'text-green-400'  },
  };
  const pri = priorityConfig[item.priority || 'media'];

  return (
    <>
      {/* ── CARD ── */}
      <div className={`relative px-4 py-3.5 flex items-center gap-3 transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}>

        {/* Color accent bar */}
        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: color }} />

        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
            item.isPurchased ? 'border-blue-500 bg-blue-500' : isDark ? 'border-gray-600' : 'border-gray-300'
          }`}
        >
          {item.isPurchased && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className={`font-semibold text-sm leading-snug ${item.isPurchased ? 'line-through opacity-40' : text}`}>
            {item.name}
          </span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-medium" style={{ color }}>{icon} {item.category}</span>
            {item.store && item.store !== 'Varias' && (
              <span className={`text-xs ${subtext}`}>· {item.store}</span>
            )}
            {item.note && (
              <span className={`text-xs ${subtext} italic`}>· {item.note}</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className={`text-sm font-bold ${item.isPurchased ? 'opacity-40' : text}`}>
            R$ {total.toFixed(2)}
          </span>
          <span className={`text-xs ${subtext}`}>×{item.quantity} · R${item.estimatedPrice.toFixed(2)}</span>
        </div>

        {/* Edit button */}
        <button
          onClick={openEdit}
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
          }`}
          title="Editar producto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      {/* ── EDIT MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />

          {/* Sheet */}
          <div className={`relative z-10 w-full max-w-lg mx-auto ${isDark ? 'bg-[#0D0D14]' : 'bg-white'} rounded-t-3xl overflow-hidden`}
            style={{ maxHeight: '90vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-200'}`} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h2 className={`text-base font-bold ${text}`}>Editar producto</h2>
                <p className={`text-xs ${subtext}`}>Modifica los datos y guarda</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-2 rounded-xl ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-5 pb-8 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(90vh - 100px)' }}>

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className={labelCls}>Nombre</label>
                <input
                  type="text"
                  className={inputCls}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nombre del producto"
                  autoFocus
                />
              </div>

              {/* Precio + Cantidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelCls}>Precio unitario</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium ${subtext}`}>R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full text-sm pl-8 pr-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    className={`${inputCls} text-center`}
                    value={editQty}
                    onChange={e => setEditQty(e.target.value)}
                  />
                </div>
              </div>

              {/* Total calculado (solo visual) */}
              {editPrice && editQty && (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Total estimado</span>
                  <span className={`text-base font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    R$ {((parseFloat(editPrice) || 0) * (parseInt(editQty) || 1)).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Tienda */}
              <div className="space-y-1.5">
                <label className={labelCls}>Tienda</label>
                <input
                  type="text"
                  className={inputCls}
                  value={editStore}
                  onChange={e => setEditStore(e.target.value)}
                  placeholder="Ej: Atacadão, Stok Center..."
                />
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <label className={labelCls}>Categoría</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CATEGORIES.map(cat => {
                    const catColor = CATEGORY_COLORS[cat] || '#8E8E93';
                    const catIcon = CATEGORY_ICONS[cat] || '📦';
                    const isSelected = editCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setEditCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                          isSelected
                            ? 'border-transparent'
                            : isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'
                        }`}
                        style={isSelected ? { backgroundColor: catColor + '20', borderColor: catColor + '40' } : {}}
                      >
                        <span>{catIcon}</span>
                        <span className={`text-xs truncate ${isSelected ? '' : subtext}`}
                          style={isSelected ? { color: catColor } : {}}
                        >
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nota */}
              <div className="space-y-1.5">
                <label className={labelCls}>Nota (opcional)</label>
                <input
                  type="text"
                  className={inputCls}
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Ej: marca específica, sin lactosa..."
                />
              </div>

              {/* Prioridad */}
              <div className="space-y-1.5">
                <label className={labelCls}>Prioridad</label>
                <div className="flex gap-2">
                  {(['alta', 'media', 'baja'] as const).map(p => {
                    const cfg = priorityConfig[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setEditPriority(p)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          editPriority === p ? `${cfg.bg} ${cfg.text}` : isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { onRemove(); setShowEditModal(false); }}
                  className={`px-4 py-3 rounded-2xl text-sm font-semibold text-red-400 border ${
                    isDark ? 'border-red-500/20 bg-red-500/10 hover:bg-red-500/20' : 'border-red-200 bg-red-50 hover:bg-red-100'
                  } transition-all`}
                >
                  🗑 Eliminar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl text-sm transition-all active:scale-[0.98]"
                >
                  Guardar cambios
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}