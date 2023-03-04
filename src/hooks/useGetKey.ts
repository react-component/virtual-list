import { useCallback } from "react";
import type { IGetKey, IItemKey } from "../types";

const useGetKey = <T>(itemKey: IItemKey) => {
  const getKey = useCallback<IGetKey<T>>(
    (item: T) => {
      if (typeof itemKey === 'function') {
        return itemKey(item);
      }
      return item?.[itemKey];
    },
    [itemKey],
  );

  return getKey
}

export default useGetKey