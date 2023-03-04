import { StrictMode, useRef, useState } from 'react';
import List from '../src/List';
import { IDirection } from '../src/types';
import { ForwardMyItem } from './Item';
import { mockData } from './utils';
import type { IListRef } from '../src/types';

const Demo = () => {
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(200);
  const [data, setData] = useState(mockData(IDirection.Vertical, 20));
  const [horizontalData, setHorizontalData] = useState(mockData(IDirection.Horizontal ,20));
  const [verticalFullSize, setVerticalFullSize] = useState(true);
  const [horizontalFullSize, setHorizontalFullSize] = useState(true);
  const listVerticalRef = useRef<IListRef>();
  const listHorizontalRef = useRef<IListRef>();

  return (
    <StrictMode>
      <div style={{ height: '150vh' }}>
        <h2>Switch</h2>
        <p>Direction: Vertical</p>
        <div
          onChange={(e: any) => {
            setData(mockData(IDirection.Vertical, Number(e.target.value)));
          }}
        >
          Data
          <label>
            <input type="radio" name="switch" value={0} checked={data.length === 0}/>0
          </label>
          <label>
            <input type="radio" name="switch" value={2} checked={data.length === 2} />2
          </label>
          <label>
            <input type="radio" name="switch" value={20} checked={data.length === 20} />
            20
          </label>
          <label>
            <input type="radio" name="switch" value={100} checked={data.length === 100} />
            100
          </label>
          <label>
            <input type="radio" name="switch" value={200} checked={data.length === 200} />
            200
          </label>
          <label>
            <input type="radio" name="switch" value={1000} checked={data.length === 1000} />
            1000
          </label>
        </div>
        <div
          onChange={(e: any) => {
            setHeight(Number(e.target.value));
          }}
        >
          Height
          <label>
            <input type="radio" name="switchHeight" value={0} checked={height === 0} />0
          </label>
          <label>
            <input type="radio" name="switchHeight" value={100} checked={height === 100} />
            100
          </label>
          <label>
            <input type="radio" name="switchHeight" value={200} checked={height === 200} />
            200
          </label>
        </div>
        <button
            type="button"
            onClick={() => {
              listVerticalRef.current.scrollTo(null);
            }}
          >
            Show scrollbar
          </button>
          <button
            onClick={() => {
              setVerticalFullSize(!verticalFullSize);
            }}
          >
            Full Size: {String(verticalFullSize)}
          </button>

        <List
          ref={listVerticalRef}
          data={data}
          containerSize={height}
          itemSize={10}
          itemKey="id"
          fullSize={verticalFullSize}
          style={{
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item, _, props) => <ForwardMyItem {...item} {...props} />}
        </List>
  
        <p style={{marginTop: '100px'}}>Direction: Horizontal</p>
        <div
          onChange={(e: any) => {
            setHorizontalData(mockData(IDirection.Horizontal, Number(e.target.value)));
          }}
        >
          Data
          <label>
            <input type="radio" name="switchHorizontalCount" value={0} checked={horizontalData.length === 0} />0
          </label>
          <label>
            <input type="radio" name="switchHorizontalCount" value={2} checked={horizontalData.length === 2} />2
          </label>
          <label>
            <input type="radio" name="switchHorizontalCount" value={20} checked={horizontalData.length === 20} />
            20
          </label>
          <label>
            <input type="radio" name="switchHorizontalCount" value={100} checked={horizontalData.length === 100} />
            100
          </label>
          <label>
            <input type="radio" name="switchHorizontalCount" value={200} checked={horizontalData.length === 200} />
            200
          </label>
          <label>
            <input type="radio" name="switchHorizontalCount" value={1000} checked={horizontalData.length === 1000} />
            1000
          </label>
          
        </div>
        <div
          onChange={(e: any) => {
            setWidth(Number(e.target.value));
          }}
        >
          Width
          <label>
            <input type="radio" name="switchHorizontalWidth" value={0} checked={width === 0}  />0
          </label>
          <label>
            <input type="radio" name="switchHorizontalWidth" value={500} checked={width === 500}  />
            500
          </label>
          <label>
            <input type="radio" name="switchHorizontalWidth" value={1300} checked={width === 1300}  />
            1300
          </label>
        </div>
        <button
          type="button"
          onClick={() => {
            listHorizontalRef.current.scrollTo(null);
          }}
        >
          Show scrollbar
        </button>
        <button
          onClick={() => {
            setHorizontalFullSize(!horizontalFullSize);
          }}
        >
          Full Size: {String(horizontalFullSize)}
        </button>

        <List
          ref={listHorizontalRef}
          direction={IDirection.Horizontal}
          data={horizontalData}
          containerSize={width}
          itemSize={10}
          itemKey="id"
          fullSize={horizontalFullSize}
          style={{
            width: 'min-content',
            border: '1px solid red',
            boxSizing: 'border-box',
          }}
        >
          {(item, _, props) => <ForwardMyItem {...(item as any)} {...props} direction={IDirection.Horizontal} style={{height: '120px', flexShrink: 0}} />}
        </List>
      </div>
    </StrictMode>
  );
};

export default Demo;
