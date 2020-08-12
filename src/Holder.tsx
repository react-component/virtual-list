import * as React from 'react';
import { GetKey } from './interface';

export interface HolderProps<T> {
  virtual: boolean;
  heights: Map<React.Key, number>;
  itemHeight: number;
  data: T[];
  getKey: GetKey<T>;
}

export default function Holder<T>({ virtual, heights, itemHeight, data, getKey }: HolderProps<T>) {
  return <div></div>;
}
