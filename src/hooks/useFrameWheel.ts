import { useRef } from 'react';
import { isFF } from '../utils';
import raf from 'rc-util/lib/raf'
import useLockScroll from './useLockScroll';

interface FireFoxDOMMouseScrollEvent {
  detail: number;
  preventDefault: Function;
}

export default function useFrameWheel(
  isHorizontalMode: boolean,
  inVirtual: boolean,
  isScrollAtTop: boolean,
  isScrollAtBottom: boolean,
  onWheelDelta: (offset: number) => void,
): [(e: WheelEvent) => void, (e: FireFoxDOMMouseScrollEvent) => void] {
  const offsetRef = useRef(0);
  const frameRAFRef = useRef<number>(null);

  // Firefox patch
  const wheelValueRef = useRef<number>(null);
  const isMouseScrollRef = useRef<boolean>(false);

  // Scroll status sync
  const lockScrollFn = useLockScroll(isScrollAtTop, isScrollAtBottom);

  function onWheel(event: WheelEvent) {
    if (!inVirtual) return;

    raf.cancel(frameRAFRef.current);

    const delta = event[isHorizontalMode ? 'deltaX' : 'deltaY']
    offsetRef.current += delta;
    wheelValueRef.current = delta;

    // Do nothing when scroll at the edge, Skip check when is in scroll
    if (lockScrollFn(delta)) return;

    // Proxy of scroll events
    if (!isFF) {
      event.preventDefault();
    }

    frameRAFRef.current = raf(() => {
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

    isMouseScrollRef.current = event.detail === wheelValueRef.current;
  }

  return [onWheel, onFireFoxScroll];
}
