import { useRef } from 'react';

export default function useInRange(scrollHeight, containerHeight): (scrollTop: number) => number {
  const scrollHeightRef = useRef<number>();
  const containerHeightRef = useRef<number>();

  scrollHeightRef.current = scrollHeight;
  containerHeightRef.current = containerHeight;

  return (scrollTop: number) => {
    let newTop = Math.max(scrollTop, 0);
    newTop = Math.min(newTop, scrollHeightRef.current - containerHeightRef.current);
    return newTop;
  };
}
