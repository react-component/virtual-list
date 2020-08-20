import * as React from 'react';
import { useRef } from 'react';
import classNames from 'classnames';
import Filler from './Filler';
import ScrollBar from './ScrollBar';
import { RenderFunc, SharedConfig, GetKey } from './interface';
import useChildren from './hooks/useChildren';
import useHeights from './hooks/useHeights';
import useInRange from './hooks/useInRange';
import useScrollTo from './hooks/useScrollTo';
import useDiffItem from './hooks/useDiffItem';
import useFrameWheel from './hooks/useFrameWheel';

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
    }
  | {
      key: React.Key;
      align?: ScrollAlign;
    };
export type ScrollTo = (arg: number | ScrollConfig) => void;
export type ListRef = {
  scrollTo: ScrollTo;
};

export interface ListProps<T> extends React.HTMLAttributes<any> {
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

  onScroll?: React.UIEventHandler<HTMLElement>;
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
    component: Component = 'div',
    ...restProps
  } = props;

  // ================================= MISC =================================
  const inVirtual =
    virtual !== false && height && itemHeight && data && itemHeight * data.length > height;

  const [scrollTop, setScrollTop] = React.useState(0);

  const mergedClassName = classNames(prefixCls, className);
  const mergedData = data || EMPTY_DATA;
  const componentRef = useRef<HTMLDivElement>();

  // =============================== Item Key ===============================
  const getKey = React.useCallback<GetKey<T>>(
    (item: T) => {
      if (typeof itemKey === 'function') {
        return itemKey(item);
      }
      return item[itemKey];
    },
    [itemKey],
  );

  const sharedConfig: SharedConfig<T> = {
    getKey,
  };

  // ================================ Scroll ================================
  function syncScrollTop(newTop: number | ((prev: number) => number)) {
    setScrollTop(origin => {
      let value: number;
      if (typeof newTop === 'function') {
        value = newTop(origin);
      } else {
        value = newTop;
      }

      componentRef.current.scrollTop = value;
      return value;
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
    if (!inVirtual) {
      return {
        scrollHeight: undefined,
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

    // Fallback to normal if not match. This code should never reach
    if (startIndex === undefined) {
      startIndex = 0;
      startOffset = 0;
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
  }, [inVirtual, scrollTop, mergedData, heightUpdatedMark, height]);

  rangeRef.current.start = start;
  rangeRef.current.end = end;

  // =============================== In Range ===============================
  const keepInRange = useInRange(scrollHeight, height);

  // ================================ Scroll ================================
  // Since this added in global,should use ref to keep update
  const onRawWheel = useFrameWheel(inVirtual, offsetY => {
    syncScrollTop(top => {
      const newTop = keepInRange(top + offsetY);
      return newTop;
    });
  });

  function onScrollBar(newScrollTop: number) {
    const newTop = keepInRange(newScrollTop);
    if (newTop !== scrollTop) {
      syncScrollTop(newTop);
    }
  }

  // This code may only trigger in test case.
  // But we still need a sync if some special escape
  function onFallbackScroll(e: React.UIEvent) {
    const { scrollTop: newScrollTop } = e.currentTarget;
    if (newScrollTop !== scrollTop) {
      syncScrollTop(newScrollTop);
    }
  }

  React.useEffect(() => {
    componentRef.current.addEventListener('wheel', onRawWheel);
    return () => {
      componentRef.current.removeEventListener('wheel', onRawWheel);
    };
  }, [inVirtual]);

  // ================================= Ref ==================================
  const scrollTo = useScrollTo<T>(
    componentRef,
    mergedData,
    heights,
    itemHeight,
    getKey,
    collectHeight,
    syncScrollTop,
  );

  React.useImperativeHandle(ref, () => ({
    scrollTo,
  }));

  // ================================ Render ================================
  const listChildren = useChildren(mergedData, start, end, setInstanceRef, children, sharedConfig);

  let componentStyle: React.CSSProperties = null;
  if (height) {
    componentStyle = { [fullHeight ? 'height' : 'maxHeight']: height, ...ScrollStyle };
    componentStyle.overflowY = 'hidden';
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
        >
          {listChildren}
        </Filler>
      </Component>

      <ScrollBar
        prefixCls={prefixCls}
        scrollTop={scrollTop}
        height={height}
        scrollHeight={scrollHeight}
        count={mergedData.length}
        onScroll={onScrollBar}
      />
    </div>
  );
}

const List = React.forwardRef<ListRef, ListProps<any>>(RawList);

List.displayName = 'List';

export default List as <Item = any>(
  props: React.PropsWithChildren<ListProps<Item>> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;
