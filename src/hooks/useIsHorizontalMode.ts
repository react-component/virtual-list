import { IDirection } from "../types";

const useIsHorizontalMode = (direction: IDirection) => {
  return direction === IDirection.Horizontal
};

export default useIsHorizontalMode;