import type { Classification, Quality, Reading, VarietyId } from '../data/types';
import { dayKey, formatShortDate } from './format';

export type PeriodPreset = '1' | '7' | '14' | '30' | 'todos' | 'custom';

export interface ReadingFilters {
  varietyId: VarietyId | 'todas';
  sensorId: string | 'todos';
  quality: Quality | 'todas';
  classification: Classification | 'todas';
  period: PeriodPreset;
  from?: string;
  to?: string;
  search: string;
}

export const DEFAULT_FILTERS: ReadingFilters = {
  varietyId: 'todas',
  sensorId: 'todos',
  quality: 'todas',
  classification: 'todas',
  period: '30',
  search: '',
};

/** Intervalo [início, fim] em ms para um período. */
export function periodRange(filters: Pick<ReadingFilters, 'period' | 'from' | 'to'>, now = new Date()): [number, number] {
  const end = now.getTime();
  if (filters.period === 'todos') return [0, Infinity];
  if (filters.period === 'custom') {
    const start = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : 0;
    const stop = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : Infinity;
    return [start, stop];
  }
  const days = Number(filters.period);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return [start.getTime(), end];
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filterReadings(
  readings: Reading[],
  filters: Partial<ReadingFilters>,
  now = new Date(),
  varietyNames: Record<string, string> = {},
): Reading[] {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const [start, end] = periodRange(f, now);
  const term = normalize(f.search.trim());
  return readings.filter((r) => {
    const t = new Date(r.capturedAt).getTime();
    if (t < start || t > end) return false;
    if (f.varietyId !== 'todas' && r.varietyId !== f.varietyId) return false;
    if (f.sensorId !== 'todos' && r.sensorId !== f.sensorId) return false;
    if (f.quality !== 'todas' && r.quality !== f.quality) return false;
    if (f.classification !== 'todas' && r.classification !== f.classification) return false;
    if (term) {
      const haystack = normalize(
        [r.id, r.sensorId, r.block, r.location, varietyNames[r.varietyId] ?? r.varietyId, r.visualCondition, r.observations, r.classification].join(' '),
      );
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export interface QualityCount {
  boa: number;
  atencao: number;
  critica: number;
  total: number;
}

export function countByQuality(readings: Reading[]): QualityCount {
  const c: QualityCount = { boa: 0, atencao: 0, critica: 0, total: readings.length };
  for (const r of readings) c[r.quality] += 1;
  return c;
}

export const ratio = (part: number, total: number) => (total === 0 ? 0 : part / total);

export function avgConfidence(readings: Reading[]): number {
  if (readings.length === 0) return 0;
  return readings.reduce((s, r) => s + r.confidence, 0) / readings.length;
}

export function countBy<K extends string>(readings: Reading[], key: (r: Reading) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const r of readings) {
    const k = key(r);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export interface DayBucket extends QualityCount {
  key: string;
  label: string;
  avgConfidence: number;
}

/** Agrupa leituras por dia (inclui dias sem leituras) entre o início e o fim do período. */
export function groupByDay(readings: Reading[], startMs: number, endMs: number): DayBucket[] {
  const byKey = new Map<string, Reading[]>();
  for (const r of readings) {
    const k = dayKey(r.capturedAt);
    const list = byKey.get(k);
    if (list) list.push(r);
    else byKey.set(k, [r]);
  }
  const first =
    Number.isFinite(startMs) && startMs > 0
      ? new Date(startMs)
      : readings.length
        ? new Date(Math.min(...readings.map((r) => new Date(r.capturedAt).getTime())))
        : new Date();
  const last = Number.isFinite(endMs) ? new Date(endMs) : new Date();
  first.setHours(0, 0, 0, 0);
  const out: DayBucket[] = [];
  const cursor = new Date(first);
  let guard = 0;
  while (cursor.getTime() <= last.getTime() && guard < 400) {
    const k = dayKey(cursor);
    const list = byKey.get(k) ?? [];
    out.push({ key: k, label: formatShortDate(cursor), ...countByQuality(list), avgConfidence: avgConfidence(list) });
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return out;
}

/** Diferença percentual entre duas metades de um período (tendência). */
export function trend(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

/** Agrupa leituras de um único dia por hora (06h–18h). */
export function groupByHour(readings: Reading[], fromHour = 6, toHour = 18): DayBucket[] {
  const out: DayBucket[] = [];
  for (let h = fromHour; h <= toHour; h++) {
    const list = readings.filter((r) => new Date(r.capturedAt).getHours() === h);
    out.push({ key: String(h), label: `${String(h).padStart(2, '0')}h`, ...countByQuality(list), avgConfidence: avgConfidence(list) });
  }
  return out;
}

/** Buckets de tempo adequados ao período selecionado (hora para "hoje", dia para os demais). */
export function timeBuckets(readings: Reading[], filters: Pick<ReadingFilters, 'period' | 'from' | 'to'>, now = new Date()): DayBucket[] {
  if (filters.period === '1') return groupByHour(readings);
  const [start, end] = periodRange(filters, now);
  return groupByDay(readings, start, end);
}

/** Leituras do período imediatamente anterior (mesma duração) — base para variações. */
export function previousPeriod(readings: Reading[], filters: Pick<ReadingFilters, 'period'>, now = new Date()): Reading[] | null {
  if (!['1', '7', '14'].includes(filters.period)) return null;
  const days = Number(filters.period);
  const [start] = periodRange(filters, now);
  const prevStart = start - days * 86_400_000;
  // Compara com o mesmo intervalo de horas do período anterior.
  const prevEnd = now.getTime() - days * 86_400_000;
  return readings.filter((r) => {
    const t = new Date(r.capturedAt).getTime();
    return t >= prevStart && t <= prevEnd;
  });
}
