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
    return mount(
      <div>
        <List component="ul" itemKey="id" {...props}>
          {({ id }) => <li>{id}</li>}
        </List>
      </div>,
    );
  }

  describe('raw', () => {
    it('without height', () => {
      const wrapper = genList({ data: genData(1) });
      expect(wrapper.find(Filler).props().offset).toBeFalsy();
    });

    it('height over itemHeight', () => {
      const wrapper = genList({ data: genData(1), itemHeight: 1, height: 999 });

      expect(wrapper.find(Filler).props().offset).toBeFalsy();
    });
  });

  describe('virtual', () => {
    let scrollTop = 0;

    const mockElement = spyElementPrototypes(HTMLElement, {
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
  });

  describe('scrollTo', () => {
    const listRef = React.createRef();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });

    it('value scroll', () => {
      listRef.current.scrollTo(903);
      expect(wrapper.find('ul').instance().scrollTop).toEqual(903);
    });
  });
});
