import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, MapPinOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import type { Sensor } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatDateTime, formatPct, formatRelative } from '../../lib/format';
import { SensorStatusBadge } from '../ui/Badges';
import { EmptyState } from '../ui/States';

const ICON_SVG: Record<Sensor['status'], string> = {
  online:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  atencao: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 8v5"/><path d="M12 17h.01"/></svg>',
  offline: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  inativo: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M9 6v12M15 6v12"/></svg>',
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function markerIcon(sensor: Sensor, selected: boolean) {
  return L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -20],
    html: `<div class="map-marker map-marker--${sensor.status}${selected ? ' is-selected' : ''}">
      <span class="map-marker-dot">${ICON_SVG[sensor.status]}</span>
      <span class="map-marker-label">${escapeHtml(sensor.id)}</span>
    </div>`,
  });
}

function FitAndFly({ sensors, target }: { sensors: Sensor[]; target?: Sensor }) {
  const map = useMap();
  const key = sensors.map((s) => `${s.id}:${s.lat}:${s.lng}`).join('|');
  useEffect(() => {
    if (!sensors.length) return;
    if (sensors.length === 1) map.setView([sensors[0].lat!, sensors[0].lng!], 17);
    else map.fitBounds(L.latLngBounds(sensors.map((s) => [s.lat!, s.lng!] as [number, number])), { padding: [40, 40], maxZoom: 18 });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (target?.hasValidLocation) map.flyTo([target.lat!, target.lng!], Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [target, map]);
  return null;
}

const TILES = {
  mapa: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap &copy; CARTO' },
  satelite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Imagens &copy; Esri' },
};

interface SensorMapProps {
  sensors: Sensor[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
}

/** Mapa com os sensores que têm coordenadas válidas; os demais são listados abaixo do mapa. */
export function SensorMap({ sensors, selectedId, onSelect, height = 420 }: SensorMapProps) {
  const [layer, setLayer] = useState<keyof typeof TILES>('mapa');
  const located = useMemo(() => sensors.filter((s) => s.hasValidLocation), [sensors]);
  const missing = sensors.length - located.length;
  const selected = useMemo(() => located.find((s) => s.id === selectedId), [located, selectedId]);

  if (!located.length)
    return (
      <div className="map-empty" style={{ minHeight: Math.min(height, 260) }}>
        <EmptyState icon={<MapPinOff aria-hidden="true" />} title={sensors.length ? 'Nenhum sensor com coordenadas' : 'Nenhum sensor cadastrado'}>
          {sensors.length ? 'Informe latitude e longitude no cadastro dos sensores para exibi-los no mapa.' : 'Cadastre os sensores para acompanhar sua localização.'}
        </EmptyState>
      </div>
    );

  return (
    <div>
      <div className="map-shell" style={{ height }}>
        <MapContainer center={[located[0].lat!, located[0].lng!]} zoom={16} scrollWheelZoom={false} className="map" attributionControl>
          <TileLayer key={layer} url={TILES[layer].url} attribution={TILES[layer].attribution} maxZoom={19} />
          {located.map((s) => (
            <Marker key={s.id} position={[s.lat!, s.lng!]} icon={markerIcon(s, s.id === selectedId)} eventHandlers={{ click: () => onSelect?.(s.id) }}>
              <Popup className="sensor-popup" closeButton={false}>
                <div className="popup">
                  <div className="row-between">
                    <strong>{s.name}</strong>
                    <SensorStatusBadge status={s.status} />
                  </div>
                  <dl>
                    <dt>Código</dt>
                    <dd className="mono">{s.id}</dd>
                    <dt>Local</dt>
                    <dd>
                      {s.block} · {s.location}
                    </dd>
                    <dt>Variedade</dt>
                    <dd>{VARIETY_BY_ID[s.varietyId]?.name ?? s.varietyId}</dd>
                    <dt>Última leitura</dt>
                    <dd>{s.lastReadingAt ? formatDateTime(s.lastReadingAt) : 'nenhuma'}</dd>
                    <dt>% Boa</dt>
                    <dd>{formatPct(s.qualityRatio)}</dd>
                    <dt>Comunicação</dt>
                    <dd>{formatRelative(s.lastCommunication)}</dd>
                  </dl>
                  <p className="popup-reason">{s.statusReason}</p>
                  <Link to={`/sensores/${s.id}`} className="link">
                    Ver detalhes <ArrowRight />
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
          <FitAndFly sensors={located} target={selected} />
        </MapContainer>
        <div className="map-controls">
          <div className="segmented">
            <button aria-pressed={layer === 'mapa'} onClick={() => setLayer('mapa')}>
              Mapa
            </button>
            <button aria-pressed={layer === 'satelite'} onClick={() => setLayer('satelite')}>
              Satélite
            </button>
          </div>
        </div>
        <div className="map-legend">
          {(['online', 'atencao', 'offline', 'inativo'] as const).map((st) => (
            <span key={st}>
              <span className={`map-marker map-marker--${st} mini`}>
                <span className="map-marker-dot" />
              </span>
              {{ online: 'Online', atencao: 'Atenção', offline: 'Offline', inativo: 'Inativo' }[st]}
            </span>
          ))}
        </div>
      </div>
      {missing > 0 && (
        <p className="map-note">
          <MapPinOff aria-hidden="true" /> {missing} sensor(es) sem coordenadas não aparecem no mapa.
        </p>
      )}
    </div>
  );
}
