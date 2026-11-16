import { useLayoutEffect } from '@rc-component/util';
import type * as React from 'react';
import { useRef } from 'react';

const SMOOTH_PTG = 14 / 15;

// Handling stays on the touch target (see `onTouchStart`): virtualized items can be unmounted
// mid-gesture, and events on a detached target never bubble up to the list.
const onListTouchMove = () => {};

export default function useMobileTouchMove(
  inVirtual: boolean,
  listRef: React.RefObject<HTMLDivElement>,
  callback: (
    isHorizontal: boolean,
    offset: number,
    smoothOffset: boolean,
    e?: TouchEvent,
  ) => boolean,
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

      const scrollHandled = callback(isHorizontal, isHorizontal ? offsetX : offsetY, false, e);
      // Once the browser has started a native scroll (e.g. passed through at the list edge),
      // the rest of the sequence is not cancelable and `preventDefault` only logs a warning.
      if (scrollHandled && e.cancelable) {
        e.preventDefault();
      }

      // Smooth interval
      clearInterval(intervalRef.current);

      if (scrollHandled) {
        intervalRef.current = setInterval(() => {
          if (isHorizontal) {
            offsetX *= SMOOTH_PTG;
          } else {
            offsetY *= SMOOTH_PTG;
          }
          const offset = Math.trunc(isHorizontal ? offsetX : offsetY);
          if (!callback(isHorizontal, offset, true) || Math.abs(offset) <= 0.1) {
            clearInterval(intervalRef.current);
          }
        }, 16);
      }
    }
  };

  const onTouchEnd = () => {
    cleanUpEvents();
  };

  const onTouchStart = (e: TouchEvent) => {
    cleanUpEvents();

    if (e.touches.length === 1 && !touchedRef.current) {
      touchedRef.current = true;
      touchXRef.current = Math.ceil(e.touches[0].pageX);
      touchYRef.current = Math.ceil(e.touches[0].pageY);

      elementRef.current = e.target as HTMLElement;
      elementRef.current.addEventListener('touchmove', onTouchMove, { passive: false });
      elementRef.current.addEventListener('touchend', onTouchEnd, { passive: true });
      elementRef.current.addEventListener('touchcancel', onTouchEnd, { passive: true });
    }
  };

  cleanUpEvents = () => {
    touchedRef.current = false;

    if (elementRef.current) {
      elementRef.current.removeEventListener('touchmove', onTouchMove);
      elementRef.current.removeEventListener('touchend', onTouchEnd);
      elementRef.current.removeEventListener('touchcancel', onTouchEnd);
    }
  };

  useLayoutEffect(() => {
    const listEle = listRef.current;

    if (inVirtual) {
      listEle.addEventListener('touchstart', onTouchStart, { passive: true });
      // Browsers decide whether a touch sequence is cancelable by hit-testing for blocking
      // touch listeners at `touchstart`. The real `touchmove` listener is only attached to the
      // target inside `onTouchStart`, which is too late, so every `touchmove` would arrive with
      // `cancelable=false` and the page would scroll along with the list. A persistent
      // non-passive listener on the list marks its area as blocking up front.
      listEle.addEventListener('touchmove', onListTouchMove, { passive: false });
    }

    return () => {
      listEle?.removeEventListener('touchstart', onTouchStart);
      listEle?.removeEventListener('touchmove', onListTouchMove);
      cleanUpEvents();
      clearInterval(intervalRef.current);
    };
  }, [inVirtual]);
}
