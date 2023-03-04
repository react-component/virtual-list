import { forwardRef } from 'react';
import { RawList } from '../List';
import type { PropsWithChildren, ReactElement, Ref } from 'react'
import type { IListProps, IListRef } from '../types';

const List = forwardRef((props: IListProps<any>, ref: Ref<IListRef>) =>
  RawList({ ...props, enableVirtualMode: false }, ref),
) as <IItem = any>(
  props: PropsWithChildren<IListProps<IItem>> & { ref?: Ref<IListRef> },
) => ReactElement;

(List as any).displayName = 'List';

export default List;
