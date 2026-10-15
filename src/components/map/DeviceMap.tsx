import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { ThingSpeakEntry, ThingSpeakPosition } from '../../data/types';
import { formatDateTime } from '../../lib/format';
import { AutoResize } from './AutoResize';
import { TILES } from './tiles';


const ICON = L.divIcon({
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -20],
  html: '<div class="map-marker map-marker--online"><span class="map-marker-dot"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/></svg></span></div>',
});

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 16);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 17 });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Posição mais recente do dispositivo do ThingSpeak e o trajeto dos registros do período (quando a posição muda). */
export function DeviceMap({ position, entries, height = 320 }: { position: ThingSpeakPosition; entries: ThingSpeakEntry[]; height?: number }) {
  const track = useMemo(
    () => entries.filter((e) => e.latitude !== null && e.longitude !== null).map((e) => ({ at: e.createdAt, point: [e.latitude!, e.longitude!] as [number, number] })),
    [entries],
  );
  const current: [number, number] = [position.latitude, position.longitude];
  const points = track.length ? track.map((t) => t.point) : [current];
  const moved = new Set(track.map((t) => t.point.join(','))).size > 1;

  return (
    <div className="map-shell" style={{ height }}>
      <MapContainer center={current} zoom={16} scrollWheelZoom={false} className="map" attributionControl>
        <TileLayer url={TILES.mapa.url} attribution={TILES.mapa.attribution} maxZoom={TILES.mapa.maxZoom} />
        {moved && <Polyline positions={points} pathOptions={{ color: '#a3325a', weight: 3, opacity: 0.6 }} />}
        {moved &&
          track.slice(0, -1).map((t) => (
            <CircleMarker key={t.at} center={t.point} radius={4} pathOptions={{ color: '#a3325a', fillOpacity: 0.7 }}>
              <Popup closeButton={false}>{formatDateTime(t.at)}</Popup>
            </CircleMarker>
          ))}
        <Marker position={current} icon={ICON}>
          <Popup closeButton={false}>
            <strong>Posição mais recente</strong>
            <br />
            {position.latitude.toLocaleString('pt-BR')}, {position.longitude.toLocaleString('pt-BR')}
            {position.at && (
              <>
                <br />
                {formatDateTime(position.at)}
              </>
            )}
          </Popup>
        </Marker>
        <Fit points={points} />
        <AutoResize />
      </MapContainer>
    </div>
  );
}
