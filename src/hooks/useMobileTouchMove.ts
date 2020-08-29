import * as React from 'react';
import { useRef } from 'react';

const SMOOTH_PTG = 14 / 15;

export default function useMobileTouchMove(
  listRef: React.RefObject<HTMLDivElement>,
  callback: (offsetY: number) => void,
) {
  const touchedRef = useRef(false);
  const touchYRef = useRef(0);

  // Smooth scroll
  const intervalRef = useRef(null);

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1 && !touchedRef.current) {
      touchedRef.current = true;
      touchYRef.current = Math.ceil(e.touches[0].screenY);
      console.log('Start >>>', touchedRef.current);
    } else {
      console.log('Start >>> Skip');
    }

    if (touchedRef.current) {
      // e.preventDefault();
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    console.log('Move >>>', touchedRef.current);
    if (touchedRef.current) {
      // e.preventDefault();

      const currentY = Math.ceil(e.touches[0].screenY);
      let offsetY = touchYRef.current - currentY;
      touchYRef.current = currentY;

      callback(offsetY);

      // Smooth interval
      clearInterval(intervalRef.current);
      // intervalRef.current = setInterval(() => {
      //   offsetY *= SMOOTH_PTG;
      //   callback(offsetY);

      //   if (Math.abs(offsetY) <= 0.2) {
      //     clearInterval(intervalRef.current);
      //   }
      // }, 10);
    }
  };

  const onTouchEnd = () => {
    console.log('End >>>');
    if (touchedRef.current) {
      // e.preventDefault();
      touchedRef.current = false;
    }
  };

  React.useEffect(() => {
    listRef.current.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      listRef.current.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      clearInterval(intervalRef.current);
    };
  }, []);
}
