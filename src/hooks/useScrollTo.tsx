import raf from 'rc-util/es/raf';
import { useCallback, useRef } from 'react';
import type { Key, RefObject } from 'react';
import type { IGetKey, IScrollTo, ITargetAlign } from '../types';

export default function useScrollTo<T>(
  isHorizontalMode: boolean,
  containerRef: RefObject<HTMLDivElement>,
  data: T[],
  getRectSizeByKey: (key: Key) => number | undefined,
  itemSize: number,
  getKey: IGetKey<T>,
  collectRectSize: () => void,
  syncScrollOffset: (newOffset: number) => void,
  triggerFlash: () => void,
): IScrollTo {
  const scrollRef = useRef<number>();

  const scrollTo = useCallback(
    (arg) => {
      // When not argument provided, we think dev may want to show the scrollbar
      if (arg === null || arg === undefined) {
        triggerFlash();
        return;
      }

      // Normal scroll logic
      if (scrollRef.current) {
        raf.cancel(scrollRef.current);
      }

      if (typeof arg === 'number') {
        syncScrollOffset(arg);
      } else if (arg && typeof arg === 'object') {
        let index: number;
        const { align } = arg;

        if ('index' in arg) {
          ({ index } = arg);
        } else {
          index = data.findIndex((item) => getKey(item) === arg.key);
        }

        const offset: number = arg?.offset || 0;

        // We will retry 3 times in case dynamic height shaking
        const syncScroll = (tryCount: number, targetAlign?: ITargetAlign) => {
          if (tryCount < 0 || !containerRef.current) {
            return;
          }

          const clientSize =
            containerRef.current[isHorizontalMode ? 'clientWidth' : 'clientHeight'];
          let needCollectSize = false;
          let newTargetAlign: ITargetAlign | undefined = targetAlign;

          // Go to next frame if height not exist
          if (clientSize) {
            const mergedAlign = targetAlign || align;

            // Get start & end
            let stackStart = 0;
            let itemStart = 0;
            let itemEnd = 0;

            const maxLen = Math.min(data.length, index);

            for (let i = 0; i <= maxLen; i += 1) {
              const key = getKey(data[i]);
              itemStart = stackStart;
              const cachedRectSize = getRectSizeByKey(key);
              itemEnd = itemStart + (cachedRectSize === undefined ? itemSize : cachedRectSize);

              stackStart = itemEnd;

              if (i === index && cachedRectSize === undefined) {
                needCollectSize = true;
              }
            }

            // Scroll to
            let targetStart: number | null = null;

            switch (mergedAlign) {
              case 'start':
                targetStart = itemStart - offset;
                break;
              case 'end':
                targetStart = itemEnd - clientSize + offset;
                break;

              default: {
                const scrollStart =
                  containerRef.current[isHorizontalMode ? 'scrollLeft' : 'scrollTop'];
                const scrollEnd = scrollStart + clientSize;
                if (itemStart < scrollStart) {
                  newTargetAlign = 'start';
                } else if (itemEnd > scrollEnd) {
                  newTargetAlign = 'end';
                }
              }
            }

            if (
              targetStart !== null &&
              targetStart !== containerRef.current[isHorizontalMode ? 'scrollLeft' : 'scrollTop']
            ) {
              syncScrollOffset(targetStart);
            }
          }

          // We will retry since element may not sync height as it described
          scrollRef.current = raf(() => {
            if (needCollectSize) {
              collectRectSize();
            }
            syncScroll(tryCount - 1, newTargetAlign);
          }, 2); // Delay 2 to wait for List collect heights
        };

        syncScroll(3);
      }
    },
    [
      isHorizontalMode,
      containerRef,
      data,
      getRectSizeByKey,
      itemSize,
      getKey,
      collectRectSize,
      syncScrollOffset,
      triggerFlash,
    ],
  );

  return scrollTo;
}
