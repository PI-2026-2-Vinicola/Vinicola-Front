import type { ThingSpeakEntry, ThingSpeakField } from '../data/types';
import { dayKey, formatShortDate, formatTime } from './format';

/** Valor de um campo com a unidade configurada no servidor (nenhuma unidade é presumida). */
export function formatFieldValue(value: number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined) return '—';
  const text = value.toLocaleString('pt-BR', { maximumFractionDigits: Math.abs(value) >= 100 ? 1 : 2 });
  return unit ? `${text} ${unit}` : text;
}

/** Série de um campo mantendo lacunas (null): o gráfico não liga pontos inexistentes. */
export const fieldSeries = (entries: ThingSpeakEntry[], key: string) => entries.map((e) => e.values[key] ?? null);

export const spansMultipleDays = (entries: ThingSpeakEntry[]) => entries.length > 1 && dayKey(entries[0].createdAt) !== dayKey(entries[entries.length - 1].createdAt);

/** Rótulo do eixo de tempo: só a hora num mesmo dia; dia/mês e hora quando o período cruza dias. */
export const timeLabel = (iso: string, withDay: boolean) => (withDay ? `${formatShortDate(iso)} ${formatTime(iso)}` : formatTime(iso));

/** Campos que têm gráfico: numéricos e com pelo menos um valor no período. */
export const chartableFields = (fields: ThingSpeakField[]) => fields.filter((f) => f.numeric && f.count > 0);

/** Horas desde a última leitura do canal (null sem leitura). */
export function hoursSince(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  return Math.max(0, now - new Date(iso).getTime()) / 3_600_000;
}

/** Paleta das séries (mesma identidade dos gráficos da plataforma). */
export const SERIES_COLORS = ['#a3325a', '#2a78d6', '#1a9aa0', '#eb6834', '#6b4fc8', '#d4588a', '#1f9d55', '#86264e'];
