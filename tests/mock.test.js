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

    expect(wrapper.find('List')).toHaveLength(1);
  });
});
