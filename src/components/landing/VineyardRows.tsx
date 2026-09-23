/** Linhas do vinhedo em perspectiva — elemento decorativo dos heros. */
export function VineyardRows({ className }: { className?: string }) {
  const vx = 720;
  const vy = 0;
  const rows = Array.from({ length: 23 }, (_, i) => -660 + i * 120);
  return (
    <svg className={className} viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="rows-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0b9cb" stopOpacity="0" />
          <stop offset="1" stopColor="#f0b9cb" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {rows.map((x, i) => (
        <g key={i}>
          <line x1={vx} y1={vy} x2={x + 720} y2={420} stroke="url(#rows-fade)" strokeWidth="1.2" />
          {Array.from({ length: 7 }, (_, k) => {
            const t = 0.3 + k * 0.11;
            const px = vx + (x + 720 - vx) * t;
            const py = vy + 420 * t;
            return <circle key={k} cx={px} cy={py} r={1 + t * 2.4} fill="#f0b9cb" opacity={t * 0.55} />;
          })}
        </g>
      ))}
    </svg>
  );
}
