import { useState, useEffect, useRef } from 'react';

export function useCountUp(end: number, duration: number = 800): number {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = prevEnd.current;
    prevEnd.current = end;

    if (start === end) {
      setValue(end);
      return;
    }

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration]);

  return value;
}
