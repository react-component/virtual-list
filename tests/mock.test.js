import React from 'react';
import { mount } from 'enzyme';
import MockList from '../src/mock';
import Filler from '../src/Filler';

describe('MockList', () => {
  it('correct render', () => {
    const wrapper = mount(
      <MockList data={[0, 1, 2]} itemKey={id => id}>
        {id => <span>{id}</span>}
      </MockList>,
    );

    expect(wrapper.find(Filler).length).toBeTruthy();

    for (let i = 0; i < 3; i += 1) {
      expect(
        wrapper
          .find('span')
          .at(i)
          .key(),
      ).toBe(String(i));
    }
  });

  it('do not trigger `onSkipRender`', () => {
    const onSkipRender = jest.fn();
    const wrapper = mount(
      <MockList data={[0]} itemKey={id => id}>
        {id => <span>{id}</span>}
      </MockList>,
    );

    wrapper.setProps({ data: [0, 1] });
    expect(onSkipRender).not.toHaveBeenCalled();
  });
});
