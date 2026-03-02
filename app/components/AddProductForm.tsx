// app/components/AddProductForm.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { getCategoryFromAI } from '../../actions/categorize';

interface AddProductFormProps {
  onAdd?: () => void;
}

export default function AddProductForm({ onAdd }: AddProductFormProps) {
  const addProduct = useShoppingStore((state) => state.addProduct);
  const theme = useShoppingStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [storeName, setStoreName] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [isCategorizing, setIsCategorizing] = useState(false);

  const inputCls = `w-full ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'} px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsCategorizing(true);
    const category = await getCategoryFromAI(name);

    addProduct({
      name: name.trim(),
      estimatedPrice: parseFloat(price),
      quantity: parseInt(quantity) || 1,
      category,
      store: storeName.trim() || 'Varias',
      note: note.trim() || undefined,
      priority,
    });

    setName(''); setPrice(''); setQuantity('1'); setStoreName(''); setNote('');
    setPriority('media');
    setIsCategorizing(false);
    onAdd?.();
  };

  return (
    <form onSubmit={handleSubmit} className={`${isDark ? 'bg-[#13131A] border-white/5' : 'bg-white border-gray-200'} border p-4 rounded-2xl space-y-3`}>
      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
        <span>✏️</span> Nuevo producto
      </h3>

      {/* Row 1: Name */}
      <input
        type="text"
        placeholder="Nombre del producto (ej. Leche, Arroz...)"
        className={inputCls}
        value={name}
        onChange={e => setName(e.target.value)}
        required
        autoComplete="off"
      />

      {/* Row 2: Price + Qty + Store */}
      <div className="flex gap-2">
        <div className="relative w-28">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>R$</span>
          <input
            type="number" step="0.01" min="0" placeholder="0,00"
            className={`w-full ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'} pl-8 pr-2 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm`}
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
        </div>
        <input
          type="number" min="1" placeholder="Cant"
          className={`w-16 ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'} text-center py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm`}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
        />
        <input
          type="text" placeholder="Tienda (opcional)"
          className={`flex-1 ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'} px-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm`}
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
        />
      </div>

      {/* Row 3: Note + Priority */}
      <div className="flex gap-2">
        <input
          type="text" placeholder="Nota (ej. marca específica...)"
          className={`flex-1 ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400'} px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm`}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as any)}
          className={`text-xs px-3 py-2.5 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
        >
          <option value="alta">🔴 Alta</option>
          <option value="media">🟡 Media</option>
          <option value="baja">🟢 Baja</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isCategorizing || !name || !price}
        className="w-full bg-blue-500 hover:bg-blue-400 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
      >
        {isCategorizing ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Categorizando con IA...
          </>
        ) : (
          <>✨ Agregar producto</>
        )}
      </button>
    </form>
  );
}