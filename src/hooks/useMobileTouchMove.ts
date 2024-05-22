import useLayoutEffect from 'rc-util/lib/hooks/useLayoutEffect';
import type * as React from 'react';
import { useRef } from 'react';

const SMOOTH_PTG = 14 / 15;

export default function useMobileTouchMove(
  inVirtual: boolean,
  listRef: React.RefObject<HTMLDivElement>,
  callback: (isHorizontal: boolean, offset: number, smoothOffset?: boolean) => boolean,
) {
  const touchedRef = useRef(false);
  const touchXRef = useRef(0);
  const touchYRef = useRef(0);

  const elementRef = useRef<HTMLElement>(null);

  // Smooth scroll
  const intervalRef = useRef(null);

  /* eslint-disable prefer-const */
  let cleanUpEvents: () => void;

  const onTouchMove = (e: TouchEvent) => {
    if (touchedRef.current) {
      const currentX = Math.ceil(e.touches[0].pageX);
      const currentY = Math.ceil(e.touches[0].pageY);
      let offsetX = touchXRef.current - currentX;
      let offsetY = touchYRef.current - currentY;
      const isHorizontal = Math.abs(offsetX) > Math.abs(offsetY);
      if (isHorizontal) {
        touchXRef.current = currentX;
      } else {
        touchYRef.current = currentY;
      }

      if (callback(isHorizontal, isHorizontal ? offsetX : offsetY)) {
        e.preventDefault();
      }
      // Smooth interval
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (isHorizontal) {
          offsetX *= SMOOTH_PTG;
        } else {
          offsetY *= SMOOTH_PTG;
        }
        const offset = Math.floor(isHorizontal ? offsetX : offsetY);
        if (!callback(isHorizontal, offset, true) || Math.abs(offset) <= 0.1) {
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
      touchXRef.current = Math.ceil(e.touches[0].pageX);
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

  useLayoutEffect(() => {
    if (inVirtual) {
      listRef.current.addEventListener('touchstart', onTouchStart);
    }

    return () => {
      listRef.current?.removeEventListener('touchstart', onTouchStart);
      cleanUpEvents();
      clearInterval(intervalRef.current);
    };
  }, [inVirtual]);
}
