import type React from 'react';

// Firefox has low performance of map.
class CacheMap {
  maps: Record<string, number>;

  // Used for cache key
  // `useMemo` no need to update if `id` not change
  id: number = 0;

  constructor() {
    this.maps = Object.create(null);
  }

  set(key: React.Key, value: number) {
    this.maps[key] = value;
    this.id += 1;
  }

  get(key: React.Key) {
    return this.maps[key];
  }
}

export default CacheMap;
