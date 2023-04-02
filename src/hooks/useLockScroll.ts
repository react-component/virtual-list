import { useCallback, useRef } from 'react';

const useLockScroll = (isScrollAtTop: boolean, isScrollAtBottom: boolean) => {
  // Do lock for a wheel when scrolling
  const lockRef = useRef(false);
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const localClearTimeout = useCallback((timeoutHd?: ReturnType<typeof setTimeout>) => {
    if (timeoutHd) {
      clearTimeout(timeoutHd);
    }
  }, []);

  const lockScroll = useCallback(() => {
    localClearTimeout(lockTimeoutRef.current);

    lockRef.current = true;

    lockTimeoutRef.current = setTimeout(() => {
      localClearTimeout(lockTimeoutRef.current);
      lockRef.current = false;
    }, 50);
  }, [lockTimeoutRef, lockRef, localClearTimeout]);

  // Pass to ref since global add is in closure
  const scrollPingRef = useRef({
    top: isScrollAtTop,
    bottom: isScrollAtBottom,
  });
  scrollPingRef.current.top = isScrollAtTop;
  scrollPingRef.current.bottom = isScrollAtBottom;

  const lockScrollFn = useCallback(
    (delta: number, smoothOffset = false) => {
      const originScroll =
        // Pass origin wheel when on the top
        (delta < 0 && scrollPingRef.current.top) ||
        // Pass origin wheel when on the bottom
        (delta > 0 && scrollPingRef.current.bottom);

      if (smoothOffset && originScroll) {
        // No need lock anymore when it's smooth offset from touchMove interval
        localClearTimeout(lockTimeoutRef.current);
        lockRef.current = false;
      } else if (!originScroll || lockRef.current) {
        lockScroll();
      }

      return !lockRef.current && originScroll;
    },
    [scrollPingRef, lockRef, localClearTimeout, lockScroll]
  );

  return lockScrollFn;
};

export default useLockScroll;
