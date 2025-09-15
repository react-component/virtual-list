import * as React from 'react';
import type { RenderFunc, GetKey } from '../interface';
import { Item } from '../Item';

export default function useChildren<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
  scrollWidth: number,
  offsetX: number,
  setNodeRef: (item: T, element: HTMLElement) => void,
  renderFunc: RenderFunc<T>,
  getKey: GetKey<T>,
) {
  // The list reference may remain unchanged, but its internal data may change, which can result in different behavior compared to the previous implementation.  
  return React.useMemo(() => {
    return list.slice(startIndex, endIndex + 1).map((item, index) => {
      const eleIndex = startIndex + index;
      const node = renderFunc(item, eleIndex, {
        style: {
          width: scrollWidth,
        },
        offsetX,
      }) as React.ReactElement;

      const key = getKey(item);
      return (
        <Item key={key} setRef={(ele) => setNodeRef(item, ele)}>
          {node}
        </Item>
      );
    });
  }, [list, startIndex, endIndex, setNodeRef, renderFunc, getKey, offsetX, scrollWidth]);
}
