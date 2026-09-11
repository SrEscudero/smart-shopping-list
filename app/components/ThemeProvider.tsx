// app/components/ThemeProvider.tsx
"use client";

import { useEffect } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useShoppingStore(s => s.theme);
  const accentColor = useShoppingStore(s => s.accentColor);
  const cardStyle = useShoppingStore(s => s.cardStyle);
  const shoppingMode = useShoppingStore(s => s.shoppingMode);
  const totalBudget = useShoppingStore(s => s.totalBudget);
  const budgetAlertDismissed = useShoppingStore(s => s.budgetAlertDismissed);
  const items = useShoppingStore(s => s.items);
  const currency = useShoppingStore(s => s.currency);

  // Auto theme: detect system preference
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-accent', accentColor);
    html.setAttribute('data-card-style', cardStyle || 'classic');

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
  }, [theme, accentColor, cardStyle]);

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
    if (totalBudget > 0 && !budgetAlertDismissed) {
      const totalEstimated = items.reduce((a, i) => a + i.estimatedPrice * i.quantity, 0);
      const pct = (totalEstimated / totalBudget) * 100;
      if (pct >= 80 && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Presupuesto al ' + Math.round(pct) + '%', {
          body: `Llevas ${currency} ${totalEstimated.toFixed(0)} de ${currency} ${totalBudget.toFixed(0)}`,
          icon: '/icons/icon-192x192.png',
        });
      }
    }
  }, [budgetAlertDismissed, currency, items, totalBudget]);

  return <>{children}</>;
}
