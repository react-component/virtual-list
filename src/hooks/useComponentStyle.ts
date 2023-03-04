import type { CSSProperties } from "react";

const ScrollHorizontalStyle: CSSProperties = {
  overflowX: 'auto',
  overflowAnchor: 'none',
};

const ScrollVerticalStyle: CSSProperties = {
  overflowY: 'auto',
  overflowAnchor: 'none',
};

const useComponentStyle = ({ isEnableVirtual, scrollMoving, isHorizontalMode, containerSize, fullSize }): CSSProperties | null => {
  let componentStyle: CSSProperties = null;
  const scrollStyle = isHorizontalMode ? ScrollHorizontalStyle : ScrollVerticalStyle;

  if (isHorizontalMode) {
    if (containerSize) {
      componentStyle = { [fullSize ? 'width' : 'maxWidth']: containerSize, ...scrollStyle };

      if (isEnableVirtual) {
        componentStyle = {
          ...componentStyle,
          overflowX: 'hidden',
        }

        if (scrollMoving) {
          componentStyle = {
            ...componentStyle,
            pointerEvents: 'none',
          }
        }
      }
    }
    /** In case of height to zone when there is no children */
    componentStyle = {
      ...componentStyle,
      minHeight: '100%'
    }
    return componentStyle;
  }

  if (containerSize) {
    componentStyle = { [fullSize ? 'height' : 'maxHeight']: containerSize, ...scrollStyle };

    if (isEnableVirtual) {
      componentStyle = {
        ...componentStyle,
        overflowY: 'hidden',
      }

      if (scrollMoving) {
        componentStyle = {
          ...componentStyle,
          pointerEvents: 'none',
        }
      }
    }
  }
  return componentStyle;
}

export default useComponentStyle;