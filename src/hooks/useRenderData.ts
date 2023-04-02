import { useMemo } from 'react';
import type { RefObject, Key } from 'react';
import type { IGetKey } from '../types';

export interface IUseRenderDataParams<T> {
  isVirtualMode: boolean;
  isEnableVirtual: boolean;
  isHorizontalMode: boolean;
  isStaticItem: boolean;
  containerSize: number;
  itemSize: number;
  defaultRenderCount: number;
  scrollOffset: number;
  data: T[];
  updatedMark: number;
  fillerInnerRef: RefObject<HTMLDivElement | null>;
  getKey: IGetKey<T>;
  getRectSizeByKey: (key: Key) => number | undefined;
}

/**
 * Visible Calculation
 *
 * scrollSize: container max width or height
 * startIndex  the first item index to be rendered
 * endIndex: the last item index to be rendered
 * offset: the left or top  of start item position
 *  */

const useRenderData = <T>({
  isVirtualMode,
  isEnableVirtual,
  isHorizontalMode,
  isStaticItem,
  containerSize: rawContainerSize,
  itemSize,
  defaultRenderCount,
  scrollOffset,
  data,
  updatedMark,
  fillerInnerRef,
  getKey,
  getRectSizeByKey,
}: IUseRenderDataParams<T>) => {
  return useMemo(() => {
    if (!isEnableVirtual) {
      return {
        scrollSize: undefined,
        startIndex: 0,
        endIndex: data.length - 1,
        offset: undefined,
      };
    }

    // Always use virtual scroll bar in avoid shaking
    if (!isVirtualMode) {
      const _scrollSize = fillerInnerRef.current?.[isHorizontalMode ? 'offsetWidth' : 'offsetHeight'] || 0;
      return {
        scrollSize: _scrollSize,
        startIndex: 0,
        endIndex: data.length - 1,
        offset: undefined,
      };
    }

    const dataLen = data.length;

    let itemStart = 0;
    let startIdx: number | undefined, firstChildOffset: number | undefined, endIdx: number | undefined;

    // optimization static item
    const containerSize = rawContainerSize || 0;
    if (isStaticItem && itemSize) {
      startIdx = Math.max(Math.ceil(scrollOffset / itemSize) - 1, 0);
      endIdx = Math.max(Math.ceil((scrollOffset + containerSize) / itemSize) - 1, 1);
      firstChildOffset = itemSize * startIdx;

      return {
        scrollSize: itemSize * dataLen,
        startIndex: startIdx,
        endIndex: endIdx,
        offset: firstChildOffset,
      };
    }

    for (let i = 0; i < dataLen; i += 1) {
      const item = data[i];
      const key = getKey(item);

      const cacheSize = getRectSizeByKey(key);
      const currentItemSize = (cacheSize ?? itemSize) || 0;
      const currentItemEnd = itemStart + currentItemSize;
      // Check if item in the viewport range and check if the first viewport item
      if (currentItemEnd >= scrollOffset && startIdx === undefined) {
        startIdx = i;
        firstChildOffset = itemStart;
      }

      // Check item end in the range. We will render additional one item for motion usage
      const viewportEnd = scrollOffset + containerSize;
      if (currentItemEnd > viewportEnd && endIdx === undefined) {
        endIdx = i;
      }

      itemStart = currentItemEnd; // update next item start position
    }

    // When scrollOffset at the end but data cut to small count will reach this
    if (startIdx === undefined) {
      startIdx = 0;
      firstChildOffset = 0;

      endIdx = defaultRenderCount;
    }

    if (endIdx === undefined) {
      endIdx = data.length - 1;
    }

    // Give cache to improve scroll experience
    endIdx = Math.min(endIdx + 1, data.length);

    return {
      scrollSize: itemStart,
      startIndex: startIdx,
      endIndex: endIdx,
      offset: firstChildOffset,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isVirtualMode,
    isEnableVirtual,
    isHorizontalMode,
    isStaticItem,
    rawContainerSize,
    itemSize,
    defaultRenderCount,
    scrollOffset,
    data,
    updatedMark,
    fillerInnerRef,
    getKey,
    getRectSizeByKey,
  ]);
};

export default useRenderData;
