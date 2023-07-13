import { useRef } from 'react';

export default (
  isScrollAtTop: boolean,
  isScrollAtBottom: boolean,
  isScrollAtLeft: boolean,
  isScrollAtRight: boolean,
) => {
  // Do lock for a wheel when scrolling
  const lockRef = useRef(false);
  const lockTimeoutRef = useRef(null);
  function lockScroll() {
    clearTimeout(lockTimeoutRef.current);

    lockRef.current = true;

    lockTimeoutRef.current = setTimeout(() => {
      lockRef.current = false;
    }, 50);
  }

  // Pass to ref since global add is in closure
  const scrollPingRef = useRef({
    top: isScrollAtTop,
    bottom: isScrollAtBottom,
    left: isScrollAtLeft,
    right: isScrollAtRight,
  });
  scrollPingRef.current.top = isScrollAtTop;
  scrollPingRef.current.bottom = isScrollAtBottom;
  scrollPingRef.current.left = isScrollAtLeft;
  scrollPingRef.current.right = isScrollAtRight;

  return (deltaX: number, deltaY: number, isTouch?: boolean) => {
    const isHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);
    const originScroll = isHorizontal
      ? // Pass origin wheel when on the left
        (deltaX < 0 && scrollPingRef.current.left) ||
        // Pass origin wheel when on the right
        (deltaX > 0 && scrollPingRef.current.right)
      : // Pass origin wheel when on the top
        (deltaY < 0 && scrollPingRef.current.top) ||
        // Pass origin wheel when on the bottom
        (deltaY > 0 && scrollPingRef.current.bottom);

    if (isTouch) {
      return originScroll;
    }

    if (originScroll) {
      // No need lock anymore when it's smooth offset from touchMove interval
      clearTimeout(lockTimeoutRef.current);
      lockRef.current = false;
    } else if (!originScroll || lockRef.current) {
      lockScroll();
    }

    return !lockRef.current && originScroll;
  };
};
