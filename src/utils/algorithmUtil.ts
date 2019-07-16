/**
 * Get index with specific start index one by one. e.g.
 * min: 3, max: 9, start: 6
 *
 * Return index is:
 * [0]: 6
 * [1]: 7
 * [2]: 5
 * [3]: 8
 * [4]: 4
 * [5]: 9
 * [6]: 3
 */
export function getIndexByStartLoc(min: number, max: number, start: number, index: number): number {
  const beforeCount = start - min;
  const afterCount = max - start;
  const balanceCount = Math.min(beforeCount, afterCount) * 2;

  // Balance
  if (index <= balanceCount) {
    const stepIndex = Math.floor(index / 2);
    if (index % 2) {
      return start + stepIndex + 1;
    }
    return start - stepIndex;
  }

  // One is out of range
  if (beforeCount > afterCount) {
    return start - (index - afterCount);
  }
  return start + (index - beforeCount);
}

/**
 * We assume that 2 list has only 1 item diff and others keeping the order.
 * So we can use dichotomy algorithm to find changed one.
 */
export function findListDiffIndex<T>(
  originList: T[],
  targetList: T[],
  getKey: (item: T) => string,
): number | null {
  if (originList.length === targetList.length) {
    return null;
  }

  let startIndex = 0;
  let endIndex = Math.max(originList.length, targetList.length) - 1;
  let midIndex = Math.floor((startIndex + endIndex) / 2);

  const keyCache: Map<T, string | { __EMPTY_ITEM__: true }> = new Map();

  function getCacheKey(item: T) {
    if (!keyCache.has(item)) {
      keyCache.set(item, item !== undefined ? getKey(item) : { __EMPTY_ITEM__: true });
    }
    return keyCache.get(item);
  }

  while (startIndex !== midIndex || midIndex !== endIndex) {
    const originMidKey = getCacheKey(originList[midIndex]);
    const targetMidKey = getCacheKey(targetList[midIndex]);

    if (originMidKey === targetMidKey) {
      startIndex = midIndex;
    } else {
      endIndex = midIndex;
    }

    // Check if there only 2 index left
    if (startIndex === endIndex - 1) {
      return getCacheKey(originList[startIndex]) !== getCacheKey(targetList[startIndex])
        ? startIndex
        : endIndex;
    }

    midIndex = Math.floor((startIndex + endIndex) / 2);
  }

  return midIndex;
}
