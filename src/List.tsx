import * as React from 'react';
import { useRef, useState } from 'react';
import classNames from 'classnames';
import Filler from './Filler';
import type { InnerProps } from './Filler';
import type { ScrollBarDirectionType } from './ScrollBar';
import ScrollBar from './ScrollBar';
import type { RenderFunc, SharedConfig, GetKey } from './interface';
import useChildren from './hooks/useChildren';
import useHeights from './hooks/useHeights';
import useScrollTo from './hooks/useScrollTo';
import useDiffItem from './hooks/useDiffItem';
import useFrameWheel from './hooks/useFrameWheel';
import useMobileTouchMove from './hooks/useMobileTouchMove';
import useOriginScroll from './hooks/useOriginScroll';
import useLayoutEffect from 'rc-util/lib/hooks/useLayoutEffect';

const EMPTY_DATA = [];

const ScrollStyle: React.CSSProperties = {
  overflowY: 'auto',
  overflowAnchor: 'none',
};

export type ScrollAlign = 'top' | 'bottom' | 'auto';
export type ScrollConfig =
  | {
      index: number;
      align?: ScrollAlign;
      offset?: number;
    }
  | {
      key: React.Key;
      align?: ScrollAlign;
      offset?: number;
    };
export type ScrollTo = (arg: number | ScrollConfig) => void;
export type ListRef = {
  scrollTo: ScrollTo;
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

  onScroll?: React.UIEventHandler<HTMLElement>;
  /** Trigger when render list item changed */
  onVisibleChange?: (visibleList: T[], fullList: T[]) => void;

  /** Inject to inner container props. Only use when you need pass aria related data */
  innerProps?: InnerProps;
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
    component: Component = 'div',
    onScroll,
    onVisibleChange,
    innerProps,
    ...restProps
  } = props;

  // ================================= MISC =================================
  const useVirtual = !!(virtual !== false && height && itemHeight);
  const inVirtual = useVirtual && data && itemHeight * data.length > height;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollMoving, setScrollMoving] = useState(false);

  const mergedClassName = classNames(
    prefixCls,
    { [`${prefixCls}-rtl`]: direction === 'rtl' },
    className,
  );
  const mergedData = data || EMPTY_DATA;
  const componentRef = useRef<HTMLDivElement>();
  const fillerInnerRef = useRef<HTMLDivElement>();
  const scrollBarRef = useRef<any>(); // Hack on scrollbar to enable flash call

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
  function syncScrollTop(newTop: number | ((prev: number) => number)) {
    setScrollTop((origin) => {
      let value: number;
      if (typeof newTop === 'function') {
        value = newTop(origin);
      } else {
        value = newTop;
      }

      const alignedTop = keepInRange(value);

      componentRef.current.scrollTop = alignedTop;
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
  const { scrollHeight, start, end, offset } = React.useMemo(() => {
    if (!useVirtual) {
      return {
        scrollHeight: undefined,
        start: 0,
        end: mergedData.length - 1,
        offset: undefined,
      };
    }

    // Always use virtual scroll bar in avoid shaking
    if (!inVirtual) {
      return {
        scrollHeight: fillerInnerRef.current?.offsetHeight || 0,
        start: 0,
        end: mergedData.length - 1,
        offset: undefined,
      };
    }

    let itemTop = 0;
    let startIndex: number;
    let startOffset: number;
    let endIndex: number;

    const dataLen = mergedData.length;
    for (let i = 0; i < dataLen; i += 1) {
      const item = mergedData[i];
      const key = getKey(item);

      const cacheHeight = heights.get(key);
      const currentItemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);

      // Check item top in the range
      if (currentItemBottom >= scrollTop && startIndex === undefined) {
        startIndex = i;
        startOffset = itemTop;
      }

      // Check item bottom in the range. We will render additional one item for motion usage
      if (currentItemBottom > scrollTop + height && endIndex === undefined) {
        endIndex = i;
      }

      itemTop = currentItemBottom;
    }

    // When scrollTop at the end but data cut to small count will reach this
    if (startIndex === undefined) {
      startIndex = 0;
      startOffset = 0;

      endIndex = Math.ceil(height / itemHeight);
    }
    if (endIndex === undefined) {
      endIndex = mergedData.length - 1;
    }

    // Give cache to improve scroll experience
    endIndex = Math.min(endIndex + 1, mergedData.length);

    return {
      scrollHeight: itemTop,
      start: startIndex,
      end: endIndex,
      offset: startOffset,
    };
  }, [inVirtual, useVirtual, scrollTop, mergedData, heightUpdatedMark, height]);

  rangeRef.current.start = start;
  rangeRef.current.end = end;

  // =============================== In Range ===============================
  const maxScrollHeight = scrollHeight - height;
  const maxScrollHeightRef = useRef(maxScrollHeight);
  maxScrollHeightRef.current = maxScrollHeight;

  function keepInRange(newScrollTop: number) {
    let newTop = newScrollTop;
    if (!Number.isNaN(maxScrollHeightRef.current)) {
      newTop = Math.min(newTop, maxScrollHeightRef.current);
    }
    newTop = Math.max(newTop, 0);
    return newTop;
  }

  const isScrollAtTop = scrollTop <= 0;
  const isScrollAtBottom = scrollTop >= maxScrollHeight;

  const originScroll = useOriginScroll(isScrollAtTop, isScrollAtBottom);

  // ================================ Scroll ================================
  function onScrollBar(newScrollTop: number) {
    const newTop = newScrollTop;
    syncScrollTop(newTop);
  }

  // When data size reduce. It may trigger native scroll event back to fit scroll position
  function onFallbackScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop: newScrollTop } = e.currentTarget;
    if (newScrollTop !== scrollTop) {
      syncScrollTop(newScrollTop);
    }

    // Trigger origin onScroll
    onScroll?.(e);
  }

  // Since this added in global,should use ref to keep update
  const [onRawWheel, onFireFoxScroll] = useFrameWheel(
    useVirtual,
    isScrollAtTop,
    isScrollAtBottom,
    (offsetY) => {
      syncScrollTop((top) => {
        const newTop = top + offsetY;
        return newTop;
      });
    },
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
  }, [useVirtual]);

  // ================================= Ref ==================================
  const scrollTo = useScrollTo<T>(
    componentRef,
    mergedData,
    heights,
    itemHeight,
    getKey,
    collectHeight,
    syncScrollTop,
    () => {
      scrollBarRef.current?.delayHidden();
    },
  );

  React.useImperativeHandle(ref, () => ({
    scrollTo,
  }));

  // ================================ Effect ================================
  /** We need told outside that some list not rendered */
  useLayoutEffect(() => {
    if (onVisibleChange) {
      const renderList = mergedData.slice(start, end + 1);

      onVisibleChange(renderList, mergedData);
    }
  }, [start, end, mergedData]);

  // ================================ Render ================================
  const listChildren = useChildren(mergedData, start, end, setInstanceRef, children, sharedConfig);

  let componentStyle: React.CSSProperties = null;
  if (height) {
    componentStyle = { [fullHeight ? 'height' : 'maxHeight']: height, ...ScrollStyle };

    if (useVirtual) {
      componentStyle.overflowY = 'hidden';

      if (scrollMoving) {
        componentStyle.pointerEvents = 'none';
      }
    }
  }

  return (
    <div
      style={{
        ...style,
        position: 'relative',
      }}
      className={mergedClassName}
      {...restProps}
    >
      <Component
        className={`${prefixCls}-holder`}
        style={componentStyle}
        ref={componentRef}
        onScroll={onFallbackScroll}
      >
        <Filler
          prefixCls={prefixCls}
          height={scrollHeight}
          offset={offset}
          onInnerResize={collectHeight}
          ref={fillerInnerRef}
          innerProps={innerProps}
        >
          {listChildren}
        </Filler>
      </Component>

      {useVirtual && (
        <ScrollBar
          ref={scrollBarRef}
          prefixCls={prefixCls}
          scrollTop={scrollTop}
          height={height}
          scrollHeight={scrollHeight}
          count={mergedData.length}
          direction={direction}
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

const List = React.forwardRef<ListRef, ListProps<any>>(RawList);

List.displayName = 'List';

export default List as <Item = any>(
  props: ListProps<Item> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;
