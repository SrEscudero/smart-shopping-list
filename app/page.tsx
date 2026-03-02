// app/page.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore } from '../store/useShoppingStore';
import BudgetWidget from './components/BudgetWidget';
import AddProductForm from './components/AddProductForm';
import CategorySummary from './components/CategorySummary';
import StatsPanel from '../app/components/StatsPanel';
import HistoryModal from '../app/components/HistoryModal';
import BottomNav from '../app/components/BottomNav';
import ProductCard from '../app/components/ProductCard';
import CameraScanner from '../app/components/CameraScanner';

export default function Home() {
  const { month, items, toggleProduct, removeProduct, updateProduct, clearPurchased, theme } = useShoppingStore();

  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'history'>('list');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'name' | 'category'>('default');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = theme === 'dark';

  let filteredItems = items.filter(item => {
    const matchFilter =
      filter === 'pending' ? !item.isPurchased :
      filter === 'purchased' ? item.isPurchased : true;
    const matchSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (sortBy === 'price') filteredItems = [...filteredItems].sort((a, b) => (b.estimatedPrice * b.quantity) - (a.estimatedPrice * a.quantity));
  if (sortBy === 'name') filteredItems = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'category') filteredItems = [...filteredItems].sort((a, b) => a.category.localeCompare(b.category));

  const totalSum = filteredItems.reduce((acc, item) => acc + (item.estimatedPrice * item.quantity), 0);
  const pendingCount = items.filter(i => !i.isPurchased).length;

  const exportToWhatsApp = () => {
    const pendingItems = items.filter(item => !item.isPurchased);
    if (pendingItems.length === 0) { alert("No hay productos pendientes."); return; }
    const grouped = pendingItems.reduce((acc, item) => {
      if (!acc[item.store]) acc[item.store] = [];
      acc[item.store].push(item);
      return acc;
    }, {} as Record<string, typeof pendingItems>);
    let message = `🛒 *Lista de Compras — ${month}*\n\n`;
    for (const [store, storeItems] of Object.entries(grouped)) {
      message += `🏪 *${store}*\n`;
      storeItems.forEach(item => {
        message += `  • ${item.name} ×${item.quantity} — R$ ${(item.estimatedPrice * item.quantity).toFixed(2)}\n`;
      });
      message += '\n';
    }
    message += `💰 *Total: R$ ${pendingItems.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0).toFixed(2)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const bg = isDark ? 'bg-[#0A0A0F]' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-[#13131A]' : 'bg-white';
  const border = isDark ? 'border-white/5' : 'border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bg} ${text} font-sans transition-colors duration-300`}>

      {showCamera && <CameraScanner onClose={() => setShowCamera(false)} />}

      {/* HEADER */}
      <header className={`sticky top-0 z-40 ${isDark ? 'bg-[#0A0A0F]/90' : 'bg-gray-50/90'} backdrop-blur-xl border-b ${border}`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">🛒</span>
            <div className="min-w-0">
              <h1 className={`text-lg font-bold leading-none ${text}`}>Compras</h1>
              <p className={`text-xs ${subtext} capitalize truncate`}>{month}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pendingCount > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
            <BudgetWidget compact />
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className={`sticky top-[57px] z-30 ${isDark ? 'bg-[#0A0A0F]/90' : 'bg-gray-50/90'} backdrop-blur-xl`}>
        <div className="max-w-2xl mx-auto px-4">
          <div className={`flex gap-1 py-2 border-b ${border}`}>
            {[
              { id: 'list', label: 'Lista', icon: '📋' },
              { id: 'stats', label: 'Stats', icon: '📊' },
              { id: 'history', label: 'Historial', icon: '📅' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : `${subtext} ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`
                }`}
              >
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-32 pt-4 space-y-4">

        {activeTab === 'list' && (
          <>
            <BudgetWidget full />
            <CategorySummary />

            {/* SEARCH + CONTROLS */}
            <div className={`${cardBg} rounded-2xl border ${border} p-3 space-y-3`}>
              <div className={`flex items-center gap-2 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-xl px-3 py-2.5`}>
                <svg className={`w-4 h-4 ${subtext} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Buscar productos, tiendas, categorías..."
                  className={`flex-1 bg-transparent text-sm ${text} placeholder:text-gray-500 focus:outline-none`}
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button onClick={() => setSearchQuery('')} className={`${subtext} text-lg leading-none`}>×</button>}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['all', 'pending', 'purchased'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-blue-500 text-white' : `${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}`}
                  >
                    {f === 'all' ? `Todos (${items.length})` : f === 'pending' ? `Pendientes (${items.filter(i => !i.isPurchased).length})` : `Comprados (${items.filter(i => i.isPurchased).length})`}
                  </button>
                ))}
                <div className={`flex-shrink-0 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border-0 focus:outline-none font-medium ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                >
                  <option value="default">Orden normal</option>
                  <option value="price">Mayor precio</option>
                  <option value="name">A → Z</option>
                  <option value="category">Categoría</option>
                </select>
              </div>
            </div>

            {/* ADD BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`flex-1 font-semibold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm ${
                  showAddForm
                    ? `${isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-gray-100 text-gray-600 border border-gray-200'}`
                    : 'bg-blue-500 hover:bg-blue-400 active:scale-[0.98] text-white shadow-lg shadow-blue-500/20'
                }`}
              >
                <span className="text-base">{showAddForm ? '−' : '+'}</span>
                {showAddForm ? 'Cerrar' : 'Agregar producto'}
              </button>

              <button
                onClick={() => setShowCamera(true)}
                className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 transition-all font-semibold text-sm border ${isDark ? 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                title="Escanear lista con cámara"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Escanear</span>
              </button>
            </div>

            {showAddForm && <AddProductForm onAdd={() => setShowAddForm(false)} />}

            {/* PRODUCT LIST */}
            <div className={`${cardBg} rounded-2xl border ${border} overflow-hidden`}>
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <span className="text-5xl opacity-20">🛒</span>
                  <p className={`${subtext} text-sm`}>
                    {searchQuery ? 'No se encontraron productos' : 'No hay productos en esta vista'}
                  </p>
                  {!searchQuery && items.length === 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      <button onClick={() => setShowAddForm(true)} className="text-sm text-blue-400 font-medium">+ Agregar primer producto</button>
                      <button onClick={() => setShowCamera(true)} className="text-sm text-blue-400 font-medium">📷 O escanea una lista con la cámara</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-white/5">
                    {filteredItems.map(item => (
                      <ProductCard key={item.id} item={item}
                        onToggle={() => toggleProduct(item.id)}
                        onRemove={() => removeProduct(item.id)}
                        onUpdate={(data) => updateProduct(item.id, data)}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                  <div className={`${isDark ? 'bg-[#0D0D14]' : 'bg-gray-50'} border-t ${border} p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${subtext}`}>{filteredItems.length} items</span>
                      {filter === 'purchased' && items.some(i => i.isPurchased) && (
                        <button onClick={clearPurchased} className="text-xs text-red-400 hover:text-red-300 font-medium">Limpiar comprados</button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${subtext}`}>Total:</span>
                      <span className="text-sm font-bold text-blue-400">R$ {totalSum.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {items.filter(i => !i.isPurchased).length > 0 && (
              <button onClick={exportToWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 py-3.5 px-5 rounded-2xl text-sm font-semibold transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.347-.272.273-1.04 1.02-1.04 2.488s1.065 2.886 1.213 3.084c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Compartir lista pendiente en WhatsApp
              </button>
            )}
          </>
        )}

        {activeTab === 'stats' && <StatsPanel />}
        {activeTab === 'history' && <HistoryModal />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} pendingCount={pendingCount} />
    </div>
  );
}