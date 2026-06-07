// app/components/BackupRestore.tsx
"use client";

import { useState, useRef } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';
import { Download, Upload, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackupRestore() {
  const exportBackup = useShoppingStore(s => s.exportBackup);
  const importBackup = useShoppingStore(s => s.importBackup);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compras_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setResult({ success: true, message: 'Backup descargado correctamente.' });
    setTimeout(() => setResult(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const res = importBackup(text);
      setResult(res);
      setTimeout(() => setResult(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]"
          style={{ background: 'var(--bg-elevated)' }}>
          <Shield size={18} />
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Backup de datos</span>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Exporta o restaura tus datos</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-3">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', minHeight: 'unset' }}
        >
          <Download size={16} />
          Exportar
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', minHeight: 'unset' }}
        >
          <Upload size={16} />
          Restaurar
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3"
          >
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${result.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {result.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {result.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
