import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import List from '../src';
import Filler from '../src/Filler';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, id) => ({ id }));
}

describe('List.Basic', () => {
  function genList(props) {
    let node = (
      <List component="ul" itemKey="id" {...props}>
        {({ id }) => <li>{id}</li>}
      </List>
    );

    if (props.ref) {
      node = <div>{node}</div>;
    }

    return mount(node);
  }

  describe('raw', () => {
    it('without height', () => {
      const wrapper = genList({ data: genData(1) });
      expect(wrapper.find(Filler).props().offset).toBeFalsy();
    });

    describe('height over itemHeight', () => {
      it('full height', () => {
        const wrapper = genList({ data: genData(1), itemHeight: 1, height: 999 });
        expect(wrapper.find(Filler).props().offset).toBeFalsy();
        expect(wrapper.find('ul').props().style).toEqual(expect.objectContaining({ height: 999 }));
      });

      it('without full height', () => {
        const wrapper = genList({
          data: genData(1),
          itemHeight: 1,
          height: 999,
          fullHeight: false,
        });
        expect(wrapper.find(Filler).props().offset).toBeFalsy();
        expect(wrapper.find('ul').props().style).toEqual(
          expect.objectContaining({ maxHeight: 999 }),
        );
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
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), onVisibleChange });
      expect(wrapper.find(Filler).props().height).toEqual(2000);
      expect(wrapper.find(Filler).props().offsetY).toEqual(0);
      onVisibleChange.mockReset();

      // scrollTop to end
      scrollTop = 2000 - 100;
      wrapper.find('ul').simulate('scroll', {
        scrollTop,
      });
      expect(wrapper.find(Filler).props().height).toEqual(2000);
      expect(wrapper.find(Filler).props().offsetY + wrapper.find('li').length * 20).toEqual(2000);

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
      const wrapper = genList({ itemHeight: 20, height: 100, data });

      expect(wrapper.find('li')).toHaveLength(5);

      data = genData(10);
      wrapper.setProps({ data });
      expect(wrapper.find('li').length < data.length).toBeTruthy();
    });

    it('virtual to raw', () => {
      let data = genData(10);
      const wrapper = genList({ itemHeight: 20, height: 100, data });
      expect(wrapper.find('li').length < data.length).toBeTruthy();

      data = data.slice(0, 2);
      wrapper.setProps({ data });
      expect(wrapper.find('li')).toHaveLength(2);

      // Should not crash if data count change
      data = data.slice(0, 1);
      wrapper.setProps({ data });
      expect(wrapper.find('li')).toHaveLength(1);
    });
  });

  it('`virtual` is false', () => {
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), virtual: false });
    expect(wrapper.find('li')).toHaveLength(100);
  });

  it('Should not crash when height change makes virtual scroll to be raw scroll', () => {
    const wrapper = genList({ itemHeight: 20, height: 40, data: genData(3) });
    wrapper.setProps({ height: 1000 });
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
      const wrapper = genList({ itemHeight: 20, height: 40, data: genData(3) });
      wrapper.find('Filler').find('ResizeObserver').props().onResize({ offsetHeight: 0 });
      expect(collected).toBeFalsy();

      // Wait for collection
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      wrapper.find('Filler').find('ResizeObserver').props().onResize({ offsetHeight: 100 });
      expect(collected).toBeTruthy();
    });
  });

  it('innerProps', () => {
    const wrapper = genList({
      itemHeight: 20,
      height: 100,
      data: genData(100),
      virtual: false,
      innerProps: {
        role: 'listbox',
        id: `my_list`,
      },
    });

    expect(wrapper.find('div#my_list').prop('role')).toEqual('listbox');
  });

  it('nativeElement', () => {
    const ref = React.createRef();
    genList({ data: genData(1), ref });
    expect(ref.current.nativeElement instanceof Element).toBeTruthy();
  });
});
