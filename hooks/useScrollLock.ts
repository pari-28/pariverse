import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';
let originalPadding = '';

export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    if (lockCount === 0) {
      // First lock: capture current state
      originalOverflow = document.body.style.overflow;
      originalPadding = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPadding;
      }
    };
  }, [lock]);
}
