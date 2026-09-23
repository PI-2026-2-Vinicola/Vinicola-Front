import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { CountUp } from './CountUp';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  total?: string;
  foot?: ReactNode;
  delta?: number | null;
  /** Se subir é bom (verde) ou ruim (vermelho). */
  upIsGood?: boolean;
  accent?: 'wine' | 'good' | 'warn' | 'bad';
}

const ACCENTS = {
  wine: { background: 'var(--rose-100)', color: 'var(--wine-600)' },
  good: { background: 'var(--good-bg)', color: 'var(--good-ink)' },
  warn: { background: 'var(--warn-bg)', color: 'var(--warn-ink)' },
  bad: { background: 'var(--bad-bg)', color: 'var(--bad-ink)' },
};

export function KpiCard({ icon, label, value, decimals = 0, suffix, total, foot, delta, upIsGood = true, accent = 'wine' }: KpiCardProps) {
  let deltaEl: ReactNode = null;
  if (delta !== undefined && delta !== null && Number.isFinite(delta)) {
    const up = delta >= 0;
    const good = up === upIsGood;
    const Icon = up ? TrendingUp : TrendingDown;
    deltaEl = (
      <span className={`delta ${Math.abs(delta) < 0.005 ? 'neutral' : good ? 'up-good' : 'down-bad'}`}>
        <Icon aria-hidden="true" />
        {up ? '+' : '−'}
        {Math.abs(delta * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
      </span>
    );
  }
  return (
    <div className="card kpi card-hover">
      <div className="kpi-icon" style={ACCENTS[accent]}>
        {icon}
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
        {total && <small> / {total}</small>}
      </div>
      {(foot || deltaEl) && (
        <div className="kpi-foot">
          {deltaEl}
          {foot}
        </div>
      )}
    </div>
  );
}
