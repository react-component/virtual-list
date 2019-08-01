import * as React from 'react';
import Filler from './Filler';
import {
  getElementScrollPercentage,
  getScrollPercentage,
  getNodeHeight,
  getRangeIndex,
  getItemAbsoluteTop,
  GHOST_ITEM_KEY,
  getItemRelativeTop,
  getCompareItemRelativeTop,
  alignScrollTop,
} from './utils/itemUtil';
import { getIndexByStartLoc, findListDiffIndex } from './utils/algorithmUtil';

const ScrollStyle = {
  overflowY: 'auto',
  overflowAnchor: 'none',
};

type RenderFunc<T> = (
  item: T,
  index: number,
  props: { style: React.CSSProperties },
) => React.ReactNode;

const ITEM_SCALE_RATE = 1;

export interface RelativeScroll {
  itemIndex: number;
  relativeTop: number;
}

export interface ScrollInfo {
  scrollTop: number;
  startItemTop: number;
  startIndex: number;
}

export interface ListProps<T> extends React.HTMLAttributes<any> {
  children: RenderFunc<T>;
  data: T[];
  height?: number;
  itemHeight?: number;
  itemKey: string;
  component?: string | React.FC<any> | React.ComponentClass<any>;
  disabled?: boolean;
}

interface ListState<T> {
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
   * We cache in the state since if `data` length change,
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
class List<T> extends React.Component<ListProps<T>, ListState<T>> {
  static defaultProps = {
    itemHeight: 15,
    data: [],
  };

  state: ListState<T> = {
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
   * Always point to the latest props if `disabled` is `false`
   */
  cachedProps: Partial<ListProps<T>>;

  /**
   * Lock scroll process with `onScroll` event.
   * This is used for `data` length change and `scrollTop` restore
   */
  lockScroll: boolean = false;

  constructor(props: ListProps<T>) {
    super(props);

    this.cachedProps = props;
  }

  /**
   * Phase 1: Initial should sync with default scroll top
   */
  public componentDidMount() {
    if (this.listRef.current) {
      this.listRef.current.scrollTop = 0;
      this.onScroll();
    }
  }

  /**
   * Phase 4: Record used item height
   * Phase 5: Trigger re-render to use correct position
   */
  public componentDidUpdate() {
    const { status } = this.state;
    const { data, height, itemHeight, disabled } = this.props;
    const prevData: T[] = this.cachedProps.data || [];

    if (disabled || !this.listRef.current) {
      return;
    }

    if (status === 'MEASURE_START') {
      const { startIndex, itemIndex, itemOffsetPtg } = this.state;
      const { scrollTop } = this.listRef.current;

      // Record here since measure item height will get warning in `render`
      this.collectItemHeights();

      // Calculate top visible item top offset
      const locatedItemTop = getItemAbsoluteTop({
        itemIndex,
        itemOffsetPtg,
        itemElementHeights: this.itemElementHeights,
        scrollTop,
        scrollPtg: getElementScrollPercentage(this.listRef.current),
        clientHeight: this.listRef.current.clientHeight,
        getItemKey: this.getIndexKey,
      });

      let startItemTop = locatedItemTop;
      for (let index = itemIndex - 1; index >= startIndex; index -= 1) {
        startItemTop -= this.itemElementHeights[this.getIndexKey(index)] || 0;
      }

      this.setState({
        status: 'MEASURE_DONE',
        startItemTop,
      });
    }

    /**
     * Re-calculate the item position since `data` length changed.
     * [IMPORTANT] We use relative position calculate here.
     */
    if (prevData.length !== data.length && height) {
      const {
        itemIndex: originItemIndex,
        itemOffsetPtg: originItemOffsetPtg,
        startIndex: originStartIndex,
        endIndex: originEndIndex,
        scrollTop: originScrollTop,
      } = this.state;

      // 1. Refresh item heights
      this.collectItemHeights();

      // 1. Get origin located item top
      const originLocatedItemRelativeTop = getItemRelativeTop({
        itemIndex: originItemIndex,
        itemOffsetPtg: originItemOffsetPtg,
        itemElementHeights: this.itemElementHeights,
        scrollPtg: getScrollPercentage({
          scrollTop: originScrollTop,
          scrollHeight: prevData.length * itemHeight,
          clientHeight: this.listRef.current.clientHeight,
        }),
        clientHeight: this.listRef.current.clientHeight,
        getItemKey: (index: number) => this.getIndexKey(index, this.cachedProps),
      });

      // 2. Find the compare item
      const changedItemIndex: number = findListDiffIndex(prevData, data, this.getItemKey);
      let originCompareItemIndex = changedItemIndex - 1;
      // Use next one since there are not more item before removed
      if (originCompareItemIndex < 0) {
        originCompareItemIndex = 0;
      }

      // 3. Find the compare item top
      const originCompareItemTop = getCompareItemRelativeTop({
        locatedItemRelativeTop: originLocatedItemRelativeTop,
        locatedItemIndex: originItemIndex,
        compareItemIndex: originCompareItemIndex,
        startIndex: originStartIndex,
        endIndex: originEndIndex,
        getItemKey: (index: number) => this.getIndexKey(index, this.cachedProps),
        itemElementHeights: this.itemElementHeights,
      });

      this.internalScrollTo({
        itemIndex: originCompareItemIndex,
        relativeTop: originCompareItemTop,
      });
    }

    this.cachedProps = this.props;
  }

  /**
   * Phase 2: Trigger render since we should re-calculate current position.
   */
  public onScroll = () => {
    const { data, height, itemHeight, disabled } = this.props;

    const { scrollTop: originScrollTop, clientHeight, scrollHeight } = this.listRef.current;
    const scrollTop = alignScrollTop(originScrollTop, scrollHeight - clientHeight);

    // Skip if `scrollTop` not change to avoid shake
    if (scrollTop === this.state.scrollTop || this.lockScroll || disabled) {
      return;
    }

    const scrollPtg = getElementScrollPercentage(this.listRef.current);
    const visibleCount = Math.ceil(height / itemHeight);

    const { itemIndex, itemOffsetPtg, startIndex, endIndex } = getRangeIndex(
      scrollPtg,
      data.length,
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

  public getIndexKey = (index: number, props?: Partial<ListProps<T>>) => {
    const mergedProps = props || this.props;
    const { data = [] } = mergedProps;

    // Return ghost key as latest index item
    if (index === data.length) {
      return GHOST_ITEM_KEY;
    }

    const item = data[index];
    if (!item) {
      /* istanbul ignore next */
      console.error('Not find index item. Please report this since it is a bug.');
    }

    return this.getItemKey(item, mergedProps);
  };

  public getItemKey = (item: T, props?: Partial<ListProps<T>>) => {
    const { itemKey } = props || this.props;
    return item ? item[itemKey] : null;
  };

  /**
   * Collect current rendered dom element item heights
   */
  public collectItemHeights = () => {
    const { startIndex, endIndex } = this.state;

    // Record here since measure item height will get warning in `render`
    for (let index = startIndex; index <= endIndex; index += 1) {
      const eleKey = this.getIndexKey(index);
      this.itemElementHeights[eleKey] = getNodeHeight(this.itemElements[eleKey]);
    }
  };

  public scrollTo(scrollTop: number) {
    this.listRef.current.scrollTop = scrollTop;
  }

  public internalScrollTo(relativeScroll: RelativeScroll): void {
    const { itemIndex: compareItemIndex, relativeTop: compareItemRelativeTop } = relativeScroll;
    const { scrollTop: originScrollTop } = this.state;
    const { data, itemHeight, height } = this.props;

    // 1. Find the best match compare item top
    let bestSimilarity = Number.MAX_VALUE;
    let bestScrollTop: number = null;
    let bestItemIndex: number = null;
    let bestItemOffsetPtg: number = null;
    let bestStartIndex: number = null;
    let bestEndIndex: number = null;

    let missSimilarity = 0;

    const scrollHeight = data.length * itemHeight;
    const { clientHeight } = this.listRef.current;
    const maxScrollTop = scrollHeight - clientHeight;

    for (let i = 0; i < maxScrollTop; i += 1) {
      const scrollTop = getIndexByStartLoc(0, maxScrollTop, originScrollTop, i);

      const scrollPtg = getScrollPercentage({ scrollTop, scrollHeight, clientHeight });
      const visibleCount = Math.ceil(height / itemHeight);

      const { itemIndex, itemOffsetPtg, startIndex, endIndex } = getRangeIndex(
        scrollPtg,
        data.length,
        visibleCount,
      );

      // No need to check if compare item out of the index to save performance
      if (startIndex <= compareItemIndex && compareItemIndex <= endIndex) {
        // 1.1 Get measure located item relative top
        const locatedItemRelativeTop = getItemRelativeTop({
          itemIndex,
          itemOffsetPtg,
          itemElementHeights: this.itemElementHeights,
          scrollPtg,
          clientHeight,
          getItemKey: this.getIndexKey,
        });

        const compareItemTop = getCompareItemRelativeTop({
          locatedItemRelativeTop,
          locatedItemIndex: itemIndex,
          compareItemIndex, // Same as origin index
          startIndex,
          endIndex,
          getItemKey: this.getIndexKey,
          itemElementHeights: this.itemElementHeights,
        });

        // 1.2 Find best match compare item top
        const similarity = Math.abs(compareItemTop - compareItemRelativeTop);
        if (similarity < bestSimilarity) {
          bestSimilarity = similarity;
          bestScrollTop = scrollTop;
          bestItemIndex = itemIndex;
          bestItemOffsetPtg = itemOffsetPtg;
          bestStartIndex = startIndex;
          bestEndIndex = endIndex;

          missSimilarity = 0;
        } else {
          missSimilarity += 1;
        }
      }

      // If keeping 10 times not match similarity,
      // check more scrollTop is meaningless.
      // Here boundary is set to 10.
      if (missSimilarity > 10) {
        break;
      }
    }

    // 2. Re-scroll if has best scroll match
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

  /**
   * Phase 4: Render item and get all the visible items height
   */
  public renderChildren = (list: T[], startIndex: number, renderFunc: RenderFunc<T>) => {
    const { status } = this.state;
    // We should measure rendered item height
    return list.map((item, index) => {
      const eleIndex = startIndex + index;
      const node = renderFunc(item, eleIndex, {
        style: status === 'MEASURE_START' ? { visibility: 'hidden' } : {},
      }) as React.ReactElement;
      const eleKey = this.getIndexKey(eleIndex);

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
      data,
      children,
      itemKey,
      ...restProps
    } = this.props;

    // Render pure list if not set height or height is enough for all items
    if (typeof height !== 'number' || data.length * itemHeight <= height) {
      return (
        <Component style={height ? { ...style, height, ...ScrollStyle } : style} {...restProps}>
          <Filler height={height}>{this.renderChildren(data, 0, children)}</Filler>
        </Component>
      );
    }

    // Use virtual list
    const mergedStyle = {
      ...style,
      height,
      ...ScrollStyle,
    };

    const { status, startIndex, endIndex, startItemTop } = this.state;
    const contentHeight = data.length * itemHeight * ITEM_SCALE_RATE;

    return (
      <Component style={mergedStyle} {...restProps} onScroll={this.onScroll} ref={this.listRef}>
        <Filler height={contentHeight} offset={status === 'MEASURE_DONE' ? startItemTop : 0}>
          {this.renderChildren(data.slice(startIndex, endIndex + 1), startIndex, children)}
        </Filler>
      </Component>
    );
  }
}

export default List;
