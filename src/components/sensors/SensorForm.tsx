import { useState, type FormEvent } from 'react';
import type { Sensor, SensorInput, VarietyId } from '../../data/types';
import { VARIETIES } from '../../data/varieties';

export interface SensorFormValues extends SensorInput {
  id: string;
}

function parseCoord(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** Formulário de cadastro/edição com validação local (a API valida novamente). */
export function SensorForm({ initial, onSubmit, submitting, submitLabel, serverError }: { initial?: Sensor; onSubmit: (v: SensorFormValues) => void; submitting: boolean; submitLabel: string; serverError?: string | null }) {
  const [id, setId] = useState(initial?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [block, setBlock] = useState(initial?.block ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [varietyId, setVarietyId] = useState<VarietyId | ''>(initial?.varietyId ?? '');
  const [lat, setLat] = useState(initial?.lat != null ? String(initial.lat) : '');
  const [lng, setLng] = useState(initial?.lng != null ? String(initial.lng) : '');
  const [device, setDevice] = useState(initial?.device ?? '');
  const [firmware, setFirmware] = useState(initial?.firmware ?? '');
  const [captureInterval, setCaptureInterval] = useState(String(initial?.captureIntervalMin ?? 90));
  const [installedAt, setInstalledAt] = useState(initial?.installedAt ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const code = id.trim().toUpperCase();
    if (!initial && !/^[A-Z0-9][A-Z0-9_-]{1,19}$/.test(code)) err.id = 'Use de 2 a 20 caracteres: letras, números, "-" ou "_" (ex.: S-001).';
    if (name.trim().length < 2) err.name = 'Informe o nome do sensor.';
    if (!block.trim()) err.block = 'Informe o bloco ou talhão.';
    if (!location.trim()) err.location = 'Informe a localização (ex.: fileira).';
    if (!varietyId) err.varietyId = 'Selecione a variedade do talhão.';
    const la = parseCoord(lat);
    const ln = parseCoord(lng);
    if ((la === null) !== (ln === null)) err.lat = 'Informe latitude e longitude juntas (ou deixe as duas vazias).';
    else if (la !== null && (Number.isNaN(la) || la < -90 || la > 90)) err.lat = 'Latitude deve estar entre −90 e 90.';
    else if (ln !== null && (Number.isNaN(ln) || ln < -180 || ln > 180)) err.lat = 'Longitude deve estar entre −180 e 180.';
    else if (la === 0 && ln === 0) err.lat = 'Coordenadas 0,0 não são válidas.';
    const iv = Number(captureInterval);
    if (!Number.isInteger(iv) || iv < 5 || iv > 1440) err.interval = 'Intervalo entre 5 e 1440 minutos.';
    setErrors(err);
    if (Object.keys(err).length) return;
    onSubmit({
      id: code,
      name: name.trim(),
      block: block.trim(),
      location: location.trim(),
      varietyId: varietyId as VarietyId,
      lat: la,
      lng: ln,
      device: device.trim() || null,
      firmware: firmware.trim() || null,
      captureIntervalMin: iv,
      installedAt: installedAt || null,
    });
  };

  const fieldError = (k: string) => errors[k] && <span className="field-error">{errors[k]}</span>;

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="sf-id">Código *</label>
          <input id="sf-id" className="input mono" value={id} onChange={(e) => setId(e.target.value)} disabled={!!initial} placeholder="S-001" maxLength={20} aria-invalid={!!errors.id} />
          {fieldError('id')}
        </div>
        <div className="field">
          <label htmlFor="sf-name">Nome *</label>
          <input id="sf-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Câmera Talhão 1" maxLength={80} aria-invalid={!!errors.name} />
          {fieldError('name')}
        </div>
        <div className="field">
          <label htmlFor="sf-block">Bloco / talhão *</label>
          <input id="sf-block" className="input" value={block} onChange={(e) => setBlock(e.target.value)} placeholder="Bloco A" maxLength={40} aria-invalid={!!errors.block} />
          {fieldError('block')}
        </div>
        <div className="field">
          <label htmlFor="sf-location">Localização *</label>
          <input id="sf-location" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Fileira 12" maxLength={120} aria-invalid={!!errors.location} />
          {fieldError('location')}
        </div>
        <div className="field">
          <label htmlFor="sf-variety">Variedade do talhão *</label>
          <select id="sf-variety" className="select" value={varietyId} onChange={(e) => setVarietyId(e.target.value as VarietyId)} aria-invalid={!!errors.varietyId}>
            <option value="">Selecione…</option>
            {VARIETIES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {fieldError('varietyId')}
        </div>
        <div className="field">
          <label htmlFor="sf-interval">Intervalo de captura (min)</label>
          <input id="sf-interval" className="input" type="number" min={5} max={1440} value={captureInterval} onChange={(e) => setCaptureInterval(e.target.value)} aria-invalid={!!errors.interval} />
          {fieldError('interval')}
        </div>
        <div className="field">
          <label htmlFor="sf-lat">Latitude</label>
          <input id="sf-lat" className="input mono" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-9.39012" aria-invalid={!!errors.lat} />
        </div>
        <div className="field">
          <label htmlFor="sf-lng">Longitude</label>
          <input id="sf-lng" className="input mono" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-40.50123" />
        </div>
        {errors.lat && <div className="field-error span-2">{errors.lat}</div>}
        <div className="field">
          <label htmlFor="sf-device">Dispositivo</label>
          <input id="sf-device" className="input" value={device} onChange={(e) => setDevice(e.target.value)} placeholder="ESP32-CAM (OV2640)" maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="sf-installed">Instalado em</label>
          <input id="sf-installed" className="input" type="date" value={installedAt} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setInstalledAt(e.target.value)} />
        </div>
        {initial && (
          <div className="field">
            <label htmlFor="sf-fw">Firmware</label>
            <input id="sf-fw" className="input" value={firmware} onChange={(e) => setFirmware(e.target.value)} maxLength={20} />
          </div>
        )}
      </div>
      <p className="form-hint">Sem coordenadas, o sensor funciona normalmente mas não aparece no mapa. Bateria, sinal e firmware são atualizados pelo próprio dispositivo.</p>
      {serverError && (
        <div className="form-error" role="alert">
          {serverError}
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <span className="spinner" aria-hidden="true" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
