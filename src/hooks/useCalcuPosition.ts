import type CacheMap from '../utils/CacheMap';
import type { ScrollToCacheState } from '../utils/scrollToCacheState';
import { MEASURE } from '../utils/scrollToCacheState';
import React, { useRef } from 'react';

export function useCalcuPosition<T>(
  scrollToCacheState: ScrollToCacheState,
  fillerInnerRef: React.MutableRefObject<HTMLDivElement>,
  getKey: (item: T) => React.Key,
  inVirtual: boolean,
  heights: CacheMap,
  itemHeight: number,
  useVirtual: boolean,
  offsetTop: number,
  mergedData: T[],
  heightUpdatedMark: number,
  height: number,
): [number, number, number, number, number, number, React.MutableRefObject<number>] {
  const lastScrollInfos = useRef<[number, number, number, number]>([0, 0, 0, 0]);
  const [
    lastScrollHeight,
    lastfillerOffset,
    lastStartIndex,
    lastEndIndex,
  ] = lastScrollInfos.current;

  const maxScrollHeightRef = useRef(-1);

  const { scrollHeight, start, end, offset: fillerOffset } = React.useMemo(() => {
    if (!useVirtual) {
      return {
        scrollHeight: undefined,
        start: 0,
        end: mergedData.length - 1,
        offset: undefined,
      };
    }

    // Always use virtual scroll bar in avoid shaking
    if (!inVirtual) {
      return {
        scrollHeight: fillerInnerRef.current?.offsetHeight || 0,
        start: 0,
        end: mergedData.length - 1,
        offset: undefined,
      };
    }

    let itemTop = 0;
    let startIndex: number;
    let startOffset: number;
    let endIndex: number;

    const dataLen = mergedData.length;
    for (let i = 0; i < dataLen; i += 1) {
      const item = mergedData[i];
      const key = getKey(item);

      const cacheHeight = heights.get(key);
      const currentItemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);

      // Check item top in the range
      if (currentItemBottom >= offsetTop && startIndex === undefined) {
        startIndex = i;
        startOffset = itemTop;
      }

      // Check item bottom in the range. We will render additional one item for motion usage
      if (currentItemBottom > offsetTop + height && endIndex === undefined) {
        endIndex = i;
      }

      itemTop = currentItemBottom;
    }

    // When scrollTop at the end but data cut to small count will reach this
    if (startIndex === undefined) {
      startIndex = 0;
      startOffset = 0;

      endIndex = Math.ceil(height / itemHeight);
    }
    if (endIndex === undefined) {
      endIndex = mergedData.length - 1;
    }

    // Give cache to improve scroll experience
    endIndex = Math.min(endIndex + 1, mergedData.length - 1);

    const result = {
      scrollHeight: itemTop,
      start: startIndex,
      end: endIndex,
      offset: startOffset,
    };

    // scrollToCacheState means listChildren is not correct, just use last offset to avoid seeing nothing.
    if (scrollToCacheState === MEASURE) {
      // makes `keepInRange` pass new `offsetTop`
      maxScrollHeightRef.current = Math.max(lastScrollHeight, itemTop) - height;

      return {
        ...result,
        offset: lastfillerOffset,
        scrollHeight: lastScrollHeight,
      };
    }

    lastScrollInfos.current = [itemTop, startOffset, startIndex, endIndex];

    return result;
  }, [inVirtual, useVirtual, offsetTop, mergedData, heightUpdatedMark, height, scrollToCacheState]);

  // =============================== maxScrollHeight for `In Range` ===============================
  const maxScrollHeight = scrollHeight - height;
  // init
  if (maxScrollHeightRef.current === -1) {
    maxScrollHeightRef.current = maxScrollHeight;
  }
  if (scrollToCacheState !== MEASURE) {
    maxScrollHeightRef.current = maxScrollHeight;
  }

  return [scrollHeight, start, end, lastStartIndex, lastEndIndex, fillerOffset, maxScrollHeightRef];
}
