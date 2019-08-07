import * as React from 'react';
import OriginList from './List';
import Filler from './Filler';

class List<T> extends OriginList<T> {
  componentDidUpdate() {
    // Do nothing since this is a mock!
  }

  render() {
    const {
      style,
      component: Component = 'div',
      height,
      itemHeight,
      data,
      children,
      itemKey,
      onSkipRender,
      ...restProps
    } = this.props;

    return (
      <Component style={{ ...style, height }} {...restProps}>
        <Filler height={height}>{this.renderChildren(data, 0, children)}</Filler>
      </Component>
    );
  }
}

export default List;
