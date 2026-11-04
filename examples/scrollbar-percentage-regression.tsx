import * as React from 'react';
import List from '../src/List';

const data = [{ id: 'first' }, { id: 'second' }];

export default function ScrollbarPercentageRegression() {
  const [layoutResult, setLayoutResult] = React.useState('Checking layout…');

  React.useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('#percentage-gutter-list');
    const holder = root?.querySelector<HTMLElement>('.rc-virtual-list-holder');
    const horizontalTrack = root?.querySelector<HTMLElement>(
      '.rc-virtual-list-scrollbar-slot-horizontal',
    );

    if (!root || !holder || !horizontalTrack) {
      setLayoutResult('FAIL: expected list, holder, and horizontal track');
      return undefined;
    }

    let frame = 0;
    const verifyLayout = () => {
      const holderBounds = holder.getBoundingClientRect();
      const rows = Array.from(holder.querySelectorAll<HTMLElement>('[data-regression-row]'));
      const bothRowsVisible =
        rows.length === 2 &&
        rows.every((row) => {
          const bounds = row.getBoundingClientRect();
          return bounds.top >= holderBounds.top && bounds.bottom <= holderBounds.bottom;
        });
      const gutterStartsAfterHolder =
        Math.abs(holderBounds.bottom - horizontalTrack.getBoundingClientRect().top) < 1;
      const hasNoVerticalGutter = !root.querySelector('.rc-virtual-list-scrollbar-slot-vertical');

      setLayoutResult(
        bothRowsVisible && gutterStartsAfterHolder && hasNoVerticalGutter
          ? 'PASS: both rows fit above the horizontal gutter, with no vertical gutter'
          : 'FAIL: percentage gutter reduces or overlaps the short list viewport',
      );
    };

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(verifyLayout);
    });
    observer.observe(root);
    observer.observe(holder);
    frame = requestAnimationFrame(verifyLayout);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <List
        id="percentage-gutter-list"
        itemHeight={20}
        height={100}
        fullHeight={false}
        data={data}
        itemKey="id"
        scrollWidth={1000}
        style={{ width: 200, border: '1px solid red' }}
        styles={{ horizontalScrollBar: { height: '50%' } }}
      >
        {({ id }) => (
          <div data-regression-row style={{ height: 20 }}>
            {id}
          </div>
        )}
      </List>
      <p role="status" data-testid="percentage-gutter-result">
        {layoutResult}
      </p>
    </>
  );
}
