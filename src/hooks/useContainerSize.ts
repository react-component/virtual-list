import { useState } from 'react';
import type { Dispatch } from 'react';

const useContainerSize = (rawContainerSize?: number | string): [number, Dispatch<React.SetStateAction<number>>] => {
  const [containerSize, updateContainerSize] = useState<number>(() => {
      if(!rawContainerSize || typeof rawContainerSize === 'string') {
        return 0;
      }
      return rawContainerSize;
  });

  return [containerSize, updateContainerSize];
};

export default useContainerSize;
