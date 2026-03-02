// app/page.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../store/useShoppingStore';
import BudgetWidget from './components/BudgetWidget';
import AddProductForm from './components/AddProductForm';
import CategorySummary from './components/CategorySummary'; // IMPORTACIÓN DEL GRÁFICO

export default function Home() {
  const { month, items, toggleProduct, removeProduct, updateProduct } = useShoppingStore();
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all');

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return !item.isPurchased;
    if (filter === 'purchased') return item.isPurchased;
    return true;
  });

  const totalCount = filteredItems.length;
  const totalSum = filteredItems.reduce((acc, item) => acc + (item.estimatedPrice * item.quantity), 0);
  const uniqueStores = new Set(filteredItems.map(item => item.store).filter(Boolean)).size;
  const uniqueCategories = new Set(filteredItems.map(item => item.category).filter(Boolean)).size;

  const handleQuickEdit = (id: string, currentPrice: number, currentQty: number) => {
    const newPrice = prompt("Actualizar Precio (R$):", currentPrice.toString());
    if (newPrice && !isNaN(parseFloat(newPrice))) {
      updateProduct(id, { estimatedPrice: parseFloat(newPrice) });
    }
  };

  // === EXPORTAR A WHATSAPP ===
  const exportToWhatsApp = () => {
    const pendingItems = items.filter(item => !item.isPurchased);
    
    if (pendingItems.length === 0) {
      alert("No hay productos pendientes para enviar.");
      return;
    }

    let message = `🛒 *Lista de Compras - ${month}*\n\n`;
    
    pendingItems.forEach(item => {
      message += `▪️ ${item.name} (x${item.quantity}) - R$ ${(item.estimatedPrice * item.quantity).toFixed(2)}\n`;
      if (item.store) {
        message += `   🏪 _${item.store}_\n`;
      }
    });

    const totalPending = pendingItems.reduce((acc, item) => acc + (item.estimatedPrice * item.quantity), 0);
    message += `\n💰 *Total Estimado: R$ ${totalPending.toFixed(2)}*`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#111111] p-3 sm:p-8 font-sans text-gray-200 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 pb-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Compras</h1>
            <p className="text-gray-400 font-medium capitalize mt-1">{month}</p>
          </div>
          <BudgetWidget />
        </header>
        
        <AddProductForm />

        {/* === LA BARRA DE ALMACENAMIENTO ESTILO APPLE === */}
        <CategorySummary />

        {/* BARRA DE FILTROS Y BOTÓN DE WHATSAPP */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="bg-[#1C1C1C] p-1 rounded-xl inline-flex shadow-sm border border-gray-800 w-full sm:w-auto">
            <button 
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-[#333333] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'pending' ? 'bg-[#333333] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Por comprar
            </button>
            <button 
              onClick={() => setFilter('purchased')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'purchased' ? 'bg-[#333333] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              En carrito
            </button>
          </div>

          {/* BOTÓN WHATSAPP */}
          <button 
            onClick={exportToWhatsApp}
            className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 px-4 py-2 rounded-xl text-sm font-medium transition-all w-full sm:w-auto justify-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.347-.272.273-1.04 1.02-1.04 2.488s1.065 2.886 1.213 3.084c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            Exportar a WhatsApp
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="bg-[#1C1C1C] rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
          
          {filteredItems.length === 0 ? (
             <div className="p-10 text-center text-gray-500 flex flex-col items-center">
               <span className="text-4xl mb-3 opacity-30">🛒</span>
               <p>No hay productos en esta vista.</p>
             </div>
          ) : (
            <>
              {/* VISTA ESCRITORIO */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                      <th className="p-4 font-medium">Por comprar</th>
                      <th className="p-4 font-medium">Cantidad</th>
                      <th className="p-4 font-medium">Precio</th>
                      <th className="p-4 font-medium">Total</th>
                      <th className="p-4 font-medium">Tienda</th>
                      <th className="p-4 font-medium">Sección</th>
                      <th className="p-4 font-medium text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 text-sm">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={item.isPurchased}
                            onChange={() => toggleProduct(item.id)}
                            className="w-4 h-4 accent-blue-500 cursor-pointer rounded bg-gray-800 border-gray-700"
                          />
                          <span className={`font-medium ${item.isPurchased ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                            {item.name}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">{item.quantity}</td>
                        <td className="p-4 text-gray-400">R$ {item.estimatedPrice.toFixed(2)}</td>
                        <td className="p-4 font-semibold text-white">
                          R$ {(item.estimatedPrice * item.quantity).toFixed(2)}
                        </td>
                        <td className="p-4 text-gray-400">{item.store}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-[#2A2A2A] rounded-md text-xs text-gray-300 border border-gray-700/50">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleQuickEdit(item.id, item.estimatedPrice, item.quantity)} className="text-blue-400 hover:text-blue-300 text-sm font-medium px-2 py-1 rounded hover:bg-blue-400/10 transition-colors">
                              Editar
                            </button>
                            <button onClick={() => removeProduct(item.id)} className="text-red-400 hover:text-red-300 text-sm font-medium px-2 py-1 rounded hover:bg-red-400/10 transition-colors">
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA MÓVIL */}
              <div className="md:hidden flex flex-col divide-y divide-gray-800">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <input 
                          type="checkbox" 
                          checked={item.isPurchased}
                          onChange={() => toggleProduct(item.id)}
                          className="w-6 h-6 accent-blue-500 cursor-pointer rounded-lg bg-gray-800 border-gray-700 flex-shrink-0"
                        />
                        <span className={`font-semibold text-lg leading-tight ${item.isPurchased ? 'line-through text-gray-600' : 'text-gray-100'}`}>
                          {item.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm pl-9">
                      <div className="text-gray-400">
                        {item.quantity} × R$ {item.estimatedPrice.toFixed(2)}
                      </div>
                      <div className="font-semibold text-white">
                        Total: R$ {(item.estimatedPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pl-9 mt-1">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-[#2A2A2A] rounded text-xs text-gray-300 border border-gray-700/50">📍 {item.category}</span>
                        <span className="px-2 py-1 bg-[#2A2A2A] rounded text-xs text-gray-400 border border-gray-700/50">🏪 {item.store}</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleQuickEdit(item.id, item.estimatedPrice, item.quantity)} className="text-blue-400 text-sm font-medium">Editar</button>
                        <button onClick={() => removeProduct(item.id)} className="text-red-400 text-sm font-medium">Borrar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PIE DE PÁGINA (Se actualiza con los filtros) */}
          <div className="border-t border-gray-800 bg-[#161616] p-4 sm:px-6 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-gray-400 font-medium">
              <span className="flex items-center gap-1"><span className="text-gray-500 text-xs uppercase">Items</span> {totalCount}</span>
              <span className="w-px h-4 bg-gray-700 hidden sm:block"></span>
              <span className="flex items-center gap-1"><span className="text-gray-500 text-xs uppercase">Lojas</span> {uniqueStores}</span>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-lg border border-blue-500/20">
              <span className="text-blue-500/60 text-xs uppercase tracking-wider font-semibold">Soma</span> R$ {totalSum.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}