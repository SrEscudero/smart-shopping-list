// utils/haptic.ts

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([10, 50, 20]);
          break;
        case 'error':
          navigator.vibrate([20, 40, 20, 40, 30]);
          break;
      }
    } catch (e) {
      // Ignore if not supported or blocked
    }
  }
};
