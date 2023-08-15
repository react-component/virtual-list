import { useRef } from 'react';
import raf from 'rc-util/lib/raf';
import isFF from '../utils/isFirefox';
import useOriginScroll from './useOriginScroll';

interface FireFoxDOMMouseScrollEvent {
  detail: number;
  preventDefault: Function;
}

export default function useFrameWheel(
  inVirtual: boolean,
  isScrollAtTop: boolean,
  isScrollAtBottom: boolean,
  isScrollAtLeft: boolean,
  isScrollAtRight: boolean,
  canScrollX: boolean,
  onWheelDelta: (offsetX: number, offsetY: number, isHorizontal: boolean) => void,
): [(e: WheelEvent, isTouch?: boolean) => void, (e: FireFoxDOMMouseScrollEvent) => void] {
  const offsetYRef = useRef(0);
  const offsetXRef = useRef(0);
  const nextFrameRef = useRef<number>(null);

  // Firefox patch
  const wheelValueRef = useRef<number>(null);
  const isMouseScrollRef = useRef<boolean>(false);

  // Scroll status sync
  const originScroll = useOriginScroll(
    isScrollAtTop,
    isScrollAtBottom,
    isScrollAtLeft,
    isScrollAtRight,
    canScrollX,
  );

  function onWheel(event: WheelEvent, isTouch?: boolean) {
    if (!inVirtual) return;

    raf.cancel(nextFrameRef.current);

    const { deltaX, deltaY } = event;
    const isHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);
    offsetYRef.current += deltaY;
    offsetXRef.current += deltaX;
    wheelValueRef.current = deltaY;

    if (!isTouch) {
      // Do nothing when scroll at the edge, Skip check when is in scroll
      if (originScroll(deltaX, deltaY)) return;

      // Proxy of scroll events
      if (!isFF) {
        event.preventDefault();
      }
    }

    nextFrameRef.current = raf(() => {
      // Patch a multiple for Firefox to fix wheel number too small
      // ref: https://github.com/ant-design/ant-design/issues/26372#issuecomment-679460266
      const patchMultiple = isMouseScrollRef.current ? 10 : 1;
      // offsetX is not need patchMultiple (Mouse wheel does not trigger X-axis scrolling)
      onWheelDelta(offsetXRef.current, offsetYRef.current * patchMultiple, isHorizontal);
      offsetXRef.current = 0;
      offsetYRef.current = 0;
    });
  }

  // A patch for firefox
  function onFireFoxScroll(event: FireFoxDOMMouseScrollEvent) {
    if (!inVirtual) return;

    isMouseScrollRef.current = event.detail === wheelValueRef.current;
  }

  return [onWheel, onFireFoxScroll];
}
