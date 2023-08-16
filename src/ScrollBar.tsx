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
  // height: number;
  count: number;
  direction?: ScrollBarDirectionType;
  onScroll: (scrollOffset: number) => void;
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
    direction,
    // height,
    count,
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
      // setVisible(false);
    }, 2000);
  };

  // ========================= Spin =========================
  const spinSize = React.useMemo(() => {
    let baseSize = (containerSize / count) * 10;
    baseSize = Math.max(baseSize, MIN_SIZE);
    baseSize = Math.min(baseSize, containerSize / 2);
    return Math.floor(baseSize);
  }, [count, containerSize]);

  // ======================== Range =========================
  const enableScrollRange = scrollRange - containerSize || 0;
  const enableHeightRange = containerSize - spinSize || 0;

  // ========================= Top ==========================
  const top = React.useMemo(() => {
    if (scrollOffset === 0 || enableScrollRange === 0) {
      return 0;
    }
    const ptg = scrollOffset / enableScrollRange;
    return ptg * enableHeightRange;
  }, [scrollOffset, enableScrollRange, enableHeightRange]);

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
          const offsetY = getPageXY(e, horizontal) - statePageY;
          const newTop = stateStartTop + offsetY;

          const ptg = enableHeightRange ? newTop / enableHeightRange : 0;
          const newScrollTop = Math.ceil(ptg * enableScrollRange);
          moveRafId = raf(() => {
            onScroll(newScrollTop);
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

  // const scrollBarDirection =
  // direction === 'rtl'
  //   ? {
  //       left: 0,
  //     }
  //   : {
  //       right: 0,
  //     };

  const containerStyle: React.CSSProperties = {
    // ...scrollBarDirection,
    position: 'absolute',
    display: visible ? null : 'none',
  };

  const thumbStyle: React.CSSProperties = {
    // width: '100%',
    // height: spinHeight,
    // top,
    // left: 0,
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
    thumbStyle.left = top;
  } else {
    // Container
    containerStyle.width = 8;
    containerStyle.top = 0;
    containerStyle.bottom = 0;

    if (direction === 'rtl') {
      containerStyle.left = 0;
    } else {
      containerStyle.right = 0;
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
