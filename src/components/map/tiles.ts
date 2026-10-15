/**
 * Camadas de fundo dos mapas (Leaflet).
 *
 * - "mapa": tiles padrão do OpenStreetMap — sem chave; exige atribuição e uso moderado
 *   (https://operations.osmfoundation.org/policies/tiles/). Os basemaps da CARTO usados antes
 *   passaram a exigir chave de API e devolviam um bloco "API KEY REQUIRED" no lugar do mapa.
 * - "satelite": World Imagery da Esri, sem chave, com atribuição.
 * Para produção com tráfego alto, troque por um provedor contratado (mesmo formato {z}/{x}/{y}).
 */
export interface TileSource {
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  maxNativeZoom: number;
}

export const TILES = {
  mapa: {
    label: 'Mapa',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    maxZoom: 19,
    maxNativeZoom: 19,
  },
  satelite: {
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagens &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    maxNativeZoom: 18, // em áreas rurais a imagem mais detalhada costuma parar no nível 18
  },
} satisfies Record<string, TileSource>;

export type TileLayerId = keyof typeof TILES;
