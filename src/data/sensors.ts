import type { Sensor } from './types';

/**
 * Propriedade demonstrativa em Lagoa Grande (PE) — polo vitivinícola do Vale do São Francisco.
 * Cada sensor (ESP32-CAM) fica instalado em um talhão com uma variedade.
 */
export const FARM = {
  name: 'Fazenda Vale Sereno',
  city: 'Lagoa Grande — PE',
  region: 'Vale do São Francisco',
  center: [-8.9968, -40.2716] as [number, number],
};

/** Polígonos aproximados dos talhões (blocos) para o mapa. */
export const BLOCKS: { id: string; name: string; polygon: [number, number][] }[] = [
  { id: 'A', name: 'Bloco A', polygon: [[-8.9926, -40.2772], [-8.9926, -40.2738], [-8.9950, -40.2738], [-8.9950, -40.2772]] },
  { id: 'B', name: 'Bloco B', polygon: [[-8.9926, -40.2733], [-8.9926, -40.2699], [-8.9950, -40.2699], [-8.9950, -40.2733]] },
  { id: 'C', name: 'Bloco C', polygon: [[-8.9926, -40.2694], [-8.9926, -40.2660], [-8.9950, -40.2660], [-8.9950, -40.2694]] },
  { id: 'D', name: 'Bloco D', polygon: [[-8.9956, -40.2772], [-8.9956, -40.2738], [-8.9982, -40.2738], [-8.9982, -40.2772]] },
  { id: 'E', name: 'Bloco E', polygon: [[-8.9956, -40.2733], [-8.9956, -40.2699], [-8.9982, -40.2699], [-8.9982, -40.2733]] },
  { id: 'F', name: 'Bloco F', polygon: [[-8.9956, -40.2694], [-8.9956, -40.2660], [-8.9982, -40.2660], [-8.9982, -40.2694]] },
];

type SensorSeed = Omit<Sensor, 'lastCommunication' | 'status'> & {
  status: Sensor['status'];
  /** Horas desde a última comunicação (usado para simular sensores offline). */
  silentHours: number;
};

export const SENSOR_SEEDS: SensorSeed[] = [
  {
    id: 'S-001', name: 'OSAIS Cam 01', block: 'Bloco A', location: 'Bloco A — Fileira 12',
    lat: -8.99375, lng: -40.27552, status: 'online', varietyId: 'cabernet-sauvignon',
    device: 'ESP32-CAM (OV2640)', firmware: 'v1.4.2', battery: 92, signal: -58, captureIntervalMin: 90,
    installedAt: '2026-03-02', silentHours: 0,
  },
  {
    id: 'S-002', name: 'OSAIS Cam 02', block: 'Bloco B', location: 'Bloco B — Fileira 07',
    lat: -8.99390, lng: -40.27158, status: 'online', varietyId: 'syrah',
    device: 'ESP32-CAM (OV2640)', firmware: 'v1.4.2', battery: 87, signal: -61, captureIntervalMin: 90,
    installedAt: '2026-03-02', silentHours: 0,
  },
  {
    id: 'S-003', name: 'OSAIS Cam 03', block: 'Bloco C', location: 'Bloco C — Fileira 21',
    lat: -8.99360, lng: -40.26770, status: 'online', varietyId: 'chenin-blanc',
    device: 'ESP32-S3 + OV5640', firmware: 'v1.5.0', battery: 78, signal: -66, captureIntervalMin: 75,
    installedAt: '2026-04-11', silentHours: 0,
  },
  {
    id: 'S-004', name: 'OSAIS Cam 04', block: 'Bloco D', location: 'Bloco D — Fileira 03',
    lat: -8.99690, lng: -40.27560, status: 'online', varietyId: 'tempranillo',
    device: 'ESP32-CAM (OV2640)', firmware: 'v1.4.2', battery: 81, signal: -63, captureIntervalMin: 90,
    installedAt: '2026-04-11', silentHours: 0,
  },
  {
    id: 'S-005', name: 'OSAIS Cam 05', block: 'Bloco E', location: 'Bloco E — Fileira 15',
    lat: -8.99705, lng: -40.27170, status: 'atencao', varietyId: 'moscato-canelli',
    device: 'ESP32-CAM (OV2640)', firmware: 'v1.3.9', battery: 23, signal: -79, captureIntervalMin: 120,
    installedAt: '2026-05-20', silentHours: 3,
  },
  {
    id: 'S-006', name: 'OSAIS Cam 06', block: 'Bloco F', location: 'Bloco F — Fileira 09',
    lat: -8.99680, lng: -40.26780, status: 'offline', varietyId: 'touriga-nacional',
    device: 'ESP32-S3 + OV5640', firmware: 'v1.5.0', battery: 0, signal: -95, captureIntervalMin: 90,
    installedAt: '2026-05-20', silentHours: 44,
  },
];
