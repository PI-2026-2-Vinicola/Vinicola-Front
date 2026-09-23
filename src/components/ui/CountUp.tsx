import { useCountUp } from '../../hooks/useCountUp';
import { useInView } from '../../hooks/useInView';

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function CountUp({ value, decimals = 0, suffix = '', prefix = '', duration }: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.3 });
  const current = useCountUp(value, inView, duration);
  const text = current.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} aria-label={`${prefix}${value.toLocaleString('pt-BR', { maximumFractionDigits: decimals })}${suffix}`}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
