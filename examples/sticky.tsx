import * as React from 'react';
import List from '../src/List';

interface Item {
  id: number;
  height: number;
  style?: React.CSSProperties;
}

const MyItem: React.ForwardRefRenderFunction<HTMLElement, Item> = ({ id, height, style }, ref) => {
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
        width: '100%',
        ...style,
        ...(style.position
          ? {
              background: 'white',
            }
          : {}),
      }}
    >
      {id}
    </span>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const data: Item[] = [];
for (let i = 0; i < 100; i += 1) {
  data.push({
    id: i,
    height: 30 + (i % 2 ? 70 : 0),
  });
}

const Demo = () => {
  return (
    <React.StrictMode>
      <div>
        <h2>Sticky</h2>

        <List
          data={data}
          height={500}
          itemHeight={30}
          itemKey="id"
          stickyIndexes={[2, 4, 6]}
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item, _, { style }) => <ForwardMyItem {...item} style={style} />}
        </List>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
