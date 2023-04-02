import { useCallback, useRef } from 'react';
import { isFF } from '../utils';
import raf from 'rc-util/es/raf';
import useLockScroll from './useLockScroll';
import type { FireFoxDOMMouseScrollEvent } from '../types';

export default function useFrameWheel(
  isHorizontalMode: boolean,
  inVirtual: boolean,
  isScrollAtTop: boolean,
  isScrollAtBottom: boolean,
  onWheelDelta: (offset: number) => void
): [(e: WheelEvent) => void, (e: FireFoxDOMMouseScrollEvent) => void] {
  const offsetRef = useRef(0);
  const frameRAFRef = useRef<number>(0);

  // Firefox patch
  const wheelValueRef = useRef<number>(0);
  const isMouseScrollRef = useRef<boolean>(false);

  // Scroll status sync
  const lockScrollFn = useLockScroll(isScrollAtTop, isScrollAtBottom);

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (!inVirtual) {
        return;
      }

      raf.cancel(frameRAFRef.current);

      const delta = event[isHorizontalMode ? 'deltaX' : 'deltaY'];
      offsetRef.current += delta;
      wheelValueRef.current = delta;

      // Do nothing when scroll at the edge, Skip check when is in scroll
      if (lockScrollFn(delta)) {
        return;
      }

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
    },
    [inVirtual, isHorizontalMode, offsetRef, frameRAFRef, wheelValueRef, isMouseScrollRef, lockScrollFn, onWheelDelta]
  );

  // A patch for firefox
  const onFireFoxScroll = useCallback(
    (event: FireFoxDOMMouseScrollEvent) => {
      if (!inVirtual) {
        return;
      }

      isMouseScrollRef.current = event.detail === wheelValueRef.current;
    },
    [inVirtual, isMouseScrollRef, wheelValueRef]
  );

  return [onWheel, onFireFoxScroll];
}
