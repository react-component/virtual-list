export type RenderFunc<T> = (
  item: T,
  index: number,
  props: { style: React.CSSProperties; offsetX: number },
) => React.ReactNode;

export interface SharedConfig<T> {
  getKey: (item: T) => React.Key;
}

export type GetKey<T> = (item: T) => React.Key;

export type GetSize = (startKey: React.Key, endKey?: React.Key) => { top: number; bottom: number };

export interface ExtraRenderInfo {
  /** Virtual list start line */
  start: number;
  /** Virtual list end line */
  end: number;
  /** Is current in virtual render */
  virtual: boolean;
  /**
   * Horizontal scroll offset applied to rendered items when `scrollWidth` is set.
   * 当设置 `scrollWidth` 时，应用到已渲染元素上的横向滚动偏移量。
   */
  offsetX: number;
  /**
   * Current vertical scrollTop of the holder element.
   * holder 元素当前真实的纵向 `scrollTop`，表示视口滚动到了哪里。
   */
  scrollTop: number;
  /**
   * Vertical translate offset of the rendered filler content.
   * 已渲染 filler 内容的纵向 `translateY` 偏移量，表示这一段内容被平移到虚拟列表中的哪个位置。
   */
  offsetY: number;

  rtl: boolean;

  getSize: GetSize;
}
