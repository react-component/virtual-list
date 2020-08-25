import { useRef } from 'react';
import raf from 'rc-util/lib/raf';
import isFF from '../utils/isFirefox';

interface FireFoxDOMMouseScrollEvent {
  detail: number;
  preventDefault: Function;
}

export default function useFrameWheel(
  inVirtual: boolean,
  onWheelDelta: (offset: number) => void,
): [(e: WheelEvent) => void, (e: FireFoxDOMMouseScrollEvent) => void] {
  const offsetRef = useRef(0);
  const nextFrameRef = useRef<number>(null);

  // Firefox patch
  const wheelValueRef = useRef<number>(null);
  const isMouseScrollRef = useRef<boolean>(false);

  function onWheel(event: WheelEvent) {
    if (!inVirtual) return;

    // Proxy of scroll events
    if (!isFF) {
      event.preventDefault();
    }

    raf.cancel(nextFrameRef.current);

    offsetRef.current += event.deltaY;
    wheelValueRef.current = event.deltaY;

    nextFrameRef.current = raf(() => {
      // Patch a multiple for Firefox to fix wheel number too small
      // ref: https://github.com/ant-design/ant-design/issues/26372#issuecomment-679460266
      const patchMultiple = isMouseScrollRef.current ? 10 : 1;
      onWheelDelta(offsetRef.current * patchMultiple);
      offsetRef.current = 0;
    });
  }

  // A patch for firefox
  function onFireFoxScroll(event: FireFoxDOMMouseScrollEvent) {
    if (!inVirtual) return;

    // Firefox level stop
    event.preventDefault();

    isMouseScrollRef.current = event.detail === wheelValueRef.current;
  }

  return [onWheel, onFireFoxScroll];
}
