import * as React from 'react';

export interface ItemProps {
  children: React.ReactElement;
  setRef: (element: HTMLElement) => void;
}

export function Item({ children, setRef }: ItemProps) {
  const refFunc = React.useCallback((node: HTMLElement) => {
    setRef(node);
  }, []);
  return React.cloneElement<any>(children, { ref: refFunc });
}
