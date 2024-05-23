import * as React from 'react';
import type { RenderFunc, SharedConfig } from '../interface';
import { Item } from '../Item';
import { generateIndexesWithSticky } from '../utils/algorithmUtil';
import type CacheMap from '../utils/CacheMap';

export default function useChildren<T>(
  list: T[],
  startIndex: number,
  endIndex: number,
  scrollWidth: number,
  offsetX: number,
  offsetY: number,
  setNodeRef: (item: T, element: HTMLElement) => void,
  renderFunc: RenderFunc<T>,
  { getKey }: SharedConfig<T>,
  heights: CacheMap,
  stickyIndexes: number[] = [],
) {
  // Distance beyond the top of the container
  const startOverContainerTop =
    offsetY -
    list.slice(0, startIndex).reduce((total, item) => total + heights.get(getKey(item)), 0);

  const shouldStickyIndexesAndTop = stickyIndexes
    .sort((a, b) => a - b)
    .reduce<{ index: number; top: number }[]>((total, index) => {
      // The sum of the heights of all sticky elements
      const beforeStickyTotalHeight = total.reduce(
        (height, item) => height + heights.get(getKey(list[item.index])),
        0,
      );
      if (index <= startIndex) {
        total.push({ index, top: startOverContainerTop + beforeStickyTotalHeight });
      } else if (index > startIndex && index < endIndex) {
        // Distance from top of container
        const offsetContainerTop =
          list.slice(0, index).reduce((height, item) => height + heights.get(getKey(item)), 0) -
          (offsetY + startOverContainerTop);

        if (offsetContainerTop <= beforeStickyTotalHeight) {
          total.push({ index, top: startOverContainerTop + beforeStickyTotalHeight });
        }
      }
      return total;
    }, []);

  return generateIndexesWithSticky(
    startIndex,
    endIndex,
    shouldStickyIndexesAndTop.map((i) => i.index),
  ).map((index) => {
    const item = list[index];
    const eleIndex = startIndex + index;
    const stickyInfo = shouldStickyIndexesAndTop.find((i) => i.index === index);
    const node = renderFunc(item, eleIndex, {
      style: {
        ...(scrollWidth
          ? {
              width: scrollWidth,
            }
          : {}),
        ...(stickyInfo
          ? {
              // Use sticky when it exists, use absolute when it disappears
              position: index >= startIndex && index <= endIndex ? 'sticky' : 'absolute',
              top: stickyInfo.top,
            }
          : {}),
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
}
