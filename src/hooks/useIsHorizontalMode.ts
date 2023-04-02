import { useMemo } from 'react';
import { IDirection } from '../types';

const useIsHorizontalMode = (direction: IDirection) => {
  const isHorizontalMode = useMemo(() => {
    return direction === IDirection.Horizontal;
  }, [direction]);
  return isHorizontalMode;
};

export default useIsHorizontalMode;
