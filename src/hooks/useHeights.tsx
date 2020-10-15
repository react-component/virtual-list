import * as React from 'react';
import { useRef } from 'react';
import findDOMNode from 'rc-util/lib/Dom/findDOMNode';
import { GetKey } from '../interface';
import CacheMap from '../utils/CacheMap';

type RefFunc = (instance: HTMLElement) => void;

export default function useHeights<T>(
  getKey: GetKey<T>,
  onItemAdd?: (item: T) => void,
  onItemRemove?: (item: T) => void,
): [(item: T, instance: HTMLElement) => void, () => void, CacheMap, number] {
  const [updatedMark, setUpdatedMark] = React.useState(0);
  const instanceRef = useRef(new Map<React.Key, HTMLElement>());
  const heightsRef = useRef(new CacheMap());
  const heightUpdateIdRef = useRef(0);

  function collectHeight() {
    heightUpdateIdRef.current += 1;
    const currentId = heightUpdateIdRef.current;

    Promise.resolve().then(() => {
      // Only collect when it's latest call
      if (currentId !== heightUpdateIdRef.current) return;

      instanceRef.current.forEach((element, key) => {
        if (element && element.offsetParent) {
          const htmlElement = findDOMNode<HTMLElement>(element);
          const { offsetHeight } = htmlElement;
          if (heightsRef.current.get(key) !== offsetHeight) {
            heightsRef.current.set(key, htmlElement.offsetHeight);
          }
        }
      });

      // Always trigger update mark to tell parent that should re-calculate heights when resized
      setUpdatedMark(c => c + 1);
    });
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

  return [setInstanceRef, collectHeight, heightsRef.current, updatedMark];
}
