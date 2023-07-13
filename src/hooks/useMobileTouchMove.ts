import type React from 'react';
import { useRef } from 'react';
import useLayoutEffect from 'rc-util/lib/hooks/useLayoutEffect';

const SMOOTH_PTG = 14 / 15;

export default function useMobileTouchMove(
  inVirtual: boolean,
  listRef: React.RefObject<HTMLDivElement>,
  originScroll: (deltaX: number, deltaY: number, isTouch?: boolean) => boolean,
  onRawWheel: (e: WheelEvent, isTouch?: boolean) => void,
) {
  const touchedRef = useRef(false);
  const touchYRef = useRef(0);
  const touchXRef = useRef(0);

  const elementRef = useRef<HTMLElement>(null);
  const isFirstMove = useRef(true);
  const shouldUseOriginScroll = useRef(false);

  // Smooth scroll
  const intervalRef = useRef(null);

  /* eslint-disable prefer-const */
  let cleanUpEvents: () => void;

  const onTouchMove = (e: TouchEvent) => {
    if (touchedRef.current) {
      const currentX = e.touches[0].pageX;
      const currentY = e.touches[0].pageY;
      let offsetX = touchXRef.current - currentX;
      let offsetY = touchYRef.current - currentY;
      touchXRef.current = currentX;
      touchYRef.current = currentY;

      if (isFirstMove.current) {
        // use origin scroll
        if (originScroll(offsetX, offsetY, true)) {
          shouldUseOriginScroll.current = true;
          // scroll component
        } else {
          onRawWheel({ deltaX: offsetX, deltaY: offsetY } as WheelEvent, true);
          e.preventDefault();
        }

        // if the first touchmove scrolls the component, subsequent touchmove should follow its behavior
        // if the first touchmove use origin scroll, subsequent touchmove should follow its behavior
      } else {
        if (!shouldUseOriginScroll.current) {
          onRawWheel({ deltaX: offsetX, deltaY: offsetY } as WheelEvent, true);
          e.preventDefault();
        }
      }

      // after the finger is lifted, it needs to slide for a certain distance
      if (!shouldUseOriginScroll.current) {
        const isHorizontal = Math.abs(offsetX) >= Math.abs(offsetY);
        // Smooth interval
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          offsetX *= SMOOTH_PTG;
          offsetY *= SMOOTH_PTG;

          onRawWheel({ deltaX: offsetX, deltaY: offsetY } as WheelEvent, true);
          if (isHorizontal ? Math.abs(offsetX) <= 0.1 : Math.abs(offsetY) <= 0.1) {
            clearInterval(intervalRef.current);
          }
        }, 16);
      }

      isFirstMove.current = false;
    }
  };

  const onTouchEnd = () => {
    touchedRef.current = false;
    isFirstMove.current = true;
    shouldUseOriginScroll.current = false;

    cleanUpEvents();
  };

  const onTouchStart = (e: TouchEvent) => {
    cleanUpEvents();

    if (e.touches.length === 1 && !touchedRef.current) {
      touchedRef.current = true;
      touchXRef.current = e.touches[0].pageX;
      touchYRef.current = e.touches[0].pageY;

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
