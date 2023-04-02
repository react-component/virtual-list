import { useCallback } from 'react';
import type { UIEvent, UIEventHandler } from 'react';

const useFallbackScroll = (
  isHorizontalMode: boolean,
  isVirtualMode: boolean,
  scrollOffset: number,
  syncScrollOffset: (newOffset: number | ((prev: number) => number)) => void,
  onScroll?: UIEventHandler<HTMLElement>
) => {
  return useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      // No need to sync scroll offset when list is not in virtual mode
      if (isVirtualMode) {
        const newScrollOffset = e.currentTarget[isHorizontalMode ? 'scrollLeft' : 'scrollTop'];
        if (newScrollOffset !== scrollOffset) {
          syncScrollOffset(newScrollOffset);
        }
      }

      // Trigger origin scroll event callback
      onScroll?.(e);
    },
    [isHorizontalMode, isVirtualMode, scrollOffset, syncScrollOffset, onScroll]
  );
};

export default useFallbackScroll;
