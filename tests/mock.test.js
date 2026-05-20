import { render } from '@testing-library/react';
import React from 'react';
import MockList from '../src/mock';

describe('MockList', () => {
  it('correct render', () => {
    const { container } = render(
      <MockList data={[0, 1, 2]} itemKey={id => id}>
        {id => <span>{id}</span>}
      </MockList>,
    );

    expect(container.querySelector('.rc-virtual-list-holder-inner')).toBeTruthy();
    expect(Array.from(container.querySelectorAll('span')).map(node => node.textContent)).toEqual([
      '0',
      '1',
      '2',
    ]);
    expect(container.querySelector('.rc-virtual-list')).toBeTruthy();
  });
});
