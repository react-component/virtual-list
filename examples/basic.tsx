/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/label-has-for */
import * as React from 'react';
import List, { ListRef } from '../src/List';
import './basic.less';

interface Item {
  id: string;
}

const MyItem: React.ForwardRefRenderFunction<any, Item> = ({ id }, ref) => (
  <span
    ref={ref}
    // style={{
    //   // height: 30 + (id % 2 ? 0 : 10),
    // }}
    className="fixed-item"
    onClick={() => {
      console.log('Click:', id);
    }}
  >
    {id}
  </span>
);

const ForwardMyItem = React.forwardRef(MyItem);

class TestItem extends React.Component<Item, {}> {
  state = {};

  render() {
    return <div style={{ lineHeight: '30px' }}>{this.props.id}</div>;
  }
}

const data: Item[] = [];
for (let i = 0; i < 1000; i += 1) {
  data.push({
    id: String(i),
  });
}

const TYPES = [
  { name: 'ref real dom element', type: 'dom', component: ForwardMyItem },
  { name: 'ref react node', type: 'react', component: TestItem },
];

const onScroll: React.UIEventHandler<HTMLElement> = e => {
  console.log('scroll:', e.currentTarget.scrollTop);
};

const Demo = () => {
  const [destroy, setDestroy] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [type, setType] = React.useState('dom');
  const listRef = React.useRef<ListRef>(null);

  return (
    <React.StrictMode>
      <div style={{ height: '200vh' }}>
        <h2>Basic</h2>
        {TYPES.map(({ name, type: nType }) => (
          <label key={nType}>
            <input
              name="type"
              type="radio"
              checked={type === nType}
              onChange={() => {
                setType(nType);
              }}
            />
            {name}
          </label>
        ))}

        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo(500);
          }}
        >
          Scroll To 100px
        </button>
        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: 50,
              align: 'top',
            });
          }}
        >
          Scroll To 50 (top)
        </button>
        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: 50,
              align: 'bottom',
            });
          }}
        >
          Scroll To 50 (bottom)
        </button>
        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: 50,
              align: 'auto',
            });
          }}
        >
          Scroll To 50 (auto)
        </button>
        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: 50,
              align: 'top',
              offset: 15,
            });
          }}
        >
          Scroll To 50 (top) + 15 offset
        </button>
        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: 50,
              align: 'bottom',
              offset: 15,
            });
          }}
        >
          Scroll To 50 (bottom) + 15 offset
        </button>
        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              key: '50',
              align: 'auto',
            });
          }}
        >
          Scroll To key 50 (auto)
        </button>

        <button
          type="button"
          onClick={() => {
            setVisible(v => !v);
          }}
        >
          visible
        </button>

        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: data.length - 2,
              align: 'top',
            });
          }}
        >
          Scroll To Last (top)
        </button>
        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: 0,
              align: 'bottom',
            });
          }}
        >
          Scroll To First (bottom)
        </button>

        <button
          type="button"
          onClick={() => {
            listRef.current.scrollTo({
              index: 50,
              align: 'top',
            });
            setDestroy(true);
          }}
        >
          Scroll To remove
        </button>

        {!destroy && (
          <List
            id="list"
            ref={listRef}
            data={data}
            height={200}
            itemHeight={20}
            itemKey="id"
            style={{
              border: '1px solid red',
              boxSizing: 'border-box',
              display: visible ? null : 'none',
            }}
            onScroll={onScroll}
          >
            {(item, _, props) =>
              type === 'dom' ? (
                <ForwardMyItem {...item} {...props} />
              ) : (
                <TestItem {...item} {...props} />
              )
            }
          </List>
        )}
      </div>
    </React.StrictMode>
  );
};

export default Demo;

/* eslint-enable */
