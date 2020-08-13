import * as React from 'react';
import OriginList, { ListProps, ListRef } from './List';

const List = React.forwardRef((props: ListProps<any>, ref: React.Ref<ListRef>) => (
  <OriginList {...props} ref={ref} virtual={false} />
)) as <Item = any>(
  props: React.PropsWithChildren<ListProps<Item>> & { ref?: React.Ref<ListRef> },
) => React.ReactElement;

(List as any).displayName = 'List';

export default List;
