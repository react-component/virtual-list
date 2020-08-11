import * as React from 'react';
import classNames from 'classnames';
import Filler from './Filler';
import { RenderFunc, SharedConfig } from './interface';
import { useChildren } from './hooks/useChildren';
import { useHeights } from './hooks/useHeights';

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
export type ListRef = {
  scrollTo: number | ScrollConfig;
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
  /** Disable scroll check. Usually used on animation control */
  disabled?: boolean;
  /** Set `false` will always use real scroll instead of virtual one */
  virtual?: boolean;

  /** When `disabled`, trigger if changed item not render. */
  onSkipRender?: () => void;
  onScroll?: React.UIEventHandler<HTMLElement>;
}

const List = React.forwardRef<ListRef, ListProps<any>>((props, ref) => {
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

  const inVirtual =
    virtual !== false && height && itemHeight && data && itemHeight * data.length > height;
  const [collectHeight, heights] = useHeights();

  const mergedClassName = classNames(prefixCls, className);

  const getKey = React.useCallback(
    (item: any) => {
      if (typeof itemKey === 'function') {
        return itemKey(item);
      }
      return item[itemKey];
    },
    [itemKey],
  );

  const myData = data;
  const sharedConfig: SharedConfig<any> = {
    getKey,
  };

  const listChildren = useChildren(myData, 0, myData.length, collectHeight, children, sharedConfig);

  return (
    <Component
      style={
        height ? { ...style, [fullHeight ? 'height' : 'maxHeight']: height, ...ScrollStyle } : style
      }
      className={mergedClassName}
      {...restProps}
      // onScroll={this.onRawScroll}
      // ref={this.listRef}
    >
      <Filler prefixCls={prefixCls} height={height}>
        {listChildren}
      </Filler>
    </Component>
  );
});

List.displayName = 'List';

export default List as <Item = any>(
  props: React.PropsWithChildren<ListProps<Item>> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;
