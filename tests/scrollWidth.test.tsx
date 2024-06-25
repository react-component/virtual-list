import '@testing-library/jest-dom';
import { act, fireEvent, render } from '@testing-library/react';
import { _rs as onLibResize } from 'rc-resize-observer/lib/utils/observerUtil';
import { spyElementPrototypes } from 'rc-util/lib/test/domHook';
import React from 'react';
import type { ListRef } from '../src';
import List, { type ListProps } from '../src';

const ITEM_HEIGHT = 20;

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.scrollWidth', () => {
  let mockElement;
  let mockMouseEvent;
  let pageX: number;

  const holderHeight = 100;
  let holderWidth = 100;

  beforeAll(() => {
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        get() {
          if (this.classList.contains('rc-virtual-list-holder')) {
            return holderHeight;
          }
          return ITEM_HEIGHT;
        },
      },
      offsetWidth: {
        get() {
          return holderWidth;
        },
      },
      clientHeight: {
        get() {
          return holderHeight;
        },
      },
      getBoundingClientRect() {
        return {
          width: holderWidth,
          height: holderHeight,
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
    holderWidth = 100;
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
  });

  describe('trigger offset', () => {
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

    listRef.current.scrollTo({ left: 135 });
    expect(listRef.current.getScrollInfo()).toEqual({ x: 135, y: 0 });

    listRef.current.scrollTo({ left: -99 });
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
