/* eslint-disable no-param-reassign */
import * as React from 'react';
import raf from 'rc-util/lib/raf';
import type { GetKey } from '../interface';
import type CacheMap from '../utils/CacheMap';
import useLayoutEffect from 'rc-util/lib/hooks/useLayoutEffect';

const MAX_TIMES = 3;

export type ScrollAlign = 'top' | 'bottom' | 'auto';

export type ScrollPos = {
  left?: number;
  top?: number;
};

export type ScrollTarget =
  | {
      index: number;
      align?: ScrollAlign;
      offset?: number;
    }
  | {
      key: React.Key;
      align?: ScrollAlign;
      offset?: number;
    };

export default function useScrollTo<T>(
  containerRef: React.RefObject<HTMLDivElement>,
  data: T[],
  heights: CacheMap,
  itemHeight: number,
  getKey: GetKey<T>,
  collectHeight: () => void,
  syncScrollTop: (newTop: number) => void,
  triggerFlash: () => void,
): (arg: number | ScrollTarget) => void {
  const scrollRef = React.useRef<number>();

  const [syncState, setSyncState] = React.useState<{
    times: number;
    index: number;
    offset: number;
    originAlign: ScrollAlign;
    targetAlign?: 'top' | 'bottom';
  }>(null);

  // ========================== Sync Scroll ==========================
  useLayoutEffect(() => {
    if (syncState && syncState.times < MAX_TIMES) {
      // Never reach
      if (!containerRef.current) {
        setSyncState((ori) => ({ ...ori }));
        return;
      }

      const { targetAlign, originAlign, index, offset } = syncState;

      const height = containerRef.current.clientHeight;
      let needCollectHeight = false;
      let newTargetAlign: 'top' | 'bottom' | null = targetAlign;

      // Go to next frame if height not exist
      if (height) {
        const mergedAlign = targetAlign || originAlign;

        // Get top & bottom
        let stackTop = 0;
        let itemTop = 0;
        let itemBottom = 0;

        const maxLen = Math.min(data.length, index);

        for (let i = 0; i <= maxLen; i += 1) {
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

        switch (mergedAlign) {
          case 'top':
            targetTop = itemTop - offset;
            break;
          case 'bottom':
            targetTop = itemBottom - height + offset;
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
      }

      // Trigger next effect
      if (needCollectHeight) {
        collectHeight();
      }

      setSyncState((ori) => ({
        ...ori,
        times: ori.times + 1,
        targetAlign: newTargetAlign,
      }));
    }
  }, [syncState, containerRef.current]);

  // =========================== Scroll To ===========================
  return (arg) => {
    // When not argument provided, we think dev may want to show the scrollbar
    if (arg === null || arg === undefined) {
      triggerFlash();
      return;
    }

    // Normal scroll logic
    raf.cancel(scrollRef.current);

    if (typeof arg === 'number') {
      syncScrollTop(arg);
    } else if (arg && typeof arg === 'object') {
      let index: number;
      const { align } = arg;

      if ('index' in arg) {
        ({ index } = arg);
      } else {
        index = data.findIndex((item) => getKey(item) === arg.key);
      }

      const { offset = 0 } = arg;

      setSyncState({
        times: 0,
        index,
        offset,
        originAlign: align,
      });
    }
  };
}
