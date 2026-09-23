import type { VarietyId } from '../../data/types';
import { VARIETIES } from '../../data/varieties';
import type { PeriodPreset } from '../../lib/stats';

export function VarietyChips({ value, onChange }: { value: VarietyId | 'todas'; onChange: (v: VarietyId | 'todas') => void }) {
  return (
    <div className="chip-row" role="group" aria-label="Filtrar por variedade">
      <button className="chip" aria-pressed={value === 'todas'} onClick={() => onChange('todas')}>
        Todas
      </button>
      {VARIETIES.map((v) => (
        <button key={v.id} className="chip" aria-pressed={value === v.id} onClick={() => onChange(v.id)}>
          <i style={{ background: v.chartColor }} aria-hidden="true" />
          {v.name}
        </button>
      ))}
    </div>
  );
}

const PERIODS: { value: PeriodPreset; label: string }[] = [
  { value: '1', label: 'Hoje' },
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
];

export function PeriodSegmented({ value, onChange, options = PERIODS }: { value: PeriodPreset; onChange: (p: PeriodPreset) => void; options?: typeof PERIODS }) {
  return (
    <div className="segmented" role="group" aria-label="Período">
      {options.map((p) => (
        <button key={p.value} aria-pressed={value === p.value} onClick={() => onChange(p.value)}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
