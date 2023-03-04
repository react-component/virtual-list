import { cloneElement, memo, useCallback } from 'react';
import type { ReactElement } from 'react';

export interface ItemProps {
  children: ReactElement;
  setRef: (element: HTMLElement) => void;
}
 
export const Item = ({ children, setRef }: ItemProps) => {
  const updateRef = useCallback(node => {
    setRef(node);
  }, [setRef]);

  return cloneElement(children, {
    ref: updateRef,
  });
}

export default memo(Item)