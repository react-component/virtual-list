import * as React from 'react';

export const WheelLockContext = React.createContext<(lock: boolean) => void>(() => {});
