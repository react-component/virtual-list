import type { IListProps } from "../types";

const useIsEnableVirtual = <T>(props: IListProps<T>) => {
  const {
    containerSize,
    itemSize,
    enableVirtualMode,
  } = props

  return !!(enableVirtualMode !== false && containerSize && itemSize);
}

export default useIsEnableVirtual;