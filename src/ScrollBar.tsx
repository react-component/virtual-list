import * as React from 'react';
import raf from 'rc-util/lib/raf';

const MIN_SIZE = 20;

export interface ScrollBarProps {
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
}

export default class ScrollBar extends React.Component<ScrollBarProps, ScrollBarState> {
  moveRaf: number = null;

  state: ScrollBarState = {
    dragging: false,
    pageY: null,
    startTop: null,
  };

  componentWillUnmount() {
    this.removeEvents();
  }

  patchEvents = () => {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  };

  removeEvents = () => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    raf.cancel(this.moveRaf);
  };

  onMouseDown: React.MouseEventHandler = e => {
    this.setState({
      dragging: true,
      pageY: e.pageY,
      startTop: this.getTop(),
    });

    this.patchEvents();
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
    const spinHeight = this.getSpinHeight();
    const top = this.getTop();

    return (
      <div
        style={{
          width: 10,
          top: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          background: 'rgba(0, 0, 0, 0.1)',
          // display: 'none',
        }}
      >
        <div
          style={{
            width: 10,
            height: spinHeight,
            top,
            right: 0,
            position: 'absolute',
            background: '#000',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onMouseDown={this.onMouseDown}
        />
      </div>
    );
  }
}
