import { Battery, BatteryFull, BatteryLow, BatteryMedium, Signal, SignalHigh, SignalLow, SignalMedium, SignalZero } from 'lucide-react';

export function BatteryMeter({ value }: { value: number }) {
  const Icon = value <= 0 ? Battery : value < 30 ? BatteryLow : value < 70 ? BatteryMedium : BatteryFull;
  return (
    <span className={`meter ${value < 30 ? 'low' : ''}`} title="Bateria">
      <Icon aria-hidden="true" />
      {value}%
    </span>
  );
}

export function SignalMeter({ dbm }: { dbm: number }) {
  const Icon = dbm <= -90 ? SignalZero : dbm <= -75 ? SignalLow : dbm <= -65 ? SignalMedium : dbm <= -55 ? SignalHigh : Signal;
  return (
    <span className={`meter ${dbm <= -75 ? 'low' : ''}`} title="Sinal Wi-Fi (RSSI)">
      <Icon aria-hidden="true" />
      {dbm} dBm
    </span>
  );
}
