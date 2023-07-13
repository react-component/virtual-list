import React, { useEffect, useRef, useState } from 'react';
import raf from 'rc-util/lib/raf';
import addEventListener from 'rc-util/lib/Dom/addEventListener';
import useUpdateEffect from './hooks/useUpdateEffect';

const MIN_SIZE = 20;

interface ScrollBarXProps {
  prefixCls: string;
  scrollWidth: number;
  width: number;
  scrollLeft: number;
  onScroll: (scrollLeft: number) => void;
  onStartMove: () => void;
  onStopMove: () => void;
}

function getPageX(e: React.MouseEvent | React.TouchEvent) {
  return 'touches' in e ? e.touches[0].pageX : e.pageX;
}

const ScrollBarX: React.FC<ScrollBarXProps> = ({
  prefixCls,
  width,
  scrollLeft,
  scrollWidth,
  onStartMove,
  onStopMove,
  onScroll,
}) => {
  const [dragging, setDragging] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timer = useRef(null);
  const moveRaf = useRef(null);
  const [visible, setVisible] = useState(false);
  const startLeft = useRef(0);

  const spinWidth = scrollWidth && Math.max(width * (width / scrollWidth), MIN_SIZE);

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
    return scrollWidth - width || 0;
  };

  const getEnableWidthRange = () => {
    return width - spinWidth || 0;
  };

  const getLeft = () => {
    const enableScrollRange = getEnableScrollRange();
    const enableWidthRange = getEnableWidthRange();
    if (scrollLeft === 0 || enableScrollRange === 0) {
      return 0;
    }
    const ptg = scrollLeft / enableScrollRange;
    return ptg * enableWidthRange;
  };

  const left = getLeft();

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    startLeft.current = getPageX(e) - left;

    onStartMove();

    e.stopPropagation();
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    raf.cancel(moveRaf.current);

    if (dragging) {
      const newLeft = getPageX(e) - startLeft.current;
      const enableScrollRange = getEnableScrollRange();
      const enableWidthRange = getEnableWidthRange();

      const ptg = enableWidthRange ? newLeft / enableWidthRange : 0;
      const newScrollLeft = Math.ceil(ptg * enableScrollRange);

      moveRaf.current = raf(() => {
        onScroll(newScrollLeft);
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
  }, [scrollLeft]);

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
  }, [dragging, scrollWidth, width, spinWidth]);

  useEffect(() => {
    const onTouchStartListener = addEventListener(thumbRef.current, 'touchstart', onMouseDown, {
      passive: false,
    });

    return () => {
      onTouchStartListener.remove();
    };
  }, [left]);

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

  return (
    <div
      ref={scrollbarRef}
      className={`${prefixCls}-scrollbar-x`}
      style={{
        height: 8,
        bottom: 0,
        left: 0,
        right: 0,
        position: 'absolute',
        display: dragging || visible ? null : 'none',
      }}
      onMouseDown={onContainerMouseDown}
      onMouseMove={delayHidden}
    >
      <div
        ref={thumbRef}
        className={`${prefixCls}-scrollbar-x-thumb`}
        style={{
          width: spinWidth,
          height: '100%',
          bottom: 0,
          left,
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
};

export default ScrollBarX;
