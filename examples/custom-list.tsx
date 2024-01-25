import * as React from 'react';
import List from '../src/List';

interface Item {
  id: number;
  noUnMount: boolean;
}

const MyItem: React.ForwardRefRenderFunction<HTMLElement, Item> = ({ id }, ref) => {
  return (
    <span ref={ref} style={{ border: '1px solid gray', padding: '0 16px' }}>
      {id}
    </span>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const data: Item[] = [];
for (let i = 0; i < 10; i += 1) {
  data.push({ id: i, noUnMount: i === 9 || i === 0 });
}

const Demo = () => {
  return (
    <React.StrictMode>
      <List
        data={data}
        height={100}
        itemHeight={30}
        itemKey="id"
        style={{ border: '1px solid red', boxSizing: 'border-box' }}
        customListRender={(list, startIndex, endIndex) => {
          const baseList = list.slice(startIndex, endIndex + 1);
          const noMountList = list
            .filter((item) => item.noUnMount)
            .filter((item) => !baseList.find((item2) => item2.id === item.id));

          return [...baseList, ...noMountList];
        }}
      >
        {(item) => <ForwardMyItem {...item} />}
      </List>
    </React.StrictMode>
  );
};

export default Demo;
