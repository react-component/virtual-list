import * as React from 'react';
import Filler from './Filler';
import {
  getElementScrollPercentage,
  getScrollPercentage,
  getNodeHeight,
  getRangeIndex,
  getItemTop,
  GHOST_ITEM_KEY,
  OriginValues,
  TargetValues,
  getSimilarity,
} from './util';

type RenderFunc<T> = (item: T) => React.ReactNode;

const ITEM_SCALE_RATE = 1;

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
  /** Located item index */
  itemIndex: number;
  /** Located item bind its height percentage with the `scrollTop` */
  itemOffsetPtg: number;
  startIndex: number;
  endIndex: number;
  /**
   * Calculated by `scrollTop`.
   * We cache in the state since if `dataSource` length change,
   * we need revert back to the located item index.
   */
  startItemTop: number;
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
 *
 * Algorithm:
 * We split scroll bar into equal slice. An item with whatever height occupy the same range slice.
 * When `scrollTop` change,
 * it will calculate the item percentage position and move item to the position.
 * Then calculate other item position base on the located item.
 *
 * Concept:
 *
 * # located item
 * The base position item which other items position calculate base on.
 */
class List<T> extends React.Component<ListProps<T>, ListState> {
  static defaultProps = {
    itemHeight: 15,
    dataSource: [],
  };

  state: ListState = {
    status: 'NONE',
    scrollTop: null,
    itemIndex: 0,
    itemOffsetPtg: 0,
    startIndex: 0,
    endIndex: 0,
    startItemTop: 0,
  };

  listRef = React.createRef<HTMLElement>();

  itemElements: { [index: number]: HTMLElement } = {};

  itemElementHeights: { [index: number]: number } = {};

  /**
   * Lock scroll process with `onScroll` event.
   * This is used for `dataSource` length change and `scrollTop` restore
   */
  lockScroll: boolean = false;

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
  public componentDidUpdate(prevProps: ListProps<T>) {
    const { status } = this.state;
    const { dataSource, height, itemHeight } = this.props;

    if (status === 'MEASURE_START') {
      const { startIndex, endIndex, itemIndex, itemOffsetPtg } = this.state;

      // Record here since measure item height will get warning in `render`
      for (let index = startIndex; index <= endIndex; index += 1) {
        const eleKey = this.getItemKey(index);
        this.itemElementHeights[eleKey] = getNodeHeight(this.itemElements[eleKey]);
      }

      // Calculate top visible item top offset
      const locatedItemTop = getItemTop({
        itemIndex,
        itemOffsetPtg,
        itemElementHeights: this.itemElementHeights,
        scrollTop: this.listRef.current.scrollTop,
        scrollPtg: getElementScrollPercentage(this.listRef.current),
        clientHeight: this.listRef.current.clientHeight,
        getItemKey: this.getItemKey,
      });

      let startItemTop = locatedItemTop;
      for (let index = itemIndex - 1; index >= startIndex; index -= 1) {
        startItemTop -= this.itemElementHeights[this.getItemKey(index)] || 0;
      }

      this.setState({ status: 'MEASURE_DONE', startItemTop });
    }

    // TODO: If is add node
    // Re-calculate the scroll position align with the current visible item position
    if (prevProps.dataSource.length !== dataSource.length && height) {
      /**
       * When an item removed,
       * we should know the item (called as compare item) before the removed item position.
       * After loop re-calculation, we need keep the compare item position not change.
       */
      // Find removed item key
      const removedItemIndex: number = prevProps.dataSource.findIndex((_, index) => {
        const key = this.getItemKey(index, prevProps);
        return dataSource.every((__, nextIndex) => key !== this.getItemKey(nextIndex));
      });

      // We use the item before removed item as base compare position to enhance the accuracy
      const compareItemIndex = removedItemIndex - 1;
      const compareItemKey = this.getItemKey(compareItemIndex, prevProps);

      const { startIndex: originStartIndex, itemIndex: originItemIndex } = this.state;
      let compareItemTop = this.state.startItemTop;
      for (let index = originStartIndex; index <= originItemIndex; index += 1) {
        const key = this.getItemKey(index, prevProps);
        if (key === compareItemKey) {
          break;
        }

        compareItemTop += this.itemElementHeights[key] || 0;
      }

      // Loop to generate compared item top and find best one
      const { scrollHeight, clientHeight } = this.listRef.current;
      const maxScrollTop = scrollHeight - clientHeight;

      let bestScrollTop: number = null;
      let bestSimilarity: number = Number.MAX_VALUE;
      let bestItemIndex = 0;
      let bestItemOffsetPtg = 0;
      let bestStartIndex = 0;
      let bestEndIndex = 0;

      for (let scrollTop = 0; scrollTop < maxScrollTop; scrollTop += 1) {
        const scrollPtg = getScrollPercentage({ scrollTop, scrollHeight, clientHeight });
        const visibleCount = Math.ceil(height / itemHeight);

        const { itemIndex, itemOffsetPtg, startIndex, endIndex } = getRangeIndex(
          scrollPtg,
          dataSource.length,
          visibleCount,
        );

        let locatedItemTop = getItemTop({
          itemIndex,
          itemOffsetPtg,
          itemElementHeights: this.itemElementHeights,
          scrollTop: this.listRef.current.scrollTop,
          scrollPtg,
          clientHeight: this.listRef.current.clientHeight,
          getItemKey: this.getItemKey,
        });

        let newCompareItemTop: number = null;
        for (let index = itemIndex; index >= startIndex; index -= 1) {
          const key = this.getItemKey(index);
          if (key === compareItemKey) {
            newCompareItemTop = locatedItemTop;
            break;
          }

          if (index <= 0) {
            break;
          }

          const prevItemKey = this.getItemKey(index - 1);
          locatedItemTop -= this.itemElementHeights[prevItemKey] || 0;
        }

        if (newCompareItemTop !== null) {
          const similarity = Math.abs(newCompareItemTop - compareItemTop);
          if (similarity < bestSimilarity) {
            bestScrollTop = scrollTop;
            bestSimilarity = similarity;
            bestItemIndex = itemIndex;
            bestItemOffsetPtg = itemOffsetPtg;
            bestStartIndex = startIndex;
            bestEndIndex = endIndex;
          }
        }
      }

      // Update `scrollTop` to new calculated position
      console.log('DONE:', bestScrollTop);
      if (bestScrollTop !== null) {
        this.lockScroll = true;
        this.listRef.current.scrollTop = bestScrollTop;

        this.setState({
          status: 'MEASURE_START',
          scrollTop: bestScrollTop,
          itemIndex: bestItemIndex,
          itemOffsetPtg: bestItemOffsetPtg,
          startIndex: bestStartIndex,
          endIndex: bestEndIndex,
        });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.lockScroll = false;
          });
        });
      }
    }
  }

  /**
   * Phase 2: Trigger render since we should re-calculate current position.
   */
  public onScroll = () => {
    const { dataSource, height, itemHeight } = this.props;

    const { scrollTop } = this.listRef.current;

    // Skip if `scrollTop` not change to avoid shake
    if (scrollTop === this.state.scrollTop || this.lockScroll) {
      return;
    }

    const scrollPtg = getElementScrollPercentage(this.listRef.current);
    const visibleCount = Math.ceil(height / itemHeight);

    const { itemIndex, itemOffsetPtg, startIndex, endIndex } = getRangeIndex(
      scrollPtg,
      dataSource.length,
      visibleCount,
    );

    this.setState({
      status: 'MEASURE_START',
      scrollTop,
      itemIndex,
      itemOffsetPtg,
      startIndex,
      endIndex,
    });
  };

  public getItemKey = (index: number, props?: ListProps<T>) => {
    const { dataSource, itemKey } = props || this.props;

    // Return ghost key as latest index item
    if (index === dataSource.length) {
      return GHOST_ITEM_KEY;
    }

    const item = dataSource[index];
    if (!item) {
      console.error('Not find index item. Please report this since it is a bug.');
    }
    return item && itemKey ? item[itemKey] : index;
  };

  /**
   * Phase 4: Render item and get all the visible items height
   */
  public renderChildren = (list: T[], startIndex: number, renderFunc: RenderFunc<T>) =>
    // We should measure rendered item height
    list.map((item, index) => {
      const node = renderFunc(item) as React.ReactElement;
      const eleIndex = startIndex + index;
      const eleKey = this.getItemKey(eleIndex);

      // Pass `key` and `ref` for internal measure
      return React.cloneElement(node, {
        key: eleKey,
        ref: (ele: HTMLElement) => {
          this.itemElements[eleKey] = ele;
        },
      });
    });

  public render() {
    const {
      style,
      component: Component = 'div',
      height,
      itemHeight,
      dataSource,
      children,
      itemKey,
      ...restProps
    } = this.props;

    const mergedStyle = {
      ...style,
      height,
      overflowY: 'auto',
      overflowAnchor: 'none',
    };

    // Render pure list if not set height or height is enough for all items
    if (height === undefined || dataSource.length * itemHeight <= height) {
      return (
        <Component style={mergedStyle} {...restProps}>
          <Filler height={height}>{this.renderChildren(dataSource, 0, children)}</Filler>
        </Component>
      );
    }

    const { status, startIndex, endIndex, startItemTop } = this.state;
    const contentHeight = dataSource.length * itemHeight * ITEM_SCALE_RATE;

    return (
      <Component style={mergedStyle} {...restProps} onScroll={this.onScroll} ref={this.listRef}>
        <Filler height={contentHeight} offset={status === 'MEASURE_DONE' ? startItemTop : 0}>
          {this.renderChildren(dataSource.slice(startIndex, endIndex + 1), startIndex, children)}
        </Filler>
      </Component>
    );
  }
}

export default List;
