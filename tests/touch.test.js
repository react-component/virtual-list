import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import List from '../src';
import useMobileTouchMove from '../src/hooks/useMobileTouchMove';
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
    const node = (
      <List component="ul" itemKey="id" {...props}>
        {({ id }) => <li>{id}</li>}
      </List>
    );

    return render(node);
  }

  describe('touch content', () => {
    it('touch scroll should work', () => {
      const { container, unmount } = genList({ itemHeight: 20, height: 100, data: genData(100) });

      function getElement() {
        return container.querySelector('.rc-virtual-list-holder');
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
      expect(container.querySelector('ul').scrollTop > 10).toBeTruthy();

      unmount();
    });

    it('not call when not scroll-able', () => {
      const { container } = genList({ itemHeight: 20, height: 100, data: genData(100) });

      function getElement() {
        return container.querySelector('.rc-virtual-list-holder');
      }

      // start
      const touchEvent = new Event('touchstart');
      touchEvent.touches = [{ pageY: 500 }];
      getElement().dispatchEvent(touchEvent);

      // move
      const preventDefault = jest.fn();
      const moveEvent = new Event('touchmove');
      moveEvent.touches = [{ pageY: 0 }];
      moveEvent.preventDefault = preventDefault;
      getElement().dispatchEvent(moveEvent);

      // Call preventDefault
      expect(preventDefault).toHaveBeenCalled();

      // ======= Not call since scroll to the bottom =======
      act(() => {
        jest.runAllTimers();
      });
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

      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  it('should container preventDefault', () => {
    const preventDefault = jest.fn();
    const { container } = genList({ itemHeight: 20, height: 100, data: genData(100) });

    const touchEvent = new Event('touchstart');
    touchEvent.preventDefault = preventDefault;
    container.querySelector('.rc-virtual-list-scrollbar').dispatchEvent(touchEvent);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('nest touch', async () => {
    const { container } = render(
      <List component="ul" itemHeight={20} height={100} data={genData(100)}>
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

  describe('smooth scroll ease out', () => {
    function setupProbe(impl = () => true) {
      const callback = jest.fn(impl);

      function Probe() {
        const listRef = React.useRef(null);
        useMobileTouchMove(true, listRef, callback);
        return (
          <div ref={listRef} className="holder">
            <span className="item">item</span>
          </div>
        );
      }

      const { container } = render(<Probe />);
      return { container, callback };
    }

    function dispatchTouch(el, type, pageY) {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      ev.touches = [{ pageY, pageX: 0 }];
      el.dispatchEvent(ev);
    }

    // Offset is `start - current`, so moving the finger DOWN gives a negative
    // offset (content scrolls up). `Math.floor` never returns 0 for a negative
    // value (-0.9 -> -1), which used to keep the interval running forever.
    [200, -200].forEach((move) => {
      it(`stops easing out when the finger moved ${move > 0 ? 'down' : 'up'}`, () => {
        const { container, callback } = setupProbe();
        const item = container.querySelector('.item');

        act(() => {
          dispatchTouch(item, 'touchstart', 100);
        });
        act(() => {
          dispatchTouch(item, 'touchmove', 100 + move);
        });

        // Let the smooth interval run longer than the easing needs.
        act(() => {
          jest.advanceTimersByTime(5000);
        });
        const settledCalls = callback.mock.calls.length;
        expect(settledCalls).toBeGreaterThan(0);

        // Nothing may happen after it settled.
        act(() => {
          jest.advanceTimersByTime(5000);
        });
        expect(callback.mock.calls.length).toBe(settledCalls);
      });
    });

    it('stops as soon as the list reports it cannot scroll further', () => {
      // First call (the touchmove itself) reports handled, then the list is at
      // its limit, so the interval must give up right away.
      let handled = true;
      const { container, callback } = setupProbe(() => {
        const result = handled;
        handled = false;
        return result;
      });
      const item = container.querySelector('.item');

      act(() => {
        dispatchTouch(item, 'touchstart', 100);
      });
      act(() => {
        dispatchTouch(item, 'touchmove', 300);
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      // touchmove + a single interval frame, then it bailed out.
      expect(callback.mock.calls.length).toBe(2);

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(callback.mock.calls.length).toBe(2);
    });

    it('ignores a touchmove that never had a touchstart', () => {
      const { container, callback } = setupProbe();
      const item = container.querySelector('.item');

      act(() => {
        dispatchTouch(item, 'touchmove', 300);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
