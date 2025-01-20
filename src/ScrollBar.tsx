import classNames from 'classnames';
import raf from 'rc-util/lib/raf';
import * as React from 'react';
import { getPageXY } from './hooks/useScrollDrag';

export type ScrollBarDirectionType = 'ltr' | 'rtl';

export interface ScrollBarProps {
  prefixCls: string;
  scrollOffset: number;
  scrollRange: number;
  rtl: boolean;
  onScroll: (scrollOffset: number, horizontal?: boolean) => void;
  onStartMove: () => void;
  onStopMove: () => void;
  horizontal?: boolean;
  style?: React.CSSProperties;
  thumbStyle?: React.CSSProperties;
  spinSize: number;
  containerSize: number;
  showScrollBar?: true | 'optional';
}

export interface ScrollBarRef {
  delayHidden: () => void;
}

const ScrollBar = React.forwardRef<ScrollBarRef, ScrollBarProps>((props, ref) => {
  const {
    prefixCls,
    rtl,
    scrollOffset,
    scrollRange,
    onStartMove,
    onStopMove,
    onScroll,
    horizontal,
    spinSize,
    containerSize,
    style,
    thumbStyle: propsThumbStyle,
    showScrollBar,
  } = props;

  const [dragging, setDragging] = React.useState(false);
  const [pageXY, setPageXY] = React.useState<number | null>(null);
  const [startTop, setStartTop] = React.useState<number | null>(null);

  const isLTR = !rtl;

  // ========================= Refs =========================
  const scrollbarRef = React.useRef<HTMLDivElement>();
  const thumbRef = React.useRef<HTMLDivElement>();

  // ======================= Visible ========================
  const [visible, setVisible] = React.useState(showScrollBar === true);
  const visibleTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const delayHidden = () => {
    if (showScrollBar === true) return;
    clearTimeout(visibleTimeoutRef.current);
    setVisible(true);
    visibleTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 3000);
  };

  // ======================== Range =========================
  const enableScrollRange = scrollRange - containerSize || 0;
  const enableOffsetRange = containerSize - spinSize || 0;

  // ========================= Top ==========================
  const top = React.useMemo(() => {
    if (scrollOffset === 0 || enableScrollRange === 0) {
      return 0;
    }
    const ptg = scrollOffset / enableScrollRange;
    return ptg * enableOffsetRange;
  }, [scrollOffset, enableScrollRange, enableOffsetRange]);

  // ====================== Container =======================
  const onContainerMouseDown: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // ======================== Thumb =========================
  const stateRef = React.useRef({ top, dragging, pageY: pageXY, startTop });
  stateRef.current = { top, dragging, pageY: pageXY, startTop };

  const onThumbMouseDown = (e: React.MouseEvent | React.TouchEvent | TouchEvent) => {
    setDragging(true);
    setPageXY(getPageXY(e, horizontal));
    setStartTop(stateRef.current.top);

    onStartMove();
    e.stopPropagation();
    e.preventDefault();
  };

  // ======================== Effect ========================

  // React make event as passive, but we need to preventDefault
  // Add event on dom directly instead.
  // ref: https://github.com/facebook/react/issues/9809
  React.useEffect(() => {
    const onScrollbarTouchStart = (e: TouchEvent) => {
      e.preventDefault();
    };

    const scrollbarEle = scrollbarRef.current;
    const thumbEle = thumbRef.current;
    scrollbarEle.addEventListener('touchstart', onScrollbarTouchStart, { passive: false });
    thumbEle.addEventListener('touchstart', onThumbMouseDown, { passive: false });

    return () => {
      scrollbarEle.removeEventListener('touchstart', onScrollbarTouchStart);
      thumbEle.removeEventListener('touchstart', onThumbMouseDown);
    };
  }, []);

  // Pass to effect
  const enableScrollRangeRef = React.useRef<number>();
  enableScrollRangeRef.current = enableScrollRange;
  const enableOffsetRangeRef = React.useRef<number>();
  enableOffsetRangeRef.current = enableOffsetRange;

  React.useEffect(() => {
    if (dragging) {
      let moveRafId: number;

      const onMouseMove = (e: MouseEvent | TouchEvent) => {
        const {
          dragging: stateDragging,
          pageY: statePageY,
          startTop: stateStartTop,
        } = stateRef.current;
        raf.cancel(moveRafId);

        const rect = scrollbarRef.current.getBoundingClientRect();
        const scale = containerSize / (horizontal ? rect.width : rect.height);

        if (stateDragging) {
          const offset = (getPageXY(e, horizontal) - statePageY) * scale;
          let newTop = stateStartTop;

          if (!isLTR && horizontal) {
            newTop -= offset;
          } else {
            newTop += offset;
          }

          const tmpEnableScrollRange = enableScrollRangeRef.current;
          const tmpEnableOffsetRange = enableOffsetRangeRef.current;

          const ptg: number = tmpEnableOffsetRange ? newTop / tmpEnableOffsetRange : 0;

          let newScrollTop = Math.ceil(ptg * tmpEnableScrollRange);
          newScrollTop = Math.max(newScrollTop, 0);
          newScrollTop = Math.min(newScrollTop, tmpEnableScrollRange);

          moveRafId = raf(() => {
            onScroll(newScrollTop, horizontal);
          });
        }
      };

      const onMouseUp = () => {
        setDragging(false);

        onStopMove();
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('touchmove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });
      window.addEventListener('touchend', onMouseUp, { passive: true });

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchend', onMouseUp);

        raf.cancel(moveRafId);
      };
    }
  }, [dragging]);

  React.useEffect(() => {
    delayHidden();
    return () => {
      clearTimeout(visibleTimeoutRef.current);
    };
  }, [scrollOffset]);

  // ====================== Imperative ======================
  React.useImperativeHandle(ref, () => ({
    delayHidden,
  }));

  // ======================== Render ========================
  const scrollbarPrefixCls = `${prefixCls}-scrollbar`;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    visibility: visible ? null : 'hidden',
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 99,
    cursor: 'pointer',
    userSelect: 'none',
  };

  if (horizontal) {
    // Container
    containerStyle.height = 8;
    containerStyle.left = 0;
    containerStyle.right = 0;
    containerStyle.bottom = 0;

    // Thumb
    thumbStyle.height = '100%';
    thumbStyle.width = spinSize;

    if (isLTR) {
      thumbStyle.left = top;
    } else {
      thumbStyle.right = top;
    }
  } else {
    // Container
    containerStyle.width = 8;
    containerStyle.top = 0;
    containerStyle.bottom = 0;

    if (isLTR) {
      containerStyle.right = 0;
    } else {
      containerStyle.left = 0;
    }

    // Thumb
    thumbStyle.width = '100%';
    thumbStyle.height = spinSize;
    thumbStyle.top = top;
  }

  return (
    <div
      ref={scrollbarRef}
      className={classNames(scrollbarPrefixCls, {
        [`${scrollbarPrefixCls}-horizontal`]: horizontal,
        [`${scrollbarPrefixCls}-vertical`]: !horizontal,
        [`${scrollbarPrefixCls}-visible`]: visible,
      })}
      style={{ ...containerStyle, ...style }}
      onMouseDown={onContainerMouseDown}
      onMouseMove={delayHidden}
    >
      <div
        ref={thumbRef}
        className={classNames(`${scrollbarPrefixCls}-thumb`, {
          [`${scrollbarPrefixCls}-thumb-moving`]: dragging,
        })}
        style={{ ...thumbStyle, ...propsThumbStyle }}
        onMouseDown={onThumbMouseDown}
      />
    </div>
  );
});

if (process.env.NODE_ENV !== 'production') {
  ScrollBar.displayName = 'ScrollBar';
}

export default ScrollBar;
