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
 */
export function getLocationItem(scrollPtg: number, total: number): LocationItemResult {
  const measureTotal = total - 1;

  const itemIndex = Math.floor(scrollPtg * measureTotal);
  const itemTopPtg = itemIndex / measureTotal;
  const itemBottomPtg = (itemIndex + 1) / measureTotal;
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
