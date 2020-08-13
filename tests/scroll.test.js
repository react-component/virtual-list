import React from 'react';
import { mount } from 'enzyme';
import { spyElementPrototypes } from './utils/domHook';
import List from '../src';

function genData(count) {
  return new Array(count).fill(null).map((_, index) => ({ id: String(index) }));
}

describe('List.Scroll', () => {
  let mockElement;

  beforeAll(() => {
    mockElement = spyElementPrototypes(HTMLElement, {
      offsetHeight: {
        get: () => 20,
      },
    });
  });

  afterAll(() => {
    mockElement.mockRestore();
  });

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

  describe('scroll to object', () => {
    const listRef = React.createRef();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100), ref: listRef });

    it('index scroll', () => {
      listRef.current.scrollTo({ index: 30, align: 'top' });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(600);
    });

    it('key scroll', () => {
      listRef.current.scrollTo({ key: '30', align: 'bottom' });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(520);
    });

    it('smart', () => {
      listRef.current.scrollTo(0);
      listRef.current.scrollTo({ index: 30 });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(520);

      listRef.current.scrollTo(800);
      listRef.current.scrollTo({ index: 30 });
      jest.runAllTimers();
      expect(wrapper.find('ul').instance().scrollTop).toEqual(600);
    });
  });

  it('inject wheel', () => {
    const preventDefault = jest.fn();
    const wrapper = genList({ itemHeight: 20, height: 100, data: genData(100) });
    const ulElement = wrapper.find('ul').instance();

    const wheelEvent = new Event('wheel');
    wheelEvent.preventDefault = preventDefault;
    ulElement.dispatchEvent(wheelEvent);

    expect(preventDefault).toHaveBeenCalled();
  });
});
