export const STABLE = 0;
export const MEASURE = 1;

/** When calling the method scorllTo, if the corresponding node does not have a cache height needs to be calculated  */
export type ScrollToCacheState = typeof STABLE | typeof MEASURE;
