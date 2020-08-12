/* eslint-disable no-param-reassign */
import * as React from 'react';
import raf from 'raf';
import { ScrollTo } from '../List';
import { GetKey } from '../interface';

export default function useScrollTo<T>(
  containerRef: React.RefObject<HTMLDivElement>,
  data: T[],
  height: number,
  heights: Map<React.Key, number>,
  itemHeight: number,
  getKey: GetKey<T>,
): ScrollTo {
  const scrollRef = React.useRef<number>();

  return arg => {
    raf.cancel(scrollRef.current);

    if (typeof arg === 'number') {
      containerRef.current.scrollTop = arg;
    } else if (arg && typeof arg === 'object') {
      let index: number;
      const { align } = arg;

      if ('index' in arg) {
        ({ index } = arg);
      } else {
        index = data.findIndex(item => getKey(item) === arg.key);
      }

      // We will retry 3 times in case dynamic height shaking
      const syncScroll = (times = 3) => {
        if (times < 0) return;

        scrollRef.current = raf(() => {
          if (!containerRef.current) return;

          // Get top & bottom
          let stackTop = 0;
          let itemTop = 0;
          let itemBottom = 0;

          for (let i = 0; i <= index; i += 1) {
            const key = getKey(data[i]);
            itemTop = stackTop;
            itemBottom = itemTop + (heights.get(key) ?? itemHeight);

            stackTop = itemBottom;
          }

          // Scroll to
          switch (align) {
            case 'top':
              containerRef.current.scrollTop = itemTop;
              break;
            case 'bottom':
              containerRef.current.scrollTop = itemBottom - height;
              break;

            default: {
              const { scrollTop } = containerRef.current;
              const scrollBottom = scrollTop + height;
              if (itemTop < scrollTop) {
                containerRef.current.scrollTop = itemTop;
              } else if (itemBottom > scrollBottom) {
                containerRef.current.scrollTop = itemBottom - height;
              }
            }
          }

          syncScroll(times - 1);
        });
      };

      syncScroll();
    }
  };
}
