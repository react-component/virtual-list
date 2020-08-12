import * as React from 'react';
import { findListDiffIndex } from '../utils/algorithmUtil';
import { GetKey } from '../interface';

export default function useDiffItem<T>(data: T[], getKey: GetKey<T>) {
  const [prevData, setPrevData] = React.useState(data);
  const [diffItem, setDiffItem] = React.useState(null);

  React.useEffect(() => {
    const diff = findListDiffIndex(prevData || [], data || [], getKey);
    if (diff?.index !== undefined) {
      setDiffItem(data[diff.index]);
    }
    setPrevData(data);
  }, [data]);

  return diffItem;
}
