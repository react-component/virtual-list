import '@testing-library/jest-dom';
import { act, fireEvent, render } from '@testing-library/react';
import { _rs as onLibResize } from '@rc-component/resize-observer/lib/utils/observerUtil';
import { spyElementPrototypes } from '@rc-component/util/lib/test/domHook';
import React from 'react';
import type { ListRef } from '../src';
import List, { type ListProps } from '../src';
import { getScrollbarVisibility } from '../src/utils/scrollbarUtil';

const ITEM_HEIGHT = 20;

function genData(count: number) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.scrollWidth', () => {
  let mockElement;
  let mockMouseEvent;
  let pageX: number;

  let holderHeight = 100;
  let holderWidth = 100;
  let containerHeight = 100;
  let containerWidth = 100;

  beforeAll(() => {
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        get() {
          if (this.classList.contains('rc-virtual-list-holder')) {
            return holderHeight;
          }
          if (this.classList.contains('rc-virtual-list')) {
            return containerHeight;
          }
          return ITEM_HEIGHT;
        },
      },
      offsetWidth: {
        get() {
          if (this.classList.contains('rc-virtual-list')) {
            return containerWidth;
          }
          return holderWidth;
        },
      },
      clientHeight: {
        get() {
          return holderHeight;
        },
      },
      clientWidth: {
        get() {
          return this.classList.contains('rc-virtual-list') ? containerWidth : holderWidth;
        },
      },
      getBoundingClientRect() {
        const width = this.classList.contains('rc-virtual-list') ? containerWidth : holderWidth;
        const height = this.classList.contains('rc-virtual-list') ? containerHeight : holderHeight;
        return {
          top: 0,
          bottom: height,
          left: 0,
          right: width,
          width,
          height,
        };
      },
    });

    mockMouseEvent = spyElementPrototypes(MouseEvent, {
      pageX: {
        get: () => pageX,
      },
    });
  });

  afterAll(() => {
    mockElement.mockRestore();
    mockMouseEvent.mockRestore();
  });

  beforeEach(() => {
    holderHeight = 100;
    holderWidth = 100;
    containerHeight = 100;
    containerWidth = 100;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  async function genList(props: Partial<ListProps<any>> & { ref?: any }) {
    const ret = render(
      <List component="ul" itemKey="id" {...(props as any)}>
        {({ id }) => <li>{id}</li>}
      </List>,
    );

    await act(async () => {
      onLibResize([
        {
          target: ret.container.querySelector('.rc-virtual-list')!,
        } as ResizeObserverEntry,
        {
          target: ret.container.querySelector('.rc-virtual-list-holder')!,
        } as ResizeObserverEntry,
      ]);

      await Promise.resolve();
    });

    return ret;
  }

  it('work', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toBeTruthy();
    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical')).toBeTruthy();
    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({
      gridTemplateColumns: 'minmax(0, 1fr) 8px',
      gridTemplateRows: 'minmax(0, 1fr) 8px',
      height: '100px',
    });
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ height: '100%' });
    expect(container.querySelector('.rc-virtual-list-scrollbar-slot-horizontal')).toHaveStyle({
      gridRow: '2',
    });
  });

  it('reserves only the horizontal scrollbar gutter when vertical content fits', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(2),
      scrollWidth: 1000,
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical')).toBeNull();
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ height: '100%' });
    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({
      gridTemplateRows: 'minmax(0, 1fr) 8px',
      height: '100px',
    });
  });

  it('constrains the grid without changing fullHeight false into fixed height', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      fullHeight: false,
      data: genData(100),
      scrollWidth: 1000,
    });

    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({ maxHeight: '100px' });
    expect(container.querySelector('.rc-virtual-list')).not.toHaveStyle({ height: '100px' });
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ maxHeight: '100%' });
  });

  it('keeps short content visible with a percentage gutter when fullHeight is false', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      fullHeight: false,
      data: genData(2),
      scrollWidth: 1000,
      style: { width: 200 },
      styles: { horizontalScrollBar: { height: '50%' } },
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toBeTruthy();
    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical')).toBeNull();
    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({
      maxHeight: '100px',
      minHeight: '80px',
    });
    expect(container.querySelector('.rc-virtual-list')).not.toHaveStyle({ height: '100px' });
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ maxHeight: '100%' });
  });

  it('caps the percentage gutter minimum at the requested height', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      fullHeight: false,
      data: genData(10),
      scrollWidth: 1000,
      style: { width: 200 },
      styles: { horizontalScrollBar: { height: '50%' } },
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical')).toBeTruthy();
    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({
      maxHeight: '100px',
      minHeight: '100px',
    });
  });

  it('does not reserve scrollbar gutters when scrollbars are disabled', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      showScrollBar: false,
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-slot')).toBeNull();
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ height: '100px' });
  });

  it('matches reserved gutters to custom scrollbar dimensions', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      styles: {
        verticalScrollBar: { width: 12 },
        horizontalScrollBar: { height: 6 },
      },
    });

    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({
      gridTemplateColumns: 'minmax(0, 1fr) 12px',
      gridTemplateRows: 'minmax(0, 1fr) 6px',
      height: '100px',
    });
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ height: '100%' });
  });

  it('fills percentage-sized scrollbar gutters without applying the percentage twice', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      styles: {
        verticalScrollBar: { width: '50%' },
        horizontalScrollBar: { height: '50%' },
      },
    });

    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({
      gridTemplateColumns: 'minmax(0, 1fr) 50%',
      gridTemplateRows: 'minmax(0, 1fr) 50%',
    });
    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical')).toHaveStyle({
      width: '100%',
    });
    expect(container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toHaveStyle({
      height: '100%',
    });
  });

  it('refreshes available container width when only the holder size changes', async () => {
    containerWidth = 200;
    holderWidth = 200;

    const props = {
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(2),
      scrollWidth: 190,
      style: { width: 200 },
    };
    const result = await genList(props);

    expect(result.container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toBeNull();

    result.rerender(
      <List
        component="ul"
        itemKey="id"
        {...props}
        style={{ width: 200, paddingLeft: 20, paddingRight: 0 }}
      >
        {({ id }) => <li>{id}</li>}
      </List>,
    );
    holderWidth = 180;

    await act(async () => {
      onLibResize([
        {
          target: result.container.querySelector('.rc-virtual-list')!,
        } as ResizeObserverEntry,
        {
          target: result.container.querySelector('.rc-virtual-list-holder')!,
        } as ResizeObserverEntry,
      ]);

      await Promise.resolve();
    });

    expect(result.container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toBeTruthy();
  });

  it('adds the vertical scrollbar when the horizontal gutter reduces the viewport', async () => {
    holderHeight = 92;

    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(5),
      scrollWidth: 1000,
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toBeTruthy();
    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical')).toBeTruthy();
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ height: '100%' });
  });

  it('keeps scrollbar decisions stable when the holder was measured after gutters', async () => {
    containerWidth = 200;
    containerHeight = 100;
    holderWidth = 192;
    holderHeight = 92;

    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(5),
      scrollWidth: 200,
      style: { width: 200 },
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toBeNull();
    expect(container.querySelector('.rc-virtual-list-scrollbar-vertical')).toBeNull();
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ height: '100px' });
  });

  it('normalizes string zero scrollbar dimensions', async () => {
    const horizontal = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      styles: { horizontalScrollBar: { height: '0' } },
    });

    expect(horizontal.container.querySelector('.rc-virtual-list')).toHaveStyle({
      gridTemplateRows: 'minmax(0, 1fr) 0px',
      height: '100px',
    });
    expect(horizontal.container.querySelector('.rc-virtual-list-holder')).toHaveStyle({
      height: '100%',
    });
    horizontal.unmount();

    const vertical = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      styles: { verticalScrollBar: { width: '0' } },
    });

    expect(vertical.container.querySelector('.rc-virtual-list')).toHaveStyle({
      gridTemplateColumns: 'minmax(0, 1fr) 0px',
    });
  });

  it('reserves the vertical gutter on the left in rtl', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      direction: 'rtl',
    });

    expect(container.querySelector('.rc-virtual-list')).toHaveStyle({
      gridTemplateColumns: 'minmax(0, 1fr) 8px',
    });
    expect(container.querySelector('.rc-virtual-list')).toHaveAttribute('dir', 'rtl');
    expect(container.querySelector('.rc-virtual-list-holder')).toHaveStyle({ gridColumn: '1' });
    expect(container.querySelector('.rc-virtual-list-scrollbar-slot-vertical')).toHaveStyle({
      gridColumn: '2',
    });
    expect(container.querySelector('.rc-virtual-list-scrollbar-slot-horizontal')).toHaveStyle({
      gridColumn: '1',
    });
  });

  it('resolves mutually dependent gutters from the outer viewport', () => {
    expect(
      getScrollbarVisibility({
        containerHeight: 100,
        containerWidth: 200,
        scrollHeight: 100,
        scrollWidth: 200,
        viewportHeight: 92,
        viewportWidth: 192,
      }),
    ).toEqual({ hasHorizontalScrollBar: false, hasVerticalScrollBar: false });

    expect(
      getScrollbarVisibility({
        containerHeight: 100,
        containerWidth: 200,
        scrollHeight: 100,
        scrollWidth: 201,
        viewportHeight: 92,
        viewportWidth: 192,
      }),
    ).toEqual({ hasHorizontalScrollBar: true, hasVerticalScrollBar: true });
  });

  describe('trigger offset', () => {
    it('click horizontal track to scroll', async () => {
      const listRef = React.createRef<ListRef>();

      const { container } = await genList({
        itemHeight: ITEM_HEIGHT,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
        ref: listRef,
      });

      pageX = 30;
      fireEvent.mouseDown(container.querySelector('.rc-virtual-list-scrollbar-horizontal')!);

      expect(listRef.current.getScrollInfo()).toEqual({ x: 225, y: 0 });
    });

    it('click horizontal track to scroll in rtl', async () => {
      const listRef = React.createRef<ListRef>();

      const { container } = await genList({
        itemHeight: ITEM_HEIGHT,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
        direction: 'rtl',
        ref: listRef,
      });

      pageX = 30;
      fireEvent.mouseDown(container.querySelector('.rc-virtual-list-scrollbar-horizontal')!);

      expect(listRef.current.getScrollInfo()).toEqual({ x: -675, y: 0 });
    });

    it('drag scrollbar', async () => {
      const onVirtualScroll = jest.fn();
      const listRef = React.createRef<ListRef>();

      const props = {
        itemHeight: ITEM_HEIGHT,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
        onVirtualScroll,
        ref: listRef,
      };

      const { container, rerender } = await genList(props);

      await act(async () => {
        onLibResize([
          {
            target: container.querySelector('.rc-virtual-list-holder')!,
          } as ResizeObserverEntry,
        ]);

        await Promise.resolve();
      });

      // Drag
      const thumb = container.querySelector(
        '.rc-virtual-list-scrollbar-horizontal .rc-virtual-list-scrollbar-thumb',
      )!;

      pageX = 10;
      fireEvent.mouseDown(thumb);

      pageX = 100000;
      fireEvent.mouseMove(window);

      act(() => {
        jest.runAllTimers();
      });

      fireEvent.mouseUp(window);

      expect(thumb).toHaveStyle({
        left: '80px',
        width: '20px',
      });

      expect(onVirtualScroll).toHaveBeenCalledWith({ x: 900, y: 0 });
      expect(listRef.current.getScrollInfo()).toEqual({ x: 900, y: 0 });

      act(() => {
        rerender(
          <List component="ul" itemKey="id" {...props} scrollWidth={600}>
            {({ id }) => <li>{id}</li>}
          </List>,
        );
      });
      expect(onVirtualScroll).toHaveBeenCalledWith({ x: 500, y: 0 });
      expect(listRef.current.getScrollInfo()).toEqual({ x: 500, y: 0 });
    });

    it('wheel', async () => {
      const onVirtualScroll = jest.fn();

      const { container } = await genList({
        itemHeight: ITEM_HEIGHT,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
        onVirtualScroll,
      });

      // Wheel
      fireEvent.wheel(container.querySelector('.rc-virtual-list-holder')!, {
        deltaX: 123,
      });
      expect(onVirtualScroll).toHaveBeenCalledWith({ x: 123, y: 0 });
    });

    it('trigger event when less count', async () => {
      const onVirtualScroll = jest.fn();

      const { container } = await genList({
        itemHeight: ITEM_HEIGHT,
        height: 100,
        data: genData(1),
        scrollWidth: 1000,
        onVirtualScroll,
      });

      // Wheel
      fireEvent.wheel(container.querySelector('.rc-virtual-list-holder')!, {
        deltaX: 123,
      });
      expect(onVirtualScroll).toHaveBeenCalledWith({ x: 123, y: 0 });
    });

    it('shift wheel', async () => {
      const onVirtualScroll = jest.fn();

      const { container } = await genList({
        itemHeight: ITEM_HEIGHT,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
        onVirtualScroll,
      });

      // Wheel
      fireEvent.wheel(container.querySelector('.rc-virtual-list-holder')!, {
        deltaY: 123,
        shiftKey: true,
      });
      expect(onVirtualScroll).toHaveBeenCalledWith({ x: 123, y: 0 });
    });
  });

  it('ref scrollTo', async () => {
    const listRef = React.createRef<ListRef>();

    await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      ref: listRef,
    });

    act(() => {
      listRef.current.scrollTo({ left: 135 });
    });
    expect(listRef.current.getScrollInfo()).toEqual({ x: 135, y: 0 });

    act(() => {
      listRef.current.scrollTo({ left: -99 });
    });
    expect(listRef.current.getScrollInfo()).toEqual({ x: 0, y: 0 });
  });

  it('support extraRender', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      extraRender: ({ getSize }) => {
        const size = getSize('1', '3');
        return (
          <div className="bamboo">
            {size.top}/{size.bottom}
          </div>
        );
      },
    });

    expect(container.querySelector('.rc-virtual-list-holder-inner .bamboo')).toBeTruthy();
    expect(container.querySelector('.bamboo').textContent).toEqual(
      `${ITEM_HEIGHT}/${4 * ITEM_HEIGHT}`,
    );
  });

  it('resize should back of scrollLeft', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
    });

    // Wheel
    fireEvent.wheel(container.querySelector('.rc-virtual-list-holder')!, {
      deltaX: 9999999,
    });

    holderWidth = 200;

    await act(async () => {
      onLibResize([
        {
          target: container.querySelector('.rc-virtual-list-holder')!,
        } as ResizeObserverEntry,
      ]);

      await Promise.resolve();
    });

    expect(container.querySelector('.rc-virtual-list-holder-inner')).toHaveStyle({
      marginLeft: '-800px',
    });
  });

  it('touch horizontal', async () => {
    const { container } = await genList({
      itemHeight: ITEM_HEIGHT,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
    });

    fireEvent.touchStart(container.querySelector('.rc-virtual-list-holder')!, {
      touches: [{ pageX: 100, pageY: 0 }],
    });

    fireEvent.touchMove(container.querySelector('.rc-virtual-list-holder')!, {
      touches: [{ pageX: 0, pageY: 0 }],
    });

    fireEvent.touchEnd(container.querySelector('.rc-virtual-list-holder')!, {
      touches: [{ pageX: 0, pageY: 0 }],
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(container.querySelector('.rc-virtual-list-holder-inner')).toHaveStyle({
      marginLeft: '-900px',
    });
  });
});
