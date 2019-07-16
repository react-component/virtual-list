import React from 'react';
import { mount } from 'enzyme';
import List from '../src';
import { spyElementPrototypes } from './utils/domHook';

function genData(count) {
  return new Array(count).fill(null).map((_, id) => ({ id }));
}

/**
 * Usually used for animation
 */

describe('Diff', () => {
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

  describe('scroll', () => {
    expect.extend({
      inRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
          return {
            message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
            pass: true,
          };
        }
        return {
          message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
          pass: false,
        };
      },
    });

    function test(
      startScrollTop,
      originData,
      targetData,
      { targetScrollTop, beforeChange, afterChange } = {},
    ) {
      return new Promise(resolve => {
        // scroll to top
        const Demo = props => (
          <List component="ul" itemKey="id" itemHeight={20} height={100} {...props}>
            {({ id }) => <li>{id}</li>}
          </List>
        );

        const wrapper = mount(<Demo data={originData} />);

        scrollTop = startScrollTop;
        wrapper.find('ul').simulate('scroll', {
          scrollTop,
        });

        if (beforeChange) {
          beforeChange(wrapper);
        }

        // Remove one of item
        wrapper.setProps({ data: targetData });

        if (afterChange) {
          afterChange(wrapper);
        }

        const newScrollTop = wrapper.find('ul').instance().scrollTop;

        if (targetScrollTop) {
          expect(newScrollTop).toEqual(targetScrollTop);
        } else {
          // Accept 5px diff
          expect(newScrollTop).inRange(startScrollTop - 5, startScrollTop + 5);
        }

        // Lock check. You can remove this if refactor
        expect(wrapper.find(List).instance().lockScroll).toBeTruthy();

        // Wait 3 frame to check if scroll lock released
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              expect(wrapper.find(List).instance().lockScroll).toBeFalsy();
              resolve();
            });
          });
        });
      });
    }

    describe('remove', () => {
      it('scrollTop: 0', () => {
        const data = genData(100);
        const newData = [...data];
        newData.splice(0, 1);
        return test(0, data, newData);
      });

      it('top', () => {
        const data = genData(100);
        const newData = [...data];
        newData.splice(11, 1);
        return test(100, data, newData);
      });

      it('bottom', () => {
        const data = genData(100);
        const newData = [...data];
        newData.splice(99, 1);
        return test(1900, data, newData, { targetScrollTop: 1880 });
      });
    });

    describe('add', () => {
      const common = {
        beforeChange(wrapper) {
          wrapper.setProps({ disabled: true });
        },
        afterChange(wrapper) {
          wrapper.setProps({ disabled: false });
        },
      };

      it('scrollTop: 0', () => {
        const data = genData(100);
        const newData = [...data];
        newData.splice(0, 0, { id: 'bamboo' });
        return test(0, data, newData, {
          ...common,
        });
      });

      it('top', () => {
        const data = genData(100);
        const newData = [...data];
        newData.splice(11, 0, { id: 'bamboo' });
        return test(100, data, newData, {
          ...common,
        });
      });

      it('bottom', () => {
        const data = genData(100);
        const newData = [...data];
        newData.splice(99, 0, { id: 'bamboo' });
        return test(1900, data, newData, {
          ...common,
        });
      });
    });
  });
});
