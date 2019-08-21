import React from 'react';
import { mount } from 'enzyme';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, id) => ({ id }));
}

describe('List.Scroll', () => {
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

  describe('scrollTo number', () => {
    const listRef = React.createRef();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });

    it('value scroll', () => {
      listRef.current.scrollTo(903);
      expect(wrapper.find('ul').instance().scrollTop).toEqual(903);
    });
  });

  describe('scrollTo item index', () => {
    let mockElement;
    let scrollTop = 0;

    beforeAll(() => {
      mockElement = spyElementPrototypes(HTMLElement, {
        offsetHeight: {
          get: () => 20,
        },
        clientHeight: {
          get: () => 100,
        },
        scrollHeight: {
          get: () => 400,
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

    function testPlots(type, props) {
      describe(`${type} list`, () => {
        let listRef;

        beforeEach(() => {
          listRef = React.createRef();
          genList({ itemHeight: 20, height: 100, data: genData(20), ref: listRef, ...props });
        });

        it('top', () => {
          listRef.current.scrollTo({ index: 10, align: 'top' });
          expect(scrollTop).toEqual(200);
        });
        it('bottom', () => {
          listRef.current.scrollTo({ index: 10, align: 'bottom' });
          expect(scrollTop).toEqual(120);
        });
        describe('auto', () => {
          it('upper of', () => {
            scrollTop = 210;
            listRef.current.onScroll();
            listRef.current.scrollTo({ index: 10, align: 'auto' });
            expect(scrollTop).toEqual(200);
          });
          it('lower of', () => {
            scrollTop = 110;
            listRef.current.onScroll();
            listRef.current.scrollTo({ index: 10, align: 'auto' });
            expect(scrollTop).toEqual(120);
          });
          it('in range', () => {
            scrollTop = 150;
            listRef.current.onScroll();
            listRef.current.scrollTo({ index: 10, align: 'auto' });
            expect(scrollTop).toEqual(150);
          });
        });
      });
    }

    testPlots('virtual list');
    testPlots('raw list', { itemHeight: null });
  });
});
