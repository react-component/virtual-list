import { useMemo } from 'react';

export interface IUseIsVirtualModeParams<T> {
  containerSize?: number;
  itemSize?: number;
  data: T[];
  isUseVirtual: boolean;
}

const useIsVirtualMode = <T>({
  containerSize: rawContainerSize,
  itemSize: rawItemSize,
  data,
  isUseVirtual,
}: IUseIsVirtualModeParams<T>): boolean => {
  const containerSize = rawContainerSize || 0;
  const itemSize = rawItemSize || 0;

  const isVirtualMode = useMemo(() => {
    return isUseVirtual && data && itemSize * data.length > containerSize;
  }, [isUseVirtual, data, itemSize, containerSize]);

  return isVirtualMode;
};

export default useIsVirtualMode;
