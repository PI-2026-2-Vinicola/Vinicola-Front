import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { CountUp } from './CountUp';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  /** `null` = sem dados suficientes (exibe "—", nunca um valor inventado). */
  value: number | null;
  decimals?: number;
  suffix?: string;
  total?: string;
  foot?: ReactNode;
  /** Variação em relação ao período anterior. */
  delta?: number | null;
  /** `percent`: variação relativa; `points`: diferença em pontos percentuais. */
  deltaMode?: 'percent' | 'points';
  upIsGood?: boolean;
  accent?: 'wine' | 'good' | 'warn' | 'bad' | 'neutral';
  loading?: boolean;
}

export function KpiCard({ icon, label, value, decimals = 0, suffix, total, foot, delta, deltaMode = 'percent', upIsGood = true, accent = 'wine', loading = false }: KpiCardProps) {
  let deltaEl: ReactNode = null;
  if (delta !== undefined && delta !== null && Number.isFinite(delta)) {
    const flat = Math.abs(delta) < 0.0005;
    const up = delta > 0;
    const good = up === upIsGood;
    const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
    const amount = deltaMode === 'points' ? `${Math.abs(delta * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.` : `${Math.abs(delta * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
    deltaEl = (
      <span className={`delta ${flat ? 'neutral' : good ? 'up-good' : 'down-bad'}`} title="Comparado ao período anterior de mesma duração">
        <Icon aria-hidden="true" />
        {flat ? 'estável' : `${up ? '+' : '−'}${amount}`}
      </span>
    );
  }
  return (
    <div className={`card kpi kpi-${accent}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon">{icon}</span>
      </div>
      <div className="kpi-value">
        {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 72, height: 28 }} /> : value === null ? <span className="kpi-empty">—</span> : <CountUp value={value} decimals={decimals} suffix={suffix} />}
        {total && !loading && <small> / {total}</small>}
      </div>
      {(foot || deltaEl) && (
        <div className="kpi-foot">
          {deltaEl}
          {foot && <span>{foot}</span>}
        </div>
      )}
    </div>
  );
}
