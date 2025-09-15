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
  // 可能存在 list 不变但是里面的数据存在变化的情况，会与之前写法存在不同的行为
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
