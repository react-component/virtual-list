import { render } from '@testing-library/react';
import React from 'react';
import List from '../src';

describe('Props', () => {
  it('itemKey is a function', () => {
    class ItemComponent extends React.Component {
      render() {
        return this.props.children;
      }
    }

    const { container } = render(
      <List data={[{ id: 903 }, { id: 1128 }]} itemKey={item => item.id}>
        {({ id }) => <ItemComponent>{id}</ItemComponent>}
      </List>,
    );

    expect(container.textContent).toEqual('9031128');
  });

  it('prefixCls', () => {
    const { container } = render(
      <List data={[0]} itemKey={id => id} prefixCls="prefix">
        {id => <div>{id}</div>}
      </List>,
    );

    expect(container.querySelector('.prefix-holder-inner')).toBeTruthy();
  });

  it('offsetX in renderFn', () => {
    let scrollLeft;
    render(
      <List data={[0]} itemKey={id => id} prefixCls="prefix">
        {(id, _, { offsetX }) => {
          scrollLeft = offsetX;
          return <div>{id}</div>;
        }}
      </List>,
    );

    expect(scrollLeft).toEqual(0);
  });
});
