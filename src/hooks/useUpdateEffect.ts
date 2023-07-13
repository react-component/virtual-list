import * as React from 'react';

const useUpdateEffect = (callback: () => void, conditions?: React.DependencyList) => {
  const mountRef = React.useRef(false);

  React.useEffect(() => {
    if (mountRef.current) {
      callback();
    } else {
      mountRef.current = true;
    }
  }, conditions);
};

export default useUpdateEffect;
