import { act, fireEvent, render } from '@testing-library/react';
import { mount } from 'enzyme';
import React from 'react';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

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
      expect(wrapper.find('ul').instance().scrollTop > 10).toBeTruthy();

      wrapper.unmount();
    });

    it('not call when not scroll-able', () => {
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });

      function getElement() {
        return wrapper.find('.rc-virtual-list-holder').instance();
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

      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  it('should container preventDefault', () => {
    const preventDefault = jest.fn();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });

    const touchEvent = new Event('touchstart');
    touchEvent.preventDefault = preventDefault;
    wrapper.find('.rc-virtual-list-scrollbar').instance().dispatchEvent(touchEvent);

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

    expect(container.querySelectorAll('[data-dev-offset-top]')[0]).toHaveAttribute(
      'data-dev-offset-top',
      '0',
    );

    // inner not to be 0
    expect(container.querySelectorAll('[data-dev-offset-top]')[1]).toHaveAttribute(
      'data-dev-offset-top',
    );
    expect(container.querySelectorAll('[data-dev-offset-top]')[1]).not.toHaveAttribute(
      'data-dev-offset-top',
      '0',
    );
  });
});
