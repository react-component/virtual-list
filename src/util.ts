import findDOMNode from 'rc-util/lib/Dom/findDOMNode';

interface LocationItemResult {
  /** Located item index */
  index: number;
  /** Current item display baseline related with current container baseline */
  offsetPtg: number;
}

/**
 * Get location item and its align percentage with the scroll percentage.
 * We should measure current scroll position to decide which item is the location item.
 * And then fill the top count and bottom count with the base of location item.
 *
 * `total` should be the real count instead of `total - 1` in calculation.
 */
function getLocationItem(scrollPtg: number, total: number): LocationItemResult {
  const itemIndex = Math.floor(scrollPtg * total);
  const itemTopPtg = itemIndex / total;
  const itemBottomPtg = (itemIndex + 1) / total;
  const itemOffsetPtg = (scrollPtg - itemTopPtg) / (itemBottomPtg - itemTopPtg);

  return {
    index: itemIndex,
    offsetPtg: itemOffsetPtg,
  };
}

export function getScrollPercentage({
  scrollTop,
  scrollHeight,
  clientHeight,
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): number {
  if (scrollHeight <= clientHeight) {
    return 0;
  }

  const scrollTopPtg = scrollTop / (scrollHeight - clientHeight);
  return scrollTopPtg;
}

export function getElementScrollPercentage(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }

  return getScrollPercentage(element);
}

/**
 * Get node `offsetHeight`. We prefer node is a dom element directly.
 * But if not provided, downgrade to `findDOMNode` to get the real dom element.
 */
export function getNodeHeight(node: HTMLElement) {
  if (!node) {
    return 0;
  }

  return findDOMNode(node).offsetHeight;
}

/**
 * Get display items start, end, located item index. This is pure math calculation
 */
export function getRangeIndex(scrollPtg: number, itemCount: number, visibleCount: number) {
  const { index, offsetPtg } = getLocationItem(scrollPtg, itemCount);

  const beforeCount = Math.ceil(scrollPtg * visibleCount);
  const afterCount = Math.ceil((1 - scrollPtg) * visibleCount);

  return {
    itemIndex: index,
    itemOffsetPtg: offsetPtg,
    startIndex: Math.max(0, index - beforeCount),
    endIndex: Math.min(itemCount - 1, index + afterCount),
  };
}

interface ItemTopConfig<T> {
  itemIndex: number;
  itemElementHeights: { [key: string]: number };
  startIndex: number;
  itemOffsetPtg: number;

  scrollTop: number;
  scrollPtg: number;
  clientHeight: number;

  getItemKey: (index: number) => string;
}

/**
 * Calculate virtual list start item top offset position.
 */
export function getStartItemTop({
  itemIndex,
  startIndex,
  itemOffsetPtg,
  itemElementHeights,
  scrollTop,
  scrollPtg,
  clientHeight,
  getItemKey,
}: ItemTopConfig) {
  // Calculate top visible item top offset
  const locatedItemHeight = itemElementHeights[getItemKey(itemIndex)] || 0;
  const locatedItemTop = scrollPtg * clientHeight;
  const locatedItemOffset = itemOffsetPtg * locatedItemHeight;
  const locatedItemMergedTop = scrollTop + locatedItemTop - locatedItemOffset;

  let startItemTop = locatedItemMergedTop;
  for (let index = itemIndex - 1; index >= startIndex; index -= 1) {
    startItemTop -= itemElementHeights[getItemKey(index)] || 0;
  }

  return startItemTop;
}
