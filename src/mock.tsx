import * as React from 'react';
import classNames from 'classnames';
import OriginList from './List';
import Filler from './Filler';

class List<T> extends OriginList<T> {
  componentDidUpdate() {
    // Do nothing since this is a mock!
  }

  scrollTo = () => {
    // Do nothing sine this is a mock!
  };

  render() {
    const {
      prefixCls,
      style,
      className,
      component: Component = 'div',
      height,
      itemHeight,
      data,
      children,
      itemKey,
      onSkipRender,
      ...restProps
    } = this.props;

    const mergedClassName = classNames(prefixCls, className);

    return (
      <Component style={{ ...style, height }} className={mergedClassName} {...restProps}>
        <Filler prefixCls={prefixCls} height={height}>
          {this.renderChildren(data, 0, children)}
        </Filler>
      </Component>
    );
  }
}

export default List;
