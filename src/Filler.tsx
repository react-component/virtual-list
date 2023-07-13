import * as React from 'react';
import ResizeObserver from 'rc-resize-observer';
import classNames from 'classnames';

export type InnerProps = Pick<React.HTMLAttributes<HTMLDivElement>, 'role' | 'id'>;

interface FillerProps {
  prefixCls?: string;
  /** Virtual filler height. Should be `count * itemMinHeight` */
  height: number;
  /** Set offset of visible items. Should be the top of start item position */
  offset?: number;

  horizontalScroll?: boolean;

  children: React.ReactNode;

  fillerOuterRef: React.MutableRefObject<HTMLDivElement>;

  onInnerResize?: () => void;

  innerProps?: InnerProps;

  onWidthChange: (width: number) => void;

  onScrollWidthChange: (scrollWidth: number) => void;
}

/**
 * Fill component to provided the scroll content real height.
 */
const Filler = React.forwardRef(
  (
    {
      height,
      offset,
      children,
      prefixCls,
      horizontalScroll,
      fillerOuterRef,
      onInnerResize,
      innerProps,
      onWidthChange,
      onScrollWidthChange,
    }: FillerProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    let outerStyle: React.CSSProperties = {};

    let innerStyle: React.CSSProperties = {
      display: horizontalScroll ? 'inline-flex' : 'flex',
      flexDirection: 'column',
    };

    if (offset !== undefined) {
      outerStyle = {
        height,
        position: 'relative',
        overflow: 'hidden',
      };

      innerStyle = {
        ...innerStyle,
        transform: `translateY(${offset}px)`,
      };
    }

    const outerContainer = (
      <div ref={fillerOuterRef} style={outerStyle}>
        <ResizeObserver
          onResize={({ offsetWidth, offsetHeight }) => {
            onScrollWidthChange(offsetWidth);
            if (offsetHeight && onInnerResize) {
              onInnerResize();
            }
          }}
        >
          <div
            style={innerStyle}
            className={classNames({
              [`${prefixCls}-holder-inner`]: prefixCls,
            })}
            ref={ref}
            {...innerProps}
          >
            {children}
          </div>
        </ResizeObserver>
      </div>
    );

    return horizontalScroll ? (
      <ResizeObserver
        onResize={({ offsetWidth }) => {
          onWidthChange(offsetWidth);
        }}
      >
        {outerContainer}
      </ResizeObserver>
    ) : (
      outerContainer
    );
  },
);

Filler.displayName = 'Filler';

export default Filler;
