import { useRef } from 'react';

export default function useInRange(
  scrollHeight: number,
  containerHeight: number,
): (scrollTop: number) => number {
  const scrollHeightRef = useRef<number>();
  const containerHeightRef = useRef<number>();

  scrollHeightRef.current = scrollHeight;
  containerHeightRef.current = containerHeight;

  return (scrollTop: number) => {
    let newTop = Math.max(scrollTop, 0);
    const min = scrollHeightRef.current - containerHeightRef.current;
    if (!Number.isNaN(min)) {
      newTop = Math.min(newTop, min);
    }
    return newTop;
  };
}
