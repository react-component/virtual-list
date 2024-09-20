import * as React from 'react';
import List from '../src/List';
import './basic.less';

interface Item {
  id: number;
}

const data: Item[] = [];
for (let i = 0; i < 100; i += 1) {
  data.push({
    id: i,
  });
}

const MyItem: React.ForwardRefRenderFunction<any, Item> = ({ id }, ref) => (
  <div style={{ padding: 20, background: 'yellow' }} ref={ref}>
    <List
      data={data}
      height={200}
      itemHeight={20}
      itemKey="id"
      style={{
        border: '1px solid blue',
        boxSizing: 'border-box',
        background: 'white',
      }}
      debug={`inner_${id}`}
    >
      {(item, index, props) => (
        <div {...(item as any)} {...props} style={{ height: 20, border: '1px solid cyan' }}>
          {id}-{index}
        </div>
      )}
    </List>
  </div>
);

const ForwardMyItem = React.forwardRef(MyItem);

const onScroll: React.UIEventHandler<HTMLElement> = (e) => {
  // console.log('scroll:', e.currentTarget.scrollTop);
};

const Demo = () => {
  return (
    <React.StrictMode>
      <List
        id="list"
        data={data}
        height={800}
        itemHeight={20}
        itemKey="id"
        style={{
          border: '1px solid red',
          boxSizing: 'border-box',
        }}
        onScroll={onScroll}
        debug="outer"
      >
        {(item, _, props) => <ForwardMyItem {...item} {...props} />}
      </List>
    </React.StrictMode>
  );
};

export default Demo;

/* eslint-enable */
