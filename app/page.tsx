// app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useShoppingStore, Product } from '../store/useShoppingStore';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeProvider from './components/ThemeProvider';
import Dashboard from './components/Dashboard';
import AddProductForm from './components/AddProductForm';
import CategorySummary from './components/CategorySummary';
import StatsPanel from './components/StatsPanel';
import HistoryModal from './components/HistoryModal';
import ProductCard from './components/ProductCard';
import CameraScanner from './components/CameraScanner';
import BudgetWidget from './components/BudgetWidget';
import OnboardingScreen from './components/OnboardingScreen';
import { Home as HomeIcon, ClipboardList, BarChart3, CalendarDays, ShoppingCart, Camera, Plus, Minus, Download, Upload, AlertTriangle, CheckCircle2, Info, Search, X, PartyPopper } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableProductCard(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    position: isDragging ? 'relative' as const : undefined,
    opacity: isDragging ? 0.8 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-pan-y">
      <ProductCard {...props} />
    </div>
  );
}

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [celebration, setCelebration] = useState(false);
  const [prevPending, setPrevPending] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding only on first visit
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('onboarding_done')) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingDone = () => {
    localStorage.setItem('onboarding_done', '1');
    setShowOnboarding(false);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isDark = theme === 'dark';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        useShoppingStore.getState().reorderItems(oldIndex, newIndex);
      }
    }
  };

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

  // Celebration when all items completed
  useEffect(() => {
    if (prevPending !== null && prevPending > 0 && pendingCount === 0 && items.length > 0) {
      setCelebration(true);
      setTimeout(() => setCelebration(false), 4000);
    }
    setPrevPending(pendingCount);
  }, [pendingCount, items.length]);

  const exportToWhatsApp = () => {
    const pend = items.filter(i => !i.isPurchased);
    if (!pend.length) { showToast('No hay productos pendientes.', 'error'); return; }
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
        showToast("El archivo está vacío o solo contiene cabeceras.", 'error');
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
      showToast(`${importedProducts.length} productos importados y ordenados con éxito.`, 'success');
    };
    
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const tabs = [
    { id: 'home' as const, icon: <HomeIcon size={20} strokeWidth={2} />, label: 'Inicio' },
    { id: 'list' as const, icon: <ClipboardList size={20} strokeWidth={2} />, label: 'Lista' },
    { id: 'stats' as const, icon: <BarChart3 size={20} strokeWidth={2} />, label: 'Stats' },
    { id: 'history' as const, icon: <CalendarDays size={20} strokeWidth={2} />, label: 'Historial' },
  ];

  const tabVariants: any = {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
    exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } },
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>

        {/* ONBOARDING */}
        <AnimatePresence>
          {showOnboarding && (
            <motion.div key="onboarding" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <OnboardingScreen onDone={handleOnboardingDone} />
            </motion.div>
          )}
        </AnimatePresence>

        {showCamera && <CameraScanner onClose={() => setShowCamera(false)} />}

        {/* CELEBRATION OVERLAY */}
        <AnimatePresence>
          {celebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 flex flex-col items-center gap-3 shadow-2xl"
              >
                <PartyPopper size={48} className="text-[var(--accent)] animate-bounce" />
                <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">¡Lista completa!</h2>
                <p className="text-sm text-[var(--text-secondary)]">{items.length} productos comprados</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl glass-premium"
            >
              <span className="flex-shrink-0">
                {toast.type === 'error' ? <AlertTriangle size={20} className="text-red-400" /> : toast.type === 'success' ? <CheckCircle2 size={20} className="text-green-400" /> : <Info size={20} className="text-blue-400" />}
              </span>
              <span className="text-sm font-semibold">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
          className="sticky z-30 glass-premium transition-all"
          style={{
            top: shoppingMode ? '52px' : 0,
            paddingTop: shoppingMode ? 0 : 'env(safe-area-inset-top, 0px)'
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--accent)]"
                style={{ background: 'var(--accent-soft)' }}>
                <ShoppingCart size={20} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold font-display leading-none truncate" style={{ color: 'var(--text-primary)' }}>Compras</h1>
                <p className="text-xs mt-0.5 capitalize truncate" style={{ color: 'var(--text-secondary)' }}>{month}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {pendingCount > 0 && (
                <motion.span
                  key={pendingCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-white text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                >
                  {pendingCount}
                </motion.span>
              )}
              <BudgetWidget compact />
            </div>
          </div>
        </header>

        {/* ── TABS ── */}
        <div className="sticky z-20 glass-premium"
          style={{ top: shoppingMode ? '104px' : '52px' }}
        >
          <div className="px-3">
            <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 font-display btn-ripple"
                  style={activeTab === tab.id
                    ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px var(--accent-glow)', minHeight: 'unset' }
                    : { color: 'var(--text-secondary)', background: 'transparent', minHeight: 'unset' }
                  }>
                  <span className="flex items-center justify-center">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <main className="px-3 pb-32 pt-3 space-y-4">
          <AnimatePresence mode="wait">
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <motion.div key="home" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
                <Dashboard />
                <BudgetWidget full />
                <CategorySummary />
              </motion.div>
            )}

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <motion.div key="list" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">

              {/* Shopping mode shortcut */}
              {!shoppingMode && items.length > 0 && (
                <button onClick={toggleShoppingMode}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all card-hover shadow-sm"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}>
                  <ShoppingCart size={24} className="text-[var(--accent)]" />
                  <span className="text-sm font-bold flex-1 text-left" style={{ color: 'var(--accent)' }}>
                    Activar Modo Compras
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wide" style={{ background: 'var(--accent)', color: '#fff' }}>
                    Iniciar
                  </span>
                </button>
              )}

              {/* Search + filters */}
              <div className="rounded-2xl overflow-hidden shadow-sm gradient-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearch(''); }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all btn-ripple"
                    style={{ background: searchOpen ? 'var(--accent-soft)' : 'transparent', color: searchOpen ? 'var(--accent)' : 'var(--text-tertiary)' }}
                  >
                    <Search size={18} />
                  </button>
                  {searchOpen ? (
                    <div className="flex-1 flex items-center gap-2 search-expand">
                      <input type="text" placeholder="Buscar producto, categoría o tienda..."
                        className="flex-1 bg-transparent text-sm w-full focus:outline-none placeholder-opacity-60"
                        style={{ color: 'var(--text-primary)' }}
                        value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                      {search && (
                        <button onClick={() => setSearch('')} className="p-1 rounded-full" style={{ color: 'var(--text-tertiary)' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm flex-1" style={{ color: 'var(--text-tertiary)' }}>Buscar...</span>
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

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => setShowCamera(true)}
                  className="py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm font-bold shadow-sm btn-ripple"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <Camera size={20} />
                  <span>Escanear</span>
                </button>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    <AddProductForm onAdd={() => setShowAddForm(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product list */}
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {filtered.length === 0 ? (
                  <div className="py-16 px-4 text-center flex flex-col items-center gap-4">
                    <ShoppingCart size={48} className="animate-float opacity-20 text-[var(--text-primary)]" strokeWidth={1.5} />
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
                      {sortBy === 'default' && !search ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                          <SortableContext items={filtered.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            {filtered.map((item, idx) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
                              >
                                <SortableProductCard item={item}
                                  onToggle={toggleProduct}
                                  onRemove={removeProduct}
                                  onUpdate={updateProduct}
                                  isDark={isDark} shoppingMode={shoppingMode} isLast={idx === filtered.length - 1}
                                />
                              </motion.div>
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        filtered.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
                          >
                            <ProductCard item={item}
                              onToggle={toggleProduct}
                              onRemove={removeProduct}
                              onUpdate={updateProduct}
                              isDark={isDark} shoppingMode={shoppingMode} isLast={idx === filtered.length - 1}
                            />
                          </motion.div>
                        ))
                      )}
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
                  <Download size={18} /> <span>Descargar CSV</span>
                </button>
                
                <label 
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-sm"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  <Upload size={18} /> <span>Subir CSV</span>
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

            </motion.div>
          )}

          {activeTab === 'stats' && <motion.div key="stats" variants={tabVariants} initial="initial" animate="animate" exit="exit"><StatsPanel /></motion.div>}
          {activeTab === 'history' && <motion.div key="history" variants={tabVariants} initial="initial" animate="animate" exit="exit"><HistoryModal /></motion.div>}
          </AnimatePresence>
        </main>

        {/* ── FAB ── */}
        <AnimatePresence>
          {activeTab === 'list' && !showAddForm && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddForm(true)}
              className="fixed z-30 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl fab-pulse"
              style={{
                background: 'var(--accent)',
                right: '16px',
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
                minHeight: 'unset',
              }}
            >
              <Plus size={26} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── BOTTOM NAV ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 glass-premium"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
          <div className="flex items-center justify-around px-1 pt-1 pb-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-colors relative"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                    minHeight: 'unset',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'var(--accent-soft)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <div className="relative z-10">
                    <motion.span
                      className="flex items-center justify-center"
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {tab.icon}
                    </motion.span>
                    {tab.id === 'list' && pendingCount > 0 && (
                      <motion.span
                        key={pendingCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-2 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center"
                        style={{ background: 'var(--accent)', minHeight: 'unset' }}
                      >
                        {pendingCount}
                      </motion.span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold tracking-wide relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </ThemeProvider>
  );
}
