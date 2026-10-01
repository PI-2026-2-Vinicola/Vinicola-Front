import { Battery, BatteryFull, BatteryLow, BatteryMedium, Signal, SignalHigh, SignalLow, SignalMedium, SignalZero } from 'lucide-react';

/** Bateria informada pelo dispositivo; sem informação, mostra "—" (nada é presumido). */
export function BatteryMeter({ value }: { value: number | null }) {
  if (value === null) return <span className="meter muted" title="Bateria não informada pelo dispositivo"><Battery aria-hidden="true" />—</span>;
  const Icon = value <= 0 ? Battery : value < 25 ? BatteryLow : value < 70 ? BatteryMedium : BatteryFull;
  return (
    <span className={`meter ${value < 25 ? 'low' : ''}`} title="Bateria">
      <Icon aria-hidden="true" />
      {value}%
    </span>
  );
}

export function SignalMeter({ dbm }: { dbm: number | null }) {
  if (dbm === null) return <span className="meter muted" title="Sinal não informado pelo dispositivo"><Signal aria-hidden="true" />—</span>;
  const Icon = dbm <= -90 ? SignalZero : dbm <= -80 ? SignalLow : dbm <= -65 ? SignalMedium : dbm <= -55 ? SignalHigh : Signal;
  return (
    <span className={`meter ${dbm <= -80 ? 'low' : ''}`} title="Sinal Wi-Fi (RSSI)">
      <Icon aria-hidden="true" />
      {dbm} dBm
    </span>
  );
}
