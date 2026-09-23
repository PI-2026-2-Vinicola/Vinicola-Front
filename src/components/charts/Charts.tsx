import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { QUALITY_COLOR, QUALITY_LABEL, QUALITY_ORDER } from '../../data/labels';
import type { Quality } from '../../data/types';
import type { DayBucket, QualityCount } from '../../lib/stats';
import { barValueLabels, crosshair, INK } from './setup';
import './setup';

const QUALITY_ICONS = { boa: CircleCheck, atencao: TriangleAlert, critica: OctagonAlert } as const;

export function QualityLegend({ counts }: { counts?: QualityCount }) {
  return (
    <>
      {QUALITY_ORDER.map((q) => {
        const Icon = QUALITY_ICONS[q];
        return (
          <span key={q}>
            <i style={{ background: QUALITY_COLOR[q] }} />
            <Icon aria-hidden="true" style={{ color: QUALITY_COLOR[q] }} />
            {QUALITY_LABEL[q]}
            {counts && <strong style={{ color: INK.primary, fontWeight: 600 }}>{counts[q].toLocaleString('pt-BR')}</strong>}
          </span>
        );
      })}
    </>
  );
}

const baseScales = {
  x: {
    grid: { display: false },
    border: { color: INK.axis },
    ticks: { maxRotation: 0, autoSkipPadding: 14, color: INK.muted },
  },
  y: {
    beginAtZero: true,
    grid: { color: INK.grid },
    border: { display: false },
    ticks: { precision: 0, color: INK.muted, padding: 8 },
  },
} as const;

/** Análises por período — colunas empilhadas por qualidade (cores de status). */
export function AnalysesByDayChart({ days }: { days: DayBucket[] }) {
  return (
    <Bar
      data={{
        labels: days.map((d) => d.label),
        datasets: QUALITY_ORDER.map((q) => ({
          label: QUALITY_LABEL[q],
          data: days.map((d) => d[q]),
          backgroundColor: QUALITY_COLOR[q],
          borderColor: INK.surface,
          borderWidth: { top: 2, bottom: 0, left: 0, right: 0 },
          borderRadius: q === 'critica' ? { topLeft: 4, topRight: 4 } : 0,
          borderSkipped: false,
          maxBarThickness: 22,
          stack: 'q',
        })),
      }}
      options={{
        interaction: { mode: 'index', intersect: false },
        scales: { x: { ...baseScales.x, stacked: true }, y: { ...baseScales.y, stacked: true } },
        plugins: {
          tooltip: {
            callbacks: {
              footer: (items) => `Total: ${items.reduce((s, i) => s + (i.raw as number), 0)}`,
            },
          },
        },
      }}
    />
  );
}

/** Distribuição de qualidade — rosca com % de "Boa" no centro. */
export function QualityDonut({ counts, size = 'md' }: { counts: QualityCount; size?: 'sm' | 'md' }) {
  const pct = counts.total ? Math.round((counts.boa / counts.total) * 100) : 0;
  return (
    <div className="donut-wrap">
      <Doughnut
        data={{
          labels: QUALITY_ORDER.map((q) => QUALITY_LABEL[q]),
          datasets: [
            {
              data: QUALITY_ORDER.map((q) => counts[q]),
              backgroundColor: QUALITY_ORDER.map((q) => QUALITY_COLOR[q]),
              borderColor: INK.surface,
              borderWidth: 3,
              borderRadius: 4,
              hoverOffset: 6,
            },
          ],
        }}
        options={{
          cutout: '74%',
          plugins: {
            tooltip: {
              callbacks: {
                label: (i) => ` ${i.label}: ${(i.raw as number).toLocaleString('pt-BR')} (${counts.total ? Math.round(((i.raw as number) / counts.total) * 100) : 0}%)`,
              },
            },
          },
        }}
      />
      <div className={`donut-center ${size}`}>
        <strong>{pct}%</strong>
        <span>classificadas como Boa</span>
      </div>
    </div>
  );
}

/** Barras horizontais de uma única série (uma cor) com valor na ponta. */
export function HorizontalBars({ labels, values, color = '#a3325a', tooltipLabel = 'Análises' }: { labels: string[]; values: number[]; color?: string; tooltipLabel?: string }) {
  const max = Math.max(1, ...values);
  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: tooltipLabel,
            data: values,
            backgroundColor: color,
            hoverBackgroundColor: color,
            borderRadius: 4,
            borderSkipped: 'start',
            maxBarThickness: 20,
            categoryPercentage: 0.7,
          },
        ],
      }}
      plugins={[barValueLabels]}
      options={{
        indexAxis: 'y',
        layout: { padding: { right: 40 } },
        scales: {
          x: { beginAtZero: true, suggestedMax: max * 1.08, grid: { color: INK.grid }, border: { display: false }, ticks: { precision: 0, color: INK.muted } },
          y: { grid: { display: false }, border: { color: INK.axis }, ticks: { color: INK.secondary, font: { size: 12.5, weight: 500 } } },
        },
      }}
    />
  );
}

/** Evolução das classificações (% por dia) — três linhas de status. */
export function QualityEvolutionChart({ days }: { days: DayBucket[] }) {
  const series = (q: Quality) => days.map((d) => (d.total ? Math.round((d[q] / d.total) * 1000) / 10 : null));
  return (
    <Line
      data={{
        labels: days.map((d) => d.label),
        datasets: QUALITY_ORDER.map((q) => ({
          label: QUALITY_LABEL[q],
          data: series(q),
          borderColor: QUALITY_COLOR[q],
          backgroundColor: q === 'boa' ? 'rgba(31,157,85,0.08)' : QUALITY_COLOR[q],
          fill: q === 'boa' ? 'origin' : false,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: INK.surface,
          pointBackgroundColor: QUALITY_COLOR[q],
          spanGaps: true,
        })),
      }}
      plugins={[crosshair]}
      options={{
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: baseScales.x,
          y: { ...baseScales.y, max: 100, ticks: { ...baseScales.y.ticks, callback: (v) => `${v}%`, stepSize: 25 } },
        },
        plugins: { tooltip: { callbacks: { label: (i) => ` ${i.dataset.label}: ${i.formattedValue}%` } } },
      }}
    />
  );
}

/** Volume diário de análises — linha única com área suave. */
export function VolumeLineChart({ days, color = '#a3325a' }: { days: DayBucket[]; color?: string }) {
  return (
    <Line
      data={{
        labels: days.map((d) => d.label),
        datasets: [
          {
            label: 'Análises',
            data: days.map((d) => d.total),
            borderColor: color,
            backgroundColor: `${color}1a`,
            fill: 'origin',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 2,
            pointHoverBorderColor: INK.surface,
            pointBackgroundColor: color,
          },
        ],
      }}
      plugins={[crosshair]}
      options={{ interaction: { mode: 'index', intersect: false }, scales: baseScales }}
    />
  );
}

/** Linhas por série categórica (ex.: análises por variedade ao longo do tempo). */
export function MultiLineChart({ labels, series }: { labels: string[]; series: { label: string; color: string; data: number[] }[] }) {
  return (
    <Line
      data={{
        labels,
        datasets: series.map((s) => ({
          label: s.label,
          data: s.data,
          borderColor: s.color,
          backgroundColor: s.color,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: INK.surface,
        })),
      }}
      plugins={[crosshair]}
      options={{ interaction: { mode: 'index', intersect: false }, scales: baseScales }}
    />
  );
}
