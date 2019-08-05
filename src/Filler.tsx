import * as React from 'react';

interface FillerProps {
  /** Virtual filler height. Should be `count * itemMinHeight` */
  height: number;
  /** Set offset of visible items. Should be the top of start item position */
  offset?: number;

  children: React.ReactNode;
}

/**
 * Fill component to provided the scroll content real height.
 */
const Filler: React.FC<FillerProps> = ({ height, offset, children }): React.ReactElement => {
  let outerStyle: React.CSSProperties = {};

  let innerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  if (offset !== undefined) {
    outerStyle = { height, position: 'relative', overflow: 'visible' };

    innerStyle = {
      ...innerStyle,
      transform: `translateY(${offset}px)`,
      willChange: 'transform',
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    };
  }

  return (
    <div style={outerStyle}>
      <div style={innerStyle}>{children}</div>
    </div>
  );
};

export default Filler;
