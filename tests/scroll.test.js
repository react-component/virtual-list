import React from 'react';
import { mount } from 'enzyme';
import List from '../src';

describe('List', () => {
  it('without height', () => {
    const wrapper = mount(<List data={[1]}>{id => <span>{id}</span>}</List>);
  });
});
