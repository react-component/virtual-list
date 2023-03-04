import type { IListProps } from "../types";

const useIsVirtualMode = <T>(props: IListProps<T>, isUseVirtual: boolean): boolean => {
  const {
    containerSize,
    itemSize,
    data,
  } = props

  return isUseVirtual && data && itemSize * data.length > containerSize;
};

export default useIsVirtualMode;