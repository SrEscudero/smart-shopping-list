// app/components/QuickAdd.tsx
"use client";

import { useMemo } from 'react';
import { useShoppingStore, Product } from '../../store/useShoppingStore';
import { CATEGORY_CONFIG } from '../../utils/constants';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptic';

export default function QuickAdd() {
  const items = useShoppingStore(s => s.items);
  const history = useShoppingStore(s => s.history);
  const addProduct = useShoppingStore(s => s.addProduct);
  const currency = useShoppingStore(s => s.currency);
  const c = currency || 'R$';

  // Build frequency map from current + historical items
  const frequent = useMemo(() => {
    const freq: Record<string, { count: number; product: Omit<Product, 'id' | 'isPurchased' | 'addedAt'> }> = {};

    // Count from history
    for (const h of history) {
      for (const item of h.items) {
        const key = item.name.toLowerCase().trim();
        if (!freq[key]) {
          freq[key] = {
            count: 0,
            product: {
              name: item.name,
              estimatedPrice: item.estimatedPrice,
              quantity: item.quantity,
              category: item.category,
              store: item.store,
              priority: item.priority,
            },
          };
        }
        freq[key].count++;
        // Update price to latest
        freq[key].product.estimatedPrice = item.estimatedPrice;
      }
    }

    // Count from current items too (but less weight)
    for (const item of items) {
      const key = item.name.toLowerCase().trim();
      if (freq[key]) {
        freq[key].count += 0.5;
      }
    }

    // Filter out items already in current list
    const currentNames = new Set(items.map(i => i.name.toLowerCase().trim()));
    return Object.values(freq)
      .filter(f => !currentNames.has(f.product.name.toLowerCase().trim()))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [history, items]);

  if (frequent.length === 0) return null;

  const handleQuickAdd = (product: typeof frequent[0]['product']) => {
    triggerHaptic('light');
    addProduct({ ...product });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Zap size={14} className="text-[var(--accent)]" />
        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Agregar rápido</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 px-1">
        {frequent.map((item, i) => {
          const cfg = CATEGORY_CONFIG[item.product.category] || CATEGORY_CONFIG['Otros'];
          return (
            <motion.button
              key={item.product.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleQuickAdd(item.product)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                minHeight: 'unset',
              }}
            >
              <span className="text-sm">{cfg.icon}</span>
              <div className="text-left">
                <p className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                  {item.product.name}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  {c}{item.product.estimatedPrice.toFixed(2)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
