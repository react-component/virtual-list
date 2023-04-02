import { useMemo } from 'react';
import type { IUseIsEnableVirtualParams } from '../types';

const useIsEnableVirtual = (params: IUseIsEnableVirtualParams) => {
  const { isEnableVirtual, containerSize, itemSize } = params;

  const enableVirtual = useMemo(() => {
    return Boolean(isEnableVirtual && containerSize && itemSize);
  }, [isEnableVirtual, containerSize, itemSize]);

  return enableVirtual;
};

export default useIsEnableVirtual;
