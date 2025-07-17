import '@testing-library/jest-dom';
import { act, createEvent, fireEvent, render } from '@testing-library/react';
import { mount } from 'enzyme';
import { _rs as onLibResize } from 'rc-resize-observer/lib/utils/observerUtil';
import { resetWarned } from 'rc-util/lib/warning';
import React from 'react';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

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

describe('List.Scroll', () => {
  let mockElement;
  let boundingRect = {
    top: 0,
    bottom: 0,
    width: 100,
    height: 100,
  };

  beforeAll(() => {
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        get() {
          const height = this.getAttribute('data-height');
          return Number(height || 20);
        },
      },
      clientHeight: {
        get() {
          const height = this.getAttribute('data-height');
          return Number(height || 100);
        },
      },
      getBoundingClientRect: () => boundingRect,
      offsetParent: {
        get: () => document.body,
      },
    });
  });

  afterAll(() => {
    mockElement.mockRestore();
  });

  beforeEach(() => {
    boundingRect = {
      top: 0,
      bottom: 0,
      width: 100,
      height: 100,
    };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function genList(props, func = mount) {
    const mergedProps = {
      component: 'ul',
      itemKey: 'id',
      children: ({ id }) => <li>{id}</li>,
      ...props,
    };
    let node = <List {...mergedProps} />;

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
    function presetList() {
      const ref = React.createRef();

      const result = genList({ itemHeight: 20, height: 100, data: genData(100), ref }, render);

      return {
        ...result,
        ref,
        scrollTo: (...args) => {
          ref.current.scrollTo(...args);

          act(() => {
            jest.runAllTimers();
          });
        },
      };
    }

    describe('index scroll', () => {
      it('work in range', () => {
        const { scrollTo, container } = presetList();

        scrollTo({ index: 30, align: 'top' });

        expect(container.querySelector('ul').scrollTop).toEqual(600);
      });

      it('out of range should not crash', () => {
        expect(() => {
          const { scrollTo } = presetList();
          scrollTo({ index: 99999999999, align: 'top' });
        }).not.toThrow();
      });
    });

    it('scroll top should not out of range', () => {
      const { scrollTo, container } = presetList();
      scrollTo({ index: 0, align: 'bottom' });
      jest.runAllTimers();
      expect(container.querySelector('ul').scrollTop).toEqual(0);
    });

    it('key scroll', () => {
      const { scrollTo, container } = presetList();
      scrollTo({ key: '30', align: 'bottom' });
      expect(container.querySelector('ul').scrollTop).toEqual(520);
    });

    it('smart', () => {
      const { scrollTo, container } = presetList();
      scrollTo(0);
      scrollTo({ index: 30 });
      expect(container.querySelector('ul').scrollTop).toEqual(520);

      scrollTo(800);
      scrollTo({ index: 30 });
      expect(container.querySelector('ul').scrollTop).toEqual(600);
    });

    it('exceed should not warning', () => {
      resetWarned();
      const errSpy = jest.spyOn(console, 'error');

      const { scrollTo } = presetList();
      scrollTo({ index: 9999999999, align: 'top' });

      errSpy.mock.calls.forEach((msgs) => {
        expect(msgs[0]).not.toContain('max limitation');
      });

      errSpy.mockRestore();
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

    it('should show scrollbar when element has showScrollBar prop set to true', () => {
      jest.useFakeTimers();
      const listRef = React.createRef();
      const { container } = genList(
        {
          itemHeight: 20,
          height: 100,
          data: genData(100),
          ref: listRef,
          showScrollBar: true,
        },
        render,
      );
      act(() => {
        jest.runAllTimers();
      });
      const scrollbarElement = container.querySelector('.rc-virtual-list-scrollbar-visible');
      expect(scrollbarElement).not.toBeNull();
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

  it('scrollbar styles should work', () => {
    const { container } = genList(
      {
        itemHeight: 20,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
        styles: {
          horizontalScrollBar: { background: 'red' },
          horizontalScrollBarThumb: { background: 'green' },
          verticalScrollBar: { background: 'orange' },
          verticalScrollBarThumb: { background: 'blue' },
        },
      },
      render,
    );

    expect(
      container.querySelector('.rc-virtual-list-scrollbar-horizontal').style.background,
    ).toEqual('red');
    expect(
      container.querySelector(
        '.rc-virtual-list-scrollbar-horizontal .rc-virtual-list-scrollbar-thumb',
      ).style.background,
    ).toEqual('green');
    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical').style.background).toEqual(
      'orange',
    );
    expect(
      container.querySelector(
        '.rc-virtual-list-scrollbar-vertical .rc-virtual-list-scrollbar-thumb',
      ).style.background,
    ).toEqual('blue');
  });

  it('scrollbar size should correct', async () => {
    boundingRect = {
      width: 0,
      height: 0,
    };

    const { container } = genList(
      {
        itemHeight: 20,
        height: 100,
        data: genData(100),
      },
      render,
    );

    await act(async () => {
      onLibResize([
        {
          target: container.querySelector('.rc-virtual-list-holder'),
        },
      ]);

      await Promise.resolve();
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-thumb')).toHaveStyle({
      height: `20px`,
    });
  });

  it('show scrollbar when actual height is larger than container height', async () => {
    jest.useRealTimers();
    const { container } = genList(
      // set itemHeight * data.length < height, but sum of actual height > height
      {
        itemHeight: 8,
        height: 100,
        data: genData(10),
      },
      render,
    );

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-thumb')).toBeVisible();
  });

  it('nest scroll', async () => {
    const { container } = genList(
      {
        itemHeight: 20,
        height: 100,
        data: genData(100),
        children: ({ id }) =>
          id === '0' ? (
            <li>
              <List component="ul" itemKey="id" itemHeight={20} height={100} data={genData(100)}>
                {({ id }) => <li>{id}</li>}
              </List>
            </li>
          ) : (
            <li />
          ),
      },
      render,
    );

    fireEvent.wheel(container.querySelector('ul ul li'), {
      deltaY: 10,
    });

    await act(async () => {
      jest.advanceTimersByTime(1000000);
      await Promise.resolve();
    });

    // inner
    expect(container.querySelectorAll('[data-dev-offset]')[0]).toHaveAttribute(
      'data-dev-offset',
      '10',
    );

    // outer
    expect(container.querySelectorAll('[data-dev-offset]')[1]).toHaveAttribute(
      'data-dev-offset',
      '0',
    );
  });

  describe('mouse down drag', () => {
    function dragDown(container, mouseY, button = 0) {
      fireEvent.mouseDown(container.querySelector('li'), {
        button,
      });

      let moveEvent = createEvent.mouseMove(container.querySelector('li'));
      moveEvent.pageY = mouseY;
      fireEvent(container.querySelector('li'), moveEvent);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.mouseUp(container.querySelector('li'));
    }

    function getScrollTop(container) {
      const innerEle = container.querySelector('.rc-virtual-list-holder-inner');
      const { transform } = innerEle.style;
      return Number(transform.match(/\d+/)[0]);
    }

    it('can move', () => {
      const onScroll = jest.fn();
      const { container } = render(
        <List
          component="ul"
          itemKey="id"
          itemHeight={20}
          height={100}
          data={genData(100)}
          onScroll={onScroll}
        >
          {({ id }) => <li>{id}</li>}
        </List>,
      );

      // Drag down
      dragDown(container, 100);
      expect(getScrollTop(container)).toBeGreaterThan(0);

      // Drag up
      dragDown(container, -100);
      expect(getScrollTop(container)).toBe(0);
    });

    it('right click should not move', () => {
      const onScroll = jest.fn();
      const { container } = render(
        <List
          component="ul"
          itemKey="id"
          itemHeight={20}
          height={100}
          data={genData(100)}
          onScroll={onScroll}
        >
          {({ id }) => <li>{id}</li>}
        </List>,
      );

      // Drag down
      dragDown(container, 100, 2);
      expect(getScrollTop(container)).toBe(0);
    });

    it('can not move when item add draggable', () => {
      const onScroll = jest.fn();
      const { container } = render(
        <List
          component="ul"
          itemKey="id"
          itemHeight={20}
          height={100}
          data={genData(100)}
          onScroll={onScroll}
        >
          {({ id }) => <li draggable>{id}</li>}
        </List>,
      );

      // Initial scroll should be 0
      expect(getScrollTop(container)).toEqual(0);
      // Simulate drag action
      dragDown(container, 100);
      // Assert that scroll did not change after drag
      expect(getScrollTop(container)).toEqual(0);
    });
  });

  it('not scroll jump for item height change', async () => {
    jest.useFakeTimers();

    const onScroll = jest.fn();

    const listRef = React.createRef();
    const { container } = genList(
      {
        itemHeight: 10,
        height: 100,
        data: genData(100),
        ref: listRef,
        children: ({ id }) => <li data-id={id}>{id}</li>,
        onScroll,
      },
      render,
    );

    // first render refresh
    await act(async () => {
      onLibResize([
        {
          target: container.querySelector('.rc-virtual-list-holder-inner'),
        },
      ]);

      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    container.querySelector('li[data-id="0"]').setAttribute('data-height', '30');

    // Force change first row height
    await act(async () => {
      boundingRect.height = 110;

      onLibResize([
        {
          target: container.querySelector('.rc-virtual-list-holder-inner'),
        },
      ]);

      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(onScroll).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should not scroll after drop table text', () => {
    
    const onScroll = jest.fn();
    const { container } = render(
      <List
        component="ul"
        itemKey="id"
        itemHeight={20}
        height={100}
        data={genData(200)}
        onScroll={onScroll}
      >
        {({ id }) => <li draggable>{id}</li>}
      </List>,
    );
    // Select the text content of the 99th fixed-item
    const fixedItems = container.querySelectorAll('.fixed-item');
    const targetItem = fixedItems[99];
    if (targetItem) {
      const range = document.createRange();
      range.selectNodeContents(targetItem);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    // Simulate dragging the selected text to the bottom of the list
    const listHolder = container.querySelector('.rc-virtual-list-holder');
    if (targetItem && listHolder) {
      // Create drag event
      const dragStartEvent = new DragEvent('dragstart', { bubbles: true });
      targetItem.dispatchEvent(dragStartEvent);

      // Drag to the bottom
      const rect = listHolder.getBoundingClientRect();
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        clientY: rect.bottom + 10,
      });
      listHolder.dispatchEvent(dragOverEvent);

      // Release mouse
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        clientY: rect.bottom + 10,
      });
      listHolder.dispatchEvent(dropEvent);

      const dragEndEvent = new DragEvent('dragend', { bubbles: true });
      targetItem.dispatchEvent(dragEndEvent);
    }
    // Check that onScroll was not triggered
    expect(onScroll).not.toHaveBeenCalled();

    // Simulate moving the mouse to the top of the list
    if (listHolder) {
      const rect = listHolder.getBoundingClientRect();
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        clientY: rect.top - 10,
      });
      listHolder.dispatchEvent(mouseMoveEvent);
    }
    // Check that onScroll was not triggered
    expect(onScroll).not.toHaveBeenCalled();
  });
});
