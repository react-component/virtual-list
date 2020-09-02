import React from 'react';
import { mount } from 'enzyme';
import { spyElementPrototypes } from './utils/domHook';
import List from '../src';

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
    wrapper
      .find('.rc-virtual-list-scrollbar')
      .instance()
      .dispatchEvent(touchEvent);

    expect(preventDefault).toHaveBeenCalled();
  });
});
