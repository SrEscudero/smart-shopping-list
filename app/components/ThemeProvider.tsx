// app/components/ThemeProvider.tsx
"use client";

import { useEffect, useState } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useShoppingStore(s => s.theme);
  const accentColor = useShoppingStore(s => s.accentColor);
  const shoppingMode = useShoppingStore(s => s.shoppingMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Auto theme: detect system preference
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-accent', accentColor);

    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = (e: MediaQueryListEvent | MediaQueryList) => {
        html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      apply(mq);
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    } else {
      html.setAttribute('data-theme', theme);
    }
  }, [theme, accentColor]);

  // Wake Lock API — mantiene pantalla encendida en modo compras
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && shoppingMode) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch {
          // Wake lock not supported or denied — silently fail
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    };

    if (shoppingMode) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire after visibility change (tab switch back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shoppingMode) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shoppingMode]);

  // Budget alert system — notify when budget exceeds 80%
  useEffect(() => {
    if (!hydrated) return;
    const s = useShoppingStore.getState();
    if (s.totalBudget > 0 && !s.budgetAlertDismissed) {
      const totalEstimated = s.items.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
      const pct = (totalEstimated / s.totalBudget) * 100;
      if (pct >= 80 && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ Presupuesto al ' + Math.round(pct) + '%', {
          body: `Llevas ${s.currency} ${totalEstimated.toFixed(0)} de ${s.currency} ${s.totalBudget.toFixed(0)}`,
          icon: '/icons/icon-192x192.png',
        });
      }
    }
  }, [hydrated]);

  return <>{children}</>;
}