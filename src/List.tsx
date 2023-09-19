import * as React from 'react';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import classNames from 'classnames';
import type { ResizeObserverProps } from 'rc-resize-observer';
import ResizeObserver from 'rc-resize-observer';
import Filler from './Filler';
import type { InnerProps } from './Filler';
import type { ScrollBarDirectionType, ScrollBarRef } from './ScrollBar';
import ScrollBar from './ScrollBar';
import type { RenderFunc, SharedConfig, GetKey, ExtraRenderInfo } from './interface';
import renderChildren from './utils/renderChildren';
import useHeights from './hooks/useHeights';
import useScrollTo from './hooks/useScrollTo';
import type { ScrollPos, ScrollTarget } from './hooks/useScrollTo';
import useDiffItem from './hooks/useDiffItem';
import useFrameWheel from './hooks/useFrameWheel';
import useMobileTouchMove from './hooks/useMobileTouchMove';
import useOriginScroll from './hooks/useOriginScroll';
import useLayoutEffect from 'rc-util/lib/hooks/useLayoutEffect';
import { getSpinSize } from './utils/scrollbarUtil';
import { useEvent } from 'rc-util';
import { useGetSize } from './hooks/useGetSize';
import type { ScrollToCacheState } from './utils/scrollToCacheState';
import { MEASURE, STABLE } from './utils/scrollToCacheState';
import useCalcPosition from './hooks/useCalcPosition';

const EMPTY_DATA = [];

const ScrollStyle: React.CSSProperties = {
  overflowY: 'auto',
  overflowAnchor: 'none',
};

export interface ScrollInfo {
  x: number;
  y: number;
}

export type ScrollConfig = ScrollTarget | ScrollPos;

export type ScrollTo = (arg: number | ScrollConfig) => void;

export type ListRef = {
  scrollTo: ScrollTo;
  getScrollInfo: () => ScrollInfo;
};

export interface ListProps<T> extends Omit<React.HTMLAttributes<any>, 'children'> {
  prefixCls?: string;
  children: RenderFunc<T>;
  data: T[];
  height?: number;
  itemHeight?: number;
  /** If not match virtual scroll condition, Set List still use height of container. */
  fullHeight?: boolean;
  itemKey: React.Key | ((item: T) => React.Key);
  component?: string | React.FC<any> | React.ComponentClass<any>;
  /** Set `false` will always use real scroll instead of virtual one */
  virtual?: boolean;
  direction?: ScrollBarDirectionType;
  /**
   * By default `scrollWidth` is same as container.
   * When set this, it will show the horizontal scrollbar and
   * `scrollWidth` will be used as the real width instead of container width.
   * When set, `virtual` will always be enabled.
   */
  scrollWidth?: number;

  onScroll?: React.UIEventHandler<HTMLElement>;

  /**
   * Given the virtual offset value.
   * It's the logic offset from start position.
   */
  onVirtualScroll?: (info: ScrollInfo) => void;

  /** Trigger when render list item changed */
  onVisibleChange?: (visibleList: T[], fullList: T[]) => void;

  /** Inject to inner container props. Only use when you need pass aria related data */
  innerProps?: InnerProps;

  /** Render extra content into Filler */
  extraRender?: (info: ExtraRenderInfo) => React.ReactNode;
}

export function RawList<T>(props: ListProps<T>, ref: React.Ref<ListRef>) {
  const {
    prefixCls = 'rc-virtual-list',
    className,
    height,
    itemHeight,
    fullHeight = true,
    style,
    data,
    children,
    itemKey,
    virtual,
    direction,
    scrollWidth,
    component: Component = 'div',
    onScroll,
    onVirtualScroll,
    onVisibleChange,
    innerProps,
    extraRender,
    ...restProps
  } = props;

  // ================================= MISC =================================
  const useVirtual = !!(virtual !== false && height && itemHeight);
  const inVirtual = useVirtual && data && (itemHeight * data.length > height || !!scrollWidth);
  const isRTL = direction === 'rtl';

  const mergedClassName = classNames(prefixCls, { [`${prefixCls}-rtl`]: isRTL }, className);
  const mergedData = data || EMPTY_DATA;
  const componentRef = useRef<HTMLDivElement>();
  const fillerInnerRef = useRef<HTMLDivElement>();

  // =============================== Item Key ===============================

  const [offsetTop, setOffsetTop] = useState(0);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [scrollMoving, setScrollMoving] = useState(false);

  const onScrollbarStartMove = () => {
    setScrollMoving(true);
  };
  const onScrollbarStopMove = () => {
    setScrollMoving(false);
  };

  // =============================== Item Key ===============================
  const getKey = React.useCallback<GetKey<T>>(
    (item: T) => {
      if (typeof itemKey === 'function') {
        return itemKey(item);
      }
      return item?.[itemKey];
    },
    [itemKey],
  );

  const sharedConfig: SharedConfig<T> = {
    getKey,
  };

  // ================================ Scroll ================================
  // If the scrollTo function is triggered to scroll to a location where nodes haven't cached their heights, the state needs to be switched to measure it.
  const [scrollToCacheState, setScrollToCacheState] = React.useState<ScrollToCacheState>(STABLE);

  useLayoutEffect(() => {
    // componentRef shouldn't reset offsetTop when `scrollTo` is measuring
    if (scrollToCacheState === STABLE && componentRef.current) {
      componentRef.current.scrollTop = offsetTop;
    }
  }, [offsetTop, scrollToCacheState]);

  function syncScrollTop(newTop: number | ((prev: number) => number)) {
    setOffsetTop((origin) => {
      let value: number;
      if (typeof newTop === 'function') {
        value = newTop(origin);
      } else {
        value = newTop;
      }

      const alignedTop = keepInRange(value);
      return alignedTop;
    });
  }

  // ================================ Legacy ================================
  // Put ref here since the range is generate by follow
  const rangeRef = useRef({ start: 0, end: mergedData.length });

  const diffItemRef = useRef<T>();
  const [diffItem] = useDiffItem(mergedData, getKey);
  diffItemRef.current = diffItem;

  // ================================ Height ================================
  const [setInstanceRef, collectHeight, heights, heightUpdatedMark] = useHeights(
    getKey,
    null,
    null,
  );

  // ========================== Visible Calculation =========================
  const [scrollHeight, start, end, lastStartIndex, lastEndIndex, fillerOffset, maxScrollHeightRef] =
    useCalcPosition(
      scrollToCacheState,
      fillerInnerRef,
      getKey,
      inVirtual,
      heights,
      itemHeight,
      useVirtual,
      offsetTop,
      mergedData,
      heightUpdatedMark,
      height,
    );

  rangeRef.current.start = start;
  rangeRef.current.end = end;

  // ================================= Size =================================
  const [size, setSize] = React.useState({ width: 0, height });
  const onHolderResize: ResizeObserverProps['onResize'] = (sizeInfo) => {
    setSize(sizeInfo);
  };

  // Hack on scrollbar to enable flash call
  const verticalScrollBarRef = useRef<ScrollBarRef>();
  const horizontalScrollBarRef = useRef<ScrollBarRef>();

  const horizontalScrollBarSpinSize = React.useMemo(
    () => getSpinSize(size.width, scrollWidth),
    [size.width, scrollWidth],
  );
  const verticalScrollBarSpinSize = React.useMemo(
    () => getSpinSize(size.height, scrollHeight),
    [size.height, scrollHeight],
  );

  // =============================== In Range ===============================
  function keepInRange(newScrollTop: number) {
    let newTop = newScrollTop;
    if (!Number.isNaN(maxScrollHeightRef.current)) {
      newTop = Math.min(newTop, maxScrollHeightRef.current);
    }
    newTop = Math.max(newTop, 0);
    return newTop;
  }

  const isScrollAtTop = offsetTop <= 0;
  const isScrollAtBottom = offsetTop >= maxScrollHeightRef.current;

  const originScroll = useOriginScroll(isScrollAtTop, isScrollAtBottom);

  // ================================ Scroll ================================
  const getVirtualScrollInfo = () => ({
    x: isRTL ? -offsetLeft : offsetLeft,
    y: offsetTop,
  });

  const lastVirtualScrollInfoRef = useRef(getVirtualScrollInfo());

  const triggerScroll = useEvent(() => {
    if (onVirtualScroll) {
      const nextInfo = getVirtualScrollInfo();

      // Trigger when offset changed
      if (
        lastVirtualScrollInfoRef.current.x !== nextInfo.x ||
        lastVirtualScrollInfoRef.current.y !== nextInfo.y
      ) {
        onVirtualScroll(nextInfo);

        lastVirtualScrollInfoRef.current = nextInfo;
      }
    }
  });

  function onScrollBar(newScrollOffset: number, horizontal?: boolean) {
    const newOffset = newScrollOffset;

    if (horizontal) {
      flushSync(() => {
        setOffsetLeft(newOffset);
      });
      triggerScroll();
    } else {
      syncScrollTop(newOffset);
    }
  }

  // When data size reduce. It may trigger native scroll event back to fit scroll position
  function onFallbackScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop: newScrollTop } = e.currentTarget;
    if (newScrollTop !== offsetTop) {
      syncScrollTop(newScrollTop);
    }

    // Trigger origin onScroll
    onScroll?.(e);
    triggerScroll();
  }

  const keepInHorizontalRange = (nextOffsetLeft: number) => {
    let tmpOffsetLeft = nextOffsetLeft;
    const max = scrollWidth - size.width;
    tmpOffsetLeft = Math.max(tmpOffsetLeft, 0);
    tmpOffsetLeft = Math.min(tmpOffsetLeft, max);

    return tmpOffsetLeft;
  };

  const onWheelDelta: Parameters<typeof useFrameWheel>[4] = useEvent((offsetXY, fromHorizontal) => {
    if (fromHorizontal) {
      // Horizontal scroll no need sync virtual position

      flushSync(() => {
        setOffsetLeft((left) => {
          const nextOffsetLeft = left + (isRTL ? -offsetXY : offsetXY);

          return keepInHorizontalRange(nextOffsetLeft);
        });
      });

      triggerScroll();
    } else {
      syncScrollTop((top) => {
        const newTop = top + offsetXY;
        return newTop;
      });
    }
  });

  // Since this added in global,should use ref to keep update
  const [onRawWheel, onFireFoxScroll] = useFrameWheel(
    useVirtual,
    isScrollAtTop,
    isScrollAtBottom,
    !!scrollWidth,
    onWheelDelta,
  );

  // Mobile touch move
  useMobileTouchMove(useVirtual, componentRef, (deltaY, smoothOffset) => {
    if (originScroll(deltaY, smoothOffset)) {
      return false;
    }

    onRawWheel({ preventDefault() {}, deltaY } as WheelEvent);
    return true;
  });

  useLayoutEffect(() => {
    // Firefox only
    function onMozMousePixelScroll(e: Event) {
      if (useVirtual) {
        e.preventDefault();
      }
    }

    const componentEle = componentRef.current;
    componentEle.addEventListener('wheel', onRawWheel);
    componentEle.addEventListener('DOMMouseScroll', onFireFoxScroll as any);
    componentEle.addEventListener('MozMousePixelScroll', onMozMousePixelScroll);

    return () => {
      componentEle.removeEventListener('wheel', onRawWheel);
      componentEle.removeEventListener('DOMMouseScroll', onFireFoxScroll as any);
      componentEle.removeEventListener('MozMousePixelScroll', onMozMousePixelScroll as any);
    };
  }, [useVirtual]);

  // ================================= Ref ==================================
  const delayHideScrollBar = () => {
    verticalScrollBarRef.current?.delayHidden();
    horizontalScrollBarRef.current?.delayHidden();
  };

  const scrollTo = useScrollTo<T>(
    componentRef,
    mergedData,
    heights,
    itemHeight,
    getKey,
    collectHeight,
    syncScrollTop,
    delayHideScrollBar,
    setScrollToCacheState,
  );

  React.useImperativeHandle(ref, () => ({
    getScrollInfo: getVirtualScrollInfo,
    scrollTo: (config) => {
      function isPosScroll(arg: any): arg is ScrollPos {
        return arg && typeof arg === 'object' && ('left' in arg || 'top' in arg);
      }

      if (isPosScroll(config)) {
        // Scroll X
        if (config.left !== undefined) {
          setOffsetLeft(keepInHorizontalRange(config.left));
        }

        // Scroll Y
        scrollTo(config.top);
      } else {
        scrollTo(config);
      }
    },
  }));

  // ================================ Effect ================================
  /** We need told outside that some list not rendered */
  useLayoutEffect(() => {
    if (onVisibleChange) {
      const renderList = mergedData.slice(start, end + 1);

      onVisibleChange(renderList, mergedData);
    }
  }, [start, end, mergedData]);

  // ================================ Extra =================================
  const getSize = useGetSize(mergedData, getKey, heights, itemHeight);

  const extraContent = extraRender?.({
    start,
    end,
    virtual: inVirtual,
    offsetX: offsetLeft,
    offsetY: fillerOffset,
    rtl: isRTL,
    getSize,
  });

  // ================================ Render ================================
  const listChidren = React.useMemo(() => {
    const nextChildren = renderChildren(
      mergedData,
      start,
      end,
      scrollWidth,
      setInstanceRef,
      children,
      sharedConfig,
    );

    if (scrollToCacheState === STABLE || start === lastStartIndex) {
      return nextChildren;
    } else {
      // ========== measure `cachHeight` =============
      const nextChldren = renderChildren(
        mergedData,
        lastStartIndex,
        lastEndIndex,
        scrollWidth,
        setInstanceRef,
        children,
        sharedConfig,
      );

      const childrenKey = new Set(nextChldren.map((item) => item.key));
      // de-duplicate to avoid `react` to render wrong nodes
      nextChildren.forEach((item) => {
        if (!childrenKey.has(item.key)) {
          nextChldren.push(item);
        }
      });

      // last children is always put on top, which due to `Filler`'s nodes is offseted by top,
      return nextChldren;
    }
  }, [
    scrollToCacheState,
    mergedData,
    start,
    end,
    scrollWidth,
    setInstanceRef,
    children,
    sharedConfig,
  ]);

  let componentStyle: React.CSSProperties = null;
  if (height) {
    componentStyle = { [fullHeight ? 'height' : 'maxHeight']: height, ...ScrollStyle };

    if (useVirtual) {
      componentStyle.overflowY = 'hidden';

      if (scrollWidth) {
        componentStyle.overflowX = 'hidden';
      }

      if (scrollMoving) {
        componentStyle.pointerEvents = 'none';
      }
    }
  }

  const containerProps: React.HTMLAttributes<HTMLDivElement> = {};
  if (isRTL) {
    containerProps.dir = 'rtl';
  }

  return (
    <div
      style={{
        ...style,
        position: 'relative',
      }}
      className={mergedClassName}
      {...containerProps}
      {...restProps}
    >
      <ResizeObserver onResize={onHolderResize}>
        <Component
          className={`${prefixCls}-holder`}
          style={componentStyle}
          ref={componentRef}
          onScroll={onFallbackScroll}
          onMouseEnter={delayHideScrollBar}
        >
          <Filler
            prefixCls={prefixCls}
            height={scrollHeight}
            offsetX={offsetLeft}
            offsetY={fillerOffset}
            scrollWidth={scrollWidth}
            onInnerResize={collectHeight}
            ref={fillerInnerRef}
            innerProps={innerProps}
            rtl={isRTL}
            extra={extraContent}
          >
            {listChidren}
          </Filler>
        </Component>
      </ResizeObserver>

      {inVirtual && scrollHeight > height && (
        <ScrollBar
          ref={verticalScrollBarRef}
          prefixCls={prefixCls}
          // if need cache height, just use last scrollTop
          scrollOffset={scrollToCacheState === MEASURE ? componentRef.current.scrollTop : offsetTop}
          scrollRange={scrollHeight}
          rtl={isRTL}
          onScroll={onScrollBar}
          onStartMove={onScrollbarStartMove}
          onStopMove={onScrollbarStopMove}
          spinSize={verticalScrollBarSpinSize}
          containerSize={size.height}
        />
      )}

      {inVirtual && scrollWidth && (
        <ScrollBar
          ref={horizontalScrollBarRef}
          prefixCls={prefixCls}
          scrollOffset={offsetLeft}
          scrollRange={scrollWidth}
          rtl={isRTL}
          onScroll={onScrollBar}
          onStartMove={onScrollbarStartMove}
          onStopMove={onScrollbarStopMove}
          spinSize={horizontalScrollBarSpinSize}
          containerSize={size.width}
          horizontal
        />
      )}
    </div>
  );
}

const List = React.forwardRef<ListRef, ListProps<any>>(RawList);

List.displayName = 'List';

export default List as <Item = any>(
  props: ListProps<Item> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;
