import React from 'react';
import { mount } from 'enzyme';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.Scroll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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
      jest.runAllTimers();
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

    function testPlots(type, scrollConfig, props) {
      describe(`${type} list`, () => {
        let listRef;
        let wrapper;
        const onScroll = jest.fn();

        beforeEach(() => {
          onScroll.mockReset();
          listRef = React.createRef();
          wrapper = genList({
            itemHeight: 20,
            height: 100,
            data: genData(20),
            className: 'list',
            ref: listRef,
            onScroll,
            ...props,
          });
        });

        it('not crash', () => {
          listRef.current.scrollTo({ ...scrollConfig, align: 'top' });
          wrapper.unmount();
          jest.runAllTimers();
        });

        it('top', () => {
          listRef.current.scrollTo({ ...scrollConfig, align: 'top' });
          jest.runAllTimers();
          expect(scrollTop).toEqual(200);
        });
        it('bottom', () => {
          listRef.current.scrollTo({ ...scrollConfig, align: 'bottom' });
          jest.runAllTimers();
          expect(scrollTop).toEqual(120);
        });
        describe('auto', () => {
          it('upper of', () => {
            scrollTop = 210;
            wrapper
              .find('.list')
              .last()
              .simulate('scroll');
            expect(onScroll).toHaveBeenCalled();
            listRef.current.scrollTo({ ...scrollConfig, align: 'auto' });
            jest.runAllTimers();
            expect(scrollTop).toEqual(200);
          });
          it('lower of', () => {
            scrollTop = 110;
            wrapper
              .find('.list')
              .last()
              .simulate('scroll');
            expect(onScroll).toHaveBeenCalled();
            listRef.current.scrollTo({ ...scrollConfig, align: 'auto' });
            jest.runAllTimers();
            expect(scrollTop).toEqual(120);
          });
          it('in range', () => {
            scrollTop = 150;
            wrapper
              .find('.list')
              .last()
              .simulate('scroll');
            expect(onScroll).toHaveBeenCalled();
            listRef.current.scrollTo({ ...scrollConfig, align: 'auto' });
            jest.runAllTimers();
            expect(scrollTop).toEqual(150);
          });
        });
      });
    }

    testPlots('virtual list', { index: 10 });
    testPlots('raw list', { index: 10 }, { itemHeight: null });
    testPlots('virtual list by key', { key: '10' });
    testPlots('raw list by key', { key: '10' }, { itemHeight: null });
  });
});
