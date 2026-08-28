import { render } from '@testing-library/react';
import React from 'react';
import Filler from '../src/Filler';

describe('Filler', () => {
  it.each([
    [false, 'marginLeft'],
    [true, 'marginRight'],
  ] as const)('defaults an omitted horizontal offset in RTL %s', (rtl, marginProperty) => {
    const { container } = render(
      <Filler height={100} offsetY={0} rtl={rtl}>
        <div>item</div>
      </Filler>,
    );

    expect(container.firstElementChild?.firstElementChild).toHaveStyle({
      [marginProperty]: '0px',
    });
  });
});
