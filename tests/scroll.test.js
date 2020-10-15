import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { spyElementPrototypes } from './utils/domHook';
import List from '../src';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.Scroll', () => {
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

  it('scrollTo null will show the scrollbar', () => {
    jest.useFakeTimers();
    const listRef = React.createRef();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });
    jest.runAllTimers();

    listRef.current.scrollTo(null);
    expect(wrapper.find('.rc-virtual-list-scrollbar-thumb').props().style.display).not.toEqual(
      'none',
    );
    jest.useRealTimers();
  });

  describe('scrollTo number', () => {
    it('value scroll', () => {
      const listRef = React.createRef();
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });
      listRef.current.scrollTo(903);
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(903);

      wrapper.unmount();
    });
  });

  describe('scroll to object', () => {
    const listRef = React.createRef();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });

    it('index scroll', () => {
      listRef.current.scrollTo({ index: 30, align: 'top' });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(600);
    });

    it('scroll top should not out of range', () => {
      listRef.current.scrollTo({ index: 0, align: 'bottom' });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(0);
    });

    it('key scroll', () => {
      listRef.current.scrollTo({ key: '30', align: 'bottom' });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(520);
    });

    it('smart', () => {
      listRef.current.scrollTo(0);
      listRef.current.scrollTo({ index: 30 });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(520);

      listRef.current.scrollTo(800);
      listRef.current.scrollTo({ index: 30 });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(600);
    });
  });

  it('inject wheel', () => {
    const preventDefault = jest.fn();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
    const ulElement = wrapper.find('ul').instance();

    act(() => {
      const wheelEvent = new Event('wheel');
      wheelEvent.deltaY = 3;
      wheelEvent.preventDefault = preventDefault;
      ulElement.dispatchEvent(wheelEvent);

      jest.runAllTimers();
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  describe('scrollbar', () => {
    it('moving', () => {
      const listRef = React.createRef();
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });

      // Mouse down
      wrapper.find('.rc-virtual-list-scrollbar-thumb').simulate('mousedown', {
        pageY: 0,
      });

      // Mouse move
      act(() => {
        const mouseMoveEvent = new Event('mousemove');
        mouseMoveEvent.pageY = 10;
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(wrapper.find('.rc-virtual-list-holder').props().style.pointerEvents).toEqual('none');

      act(() => {
        jest.runAllTimers();
      });

      // Mouse up
      act(() => {
        const mouseUpEvent = new Event('mouseup');
        window.dispatchEvent(mouseUpEvent);
      });

      expect(wrapper.find('ul').instance().scrollTop > 10).toBeTruthy();
    });

    describe('not show scrollbar when disabled virtual', () => {
      [
        { name: '!virtual', props: { virtual: false } },
        {
          name: '!height',
          props: { height: null },
        },
        {
          name: '!itemHeight',
          props: { itemHeight: null },
        },
      ].forEach(({ name, props }) => {
        it(name, () => {
          const wrapper = genList({
            itemHeight: 20,
            height: 100,
            data: genData(5),
            ...props,
          });
          expect(wrapper.find('.rc-virtual-list-scrollbar-thumb')).toHaveLength(0);
        });
      });
    });
  });

  it('no bubble', () => {
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });

    // Mouse down
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    wrapper.find('.rc-virtual-list-scrollbar').simulate('mousedown', {
      preventDefault,
      stopPropagation,
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('onScroll should trigger on correct target', () => {
    // Save in tmp variable since React will clean up this
    let currentTarget;
    const onScroll = jest.fn(e => {
      ({ currentTarget } = e);
    });
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), onScroll });
    wrapper.find('.rc-virtual-list-holder').simulate('scroll');

    expect(currentTarget).toBe(
      wrapper
        .find('.rc-virtual-list-holder')
        .hostNodes()
        .instance(),
    );
  });
});
