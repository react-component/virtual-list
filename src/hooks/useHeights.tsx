import * as React from 'react';
import { useRef } from 'react';
import raf from 'raf';

export function useHeights(): [
  (key: React.Key, height: number) => void,
  Map<React.Key, number>,
  number,
] {
  const [updatedMark, setUpdatedMark] = React.useState(0);
  const heights = useRef(new Map<React.Key, number>());
  const rafRef = useRef(null);

  function collectHeight(key: React.Key, height: number) {
    heights.current.set(key, height);

    // Update only once in a frame
    raf.cancel(rafRef.current);
    rafRef.current = raf(() => {
      setUpdatedMark(c => c + 1);
    });
  }

  return [collectHeight, heights.current, updatedMark];
}
