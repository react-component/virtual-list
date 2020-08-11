import * as React from 'react';
import { ListProps } from '../List';

export default function useVirtual<T>({ height, itemHeight, virtual, data = [] }: ListProps<T>): [boolean] {
  if (virtual !== false && height && itemHeight && itemHeight * data.length > height) {
    return true;
  }
}
