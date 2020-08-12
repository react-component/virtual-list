import * as React from 'react';
import classNames from 'classnames';
import Filler from './Filler';
import { RenderFunc, SharedConfig, GetKey } from './interface';
import useChildren from './hooks/useChildren';
import useHeights from './hooks/useHeights';
import useInRange from './hooks/useInRange';
import useScrollTo from './hooks/useScrollTo';
import useDiffItem from './hooks/useDiffItem';

const EMPTY_DATA = [];

const ScrollStyle = {
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

  /** @deprecated only compatible for old usage */
  disabled?: boolean;

  /** When `disabled`, trigger if changed item not render. */
  onSkipRender?: () => void;
}

function RawList<T>(props: ListProps<T>, ref: React.Ref<ListRef>) {
  const {
    prefixCls,
    className,
    height,
    itemHeight,
    fullHeight = true,
    style,
    data,
    children,
    itemKey,
    virtual,
    disabled,
    onSkipRender,
    component: Component = 'div',
    ...restProps
  } = props;

  const mergedData = data || EMPTY_DATA;
  const componentRef = React.useRef<HTMLDivElement>();

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

  // ================================ Legacy ================================
  const diffItemRef = React.useRef<T>();
  const diffItem = useDiffItem(mergedData, getKey);
  diffItemRef.current = diffItem;

  // ================================= MISC =================================
  const inVirtual =
    virtual !== false && height && itemHeight && data && itemHeight * data.length > height;

  const [getInstanceRefFunc, collectHeight, heights, heightUpdatedMark] = useHeights(
    getKey,
    null,
    item => {
      if (disabled && diffItemRef.current === item) {
        onSkipRender?.();
      }
    },
  );

  const [scrollTop, setScrollTop] = React.useState(0);

  const mergedClassName = classNames(prefixCls, className);

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

    for (let i = 0; i < mergedData.length; i += 1) {
      const item = mergedData[i];
      const key = getKey(item);

      const currentItemBottom = itemTop + (heights.get(key) ?? itemHeight);

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

    // Fallback to normal if not match
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

  // =============================== In Range ===============================
  const keepInRange = useInRange(scrollHeight, height);

  // ================================ Scroll ================================
  // Since this added in global,should use ref to keep update
  function onRawWheel(event: MouseWheelEvent) {
    if (!inVirtual) return;

    // Proxy of scroll events
    event.preventDefault();

    setScrollTop(top => {
      const newTop = keepInRange(top + event.deltaY);

      componentRef.current.scrollTop = newTop;
      return newTop;
    });
  }

  // Additional handle the scroll which not trigger by wheel
  function onRawScroll(event: React.UIEvent) {
    if (!inVirtual) return;

    const newTop = keepInRange((event.target as HTMLDivElement).scrollTop);
    if (newTop !== scrollTop) {
      setScrollTop(newTop);
    }
  }

  React.useEffect(() => {
    componentRef.current.addEventListener('wheel', onRawWheel);
    return () => {
      componentRef.current.removeEventListener('wheel', onRawWheel);
    };
  }, [inVirtual]);

  // ================================= Ref ==================================
  const scrollTo = useScrollTo<T>(componentRef, mergedData, height, heights, itemHeight, getKey);

  React.useImperativeHandle(ref, () => ({
    scrollTo,
  }));

  // ================================ Render ================================
  const listChildren = useChildren(
    mergedData,
    start,
    end,
    getInstanceRefFunc,
    children,
    sharedConfig,
  );

  return (
    <Component
      style={
        height ? { ...style, [fullHeight ? 'height' : 'maxHeight']: height, ...ScrollStyle } : style
      }
      className={mergedClassName}
      {...restProps}
      ref={componentRef}
      onScroll={onRawScroll}
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
  );
}

const List = React.forwardRef<ListRef, ListProps<any>>(RawList);

List.displayName = 'List';

export default List as <Item = any>(
  props: React.PropsWithChildren<ListProps<Item>> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;
