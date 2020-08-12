import * as React from 'react';
import { SharedConfig, RenderFunc } from '../interface';

export default function useChildren<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
  refs: Map<React.Key, HTMLElement>,
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
      ref: (instance: HTMLElement) => {
        refs.set(key, instance);
      },
    });
  });
}
