import type * as React from 'react';
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
  getKey: (item: T) => React.Key,
): { index: number; multiple: boolean } | null {
  const originLen = originList.length;
  const targetLen = targetList.length;

  let shortList: T[];
  let longList: T[];

  if (originLen === 0 && targetLen === 0) {
    return null;
  }

  if (originLen < targetLen) {
    shortList = originList;
    longList = targetList;
  } else {
    shortList = targetList;
    longList = originList;
  }

  const notExistKey = { __EMPTY_ITEM__: true };
  function getItemKey(item: T) {
    if (item !== undefined) {
      return getKey(item);
    }
    return notExistKey;
  }

  // Loop to find diff one
  let diffIndex: number = null;
  let multiple = Math.abs(originLen - targetLen) !== 1;
  for (let i = 0; i < longList.length; i += 1) {
    const shortKey = getItemKey(shortList[i]);
    const longKey = getItemKey(longList[i]);

    if (shortKey !== longKey) {
      diffIndex = i;
      multiple = multiple || shortKey !== getItemKey(longList[i + 1]);
      break;
    }
  }

  return diffIndex === null ? null : { index: diffIndex, multiple };
}

export function generateIndexesWithSticky(
  startIndex: number,
  endIndex: number,
  stickyIndexes: number[],
) {
  // 生成从 startIndex 到 endIndex 的范围数组
  const indexArray: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    indexArray.push(i);
  }

  // 添加 stickyIndexes 中不在范围内的索引
  stickyIndexes.forEach((index) => {
    if (index < startIndex || index > endIndex) {
      indexArray.push(index);
    }
  });

  // 返回排序后的结果以确保顺序正确
  indexArray.sort((a, b) => a - b);
  return indexArray;
}
