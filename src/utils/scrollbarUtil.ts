const MIN_SIZE = 20;

export function getSpinSize(containerSize = 0, scrollRange = 0) {
  let baseSize = (containerSize / scrollRange) * 100;
  if (isNaN(baseSize)) {
    baseSize = 0;
  }
  baseSize = Math.max(baseSize, MIN_SIZE);
  baseSize = Math.min(baseSize, containerSize / 2);
  return Math.floor(baseSize);
}
