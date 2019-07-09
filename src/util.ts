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
export function getLocationItem(scrollPtg: number, total: number): LocationItemResult {
  const itemIndex = Math.floor(scrollPtg * total);
  const itemTopPtg = itemIndex / total;
  const itemBottomPtg = (itemIndex + 1) / total;
  const itemOffsetPtg = (scrollPtg - itemTopPtg) / (itemBottomPtg - itemTopPtg);

  return {
    index: itemIndex,
    offsetPtg: itemOffsetPtg,
  };
}

export function getScrollPercentage(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }

  const { scrollTop, scrollHeight, clientHeight } = element;
  const scrollTopPtg = scrollTop / (scrollHeight - clientHeight);
  return scrollTopPtg;
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
