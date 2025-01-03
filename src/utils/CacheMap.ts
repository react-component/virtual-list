import type React from 'react';

// Firefox has low performance of map.
class CacheMap {
  maps: Record<string, number>;

  // Used for cache key
  // `useMemo` no need to update if `id` not change
  id: number = 0;

  diffKeys = new Set<React.Key>();

  constructor() {
    this.maps = Object.create(null);
  }

  set(key: React.Key, value: number) {
    this.maps[key as string] = value;
    this.id += 1;
    this.diffKeys.add(key as string);
  }

  get(key: React.Key) {
    return this.maps[key as string];
  }

  /**
   * CacheMap will record the key changed.
   * To help to know what's update in the next render.
   */
  resetRecord() {
    this.diffKeys.clear();
  }

  getRecord() {
    return this.diffKeys;
  }
}

export default CacheMap;
