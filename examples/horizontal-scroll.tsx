import * as React from 'react';
import List from '../src/List';

interface Item {
  id: number;
  height: number;
}

const Rect = ({ style }: any) => (
  <div
    style={{
      position: 'sticky',
      top: 0,
      background: 'blue',
      flex: 'none',
      borderInline: `1px solid red`,
      ...style,
    }}
  >
    Hello
  </div>
);

const MyItem: React.ForwardRefRenderFunction<
  HTMLDivElement,
  Item & { style?: React.CSSProperties }
> = (props, ref) => {
  const { id, height, style } = props;

  return (
    <div
      ref={ref}
      style={{
        border: '1px solid gray',
        height,
        lineHeight: '30px',
        boxSizing: 'border-box',
        display: 'flex',
        // position: 'relative',
        alignItems: 'center',
        borderInline: 0,
        ...style,
      }}
    >
      <Rect
        style={{
          left: 0,
        }}
      />
      <div
        style={{
          flex: 'auto',
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {id} {'longText '.repeat(100)}
      </div>
      <Rect
        style={{
          right: 0,
        }}
      />
    </div>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const data: Item[] = [];
for (let i = 0; i < 100; i += 1) {
  data.push({
    id: i,
    height: 30 + Math.random() * 10,
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
              // console.log('Scroll:', e);
            }}
          >
            {(item, _, props) => <ForwardMyItem {...item} {...props} />}
          </List>
        </div>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
