import { between, intBetween, mulberry32, pick, type Rng } from '../lib/random';
import { CLASSIFICATION_BY_QUALITY, MATURATION_ORDER } from './labels';
import { SENSOR_SEEDS } from './sensors';
import type { Box, Detection, Quality, Reading, Sensor, VarietyId } from './types';
import { yoloClass } from './varieties';

export const MODEL_VERSION = 'YOLOv8n-osais v0.3';
export const HISTORY_DAYS = 30;

/** Perfil de qualidade por variedade: probabilidade base de "boa" e de "necessita atenção". */
const QUALITY_PROFILE: Record<VarietyId, { boa: number; critica: number; maturationOffset: number }> = {
  'cabernet-sauvignon': { boa: 0.74, critica: 0.09, maturationOffset: -0.25 },
  syrah: { boa: 0.72, critica: 0.08, maturationOffset: 0 },
  tempranillo: { boa: 0.71, critica: 0.1, maturationOffset: 0.3 },
  'touriga-nacional': { boa: 0.77, critica: 0.07, maturationOffset: 0 },
  'chenin-blanc': { boa: 0.7, critica: 0.09, maturationOffset: -0.1 },
  'moscato-canelli': { boa: 0.73, critica: 0.08, maturationOffset: 0.35 },
};

export const ANOMALY_LABELS: Record<Exclude<Quality, 'boa'>, string[]> = {
  atencao: ['maturacao_desigual', 'baga_irregular', 'mancha_leve'],
  critica: ['podridao', 'baga_murcha', 'lesao'],
};

export const ANOMALY_TEXT: Record<string, { condition: string; observation: string }> = {
  maturacao_desigual: {
    condition: 'Maturação desigual',
    observation: 'Coloração irregular em parte das bagas — acompanhar a evolução da maturação no talhão.',
  },
  baga_irregular: {
    condition: 'Bagas irregulares',
    observation: 'Presença de bagas menores que o padrão (possível desavinho). Recomenda-se monitorar nas próximas leituras.',
  },
  mancha_leve: {
    condition: 'Manchas leves',
    observation: 'Pequenas manchas superficiais em algumas bagas. Situação a ser acompanhada.',
  },
  podridao: {
    condition: 'Sinais de podridão',
    observation: 'Bagas com aspecto visual compatível com podridão. Recomenda-se inspeção em campo por um responsável técnico.',
  },
  baga_murcha: {
    condition: 'Bagas desidratadas',
    observation: 'Bagas murchas/desidratadas em região do cacho. Verificar irrigação e exposição solar.',
  },
  lesao: {
    condition: 'Lesões visíveis',
    observation: 'Manchas escuras e rachaduras em várias bagas — possível doença fúngica ou dano mecânico. Avaliação agronômica recomendada.',
  },
};

const GOOD_OBSERVATIONS = [
  'Cacho uniforme, coloração compatível com a variedade e sem sinais visuais de dano.',
  'Bagas íntegras e maturação homogênea no cacho.',
  'Características visuais dentro dos parâmetros esperados para a variedade.',
  'Cacho bem formado, bagas túrgidas e sem manchas aparentes.',
];

/** Largura relativa do cacho em uma altura relativa v (0 = topo, 1 = ponta). */
export function clusterHalfWidth(v: number): number {
  if (v < 0.22) return 0.62 + v * 1.7;
  return Math.max(0.08, 1 - ((v - 0.22) / 0.78) * 0.9);
}

function qualityFor(rng: Rng, varietyId: VarietyId, dayIndex: number): Quality {
  const profile = QUALITY_PROFILE[varietyId];
  let pBoa = profile.boa;
  let pCrit = profile.critica;
  // Evento de chuva simulado (dias -12 a -9): mais leituras em atenção em todos os talhões.
  if (dayIndex >= HISTORY_DAYS - 13 && dayIndex <= HISTORY_DAYS - 10) {
    pBoa -= 0.14;
    pCrit += 0.04;
  }
  // Chenin Blanc: casca fina, piora na última semana (umidade após a chuva).
  if (varietyId === 'chenin-blanc' && dayIndex >= HISTORY_DAYS - 8) {
    pBoa -= 0.2;
    pCrit += 0.11;
  }
  // Syrah melhora ao longo do período (manejo de dossel).
  if (varietyId === 'syrah') pBoa += (dayIndex / HISTORY_DAYS) * 0.12;
  const r = rng();
  if (r < pBoa) return 'boa';
  if (r < pBoa + (1 - pBoa - pCrit)) return 'atencao';
  return 'critica';
}

function clusterBox(rng: Rng): Box {
  const w = between(rng, 0.34, 0.4);
  return [between(rng, 0.29, 0.36), between(rng, 0.13, 0.19), w, between(rng, 0.6, 0.68)];
}

function anomalyBoxes(rng: Rng, cluster: Box, quality: Quality): Detection[] {
  if (quality === 'boa') return [];
  const count = quality === 'atencao' ? intBetween(rng, 1, 2) : intBetween(rng, 2, 3);
  const labels = ANOMALY_LABELS[quality];
  const main = pick(rng, labels);
  const [cx, cy, cw, ch] = cluster;
  const out: Detection[] = [];
  for (let i = 0; i < count; i++) {
    let placed: Box | null = null;
    // Evita caixas sobrepostas (e rótulos colidindo) testando algumas posições.
    for (let attempt = 0; attempt < 24 && !placed; attempt++) {
      const v = between(rng, 0.14, 0.66);
      const half = clusterHalfWidth(v) * 0.5 * cw * 0.7;
      const centerX = cx + cw / 2 + between(rng, -half, half);
      const centerY = cy + v * ch;
      const bw = between(rng, 0.07, 0.1);
      const bh = between(rng, 0.09, 0.13);
      const candidate: Box = [round(centerX - bw / 2), round(centerY - bh / 2), round(bw), round(bh)];
      const clear = out.every((o) => Math.abs(o.box[1] - candidate[1]) > 0.1 || Math.abs(o.box[0] - candidate[0]) > 0.24);
      if (clear) placed = candidate;
    }
    if (!placed) break;
    out.push({
      kind: 'anomalia',
      label: i === 0 ? main : pick(rng, labels),
      confidence: round(between(rng, 0.58, 0.9)),
      box: placed,
    });
  }
  return out;
}

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

export interface BuildReadingInput {
  rng: Rng;
  sensor: Pick<Sensor, 'id' | 'block' | 'location' | 'varietyId'>;
  capturedAt: Date;
  dayIndex: number;
  seq: number;
  forceQuality?: Quality;
}

/** Monta uma leitura completa como se tivesse passado por todo o pipeline (edge → YOLO → classificação). */
export function buildReading({ rng, sensor, capturedAt, dayIndex, seq, forceQuality }: BuildReadingInput): Reading {
  const quality = forceQuality ?? qualityFor(rng, sensor.varietyId, dayIndex);
  const profile = QUALITY_PROFILE[sensor.varietyId];
  const progress = dayIndex / HISTORY_DAYS;
  let stage = 1.25 + progress * 2.25 + profile.maturationOffset + between(rng, -0.35, 0.35);
  if (quality !== 'boa' && rng() < 0.4) stage -= 0.7;
  const maturation = MATURATION_ORDER[Math.max(0, Math.min(4, Math.floor(stage)))];

  const confidence =
    quality === 'boa' ? between(rng, 0.87, 0.985) : quality === 'atencao' ? between(rng, 0.79, 0.95) : between(rng, 0.71, 0.92);

  const main = clusterBox(rng);
  const detections: Detection[] = [{ kind: 'cacho', label: yoloClass(sensor.varietyId), confidence: round(confidence), box: main.map((n) => round(n)) as Box }];
  if (rng() < 0.22) {
    const conf = round(Math.max(0.6, confidence - between(rng, 0.05, 0.15)));
    detections.push({ kind: 'cacho', label: yoloClass(sensor.varietyId), confidence: conf, box: [round(between(rng, 0.74, 0.8)), round(between(rng, 0.28, 0.36)), 0.19, 0.42] });
  }
  const anomalies = anomalyBoxes(rng, main, quality);
  detections.push(...anomalies);

  const mainAnomaly = anomalies[0]?.label;
  const visualCondition = mainAnomaly ? ANOMALY_TEXT[mainAnomaly].condition : 'Boa';
  const observations = mainAnomaly ? ANOMALY_TEXT[mainAnomaly].observation : pick(rng, GOOD_OBSERVATIONS);

  return {
    id: `OS-${String(seq).padStart(5, '0')}`,
    sensorId: sensor.id,
    block: sensor.block,
    location: sensor.location,
    capturedAt: capturedAt.toISOString(),
    varietyId: sensor.varietyId,
    quality,
    confidence: round(confidence),
    maturation,
    visualCondition,
    classification: CLASSIFICATION_BY_QUALITY[quality],
    observations,
    detections,
    clustersDetected: detections.filter((d) => d.kind === 'cacho').length,
    imageSeed: Math.floor(rng() * 1e9),
    modelVersion: MODEL_VERSION,
    processingMs: intBetween(rng, 180, 640),
    stage: 'concluida',
  };
}

export interface DemoData {
  sensors: Sensor[];
  readings: Reading[];
}

/**
 * Gera 30 dias de histórico para os sensores da propriedade demonstrativa.
 * Determinístico para um mesmo dia de referência — a demonstração é estável e reproduzível.
 */
export function generateDemoData(now = new Date()): DemoData {
  const rng = mulberry32(20260923);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const raw: { sensor: (typeof SENSOR_SEEDS)[number]; at: Date; dayIndex: number }[] = [];

  for (const seed of SENSOR_SEEDS) {
    const silentSince = now.getTime() - seed.silentHours * 3600_000;
    const sensorRng = mulberry32(parseInt(seed.id.slice(2), 10) * 7919);
    for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
      const dayIndex = HISTORY_DAYS - 1 - d;
      const base = new Date(today);
      base.setDate(base.getDate() - d);
      let minutes = 6 * 60 + intBetween(sensorRng, 0, 25);
      while (minutes <= 18 * 60) {
        const at = new Date(base);
        at.setMinutes(minutes + intBetween(sensorRng, -8, 8));
        minutes += seed.captureIntervalMin;
        if (at.getTime() > silentSince) continue;
        // S-005: comunicação intermitente nos últimos dias (bateria baixa / sinal fraco).
        if (seed.status === 'atencao' && d <= 3 && sensorRng() < 0.45) continue;
        raw.push({ sensor: seed, at, dayIndex });
      }
    }
  }

  raw.sort((a, b) => a.at.getTime() - b.at.getTime());
  const readings = raw.map((r, i) => buildReading({ rng, sensor: r.sensor, capturedAt: r.at, dayIndex: r.dayIndex, seq: i + 1 }));
  readings.reverse();

  const sensors: Sensor[] = SENSOR_SEEDS.map(({ silentHours, ...s }) => {
    const heartbeat = silentHours > 0 ? silentHours * 3600_000 : intBetween(rng, 1, 4) * 60_000;
    return { ...s, lastCommunication: new Date(now.getTime() - heartbeat).toISOString() };
  });

  return { sensors, readings };
}

let captureCounter = 0;

/** Simula uma nova captura de um sensor (usada na demonstração do pipeline em tempo real). */
export function simulateCapture(sensor: Sensor, lastSeq: number, forceQuality?: Quality): Reading {
  captureCounter += 1;
  const rng = mulberry32(Date.now() % 1e9 + captureCounter * 131);
  return buildReading({ rng, sensor, capturedAt: new Date(), dayIndex: HISTORY_DAYS - 1, seq: lastSeq + 1, forceQuality });
}
