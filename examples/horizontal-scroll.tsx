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
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {id} {'longText '.repeat(100)}
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
  const [rtl, setRTL] = React.useState(false);
  return (
    <React.StrictMode>
      <div>
        <button
          onClick={() => {
            setRTL(!rtl);
          }}
        >
          RTL: {String(rtl)}
        </button>

        <div style={{ width: 500, margin: 64 }}>
          <List
            direction={rtl ? 'rtl' : 'ltr'}
            data={data}
            height={300}
            itemHeight={30}
            itemKey="id"
            scrollWidth={2328}
            // scrollWidth={100}
            style={{
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
            onScroll={(e) => {
              console.log('Scroll:', e);
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
