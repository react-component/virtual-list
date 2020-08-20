/* eslint-disable no-param-reassign */
import * as React from 'react';
import raf from 'rc-util/lib/raf';
import { ScrollTo } from '../List';
import { GetKey } from '../interface';
import CacheMap from '../utils/CacheMap';

export default function useScrollTo<T>(
  containerRef: React.RefObject<HTMLDivElement>,
  data: T[],
  heights: CacheMap,
  itemHeight: number,
  getKey: GetKey<T>,
  collectHeight: () => void,
  syncScrollTop: (newTop: number) => void,
): ScrollTo {
  const scrollRef = React.useRef<number>();

  return arg => {
    raf.cancel(scrollRef.current);

    if (typeof arg === 'number') {
      syncScrollTop(arg);
    } else if (arg && typeof arg === 'object') {
      let index: number;
      const { align } = arg;

      if ('index' in arg) {
        ({ index } = arg);
      } else {
        index = data.findIndex(item => getKey(item) === arg.key);
      }

      // We will retry 3 times in case dynamic height shaking
      const syncScroll = (times: number, targetAlign?: 'top' | 'bottom') => {
        if (times < 0 || !containerRef.current) return;

        const height = containerRef.current.clientHeight;
        const mergedAlign = targetAlign || align;

        // Get top & bottom
        let stackTop = 0;
        let itemTop = 0;
        let itemBottom = 0;
        let needCollectHeight = false;

        for (let i = 0; i <= index; i += 1) {
          const key = getKey(data[i]);
          itemTop = stackTop;
          const cacheHeight = heights.get(key);
          itemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);

          stackTop = itemBottom;

          if (i === index && cacheHeight === undefined) {
            needCollectHeight = true;
          }
        }

        // Scroll to
        let targetTop: number | null = null;
        let newTargetAlign: 'top' | 'bottom' | null = targetAlign;

        switch (mergedAlign) {
          case 'top':
            targetTop = itemTop;
            break;
          case 'bottom':
            targetTop = itemBottom - height;
            break;

          default: {
            const { scrollTop } = containerRef.current;
            const scrollBottom = scrollTop + height;
            if (itemTop < scrollTop) {
              newTargetAlign = 'top';
            } else if (itemBottom > scrollBottom) {
              newTargetAlign = 'bottom';
            }
          }
        }

        if (targetTop !== null && targetTop !== containerRef.current.scrollTop) {
          syncScrollTop(targetTop);
        }

        // We will retry since element may not sync height as it described
        scrollRef.current = raf(() => {
          if (needCollectHeight) {
            collectHeight();
          }
          syncScroll(times - 1, newTargetAlign);
        });
      };

      syncScroll(3);
    }
  };
}
