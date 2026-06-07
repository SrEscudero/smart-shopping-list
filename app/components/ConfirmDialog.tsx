// app/components/ConfirmDialog.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  itemCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  itemCount,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open || typeof window === 'undefined') return null;

  const colors = {
    danger: { bg: 'rgba(255,69,58,0.12)', border: 'rgba(255,69,58,0.25)', text: '#FF453A', btn: '#FF453A' },
    warning: { bg: 'rgba(255,159,10,0.12)', border: 'rgba(255,159,10,0.25)', text: '#FF9F0A', btn: '#FF9F0A' },
    info: { bg: 'var(--accent-soft)', border: 'rgba(var(--accent-rgb),0.25)', text: 'var(--accent)', btn: 'var(--accent)' },
  };

  const c = colors[variant];

  return ReactDOM.createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
          style={{ touchAction: 'none' }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(4px)' }} onClick={onCancel} />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Close */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', minHeight: 'unset' }}
            >
              <X size={15} />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: c.bg }}>
              <AlertTriangle size={28} style={{ color: c.text }} />
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
              {itemCount !== undefined && (
                <p className="text-xs font-bold px-3 py-1 rounded-full inline-block" style={{ background: c.bg, color: c.text }}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', minHeight: 'unset' }}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ background: c.btn, minHeight: 'unset' }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
