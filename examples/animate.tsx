import * as React from 'react';
// @ts-ignore
import CSSMotion from 'rc-animate/lib/CSSMotion';
import classNames from 'classnames';
import List, { ScrollInfo } from '../src/List';
import './animate.less';

let uuid = 0;
function genItem() {
  const item = {
    id: `key_${uuid}`,
    uuid,
  };
  uuid += 1;
  return item;
}

const originDataSource: Item[] = [];
for (let i = 0; i < 100000; i += 1) {
  originDataSource.push(genItem());
}

interface Item {
  id: string;
  uuid: number;
}

interface MyItemProps extends Item {
  visible: boolean;
  motionAppear: boolean;
  onClose: (id: string) => void;
  onLeave: (id: string) => void;
  onAppear: (...args: any[]) => void;
  onInsertBefore: (id: string) => void;
  onInsertAfter: (id: string) => void;
}

const getCurrentHeight = (node: HTMLElement) => ({ height: node.offsetHeight });
const getMaxHeight = (node: HTMLElement) => {
  return { height: node.scrollHeight };
};
const getCollapsedHeight = () => ({ height: 0, opacity: 0 });

const MyItem: React.FC<MyItemProps> = (
  { id, uuid, visible, onClose, onLeave, onAppear, onInsertBefore, onInsertAfter, motionAppear },
  ref,
) => {
  return (
    <CSSMotion
      visible={visible}
      ref={ref}
      motionName="motion"
      motionAppear={motionAppear}
      onAppearStart={getCollapsedHeight}
      onAppearActive={getMaxHeight}
      onAppearEnd={onAppear}
      onLeaveStart={getCurrentHeight}
      onLeaveActive={getCollapsedHeight}
      onLeaveEnd={() => {
        onLeave(id);
      }}
    >
      {({ className, style }, motionRef) => {
        // if (uuid >= 100) {
        //   console.log('=>', id, className, style);
        // }
        return (
          <div ref={motionRef} className={classNames('item', className)} style={style} data-id={id}>
            <div style={{ height: uuid % 2 ? 100 : undefined }}>
              <button
                onClick={() => {
                  onClose(id);
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  onInsertBefore(id);
                }}
              >
                Insert Before
              </button>
              <button
                onClick={() => {
                  onInsertAfter(id);
                }}
              >
                Insert After
              </button>
              {id}
            </div>
          </div>
        );
      }}
    </CSSMotion>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const Demo = () => {
  const [dataSource, setDataSource] = React.useState(originDataSource);
  const [closeMap, setCloseMap] = React.useState<{ [id: number]: boolean }>({});
  const [animating, setAnimating] = React.useState(false);
  const [insertIndex, setInsertIndex] = React.useState<number>();

  const listRef = React.useRef<List<Item>>();

  const onClose = (id: string) => {
    setCloseMap({
      ...closeMap,
      [id]: true,
    });
  };

  const onLeave = (id: string) => {
    const newDataSource = dataSource.filter(item => item.id !== id);
    setDataSource(newDataSource);
  };

  const onAppear = (...args: any[]) => {
    setAnimating(false);
  };

  function lockForAnimation() {
    setAnimating(true);
  }

  const onInsertBefore = (id: string) => {
    const index = dataSource.findIndex(item => item.id === id);
    const newDataSource = [...dataSource.slice(0, index), genItem(), ...dataSource.slice(index)];
    setInsertIndex(index);
    setDataSource(newDataSource);
    lockForAnimation();
  };
  const onInsertAfter = (id: string) => {
    const index = dataSource.findIndex(item => item.id === id) + 1;
    const newDataSource = [...dataSource.slice(0, index), genItem(), ...dataSource.slice(index)];
    setInsertIndex(index);
    setDataSource(newDataSource);
    lockForAnimation();
  };

  return (
    <React.StrictMode>
      <div>
        <h2>Animate</h2>
        <p>Current: {dataSource.length} records</p>

        <List<Item>
          dataSource={dataSource}
          data-id="list"
          height={200}
          itemHeight={30}
          itemKey="id"
          disabled={animating}
          ref={listRef}
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item, index) => (
            <ForwardMyItem
              {...item}
              motionAppear={animating && insertIndex === index}
              visible={!closeMap[item.id]}
              onClose={onClose}
              onLeave={onLeave}
              onAppear={onAppear}
              onInsertBefore={onInsertBefore}
              onInsertAfter={onInsertAfter}
            />
          )}
        </List>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
