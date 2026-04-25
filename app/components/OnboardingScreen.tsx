// app/components/OnboardingScreen.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, BarChart3, Wifi, ChevronRight, Check } from 'lucide-react';

const slides = [
  {
    icon: <ShoppingCart size={52} strokeWidth={1.5} />,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    title: 'Tu lista inteligente',
    desc: 'Organiza tus compras por categoría, tienda y prioridad. Arrastra para reordenar.',
  },
  {
    icon: <BarChart3 size={52} strokeWidth={1.5} />,
    color: '#30D158',
    bg: 'rgba(48,209,88,0.12)',
    title: 'Controla tu presupuesto',
    desc: 'Visualiza gastos por categoría y compara mes a mes con gráficos interactivos.',
  },
  {
    icon: <Wifi size={52} strokeWidth={1.5} />,
    color: '#BF5AF2',
    bg: 'rgba(191,90,242,0.12)',
    title: 'Funciona sin internet',
    desc: 'Instálala en tu celular como app. Tus datos se guardan localmente, siempre disponibles.',
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

      {/* Skip */}
      <div className="w-full flex justify-end pt-4">
        <button onClick={onDone} className="text-sm font-medium px-3 py-1.5 rounded-xl"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
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
          className="flex flex-col items-center gap-6 text-center max-w-xs"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-28 h-28 rounded-3xl flex items-center justify-center animate-float"
            style={{ background: slide.bg, color: slide.color }}
          >
            {slide.icon}
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
        </motion.div>
      </AnimatePresence>

      {/* Bottom */}
      <div className="w-full max-w-xs space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 24 : 8, opacity: i === step ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full cursor-pointer"
              style={{ background: 'var(--accent)' }}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 btn-ripple"
          style={{ background: 'var(--accent)', boxShadow: '0 8px 24px var(--accent-glow)' }}
        >
          {isLast ? (
            <>
              <Check size={20} strokeWidth={2.5} />
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
