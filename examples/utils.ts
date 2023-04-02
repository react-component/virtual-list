import { IDirection } from "../src/types";
import type { IItem } from "./Item";

export const mockData = (direction: IDirection, count = 100) => {
  const data: IItem[] = [];
  const base = direction === IDirection.Horizontal ? 120 : 30
  for (let i = 0; i < count; i += 1) {
    data.push({
      id: i,
      size: base + (i % 2 ? 70 : 0),
    });
  }
  return data
}