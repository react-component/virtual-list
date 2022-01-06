import { useLayoutEffect, useEffect } from 'react';

/**
 *  useIsomorphicEffect should be used in replacement of useLayoutEffect
 *  since when useLayoutEffect runs on server rendered apps, a warning message gets logged
 *  that clutters server logs, with the use of useIsomorphicEffect, useLayoutEffect
 *  would only be used when runnning on clinet and would fall back to useEffect otherwise (server run)
 *  refer : https://reactjs.org/link/uselayouteffect-ssr
 */

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
