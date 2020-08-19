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

  function setInstanceRef(item: T, instance: HTMLElement) {
    const key = getKey(item);
    const origin = instanceRef.current.get(key);

    if (instance) {
      instanceRef.current.set(key, instance);
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

  function collectHeight() {
    let changed = false;

    instanceRef.current.forEach((element, key) => {
      if (element && element.offsetParent) {
        const htmlElement = findDOMNode<HTMLElement>(element);
        const { offsetHeight } = htmlElement;
        if (heightsRef.current.get(key) !== offsetHeight) {
          changed = true;
          heightsRef.current.set(key, htmlElement.offsetHeight);
        }
      }
    });
    if (changed) {
      setUpdatedMark(c => c + 1);
    }
  }

  return [setInstanceRef, collectHeight, heightsRef.current, updatedMark];
}
