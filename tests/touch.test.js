import { act, fireEvent, render } from '@testing-library/react';
import { mount } from 'enzyme';
import React from 'react';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

// Mock ScrollBar
jest.mock('../src/ScrollBar', () => {
  const OriScrollBar = jest.requireActual('../src/ScrollBar').default;
  const React = jest.requireActual('react');
  return React.forwardRef((props, ref) => {
    const { scrollOffset } = props;

    return (
      <div data-dev-offset={scrollOffset}>
        <OriScrollBar {...props} ref={ref} />
      </div>
    );
  });
});

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.Touch', () => {
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

  describe('touch content', () => {
    it('touch scroll should work', () => {
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });

      function getElement() {
        return wrapper.find('.rc-virtual-list-holder').instance();
      }

      act(() => {
        // start
        const touchEvent = new Event('touchstart');
        touchEvent.touches = [{ pageY: 100 }];
        getElement().dispatchEvent(touchEvent);

        // move
        const moveEvent = new Event('touchmove');
        moveEvent.touches = [{ pageY: 90 }];
        getElement().dispatchEvent(moveEvent);

        // end
        const endEvent = new Event('touchend');
        getElement().dispatchEvent(endEvent);

        // smooth
        jest.runAllTimers();
      });
      expect(wrapper.find('ul').instance().scrollTop > 10).toBeTruthy();

      wrapper.unmount();
    });

    it('origin scroll', () => {
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });

      function getElement() {
        return wrapper.find('.rc-virtual-list-holder').instance();
      }

      act(() => {
        // start
        const touchEvent = new Event('touchstart');
        touchEvent.touches = [{ pageY: 100 }];
        getElement().dispatchEvent(touchEvent);

        // move
        const moveEvent1 = new Event('touchmove');
        moveEvent1.touches = [{ pageY: 110 }];
        getElement().dispatchEvent(moveEvent1);

        // move
        const moveEvent2 = new Event('touchmove');
        moveEvent2.touches = [{ pageY: 150 }];
        getElement().dispatchEvent(moveEvent2);

        // end
        const endEvent = new Event('touchend');
        getElement().dispatchEvent(endEvent);

        // smooth
        jest.runAllTimers();
      });
      expect(wrapper.find('ul').instance().scrollTop).toBe(0);
      wrapper.unmount();
    });

    it('not call when not scroll-able', () => {
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });

      function getElement() {
        return wrapper.find('.rc-virtual-list-holder').instance();
      }

      const preventDefault = jest.fn();

      act(() => {
        // start
        const touchEvent = new Event('touchstart');
        touchEvent.touches = [{ pageY: 500 }];
        getElement().dispatchEvent(touchEvent);

        // move
        const moveEvent = new Event('touchmove');
        moveEvent.touches = [{ pageY: 0 }];
        moveEvent.preventDefault = preventDefault;
        getElement().dispatchEvent(moveEvent);
      });
      // Call preventDefault
      expect(preventDefault).toHaveBeenCalled();

      act(() => {
        // ======= Not call since scroll to the bottom =======
        jest.runAllTimers();
        preventDefault.mockReset();

        // start
        const touchEvent2 = new Event('touchstart');
        touchEvent2.touches = [{ pageY: 500 }];
        getElement().dispatchEvent(touchEvent2);

        // move
        const moveEvent2 = new Event('touchmove');
        moveEvent2.touches = [{ pageY: 0 }];
        moveEvent2.preventDefault = preventDefault;
        getElement().dispatchEvent(moveEvent2);
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  it('should container preventDefault', () => {
    const preventDefault = jest.fn();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });

    act(() => {
      const touchEvent = new Event('touchstart');
      touchEvent.preventDefault = preventDefault;
      wrapper.find('.rc-virtual-list-scrollbar').instance().dispatchEvent(touchEvent);
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('nest touch', async () => {
    const { container } = render(
      <List component="ul" itemHeight={20} height={100} data={genData(100)} itemKey="id">
        {({ id }) =>
          id === '0' ? (
            <li>
              <List component="ul" itemKey="id" itemHeight={20} height={100} data={genData(100)}>
                {({ id }) => <li>{id}</li>}
              </List>
            </li>
          ) : (
            <li />
          )
        }
      </List>,
    );

    const targetLi = container.querySelector('ul ul li');

    fireEvent.touchStart(targetLi, {
      touches: [{ pageY: 0 }],
    });

    fireEvent.touchMove(targetLi, {
      touches: [{ pageY: -1 }],
    });

    await act(async () => {
      jest.advanceTimersByTime(1000000);
      await Promise.resolve();
    });

    // inner not to be 0
    expect(container.querySelectorAll('[data-dev-offset]')[0]).toHaveAttribute('data-dev-offset');
    expect(container.querySelectorAll('[data-dev-offset]')[0]).not.toHaveAttribute(
      'data-dev-offset',
      '0',
    );

    // outer
    expect(container.querySelectorAll('[data-dev-offset]')[1]).toHaveAttribute(
      'data-dev-offset',
      '0',
    );
  });
});
