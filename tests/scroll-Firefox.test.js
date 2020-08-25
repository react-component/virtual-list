import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { spyElementPrototypes } from './utils/domHook';
import List from '../src';
import isFF from '../src/utils/isFirefox';

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

      const firefoxScrollEvent = new Event('DOMMouseScroll');
      firefoxScrollEvent.detail = 3;
      firefoxScrollEvent.preventDefault = firefoxPreventDefault;
      ulElement.dispatchEvent(firefoxScrollEvent);

      jest.runAllTimers();
    });

    expect(wheelPreventDefault).not.toHaveBeenCalled();
    expect(firefoxPreventDefault).toHaveBeenCalled();
  });
});
