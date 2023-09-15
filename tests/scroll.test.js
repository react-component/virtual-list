import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { spyElementPrototypes } from './utils/domHook';
import List from '../src';
import { createEvent, fireEvent, render } from '@testing-library/react';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.Scroll', () => {
  let mockElement;

  beforeAll(() => {
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        // to imitate cacheHeight
        get: () => 25,
      },
      clientHeight: {
        get: () => 100,
      },
      getBoundingClientRect: () => ({
        width: 100,
        height: 100,
      }),
      // make `collectHeight` work
      offsetParent: {
        get: () => true,
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

  function genList(props, func = mount) {
    let node = (
      <List component="ul" itemKey="id" {...props}>
        {({ id }) => <li>{id}</li>}
      </List>
    );

    if (props.ref) {
      node = <div>{node}</div>;
    }

    return func(node);
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
    // scorllTops shouldn't have other values with `cacheHeight` pre-measure
    const allowScrollTops = new Set([640, 2005, 0, 580, 800, 655]);
    const passedScrollTops = new Set();
    let scrollTop = 0;
    let scrollTopSpy;

    beforeAll(() => {
      scrollTopSpy = spyElementPrototypes(HTMLElement, {
        scrollTop: {
          get: () => scrollTop,
          set(_, val) {
            passedScrollTops.add(val);
            scrollTop = val;
          },
        },
      });
    });

    afterAll(() => {
      scrollTopSpy.mockRestore();
    });

    const listRef = React.createRef();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });

    describe('index scroll', () => {
      it('work', () => {
        listRef.current.scrollTo({ index: 30, align: 'top' });
        jest.runAllTimers();
        expect(wrapper.find('ul').instance().scrollTop).toEqual(640);
      });

      it('out of range should not crash', () => {
        expect(() => {
          listRef.current.scrollTo({ index: 99999999999, align: 'top' });
          jest.runAllTimers();
        }).not.toThrow();
      });
    });

    it('scroll top should not out of range', () => {
      listRef.current.scrollTo({ index: 0, align: 'bottom' });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(0);
    });

    it('key scroll', () => {
      listRef.current.scrollTo({ key: '30', align: 'bottom' });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(580);
    });

    it('smart', () => {
      listRef.current.scrollTo(0);
      listRef.current.scrollTo({ index: 30 });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(580);

      listRef.current.scrollTo(800);
      listRef.current.scrollTo({ index: 30 });
      jest.runAllTimers();
      // already got cacheHeight from bottom, so `scorllTop` is deifferent from `640`
      expect(wrapper.find('ul').instance().scrollTop).toEqual(655);
    });

    it('should have not other scorllTop', () => {
      expect(Array.from(passedScrollTops)).toEqual(Array.from(allowScrollTops));
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
    const onScroll = jest.fn((e) => {
      ({ currentTarget } = e);
    });
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), onScroll });
    wrapper.find('.rc-virtual-list-holder').simulate('scroll');

    expect(currentTarget).toBe(wrapper.find('.rc-virtual-list-holder').hostNodes().instance());
  });

  describe('scroll should in range', () => {
    it('less than 0', () => {
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
      const ulElement = wrapper.find('ul').instance();

      act(() => {
        const wheelEvent = new Event('wheel');
        wheelEvent.deltaY = 9999999;
        ulElement.dispatchEvent(wheelEvent);

        jest.runAllTimers();
      });

      wrapper.setProps({ data: genData(1) });
      act(() => {
        wrapper
          .find('.rc-virtual-list-holder')
          .props()
          .onScroll({
            currentTarget: {
              scrollTop: 0,
            },
          });
      });

      wrapper.setProps({ data: genData(100) });

      expect(wrapper.find('ScrollBar').props().scrollOffset).toEqual(0);
    });

    it('over max height', () => {
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
      const ulElement = wrapper.find('ul').instance();

      act(() => {
        const wheelEvent = new Event('wheel');
        wheelEvent.deltaY = 9999999;
        ulElement.dispatchEvent(wheelEvent);

        jest.runAllTimers();
      });

      wrapper.update();

      expect(wrapper.find('ScrollBar').props().scrollOffset).toEqual(1900);
    });

    it('dynamic large to small', () => {
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(1000) });
      const ulElement = wrapper.find('ul').instance();

      // To bottom
      act(() => {
        const wheelEvent = new Event('wheel');
        wheelEvent.deltaY = 9999999;
        ulElement.dispatchEvent(wheelEvent);

        jest.runAllTimers();
      });

      // Cut data len
      wrapper.setProps({
        data: genData(20),
      });

      expect(wrapper.find('li').length).toBeLessThan(10);
    });
  });

  it('scrollbar should be left position with rtl', () => {
    jest.useFakeTimers();
    const listRef = React.createRef();
    const wrapper = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      ref: listRef,
      direction: 'rtl',
    });
    jest.runAllTimers();

    listRef.current.scrollTo(null);
    expect(wrapper.find('.rc-virtual-list-scrollbar-thumb').props().style.display).not.toEqual(
      'none',
    );
    expect(wrapper.find('.rc-virtual-list-scrollbar').props().style.left).toEqual(0);
    jest.useRealTimers();

    expect(wrapper.exists('.rc-virtual-list-rtl')).toBeTruthy();
  });

  it('wheel horizontal', () => {
    const { container } = genList(
      {
        itemHeight: 20,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
      },
      render,
    );

    const holder = container.querySelector('ul');

    const event = createEvent.wheel(holder, {
      deltaX: -100,
    });
    const spyPreventDefault = jest.spyOn(event, 'preventDefault');

    fireEvent(holder, event);

    expect(spyPreventDefault).toHaveBeenCalled();
  });

  it('scroll to end should not has wrong extraRender', () => {
    const extraRender = jest.fn(({ start, end }) => {
      return null;
    });

    jest.useFakeTimers();
    const { container } = genList(
      {
        itemHeight: 20,
        height: 100,
        data: genData(100),
        extraRender,
      },
      render,
    );

    const holder = container.querySelector('ul');

    const event = createEvent.wheel(holder, {
      deltaY: 99999999999999999999,
    });
    fireEvent(holder, event);

    act(() => {
      jest.runAllTimers();
    });

    expect(extraRender).toHaveBeenCalledWith(expect.objectContaining({ end: 99 }));
  });
});
