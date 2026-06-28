// app/components/OnboardingScreen.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, BarChart3, Wifi, ChevronRight, Check, Sparkles, Camera, Shield } from 'lucide-react';

const slides = [
  {
    icon: <ShoppingCart size={48} strokeWidth={1.5} />,
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.12)',
    glow: 'rgba(99,102,241,0.15)',
    title: 'Tu lista inteligente',
    desc: 'Organiza tus compras por categoría, tienda y prioridad. Arrastra para reordenar.',
    features: ['IA categoriza automáticamente', 'Modo compras en tienda', 'Arrastrar para reordenar'],
  },
  {
    icon: <BarChart3 size={48} strokeWidth={1.5} />,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    glow: 'rgba(16,185,129,0.15)',
    title: 'Controla tu presupuesto',
    desc: 'Visualiza gastos por categoría y compara mes a mes con gráficos interactivos.',
    features: ['Presupuesto mensual', 'Gráficos por categoría', 'Historial de meses'],
  },
  {
    icon: <Wifi size={48} strokeWidth={1.5} />,
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.12)',
    glow: 'rgba(168,85,247,0.15)',
    title: 'Funciona sin internet',
    desc: 'Instálala en tu celular como app. Tus datos se guardan localmente, siempre disponibles.',
    features: ['PWA instalable', 'Datos 100% locales', 'Backup y restauración'],
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else onDone();
  };

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between px-6 pb-12 pt-safe"
      style={{ background: 'var(--bg)' }}>

      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full animate-morph"
          style={{ background: `radial-gradient(circle, ${slide.glow} 0%, transparent 70%)`, filter: 'blur(60px)' }}
        />
      </div>

      {/* Skip */}
      <div className="w-full flex justify-end pt-4 relative z-10">
        <button onClick={onDone} className="text-sm font-medium px-3 py-1.5 rounded-xl transition-all"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          Saltar
        </button>
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center gap-6 text-center max-w-xs relative z-10"
        >
          {/* Icon with glow */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-28 h-28 rounded-3xl flex items-center justify-center relative"
            style={{ background: slide.bg, color: slide.color }}
          >
            <div className="absolute inset-0 rounded-3xl animate-glow-pulse" style={{ background: slide.glow }} />
            <span className="relative z-10">{slide.icon}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              {slide.title}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {slide.desc}
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {slide.features.map((feature, i) => (
              <motion.span
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full"
                style={{ background: slide.bg, color: slide.color, border: `1px solid ${slide.color}22` }}
              >
                {feature}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom */}
      <div className="w-full max-w-xs space-y-6 relative z-10">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 24 : 8, opacity: i === step ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full cursor-pointer"
              style={{ background: slide.color }}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 btn-ripple"
          style={{ background: slide.color, boxShadow: `0 8px 24px ${slide.glow}` }}
        >
          {isLast ? (
            <>
              <Sparkles size={20} strokeWidth={2.5} />
              Comenzar
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight size={20} strokeWidth={2.5} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
