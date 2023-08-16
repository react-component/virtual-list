import * as React from 'react';
import classNames from 'classnames';
import ResizeObserver, { type ResizeObserverProps } from 'rc-resize-observer';
import raf from 'rc-util/lib/raf';

const MIN_SIZE = 20;

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
}

export interface ScrollBarRef {
  delayHidden: () => void;
}

function getPageXY(
  e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
  horizontal: boolean,
) {
  const obj = 'touches' in e ? e.touches[0] : e;
  return obj[horizontal ? 'pageX' : 'pageY'];
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
  } = props;

  const [dragging, setDragging] = React.useState(false);
  const [pageXY, setPageXY] = React.useState<number | null>(null);
  const [startTop, setStartTop] = React.useState<number | null>(null);

  const isLTR = !rtl;

  // ========================= Size =========================
  const [containerSize, setContainerSize] = React.useState<number>(0);
  const onResize: ResizeObserverProps['onResize'] = (size) => {
    setContainerSize(horizontal ? size.width : size.height);
  };

  // ========================= Refs =========================
  const scrollbarRef = React.useRef<HTMLDivElement>();
  const thumbRef = React.useRef<HTMLDivElement>();

  // ======================= Visible ========================
  const [visible, setVisible] = React.useState(false);
  const visibleTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const delayHidden = () => {
    clearTimeout(visibleTimeoutRef.current);
    setVisible(true);

    visibleTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 2000);
  };

  // ========================= Spin =========================
  const spinSize = React.useMemo(() => {
    let baseSize = (containerSize / scrollRange) * 100;
    baseSize = Math.max(baseSize, MIN_SIZE);
    baseSize = Math.min(baseSize, containerSize / 2);
    return Math.floor(baseSize);
  }, [containerSize, scrollRange]);

  // ======================== Range =========================
  const enableScrollRange = scrollRange - containerSize || 0;
  const enableOffsetRange = containerSize - spinSize || 0;

  // `scrollWidth` < `clientWidth` means no need to show scrollbar
  const canScroll = enableScrollRange > 0;

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
    scrollbarEle.addEventListener('touchstart', onScrollbarTouchStart);
    thumbEle.addEventListener('touchstart', onThumbMouseDown);

    return () => {
      scrollbarEle.removeEventListener('touchstart', onScrollbarTouchStart);
      thumbEle.removeEventListener('touchstart', onThumbMouseDown);
    };
  }, []);

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

        if (stateDragging) {
          const offset = getPageXY(e, horizontal) - statePageY;
          let newTop = stateStartTop;

          if (!isLTR && horizontal) {
            newTop -= offset;
          } else {
            newTop += offset;
          }

          const ptg: number = enableOffsetRange ? newTop / enableOffsetRange : 0;

          let newScrollTop = Math.ceil(ptg * enableScrollRange);
          newScrollTop = Math.max(newScrollTop, 0);
          newScrollTop = Math.min(newScrollTop, enableScrollRange);

          moveRafId = raf(() => {
            onScroll(newScrollTop, horizontal);
          });
        }
      };

      const onMouseUp = () => {
        setDragging(false);

        onStopMove();
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchend', onMouseUp);

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
  }, [scrollOffset]);

  // ====================== Imperative ======================
  React.useImperativeHandle(ref, () => ({
    delayHidden,
  }));

  // ======================== Render ========================
  const scrollbarPrefixCls = `${prefixCls}-scrollbar`;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    visibility: visible && canScroll ? null : 'hidden',
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
    <ResizeObserver onResize={onResize}>
      <div
        ref={scrollbarRef}
        className={classNames(scrollbarPrefixCls, {
          [`${scrollbarPrefixCls}-horizontal`]: horizontal,
          [`${scrollbarPrefixCls}-vertical`]: !horizontal,
        })}
        style={containerStyle}
        onMouseDown={onContainerMouseDown}
        onMouseMove={delayHidden}
      >
        <div
          ref={thumbRef}
          className={classNames(`${scrollbarPrefixCls}-thumb`, {
            [`${scrollbarPrefixCls}-thumb-moving`]: dragging,
          })}
          style={thumbStyle}
          onMouseDown={onThumbMouseDown}
        />
      </div>
    </ResizeObserver>
  );
});

if (process.env.NODE_ENV !== 'production') {
  ScrollBar.displayName = 'ScrollBar';
}

export default ScrollBar;
