import { IDirection } from '../src/types';
import React, { StrictMode } from 'react';
import List from '../src/List';
import { mockData } from './utils';
import { ForwardMyItem } from './Item';

const Demo = () => {
  return (
    <StrictMode>
      <div>
        <h2>The wrapper element has a declared height: 500px</h2>
        <div style={{ height: '500px' }}>
          <List
            data={mockData(IDirection.Vertical)}
            containerSize={'100%'}
            itemSize={30}
            isEnableVirtual
            itemKey="id"
            style={{
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
          >
            {(item) => (
              <ForwardMyItem
                {...item}
                style={{ height: item.size }}
                direction={IDirection.Vertical}
              />
            )}
          </List>
        </div>

        <h2>The wrapper element has a declared height: calc(100vh - 200px)</h2>
        <div style={{ height: 'calc(100vh - 500px)' }}>
          <List
            data={mockData(IDirection.Vertical)}
            containerSize={'90%'}
            itemSize={30}
            isEnableVirtual
            itemKey="id"
            style={{
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
          >
            {(item) => (
              <ForwardMyItem
                {...item}
                style={{ height: item.size }}
                direction={IDirection.Vertical}
              />
            )}
          </List>
        </div>

        <h2>The virtual list has a valid string height</h2>
        <List
          data={mockData(IDirection.Vertical)}
          containerSize={'calc(100vh - 300px'}
          itemSize={30}
          isEnableVirtual
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item) => (
            <ForwardMyItem
              {...item}
              style={{ height: item.size }}
              direction={IDirection.Vertical}
            />
          )}
        </List>

        <h2>The wrapper element has a declared width: 800px</h2>
        <div style={{ width: '800px' }}>
          <List
            data={mockData(IDirection.Horizontal)}
            direction={IDirection.Horizontal}
            containerSize={'100%'}
            itemSize={30}
            isEnableVirtual
            itemKey="id"
            style={{
              width: 'min-content',
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
          >
            {(item) => (
              <ForwardMyItem
                {...item}
                direction={IDirection.Horizontal}
                style={{ height: '100px', width: item.size }}
              />
            )}
          </List>
        </div>

        <h2>The wrapper element has a declared width: calc(100vw - 300px)</h2>
        <div style={{ width: 'calc(100vw - 300px)' }}>
          <List
            data={mockData(IDirection.Horizontal)}
            direction={IDirection.Horizontal}
            containerSize={'60%'}
            itemSize={30}
            isEnableVirtual
            itemKey="id"
            style={{
              width: 'min-content',
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
          >
            {(item) => (
              <ForwardMyItem
                {...item}
                direction={IDirection.Horizontal}
                style={{ height: '100px', width: item.size }}
              />
            )}
          </List>
        </div>

        <h2>The virtual list has a valid string Width</h2>
        <List
          data={mockData(IDirection.Horizontal)}
          direction={IDirection.Horizontal}
          containerSize={'calc(100vw - 800px)'}
          itemSize={30}
          isEnableVirtual
          itemKey="id"
          style={{
            width: 'min-content',
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item) => (
            <ForwardMyItem
              {...item}
              direction={IDirection.Horizontal}
              style={{ height: '100px', width: item.size }}
            />
          )}
        </List>
      </div>
    </StrictMode>
  );
};

export default Demo;
