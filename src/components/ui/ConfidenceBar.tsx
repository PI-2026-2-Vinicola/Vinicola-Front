import { formatPct } from '../../lib/format';

export function ConfidenceBar({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <div className={`confidence ${large ? 'confidence-lg' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label="Confiança da IA">
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="confidence-value">{formatPct(value)}</span>
    </div>
  );
}
