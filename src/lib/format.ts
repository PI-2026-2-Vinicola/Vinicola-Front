const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const longDateFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const numberFmt = new Intl.NumberFormat('pt-BR');

export const formatDate = (iso: string | Date) => dateFmt.format(new Date(iso));
export const formatShortDate = (iso: string | Date) => shortDateFmt.format(new Date(iso));
export const formatTime = (iso: string | Date) => timeFmt.format(new Date(iso));
export const formatDateTime = (iso: string | Date) => `${formatDate(iso)} · ${formatTime(iso)}`;
export const formatLongDate = (iso: string | Date) => longDateFmt.format(new Date(iso));
export const formatNumber = (n: number) => numberFmt.format(n);
export const formatPct = (ratio: number | null | undefined, digits = 0) =>
  ratio === null || ratio === undefined ? '—' : `${(ratio * 100).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

/** Valor numérico opcional com unidade (ex.: "27,5 °C"); ausente → "—". */
export const formatMeasure = (value: number | null | undefined, unit: string, digits = 1) =>
  value === null || value === undefined ? '—' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${unit}`;

/** Data/hora local em formato de campo `datetime-local` (AAAA-MM-DDTHH:MM). */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`);

/** "há 5 min", "há 3 h", "há 2 dias"; sem data, "nunca". */
export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'nunca';
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

/** Chave de dia local (AAAA-MM-DD) para agrupamentos. */
export function dayKey(iso: string | Date): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
