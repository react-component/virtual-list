import * as React from 'react';

export interface ItemProps {
  children: React.ReactElement;
  setRef: (element: HTMLElement) => void;
}

export function Item({ children, setRef }: ItemProps) {
  const refFunc = React.useCallback(
    node => {
      setRef(node);
    },
    [setRef],
  );

  return React.cloneElement(children as React.ReactElement<any>, {
    ref: refFunc,
  });
}
