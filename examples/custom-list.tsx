/* eslint-disable @typescript-eslint/no-shadow */
import * as React from 'react';
import List from '../src/List';

interface Item {
  id: number;
  noUnMount?: boolean;
}

const MyItem: React.ForwardRefRenderFunction<HTMLElement, { item?: Item; onOpen?: () => any }> = (
  { item: { id, noUnMount }, onOpen },
  ref,
) => {
  React.useEffect(() => {
    return () => {
      if (noUnMount) {
        console.log('noUnMount');
      }
    };
  }, [noUnMount]);

  return (
    <span
      ref={ref}
      style={{ border: '1px solid', background: noUnMount ? 'red' : undefined }}
      onClick={() => onOpen()}
    >
      {id}
    </span>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const data: Item[] = [];
for (let i = 0; i < 10; i += 1) {
  data.push({ id: i });
}

const Demo = () => {
  const [list, setList] = React.useState(data);
  return (
    <React.StrictMode>
      <List
        data={list}
        height={100}
        itemHeight={30}
        itemKey="id"
        style={{ border: '1px solid red', boxSizing: 'border-box' }}
        customListRender={(list, startIndex, endIndex) => {
          const _list = list.filter(
            (item, index) => item.noUnMount || (index >= startIndex && index <= endIndex),
          );
          return _list;
        }}
      >
        {(item) => (
          <ForwardMyItem
            item={item}
            onOpen={() =>
              setList((list) =>
                list.map((item2) => ({ ...item2, noUnMount: item2.id === item.id })),
              )
            }
          />
        )}
      </List>
    </React.StrictMode>
  );
};

export default Demo;
