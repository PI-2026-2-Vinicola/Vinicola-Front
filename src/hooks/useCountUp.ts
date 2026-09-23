import { useEffect, useRef, useState } from 'react';

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Anima um número de 0 (ou do valor anterior) até `target`. */
export function useCountUp(target: number, start: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!start) return;
    if (reduceMotion()) {
      setValue(target);
      from.current = target;
      return;
    }
    const begin = performance.now();
    const initial = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - begin) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(initial + (target - initial) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return value;
}
