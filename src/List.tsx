import * as React from 'react';
import Filler from './Filler';
import { getLocationItem, getScrollPercentage, getNodeHeight } from './util';

type RenderFunc<T> = (item: T) => React.ReactNode;

export interface ListProps<T> extends React.HTMLAttributes<any> {
  children: RenderFunc<T>;
  dataSource: T[];
  height?: number;
  itemHeight?: number;
  itemKey?: string;
  component?: string | React.FC<any> | React.ComponentClass<any>;
}

interface ListState {
  status: 'NONE' | 'MEASURE_START' | 'MEASURE_DONE';

  scrollTop: number | null;
  scrollPtg: number;
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
    scrollTop: null,
    scrollPtg: 0,
    itemIndex: 0,
    itemOffsetPtg: 0,
    startIndex: 0,
    endIndex: 0,
  };

  listRef = React.createRef<HTMLElement>();

  itemElements: { [index: number]: HTMLElement } = {};

  itemElementHeights: { [index: number]: number } = {};

  /**
   * Phase 1: Initial should sync with default scroll top
   */
  public componentDidMount() {
    this.listRef.current.scrollTop = 0;
    this.onScroll();
  }

  /**
   * Phase 4: Record used item height
   * Phase 5: Trigger re-render to use correct position
   */
  public componentDidUpdate() {
    const { status, startIndex, endIndex } = this.state;
    const { dataSource, itemKey } = this.props;

    if (status === 'MEASURE_START') {
      // Record here since measure item height will get warning in `render`
      for (let index = startIndex; index <= endIndex; index += 1) {
        const item = dataSource[index];
        const eleKey = itemKey ? item[itemKey] : index;
        this.itemElementHeights[index] = getNodeHeight(this.itemElements[eleKey]);
      }

      this.setState({ status: 'MEASURE_DONE' });
    }
  }

  public getItemHeight = (index: number) => this.itemElementHeights[index] || 0;

  /**
   * Phase 2: Trigger render since we should re-calculate current position.
   */
  public onScroll = () => {
    const { dataSource, height, itemHeight } = this.props;

    const { scrollTop } = this.listRef.current;

    // Skip if `scrollTop` not change to avoid shake
    if (scrollTop === this.state.scrollTop) {
      return;
    }

    const scrollPtg = getScrollPercentage(this.listRef.current);

    const { index, offsetPtg } = getLocationItem(scrollPtg, dataSource.length);
    const visibleCount = Math.ceil(height / itemHeight);

    const beforeCount = Math.ceil(scrollPtg * visibleCount);
    const afterCount = Math.ceil((1 - scrollPtg) * visibleCount);

    this.setState({
      status: 'MEASURE_START',
      scrollTop,
      scrollPtg,
      itemIndex: index,
      itemOffsetPtg: offsetPtg,
      startIndex: Math.max(0, index - beforeCount),
      endIndex: Math.min(dataSource.length - 1, index + afterCount),
    });
  };

  /**
   * Phase 4: Render item and get all the visible items height
   */
  public renderChildren = (list: T[], startIndex: number, renderFunc: RenderFunc<T>) => {
    const { itemKey } = this.props;
    // We should measure rendered item height
    return list.map((item, index) => {
      const node = renderFunc(item) as React.ReactElement;
      const eleIndex = startIndex + index;
      const eleKey = itemKey ? item[itemKey] : eleIndex;

      // Pass `key` and `ref` for internal measure
      return React.cloneElement(node, {
        key: eleKey,
        ref: (ele: HTMLElement) => {
          this.itemElements[eleKey] = ele;
        },
      });
    });
  };

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
          {this.renderChildren(dataSource, 0, children)}
        </Component>
      );
    }

    const { status, startIndex, endIndex, itemIndex, itemOffsetPtg, scrollPtg } = this.state;

    const contentHeight = dataSource.length * itemHeight;

    // TODO: refactor
    let startItemTop = 0;
    if (status === 'MEASURE_DONE') {
      const locatedItemHeight = this.getItemHeight(itemIndex);
      const locatedItemTop = scrollPtg * this.listRef.current.clientHeight;
      const locatedItemOffset = itemOffsetPtg * locatedItemHeight;
      const locatedItemMergedTop =
        this.listRef.current.scrollTop + locatedItemTop - locatedItemOffset;

      startItemTop = locatedItemMergedTop;
      for (let index = itemIndex - 1; index >= startIndex; index -= 1) {
        startItemTop -= this.getItemHeight(index);
      }
    }

    return (
      <Component
        style={{
          ...style,
          height,
          overflowY: 'auto',
          overflowAnchor: 'none',
        }}
        {...restProps}
        onScroll={this.onScroll}
        ref={this.listRef}
      >
        <Filler height={contentHeight} offset={status === 'MEASURE_DONE' ? startItemTop : 0}>
          {this.renderChildren(dataSource.slice(startIndex, endIndex + 1), startIndex, children)}
        </Filler>
      </Component>
    );
  }
}

export default List;
