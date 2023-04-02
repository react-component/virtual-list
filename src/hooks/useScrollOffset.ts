import { useCallback, useMemo, useState } from 'react';
import useIsHorizontalMode from './useIsHorizontalMode';
import type { IDirection } from '../types';

const useScrollOffset = (direction: IDirection) => {
  const isHorizontalMode = useIsHorizontalMode(direction);
  const [scrollTop, setScrollTop] = useState(0); // current scroll top
  const [scrollLeft, setScrollLeft] = useState(0); // current scroll top

  const scrollOffset = useMemo(() => {
    return isHorizontalMode ? scrollLeft : scrollTop;
  }, [isHorizontalMode, scrollLeft, scrollTop]);

  const setScrollOffset = useCallback(
    (offset: number | ((offset: number) => number)) => {
      return isHorizontalMode ? setScrollLeft(offset) : setScrollTop(offset);
    },
    [isHorizontalMode]
  );

  return [scrollOffset, setScrollOffset] as const;
};

export default useScrollOffset;
