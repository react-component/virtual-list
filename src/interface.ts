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
  /** Horizontal scroll offset applied to rendered items when `scrollWidth` is set */
  offsetX: number;
  /** Current vertical scrollTop of the holder element */
  scrollTop: number;
  /** Vertical translate offset of the rendered filler content */
  offsetY: number;

  rtl: boolean;

  getSize: GetSize;
}
