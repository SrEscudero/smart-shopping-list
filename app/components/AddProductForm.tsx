// app/components/AddProductForm.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { getCategoryFromAI } from '../../actions/categorize'; // Importamos la IA

export default function AddProductForm() {
  const addProduct = useShoppingStore((state) => state.addProduct);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [storeName, setStoreName] = useState('');
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsCategorizing(true);
    
    // === AQUÍ LLAMAMOS A LA IA REAL ===
    const category = await getCategoryFromAI(name);

    addProduct({
      name,
      estimatedPrice: parseFloat(price),
      quantity: parseInt(quantity) || 1,
      category,
      store: storeName || 'Varias',
    });

    setName('');
    setPrice('');
    setQuantity('1');
    setStoreName('');
    setIsCategorizing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1C1C1C] p-4 rounded-2xl shadow-lg border border-gray-800 flex flex-col gap-3 w-full mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="¿Qué vas a comprar?"
          className="flex-1 bg-[#2A2A2A] px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500 text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Tienda (ej. Stok Center)"
          className="sm:w-48 bg-[#2A2A2A] px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500 text-white"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
      </div>
      
      <div className="flex gap-3">
        <input
          type="number"
          min="1"
          placeholder="Cant."
          className="w-20 bg-[#2A2A2A] px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500 text-white text-center"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <div className="relative flex-1 sm:w-32 sm:flex-none">
          <span className="absolute left-4 top-3 text-gray-500 text-sm font-medium">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full bg-[#2A2A2A] pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500 text-white"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isCategorizing}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 sm:w-auto w-full flex justify-center items-center"
        >
          {isCategorizing ? "✨ Pensando..." : "Agregar"}
        </button>
      </div>
    </form>
  );
}