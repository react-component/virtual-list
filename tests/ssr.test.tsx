import React from 'react';
import { renderToString } from 'react-dom/server';
import List from '../src';

const ITEM_HEIGHT = 20;

function genData(count: number) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.ssr', () => {
  function ssr(extra?: Record<string, any>) {
    return renderToString(
      <List<{ id: string }>
        data={genData(100)}
        height={100}
        itemHeight={ITEM_HEIGHT}
        itemKey="id"
        {...extra}
      >
        {(item) => <div key={item.id}>{item.id}</div>}
      </List>,
    );
  }

  it('initial SSR render should not enter virtual mode (no scrollbar / Filler wrap)', () => {
    const html = ssr();
    expect(html).not.toContain('rc-virtual-list-scrollbar');
    // No Filler outer wrap with translateY (only emitted when inVirtual is true)
    expect(html).not.toContain('translateY');
  });

  it('initial SSR render should use native overflow:auto on holder', () => {
    const html = ssr();
    // overflow-y stays "auto" before mount measures the container
    expect(html).toContain('overflow-y:auto');
    expect(html).not.toContain('overflow-y:hidden');
  });

  it('initial SSR render should not render horizontal scrollbar even when scrollWidth is set', () => {
    const html = ssr({ scrollWidth: 200 });
    expect(html).not.toContain('rc-virtual-list-scrollbar');
    expect(html).not.toContain('overflow-x:hidden');
  });

  it('initial SSR render emits all items so the page is readable without JS', () => {
    const html = ssr();
    // First and last item should both appear in SSR output
    expect(html).toContain('>0</div>');
    expect(html).toContain('>99</div>');
  });
});
