import { useCallback } from 'react';
import type { Key } from 'react';
import type { IGetKey } from '../types';

const useGetKey = <T>(itemKey: Key | ((item: T) => Key)) => {
  const getKey = useCallback<IGetKey<T>>((item: T) => {
    if (typeof itemKey === 'function') {
      return itemKey(item);
    }
    return item?.[itemKey];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return getKey;
};

export default useGetKey;
