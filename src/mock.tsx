import * as React from 'react';
import type { ListProps, ListRef } from './List';
import { RawList } from './List';

const List = React.forwardRef<ListRef, ListProps<any>>((props, ref) =>
  RawList({ ...props, virtual: false }, ref),
) as <Item = any>(
  props: React.PropsWithChildren<ListProps<Item>> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;

if (process.env.NODE_ENV !== 'production') {
  (List as any).displayName = 'List';
}

export default List;
