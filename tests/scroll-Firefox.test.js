import { act } from '@testing-library/react';
import { mount } from 'enzyme';
import React from 'react';
import List from '../src';
import isFF from '../src/utils/isFirefox';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

jest.mock('../src/utils/isFirefox', () => true);

describe('List.Firefox-Scroll', () => {
  let mockElement;

  beforeAll(() => {
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        get: () => 20,
      },
      clientHeight: {
        get: () => 100,
      },
    });
  });

  afterAll(() => {
    mockElement.mockRestore();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function genList(props) {
    let node = (
      <List component="ul" itemKey="id" {...props}>
        {({ id }) => <li>{id}</li>}
      </List>
    );

    if (props.ref) {
      node = <div>{node}</div>;
    }

    return mount(node);
  }

  it('should be true', () => {
    expect(isFF).toBe(true);
  });

  // https://github.com/ant-design/ant-design/issues/26372
  it('FireFox should patch scroll speed', () => {
    const wheelPreventDefault = jest.fn();
    const firefoxPreventDefault = jest.fn();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
    const ulElement = wrapper.find('ul').instance();

    act(() => {
      const wheelEvent = new Event('wheel');
      wheelEvent.deltaY = 3;
      wheelEvent.preventDefault = wheelPreventDefault;
      ulElement.dispatchEvent(wheelEvent);

      const firefoxPixelScrollEvent = new Event('MozMousePixelScroll');
      firefoxPixelScrollEvent.detail = 6;
      firefoxPixelScrollEvent.preventDefault = firefoxPreventDefault;
      ulElement.dispatchEvent(firefoxPixelScrollEvent);

      const firefoxScrollEvent = new Event('DOMMouseScroll');
      firefoxScrollEvent.detail = 3;
      firefoxScrollEvent.preventDefault = firefoxPreventDefault;
      ulElement.dispatchEvent(firefoxScrollEvent);

      jest.runAllTimers();
    });

    expect(wheelPreventDefault).not.toHaveBeenCalled();
    expect(firefoxPreventDefault).toHaveBeenCalledTimes(1);
  });

  it('should call preventDefault on MozMousePixelScroll', () => {
    const preventDefault = jest.fn();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
    const ulElement = wrapper.find('ul').instance();

    act(() => {
      const event = new Event('MozMousePixelScroll');
      event.detail = 6;
      event.preventDefault = preventDefault;
      ulElement.dispatchEvent(event);

      jest.runAllTimers();
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should not call preventDefault on MozMousePixelScroll when scrolling up at top boundary', () => {
    const preventDefault = jest.fn();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
    const ulElement = wrapper.find('ul').instance();

    act(() => {
      const event = new Event('MozMousePixelScroll');
      event.detail = -6;
      event.preventDefault = preventDefault;
      ulElement.dispatchEvent(event);

      jest.runAllTimers();
    });

    expect(preventDefault).not.toHaveBeenCalled();
  });
  it('should not call preventDefault on MozMousePixelScroll when scrolling down at bottom boundary', () => {
    const preventDefault = jest.fn();
    const listRef = React.createRef();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });
    const ulElement = wrapper.find('ul').instance();
    // scroll to bottom
    act(() => {
      listRef.current.scrollTo(99999);
      jest.runAllTimers();
    });
    expect(wrapper.find('ul').instance().scrollTop).toEqual(1900);

    act(() => {
      const event = new Event('MozMousePixelScroll');
      event.detail = 6;
      event.preventDefault = preventDefault;
      ulElement.dispatchEvent(event);

      jest.runAllTimers();
    });

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
