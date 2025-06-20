import React from 'react';
import { mount } from 'enzyme';
import List from '../src';

describe('List.dark', () => {
  const mockMatchMedia = (matches) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };

  it('should render dark scrollbar', () => {
    mockMatchMedia(true);

    const wrapper = mount(
      <List data={[1, 2, 3]} height={10} itemHeight={5} itemKey={(item) => item}>
        {(item) => <div>{item}</div>}
      </List>
    );

    const thumb = wrapper.find('.rc-virtual-list-scrollbar-thumb');
    expect(thumb.props().style.background).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('should render light scrollbar', () => {
    mockMatchMedia(false);

    const wrapper = mount(
      <List data={[1, 2, 3]} height={10} itemHeight={5} itemKey={(item) => item}>
        {(item) => <div>{item}</div>}
      </List>
    );

    const thumb = wrapper.find('.rc-virtual-list-scrollbar-thumb');
    expect(thumb.props().style.background).toBe('rgba(0, 0, 0, 0.5)');
  });
}); 