import Filler from './Filler';
import ScrollBar from './ScrollBar';
import React, {
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import {
  useChildren,
  useComponentStyle,
  useContainerSize,
  useEventListener,
  useFallbackScroll,
  useFrameWheel,
  useGetKey,
  useInitCache,
  useIsEnableVirtual,
  useIsHorizontalMode,
  useIsVirtualMode,
  useKeepInRange,
  useLockScroll,
  useMobileTouchMove,
  useRenderData,
  useScrollOffset,
  useScrollTo,
  useSyncScrollOffset,
} from './hooks';
import { IDirection } from './types';
import type { IContext, IListProps, IListRef } from './types';
import type { IScrollBarRefProps } from './ScrollBar';
import type { Ref, ReactElement } from 'react';
import findDOMNode from 'rc-util/es/Dom/findDOMNode';

const EMPTY_DATA: unknown[] = [];
const DEFAULT_RENDER_COUNT = 10;

export function RawList<T>(props: IListProps<T>, ref: Ref<IListRef>) {
  const {
    prefixCls = 'rc-virtual-list',
    className,
    containerSize: rawContainerSize,
    itemSize: rawItemSize,
    isStaticItem = false,
    direction = IDirection.Vertical,
    isFullSize = true,
    style,
    data: rawData,
    children,
    itemKey,
    isEnableVirtual: rawIsEnableVirtual = false,
    component: Component = 'div',
    onScroll,
    onVisibleChange,
    innerProps,
    ...restProps
  } = props;

  const [containerSize, updateContainerSize] = useContainerSize(rawContainerSize);

  if (isStaticItem && !rawItemSize) {
    throw new Error('itemsize property is Required when isStaticItem is true');
  }

  const itemSize = rawItemSize || 0;

  const data = useMemo(() => {
    return rawData || (EMPTY_DATA as T[]);
  }, [rawData]);
  // ================================= MISC =================================
  const isEnableVirtual = useIsEnableVirtual({
    isEnableVirtual: rawIsEnableVirtual,
    containerSize,
    itemSize,
  }); // is enable virtual mode
  const isVirtualMode = useIsVirtualMode<T>({
    containerSize,
    itemSize,
    data,
    isUseVirtual: isEnableVirtual,
  }); // is in virtual mode

  const isHorizontalMode = useIsHorizontalMode(direction);

  const [scrollOffset, setScrollOffset] = useScrollOffset(direction); // current scroll offset: scroll top or scroll left
  const [scrollMoving, setScrollMoving] = useState(false);

  const defaultRenderCount = useMemo(() => {
    let count = DEFAULT_RENDER_COUNT;
    if (containerSize && itemSize) {
      count = Math.max(Math.ceil(containerSize / itemSize), 0);
      count = Math.min(count, data.length);
    }
    return count;
  }, [containerSize, itemSize, data]);

  const mergedClassName = `${className || ''} ${prefixCls || ''}`;
  const componentRef = useRef<HTMLDivElement>();
  const fillerInnerRef = useRef<HTMLDivElement>();
  const scrollBarRef = useRef<IScrollBarRefProps>(); // Hack on scrollbar to enable flash call

  // =============================== Item Key ===============================
  const getKey = useGetKey<T>(itemKey);

  const context: IContext<T> = {
    getKey,
  };

  // ================================ Legacy ================================
  // Put ref here since the range is generate by follow
  const rangeRef = useRef({ startIndex: 0, endIndex: data.length });

  // ================================ init element and element size cache ================================
  const [updateElementCache, collectRectSize, getRectSizeByKey, updatedMark] = useInitCache<T>(
    isHorizontalMode,
    getKey,
    undefined,
    undefined,
  );

  // ========================== Visible Calculation =========================
  const { scrollSize, startIndex, endIndex, offset } = useRenderData<T>({
    isVirtualMode,
    isEnableVirtual,
    isHorizontalMode,
    isStaticItem,
    containerSize,
    itemSize,
    defaultRenderCount,
    scrollOffset,
    data,
    updatedMark,
    fillerInnerRef,
    getKey,
    getRectSizeByKey,
  });

  rangeRef.current.startIndex = startIndex;
  rangeRef.current.endIndex = endIndex;

  // =============================== In Range ===============================
  const maxScrollSize = Math.max((scrollSize || 0) - containerSize, 0);
  const maxScrollSizeRef = useRef<number>(maxScrollSize);
  maxScrollSizeRef.current = maxScrollSize;

  // keep scrollTop in range 0 ~ maxScrollHeight
  const keepInRange = useKeepInRange(maxScrollSizeRef);

  // ================================ Scroll ================================
  const syncScrollOffset = useSyncScrollOffset(
    isHorizontalMode,
    componentRef,
    keepInRange,
    setScrollOffset,
  );

  const isScrollAtStart = scrollOffset <= 0;
  const isScrollAtEnd = scrollOffset >= maxScrollSize;

  const lockScrollFn = useLockScroll(isScrollAtStart, isScrollAtEnd);

  // ================================ Scroll ================================
  const handleScrollBarScroll = useCallback(
    (newScrollOffset: number) => {
      const newOffset = newScrollOffset;
      syncScrollOffset(newOffset);
    },
    [syncScrollOffset],
  );

  // When data size reduce. It may trigger native scroll event back to fit scroll position
  const handleFallbackScroll = useFallbackScroll(
    isHorizontalMode,
    isVirtualMode,
    scrollOffset,
    syncScrollOffset,
    onScroll,
  );

  // Since this added in global, should use ref to keep update
  const onWheelDelta = useCallback(
    (delta: number) => {
      syncScrollOffset((_scrollOffset) => {
        const newScrollOffset = _scrollOffset + delta;
        return newScrollOffset;
      });
    },
    [syncScrollOffset],
  );
  const [onRawWheel, onFireFoxScroll] = useFrameWheel(
    isHorizontalMode,
    isEnableVirtual,
    isScrollAtStart,
    isScrollAtEnd,
    onWheelDelta,
  );

  // Mobile touch move
  useMobileTouchMove(isHorizontalMode, isEnableVirtual, componentRef, (delta, smoothOffset) => {
    if (lockScrollFn(delta, smoothOffset)) {
      return false;
    }
    const evt = ({
      preventDefault() {},
      [isHorizontalMode ? 'deltaX' : 'deltaY']: delta,
    } as unknown) as WheelEvent;
    onRawWheel(evt);
    return true;
  });

  useEventListener(isEnableVirtual, componentRef, onRawWheel, onFireFoxScroll);

  // ================================= Ref ==================================
  const showScrollbar = useCallback(() => {
    scrollBarRef.current?.showScrollbar();
  }, [scrollBarRef]);
  const scrollTo = useScrollTo<T>(
    isHorizontalMode,
    componentRef,
    data,
    getRectSizeByKey,
    itemSize,
    getKey,
    collectRectSize,
    syncScrollOffset,
    showScrollbar,
  );

  useImperativeHandle(ref, () => ({
    scrollTo,
  }));

  // ================================ Effect ================================
  /** We need told outside that some list not rendered */
  useLayoutEffect(() => {
    if (onVisibleChange) {
      const renderList = data.slice(startIndex, endIndex + 1);

      onVisibleChange(renderList, data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex, endIndex, data]);

  // ================================ Render ================================
  const listChildren = useChildren(
    data,
    startIndex,
    endIndex,
    updateElementCache,
    children,
    context,
  );

  const componentStyle = useComponentStyle({
    isEnableVirtual,
    scrollMoving,
    isHorizontalMode,
    rawContainerSize,
    containerSize,
    isFullSize,
  });

  const wrapperStyle = useMemo(() => {
    const field = isHorizontalMode ? 'width' : 'height';
    return {
      ...(style || {}),
      position: 'relative' as const,
      ...(typeof rawContainerSize === 'string' ? { [field]: rawContainerSize } : {}),
    };
  }, [style, rawContainerSize, isHorizontalMode]);

  const handleComponentRef = useCallback(
    (compRef) => {
      componentRef.current = compRef;
      if (typeof rawContainerSize === 'string' && !containerSize) {
        const field = isHorizontalMode ? 'offsetWidth' : 'offsetHeight';
        const domNode = findDOMNode(compRef);
        const size = domNode?.[field];
        if (size) {
          updateContainerSize(size);
        }
      }
    },
    [componentRef, rawContainerSize, containerSize, isHorizontalMode, updateContainerSize],
  );

  const _scrollSize = scrollSize || 0;

  return (
    <div {...restProps} style={wrapperStyle} className={mergedClassName}>
      <Component
        className={`${prefixCls}-holder`}
        style={componentStyle}
        ref={handleComponentRef}
        onScroll={handleFallbackScroll}
      >
        <Filler
          prefixCls={prefixCls}
          isHorizontalMode={isHorizontalMode}
          isVirtualMode={isVirtualMode}
          scrollSize={_scrollSize} // sum of all children element
          offset={offset}
          onInnerResize={collectRectSize}
          ref={fillerInnerRef}
          innerProps={innerProps}
        >
          {listChildren}
        </Filler>
      </Component>

      {isEnableVirtual && (
        <ScrollBar
          ref={scrollBarRef}
          prefixCls={prefixCls}
          isHorizontalMode={isHorizontalMode}
          scrollOffset={scrollOffset}
          containerSize={containerSize}
          scrollSize={_scrollSize}
          count={data.length}
          onScroll={handleScrollBarScroll}
          onStartMove={() => {
            setScrollMoving(true);
          }}
          onStopMove={() => {
            setScrollMoving(false);
          }}
        />
      )}
    </div>
  );
}

const List = forwardRef<IListRef, IListProps<any>>(RawList);

List.displayName = 'List';

export default List as <Item = any>(
  props: IListProps<Item> & { ref?: Ref<IListRef> },
) => ReactElement;
