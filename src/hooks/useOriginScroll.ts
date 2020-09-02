import { useRef } from 'react';

export default (isScrollAtTop: boolean, isScrollAtBottom: boolean) => {
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
  });
  scrollPingRef.current.top = isScrollAtTop;
  scrollPingRef.current.bottom = isScrollAtBottom;

  return (deltaY: number) => {
    const originScroll =
      // Pass origin wheel when on the top
      (deltaY < 0 && scrollPingRef.current.top) ||
      // Pass origin wheel when on the bottom
      (deltaY > 0 && scrollPingRef.current.bottom);

    if (!originScroll || lockRef.current) {
      lockScroll();
    }

    console.log('>>>>>>>>>> AAA>>>', deltaY, lockRef.current, originScroll);
    return !lockRef.current && originScroll;
  };
};
