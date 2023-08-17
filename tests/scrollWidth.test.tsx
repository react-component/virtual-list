import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { spyElementPrototypes } from 'rc-util/lib/test/domHook';
import {} from 'rc-resize-observer';
import type { ListRef } from '../src';
import List, { type ListProps } from '../src';
import { _rs as onLibResize } from 'rc-resize-observer/lib/utils/observerUtil';
import '@testing-library/jest-dom';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.scrollWidth', () => {
  let mockElement;
  let mockMouseEvent;
  let pageX: number;

  beforeAll(() => {
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        get: () => 20,
      },
      clientHeight: {
        get: () => 100,
      },
      getBoundingClientRect: () => ({
        width: 100,
        height: 100,
      }),
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
      itemHeight: 20,
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

      const { container } = await genList({
        itemHeight: 20,
        height: 100,
        data: genData(100),
        scrollWidth: 1000,
        onVirtualScroll,
        ref: listRef,
      });

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
    });

    it('wheel', async () => {
      const onVirtualScroll = jest.fn();

      const { container } = await genList({
        itemHeight: 20,
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
  });

  it('ref scrollTo', async () => {
    const listRef = React.createRef<ListRef>();

    await genList({
      itemHeight: 20,
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
      itemHeight: 20,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
      extraRender: () => <div className="bamboo" />,
    });

    expect(container.querySelector('.bamboo')).toBeTruthy();
  });
});
