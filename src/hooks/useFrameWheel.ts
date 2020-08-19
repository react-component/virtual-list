import { useRef } from 'react';
import raf from 'rc-util/lib/raf';

export default function useFrameWheel(inVirtual: boolean, onWheelDelta: (offset: number) => void) {
  const offsetRef = useRef(0);
  const nextFrameRef = useRef<number>(null);

  function onWheel(event: MouseWheelEvent) {
    if (!inVirtual) return;

    // Proxy of scroll events
    event.preventDefault();

    raf.cancel(nextFrameRef.current);
    offsetRef.current += event.deltaY;

    nextFrameRef.current = raf(() => {
      onWheelDelta(offsetRef.current);
      offsetRef.current = 0;
    });
  }

  return onWheel;
}
