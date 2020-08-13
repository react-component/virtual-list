import * as React from 'react';
import { SharedConfig, RenderFunc } from '../interface';

export default function useChildren<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
  getInstanceRefFunc: (item: T) => (instance: HTMLElement) => void,
  renderFunc: RenderFunc<T>,
  { getKey }: SharedConfig<T>,
) {
  return list.slice(startIndex, endIndex + 1).map((item, index) => {
    const eleIndex = startIndex + index;
    const node = renderFunc(item, eleIndex, {
      // style: status === 'MEASURE_START' ? { visibility: 'hidden' } : {},
    }) as React.ReactElement;

    const key = getKey(item);
    return React.cloneElement(node, {
      key,
      ref: getInstanceRefFunc(item),
    });
  });
}
