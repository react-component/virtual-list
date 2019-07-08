import * as React from 'react';
import { findDOMNode } from 'react-dom';
import Filler from './Filler';
import { getLocationItem, getScrollPercentage } from './util';

type RenderFunc<T> = (item: T) => React.ReactNode;

export interface ListProps<T> extends React.HTMLAttributes<any> {
  children: RenderFunc<T>;
  dataSource: T[];
  height?: number;
  itemHeight?: number;
  component?: string | React.FC<any> | React.ComponentClass<any>;
}

interface ListState {
  status: 'NONE' | 'MEASURE_START' | 'MEASURE_DONE';

  itemIndex: number;
  itemOffsetPtg: number;
  startIndex: number;
  endIndex: number;
}

/**
 * We use class component here since typescript can not support generic in function component
 *
 * Virtual list display logic:
 * 1. scroll / initialize trigger measure
 * 2. Get location item of current `scrollTop`
 * 3. [Render] Render visible items
 * 4. Get all the visible items height
 * 5. [Render] Update top item `margin-top` to fit the position
 */
class List<T> extends React.Component<ListProps<T>, ListState> {
  static defaultProps = {
    itemHeight: 15,
    dataSource: [],
  };

  state: ListState = {
    status: 'NONE',
    itemIndex: 0,
    itemOffsetPtg: 0,
    startIndex: 0,
    endIndex: 0,
  };

  listRef = React.createRef<HTMLElement>();

  itemElements: { [index: number]: HTMLElement } = {};

  /**
   * Initial should sync with default scroll top
   */
  public componentDidMount() {
    this.listRef.current.scrollTop = 0;
    this.onScroll();
  }

  public componentDidUpdate() {
    const { status, startIndex, endIndex } = this.state;
    if (status === 'MEASURE_START') {
      const heightList: number[] = [];
      for (let index = startIndex; index <= endIndex; index += 1) {
        const element: HTMLElement = this.itemElements[index];
        heightList[index] =
          'offsetHeight' in element
            ? element.offsetHeight
            : (findDOMNode(element) as HTMLElement).offsetHeight;
      }
      this.setState({ status: 'MEASURE_DONE' });
    }
  }

  /**
   * Phase 2: Trigger render since we should re-calculate current position.
   */
  public onScroll = () => {
    const { dataSource, height, itemHeight } = this.props;

    const scrollTopPtg = getScrollPercentage(this.listRef.current);
    const { index, offsetPtg } = getLocationItem(scrollTopPtg, dataSource.length);
    const visibleCount = Math.ceil(height / itemHeight);

    const beforeCount = Math.ceil(scrollTopPtg * visibleCount);
    const afterCount = Math.ceil((1 - scrollTopPtg) * visibleCount);

    this.setState({
      status: 'MEASURE_START',
      itemIndex: index,
      itemOffsetPtg: offsetPtg,
      startIndex: Math.max(0, index - beforeCount),
      endIndex: Math.min(dataSource.length - 1, index + afterCount),
    });
  };

  public renderChildren = (list: T[], renderFunc: RenderFunc<T>) =>
    // We should measure rendered item height
     list.map((item, index) => {
      const node = renderFunc(item) as React.ReactElement;

      // Pass `key` and `ref` for internal measure
      return React.cloneElement(node, {
        key: index,
        ref: (ele: HTMLElement) => {
          this.itemElements[index] = ele;
        },
      });
    })
  ;

  public render() {
    const {
      style,
      component: Component = 'div',
      height,
      itemHeight,
      dataSource,
      children,
      ...restProps
    } = this.props;

    // Render pure list if not set height
    if (height === undefined) {
      return (
        <Component style={style} {...restProps}>
          {this.renderChildren(dataSource, children)}
        </Component>
      );
    }

    const { itemIndex, startIndex, endIndex } = this.state;

    const contentHeight = dataSource.length * itemHeight;

    return (
      <Component
        style={{
          ...style,
          height,
          overflowY: 'auto',
        }}
        {...restProps}
        onScroll={this.onScroll}
        ref={this.listRef}
      >
        <Filler height={contentHeight}>
          {this.renderChildren(dataSource.slice(startIndex, endIndex + 1), children)}
        </Filler>
      </Component>
    );
  }
}

export default List;
