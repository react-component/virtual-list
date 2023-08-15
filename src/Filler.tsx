import * as React from 'react';
import ResizeObserver from 'rc-resize-observer';
import classNames from 'classnames';

export type InnerProps = Pick<React.HTMLAttributes<HTMLDivElement>, 'role' | 'id'>;

interface FillerProps {
  prefixCls?: string;
  /** Virtual filler height. Should be `count * itemMinHeight` */
  height: number;
  /** Set offsetY of visible items. Should be the top of start item position */
  offsetY?: number;

  offsetX: number;

  scrollWidth?: number;

  children: React.ReactNode;

  onInnerResize?: () => void;

  innerProps?: InnerProps;

  onWidthChange: (width: number) => void;
}

/**
 * Fill component to provided the scroll content real height.
 */
const Filler = React.forwardRef(
  (
    {
      height,
      offsetY,
      offsetX,
      children,
      prefixCls,
      scrollWidth,
      onInnerResize,
      innerProps,
      onWidthChange,
    }: FillerProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    let outerStyle: React.CSSProperties = {};

    let innerStyle: React.CSSProperties = {
      display: scrollWidth !== undefined ? 'inline-flex' : 'flex',
      flexDirection: 'column',
    };

    if (offsetY !== undefined) {
      outerStyle = {
        height,
        position: 'relative',
        overflow: 'hidden',
      };
    }

    innerStyle = {
      ...innerStyle,
      transform: `translate(-${offsetX}px, ${offsetY || 0}px)`,
    };

    const outerContainer = (
      <div style={outerStyle}>
        <ResizeObserver
          onResize={({ offsetHeight }) => {
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

    return scrollWidth !== undefined ? (
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
