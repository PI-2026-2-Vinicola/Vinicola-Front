import { useId } from 'react';

/** Marca OSAIS: cacho de uva formado por pontos de dados + ondas de sinal do sensor. */
export function LogoMark({ className = 'brand-mark', light = false }: { className?: string; light?: boolean }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light ? '#ffffff' : '#c05478'} />
          <stop offset="1" stopColor={light ? '#f7d6e1' : '#6d1c3f'} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill={`url(#${id}-g)`} />
      <g fill={light ? '#6d1c3f' : '#fff'}>
        <circle cx="19" cy="21" r="4.4" />
        <circle cx="29" cy="21" r="4.4" />
        <circle cx="24" cy="29" r="4.4" />
        <circle cx="14.5" cy="29" r="3.6" opacity=".7" />
        <circle cx="33.5" cy="29" r="3.6" opacity=".7" />
        <circle cx="19.5" cy="36.5" r="3.6" opacity=".85" />
        <circle cx="28.5" cy="36.5" r="3.6" opacity=".85" />
      </g>
      <g fill="none" stroke={light ? '#6d1c3f' : '#fff'} strokeWidth="2" strokeLinecap="round">
        <path d="M24 16.5V11" />
        <path d="M29 9.5a7 7 0 0 1 4 4" opacity=".8" />
        <path d="M30.5 5.5a11.5 11.5 0 0 1 7 7" opacity=".5" />
      </g>
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="brand">
      <LogoMark light={light} />
      <span className="brand-text">
        OSAIS
        <small>Observação Agroambiental</small>
      </span>
    </span>
  );
}
