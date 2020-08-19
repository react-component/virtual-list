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

  rangeRef.current.start = start;
  rangeRef.current.end = end;

  // =============================== In Range ===============================
  const keepInRange = useInRange(scrollHeight, height);

  // ================================ Scroll ================================
  // Since this added in global,should use ref to keep update
  const onRawWheel = useFrameWheel(inVirtual, offsetY => {
    setScrollTop(top => {
      const newTop = keepInRange(top + offsetY);

      componentRef.current.scrollTop = newTop;
      return newTop;
    });
  });

  // Additional handle the scroll which not trigger by wheel
  // function onRawScroll(event: React.UIEvent) {
  //   // const newScrollTop = (event.target as HTMLDivElement).scrollTop;
  //   // const newTop = keepInRange(newScrollTop);
  //   // // document.getElementById('mark').innerText = [newScrollTop, newTop].join('/');
  //   // // const listEle = document.getElementById('list');
  //   // // console.log('>>>>>>>', newTop, listEle.scrollHeight);
  //   // if (newTop !== scrollTop) {
  //   //   setScrollTop(newTop);
  //   // }
  // }

  function onScrollBar(newScrollTop: number) {
    const newTop = keepInRange(newScrollTop);
    if (newTop !== scrollTop) {
      setScrollTop(newTop);
      componentRef.current.scrollTop = newTop;
    }
  }

  React.useEffect(() => {
    function onDomScroll(event: UIEvent) {
      const newScrollTop = (event.target as HTMLDivElement).scrollTop;
      const newTop = keepInRange(newScrollTop);
      document.getElementById('mark').innerText = [newScrollTop, newTop].join('/');
      // console.log('Scroll >>>>>>', newTop);
    }

    componentRef.current.addEventListener('wheel', onRawWheel);
    // window.addEventListener('scroll', onDomScroll, true);
    // window.addEventListener('scroll', onDomScroll, false);
    componentRef.current.addEventListener('scroll', onDomScroll, { passive: true });
    return () => {
      componentRef.current.removeEventListener('wheel', onRawWheel);
      // window.removeEventListener('scroll', onDomScroll, true);
      // window.removeEventListener('scroll', onDomScroll, false);
      componentRef.current.removeEventListener('scroll', onDomScroll);
    };
  }, [inVirtual]);
  // console.log('render', scrollTop);

  // ================================= Ref ==================================
  const scrollTo = useScrollTo<T>(
    componentRef,
    mergedData,
    heights,
    itemHeight,
    getKey,
    collectHeight,
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
    <>
      {scrollTop}
      <Component
        style={{
          ...style,
          position: 'relative',
        }}
        className={mergedClassName}
        {...restProps}
      >
        <div
          style={componentStyle}
          ref={componentRef}
          // onScroll={onRawScroll}
        >
          <Filler
            prefixCls={prefixCls}
            height={scrollHeight}
            offset={offset}
            onInnerResize={collectHeight}
          >
            {listChildren}
          </Filler>
        </div>

        <ScrollBar
          scrollTop={scrollTop}
          height={height}
          scrollHeight={scrollHeight}
          count={mergedData.length}
          onScroll={onScrollBar}
        />
      </Component>
    </>
  );
}

const List = React.forwardRef<ListRef, ListProps<any>>(RawList);

List.displayName = 'List';

export default List as <Item = any>(
  props: React.PropsWithChildren<ListProps<Item>> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;
