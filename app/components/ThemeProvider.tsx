// app/components/ThemeProvider.tsx
"use client";

import { useEffect } from 'react';
import { useShoppingStore } from '../../store/useShoppingStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor, shoppingMode } = useShoppingStore();

  // Apply theme + accent to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.setAttribute('data-accent', accentColor);
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

  return <>{children}</>;
}