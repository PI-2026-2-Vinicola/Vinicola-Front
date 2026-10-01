import type { VarietyId } from '../../data/types';
import { VARIETIES } from '../../data/varieties';
import { PERIOD_OPTIONS, type Period } from '../../lib/period';

export function VarietyChips({ value, onChange, options = VARIETIES.map((v) => v.id) }: { value: VarietyId | 'todas'; onChange: (v: VarietyId | 'todas') => void; options?: VarietyId[] }) {
  return (
    <div className="chip-row" role="group" aria-label="Filtrar por variedade">
      <button className="chip" aria-pressed={value === 'todas'} onClick={() => onChange('todas')}>
        Todas
      </button>
      {VARIETIES.filter((v) => options.includes(v.id)).map((v) => (
        <button key={v.id} className="chip" aria-pressed={value === v.id} onClick={() => onChange(v.id)}>
          <i style={{ background: v.chartColor }} aria-hidden="true" />
          {v.name}
        </button>
      ))}
    </div>
  );
}

interface PeriodPickerProps {
  value: Period;
  from?: string;
  to?: string;
  onChange: (p: Period, from?: string, to?: string) => void;
  options?: { value: Period; label: string }[];
  allowCustom?: boolean;
}

/** Seleção de período: atalhos (hoje, 7, 30, 90 dias) ou intervalo de datas. */
export function PeriodPicker({ value, from = '', to = '', onChange, options = PERIOD_OPTIONS, allowCustom = true }: PeriodPickerProps) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="period-picker">
      <div className="segmented" role="group" aria-label="Período">
        {options.map((p) => (
          <button key={p.value} aria-pressed={value === p.value} onClick={() => onChange(p.value)}>
            {p.label}
          </button>
        ))}
        {allowCustom && (
          <button aria-pressed={value === 'custom'} onClick={() => onChange('custom', from, to)}>
            Personalizado
          </button>
        )}
      </div>
      {value === 'custom' && (
        <div className="period-dates">
          <input className="input input-sm" type="date" value={from} max={to || today} onChange={(e) => onChange('custom', e.target.value, to)} aria-label="Data inicial" />
          <span className="muted">até</span>
          <input className="input input-sm" type="date" value={to} min={from || undefined} max={today} onChange={(e) => onChange('custom', from, e.target.value)} aria-label="Data final" />
        </div>
      )}
    </div>
  );
}
