import { useRef, useEffect, useCallback, useState } from 'react';
import findDOMNode from 'rc-util/es/Dom/findDOMNode';
import raf from 'rc-util/es/raf';
import type { Key } from 'react';
import type { IGetKey } from '../types';

const useHeightCache = () => {
  const cacheRef = useRef(new Map<Key, number>());
  const getHeightByKey = useCallback(
    (key: Key): number | undefined => {
      return cacheRef.current.get(key);
    },
    [cacheRef],
  );
  const udpateHeightByKey = useCallback(
    (key: Key, height: number) => {
      cacheRef.current.set(key, height);
    },
    [cacheRef],
  );
  return [getHeightByKey, udpateHeightByKey] as const;
};

const useWidthCache = () => {
  const cacheRef = useRef(new Map<Key, number>());
  const getWidthByKey = useCallback(
    (key: Key): number | undefined => {
      return cacheRef.current.get(key);
    },
    [cacheRef],
  );
  const udpateWidthByKey = useCallback(
    (key: Key, width: number) => {
      cacheRef.current.set(key, width);
    },
    [cacheRef],
  );
  return [getWidthByKey, udpateWidthByKey] as const;
};

const useRectSizeCache = (isHorizontalMode: boolean) => {
  const [getHeightByKey, updateHeightByKey] = useHeightCache();
  const [getWidthByKey, updateWidthByKey] = useWidthCache();

  const getRectSizeByKey = useCallback(
    (key: Key) => {
      const getter = isHorizontalMode ? getWidthByKey : getHeightByKey;
      return getter(key);
    },
    [isHorizontalMode, getWidthByKey, getHeightByKey],
  );

  const updateRectSizeByKey = useCallback(
    (key: Key, size: number) => {
      const setter = isHorizontalMode ? updateWidthByKey : updateHeightByKey;
      return setter(key, size);
    },
    [isHorizontalMode, updateWidthByKey, updateHeightByKey],
  );

  return [getRectSizeByKey, updateRectSizeByKey] as const;
};

const useCollectRAF = () => {
  const collectRAFRef = useRef<number>();

  const cancelRAF = useCallback(() => {
    if (collectRAFRef.current) {
      raf.cancel(collectRAFRef.current);
    }
  }, [collectRAFRef]);

  const updateCollectRAF = useCallback(
    (rafId: number) => {
      collectRAFRef.current = rafId;
    },
    [collectRAFRef],
  );

  return [cancelRAF, updateCollectRAF] as const;
};

function useElementCache() {
  const elementRef = useRef(new Map<Key, HTMLElement>());

  const forEachElement = useCallback(
    (forEachFn) => {
      elementRef.current.forEach(forEachFn);
    },
    [elementRef],
  );

  const getElementByKey = useCallback(
    (key: Key) => {
      return elementRef.current.get(key);
    },
    [elementRef],
  );

  const updateElementByKey = useCallback(
    (key: Key, element: HTMLElement) => {
      return elementRef.current.set(key, element);
    },
    [elementRef],
  );

  const deleteElementByKey = useCallback(
    (key: Key) => {
      return elementRef.current.delete(key);
    },
    [elementRef],
  );

  return [getElementByKey, forEachElement, updateElementByKey, deleteElementByKey] as const;
}

export default function useInitCache<T>(
  isHorizontalMode: boolean,
  getKey: IGetKey<T>,
  onItemAdd?: (item: T) => void,
  onItemRemove?: (item: T) => void,
): [
  (item: T, instance: HTMLElement) => void,
  () => void,
  (key: Key) => number | undefined,
  number,
] {
  const [updatedMark, setUpdatedMark] = useState(0);
  const [
    getElementByKey,
    forEachElement,
    updateElementByKey,
    deleteElementByKey,
  ] = useElementCache();
  const [getRectSizeByKey, setRectSizeByKey] = useRectSizeCache(isHorizontalMode);
  const [cancelRAF, updateCollectRAF] = useCollectRAF();

  const collectRectSize = useCallback(() => {
    cancelRAF();

    const rafId = raf(() => {
      forEachElement((element: HTMLElement, key: Key) => {
        if (element && element.offsetParent) {
          const htmlElement = findDOMNode<HTMLElement>(element);
          const offsetSize = htmlElement[isHorizontalMode ? 'offsetWidth' : 'offsetHeight'];
          // update item size if item is static and itemSize props is undefined
          if (getRectSizeByKey(key) !== offsetSize) {
            setRectSizeByKey(key, offsetSize);
          }
        }
      });
      // refresh
      // Always trigger update mark to tell parent that should re-calculate site when resized
      setUpdatedMark((c) => c + 1);
    });
    updateCollectRAF(rafId);
  }, [
    isHorizontalMode,
    forEachElement,
    getRectSizeByKey,
    setRectSizeByKey,
    cancelRAF,
    updateCollectRAF,
  ]);

  const updateElement = useCallback(
    (item: T, element: HTMLElement) => {
      const key = getKey(item);
      const cachedElement = getElementByKey(key);

      if (element) {
        updateElementByKey(key, element);
        collectRectSize();
      } else {
        deleteElementByKey(key);
      }

      // Element changed
      if (!cachedElement !== !element) {
        const cb = element ? onItemAdd : onItemRemove;
        cb?.(item);
      }
    },
    [
      getKey,
      getElementByKey,
      updateElementByKey,
      collectRectSize,
      deleteElementByKey,
      onItemAdd,
      onItemRemove,
    ],
  );

  useEffect(() => {
    return cancelRAF;
  }, [cancelRAF]);

  return [updateElement, collectRectSize, getRectSizeByKey, updatedMark];
}
