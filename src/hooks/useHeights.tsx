import findDOMNode from 'rc-util/lib/Dom/findDOMNode';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import type { GetKey } from '../interface';
import CacheMap from '../utils/CacheMap';

function parseNumber(value: string) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

export default function useHeights<T>(
  getKey: GetKey<T>,
  onItemAdd?: (item: T) => void,
  onItemRemove?: (item: T) => void,
): [
  setInstanceRef: (item: T, instance: HTMLElement) => void,
  collectHeight: (sync?: boolean) => void,
  cacheMap: CacheMap,
  updatedMark: number,
] {
  const [updatedMark, setUpdatedMark] = React.useState(0);
  const instanceRef = useRef(new Map<React.Key, HTMLElement>());
  const heightsRef = useRef(new CacheMap());

  const promiseIdRef = useRef<number>(0);

  function cancelRaf() {
    promiseIdRef.current += 1;
  }

  function collectHeight(sync = false) {
    cancelRaf();

    const doCollect = () => {
      let changed = false;

      instanceRef.current.forEach((element, key) => {
        if (element && element.offsetParent) {
          const htmlElement = findDOMNode<HTMLElement>(element);
          const { offsetHeight } = htmlElement;
          const { marginTop, marginBottom } = getComputedStyle(htmlElement);

          const marginTopNum = parseNumber(marginTop);
          const marginBottomNum = parseNumber(marginBottom);
          const totalHeight = offsetHeight + marginTopNum + marginBottomNum;

          if (heightsRef.current.get(key) !== totalHeight) {
            heightsRef.current.set(key, totalHeight);
            changed = true;
          }
        }
      });

      // Always trigger update mark to tell parent that should re-calculate heights when resized
      if (changed) {
        setUpdatedMark((c) => c + 1);
      }
    };

    if (sync) {
      doCollect();
    } else {
      promiseIdRef.current += 1;
      const id = promiseIdRef.current;
      Promise.resolve().then(() => {
        if (id === promiseIdRef.current) {
          doCollect();
        }
      });
    }
  }

  function setInstanceRef(item: T, instance: HTMLElement) {
    const key = getKey(item);
    const origin = instanceRef.current.get(key);

    if (instance) {
      instanceRef.current.set(key, instance);
      collectHeight();
    } else {
      instanceRef.current.delete(key);
    }

    // Instance changed
    if (!origin !== !instance) {
      if (instance) {
        onItemAdd?.(item);
      } else {
        onItemRemove?.(item);
      }
    }
  }

  useEffect(() => {
    return cancelRaf;
  }, []);

  return [setInstanceRef, collectHeight, heightsRef.current, updatedMark];
}
