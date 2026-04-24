// app/components/ProductCard.tsx
"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Product } from '../../store/useShoppingStore';
import { CATEGORY_CONFIG, ALL_CATEGORIES } from '../../utils/constants';
import { triggerHaptic } from '../../utils/haptic';

function triggerConfetti(x: number, y: number) {
    const colors = ['#FF453A', '#30D158', '#FFD60A', '#0A84FF', '#BF5AF2', '#FF9F0A'];
    for (let i = 0; i < 12; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        const angle = (i / 12) * 360;
        const distance = 50 + Math.random() * 60;
        const tx = Math.cos((angle * Math.PI) / 180) * distance;
        const ty = Math.sin((angle * Math.PI) / 180) * distance - 30;
        el.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};--tx:${tx}px;--ty:${ty}px;--rot:${Math.random() * 360}deg;border-radius:${Math.random() > 0.5 ? '50%' : '2px'};`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }
}

interface Props {
    item: Product;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onUpdate: (id: string, data: Partial<Product>) => void;
    isDark: boolean;
    shoppingMode?: boolean;
    isLast?: boolean;
}

const ProductCard = React.memo(function ProductCard({ item, onToggle, onRemove, onUpdate, isDark, shoppingMode = false, isLast = false }: Props) {
    const [showEdit, setShowEdit] = useState(false);
    const [justToggled, setJustToggled] = useState(false);
    const [editName, setEditName] = useState(item.name);
    const [editPrice, setEditPrice] = useState(item.estimatedPrice.toString());
    const [editQty, setEditQty] = useState(item.quantity.toString());
    const [editStore, setEditStore] = useState(item.store || '');
    const [editCategory, setEditCategory] = useState(item.category);
    const [editNote, setEditNote] = useState(item.note || '');
    const [editPriority, setEditPriority] = useState<'alta' | 'media' | 'baja'>(item.priority || 'media');

    // Swipe to delete state
    const [startX, setStartX] = useState<number | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const onTouchStart = (e: React.TouchEvent) => setStartX(e.touches[0].clientX);
    const onTouchMove = (e: React.TouchEvent) => {
        if (startX !== null) {
            const diff = e.touches[0].clientX - startX;
            if (diff < 0) {
                setOffsetX(Math.max(diff, -100)); // Cap at -100px
            }
        }
    };
    const onTouchEnd = () => {
        if (offsetX < -70) {
            triggerHaptic('heavy');
            setIsDeleting(true);
            setTimeout(() => onRemove(item.id), 300);
        } else {
            setOffsetX(0);
        }
        setStartX(null);
    };

    const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG['Otros'];
    const editCfg = CATEGORY_CONFIG[editCategory] || CATEGORY_CONFIG['Otros'];
    const total = item.estimatedPrice * item.quantity;
    const liveTotal = ((parseFloat(editPrice) || 0) * (parseInt(editQty) || 1)).toFixed(2);

    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHaptic(item.isPurchased ? 'light' : 'success');
        if (!item.isPurchased) {
            triggerConfetti(e.clientX, e.clientY);
            setJustToggled(true);
            setTimeout(() => setJustToggled(false), 600);
        }
        onToggle(item.id);
    }, [item.isPurchased, item.id, onToggle]);

    const openEdit = () => {
        setEditName(item.name); setEditPrice(item.estimatedPrice.toString());
        setEditQty(item.quantity.toString()); setEditStore(item.store || '');
        setEditCategory(item.category); setEditNote(item.note || '');
        setEditPriority(item.priority || 'media'); setShowEdit(true);
    };

    const handleSave = () => {
        onUpdate(item.id, {
            name: editName.trim() || item.name, estimatedPrice: parseFloat(editPrice) || item.estimatedPrice,
            quantity: parseInt(editQty) || 1, store: editStore.trim() || 'Varias',
            category: editCategory, note: editNote.trim() || undefined, priority: editPriority
        });
        setShowEdit(false);
    };

    const inputCls = `w-full text-sm px-3 py-3 rounded-xl focus:outline-none transition-all ${isDark ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-black/5 text-gray-900 placeholder:text-gray-400'}`;
    const lbl = `text-[10px] font-bold uppercase tracking-widest opacity-40`;

    if (shoppingMode) {
        return (
            <button onClick={handleToggle}
                className="w-full text-left flex items-center gap-4 px-4 py-5 transition-all duration-300 relative overflow-hidden"
                style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    background: justToggled ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent',
                    opacity: item.isPurchased ? 0.4 : 1
                }}>
                <div className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                        background: item.isPurchased ? 'var(--accent)' : 'transparent',
                        borderColor: item.isPurchased ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                        boxShadow: item.isPurchased ? '0 0 12px var(--accent-glow)' : 'none'
                    }}>
                    {item.isPurchased && (
                        <svg className="w-5 h-5 text-white animate-bounce-check" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: cfg.bg }}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="relative inline-block max-w-full">
                        <span className="font-semibold text-base leading-tight">{item.name}</span>
                        {item.isPurchased && (
                            <div className="absolute left-0 top-1/2 h-0.5 rounded-full -translate-y-1/2 strike-done"
                                style={{ width: '100%', background: 'var(--accent)' }} />
                        )}
                    </div>
                    <p className="text-xs opacity-40 mt-0.5">×{item.quantity} · {item.category}</p>
                </div>
                <p className="font-bold text-base flex-shrink-0" style={{ opacity: item.isPurchased ? 0.4 : 1 }}>
                    R${total.toFixed(2)}
                </p>
            </button>
        );
    }

    return (
        <div className="relative overflow-hidden" style={{ transition: 'height 0.3s', height: isDeleting ? 0 : 'auto', opacity: isDeleting ? 0 : 1 }}>
            {/* Delete background */}
            <div className="absolute inset-y-0 right-0 w-full bg-red-500 flex items-center justify-end px-6 text-white" style={{ opacity: offsetX < -20 ? 1 : 0 }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
            
            <div 
                className="relative flex items-center gap-3 px-2 py-4 transition-all duration-200"
                style={{ 
                    borderBottom: isLast ? 'none' : '1px solid var(--border)', 
                    opacity: item.isPurchased ? 0.5 : 1,
                    transform: `translateX(${offsetX}px)`,
                    background: 'var(--bg-card)'
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: cfg.color }} />
                
                <button onClick={handleToggle}
                    className="w-11 h-11 flex items-center justify-center flex-shrink-0 transition-all"
                    aria-label="Marcar producto"
                >
                    <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                        style={{
                            background: item.isPurchased ? 'var(--accent)' : 'transparent',
                            borderColor: item.isPurchased ? 'var(--accent)' : 'rgba(255,255,255,0.2)'
                        }}>
                        {item.isPurchased && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </button>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: cfg.bg }}>
                    {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-snug ${item.isPurchased ? 'line-through' : ''}`}
                        style={{ color: item.isPurchased ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                        {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-medium" style={{ color: cfg.color }}>{item.category}</span>
                        {item.store && item.store !== 'Varias' && (
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>· {item.store}</span>
                        )}
                        {item.note && (
                            <span className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>· {item.note}</span>
                        )}
                        {item.priority === 'alta' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-red-400 bg-red-500/10">URGENTE</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>R${total.toFixed(2)}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>×{item.quantity}</span>
                </div>
                <button onClick={openEdit}
                    className="w-11 h-11 flex items-center justify-center flex-shrink-0 transition-all"
                    aria-label="Editar producto"
                >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                </button>
            </div>

            {showEdit && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowEdit(false)} />
                    <div className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl animate-slide-up overflow-hidden"
                        style={{ background: isDark ? '#0D0D16' : '#FFFFFF', maxHeight: '90vh' }}>
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-hover)' }} />
                        </div>
                        <div className="px-5 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: editCfg.bg }}>
                                {editCfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Editar producto</h2>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.name}</p>
                            </div>
                            <button onClick={() => setShowEdit(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-5 pb-8 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(90vh - 100px)' }}>
                            <div className="space-y-1.5">
                                <label className={lbl}>Nombre</label>
                                <input type="text" className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className={lbl}>Precio unitario</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>R$</span>
                                        <input type="number" step="0.01" min="0"
                                            className={`w-full text-sm pl-8 pr-3 py-3 rounded-xl focus:outline-none ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-gray-900'}`}
                                            value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className={lbl}>Cantidad</label>
                                    <input type="number" min="1" className={`${inputCls} text-center`} value={editQty} onChange={e => setEditQty(e.target.value)} />
                                </div>
                            </div>
                            {editPrice && editQty && (
                                <div className="flex items-center justify-between px-4 py-3 rounded-xl animate-fade-in" style={{ background: 'var(--accent-soft)' }}>
                                    <span className="text-sm" style={{ color: 'var(--accent)' }}>Total estimado</span>
                                    <span className="text-base font-bold" style={{ color: 'var(--accent)' }}>R$ {liveTotal}</span>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className={lbl}>Tienda</label>
                                <input type="text" className={inputCls} value={editStore} onChange={e => setEditStore(e.target.value)} placeholder="Atacadão, Stok Center..." />
                            </div>
                            <div className="space-y-2">
                                <label className={lbl}>Categoría</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ALL_CATEGORIES.map(cat => {
                                        const c = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Otros'];
                                        const sel = editCategory === cat;
                                        return (
                                            <button key={cat} onClick={() => setEditCategory(cat)}
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                                                style={{ background: sel ? c.bg : 'var(--bg-elevated)', border: `1px solid ${sel ? c.color + '40' : 'transparent'}` }}>
                                                <span className="text-base flex-shrink-0">{c.icon}</span>
                                                <span className="text-xs font-medium truncate" style={{ color: sel ? c.color : 'var(--text-secondary)' }}>{cat}</span>
                                                {sel && <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.color }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={lbl}>Nota (opcional)</label>
                                <input type="text" className={inputCls} value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Marca, tamaño, variante..." />
                            </div>
                            <div className="space-y-1.5">
                                <label className={lbl}>Prioridad</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'alta' as const, label: '🔴 Alta', ab: 'rgba(255,69,58,0.15)', at: '#FF453A' },
                                        { id: 'media' as const, label: '🟡 Media', ab: 'rgba(255,214,10,0.15)', at: '#FFD60A' },
                                        { id: 'baja' as const, label: '🟢 Baja', ab: 'rgba(48,209,88,0.15)', at: '#30D158' },
                                    ].map(p => (
                                        <button key={p.id} onClick={() => setEditPriority(p.id)}
                                            className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                                            style={{
                                                background: editPriority === p.id ? p.ab : 'var(--bg-elevated)',
                                                color: editPriority === p.id ? p.at : 'var(--text-secondary)'
                                            }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => { onRemove(item.id); setShowEdit(false); }}
                                    className="px-4 py-3 rounded-2xl text-sm font-semibold text-red-400 transition-all"
                                    style={{ background: 'rgba(255,69,58,0.12)', border: '1px solid rgba(255,69,58,0.2)' }}>
                                    🗑 Eliminar
                                </button>
                                <button onClick={handleSave}
                                    className="flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all"
                                    style={{ background: 'var(--accent)', boxShadow: '0 4px 16px var(--accent-glow)' }}>
                                    Guardar cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ProductCard;