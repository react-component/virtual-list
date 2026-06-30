import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';
import { _rs as onLibResize } from '@rc-component/resize-observer/lib/utils/observerUtil';
import { act, render } from '@testing-library/react';
import React from 'react';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, id) => ({ id }));
}

function genNode(props) {
  return (
    <List component="ul" itemKey="id" {...props}>
      {({ id }) => <li>{id}</li>}
    </List>
  );
}

function genList(props) {
  return render(genNode(props));
}

function getHolder(container) {
  return container.querySelector('.rc-virtual-list-holder');
}

function getInner(container) {
  return container.querySelector('.rc-virtual-list-holder-inner');
}

function getFiller(container) {
  return getInner(container).parentElement;
}

function getOffsetY(container) {
  const { transform } = getInner(container).style;
  return Number(transform.match(/translateY\((\d+)px\)/)?.[1] || 0);
}

describe('List.Basic', () => {
  describe('raw', () => {
    it('without height', () => {
      const { container } = genList({ data: genData(1) });
      expect(getFiller(container)).not.toHaveStyle({ height: '1px' });
      expect(getInner(container).style.transform).toEqual('');
    });

    describe('height over itemHeight', () => {
      it('full height', () => {
        const { container } = genList({ data: genData(1), itemHeight: 1, height: 999 });
        expect(getFiller(container).style.height).toEqual('');
        expect(getHolder(container)).toHaveStyle({ height: '999px' });
      });

      it('without full height', () => {
        const { container } = genList({
          data: genData(1),
          itemHeight: 1,
          height: 999,
          fullHeight: false,
        });
        expect(getFiller(container).style.height).toEqual('');
        expect(getHolder(container)).toHaveStyle({ maxHeight: '999px' });
      });
    });
  });

  describe('virtual', () => {
    let scrollTop = 0;
    let mockElement;

    beforeAll(() => {
      mockElement = spyElementPrototypes(HTMLElement, {
        offsetHeight: {
          get: () => 20,
        },
        scrollHeight: {
          get: () => 2000,
        },
        clientHeight: {
          get: () => 100,
        },
        scrollTop: {
          get: () => scrollTop,
          set(_, val) {
            scrollTop = val;
          },
        },
      });
    });

    afterAll(() => {
      mockElement.mockRestore();
    });

    it('scroll it', () => {
      const onVisibleChange = jest.fn();

      // scroll to top
      scrollTop = 0;
      const { container } = genList({
        itemHeight: 20,
        height: 100,
        data: genData(100),
        onVisibleChange,
      });
      expect(getFiller(container)).toHaveStyle({ height: '2000px' });
      expect(getOffsetY(container)).toEqual(0);
      onVisibleChange.mockReset();

      // scrollTop to end
      scrollTop = 2000 - 100;
      fireEvent.scroll(getHolder(container));
      expect(getFiller(container)).toHaveStyle({ height: '2000px' });
      expect(getOffsetY(container) + container.querySelectorAll('li').length * 20).toEqual(2000);

      expect(onVisibleChange.mock.calls[0][0]).toHaveLength(6);
      expect(onVisibleChange.mock.calls[0][1]).toHaveLength(100);
    });
  });

  describe('status switch', () => {
    let scrollTop = 0;

    let mockLiElement;
    let mockElement;

    beforeAll(() => {
      mockLiElement = spyElementPrototypes(HTMLLIElement, {
        offsetHeight: {
          get: () => 40,
        },
      });

      mockElement = spyElementPrototypes(HTMLElement, {
        clientHeight: {
          get: () => 100,
        },
        scrollTop: {
          get: () => scrollTop,
          set(_, val) {
            scrollTop = val;
          },
        },
      });
    });

    afterAll(() => {
      mockElement.mockRestore();
      mockLiElement.mockRestore();
    });

    it('raw to virtual', () => {
      let data = genData(5);
      const { container, rerender } = genList({ itemHeight: 20, height: 100, data });

      expect(container.querySelectorAll('li')).toHaveLength(5);

      data = genData(10);
      rerender(genNode({ itemHeight: 20, height: 100, data }));
      expect(container.querySelectorAll('li').length < data.length).toBeTruthy();
    });

    it('virtual to raw', () => {
      let data = genData(10);
      const { container, rerender } = genList({ itemHeight: 20, height: 100, data });
      expect(container.querySelectorAll('li').length < data.length).toBeTruthy();

      data = data.slice(0, 2);
      rerender(genNode({ itemHeight: 20, height: 100, data }));
      expect(container.querySelectorAll('li')).toHaveLength(2);

      // Should not crash if data count change
      data = data.slice(0, 1);
      rerender(genNode({ itemHeight: 20, height: 100, data }));
      expect(container.querySelectorAll('li')).toHaveLength(1);
    });
  });

  it('`virtual` is false', () => {
    const { container } = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      virtual: false,
    });
    expect(container.querySelectorAll('li')).toHaveLength(100);
  });

  it('Should not crash when height change makes virtual scroll to be raw scroll', () => {
    const { rerender } = genList({ itemHeight: 20, height: 40, data: genData(3) });
    rerender(genNode({ itemHeight: 20, height: 1000, data: genData(3) }));
  });

  describe('should collect height', () => {
    let mockElement;
    let collected = false;

    beforeAll(() => {
      mockElement = spyElementPrototypes(HTMLElement, {
        offsetHeight: {
          get: () => {
            collected = true;
            return 20;
          },
        },
        offsetParent: {
          get() {
            return this;
          },
        },
      });
    });

    afterAll(() => {
      mockElement.mockRestore();
    });

    it('work', async () => {
      const { container } = genList({ itemHeight: 20, height: 40, data: genData(3) });
      collected = false;

      await act(async () => {
        onLibResize([
          {
            target: getInner(container),
          },
        ]);

        await Promise.resolve();
      });

      expect(collected).toBeTruthy();
    });
  });

  it('innerProps', () => {
    const { container } = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      virtual: false,
      innerProps: {
        role: 'listbox',
        id: `my_list`,
      },
    });

    expect(container.querySelector('div#my_list')).toHaveAttribute('role', 'listbox');
  });

  it('nativeElement', () => {
    const ref = React.createRef();
    const { container } = genList({ data: genData(1), ref });
    expect(ref.current.nativeElement).toBe(container.firstChild);
  });
});
