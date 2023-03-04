import { findListDiffIndex } from '../utils';
import { useEffect, useState } from 'react';
import type { IGetKey } from '../types';

export default function useDiffItem<T>(
  data: T[],
  getKey: IGetKey<T>,
  onDiff?: (diffIndex: number) => void,
): [T] {
  const [prevData, setPrevData] = useState(data);
  const [diffItem, setDiffItem] = useState(null);

  useEffect(() => {
    const diff = findListDiffIndex(prevData || [], data || [], getKey);
    if (diff?.index !== undefined) {
      onDiff?.(diff.index);
      setDiffItem(data[diff.index]);
    }
    setPrevData(data);
  }, [data]);

  return [diffItem];
}
