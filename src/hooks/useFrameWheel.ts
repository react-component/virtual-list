import { useRef } from 'react';
import raf from 'rc-util/lib/raf';
import isFF from '../utils/isFirefox';
import useOriginScroll from './useOriginScroll';

interface FireFoxDOMMouseScrollEvent {
  detail: number;
  preventDefault: VoidFunction;
}

export default function useFrameWheel(
  inVirtual: boolean,
  isScrollAtTop: boolean,
  isScrollAtBottom: boolean,
  horizontalScroll: boolean,
  /***
   * Return `true` when you need to prevent default event
   */
  onWheelDelta: (offset: number, horizontal?: boolean) => void,
): [(e: WheelEvent) => void, (e: FireFoxDOMMouseScrollEvent) => void] {
  const offsetRef = useRef(0);
  const nextFrameRef = useRef<number>(null);

  // Firefox patch
  const wheelValueRef = useRef<number>(null);
  const isMouseScrollRef = useRef<boolean>(false);

  // Scroll status sync
  const originScroll = useOriginScroll(isScrollAtTop, isScrollAtBottom);

  function onWheelY(event: WheelEvent) {
    raf.cancel(nextFrameRef.current);

    const { deltaY } = event;
    offsetRef.current += deltaY;
    wheelValueRef.current = deltaY;

    // Do nothing when scroll at the edge, Skip check when is in scroll
    if (originScroll(deltaY)) return;

    // Proxy of scroll events
    if (!isFF) {
      event.preventDefault();
    }

    nextFrameRef.current = raf(() => {
      // Patch a multiple for Firefox to fix wheel number too small
      // ref: https://github.com/ant-design/ant-design/issues/26372#issuecomment-679460266
      const patchMultiple = isMouseScrollRef.current ? 10 : 1;
      onWheelDelta(offsetRef.current * patchMultiple);
      offsetRef.current = 0;
    });
  }

  function onWheelX(event: WheelEvent) {
    const { deltaX } = event;

    onWheelDelta(deltaX, true);

    if (!isFF) {
      event.preventDefault();
    }
  }

  // Check for which direction does wheel do
  const wheelDirectionRef = useRef<'x' | 'y' | null>(null);
  const wheelDirectionCleanRef = useRef<number>(null);

  function onWheel(event: WheelEvent) {
    if (!inVirtual) return;

    // Wait for 2 frame to clean direction
    raf.cancel(wheelDirectionCleanRef.current);
    wheelDirectionCleanRef.current = raf(() => {
      wheelDirectionRef.current = null;
    }, 2);

    const { deltaX, deltaY } = event;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (wheelDirectionRef.current === null) {
      wheelDirectionRef.current = horizontalScroll && absX > absY ? 'x' : 'y';
    }

    if (wheelDirectionRef.current === 'x') {
      onWheelX(event);
    } else {
      onWheelY(event);
    }
  }

  // A patch for firefox
  function onFireFoxScroll(event: FireFoxDOMMouseScrollEvent) {
    if (!inVirtual) return;

    isMouseScrollRef.current = event.detail === wheelValueRef.current;
  }

  return [onWheel, onFireFoxScroll];
}
