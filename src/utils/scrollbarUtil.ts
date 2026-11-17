const MIN_SIZE = 20;

export function getScrollbarVisibility({
  scrollWidth,
  scrollHeight,
  containerWidth,
  containerHeight,
  viewportWidth,
  viewportHeight,
}: {
  scrollWidth?: number;
  scrollHeight: number;
  containerWidth: number;
  containerHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}) {
  // Start with the stable outer viewport. Once one scrollbar is needed, its
  // measured reduction to the holder can require the scrollbar on the other
  // axis. The direct overflow checks never use the reduced holder dimensions,
  // so the two decisions cannot toggle each other on and off.
  const hasVerticalContentOverflow = scrollHeight > containerHeight;
  const hasHorizontalContentOverflow = !!scrollWidth && scrollWidth > containerWidth;

  return {
    hasVerticalScrollBar:
      hasVerticalContentOverflow || (hasHorizontalContentOverflow && scrollHeight > viewportHeight),
    hasHorizontalScrollBar:
      hasHorizontalContentOverflow || (hasVerticalContentOverflow && scrollWidth > viewportWidth),
  };
}

export function getSpinSize(containerSize = 0, scrollRange = 0) {
  let baseSize = (containerSize / scrollRange) * containerSize;
  if (isNaN(baseSize)) {
    baseSize = 0;
  }
  baseSize = Math.max(baseSize, MIN_SIZE);
  return Math.floor(baseSize);
}
