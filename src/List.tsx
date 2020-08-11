import * as React from 'react';

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

export type RenderFunc<T> = (
  item: T,
  index: number,
  props: { style: React.CSSProperties },
) => React.ReactNode;

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

const List = React.forwardRef<ListRef, ListProps<any>>(() => {});

List.displayName = 'List';

export default List as <Item = any>(
  props: React.PropsWithChildren<ListProps<Item>> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;
