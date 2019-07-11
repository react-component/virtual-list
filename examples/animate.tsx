import * as React from 'react';
// @ts-ignore
import CSSMotion from 'rc-animate/lib/CSSMotion';
import classNames from 'classnames';
import List from '../src/List';
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
for (let i = 0; i < 10000; i += 1) {
  originDataSource.push(genItem());
}

interface Item {
  id: string;
  uuid: number;
}

interface MyItemProps extends Item {
  visible: boolean;
  onClose: (id: string) => void;
  onLeave: (id: string) => void;
  onInsertBefore: (id: string) => void;
  onInsertAfter: (id: string) => void;
}

const getCurrentHeight = (node: HTMLElement) => ({ height: node.offsetHeight });
const getCollapsedHeight = () => ({ height: 0, opacity: 0 });

const MyItem: React.FC<MyItemProps> = (
  { id, uuid, visible, onClose, onLeave, onInsertBefore, onInsertAfter },
  ref,
) => {
  return (
    <CSSMotion
      visible={visible}
      ref={ref}
      motionName="motion"
      onLeaveStart={getCurrentHeight}
      onLeaveActive={getCollapsedHeight}
      onLeaveEnd={() => {
        onLeave(id);
      }}
    >
      {({ className, style }, motionRef) => (
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
      )}
    </CSSMotion>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const Demo = () => {
  const [dataSource, setDataSource] = React.useState(originDataSource);
  const [closeMap, setCloseMap] = React.useState<{ [id: number]: boolean }>({});

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

  const onInsertBefore = (id: string) => {
    const index = dataSource.findIndex(item => item.id === id);
    const newDataSource = [...dataSource.slice(0, index), genItem(), ...dataSource.slice(index)];
    setDataSource(newDataSource);
  };
  const onInsertAfter = (id: string) => {
    const index = dataSource.findIndex(item => item.id === id) + 1;
    const newDataSource = [...dataSource.slice(0, index), genItem(), ...dataSource.slice(index)];
    setDataSource(newDataSource);
  };

  return (
    <React.StrictMode>
      <div>
        <h2>Animate</h2>

        <List
          dataSource={dataSource}
          data-id="list"
          height={200}
          itemHeight={30}
          itemKey="id"
          style={{
            // border: '1px solid red',
            // boxSizing: 'border-box',
            boxShadow: '0 0 2px red',
          }}
        >
          {item => (
            <ForwardMyItem
              {...item}
              visible={!closeMap[item.id]}
              onClose={onClose}
              onLeave={onLeave}
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
