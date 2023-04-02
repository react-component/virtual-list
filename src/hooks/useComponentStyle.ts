import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { IUseComponentStyle } from '../types';

const ScrollHorizontalStyle: CSSProperties = {
  overflowX: 'auto',
  overflowAnchor: 'none',
};

const ScrollVerticalStyle: CSSProperties = {
  overflowY: 'auto',
  overflowAnchor: 'none',
};

const useComponentStyle = ({
  isEnableVirtual,
  scrollMoving,
  isHorizontalMode,
  rawContainerSize,
  containerSize,
  isFullSize,
}: IUseComponentStyle): CSSProperties | null => {
  return useMemo(() => {
    let componentStyle: CSSProperties | null = null;
    const scrollStyle = isHorizontalMode ? ScrollHorizontalStyle : ScrollVerticalStyle;
    const size = typeof rawContainerSize === 'string' ? '100%' : containerSize;

    if (isHorizontalMode) {
      if (rawContainerSize) {
        componentStyle = {
          [isFullSize ? 'width' : 'maxWidth']: size,
          ...scrollStyle
        };

        if (isEnableVirtual) {
          componentStyle = {
            ...componentStyle,
            overflowX: 'hidden',
          };

          if (scrollMoving) {
            componentStyle = {
              ...componentStyle,
              pointerEvents: 'none',
            };
          }
        }
      }
      /** In case of height to zone when there is no children */
      componentStyle = {
        ...componentStyle,
        minHeight: '100%',
      };
      return componentStyle;
    }

    if (rawContainerSize) {
      componentStyle = {
        [isFullSize ? 'height' : 'maxHeight']: size,
        ...scrollStyle
      };

      if (isEnableVirtual) {
        componentStyle = {
          ...componentStyle,
          overflowY: 'hidden',
        };

        if (scrollMoving) {
          componentStyle = {
            ...componentStyle,
            pointerEvents: 'none',
          };
        }
      }
    }
    return componentStyle;
  }, [isEnableVirtual, scrollMoving, isHorizontalMode, rawContainerSize, containerSize, isFullSize]);
};

export default useComponentStyle;
