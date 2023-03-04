import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import raf from 'rc-util/lib/raf';
import type { MouseEvent as ReactMouseEvent, MouseEventHandler } from 'react';
import type { ITimeoutHandher } from './types';

const MIN_SIZE = 20;

export interface IScrollBarProps {
  prefixCls: string;
  isHorizontalMode: boolean;
  scrollOffset: number;
  scrollSize: number;
  containerSize?: number;
  count: number;
  onScroll: (scrollOffset: number) => void;
  onStartMove: () => void;
  onStopMove: () => void;
}

function getPageOffset(e: MouseEvent | ReactMouseEvent | TouchEvent, isHorizontalMode: boolean) {
  const field = isHorizontalMode ? 'pageX' : 'pageY'
  return 'touches' in e ? e.touches[0][field] : e[field];
}

export interface IScrollBarRefProps {
  showScrollbar: () => void;
}

const ScrollBar = forwardRef<IScrollBarRefProps, IScrollBarProps>((props, ref) => {
  const { containerSize: rawContainerSize, count, scrollSize, scrollOffset, prefixCls, isHorizontalMode, onStartMove, onStopMove, onScroll } = props;
  const moveRAFRef = useRef<number|null>(null);
  const scrollbarRef = useRef<HTMLDivElement>();
  const thumbRef = useRef<HTMLDivElement>();
  const preScrollOffsetRef = useRef<number>(0);
  const hideScrollTimeoutRef = useRef<ITimeoutHandher>(-1 as unknown as ITimeoutHandher);

  const [visible, updateVisible] = useState(false);
  const [dragging, updateDragging] = useState(false);
  const [state, updateState] = useState({
    pageOffset: null,
    startOffset: null,
  });

  const containerSize = useMemo(() => {
    return rawContainerSize || 0;
  }, [rawContainerSize]);

  const thumbSize = useMemo(() => {
    let baseSize = (containerSize / count) * 10;
    baseSize = Math.max(baseSize, MIN_SIZE);
    baseSize = Math.min(baseSize, containerSize / 2);
    return Math.floor(baseSize);
  }, [count, containerSize]);

  const enableScrollRange = useMemo(() => {
    return scrollSize - containerSize || 0;
  }, [scrollSize, containerSize]);

  const enableSizeRange = useMemo(() => {
    return containerSize - thumbSize || 0;
  }, [thumbSize, containerSize]);

  const offset = useMemo(() => {
    if (scrollOffset === 0 || enableScrollRange === 0) {
      return 0;
    }
    const ptg = scrollOffset / enableScrollRange;
    return ptg * enableSizeRange;
  }, [scrollOffset, enableScrollRange, enableSizeRange]);

   // Not show scrollbar when height is large than scrollHeight
  const canScroll = useMemo((): boolean => {
    return scrollSize > containerSize;
  }, [scrollSize, containerSize]);

  const showScrollbar = useCallback(() => {
    clearTimeout(hideScrollTimeoutRef.current);

    updateVisible(true);
    hideScrollTimeoutRef.current = setTimeout(() => {
      clearTimeout(hideScrollTimeoutRef.current);
      updateVisible(false);
    }, 2000);
  }, [hideScrollTimeoutRef, updateVisible]);

  const handleScrollbarTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleContainerMouseDown: MouseEventHandler = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // ======================= Thumb =======================
  function handleMouseDown(e: MouseEvent | ReactMouseEvent | TouchEvent) {
    updateDragging(true);
    updateState({
      pageOffset: getPageOffset(e, isHorizontalMode),
      startOffset: offset,
    })
    updateDragging(true);

    onStartMove?.();
    patchEvents();
    e.stopPropagation();
    e.preventDefault();
  }

  function handleMouseMove(e: MouseEvent | ReactMouseEvent | TouchEvent) {
    const { pageOffset, startOffset } = state;

    raf.cancel(moveRAFRef.current);

    if (dragging) {
      const _offset = getPageOffset(e, isHorizontalMode) - pageOffset;
      const newOffset = startOffset + _offset;

      const ptg = enableSizeRange ? newOffset / enableSizeRange : 0;
      const newScrollOffset = Math.ceil(ptg * enableScrollRange);
      moveRAFRef.current = raf(() => {
        onScroll(newScrollOffset);
      });
    }
  };

  function handleMouseUp() {
    updateDragging(false);
    onStopMove();
    removeEvents();
  }

  function patchEvents() {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    thumbRef.current.addEventListener('touchmove', handleMouseMove);
    thumbRef.current.addEventListener('touchend', handleMouseUp);
  };

  function removeEvents() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    scrollbarRef.current?.removeEventListener('touchstart', handleScrollbarTouchStart);

    if(thumbRef.current) {
      thumbRef.current.removeEventListener('touchstart', handleMouseDown);
      thumbRef.current.removeEventListener('touchmove', handleMouseMove);
      thumbRef.current.removeEventListener('touchend', handleMouseUp);
    }
    raf.cancel(moveRAFRef.current);
  };


  useLayoutEffect(() => {
    scrollbarRef.current.addEventListener('touchstart', handleScrollbarTouchStart);
    thumbRef.current.addEventListener('touchstart', handleMouseDown);

    if(preScrollOffsetRef.current !== scrollOffset) {
      showScrollbar();
      preScrollOffsetRef.current = scrollOffset;
    }

    return () => {
        removeEvents();
        clearTimeout(hideScrollTimeoutRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollbarRef, thumbRef, preScrollOffsetRef,  hideScrollTimeoutRef, showScrollbar, handleScrollbarTouchStart, handleMouseDown]);

  useImperativeHandle(
    ref,
    function() {
      return {
        showScrollbar
      }
    },
    [showScrollbar],
  )
  
  const mergedVisible = canScroll && visible;
  const className = `${prefixCls ? `${prefixCls}-scrollbar` : 'scrollbar'} ${canScroll ? `${prefixCls}-scrollbar-show` : ''}`;
  const thumbClassName = `${prefixCls ? `${prefixCls}-scrollbar-thumb` : 'scrollbar-thumb'} ${dragging ? `${prefixCls}-scrollbar-thumb-moving` : ''}`;
  const thumbStyle = isHorizontalMode ? {
    width: thumbSize,
    height: '100%',
    left: offset,
    top: 0
  } : {
    width: '100%',
    height: thumbSize,
    left: 0,
    top: offset
  }
  return (
    <div
      ref={scrollbarRef}
      className={className}
      style={{
        position: 'absolute',
        display: mergedVisible ? null : 'none',
        ...(
          isHorizontalMode
            ? { height: 8, right: 0, bottom: 0, left: 0 } 
            : { width: 8,  top: 0, bottom: 0, right: 0 }
        ),
      }}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={showScrollbar}
    >
      <div
        ref={thumbRef}
        className={thumbClassName}
        style={{
          position: 'absolute',
          ...thumbStyle,
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 99,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
})


export default ScrollBar;


