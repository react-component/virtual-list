import type React from 'react';

// Firefox has low performance of map.
class CacheMap {
  maps: Record<string, number>;

  constructor() {
    this.maps = Object.create(null);
  }

  set(key: React.ReactText, value: number) {
    this.maps[key] = value;
  }

  get(key: React.ReactText) {
    return this.maps[key];
  }
}

export default CacheMap;
