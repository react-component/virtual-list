import { forwardRef } from 'react';
import { useIsHorizontalMode } from '../../src/hooks';
import type { CSSProperties, ForwardRefRenderFunction } from 'react';
import type { IDirection } from '../../src/types';
import './index.less';

export interface IItem extends Omit<CSSProperties, 'direction' | 'translate'> {
  id: number;
  size: number;
  direction?: IDirection;
  style?: CSSProperties;
}

const Item: ForwardRefRenderFunction<any, IItem> = (
  { id, direction, size, style = {}, ...restProps },
  ref,
) => {
  const isHorizontalMode = useIsHorizontalMode(direction);
  return (
    <span
      {...restProps}
      ref={ref}
      className={`fixed-item ${isHorizontalMode ? 'fixed-item-horizontal' : ''}`}
      style={{
        ...style,
        // ...(size ? { [isHorizontalMode ? 'width' : 'height']: size } : {}),
      }}
    >
      {id}
    </span>
  );
};

export const ForwardMyItem = forwardRef(Item);

export default Item;
