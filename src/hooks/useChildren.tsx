import * as React from 'react';
import ResizeObserver from 'rc-resize-observer';
import { SharedConfig, RenderFunc } from '../interface';

export function useChildren<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
  onCollectHeight: (key: React.Key, height: number) => void,
  renderFunc: RenderFunc<T>,
  { getKey }: SharedConfig<T>,
) {
  return list.slice(startIndex, endIndex + 1).map((item, index) => {
    const eleIndex = startIndex + index;
    const node = renderFunc(item, eleIndex, {
      // style: status === 'MEASURE_START' ? { visibility: 'hidden' } : {},
    }) as React.ReactElement;

    const key = getKey(item);
    return (
      <ResizeObserver
        onResize={({ offsetHeight }) => {
          onCollectHeight(key, offsetHeight);
        }}
        key={key}
      >
        {node}
      </ResizeObserver>
    );
  });
}
