import React, { StrictMode } from 'react';
import List from '../src/List';
import { IDirection } from '../src/types';
import { ForwardMyItem } from './Item';
import { mockData } from './utils';

const Demo = () => {
  return (
    <StrictMode>
      <div>
        <h2>Not Data</h2>
        <p>Direction: Vertical</p>
        <List
          data={null}
          itemSize={30}
          containerSize={100}
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...(item as any)} direction={IDirection.Vertical} />}
        </List>

        <p>Direction: Horizontal</p>
        <List
          data={null}
          direction={IDirection.Horizontal}
          itemSize={100}
          containerSize={600}
          itemKey="id"
          style={{
            width: 'min-content',
            height: '200px',
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...(item as any)} direction={IDirection.Horizontal} style={{height: '100px'}} />}
        </List>

        <h2>Less Count</h2>
        <p>Direction: Vertical</p>
        <List
          data={mockData(IDirection.Vertical).slice(0, 1)}
          itemSize={30}
          containerSize={100}
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...(item as any)} direction={IDirection.Vertical} />}
        </List>
        <p>Direction: Horizontal</p>
        <List
          direction={IDirection.Horizontal}
          data={mockData(IDirection.Horizontal).slice(0, 1)}
          itemSize={100}
          containerSize={600}
          itemKey="id"
          style={{
            width: 'min-content',
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...(item as any)} direction={IDirection.Horizontal} style={{height: '100px'}} />}
        </List>

        <h2>Less Item Size</h2>
        <p>Direction: Vertical</p>
        <List
          data={mockData(IDirection.Vertical).slice(0, 10)}
          itemSize={1}
          containerSize={100}
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...(item as any)} direction={IDirection.Vertical} />}
        </List>
        <p>Direction: Horizontal</p>
        <List
          direction={IDirection.Horizontal}
          data={mockData(IDirection.Horizontal).slice(0, 10)}
          itemSize={1}
          containerSize={200}
          itemKey="id"
          style={{
            width: 'min-content',
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...(item as any)} direction={IDirection.Horizontal} style={{height: '100px'}} />}
        </List>

        <h2>Without Container Size</h2>
        <p>Direction: Vertical</p>
        <List
          data={mockData(IDirection.Vertical)}
          itemSize={30}
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...(item as any)} direction={IDirection.Vertical} />}
        </List>
        <p>Direction: Horizontal</p>
        <div style={{width: '100%', overflowX: 'auto'}}>
          <List
            direction={IDirection.Horizontal}
            data={mockData(IDirection.Horizontal)}
            itemSize={30}
            itemKey="id"
            style={{
              width: 'min-content',
              border: '1px solid red',
              boxSizing: 'border-box',
            }}
          >
            {item => <ForwardMyItem {...(item as any)} direction={IDirection.Horizontal} style={{height: '100px'}} />}
          </List>
        </div>
      </div>
    </StrictMode>
  );
};

export default Demo;
