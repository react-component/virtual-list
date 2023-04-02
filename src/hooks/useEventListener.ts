import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import type { FireFoxDOMMouseScrollEvent } from '../types';

const useEventListener = (
  isEnableVirtual: boolean,
  componentRef: RefObject<HTMLDivElement>,
  onRawWheel: (e: WheelEvent) => void,
  onFireFoxScroll: (e: FireFoxDOMMouseScrollEvent) => void
) => {
  useLayoutEffect(() => {
    // Firefox only
    function onMozMousePixelScroll(e: Event) {
      if (isEnableVirtual) {
        e.preventDefault();
      }
    }

    if (componentRef.current) {
      componentRef.current.addEventListener('wheel', onRawWheel);
      componentRef.current.addEventListener('DOMMouseScroll', onFireFoxScroll as any);
      componentRef.current.addEventListener('MozMousePixelScroll', onMozMousePixelScroll);
    }

    return () => {
      if (componentRef.current) {
        componentRef.current.removeEventListener('wheel', onRawWheel);
        componentRef.current.removeEventListener('DOMMouseScroll', onFireFoxScroll as any);
        componentRef.current.removeEventListener('MozMousePixelScroll', onMozMousePixelScroll as any);
      }
    };
  }, [isEnableVirtual, componentRef, onRawWheel, onFireFoxScroll]);
};

export default useEventListener;
