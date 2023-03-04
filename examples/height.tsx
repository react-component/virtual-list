import { IDirection } from '../src/types';
import React, { StrictMode } from 'react';
import List from '../src/List';
import { mockData } from './utils';
import { ForwardMyItem } from './Item';

const Demo = () => {
  return (
    <StrictMode>
      <div>
        <h2>Dynamic Height</h2>

        <List
          data={mockData(IDirection.Vertical)}
          containerSize={500}
          itemSize={30}
          itemKey="id"
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...item} direction={IDirection.Vertical} />}
        </List>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <h2>Dynamic Width</h2>

        <List
          data={mockData(IDirection.Horizontal)}
          direction={IDirection.Horizontal}
          containerSize={800}
          itemSize={30}
          itemKey="id"
          style={{
            width: 'min-content',
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {item => <ForwardMyItem {...item} direction={IDirection.Horizontal} style={{height: '100px'}}/>}
        </List>
      </div>
    </StrictMode>
  );
};

export default Demo;
