import * as React from 'react';

interface FillerProps {
  /** Virtual filler height. Should be `count * itemMinHeight` */
  height: number;
  /** Set offset of visible items. Should be the top of start item position */
  offset: number;

  children: React.ReactNode;
}

/**
 * Fill component to provided the scroll content real height.
 */
const Filler: React.FC<FillerProps> = ({ height, offset, children }): React.ReactElement => (
  <div style={{ height, position: 'relative', overflow: 'hidden' }}>
    <div
      style={{
        marginTop: offset,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  </div>
);

export default Filler;
