import type { CSSProperties, Key, ReactNode, HTMLAttributes, FC, ComponentClass, UIEventHandler } from 'react';
import type { IInnerProps } from './Filler';

export type IScrollAlign = 'top' | 'bottom' | 'auto';
export type IScrollConfig =
  | {
    index: number;
    align?: IScrollAlign;
    offset?: number;
  }
  | {
    key: Key;
    align?: IScrollAlign;
    offset?: number;
  };
export type IScrollTo = (arg: number | IScrollConfig) => void;
export type IListRef = {
  scrollTo: IScrollTo;
};

export type IItemKey = Key | (<T>(item: T) => Key);

export enum IDirection {
  Horizontal = 1,
  Vertical
}

export interface IListProps<T> extends Omit<HTMLAttributes<any>, 'children'> {
  prefixCls?: string;
  children: IRenderFunc<T>;
  data: T[];
  containerSize?: number;   // container rect size, height in vertical mode and width in horizontal mode.
  itemSize?: number;  // item min size, height in vertical mode and width in horizontal mode
  isStaticItem?: boolean; // whether fixed width or height element
  direction?: IDirection; // is horizontal list or vertical list , default vertical
  fullSize?: boolean; // If not match virtual scroll condition, Set List still use width or height of container.
  itemKey: IItemKey;
  component?: string | FC<any> | ComponentClass<any>;
  enableVirtualMode?: boolean; // Set `false` will always use real scroll instead of virtual one.
  onScroll?: UIEventHandler<HTMLElement>;
  onVisibleChange?: (visibleList: T[], fullList: T[]) => void; // Trigger when render list item changed
  innerProps?: IInnerProps; // Inject to inner container props. Only use when you need pass aria related data
}

export type IRenderFunc<T> = (
  item: T,
  index: number,
  props: { style?: CSSProperties },
) => ReactNode;

export type IGetKey<T> = (item: T) => Key;

export interface IContext<T> {
  getKey: (item: T) => Key;
}

export type ITargetAlign = 'start' | 'end';

export type ITimeoutHandher = ReturnType<typeof setTimeout>;