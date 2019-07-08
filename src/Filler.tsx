import * as React from 'react';

interface FillerProps {
  height: number;
}

/**
 * Fill component to provided the scroll content real height.
 */
const Filler: React.FC<FillerProps> = ({ height, children }) => (
  <div style={{ height, position: 'relative', overflow: 'hidden' }}>
    <div
      style={{
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
