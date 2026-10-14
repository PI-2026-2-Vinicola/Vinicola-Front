import type { AgritecWindow } from '../data/types';

export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const RISK_OPTIONS = [20, 30, 40] as const;

const pad = (n: number) => `${n}`.padStart(2, '0');

/** "01/10 a 31/12" */
export const formatWindow = (w: AgritecWindow) => `${pad(w.startDay)}/${pad(w.startMonth)} a ${pad(w.endDay)}/${pad(w.endMonth)}`;

/** Meses (1–12) tocados pela janela, inclusive quando ela atravessa a virada do ano (ex.: nov → fev). */
export function monthsCovered(w: AgritecWindow): number[] {
  if (w.startMonth === w.endMonth && w.endDay < w.startDay) return Array.from({ length: 12 }, (_, i) => i + 1);
  const months: number[] = [];
  let m = w.startMonth;
  for (let i = 0; i < 12; i++) {
    months.push(m);
    if (m === w.endMonth) break;
    m = m === 12 ? 1 : m + 1;
  }
  return months;
}

/** Janelas com risco até o limite escolhido (o Zarc publica faixas de 20%, 30% e 40%). */
export const filterByRisk = (windows: AgritecWindow[], maxRisk: number) => windows.filter((w) => w.risk === null || w.risk <= maxRisk);

/** "Safra 2026/2027" quando informada. */
export const formatHarvest = (w: AgritecWindow) => (w.harvestStart && w.harvestEnd ? `${w.harvestStart}/${w.harvestEnd}` : w.harvestStart ? `${w.harvestStart}` : '—');
