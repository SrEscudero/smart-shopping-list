// app/components/BottomNav.tsx
"use client";

import { useShoppingStore } from '../../store/useShoppingStore';

interface BottomNavProps {
  activeTab: 'list' | 'stats' | 'history';
  setActiveTab: (tab: 'list' | 'stats' | 'history') => void;
  pendingCount: number;
}

export default function BottomNav({ activeTab, setActiveTab, pendingCount }: BottomNavProps) {
  const theme = useShoppingStore(s => s.theme);
  const isDark = theme === 'dark';

  const tabs = [
    { id: 'list' as const, label: 'Lista', icon: '📋' },
    { id: 'stats' as const, label: 'Stats', icon: '📊' },
    { id: 'history' as const, label: 'Historial', icon: '📅' },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0A0A0F]/95 border-white/5' : 'bg-white/95 border-gray-200'} backdrop-blur-xl border-t md:hidden`}>
      <div className="flex items-center justify-around px-4 py-2 pb-safe">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'text-blue-500'
                : isDark ? 'text-gray-600' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              <span className="text-xl">{tab.icon}</span>
              {tab.id === 'list' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] font-bold px-1 py-0 rounded-full min-w-[14px] text-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold ${activeTab === tab.id ? 'text-blue-500' : isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}