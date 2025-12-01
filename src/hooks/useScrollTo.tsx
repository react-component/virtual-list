/* eslint-disable no-param-reassign */
import * as React from 'react';
import raf from '@rc-component/util/lib/raf';
import type { GetKey } from '../interface';
import type CacheMap from '../utils/CacheMap';
import useLayoutEffect from '@rc-component/util/lib/hooks/useLayoutEffect';
import { warning } from '@rc-component/util';

const MAX_TIMES = 10;

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
    lastTop?: number;
  }>(null);

  // ========================== Sync Scroll ==========================
  useLayoutEffect(() => {
    if (syncState && syncState.times < MAX_TIMES) {
      // Never reach
      if (!containerRef.current) {
        setSyncState((ori) => ({ ...ori }));
        return;
      }

      collectHeight();

      const { targetAlign, originAlign, index, offset } = syncState;

      const height = containerRef.current.clientHeight;
      let needCollectHeight = false;
      let newTargetAlign: 'top' | 'bottom' | null = targetAlign;
      let targetTop: number | null = null;

      // Go to next frame if height not exist
      if (height) {
        const mergedAlign = targetAlign || originAlign;

        // Get top & bottom
        let stackTop = 0;
        let itemTop = 0;
        let itemBottom = 0;

        const maxLen = Math.min(data.length - 1, index);

        for (let i = 0; i <= maxLen; i += 1) {
          const key = getKey(data[i]);
          itemTop = stackTop;
          const cacheHeight = heights.get(key);
          itemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);

          stackTop = itemBottom;
        }

        // Check if need sync height (visible range has item not record height)
        let leftHeight = mergedAlign === 'top' ? offset : height - offset;
        for (let i = maxLen; i >= 0; i -= 1) {
          const key = getKey(data[i]);
          const cacheHeight = heights.get(key);

          if (cacheHeight === undefined) {
            needCollectHeight = true;
            break;
          }

          leftHeight -= cacheHeight;
          if (leftHeight <= 0) {
            break;
          }
        }

        // Scroll to
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

        if (targetTop !== null) {
          syncScrollTop(targetTop);
        }

        // One more time for sync
        if (targetTop !== syncState.lastTop) {
          needCollectHeight = true;
        }
      }

      // Trigger next effect
      if (needCollectHeight) {
        setSyncState({
          ...syncState,
          times: syncState.times + 1,
          targetAlign: newTargetAlign,
          lastTop: targetTop,
        });
      }
    } else if (process.env.NODE_ENV !== 'production' && syncState?.times === MAX_TIMES) {
      warning(
        false,
        'Seems `scrollTo` with `rc-virtual-list` reach the max limitation. Please fire issue for us. Thanks.',
      );
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
