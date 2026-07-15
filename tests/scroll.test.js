import '@testing-library/jest-dom';
import { act, createEvent, fireEvent, render } from '@testing-library/react';
import { _rs as onLibResize } from '@rc-component/resize-observer/lib/utils/observerUtil';
import { resetWarned } from '@rc-component/util/lib/warning';
import React from 'react';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

function genNode(props) {
  const mergedProps = {
    component: 'ul',
    itemKey: 'id',
    children: ({ id }) => <li>{id}</li>,
    ...props,
  };

  return <List {...mergedProps} />;
}

function getHolder(container) {
  return container.querySelector('.rc-virtual-list-holder');
}

function getScrollOffset(container) {
  return Number(container.querySelector('[data-dev-offset]')?.getAttribute('data-dev-offset'));
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

  function genList(props) {
    return render(genNode(props));
  }

  it('scrollTo null will show the scrollbar', () => {
    jest.useFakeTimers();
    const listRef = React.createRef();
    const { container } = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      ref: listRef,
    });
    act(() => {
      jest.runAllTimers();
      listRef.current.scrollTo(null);
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-thumb').style.display).not.toEqual(
      'none',
    );
    jest.useRealTimers();
  });

  describe('scrollTo number', () => {
    it('value scroll', () => {
      const listRef = React.createRef();
      const { container, unmount } = genList({
        itemHeight: 20,
        height: 100,
        data: genData(100),
        ref: listRef,
      });
      act(() => {
        listRef.current.scrollTo(903);
        jest.runAllTimers();
      });
      expect(container.querySelector('ul').scrollTop).toEqual(903);

      unmount();
    });

    it('passes current scrollTop to extraRender', () => {
      const listRef = React.createRef();
      const extraRender = jest.fn(() => null);
      const { unmount } = genList({
        itemHeight: 20,
        height: 100,
        data: genData(100),
        ref: listRef,
        extraRender,
      });

      act(() => {
        listRef.current.scrollTo(80);
        jest.runAllTimers();
      });

      expect(extraRender).toHaveBeenLastCalledWith(
        expect.objectContaining({
          scrollTop: 80,
        }),
      );

      unmount();
    });
  });

  describe('scroll to object', () => {
    function presetList() {
      const ref = React.createRef();

      const result = genList({ itemHeight: 20, height: 100, data: genData(100), ref });

      return {
        ...result,
        ref,
        scrollTo: (...args) => {
          act(() => {
            ref.current.scrollTo(...args);
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

    it('supports function offset with getSize info', () => {
      const { scrollTo, container } = presetList();
      const offset = jest.fn(({ getSize }) => getSize('2').bottom);

      scrollTo({ key: '30', align: 'top', offset });

      expect(offset).toHaveBeenCalledWith({
        getSize: expect.any(Function),
        align: 'top',
      });
      expect(offset).toHaveBeenCalledTimes(2);
      expect(container.querySelector('ul').scrollTop).toEqual(540);
    });

    it('auto align exposes resolved direction to offset callback', () => {
      const { scrollTo, container } = presetList();

      // Target below viewport → auto pins to bottom
      scrollTo(0);
      const belowAligns = [];
      scrollTo({
        index: 30,
        offset: ({ align }) => {
          belowAligns.push(align);
          return 0;
        },
      });
      expect(belowAligns).toContain('bottom');
      expect(container.querySelector('ul').scrollTop).toEqual(520);

      // Target above viewport → auto pins to top
      scrollTo(800);
      const aboveAligns = [];
      scrollTo({
        index: 30,
        offset: ({ align }) => {
          aboveAligns.push(align);
          return 0;
        },
      });
      expect(aboveAligns).toContain('top');
      expect(container.querySelector('ul').scrollTop).toEqual(600);
    });

    it('fallbacks invalid function offset to zero', () => {
      const { scrollTo, container } = presetList();
      const offset = jest.fn(() => NaN);

      scrollTo({ key: '30', align: 'top', offset });

      expect(container.querySelector('ul').scrollTop).toEqual(600);
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
    const { container } = genList({ itemHeight: 20, height: 100, data: genData(100) });
    const ulElement = container.querySelector('ul');

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
      const { container } = genList({
        itemHeight: 20,
        height: 100,
        data: genData(100),
        ref: listRef,
      });

      // Mouse down
      act(() => {
        const thumb = container.querySelector('.rc-virtual-list-scrollbar-thumb');
        const mouseDownEvent = createEvent.mouseDown(thumb);
        Object.defineProperty(mouseDownEvent, 'pageY', { value: 0 });
        fireEvent(thumb, mouseDownEvent);
      });

      // Mouse move
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove');
        Object.defineProperty(mouseMoveEvent, 'pageY', { value: 10 });
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(getHolder(container).style.pointerEvents).toEqual('none');

      act(() => {
        jest.runAllTimers();
      });

      // Mouse up
      act(() => {
        const mouseUpEvent = new Event('mouseup');
        window.dispatchEvent(mouseUpEvent);
      });

      expect(container.querySelector('ul').scrollTop > 0).toBeTruthy();
    });

    it('click track to scroll', () => {
      const { container } = genList({
        itemHeight: 20,
        height: 100,
        data: genData(100),
      });

      act(() => {
        const scrollbar = container.querySelector('.rc-virtual-list-scrollbar-vertical');
        const mouseDownEvent = createEvent.mouseDown(scrollbar);
        Object.defineProperty(mouseDownEvent, 'pageY', { value: 50 });
        fireEvent(scrollbar, mouseDownEvent);
      });

      expect(container.querySelector('ul').scrollTop).toEqual(950);
    });

    it('should show scrollbar when element has showScrollBar prop set to true', () => {
      jest.useFakeTimers();
      const listRef = React.createRef();
      const { container } = genList({
        itemHeight: 20,
        height: 100,
        data: genData(100),
        ref: listRef,
        showScrollBar: true,
      });
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
          const { container } = genList({
            itemHeight: 20,
            height: 100,
            data: genData(5),
            ...props,
          });
          expect(container.querySelector('.rc-virtual-list-scrollbar-thumb')).toBeFalsy();
        });
      });
    });
  });

  it('no bubble', () => {
    const { container } = genList({ itemHeight: 20, height: 100, data: genData(100) });

    // Mouse down
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    const event = createEvent.mouseDown(container.querySelector('.rc-virtual-list-scrollbar'));
    event.preventDefault = preventDefault;
    event.stopPropagation = stopPropagation;
    fireEvent(container.querySelector('.rc-virtual-list-scrollbar'), event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('onScroll should trigger on correct target', () => {
    // Save in tmp variable since React will clean up this
    let currentTarget;
    const onScroll = jest.fn((e) => {
      ({ currentTarget } = e);
    });
    const { container } = genList({ itemHeight: 20, height: 100, data: genData(100), onScroll });
    const holder = getHolder(container);
    fireEvent.scroll(holder);

    expect(currentTarget).toBe(holder);
  });

  describe('scroll should in range', () => {
    it('less than 0', () => {
      const { container, rerender } = genList({ itemHeight: 20, height: 100, data: genData(100) });
      const ulElement = container.querySelector('ul');

      act(() => {
        const wheelEvent = new Event('wheel');
        wheelEvent.deltaY = 9999999;
        ulElement.dispatchEvent(wheelEvent);

        jest.runAllTimers();
      });

      rerender(genNode({ itemHeight: 20, height: 100, data: genData(1) }));
      act(() => {
        getHolder(container).scrollTop = 0;
        fireEvent.scroll(getHolder(container));
      });

      rerender(genNode({ itemHeight: 20, height: 100, data: genData(100) }));

      expect(getScrollOffset(container)).toEqual(0);
    });

    it('over max height', () => {
      const { container } = genList({ itemHeight: 20, height: 100, data: genData(100) });
      const ulElement = container.querySelector('ul');

      act(() => {
        const wheelEvent = new Event('wheel');
        wheelEvent.deltaY = 9999999;
        ulElement.dispatchEvent(wheelEvent);

        jest.runAllTimers();
      });

      expect(getScrollOffset(container)).toEqual(1900);
    });

    it('dynamic large to small', () => {
      const { container, rerender } = genList({
        itemHeight: 20,
        height: 100,
        data: genData(1000),
      });
      const ulElement = container.querySelector('ul');

      // To bottom
      act(() => {
        const wheelEvent = new Event('wheel');
        wheelEvent.deltaY = 9999999;
        ulElement.dispatchEvent(wheelEvent);

        jest.runAllTimers();
      });

      // Cut data len
      rerender(genNode({ itemHeight: 20, height: 100, data: genData(20) }));

      expect(container.querySelectorAll('li').length).toBeLessThan(10);
    });
  });

  it('scrollbar should be left position with rtl', () => {
    jest.useFakeTimers();
    const listRef = React.createRef();
    const { container } = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      ref: listRef,
      direction: 'rtl',
    });
    act(() => {
      jest.runAllTimers();
      listRef.current.scrollTo(null);
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-thumb').style.display).not.toEqual(
      'none',
    );
    expect(container.querySelector('.rc-virtual-list-scrollbar').style.left).toEqual('0px');
    jest.useRealTimers();

    expect(container.querySelector('.rc-virtual-list-rtl')).toBeTruthy();
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
      deltaY: 1e20,
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

  it('should not scroll after dropping selected list text', () => {
    const selectElementText = (element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };

    const onScroll = jest.fn();
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('dragend', onDragEnd);

    const { container } = render(
      <List
        component="ul"
        itemKey="id"
        itemHeight={20}
        height={100}
        data={genData(200)}
        onScroll={onScroll}
      >
        {({ id }) => <li className="fixed-item">{id}</li>}
      </List>,
    );
    const fixedItems = container.querySelectorAll('.fixed-item');
    const targetItem = fixedItems[0];
    if (targetItem) {
      selectElementText(targetItem);
    }
    const listHolder = container.querySelector('.rc-virtual-list-holder');
    if (targetItem && listHolder) {
      selectElementText(targetItem);

      fireEvent.scroll(listHolder, { target: { scrollTop: 100 } });
      expect(onScroll).toHaveBeenCalled();
      const scrollCallCountBeforeDrop = onScroll.mock.calls.length;

      const dragStartEvent = new Event('dragstart', { bubbles: true, cancelable: true });
      targetItem.ownerDocument.dispatchEvent(dragStartEvent);

      const rect = listHolder.getBoundingClientRect();
      fireEvent.dragOver(listHolder, {
        clientY: rect.bottom + 10,
        bubbles: true,
      });

      fireEvent.drop(listHolder, {
        clientY: rect.bottom + 10,
        bubbles: true,
      });

      const dragEndEvent = new Event('dragend', { bubbles: true, cancelable: true });
      targetItem.ownerDocument.dispatchEvent(dragEndEvent);

      const afterRect = listHolder.getBoundingClientRect();
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        clientY: afterRect.top - 10,
      });
      listHolder.dispatchEvent(mouseMoveEvent);
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(onScroll.mock.calls.length).toBe(scrollCallCountBeforeDrop);
    }
    expect(onDragStart).toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalled();

    const sel = window.getSelection();
    sel && sel.removeAllRanges();

    document.removeEventListener('dragstart', onDragStart);
    document.removeEventListener('dragend', onDragEnd);
  });
});
