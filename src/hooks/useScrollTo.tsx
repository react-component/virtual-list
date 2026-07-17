import * as React from 'react';
import { raf, useLayoutEffect, warning } from '@rc-component/util';
import type { GetKey, GetSize } from '../interface';
import type CacheMap from '../utils/CacheMap';

const MAX_TIMES = 10;

export type ScrollAlign = 'top' | 'bottom' | 'auto';

export type ScrollPos = {
  left?: number;
  top?: number;
};

export interface ScrollOffsetInfo {
  /**
   * Get item size range by key.
   * 通过 key 获取元素在虚拟列表中的尺寸范围。
   */
  getSize: GetSize;
  /**
   * Resolved align direction. For `auto` this reads `'auto'` on the first
   * measure pass (before the direction is decided) and settles to
   * `'top'`/`'bottom'` on the pass that actually positions the item.
   *
   * 已解析的对齐方向。auto 在首帧测量时仍是 'auto'，定向后变 'top'/'bottom'。
   */
  align: ScrollAlign;
}

export type ScrollOffset = number | ((info: ScrollOffsetInfo) => number);

export type ScrollTarget =
  | {
      index: number;
      align?: ScrollAlign;
      offset?: ScrollOffset;
    }
  | {
      key: React.Key;
      align?: ScrollAlign;
      offset?: ScrollOffset;
    };

function getOffset(rawOffset: ScrollOffset, info: ScrollOffsetInfo) {
  const resolvedOffset = typeof rawOffset === 'function' ? rawOffset(info) : rawOffset;

  return Number.isFinite(resolvedOffset) ? resolvedOffset : 0;
}

export default function useScrollTo<T>(
  containerRef: React.RefObject<HTMLDivElement>,
  data: T[],
  heights: CacheMap,
  itemHeight: number,
  getKey: GetKey<T>,
  getSize: GetSize,
  collectHeight: () => void,
  syncScrollTop: (newTop: number) => void,
  triggerFlash: () => void,
): (arg: number | ScrollTarget) => void {
  const scrollRef = React.useRef<number | undefined>(undefined);

  const [syncState, setSyncState] = React.useState<{
    times: number;
    index: number;
    offset: ScrollOffset;
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

      const { targetAlign, originAlign, index, offset: rawOffset } = syncState;
      const mergedAlign = targetAlign || originAlign;
      const offset = getOffset(rawOffset, { getSize, align: mergedAlign });

      const height = containerRef.current.clientHeight;
      let needCollectHeight = false;
      let newTargetAlign: 'top' | 'bottom' | null = targetAlign;
      let targetTop: number | null = null;

      // Go to next frame if height not exist
      if (height) {
        // Get top & bottom
        let itemTop = 0;
        let itemBottom = 0;

        const maxLen = Math.min(data.length - 1, index);

        for (let i = 0; i <= maxLen; i += 1) {
          const key = getKey(data[i]);
          itemTop = itemBottom;
          const cacheHeight = heights.get(key);
          itemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);
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

      const { offset: rawOffset = 0 } = arg;

      setSyncState({
        times: 0,
        index,
        offset: rawOffset,
        originAlign: align,
      });
    }
  };
}
