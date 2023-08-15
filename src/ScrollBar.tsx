import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import raf from 'rc-util/lib/raf';
import addEventListener from 'rc-util/lib/Dom/addEventListener';
import useUpdateEffect from './hooks/useUpdateEffect';

const MIN_SIZE = 20;

export type ScrollBarDirectionType = 'ltr' | 'rtl';

interface ScrollBarProps {
  prefixCls: string;
  direction?: ScrollBarDirectionType;
  type: 'x' | 'y';
  count?: number;
  scrollSize: number;
  size: number;
  scrollOffset: number;
  onScroll: (scrollOffset: number) => void;
  onStartMove: () => void;
  onStopMove: () => void;
}

export interface ScrollBarRef {
  delayHidden: () => void;
}

function getPageOffset(e: React.MouseEvent | React.TouchEvent, type: 'x' | 'y') {
  const property = type === 'x' ? 'pageX' : 'pageY';
  return 'touches' in e ? e.touches[0][property] : e[property];
}

const ScrollBar = forwardRef<ScrollBarRef, ScrollBarProps>(
  (
    {
      prefixCls,
      direction,
      type,
      count,
      size,
      scrollOffset,
      scrollSize,
      onStartMove,
      onStopMove,
      onScroll,
    },
    ref,
  ) => {
    const [dragging, setDragging] = useState(false);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const timer = useRef(null);
    const moveRaf = useRef(null);
    const [visible, setVisible] = useState(false);
    const startOffset = useRef(0);

    const getSpinSize = () => {
      if (type === 'x') {
        return Math.max(size * (size / scrollSize), MIN_SIZE);
      } else {
        let baseHeight = (size / count) * 10;
        baseHeight = Math.max(baseHeight, MIN_SIZE);
        baseHeight = Math.min(baseHeight, size / 2);
        return baseHeight;
      }
    };

    const spinSize = getSpinSize();

    const onContainerMouseDown: React.MouseEventHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const delayHidden = () => {
      clearTimeout(timer.current);

      setVisible(true);
      timer.current = setTimeout(() => {
        setVisible(false);
      }, 2000);
    };

    const getEnableScrollRange = () => {
      return scrollSize - size || 0;
    };

    const getEnableSizeRange = () => {
      return size - spinSize || 0;
    };

    const getThumbOffset = () => {
      const enableScrollRange = getEnableScrollRange();
      const enableSizeRange = getEnableSizeRange();
      if (scrollOffset === 0 || enableScrollRange === 0) {
        return 0;
      }
      const ptg = scrollOffset / enableScrollRange;
      return ptg * enableSizeRange;
    };

    const thumbOffset = getThumbOffset();

    const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      setDragging(true);
      startOffset.current = getPageOffset(e, type) - thumbOffset;

      onStartMove();

      e.stopPropagation();
      e.preventDefault();
    };

    const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      raf.cancel(moveRaf.current);

      if (dragging) {
        const offset = getPageOffset(e, type) - startOffset.current;
        const enableScrollRange = getEnableScrollRange();
        const enableSizeRange = getEnableSizeRange();

        const ptg = enableSizeRange ? offset / enableSizeRange : 0;
        const newScrollOffset = ptg * enableScrollRange;

        moveRaf.current = raf(() => {
          onScroll(newScrollOffset);
        });
      }
    };

    const onMouseUp = () => {
      setDragging(false);
      onStopMove();
    };

    useEffect(() => {
      return () => {
        clearTimeout(timer.current);
        raf.cancel(moveRaf.current);
      };
    }, []);

    useUpdateEffect(() => {
      delayHidden();
    }, [scrollOffset]);

    useEffect(() => {
      let onMouseMoveListener;
      let onMouseUpListener;

      if (dragging) {
        onMouseMoveListener = addEventListener(window, 'mousemove', onMouseMove);
        onMouseUpListener = addEventListener(window, 'mouseup', onMouseUp);
      }
      return () => {
        onMouseMoveListener?.remove();
        onMouseUpListener?.remove();
      };
    }, [dragging, scrollSize, size, spinSize]);

    useEffect(() => {
      const onTouchStartListener = addEventListener(thumbRef.current, 'touchstart', onMouseDown, {
        passive: false,
      });

      return () => {
        onTouchStartListener.remove();
      };
    }, [thumbOffset]);

    useEffect(() => {
      const onScrollTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
      };
      const onTouchStartListener = addEventListener(
        scrollbarRef.current,
        'touchstart',
        onScrollTouchStart,
        {
          passive: false,
        },
      );
      return () => {
        onTouchStartListener.remove();
      };
    }, []);

    useImperativeHandle(ref, () => ({ delayHidden }));

    const scrollBarDirection =
      direction === 'rtl'
        ? {
            left: 0,
          }
        : {
            right: 0,
          };

    return (
      <div
        ref={scrollbarRef}
        className={`${prefixCls}-scrollbar-${type}`}
        style={{
          ...(type === 'x'
            ? { height: 8, bottom: 0, left: 0, right: 0 }
            : { width: 8, top: 0, bottom: 0, ...scrollBarDirection }),
          position: 'absolute',
          display: dragging || visible ? null : 'none',
        }}
        onMouseDown={onContainerMouseDown}
        onMouseMove={delayHidden}
      >
        <div
          ref={thumbRef}
          className={`${prefixCls}-scrollbar-${type}-thumb`}
          style={{
            ...(type === 'x'
              ? { width: spinSize, height: '100%', bottom: 0, left: thumbOffset }
              : { height: spinSize, width: '100%', left: 0, top: thumbOffset }),
            position: 'absolute',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 99,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
        />
      </div>
    );
  },
);

export default ScrollBar;
