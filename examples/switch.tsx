import * as React from 'react';
import List from '../src/List';

interface Item {
  id: number;
}

const MyItem: React.FC<Item> = ({ id }, ref) => (
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

const ForwardMyItem = React.forwardRef(MyItem);

function getData(count: number) {
  const data: Item[] = [];
  for (let i = 0; i < count; i += 1) {
    data.push({
      id: i,
    });
  }
  return data;
}

const Demo = () => {
  const [data, setData] = React.useState<{ id: number }[]>(getData(1));

  return (
    <React.StrictMode>
      <div>
        <h2>Switch</h2>
        <List
          data={data}
          height={200}
          itemHeight={30}
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item, _, props) => <ForwardMyItem {...item} {...props} />}
        </List>
        <button
          type="button"
          onClick={() => {
            setData(data.length === 1 ? getData(10000) : getData(1));
          }}
        >
          Switch
        </button>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
