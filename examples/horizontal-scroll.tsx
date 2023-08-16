import * as React from 'react';
import List from '../src/List';

interface Item {
  id: number;
  height: number;
}

const MyItem: React.ForwardRefRenderFunction<HTMLElement, Item> = ({ id, height }, ref) => {
  return (
    <span
      ref={ref}
      style={{
        border: '1px solid gray',
        padding: '0 16px',
        height,
        lineHeight: '30px',
        boxSizing: 'border-box',
        display: 'inline-block',
      }}
    >
      longtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtextlongtext
    </span>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const data: Item[] = [];
for (let i = 0; i < 100; i += 1) {
  data.push({
    id: i,
    height: 30,
  });
}

const Demo = () => {
  return (
    <React.StrictMode>
      <div>
        <h2>Dynamic Height</h2>

        <div style={{ width: 500 }}>
          <List
            data={data}
            height={300}
            itemHeight={30}
            itemKey="id"
            scrollWidth={2328}
            style={{
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
          >
            {(item) => <ForwardMyItem {...item} />}
          </List>
        </div>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
