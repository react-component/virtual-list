import * as React from 'react';
import type { SharedConfig, RenderFunc } from '../interface';
import { Item } from '../Item';
import type { ListProps } from '..';

export default function useChildren<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
  scrollWidth: number,
  setNodeRef: (item: T, element: HTMLElement) => void,
  renderFunc: RenderFunc<T>,
  { getKey }: SharedConfig<T>,
  customListRender?: ListProps<T>['customListRender'],
) {
  return (customListRender
    ? customListRender(list, startIndex, endIndex)
    : list.slice(startIndex, endIndex + 1)
  ).map((item, index) => {
    const eleIndex = startIndex + index;
    const node = renderFunc(item, eleIndex, {
      style: {
        width: scrollWidth,
      },
    }) as React.ReactElement;

    const key = getKey(item);
    return (
      <Item key={key} setRef={(ele) => setNodeRef(item, ele)}>
        {node}
      </Item>
    );
  });
}
