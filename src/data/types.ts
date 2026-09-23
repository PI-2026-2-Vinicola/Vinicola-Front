/**
 * Modelo de dados da OSAIS.
 * O mesmo contrato é exposto pela API FastAPI (repositório Vinicola-back),
 * o que permite trocar os dados simulados por dados reais sem alterar a interface.
 */

export type Quality = 'boa' | 'atencao' | 'critica';
export type SensorStatus = 'online' | 'atencao' | 'offline';
export type Maturation = 'desenvolvimento' | 'pintor' | 'maturacao' | 'adequada' | 'sobrematuracao';
export type Classification = 'APROVADA' | 'EM OBSERVAÇÃO' | 'REVISÃO NECESSÁRIA';
export type PipelineStage = 'recebida' | 'processando' | 'analisando' | 'concluida';
export type Role = 'admin' | 'gestor' | 'operador';

export type VarietyId =
  | 'cabernet-sauvignon'
  | 'syrah'
  | 'tempranillo'
  | 'touriga-nacional'
  | 'chenin-blanc'
  | 'moscato-canelli';

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
  imageSeed: number;
  /** URL da imagem real enviada pelo sensor (modo API). No modo demonstração a imagem é gerada. */
  imageUrl?: string;
  modelVersion: string;
  processingMs: number;
  stage: PipelineStage;
}

export interface Sensor {
  id: string;
  name: string;
  block: string;
  location: string;
  lat: number;
  lng: number;
  status: SensorStatus;
  varietyId: VarietyId;
  device: string;
  firmware: string;
  battery: number;
  signal: number;
  captureIntervalMin: number;
  installedAt: string;
  lastCommunication: string;
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
  name: string;
  email: string;
  role: Role;
}
