import Filler from './Filler';
import ScrollBar from './ScrollBar';
import { useImperativeHandle, useMemo, useRef, useState, forwardRef, useLayoutEffect } from 'react';
import { useChildren, useComponentStyle, useFrameWheel, useGetKey, useInitCache, useIsEnableVirtual, useIsHorizontalMode, useIsVirtualMode, useLockScroll, useMobileTouchMove, useScrollOffset, useScrollTo } from './hooks';
import { IDirection } from './types';
import type { IContext } from './types';
import type { IScrollBarRefProps } from './ScrollBar';
import type { UIEvent, Ref, ReactElement } from 'react';
import type { IListProps, IListRef } from './types';

const EMPTY_DATA = [];


export function RawList<T>(props: IListProps<T>, ref: Ref<IListRef>) {
  const {
    prefixCls = 'rc-virtual-list',
    className,
    containerSize,
    itemSize,
    isStaticItem = false,
    direction = IDirection.Vertical,
    fullSize = true,
    style,
    data: rawData,
    children,
    itemKey,
    enableVirtualMode,
    component: Component = 'div',
    onScroll,
    onVisibleChange,
    innerProps,
    ...restProps
  } = props;

  if(isStaticItem && !itemSize) {
    throw new Error('itemsize property is Required when isStaticItem is true')
  }

  // ================================= MISC =================================
  const isEnableVirtual = useIsEnableVirtual<T>(props); // is enable virtual mode
  const isVirtualMode = useIsVirtualMode<T>(props, isEnableVirtual); // is in virtual mode
  const isHorizontalMode = useIsHorizontalMode(direction);

  const [scrollOffset, setScrollOffset] = useScrollOffset(0); // current scroll offset: scroll top or scroll left
  const [scrollMoving, setScrollMoving] = useState(false);
  const defaultRenderCount = useMemo(()=> {
    return  Math.ceil(containerSize / itemSize);
  }, [containerSize, itemSize])

  const mergedClassName = `${ className || '' } ${ prefixCls || '' }`;
  const data = rawData || EMPTY_DATA;
  const componentRef = useRef<HTMLDivElement>();
  const fillerInnerRef = useRef<HTMLDivElement>();
  const scrollBarRef = useRef<IScrollBarRefProps>(); // Hack on scrollbar to enable flash call

  // =============================== Item Key ===============================
  const getKey = useGetKey<T>(itemKey);

  const context: IContext<T> = {
    getKey,
  };

  // ================================ Scroll ================================
  function syncScrollOffset(newOffset: number | ((prev: number) => number)) {
    setScrollOffset((offset) => {
      const value = typeof newOffset === 'function' ? newOffset(offset) : newOffset;
      const alignedOffset = keepInRange(value);

      const field = isHorizontalMode? 'scrollLeft' : 'scrollTop';
      componentRef.current[field] = alignedOffset;
      return alignedOffset;
    });
  }

  // ================================ Legacy ================================
  // Put ref here since the range is generate by follow
  const rangeRef = useRef({ startIndex: 0, endIndex: data.length });

  // ================================ init element and element size cache ================================
  const [updateElementCache, collectRectSize, getRectSizeByKey, updatedMark] = useInitCache<T>(
    isHorizontalMode,
    getKey,
    null,
    null,
  );

  // ========================== Visible Calculation =========================
  /**
   * Visible Calculation
   * 
   * scrollSize: container max width or height
   * startIndex  the first item index to be rendered
   * endIndex: the last item index to be rendered
   * offset: the left or top  of start item position
   *  */ 
  
  const { scrollSize, startIndex, endIndex, offset } = useMemo(() => {
    if (!isEnableVirtual) {
      return {
        scrollSize: undefined, 
        startIndex: 0,
        endIndex: data.length - 1,
        offset: undefined,
      };
    }

    // Always use virtual scroll bar in avoid shaking
    if (!isVirtualMode) {
      const _scrollSize = fillerInnerRef.current?.[isHorizontalMode ? 'offsetWidth' : 'offsetHeight'] || 0
      return {
        scrollSize: _scrollSize,
        startIndex: 0,
        endIndex: data.length - 1,
        offset: undefined,
      };
    }

    const dataLen = data.length;

    let itemStart = 0;
    let startIdx: number;
    let firstChildOffset: number;
    let endIdx: number;

    // optimization static item 
    const _containerSize = containerSize || 0;
    if(isStaticItem && itemSize) {
      startIdx = Math.max(Math.ceil(scrollOffset / itemSize) - 1, 0);
      endIdx = Math.max(Math.ceil((scrollOffset + _containerSize) / itemSize) - 1, 1);
      firstChildOffset = itemSize * startIdx;
      return {
        scrollSize: itemSize * dataLen, 
        startIndex: startIdx,
        endIndex: endIdx,
        offset: firstChildOffset,
      }
    }

    for (let i = 0; i < dataLen; i += 1) {
      const item = data[i];
      const key = getKey(item);

      const cacheSize = getRectSizeByKey(key);
      const currentItemSize = (cacheSize ?? itemSize) || 0;
      const currentItemEnd = itemStart + currentItemSize;
      // Check if item in the viewport range and check if the first viewport item
      if (currentItemEnd >= scrollOffset && startIdx === undefined) {
        startIdx = i;
        firstChildOffset = itemStart;
      }

      // Check item end in the range. We will render additional one item for motion usage
      const viewportEnd = scrollOffset + _containerSize;
      if (currentItemEnd > viewportEnd && endIdx === undefined) {
        endIdx = i;
      }

      itemStart = currentItemEnd; // update next item start position
    }

    // When scrollOffset at the end but data cut to small count will reach this
    if (startIdx === undefined) {
      startIdx = 0;
      firstChildOffset = 0;

      endIdx = defaultRenderCount;
    }
    
    if (endIdx === undefined) {
      endIdx = data.length - 1;
    }

    // Give cache to improve scroll experience
    endIdx = Math.min(endIdx + 1, data.length);

    return {
      scrollSize: itemStart, 
      startIndex: startIdx,
      endIndex: endIdx,
      offset: firstChildOffset,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVirtualMode, isEnableVirtual, isHorizontalMode, isStaticItem, itemSize, defaultRenderCount, scrollOffset, data, updatedMark]);

  rangeRef.current.startIndex = startIndex;
  rangeRef.current.endIndex = endIndex;

  // =============================== In Range ===============================
  const maxScrollSize = scrollSize - containerSize;
  const maxScrollSizeRef = useRef(maxScrollSize);
  maxScrollSizeRef.current = maxScrollSize;

  // keep scrollTop in range 0 ~ maxScrollHeight 
  function keepInRange(newScrollOffset: number) {
    let newOffset = newScrollOffset;
    if (!Number.isNaN(maxScrollSizeRef.current)) {
      newOffset = Math.min(newOffset, maxScrollSizeRef.current);
    }
    newOffset = Math.max(newOffset, 0);
    return newOffset;
  }

  const isScrollAtStart = scrollOffset <= 0;
  const isScrollAtEnd = scrollOffset >= maxScrollSize;

  const lockScrollFn = useLockScroll(isScrollAtStart, isScrollAtEnd);

  // ================================ Scroll ================================
  function onScrollBar(newScrollOffset: number) {
    const newOffset = newScrollOffset;
    syncScrollOffset(newOffset);
  }

  // When data size reduce. It may trigger native scroll event back to fit scroll position
  function onFallbackScroll(e: UIEvent<HTMLDivElement>) {
    const newScrollOffset = e.currentTarget[isHorizontalMode ? 'scrollLeft' : 'scrollTop'];
    if (newScrollOffset !== scrollOffset) {
      syncScrollOffset(newScrollOffset);
    }

    // Trigger origin onScroll
    onScroll?.(e);
  }

  // Since this added in global, should use ref to keep update
  const [onRawWheel, onFireFoxScroll] = useFrameWheel(
    isHorizontalMode,
    isEnableVirtual,
    isScrollAtStart,
    isScrollAtEnd,
    (delta) => {
      syncScrollOffset((_scrollOffset) => {
        const newScrollOffset = _scrollOffset + delta;
        return newScrollOffset;
      });
    },
  );

  // Mobile touch move
  useMobileTouchMove(
    isHorizontalMode,
    isEnableVirtual,
    componentRef,
    (delta, smoothOffset) => {
      if (lockScrollFn(delta, smoothOffset)) {
        return false;
      }
      const evt = {
        preventDefault() {},
        [isHorizontalMode ? 'deltaX' : 'deltaY']: delta
      } as unknown as WheelEvent;
      onRawWheel(evt);
      return true;
    }
  );

  useLayoutEffect(() => {
    // Firefox only
    function onMozMousePixelScroll(e: Event) {
      if (isEnableVirtual) {
        e.preventDefault();
      }
    }

    componentRef.current.addEventListener('wheel', onRawWheel);
    componentRef.current.addEventListener('DOMMouseScroll', onFireFoxScroll as any);
    componentRef.current.addEventListener('MozMousePixelScroll', onMozMousePixelScroll);

    return () => {
      if (componentRef.current) {
        componentRef.current.removeEventListener('wheel', onRawWheel);
        componentRef.current.removeEventListener('DOMMouseScroll', onFireFoxScroll as any);
        componentRef.current.removeEventListener(
          'MozMousePixelScroll',
          onMozMousePixelScroll as any,
        );
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnableVirtual]);

  // ================================= Ref ==================================
  const scrollTo = useScrollTo<T>(
    isHorizontalMode,
    componentRef,
    data,
    getRectSizeByKey,
    itemSize,
    getKey,
    collectRectSize,
    syncScrollOffset,
    () => {
      scrollBarRef.current?.showScrollbar()
    },
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
  const listChildren = useChildren(data, startIndex, endIndex, updateElementCache, children, context);

  const componentStyle = useComponentStyle({ isEnableVirtual, scrollMoving, isHorizontalMode, containerSize, fullSize });

  return (
    <div
      {...restProps}
      style={{
        ...style,
        position: 'relative',
      }}
      className={mergedClassName}
    >
      <Component
        className={`${prefixCls}-holder`}
        style={componentStyle}
        ref={componentRef}
        onScroll={onFallbackScroll}
      >
        <Filler
          prefixCls={prefixCls}
          isHorizontalMode={isHorizontalMode}
          isVirtualMode={isVirtualMode}
          scrollSize={scrollSize} // sum of all children element
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
          scrollSize={scrollSize}
          count={data.length}
          onScroll={onScrollBar}
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
