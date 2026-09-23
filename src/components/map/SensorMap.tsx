import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { QUALITY_LABEL } from '../../data/labels';
import { BLOCKS } from '../../data/sensors';
import type { Reading, Sensor } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatDateTime, formatRelative } from '../../lib/format';
import { SensorStatusBadge } from '../ui/Badges';

const ICON_SVG: Record<Sensor['status'], string> = {
  online:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  atencao:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 8v5"/><path d="M12 17h.01"/></svg>',
  offline:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

function markerIcon(sensor: Sensor, selected: boolean) {
  return L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -20],
    html: `<div class="map-marker map-marker--${sensor.status}${selected ? ' is-selected' : ''}">
      ${sensor.status === 'online' ? '<span class="map-marker-pulse"></span>' : ''}
      <span class="map-marker-dot">${ICON_SVG[sensor.status]}</span>
      <span class="map-marker-label">${sensor.id}</span>
    </div>`,
  });
}

function FlyTo({ target }: { target?: Sensor }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 17), { duration: 0.8 });
  }, [target, map]);
  return null;
}

interface SensorMapProps {
  sensors: Sensor[];
  lastReadings: Record<string, Reading | undefined>;
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: number;
  compact?: boolean;
}

const FARM_BOUNDS = L.latLngBounds(BLOCKS.flatMap((b) => b.polygon));

const TILES = {
  mapa: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  satelite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagens &copy; Esri',
  },
};

export function SensorMap({ sensors, lastReadings, selectedId, onSelect, height = 460, compact = false }: SensorMapProps) {
  const [layer, setLayer] = useState<keyof typeof TILES>('mapa');
  const selected = useMemo(() => sensors.find((s) => s.id === selectedId), [sensors, selectedId]);
  const blockVariety = useMemo(() => Object.fromEntries(sensors.map((s) => [s.block, VARIETY_BY_ID[s.varietyId]])), [sensors]);

  return (
    <div className="map-shell" style={{ height }}>
      <MapContainer bounds={FARM_BOUNDS} boundsOptions={{ padding: compact ? [28, 28] : [40, 40] }} scrollWheelZoom={false} className="map" attributionControl>
        <TileLayer key={layer} url={TILES[layer].url} attribution={TILES[layer].attribution} maxZoom={19} />
        {BLOCKS.map((b) => {
          const v = blockVariety[b.name];
          return (
            <Polygon key={b.id} positions={b.polygon} pathOptions={{ color: '#a3325a', weight: 1.2, opacity: 0.7, fillColor: '#f0b9cb', fillOpacity: layer === 'satelite' ? 0.18 : 0.28 }}>
              {!compact && (
                <Tooltip direction="center" permanent className="block-label">
                  {b.name}
                  {v ? ` · ${v.name}` : ''}
                </Tooltip>
              )}
            </Polygon>
          );
        })}
        {sensors.map((s) => {
          const last = lastReadings[s.id];
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={markerIcon(s, s.id === selectedId)} eventHandlers={{ click: () => onSelect?.(s.id) }}>
              <Popup className="sensor-popup" closeButton={false}>
                <div className="popup">
                  <div className="row-between">
                    <strong>{s.name}</strong>
                    <SensorStatusBadge status={s.status} />
                  </div>
                  <dl>
                    <dt>ID</dt>
                    <dd className="mono">{s.id}</dd>
                    <dt>Localização</dt>
                    <dd>{s.location}</dd>
                    <dt>Última leitura</dt>
                    <dd>{last ? `${formatDateTime(last.capturedAt)} · ${QUALITY_LABEL[last.quality]}` : '—'}</dd>
                    <dt>Comunicação</dt>
                    <dd>{formatRelative(s.lastCommunication)}</dd>
                  </dl>
                  <Link to={`/sensores/${s.id}`} className="link">
                    Ver detalhes <ArrowRight />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <FlyTo target={selected} />
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
        <span>
          <span className="map-marker map-marker--online mini">
            <span className="map-marker-dot" />
          </span>
          Ativo
        </span>
        <span>
          <span className="map-marker map-marker--atencao mini">
            <span className="map-marker-dot" />
          </span>
          Atenção
        </span>
        <span>
          <span className="map-marker map-marker--offline mini">
            <span className="map-marker-dot" />
          </span>
          Offline
        </span>
      </div>
    </div>
  );
}
