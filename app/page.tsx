// app/page.tsx
"use client";

import { useState } from 'react';
import { useShoppingStore, Product } from '../store/useShoppingStore';
import ThemeProvider from './components/ThemeProvider';
import Dashboard from './components/Dashboard';
import AddProductForm from './components/AddProductForm';
import CategorySummary from './components/CategorySummary';
import StatsPanel from './components/StatsPanel';
import HistoryModal from './components/HistoryModal';
import ProductCard from './components/ProductCard';
import CameraScanner from './components/CameraScanner';
import BudgetWidget from './components/BudgetWidget';

export default function Home() {
  const {
    month, items, toggleProduct, removeProduct, updateProduct,
    clearPurchased, theme, shoppingMode, toggleShoppingMode,
    addMultipleProducts
  } = useShoppingStore();

  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'list' | 'stats' | 'history'>('home');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'name' | 'category'>('default');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [search, setSearch] = useState('');

  const isDark = theme === 'dark';

  let filtered = items.filter(item => {
    const mf = filter === 'pending' ? !item.isPurchased : filter === 'purchased' ? item.isPurchased : true;
    const ms = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.store.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });
  if (sortBy === 'price') filtered = [...filtered].sort((a, b) => b.estimatedPrice * b.quantity - a.estimatedPrice * a.quantity);
  if (sortBy === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'category') filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category));

  const totalSum = filtered.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
  const pendingCount = items.filter(i => !i.isPurchased).length;
  const purchased = items.filter(i => i.isPurchased).length;

  const exportToWhatsApp = () => {
    const pend = items.filter(i => !i.isPurchased);
    if (!pend.length) { alert('No hay productos pendientes.'); return; }
    const grouped = pend.reduce((acc, item) => {
      if (!acc[item.store]) acc[item.store] = [];
      acc[item.store].push(item); return acc;
    }, {} as Record<string, typeof pend>);
    let msg = `🛒 *Lista — ${month}*\n\n`;
    for (const [store, si] of Object.entries(grouped)) {
      msg += `🏪 *${store}*\n`;
      si.forEach(i => { msg += `  • ${i.name} ×${i.quantity} — R$ ${(i.estimatedPrice * i.quantity).toFixed(2)}\n`; });
      msg += '\n';
    }
    msg += `💰 *Total: R$ ${pend.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0).toFixed(2)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Categoria', 'Precio Estimado', 'Cantidad', 'Tienda', 'Nota'];
    const rows = items.map(i => [
      `"${i.name}"`, 
      `"${i.category}"`, 
      i.estimatedPrice, 
      i.quantity, 
      `"${i.store}"`, 
      `"${i.note || ''}"`
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lista_compras_${month.replace(/ /g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert("El archivo está vacío o solo contiene cabeceras.");
        return; 
      }

      const importedProducts: Omit<Product, 'id' | 'isPurchased' | 'addedAt'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const [name, category, price, qty, store, note] = lines[i].split(',').map(s => s?.replace(/^"|"$/g, '').trim() || '');
        if (!name) continue; 
        importedProducts.push({
          name,
          category: category || 'Otros',
          estimatedPrice: parseFloat(price) || 0,
          quantity: parseInt(qty) || 1,
          store: store || '',
          note: note || '',
        });
      }

      importedProducts.sort((a, b) => {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name);
        }
        return a.category.localeCompare(b.category);
      });

      addMultipleProducts(importedProducts);
      alert(`${importedProducts.length} productos importados y ordenados con éxito.`);
    };
    
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const tabs = [
    { id: 'home' as const, icon: '⚡', label: 'Inicio' },
    { id: 'list' as const, icon: '📋', label: 'Lista' },
    { id: 'stats' as const, icon: '📊', label: 'Stats' },
    { id: 'history' as const, icon: '📅', label: 'Historial' },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>

        {showCamera && <CameraScanner onClose={() => setShowCamera(false)} />}

        {/* ── SHOPPING MODE OVERLAY HEADER ── */}
        {shoppingMode && (
          <div className="fixed top-0 left-0 right-0 z-40 animate-slide-up shadow-md"
            style={{ background: 'var(--accent)', paddingTop: 'max(env(safe-area-inset-top), 10px)' }}>
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-2 h-2 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-white animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-xs sm:text-sm font-bold font-display truncate">MODO COMPRAS</span>
                  <span className="text-white/80 text-[10px] sm:text-xs truncate">{pendingCount} pendientes</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">{purchased}/{items.length}</span>
                <button onClick={toggleShoppingMode}
                  className="text-white/90 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                  Salir
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-white/20">
              <div className="h-full bg-white transition-all duration-700"
                style={{ width: `${items.length > 0 ? (purchased / items.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <header
          className="sticky z-30 backdrop-blur-xl transition-all"
          style={{
            top: shoppingMode ? '56px' : 0, // Ajustado para que no se sobreponga el Modo Compras
            background: isDark ? 'rgba(8,8,15,0.85)' : 'rgba(242,242,247,0.85)',
            borderBottom: '1px solid var(--border)',
            paddingTop: shoppingMode ? 0 : 'env(safe-area-inset-top)'
          }}
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: 'var(--accent-soft)' }}>🛒</div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold font-display leading-none truncate" style={{ color: 'var(--text-primary)' }}>
                  Compras
                </h1>
                <p className="text-xs mt-0.5 capitalize truncate" style={{ color: 'var(--text-secondary)' }}>{month}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {pendingCount > 0 && (
                <span className="text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm"
                  style={{ background: 'var(--accent)' }}>
                  {pendingCount}
                </span>
              )}
              <BudgetWidget compact />
            </div>
          </div>
        </header>

        {/* ── TABS ── */}
        <div className="sticky z-20 backdrop-blur-xl"
          style={{
            top: shoppingMode ? '120px' : '64px',
            background: isDark ? 'rgba(8,8,15,0.85)' : 'rgba(242,242,247,0.85)',
            borderBottom: '1px solid var(--border)',
          }}>
          <div className="max-w-2xl mx-auto px-2 sm:px-4">
            {/* Padding negativo para permitir scroll de borde a borde en móviles */}
            <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide px-2 sm:px-0">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex-shrink-0 font-display"
                  style={activeTab === tab.id
                    ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-glow)' }
                    : { color: 'var(--text-secondary)', background: 'transparent' }
                  }>
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <main className="max-w-2xl mx-auto px-4 pb-36 pt-4 space-y-5">

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="animate-slide-up space-y-5">
              <Dashboard />
              <BudgetWidget full />
              <CategorySummary />
            </div>
          )}

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <div className="animate-slide-up space-y-4">

              {/* Shopping mode shortcut */}
              {!shoppingMode && items.length > 0 && (
                <button onClick={toggleShoppingMode}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all card-hover shadow-sm"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}>
                  <span className="text-2xl">🛒</span>
                  <span className="text-sm font-bold flex-1 text-left" style={{ color: 'var(--accent)' }}>
                    Activar Modo Compras
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide" style={{ background: 'var(--accent)', color: '#fff' }}>
                    Iniciar
                  </span>
                </button>
              )}

              {/* Search + filters */}
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Buscar producto, categoría o tienda..."
                    className="flex-1 bg-transparent text-sm w-full focus:outline-none placeholder-opacity-60"
                    style={{ color: 'var(--text-primary)' }}
                    value={search} onChange={e => setSearch(e.target.value)} />
                  {search && (
                    <button onClick={() => setSearch('')} className="p-1 text-lg leading-none rounded-full bg-gray-500/10" style={{ color: 'var(--text-tertiary)' }}>×</button>
                  )}
                </div>
                {/* Filters */}
                <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
                  {(['all', 'pending', 'purchased'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={filter === f
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
                      }>
                      {f === 'all' ? `Todos (${items.length})` : f === 'pending' ? `Pendientes (${items.filter(i => !i.isPurchased).length})` : `Comprados (${items.filter(i => i.isPurchased).length})`}
                    </button>
                  ))}
                  <div className="w-px h-5 flex-shrink-0 mx-1" style={{ background: 'var(--border)' }} />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                    className="flex-shrink-0 text-xs px-2 py-1.5 rounded-lg border-0 focus:outline-none font-semibold min-w-[110px]"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', appearance: 'none' }}>
                    <option value="default">Orden Normal</option>
                    <option value="price">Mayor Precio</option>
                    <option value="name">Alfabético</option>
                    <option value="category">Categoría</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción principales - AHORA SE ADAPTAN VERTICALMENTE EN MÓVILES MUY PEQUEÑOS */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setShowAddForm(!showAddForm)}
                  className="flex-1 font-bold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-display shadow-sm"
                  style={showAddForm
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                    : { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px var(--accent-glow)' }
                  }>
                  <span className="text-xl leading-none">{showAddForm ? '−' : '+'}</span>
                  <span>{showAddForm ? 'Cerrar formulario' : 'Agregar producto'}</span>
                </button>
                <button onClick={() => setShowCamera(true)}
                  className="py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-bold shadow-sm"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Escanear</span>
                </button>
              </div>

              {showAddForm && <AddProductForm onAdd={() => setShowAddForm(false)} />}

              {/* Product list */}
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {filtered.length === 0 ? (
                  <div className="py-16 px-4 text-center flex flex-col items-center gap-4">
                    <span className="text-6xl animate-float">🛒</span>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {search ? 'No se encontraron resultados.' : 'Tu lista está vacía.'}
                    </p>
                    {!search && items.length === 0 && (
                      <div className="flex flex-col gap-3 mt-2 w-full max-w-[200px]">
                        <button onClick={() => setShowAddForm(true)} className="text-sm font-bold py-2 px-4 rounded-xl bg-accent/10" style={{ color: 'var(--accent)' }}>
                          + Agregar producto
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-500/10">
                      {filtered.map((item, idx) => (
                        <ProductCard key={item.id} item={item}
                          onToggle={() => toggleProduct(item.id)}
                          onRemove={() => removeProduct(item.id)}
                          onUpdate={(d) => updateProduct(item.id, d)}
                          isDark={isDark} shoppingMode={shoppingMode} isLast={idx === filtered.length - 1}
                        />
                      ))}
                    </div>

                    {/* Footer - AHORA SE ADAPTA EN MÓVILES (FLEX-WRAP) */}
                    <div className="flex flex-wrap items-center justify-between px-4 py-3 gap-2"
                      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{filtered.length} items</span>
                        {filter === 'purchased' && items.some(i => i.isPurchased) && (
                          <button onClick={clearPurchased} className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                            Limpiar comprados
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Total:</span>
                        <span className="text-base font-bold font-display" style={{ color: 'var(--accent)' }}>R$ {totalSum.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Botones de Importar / Exportar / WhatsApp - COLUMNAS EN CELULAR, FILA EN PC */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={exportToCSV}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold transition-all shadow-sm"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  <span>📥 Descargar CSV</span>
                </button>
                
                <label 
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-sm"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  <span>📤 Subir CSV</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                </label>
              </div>

              {/* WhatsApp export */}
              {items.filter(i => !i.isPurchased).length > 0 && (
                <button onClick={exportToWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-4 px-5 rounded-2xl text-sm font-bold transition-all shadow-sm mt-2"
                  style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.347-.272.273-1.04 1.02-1.04 2.488s1.065 2.886 1.213 3.084c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  Compartir lista en WhatsApp
                </button>
              )}

            </div>
          )}

          {activeTab === 'stats' && <div className="animate-slide-up"><StatsPanel /></div>}
          {activeTab === 'history' && <div className="animate-slide-up"><HistoryModal /></div>}
        </main>

        {/* ── BOTTOM NAV ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
          style={{
            background: isDark ? 'rgba(8,8,15,0.92)' : 'rgba(242,242,247,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)' // Soporte crucial para el notch de iPhone
          }}>
          <div className="flex items-center justify-around px-2 pt-2 pb-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 w-16 py-2 rounded-xl transition-all relative"
                style={{ color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                <div className="relative">
                  <span className="text-2xl">{tab.icon}</span>
                  {tab.id === 'list' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center shadow-sm"
                      style={{ background: 'var(--accent)' }}>
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </ThemeProvider>
  );
}
