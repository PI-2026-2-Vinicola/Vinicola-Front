import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Recalcula o tamanho do mapa quando o contêiner muda (grade responsiva, abas, modais). */
export function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(el);
    return () => observer.disconnect();
  }, [map]);
  return null;
}
