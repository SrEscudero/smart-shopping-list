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
    addMultipleProducts // <- NUEVA FUNCION AGREGADA
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

  // --- EXPORTAR A WHATSAPP ---
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

  // --- EXPORTAR A CSV ---
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

  // --- IMPORTAR DESDE CSV Y ORDENAR ---
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

      // Procesar desde la línea 1 (ignorando la cabecera en la línea 0)
      for (let i = 1; i < lines.length; i++) {
        // Separa por comas respetando el formato, limpiando comillas extra
        const [name, category, price, qty, store, note] = lines[i].split(',').map(s => s?.replace(/^"|"$/g, '').trim() || '');

        if (!name) continue; // Si no hay nombre válido, ignoramos la línea

        importedProducts.push({
          name,
          category: category || 'Otros',
          estimatedPrice: parseFloat(price) || 0,
          quantity: parseInt(qty) || 1,
          store: store || '',
          note: note || '',
        });
      }

      // ORDENAR AUTOMÁTICAMENTE: Primero por categoría y luego alfabéticamente por nombre
      importedProducts.sort((a, b) => {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name);
        }
        return a.category.localeCompare(b.category);
      });

      // Guardar en el store global
      addMultipleProducts(importedProducts);
      alert(`${importedProducts.length} productos importados y ordenados con éxito.`);
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Resetear el input
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
          <div className="fixed top-0 left-0 right-0 z-40 animate-slide-up"
            style={{ background: 'var(--accent)', paddingTop: 'env(safe-area-inset-top,0)' }}>
            <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 rounded-full bg-white animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-white text-sm font-bold font-display">MODO COMPRAS</span>
                <span className="text-white/60 text-xs">· {pendingCount} pendientes</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-sm">{purchased}/{items.length}</span>
                <button onClick={toggleShoppingMode}
                  className="text-white/80 text-xs font-medium px-3 py-1 rounded-lg bg-white/20">
                  Salir
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-0.5 bg-white/20">
              <div className="h-full bg-white transition-all duration-700"
                style={{ width: `${items.length > 0 ? (purchased / items.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <header
          className="sticky z-30 backdrop-blur-xl"
          style={{
            top: shoppingMode ? '44px' : 0,
            background: isDark ? 'rgba(8,8,15,0.85)' : 'rgba(242,242,247,0.85)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                style={{ background: 'var(--accent-soft)' }}>🛒</div>
              <div className="min-w-0">
                <h1 className="text-base font-bold font-display leading-none" style={{ color: 'var(--text-primary)' }}>
                  Compras
                </h1>
                <p className="text-[10px] capitalize truncate" style={{ color: 'var(--text-secondary)' }}>{month}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {pendingCount > 0 && (
                <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
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
            top: shoppingMode ? '92px' : '57px',
            background: isDark ? 'rgba(8,8,15,0.85)' : 'rgba(242,242,247,0.85)',
            borderBottom: '1px solid var(--border)',
          }}>
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-0.5 py-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 font-display"
                  style={activeTab === tab.id
                    ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-glow)' }
                    : { color: 'var(--text-secondary)' }
                  }>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <main className="max-w-2xl mx-auto px-4 pb-32 pt-4 space-y-4">

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="animate-slide-up space-y-4">
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
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all card-hover"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}>
                  <span className="text-xl">🛒</span>
                  <span className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--accent)' }}>
                    Activar Modo Compras
                  </span>
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>
                    Iniciar
                  </span>
                </button>
              )}

              {/* Search + filters */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Buscar..."
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    style={{ color: 'var(--text-primary)' }}
                    value={search} onChange={e => setSearch(e.target.value)} />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-lg leading-none" style={{ color: 'var(--text-tertiary)' }}>×</button>
                  )}
                </div>
                {/* Filters */}
                <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
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
                  <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border-0 focus:outline-none font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    <option value="default">Orden normal</option>
                    <option value="price">Mayor precio</option>
                    <option value="name">A → Z</option>
                    <option value="category">Categoría</option>
                  </select>
                </div>
              </div>

              {/* Add buttons */}
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(!showAddForm)}
                  className="flex-1 font-semibold py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-display"
                  style={showAddForm
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                    : { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px var(--accent-glow)' }
                  }>
                  <span className="text-lg">{showAddForm ? '−' : '+'}</span>
                  {showAddForm ? 'Cerrar' : 'Agregar producto'}
                </button>
                <button onClick={() => setShowCamera(true)}
                  className="py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-sm font-semibold"
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
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {filtered.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center gap-3">
                    <span className="text-5xl animate-float">🛒</span>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {search ? 'Sin resultados' : 'No hay productos aquí'}
                    </p>
                    {!search && items.length === 0 && (
                      <div className="flex flex-col gap-2 mt-1">
                        <button onClick={() => setShowAddForm(true)} className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          + Agregar primer producto
                        </button>
                        <button onClick={() => setShowCamera(true)} className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                          📷 Escanear con cámara
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* In shopping mode, show bigger cards */}
                    {shoppingMode ? (
                      <div>
                        {filtered.map((item, idx) => (
                          <ProductCard key={item.id} item={item}
                            onToggle={() => toggleProduct(item.id)}
                            onRemove={() => removeProduct(item.id)}
                            onUpdate={(d) => updateProduct(item.id, d)}
                            isDark={isDark} shoppingMode isLast={idx === filtered.length - 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div>
                        {filtered.map((item, idx) => (
                          <ProductCard key={item.id} item={item}
                            onToggle={() => toggleProduct(item.id)}
                            onRemove={() => removeProduct(item.id)}
                            onUpdate={(d) => updateProduct(item.id, d)}
                            isDark={isDark} isLast={idx === filtered.length - 1}
                          />
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{filtered.length} items</span>
                        {filter === 'purchased' && items.some(i => i.isPurchased) && (
                          <button onClick={clearPurchased} className="text-xs font-medium text-red-400">
                            Limpiar comprados
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total:</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>R$ {totalSum.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* WhatsApp export */}
              {items.filter(i => !i.isPurchased).length > 0 && (
                <button onClick={exportToWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.347-.272.273-1.04 1.02-1.04 2.488s1.065 2.886 1.213 3.084c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  Compartir en WhatsApp
                </button>
              )}

              {/* Botones de Importar y Exportar CSV */}
              <div className="flex gap-2">
                <button onClick={exportToCSV}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <span>📥 Exportar CSV</span>
                </button>
                
                <label 
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <span>📤 Importar CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportCSV}
                  />
                </label>
              </div>

            </div>
          )}

          {activeTab === 'stats' && <div className="animate-slide-up"><StatsPanel /></div>}
          {activeTab === 'history' && <div className="animate-slide-up"><HistoryModal /></div>}
        </main>

        {/* ── BOTTOM NAV ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden pb-safe"
          style={{
            background: isDark ? 'rgba(8,8,15,0.92)' : 'rgba(242,242,247,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)',
          }}>
          <div className="flex items-center justify-around px-2 pt-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative"
                style={{ color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                <div className="relative">
                  <span className="text-xl">{tab.icon}</span>
                  {tab.id === 'list' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center"
                      style={{ background: 'var(--accent)' }}>
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </ThemeProvider>
  );
}