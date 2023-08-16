import * as React from 'react';
import classNames from 'classnames';
import raf from 'rc-util/lib/raf';

const MIN_SIZE = 20;

export type ScrollBarDirectionType = 'ltr' | 'rtl';

export interface ScrollBarProps {
  prefixCls: string;
  scrollTop: number;
  scrollHeight: number;
  height: number;
  count: number;
  direction?: ScrollBarDirectionType;
  onScroll: (scrollTop: number) => void;
  onStartMove: () => void;
  onStopMove: () => void;
}

interface ScrollBarState {
  dragging: boolean;
  pageY: number;
  startTop: number;
  visible: boolean;
}

export interface ScrollBarRef {
  delayHidden: () => void;
}

function getPageY(e: React.MouseEvent | MouseEvent | TouchEvent) {
  return 'touches' in e ? e.touches[0].pageY : e.pageY;
}

const ScrollBar = React.forwardRef<ScrollBarRef, ScrollBarProps>((props, ref) => {
  const {
    prefixCls,
    direction,
    height,
    count,
    scrollTop,
    scrollHeight,
    onStartMove,
    onStopMove,
    onScroll,
  } = props;

  const [dragging, setDragging] = React.useState(false);
  const [pageY, setPageY] = React.useState<number | null>(null);
  const [startTop, setStartTop] = React.useState<number | null>(null);

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
  const spinHeight = React.useMemo(() => {
    let baseHeight = (height / count) * 10;
    baseHeight = Math.max(baseHeight, MIN_SIZE);
    baseHeight = Math.min(baseHeight, height / 2);
    return Math.floor(baseHeight);
  }, [count, height]);

  // ======================== Range =========================
  const enableScrollRange = scrollHeight - height || 0;
  const enableHeightRange = height - spinHeight || 0;

  // ========================= Top ==========================
  const top = React.useMemo(() => {
    if (scrollTop === 0 || enableScrollRange === 0) {
      return 0;
    }
    const ptg = scrollTop / enableScrollRange;
    return ptg * enableHeightRange;
  }, [scrollTop, enableScrollRange, enableHeightRange]);

  // ====================== Direction =======================
  const scrollBarDirection =
    direction === 'rtl'
      ? {
          left: 0,
        }
      : {
          right: 0,
        };

  // ====================== Container =======================
  const onContainerMouseDown: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // ======================== Thumb =========================
  const onThumbMouseDown = (e: React.MouseEvent | TouchEvent) => {
    setDragging(true);
    setPageY(getPageY(e));
    setStartTop(top);

    onStartMove();
    e.stopPropagation();
    e.preventDefault();
  };

  // ======================== Effect ========================
  const stateRef = React.useRef({ top, dragging, pageY, startTop });
  stateRef.current = { top, dragging, pageY, startTop };

  React.useEffect(() => {
    const onScrollbarTouchStart = (e: TouchEvent) => {
      e.preventDefault();
    };
    const onThumbTouchStart = (e: React.MouseEvent | TouchEvent) => {
      setDragging(true);
      setPageY(getPageY(e));
      setStartTop(stateRef.current.top);

      onStartMove();
      e.stopPropagation();
      e.preventDefault();
    };

    const scrollbarEle = scrollbarRef.current;
    const thumbEle = thumbRef.current;
    scrollbarEle.addEventListener('touchstart', onScrollbarTouchStart);
    thumbEle.addEventListener('touchstart', onThumbTouchStart);

    return () => {
      scrollbarEle.removeEventListener('touchstart', onScrollbarTouchStart);
      thumbEle.removeEventListener('touchstart', onThumbTouchStart);
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
          const offsetY = getPageY(e) - statePageY;
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
      window.addEventListener('mouseup', onMouseUp);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        raf.cancel(moveRafId);
      };
    }
  }, [dragging]);

  React.useEffect(() => {
    delayHidden();
  }, [scrollTop]);

  // ====================== Imperative ======================
  React.useImperativeHandle(ref, () => ({
    delayHidden,
  }));

  // ======================== Render ========================
  return (
    <div
      ref={scrollbarRef}
      className={`${prefixCls}-scrollbar`}
      style={{
        width: 8,
        top: 0,
        bottom: 0,
        ...scrollBarDirection,
        position: 'absolute',
        display: visible ? null : 'none',
      }}
      onMouseDown={onContainerMouseDown}
      onMouseMove={delayHidden}
    >
      <div
        ref={thumbRef}
        className={classNames(`${prefixCls}-scrollbar-thumb`, {
          [`${prefixCls}-scrollbar-thumb-moving`]: dragging,
        })}
        style={{
          width: '100%',
          height: spinHeight,
          top,
          left: 0,
          position: 'absolute',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 99,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseDown={onThumbMouseDown}
      />
    </div>
  );
});

if (process.env.NODE_ENV !== 'production') {
  ScrollBar.displayName = 'ScrollBar';
}

export default ScrollBar;
