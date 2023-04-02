import { useCallback } from 'react';
import type { MutableRefObject } from 'react';

// keep scrollTop in range 0 ~ maxScrollHeight
const useKeepInRange = (maxScrollSizeRef: MutableRefObject<number>) => {
  return useCallback(
    (newScrollOffset: number) => {
      let newOffset = newScrollOffset;
      if (!Number.isNaN(maxScrollSizeRef.current)) {
        newOffset = Math.min(newOffset, maxScrollSizeRef.current);
      }
      newOffset = Math.max(newOffset, 0);
      return newOffset;
    },
    [maxScrollSizeRef]
  );
};

export default useKeepInRange;
