import type React from 'react';

// Firefox has low performance of map.
class CacheMap {
  maps: Record<string, number>;

  // Used for cache key
  // `useMemo` no need to update if `id` not change
  id: number = 0;

  diffRecords = new Map<React.Key, number>();

  constructor() {
    this.maps = Object.create(null);
  }

  set(key: React.Key, value: number) {
    // Record prev value
    this.diffRecords.set(key, this.maps[key as string]);

    this.maps[key as string] = value;
    this.id += 1;
  }

  get(key: React.Key) {
    return this.maps[key as string];
  }

  /**
   * CacheMap will record the key changed.
   * To help to know what's update in the next render.
   */
  resetRecord() {
    this.diffRecords.clear();
  }

  getRecord() {
    return this.diffRecords;
  }
}

export default CacheMap;
