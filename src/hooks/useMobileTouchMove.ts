import { useRef } from 'react';
import useLayoutEffect from 'rc-util/es/hooks/useLayoutEffect';
import type { RefObject } from 'react';

const SMOOTH_PTG = 14 / 15;

export default function useMobileTouchMove(
  isHorizontalMode: boolean,
  inVirtual: boolean,
  listRef: RefObject<HTMLElement>,
  callback: (offset: number, smoothOffset?: boolean) => boolean
) {
  const touchedRef = useRef(false);
  const touchDeltaRef = useRef(0);

  const elementRef = useRef<HTMLElement>();

  // Smooth scroll
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const localClearInterval = (intervalHd?: ReturnType<typeof setInterval>) => {
    if (intervalHd) {
      clearInterval(intervalHd);
    }
  };

  /* eslint-disable prefer-const */
  let cleanUpEvents: () => void;

  const onTouchMove = (e: TouchEvent) => {
    if (touchedRef.current) {
      const currentDelta = Math.ceil(e.touches[0][isHorizontalMode ? 'pageX' : 'pageY']);
      let offset = touchDeltaRef.current - currentDelta;
      touchDeltaRef.current = currentDelta;

      if (callback(offset)) {
        e.preventDefault();
      }

      // Smooth interval
      localClearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        offset *= SMOOTH_PTG;

        if (!callback(offset, true) || Math.abs(offset) <= 0.1) {
          localClearInterval(intervalRef.current);
        }
      }, 16.67);
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
      touchDeltaRef.current = Math.ceil(e.touches[0][isHorizontalMode ? 'pageX' : 'pageY']);

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
    if (inVirtual && listRef.current) {
      listRef.current.addEventListener('touchstart', onTouchStart);
    }

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      listRef.current?.removeEventListener('touchstart', onTouchStart);
      cleanUpEvents();
      localClearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inVirtual]);
}
