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
  const [height, setHeight] = React.useState(200);
  const [state, setState] = React.useState<number>(1);

  const data = React.useMemo(() => {
    switch (state) {
      case 0:
        return getData(1000);
      case 1:
        return getData(2);
      default:
        return getData(0);
    }
  }, [state]);

  return (
    <React.StrictMode>
      <div>
        <h2>Switch</h2>

        <button
          type="button"
          onClick={() => {
            setState((state + 1) % 3);
          }}
        >
          Switch
        </button>
        <button
          type="button"
          onClick={() => {
            switch (height) {
              case 200:
                setHeight(0);
                break;
              case 0:
                setHeight(100);
                break;
              default:
                setHeight(200);
                break;
            }
          }}
        >
          Height
        </button>

        <List
          data={data}
          height={height}
          itemHeight={30}
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item, _, props) => <ForwardMyItem {...item} {...props} />}
        </List>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
