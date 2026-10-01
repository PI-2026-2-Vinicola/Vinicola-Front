/**
 * Contrato de dados da OASIS — idêntico ao JSON (camelCase) da API FastAPI (repositório Vinicola-back).
 * Todos os valores exibidos na plataforma vêm da API; não há dados gerados no navegador.
 */

export type Quality = 'boa' | 'atencao' | 'critica';
export type SensorStatus = 'online' | 'atencao' | 'offline' | 'inativo';
export type Maturation = 'desenvolvimento' | 'pintor' | 'maturacao' | 'adequada' | 'sobrematuracao' | 'nao_informada';
export type Classification = 'APROVADA' | 'EM OBSERVAÇÃO' | 'REVISÃO NECESSÁRIA';
export type PipelineStage = 'recebida' | 'processando' | 'analisando' | 'concluida';
export type Role = 'admin' | 'gestor' | 'operador';
export type ReadingSource = 'sensor' | 'upload' | 'importacao' | 'demonstracao';
export type ImportKind = 'readings' | 'sensors' | 'environment';

export type VarietyId = 'cabernet-sauvignon' | 'syrah' | 'tempranillo' | 'touriga-nacional' | 'chenin-blanc' | 'moscato-canelli';

/** Caixa delimitadora normalizada (0–1) no formato YOLO: x, y (canto superior esquerdo), largura, altura. */
export type Box = [number, number, number, number];

export interface Detection {
  kind: 'cacho' | 'anomalia';
  label: string;
  confidence: number;
  box: Box;
}

export interface Reading {
  id: string;
  sensorId: string;
  sensorName: string;
  block: string;
  location: string;
  capturedAt: string;
  varietyId: VarietyId;
  quality: Quality;
  confidence: number;
  maturation: Maturation;
  visualCondition: string;
  classification: Classification;
  observations: string;
  detections: Detection[];
  clustersDetected: number;
  imageUrl: string | null;
  thumbUrl: string | null;
  source: ReadingSource;
  modelVersion: string;
  processingMs: number;
  stage: PipelineStage;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Sensor {
  id: string;
  name: string;
  block: string;
  location: string;
  lat: number | null;
  lng: number | null;
  hasValidLocation: boolean;
  varietyId: VarietyId;
  device: string | null;
  firmware: string | null;
  battery: number | null;
  signal: number | null;
  captureIntervalMin: number;
  active: boolean;
  status: SensorStatus;
  statusReason: string;
  installedAt: string | null;
  lastCommunication: string | null;
  analysesCount: number;
  lastReadingAt: string | null;
  qualityRatio: number | null;
}

export interface SensorInput {
  name: string;
  block: string;
  location: string;
  lat: number | null;
  lng: number | null;
  varietyId: VarietyId;
  device: string | null;
  firmware: string | null;
  captureIntervalMin: number;
  installedAt: string | null;
}

export interface EnvironmentPoint {
  measuredAt: string;
  temperatureC: number | null;
  humidityPct: number | null;
  luminosityLux: number | null;
  soilMoisturePct: number | null;
  source: string;
}

export interface TelemetryPoint {
  receivedAt: string;
  battery: number | null;
  signal: number | null;
  firmware: string | null;
}

export interface VarietyCriteria {
  boa: string;
  atencao: string;
  critica: string;
}

export interface Variety {
  id: VarietyId;
  name: string;
  type: 'Tinta' | 'Branca';
  color: string;
  berryColor: string;
  maturationCycle: string;
  origin: string;
  description: string;
  characteristics: string[];
  visualTraits: string[];
  criteria: VarietyCriteria;
  /** Cor de identidade nos gráficos (paleta categórica validada para daltonismo). */
  chartColor: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

/* ------------------------------------------------------------------ indicadores */
export interface QualityCount {
  boa: number;
  atencao: number;
  critica: number;
  total: number;
}

export interface Summary {
  periodStart: string;
  periodEnd: string;
  sensorsTotal: number;
  sensorsOnline: number;
  sensorsAttention: number;
  sensorsOffline: number;
  readings: number;
  clusters: number;
  quality: QualityCount;
  qualityRatio: number | null;
  avgConfidence: number | null;
  alerts: number;
  lastReadingAt: string | null;
  previous: { readings: number; qualityRatio: number | null } | null;
  environment: { avgTemperatureC: number | null; avgHumidityPct: number | null; measurements: number; lastMeasuredAt: string | null };
}

export interface Bucket extends QualityCount {
  key: string;
  label: string;
  avgConfidence: number | null;
}

export interface Group extends QualityCount {
  key: string;
  avgConfidence: number | null;
}

export interface EnvironmentDay {
  key: string;
  label: string;
  measurements: number;
  avgTemperatureC: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  avgHumidityPct: number | null;
  avgLuminosityLux: number | null;
  avgSoilMoisturePct: number | null;
}

export interface PublicOverview {
  sensorsTotal: number;
  sensorsOnline: number;
  analyses30d: number;
  varietiesMonitored: number;
  avgConfidence30d: number | null;
  qualityRatio30d: number | null;
  lastAnalysisAt: string | null;
}

/* ------------------------------------------------------------------ importação, sistema, auditoria */
export interface RowError {
  row: number;
  field: string | null;
  message: string;
}

export interface ImportPreview {
  kind: ImportKind;
  filename: string;
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  columns: string[];
  sample: Record<string, string | number | null>[];
  errors: RowError[];
}

export interface ImportJob {
  id: number;
  kind: ImportKind;
  filename: string;
  status: 'concluida' | 'parcial' | 'sem_alteracoes' | 'falhou';
  totalRows: number;
  inserted: number;
  updated: number;
  duplicates: number;
  invalid: number;
  errors: RowError[];
  createdByName: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  createdAt: string;
  actor: string | null;
  action: string;
  target: string | null;
  details: string | null;
  ip: string | null;
}

export interface SystemStatus {
  version: string;
  environment: string;
  database: string;
  detector: string;
  detectorDescription: string;
  modelLoaded: boolean;
  timezone: string;
  farmName: string | null;
  publicRead: boolean;
  storageMb: number;
  counts: Record<string, number>;
}
