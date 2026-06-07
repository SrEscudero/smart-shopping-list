// app/components/ShareModal.tsx
"use client";

import { useState } from 'react';
import ReactDOM from 'react-dom';
import { useShoppingStore } from '../../store/useShoppingStore';
import { Share2, Copy, Check, X, Link2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ open, onClose }: ShareModalProps) {
  const items = useShoppingStore(s => s.items);
  const month = useShoppingStore(s => s.month);
  const currency = useShoppingStore(s => s.currency);
  const c = currency || 'R$';
  const [copied, setCopied] = useState(false);

  if (!open || typeof window === 'undefined') return null;

  const pendingItems = items.filter(i => !i.isPurchased);

  // Generate shareable text
  const generateText = () => {
    const grouped = pendingItems.reduce((acc, item) => {
      if (!acc[item.store || 'Varias']) acc[item.store || 'Varias'] = [];
      acc[item.store || 'Varias'].push(item);
      return acc;
    }, {} as Record<string, typeof pendingItems>);

    let msg = `🛒 *Lista — ${month}*\n\n`;
    for (const [store, si] of Object.entries(grouped)) {
      msg += `🏪 *${store}*\n`;
      si.forEach(i => {
        msg += `  • ${i.name} ×${i.quantity} — ${c} ${(i.estimatedPrice * i.quantity).toFixed(2)}\n`;
      });
      msg += '\n';
    }
    msg += `💰 *Total: ${c} ${pendingItems.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0).toFixed(2)}*`;
    return msg;
  };

  // Generate URL with encoded list
  const generateShareURL = () => {
    const data = pendingItems.map(i => ({
      n: i.name,
      p: i.estimatedPrice,
      q: i.quantity,
      c: i.category,
      s: i.store,
    }));
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    return `${window.location.origin}/?import=${encoded}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateText())}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Lista de compras — ${month}`,
          text: generateText(),
        });
      } catch {
        // User cancelled
      }
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col justify-end"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(4px)' }} onClick={onClose} />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full rounded-t-3xl p-5 space-y-4"
            style={{ background: 'var(--bg-card)', maxHeight: '70vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(128,128,128,0.3)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                  <Share2 size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Compartir lista</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pendingItems.length} productos pendientes</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', minHeight: 'unset' }}>
                <X size={17} />
              </button>
            </div>

            {/* Share options */}
            <div className="space-y-2">
              {/* WhatsApp */}
              <button onClick={shareWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all"
                style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', minHeight: 'unset' }}>
                <MessageCircle size={20} style={{ color: '#25D366' }} />
                <span className="text-sm font-semibold" style={{ color: '#25D366' }}>Enviar por WhatsApp</span>
              </button>

              {/* Copy text */}
              <button onClick={() => copyToClipboard(generateText())}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', minHeight: 'unset' }}>
                {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} style={{ color: 'var(--text-secondary)' }} />}
                <span className="text-sm font-semibold" style={{ color: copied ? '#30D158' : 'var(--text-primary)' }}>
                  {copied ? '¡Copiado!' : 'Copiar como texto'}
                </span>
              </button>

              {/* Copy link */}
              <button onClick={() => copyToClipboard(generateShareURL())}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', minHeight: 'unset' }}>
                <Link2 size={20} style={{ color: 'var(--text-secondary)' }} />
                <div className="text-left flex-1">
                  <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>Compartir enlace</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Cualquiera puede importar la lista</span>
                </div>
              </button>

              {/* Native share (if available) */}
              {'share' in navigator && (
                <button onClick={shareNative}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(var(--accent-rgb),0.2)', minHeight: 'unset' }}>
                  <Share2 size={20} className="text-[var(--accent)]" />
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Compartir con...</span>
                </button>
              )}
            </div>

            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
