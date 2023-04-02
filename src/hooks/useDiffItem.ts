import { findListDiffIndex } from '../utils';
import { useEffect, useState } from 'react';
import type { IGetKey } from '../types';

export default function useDiffItem<T>(
  data: T[],
  getKey: IGetKey<T>,
  onDiff?: (diffIndex: number) => void
): [T | null] {
  const [prevData, setPrevData] = useState(data);
  const [diffItem, setDiffItem] = useState<T | null>(null);

  useEffect(() => {
    const diff = findListDiffIndex(prevData || [], data || [], getKey);
    if (diff?.index !== undefined) {
      onDiff?.(diff.index);
      setDiffItem(data[diff.index]);
    }
    setPrevData(data);
  }, [prevData, data, getKey, onDiff, setPrevData]);

  return [diffItem];
}
