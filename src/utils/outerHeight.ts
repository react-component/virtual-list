const isFF = typeof navigator === 'object' && /Firefox/i.test(navigator.userAgent);

/**
 * To get exact height to avoid scrolling deviation
 */
export const getOuterHeight = (el: HTMLElement) => {
  let height = el.offsetHeight;
  const computedStyle = window.getComputedStyle(el); 
  height += parseInt(computedStyle.marginTop, 10);
  height += parseInt(computedStyle.marginBottom, 10);
  height += parseInt(computedStyle.borderTopWidth, 10);
  height += parseInt(computedStyle.borderBottomWidth, 10);
  return height;
}
