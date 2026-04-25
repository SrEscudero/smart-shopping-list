// app/components/BottomNav.tsx
"use client";

import { useShoppingStore } from '../../store/useShoppingStore';
import { ClipboardList, BarChart3, CalendarDays, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: 'list' | 'stats' | 'history' | 'home';
  setActiveTab: (tab: 'home' | 'list' | 'stats' | 'history') => void;
  pendingCount: number;
}

export default function BottomNav({ activeTab, setActiveTab, pendingCount }: BottomNavProps) {
  const theme = useShoppingStore(s => s.theme);

  const tabs = [
    { id: 'home' as const, label: 'Inicio', icon: <Home size={22} /> },
    { id: 'list' as const, label: 'Lista', icon: <ClipboardList size={22} /> },
    { id: 'stats' as const, label: 'Stats', icon: <BarChart3 size={22} /> },
    { id: 'history' as const, label: 'Historial', icon: <CalendarDays size={22} /> },
  ];

  return (
    <div className="flex items-center justify-around px-2 pt-2 pb-1">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-1 w-16 py-1 rounded-xl transition-colors relative"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active-bg"
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
                  className="absolute -top-1 -right-2 text-white text-[9px] font-bold px-1.5 rounded-full min-w-[16px] text-center"
                  style={{ background: 'var(--accent)' }}
                >
                  {pendingCount}
                </motion.span>
              )}
            </div>

            <span className="text-[10px] font-bold tracking-wide relative z-10">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}