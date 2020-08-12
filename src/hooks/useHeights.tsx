import * as React from 'react';
import { useRef } from 'react';

export default function useHeights(): [
  Map<React.Key, HTMLElement>,
  () => void,
  Map<React.Key, number>,
  number,
] {
  const [updatedMark, setUpdatedMark] = React.useState(0);
  const instanceRef = useRef(new Map<React.Key, HTMLElement>());
  const heightsRef = useRef(new Map<React.Key, number>());

  function collectHeight() {
    instanceRef.current.forEach((element, key) => {
      if (element) {
        heightsRef.current.set(key, element.offsetHeight);
      }
    });
    setUpdatedMark(c => c + 1);
  }

  return [instanceRef.current, collectHeight, heightsRef.current, updatedMark];
}
