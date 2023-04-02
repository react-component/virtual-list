import React, { useMemo } from 'react';
import { Item } from '../Item';
import type { ReactElement } from 'react';
import type { IContext, IRenderFunc } from '../types';

export default function useChildren<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
  cacheElement: (item: T, element: HTMLElement) => void,
  renderFunc: IRenderFunc<T>,
  { getKey }: IContext<T>,
) {
  return useMemo(() => {
    return list.slice(startIndex, endIndex + 1).map((item, index) => {
      const eleIndex = startIndex + index;
      const element = renderFunc(item, eleIndex, {
        // style: status === 'MEASURE_START' ? { visibility: 'hidden' } : {},
      }) as ReactElement;

      const key = getKey(item);
      return (
        <Item key={key} setRef={(ele) => cacheElement(item, ele)}>
          {element}
        </Item>
      );
    });
  }, [list, startIndex, endIndex, cacheElement, getKey]);
}
