import * as React from 'react';
import classNames from 'classnames';
import raf from 'rc-util/lib/raf';

const MIN_SIZE = 20;

export interface ScrollBarProps {
  prefixCls: string;
  scrollTop: number;
  scrollHeight: number;
  height: number;
  count: number;
  onScroll: (scrollTop: number) => void;
}

interface ScrollBarState {
  dragging: boolean;
  pageY: number;
  startTop: number;
  visible: boolean;
}

export default class ScrollBar extends React.Component<ScrollBarProps, ScrollBarState> {
  moveRaf: number = null;

  visibleTimeout: NodeJS.Timeout = null;

  state: ScrollBarState = {
    dragging: false,
    pageY: null,
    startTop: null,
    visible: false,
  };

  componentDidUpdate(prevProps: ScrollBarProps) {
    if (prevProps.scrollTop !== this.props.scrollTop) {
      this.delayHidden();
    }
  }

  componentWillUnmount() {
    this.removeEvents();
    clearTimeout(this.visibleTimeout);
  }

  delayHidden = () => {
    clearTimeout(this.visibleTimeout);

    this.setState({ visible: true });
    this.visibleTimeout = setTimeout(() => {
      this.setState({ visible: false });
    }, 2000);
  };

  patchEvents = () => {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  };

  removeEvents = () => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    raf.cancel(this.moveRaf);
  };

  onContainerMouseDown: React.MouseEventHandler = e => {
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseDown: React.MouseEventHandler = e => {
    this.setState({
      dragging: true,
      pageY: e.pageY,
      startTop: this.getTop(),
    });

    this.patchEvents();
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseMove = (e: MouseEvent) => {
    const { dragging, pageY, startTop } = this.state;
    const { onScroll } = this.props;

    raf.cancel(this.moveRaf);

    if (dragging) {
      const offsetY = e.pageY - pageY;
      const newTop = startTop + offsetY;

      const enableScrollRange = this.getEnableScrollRange();
      const enableHeightRange = this.getEnableHeightRange();

      const ptg = newTop / enableHeightRange;
      const newScrollTop = Math.ceil(ptg * enableScrollRange);
      this.moveRaf = raf(() => {
        onScroll(newScrollTop);
      });
    }
  };

  onMouseUp = () => {
    this.setState({ dragging: false });
    this.removeEvents();
  };

  getSpinHeight = () => {
    const { height, count } = this.props;
    let baseHeight = (height / count) * 10;
    baseHeight = Math.max(baseHeight, MIN_SIZE);
    baseHeight = Math.min(baseHeight, height / 2);
    return Math.floor(baseHeight);
  };

  getEnableScrollRange = () => {
    const { scrollHeight, height } = this.props;
    return scrollHeight - height;
  };

  getEnableHeightRange = () => {
    const { height } = this.props;
    const spinHeight = this.getSpinHeight();
    return height - spinHeight;
  };

  getTop = () => {
    const { scrollTop } = this.props;
    const enableScrollRange = this.getEnableScrollRange();
    const enableHeightRange = this.getEnableHeightRange();
    const ptg = scrollTop / enableScrollRange;
    return ptg * enableHeightRange;
  };

  render() {
    const { visible, dragging } = this.state;
    const { prefixCls } = this.props;
    const spinHeight = this.getSpinHeight();
    const top = this.getTop();

    return (
      <div
        className={`${prefixCls}-scrollbar`}
        style={{
          width: 8,
          top: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: visible ? null : 'none',
        }}
        onMouseDown={this.onContainerMouseDown}
        onMouseMove={this.delayHidden}
      >
        <div
          className={classNames(`${prefixCls}-scrollbar-thumb`, {
            [`${prefixCls}-scrollbar-thumb-moving`]: dragging,
          })}
          style={{
            width: '100%',
            height: spinHeight,
            top,
            left: 0,
            position: 'absolute',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 99,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onMouseDown={this.onMouseDown}
        />
      </div>
    );
  }
}
