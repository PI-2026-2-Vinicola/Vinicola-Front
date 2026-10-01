import type { ReadingQuery } from '../services/api';

/** Períodos predefinidos (dias, contados a partir de 00h no fuso da propriedade) ou intervalo personalizado. */
export type Period = '1' | '7' | '14' | '30' | '90' | '365' | 'custom';

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '1', label: 'Hoje' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
];

export const PERIOD_TEXT: Record<Period, string> = {
  '1': 'hoje',
  '7': 'últimos 7 dias',
  '14': 'últimos 14 dias',
  '30': 'últimos 30 dias',
  '90': 'últimos 90 dias',
  '365': 'últimos 12 meses',
  custom: 'período selecionado',
};

export function isPeriod(v: string | null): v is Period {
  return v !== null && v in PERIOD_TEXT;
}

/** Converte o período escolhido nos parâmetros da API. */
export function periodQuery(period: Period, from?: string, to?: string): Pick<ReadingQuery, 'days' | 'dateFrom' | 'dateTo'> {
  if (period === 'custom') return { dateFrom: from || undefined, dateTo: to || undefined, days: from ? undefined : 3650 };
  return { days: Number(period) };
}

export const ratio = (part: number, total: number) => (total === 0 ? 0 : part / total);

/** Variação relativa entre dois totais; `null` quando não há base de comparação. */
export function relativeChange(current: number, previous: number | null | undefined): number | null {
  if (previous === null || previous === undefined || previous === 0) return null;
  return (current - previous) / previous;
}

/** Diferença entre duas proporções (em fração; o card exibe em p.p.). */
export function pointsChange(current: number | null, previous: number | null | undefined): number | null {
  if (current === null || previous === null || previous === undefined) return null;
  return current - previous;
}
