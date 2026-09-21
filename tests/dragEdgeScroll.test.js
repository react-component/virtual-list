import { act, createEvent, fireEvent, render } from '@testing-library/react';
import React from 'react';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

// The virtual list positions its content by writing `transform: translateY(...)`
// as a plain string, so this does not depend on a real layout engine and stays
// correct under jsdom.
function getScrollTop(container) {
  const innerEle = container.querySelector('.rc-virtual-list-holder-inner');
  const { transform } = innerEle.style;
  const m = transform && transform.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

// jsdom's synthetic drag event drops unknown init props, so assign the pointer
// coordinate directly (same approach as the mouse-drag specs).
function fireDragOver(el, clientY) {
  const event = createEvent.dragOver(el);
  event.clientY = clientY;
  fireEvent(el, event);
}

function fireDragLeave(el, relatedTarget) {
  const event = createEvent.dragLeave(el);
  event.relatedTarget = relatedTarget;
  fireEvent(el, event);
}

describe('List.NativeDragEdgeScroll', () => {
  let mockElement;

  beforeEach(() => {
    jest.useFakeTimers();
    // Container rect: top=0, bottom=100, height=100.
    // edgeThreshold = min(itemHeight * 1.2, height / 4) = min(24, 25) = 24.
    // => top band [0, 24], bottom band [76, 100], idle zone (24, 76).
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        get() {
          const height = this.getAttribute('data-height');
          return Number(height || 20);
        },
      },
      clientHeight: {
        get: () => 100,
      },
      getBoundingClientRect: () => ({ top: 0, bottom: 100, width: 100, height: 100 }),
      offsetParent: {
        get: () => document.body,
      },
    });
  });

  afterEach(() => {
    mockElement.mockRestore();
    jest.useRealTimers();
  });

  function renderList(props) {
    return render(
      <List component="ul" itemKey="id" itemHeight={20} height={100} data={genData(100)} {...props}>
        {({ id }) => <li>{id}</li>}
      </List>,
    );
  }

  function getInnerLi(container) {
    return container.querySelector('.rc-virtual-list-holder-inner li');
  }

  it('scrolls down when a drag reaches the bottom edge', () => {
    const { container } = renderList();
    expect(getScrollTop(container)).toEqual(0);

    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getScrollTop(container)).toBeGreaterThan(0);
  });

  it('scrolls up when a drag reaches the top edge', () => {
    const listRef = React.createRef();
    const { container } = renderList({ ref: listRef });
    act(() => {
      listRef.current.scrollTo(400);
      jest.advanceTimersByTime(100);
    });
    const before = getScrollTop(container);
    expect(before).toBeGreaterThan(0);

    fireDragOver(getInnerLi(container), 5);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getScrollTop(container)).toBeLessThan(before);
  });

  it('does not scroll while the pointer stays in the idle middle zone', () => {
    const { container } = renderList();

    fireDragOver(getInnerLi(container), 50);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getScrollTop(container)).toEqual(0);
  });

  it('does not scroll when the pointer sits exactly on the band boundary', () => {
    const { container } = renderList();

    // Prove the loop can run first: inside the bottom band.
    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(getScrollTop(container)).toBeGreaterThan(0);
    const atBoundary = getScrollTop(container);

    // Exactly `bottom - edgeThreshold` (100 - 24 = 76): distance to the edge is
    // 0, so the offset is 0 and the loop must stop instead of spinning.
    fireDragOver(getInnerLi(container), 76);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getScrollTop(container)).toEqual(atBoundary);
  });

  it('reuses the running loop when a drag stays inside the edge band', () => {
    const { container } = renderList();

    // Baseline: one `dragover`, then measure how far the loop moves us.
    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    const perFrame = getScrollTop(container);
    expect(perFrame).toBeGreaterThan(0);

    // Second `dragover`, still inside the band: the loop is already scheduled, so
    // the next frame moves by the same amount. A second loop would double it.
    fireDragOver(getInnerLi(container), 88);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getScrollTop(container) - perFrame).toBe(perFrame);
  });

  it('stops scrolling on drop', () => {
    const { container } = renderList();
    const holder = container.querySelector('.rc-virtual-list-holder');

    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    const afterEdge = getScrollTop(container);
    expect(afterEdge).toBeGreaterThan(0);

    fireEvent.drop(holder);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getScrollTop(container)).toEqual(afterEdge);
  });

  it('stops scrolling on dragend even when released outside the container', () => {
    const { container } = renderList();

    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    const afterEdge = getScrollTop(container);
    expect(afterEdge).toBeGreaterThan(0);

    // Release anywhere; the document-level capture listener must still stop it.
    fireEvent.dragEnd(document.body);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getScrollTop(container)).toEqual(afterEdge);
  });

  it('stops scrolling when the drag really leaves the container', () => {
    const { container } = renderList();

    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    const afterEdge = getScrollTop(container);
    expect(afterEdge).toBeGreaterThan(0);

    // `relatedTarget` outside the container => the pointer truly left.
    fireDragLeave(getInnerLi(container), document.body);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getScrollTop(container)).toEqual(afterEdge);
  });

  it('keeps scrolling when the drag only moves between inner nodes', () => {
    const { container } = renderList();

    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    const afterEdge = getScrollTop(container);
    expect(afterEdge).toBeGreaterThan(0);

    // `dragleave` also fires between inner nodes; a `relatedTarget` still inside
    // the container must NOT be treated as leaving.
    const holder = container.querySelector('.rc-virtual-list-holder');
    fireDragLeave(getInnerLi(container), holder);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getScrollTop(container)).toBeGreaterThan(afterEdge);
  });

  it('does not attach the behavior for a non-virtual list', () => {
    // `virtual={false}` keeps native drag-to-edge to the browser.
    const { container } = renderList({ virtual: false });

    fireDragOver(getInnerLi(container), 95);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getScrollTop(container)).toEqual(0);
  });
});
