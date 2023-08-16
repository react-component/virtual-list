import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { spyElementPrototypes } from 'rc-util/lib/test/domHook';
import {} from 'rc-resize-observer';
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

  function genList(props: Partial<ListProps<any>>) {
    return render(
      <List component="ul" itemKey="id" {...(props as any)}>
        {({ id }) => <li>{id}</li>}
      </List>,
    );
  }

  it('work', () => {
    const { container } = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
    });

    expect(container.querySelector('.rc-virtual-list-scrollbar-horizontal')).toBeTruthy();
  });

  it('trigger offset', async () => {
    const { container } = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      scrollWidth: 1000,
    });

    await act(async () => {
      onLibResize([
        {
          target: container.querySelector('.rc-virtual-list-scrollbar-horizontal')!,
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
  });
});
