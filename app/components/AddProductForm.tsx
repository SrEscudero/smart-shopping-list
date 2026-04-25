// app/components/AddProductForm.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { getCategoryFromAI } from '../../actions/categorize';
import { v4 as uuidv4 } from 'uuid';
import { Pencil, Plus } from 'lucide-react';

interface AddProductFormProps {
  onAdd?: () => void;
}

export default function AddProductForm({ onAdd }: AddProductFormProps) {
  const { addProduct, updateProduct, items } = useShoppingStore();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [storeName, setStoreName] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract unique names for datalist
  const uniqueNames = Array.from(new Set(items.map(i => i.name)));

  const inputCls = "w-full bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all text-sm border border-[var(--border)]";
  const smallInputCls = "bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm border border-[var(--border)]";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const newId = uuidv4();
    const productName = name.trim();

    // Optimistic addition
    addProduct({
      id: newId,
      name: productName,
      estimatedPrice: parseFloat(price),
      quantity: parseInt(quantity) || 1,
      category: 'Otros', // Default temporary
      store: storeName.trim() || 'Varias',
      note: note.trim() || undefined,
      priority,
    });

    // Reset form immediately
    setName('');
    setPrice('');
    setQuantity('1');
    setStoreName('');
    setNote('');
    setPriority('media');
    setShowAdvanced(false);
    onAdd?.();

    // AI Categorization in background
    getCategoryFromAI(productName).then(category => {
      if (category && category !== 'Otros') {
        updateProduct(newId, { category });
      }
    }).catch(() => {
      // Ignore errors, remains 'Otros'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 font-display">
          <Pencil size={15} className="text-[var(--accent)]" /> Nuevo producto
        </h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs px-2 py-1 rounded-lg font-medium transition-colors"
          style={{ color: 'var(--accent)', background: 'var(--accent-soft)', minHeight: 'unset' }}
        >
          {showAdvanced ? "Menos" : "Más opciones"}
        </button>
      </div>

      {/* Name */}
      <input
        type="text"
        placeholder="Nombre del producto..."
        className={inputCls}
        value={name}
        onChange={e => setName(e.target.value)}
        required
        autoComplete="off"
        list="product-history"
      />
      <datalist id="product-history">
        {uniqueNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {/* Price + Qty */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] font-medium">R$</span>
          <input
            type="number" step="0.01" min="0" placeholder="0,00"
            inputMode="decimal"
            className={`${smallInputCls} w-full pl-8 pr-2`}
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
        </div>
        <input
          type="number" min="1" placeholder="×1"
          inputMode="numeric"
          className={`${smallInputCls} w-16 text-center px-2`}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
        />
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-2 animate-slide-up">
          <input
            type="text" placeholder="Tienda (opcional)"
            className={inputCls}
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="text" placeholder="Nota (marca, variante...)"
              className={`${smallInputCls} flex-1 px-3`}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className={`${smallInputCls} px-3 text-xs`}
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!name || !price}
        className="w-full text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
        style={{
          background: 'var(--accent)',
          boxShadow: '0 4px 16px var(--accent-glow)',
          minHeight: 'unset',
        }}
      >
        <Plus size={18} /> Agregar producto
      </button>
    </form>
  );
}