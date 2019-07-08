import * as React from 'react';
import List from '../src/List';

interface Item {
  id: number;
}

const MyItem: React.FC<Item> = ({ id }, ref) => {
  return (
    <span
      ref={ref}
      style={{
        border: '1px solid gray',
        padding: '0 16px',
        height: 30,
        lineHeight: '30px',
        boxSizing: 'border-box',
        display: 'inline-block',
      }}
    >
      {id}
    </span>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const dataSource: Item[] = [];
for (let i = 0; i < 100; i += 1) {
  dataSource.push({
    id: i,
  });
}

const Demo = () => {
  return (
    <React.StrictMode>
      <div>
        <h2>Basic</h2>
        <List
          dataSource={dataSource}
          height={200}
          itemHeight={30}
          style={{ border: '1px solid red', boxSizing: 'border-box' }}
        >
          {item => <ForwardMyItem {...item} />}
        </List>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
