// app/components/SpeedDialFAB.tsx
"use client";

import { useState } from 'react';
import { Plus, Camera, Bookmark, Mic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeedDialFABProps {
  onAddProduct: () => void;
  onScanCamera: () => void;
  onOpenTemplates: () => void;
}

export default function SpeedDialFAB({ onAddProduct, onScanCamera, onOpenTemplates }: SpeedDialFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: 'add',
      label: 'Nuevo producto',
      icon: <Plus size={18} />,
      onClick: () => { setIsOpen(false); onAddProduct(); },
      bg: 'var(--accent)',
      color: '#ffffff',
    },
    {
      id: 'scan',
      label: 'Escanear con cámara',
      icon: <Camera size={18} />,
      onClick: () => { setIsOpen(false); onScanCamera(); },
      bg: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
    },
    {
      id: 'template',
      label: 'Usar plantilla',
      icon: <Bookmark size={18} />,
      onClick: () => { setIsOpen(false); onOpenTemplates(); },
      bg: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
    },
  ];

  return (
    <div className="fixed z-[90] bottom-[86px] right-4 sm:right-6 flex flex-col items-end gap-3 pointer-events-none">
      {/* Expanded Actions Stack */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-1 pointer-events-auto">
            {actions.map((act, index) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2, delay: (actions.length - 1 - index) * 0.05 }}
                className="flex items-center gap-2.5"
              >
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-[var(--border)] whitespace-nowrap"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {act.label}
                </span>
                <button
                  onClick={act.onClick}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{ background: act.bg, color: act.color, border: '1px solid var(--border)', minHeight: 'unset' }}
                  title={act.label}
                >
                  {act.icon}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all border border-white/10"
        style={{
          background: 'var(--accent)',
          boxShadow: '0 8px 24px var(--accent-glow)',
          minHeight: 'unset',
        }}
        title={isOpen ? "Cerrar menú" : "Opciones de añadir"}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {isOpen ? <X size={24} /> : <Plus size={26} strokeWidth={2.5} />}
        </motion.div>
      </motion.button>
    </div>
  );
}
