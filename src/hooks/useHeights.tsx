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
): [(item: T) => (instance: HTMLElement) => void, () => void, CacheMap, number] {
  const [updatedMark, setUpdatedMark] = React.useState(0);
  const instanceRef = useRef(new Map<React.Key, HTMLElement>());
  const heightsRef = useRef(new CacheMap());

  const instanceFuncRef = useRef<Map<React.Key, RefFunc>>(new Map());
  function getInstanceRefFunc(item: T) {
    const key = getKey(item);
    if (!instanceFuncRef.current.has(key)) {
      instanceFuncRef.current.set(key, (instance: HTMLElement) => {
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
      });
    }
    return instanceFuncRef.current.get(key);
  }

  function collectHeight() {
    instanceRef.current.forEach((element, key) => {
      if (element && element.offsetParent) {
        const htmlElement = findDOMNode<HTMLElement>(element);
        heightsRef.current.set(key, htmlElement.offsetHeight);
      }
    });
    setUpdatedMark(c => c + 1);
  }

  return [getInstanceRefFunc, collectHeight, heightsRef.current, updatedMark];
}
