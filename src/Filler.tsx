import ResizeObserver from 'rc-resize-observer';
import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import type { OnResize } from 'rc-resize-observer';
import type { ReactNode, CSSProperties } from 'react';

export type IInnerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'id'>;

interface FillerProps {
  prefixCls?: string;
  isHorizontalMode: boolean;
  isVirtualMode: boolean;
  /** Virtual filler width or height. Should be `count * (itemMinWidth or itemMinHeight)` */
  scrollSize: number;
  /** Set offset of visible items. Should be the left or top  of start item position */
  offset?: number;

  children: ReactNode;

  innerProps?: IInnerProps;

  onInnerResize?: () => void;
}

/**
 * Fill component to provided the scroll content real height.
 */
const Filler = forwardRef(
  (
    {
      isHorizontalMode,
      isVirtualMode,
      scrollSize,
      offset,
      children,
      prefixCls,
      onInnerResize,
      innerProps,
    }: FillerProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    let outerStyle: CSSProperties = {};

    let innerStyle: CSSProperties = {
      display: 'flex',
      flexDirection: isHorizontalMode ? 'row' : 'column',
    };

    useLayoutEffect(() => {
      if (isHorizontalMode && isVirtualMode && wrapperRef.current) {
        const innerHeight = (wrapperRef.current.firstElementChild as HTMLDivElement).offsetHeight;
        wrapperRef.current.style.height = `${innerHeight}px`;
      }
    }, [isHorizontalMode, isVirtualMode, wrapperRef]);

    const handleResize: OnResize = useCallback(
      (params) => {
        const { offsetWidth, offsetHeight } = params;
        if (offsetWidth && offsetHeight && onInnerResize) {
          onInnerResize();
        }
      },
      [onInnerResize],
    );

    if (offset === undefined && isHorizontalMode) {
      outerStyle = {
        width: 'fit-content',
      };
    }

    if (offset !== undefined) {
      outerStyle = {
        position: 'relative',
        [isHorizontalMode ? 'width' : 'height']: scrollSize,
        overflow: 'hidden',
      };

      innerStyle = {
        ...innerStyle,
        transform: `${isHorizontalMode ? `translateX(${offset}px` : `translateY(${offset}px`}`,
        position: 'absolute',
        ...(isHorizontalMode
          ? {
              top: 0,
              bottom: 0,
              left: 0,
              height: 'fit-content',
            }
          : {
              left: 0,
              right: 0,
              top: 0,
            }),
      };
    }

    if (isVirtualMode) {
      // padding for scroll bar, in case of stack.
      outerStyle = {
        ...outerStyle,
        [isHorizontalMode ? 'marginBottom' : 'marginRight']: '8px',
      };
    }

    innerStyle = {
      ...(innerProps?.style || {}), // custom style
      ...innerStyle,
    };

    const outClassName = `${prefixCls ? `${prefixCls}-holder-outer` : 'holder-outer'}`;
    const innerClassName = `${prefixCls ? `${prefixCls}-holder-inner` : 'holder-inner'}`;

    return (
      <div className={outClassName} style={outerStyle} ref={wrapperRef}>
        <ResizeObserver onResize={handleResize}>
          <div {...innerProps} style={innerStyle} className={innerClassName} ref={ref}>
            {children}
          </div>
        </ResizeObserver>
      </div>
    );
  },
);

Filler.displayName = 'Filler';

export default Filler;
