import React from 'react';
import { mount } from 'enzyme';
import List from '../src';
import Filler from '../src/Filler';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, id) => ({ id }));
}

describe('List', () => {
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

    it('scroll', () => {
      // scroll to top
      scrollTop = 0;
      const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
      expect(wrapper.find(Filler).props().height).toEqual(2000);
      expect(wrapper.find(Filler).props().offset).toEqual(0);

      // scrollTop to end
      scrollTop = 2000 - 100;
      wrapper.find('ul').simulate('scroll', {
        scrollTop,
      });
      expect(wrapper.find(Filler).props().height).toEqual(2000);
      expect(wrapper.find(Filler).props().offset + wrapper.find('li').length * 20).toEqual(2000);
    });

    it('render out of view', () => {
      scrollTop = 0;
      let data = genData(20);
      const onSkipRender = jest.fn();
      const wrapper = genList({ itemHeight: 20, height: 100, disabled: true, data, onSkipRender });

      data = [{ id: 'beforeAll' }, ...data];
      wrapper.setProps({ data });
      expect(onSkipRender).not.toHaveBeenCalled();

      wrapper.setProps({ disabled: false });
      data = [...data, { id: 'afterAll' }];
      wrapper.setProps({ data, disabled: true });
      expect(onSkipRender).toHaveBeenCalled();
    });

    it('should rerender rows when current height > previous height', () => {
      scrollTop = 0;
      const data = genData(100);
      const wrapper = genList({ itemHeight: 20, height: 100, data, virtual: true });

      wrapper.setProps({ height: 200 });
      wrapper.update();
      expect(wrapper.find('li').length).toEqual(11);
    });
  });

  describe('status switch', () => {
    let scrollTop = 0;
    let scrollHeight = 0;

    let mockLiElement;
    let mockElement;

    beforeAll(() => {
      mockLiElement = spyElementPrototypes(HTMLLIElement, {
        offsetHeight: {
          get: () => 40,
        },
      });

      mockElement = spyElementPrototypes(HTMLElement, {
        scrollHeight: {
          get: () => scrollHeight,
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
      mockLiElement.mockRestore();
    });

    it('raw to virtual', () => {
      let data = genData(5);
      const wrapper = genList({ itemHeight: 20, height: 100, data });

      scrollHeight = 200;
      scrollTop = 40;
      wrapper.find('ul').simulate('scroll', {
        scrollTop,
      });

      scrollHeight = 120;
      data = [...data, { id: 'afterAll' }];
      wrapper.setProps({ data });
      expect(wrapper.find('ul').instance().scrollTop < 10).toBeTruthy();
    });

    it('virtual to raw', done => {
      let data = genData(6);
      const wrapper = genList({ itemHeight: 20, height: 100, data });

      scrollHeight = 120;
      scrollTop = 10;
      wrapper.find('ul').simulate('scroll', {
        scrollTop,
      });

      scrollHeight = 200;
      data = data.slice(0, 2);
      wrapper.setProps({ data });
      expect(wrapper.find('ul').instance().scrollTop > 40).toBeTruthy();

      // Should not crash if data count change
      scrollHeight = 40;
      data = data.slice(0, 1);
      wrapper.setProps({ data });

      setTimeout(done, 50);
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
});
