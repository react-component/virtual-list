import { useCallback } from 'react';
import type { MutableRefObject } from 'react';

const useSyncScrollOffset = (
  isHorizontalMode: boolean,
  componentRef: MutableRefObject<HTMLElement | null>,
  keepInRange: (scrollOffset: number) => number,
  setScrollOffset: any
) => {
  return useCallback(
    (newOffset: number | ((prev: number) => number)) => {
      setScrollOffset((rawOffset: number) => {
        const value = typeof newOffset === 'function' ? newOffset(rawOffset) : newOffset;
        const alignedOffset = keepInRange(value);

        const field = isHorizontalMode ? 'scrollLeft' : 'scrollTop';
        if (componentRef.current) {
          componentRef.current[field] = alignedOffset;
        }
        return alignedOffset;
      });
    },
    [isHorizontalMode, componentRef, keepInRange, setScrollOffset]
  );
};

export default useSyncScrollOffset;
