import * as React from 'react';
// @ts-ignore
import CSSMotion from 'rc-animate/lib/CSSMotion';
import classNames from 'classnames';
import List from '../src/List';
import './animate.less';

interface Item {
  id: number;
}

interface MyItemProps extends Item {
  visible: boolean;
  onClose: (id: number) => void;
  onLeave: (id: number) => void;
}

const getCurrentHeight = (node: HTMLElement) => ({ height: node.offsetHeight });
const getCollapsedHeight = () => ({ height: 0, opacity: 0 });

const MyItem: React.FC<MyItemProps> = ({ id, onClose, onLeave, visible }, ref) => {
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
        <div ref={motionRef} className={classNames('item', className)} style={style}>
          <button
            style={{ verticalAlign: 'text-top', marginRight: 16 }}
            onClick={() => {
              onClose(id);
            }}
          >
            Close
          </button>
          {id}
        </div>
      )}
    </CSSMotion>
  );
};

const ForwardMyItem = React.forwardRef(MyItem);

const originDataSource: Item[] = [];
for (let i = 0; i < 100; i += 1) {
  originDataSource.push({
    id: i,
  });
}

const Demo = () => {
  const [dataSource, setDataSource] = React.useState(originDataSource);
  const [closeMap, setCloseMap] = React.useState<{ [id: number]: boolean }>({});

  const onClose = (id: number) => {
    setCloseMap({
      ...closeMap,
      [id]: true,
    });
  };

  const onLeave = (id: number) => {
    const newDataSource = dataSource.filter(item => item.id !== id);
    setDataSource(newDataSource);
  };

  return (
    <React.StrictMode>
      <div>
        <h2>Animate</h2>

        <List
          dataSource={dataSource}
          height={200}
          itemHeight={30}
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => (
            <ForwardMyItem
              {...item}
              visible={!closeMap[item.id]}
              onClose={onClose}
              onLeave={onLeave}
            />
          )}
        </List>
      </div>
    </React.StrictMode>
  );
};

export default Demo;
