import React, { Component, useRef, useState } from 'react';
import List from '../src/List';
import { IDirection } from '../src/types';
import { mockData } from './utils';
import { ForwardMyItem } from './Item';
import type { IItem } from './Item';
import type { UIEventHandler} from 'react';
import type { IListRef } from '../src/types';

class TestItem extends Component<IItem, {}> {
  state = {};

  render() {
    const isHorizontalMode =  this.props.direction === IDirection.Horizontal;
    return <div style={{ lineHeight: '30px'}} className={`item ${ isHorizontalMode? 'item-horizontal' : ''}`}>{this.props.id}</div>;
  }
}

const TYPES = [
  { name: 'ref real dom element', type: 'dom', component: ForwardMyItem },
  { name: 'ref react node', type: 'react', component: TestItem },
];

const onScroll: (direction: IDirection) => UIEventHandler<HTMLElement> = (direction: IDirection) => e => {
  console.log('scroll:', e.currentTarget[direction === IDirection.Horizontal ? 'scrollLeft' : 'scrollTop']);
};

const data = mockData(IDirection.Horizontal);

const Demo = () => {
  const [destroy, setDestroy] = useState(false);
  const [destroyHorizontal, setDestroyHorizontal] = useState(false);
  const [visible, setVisible] = useState(true);
  const [verticalType, setVerticalType] = useState('dom');
  const [horizontalType, setHorizontalType] = useState('dom');
  const listVerticalRef = useRef<IListRef>(null);
  const listHorizontalRef = useRef<IListRef>(null);

  return (
    <React.StrictMode>
      <div style={{ height: '200vh' }}>
        <h2>Basic</h2>
        <p>Direction: Vertical</p>
        {TYPES.map(({ name, type: nType }) => (
          <label key={nType}>
            <input
              name="verticalType"
              type="radio"
              checked={verticalType === nType}
              onChange={() => {
                setVerticalType(nType);
              }}
            />
            {name}
          </label>
        ))}
        <button
          type="button"
          onClick={() => {
            listVerticalRef.current.scrollTo(null);
          }}
        >
          Show scroll bar
        </button>
        <button
          type="button"
          onClick={() => {
            listVerticalRef.current.scrollTo(500);
          }}
        >
          Scroll To 100px
        </button>
        <button
          type="button"
          onClick={() => {
            listVerticalRef.current.scrollTo({
              index: 99999999,
              align: 'top',
            });
          }}
        >
          Scroll To 99999999 (top)
        </button>
        <button
          type="button"
          onClick={() => {
            listVerticalRef.current.scrollTo({
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
            listVerticalRef.current.scrollTo({
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
            listVerticalRef.current.scrollTo({
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
            listVerticalRef.current.scrollTo({
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
            listVerticalRef.current.scrollTo({
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
            listVerticalRef.current.scrollTo({
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
            listVerticalRef.current.scrollTo({
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
            listVerticalRef.current.scrollTo({
              index: 0,
              align: 'bottom',
            });
          }}
        >
          Scroll To First (bottom)
        </button>

        <button
          type="button"
          disabled={destroy}
          onClick={() => {
            if(destroy) {
              return 
            }
            listVerticalRef.current.scrollTo({
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
            ref={listVerticalRef}
            data={data}
            containerSize={200}
            itemSize={20}
            itemKey="id"
            style={{
              border: '1px solid red',
              boxSizing: 'border-box',
              display: visible ? null : 'none',
            }}
            onScroll={onScroll(IDirection.Vertical)}
          >
            {(item, _, props) => {
              return verticalType === 'dom' ? (
                <ForwardMyItem {...item} {...props} direction={IDirection.Vertical} />
              ) : (
                <TestItem {...item} {...props} direction={IDirection.Vertical} />
              )
            }
            }
          </List>
        )}
        <br />
        <br />
        <br />
        <br />
        <br />
        <p>Direction: Horizontal</p>
        {TYPES.map(({ name, type: nType }) => (
          <label key={nType}>
            <input
              name="horizontalType"
              type="radio"
              checked={horizontalType === nType}
              onChange={() => {
                setHorizontalType(nType);
              }}
            />
            {name}
          </label>
        ))}
        <button
          type="button"
          onClick={() => {
            listHorizontalRef.current.scrollTo(null);
          }}
        >
          Show scroll bar
        </button>
        <button
          type="button"
          onClick={() => {
            listHorizontalRef.current.scrollTo(500);
          }}
        >
          Scroll To 100px
        </button>
        <button
          type="button"
          onClick={() => {
            listHorizontalRef.current.scrollTo({
              index: 99999999,
              align: 'top',
            });
          }}
        >
          Scroll To 99999999 (top)
        </button>
        <button
          type="button"
          onClick={() => {
            listHorizontalRef.current.scrollTo({
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
            listHorizontalRef.current.scrollTo({
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
            listHorizontalRef.current.scrollTo({
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
            listHorizontalRef.current.scrollTo({
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
            listHorizontalRef.current.scrollTo({
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
            listHorizontalRef.current.scrollTo({
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
            listHorizontalRef.current.scrollTo({
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
            listHorizontalRef.current.scrollTo({
              index: 0,
              align: 'bottom',
            });
          }}
        >
          Scroll To First (bottom)
        </button>

        <button
          type="button"
          disabled={destroyHorizontal}
          onClick={() => {
            if(destroyHorizontal) {
              return 
            }
            listHorizontalRef.current.scrollTo({
              index: 50,
              align: 'top',
            });
            setDestroyHorizontal(true);
          }}
        >
          Scroll To remove
        </button>

        {!destroyHorizontal && (
          <List
            id="list"
            ref={listHorizontalRef}
            data={data}
            containerSize={800}
            direction={IDirection.Horizontal}
            itemSize={20}
            itemKey="id"
            style={{
              border: '1px solid red',
              boxSizing: 'border-box',
              width: 'min-content',
              display: visible ? null : 'none',
            }}
            onScroll={onScroll(IDirection.Horizontal)}
          >
            {(item, _, props) =>
              horizontalType === 'dom' ? (
                <ForwardMyItem {...item} {...props} direction={IDirection.Horizontal} />
              ) : (
                <TestItem {...item} {...props}  direction={IDirection.Horizontal} />
              )
            }
          </List>
        )}
      </div>
    </React.StrictMode>
  );
};

export default Demo;