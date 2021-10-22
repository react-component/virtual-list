import * as React from 'react';
import { useRef } from 'react';

const SMOOTH_PTG = 14 / 15;

export default function useMobileTouchMove(
  inVirtual: boolean,
  listRef: React.RefObject<HTMLDivElement>,
  callback: (offsetY: number, smoothOffset?: boolean) => boolean,
) {
  const touchedRef = useRef(false);
  const touchYRef = useRef(0);

  const elementRef = useRef<HTMLElement>(null);

  // Smooth scroll
  const intervalRef = useRef(null);

  /* eslint-disable prefer-const */
  let cleanUpEvents: () => void;

  const onTouchMove = (e: TouchEvent) => {
    if (touchedRef.current) {
      const currentY = Math.ceil(e.touches[0].pageY);
      let offsetY = touchYRef.current - currentY;
      touchYRef.current = currentY;

      if (callback(offsetY)) {
        e.preventDefault();
      }

      // Smooth interval
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        offsetY *= SMOOTH_PTG;

        if (!callback(offsetY, true) || Math.abs(offsetY) <= 0.1) {
          clearInterval(intervalRef.current);
        }
      }, 16);
    }
  };

  const onTouchEnd = () => {
    touchedRef.current = false;

    cleanUpEvents();
  };

  const onTouchStart = (e: TouchEvent) => {
    cleanUpEvents();

    if (e.touches.length === 1 && !touchedRef.current) {
      touchedRef.current = true;
      touchYRef.current = Math.ceil(e.touches[0].pageY);

      elementRef.current = e.target as HTMLElement;
      elementRef.current.addEventListener('touchmove', onTouchMove);
      elementRef.current.addEventListener('touchend', onTouchEnd);
    }
  };

  cleanUpEvents = () => {
    if (elementRef.current) {
      elementRef.current.removeEventListener('touchmove', onTouchMove);
      elementRef.current.removeEventListener('touchend', onTouchEnd);
    }
  };

  React.useLayoutEffect(() => {
    if (inVirtual) {
      listRef.current.addEventListener('touchstart', onTouchStart);
    }

    return () => {
      listRef.current.removeEventListener('touchstart', onTouchStart);
      cleanUpEvents();
      clearInterval(intervalRef.current);
    };
  }, [inVirtual]);
}
