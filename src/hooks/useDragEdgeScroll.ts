import { raf } from '@rc-component/util';
import * as React from 'react';
import { smoothScrollOffset } from './useScrollDrag';

/**
 * The mouse-drag path in `useScrollDrag` runs on `mousemove`, which the browser
 * does not fire during a native HTML5 drag — and it deliberately skips
 * draggable targets so it never fights the native drag. So when a consumer
 * (e.g. a draggable Tree) drags a node toward the edge of a virtual list, the
 * container is `overflow: hidden`, the browser's native drag-to-edge autoscroll
 * is disabled, and nothing scrolls.
 *
 * Drive the edge scrolling from the native drag events instead. `dragover` only
 * fires while a drag is in progress, so no extra "is dragging" flag is needed:
 * the listeners can stay mounted and simply do nothing until a drag happens.
 */
export default function useDragEdgeScroll(
  inVirtual: boolean,
  componentRef: React.RefObject<HTMLElement>,
  height: number,
  itemHeight: number,
  onScrollOffset: (offset: number) => void,
) {
  const onScrollOffsetRef = React.useRef(onScrollOffset);
  onScrollOffsetRef.current = onScrollOffset;

  React.useEffect(() => {
    const ele = componentRef.current;
    if (!inVirtual || !ele || !height) {
      return;
    }

    // `height / 4` caps each band so the top and bottom never overlap on short
    // containers (an idle zone always remains in the middle); `itemHeight * 1.2`
    // keeps a roughly one-row band otherwise.
    const edgeThreshold = Math.min(itemHeight * 1.2, height / 4);

    let rafId: number | null = null;
    let offset = 0;

    const stopScroll = () => {
      if (rafId !== null) {
        raf.cancel(rafId);
        rafId = null;
      }
      offset = 0;
    };

    const scrollFrame = () => {
      onScrollOffsetRef.current(offset);
      rafId = raf(scrollFrame);
    };

    const continueScroll = () => {
      // `0` happens when the pointer sits exactly on the band boundary; spinning
      // the loop for a no-op would fire a scroll callback on every frame.
      if (offset === 0) {
        stopScroll();
        return;
      }
      if (rafId === null) {
        rafId = raf(scrollFrame);
      }
    };

    const onDragOver = (e: DragEvent) => {
      // Skip if a nested virtual List already handled this event, the same way
      // `useScrollDrag` does on `mousedown`: a nested List's `dragover` bubbles
      // to both holders and only the innermost one should scroll.
      const event = e as DragEvent & { _virtualHandled?: boolean };
      if (event._virtualHandled) {
        return;
      }
      // `dragover` keeps firing while the drag lasts, so mark each event: the
      // innermost holder sees it first and the outer ones bail out above.
      event._virtualHandled = true;

      const { top, bottom } = ele.getBoundingClientRect();
      const { clientY } = e;

      if (clientY <= top + edgeThreshold) {
        offset = -smoothScrollOffset(top + edgeThreshold - clientY);
        continueScroll();
      } else if (clientY >= bottom - edgeThreshold) {
        offset = smoothScrollOffset(clientY - (bottom - edgeThreshold));
        continueScroll();
      } else {
        stopScroll();
      }
    };

    const onDragLeave = (e: DragEvent) => {
      const related = e.relatedTarget as Node | null;
      if (!related || !ele.contains(related)) {
        stopScroll();
      }
    };

    const ownerDocument = ele.ownerDocument;

    // `dragover` / `dragleave` need the container rect, so listen on it.
    // `drop` / `dragend` are listened on the document in the CAPTURE phase: a
    // consumer's node may stop their propagation in the bubble phase (rc-tree's
    // `TreeNode` does), so capture is the only reliable place to see the drag
    // ending.
    ele.addEventListener('dragover', onDragOver);
    ele.addEventListener('dragleave', onDragLeave);
    ownerDocument.addEventListener('drop', stopScroll, true);
    ownerDocument.addEventListener('dragend', stopScroll, true);

    return () => {
      stopScroll();
      ele.removeEventListener('dragover', onDragOver);
      ele.removeEventListener('dragleave', onDragLeave);
      ownerDocument.removeEventListener('drop', stopScroll, true);
      ownerDocument.removeEventListener('dragend', stopScroll, true);
    };
  }, [inVirtual, height, itemHeight]);
}
