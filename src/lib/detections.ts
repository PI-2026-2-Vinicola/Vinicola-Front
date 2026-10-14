import { ANOMALY_LABEL, SEVERE_ANOMALIES } from '../data/labels';
import type { Detection, VarietyId } from '../data/types';
import { VARIETY_BY_ID } from '../data/varieties';

export interface ClassSummary {
  label: string;
  name: string;
  kind: Detection['kind'];
  severe: boolean;
  count: number;
  maxConfidence: number;
  avgConfidence: number;
}

/** Nome apresentado para um rótulo do detector (variedade do cacho ou anomalia). */
export function detectionName(d: Pick<Detection, 'kind' | 'label'>): string {
  if (d.kind === 'cacho') {
    const variety = VARIETY_BY_ID[d.label.replace(/_/g, '-') as VarietyId];
    return variety ? `Cacho — ${variety.name}` : 'Cacho';
  }
  return ANOMALY_LABEL[d.label] ?? d.label;
}

/** Detecções agrupadas por classe: quantidade e confiança (cachos primeiro, depois anomalias graves). */
export function summarizeDetections(detections: Detection[]): ClassSummary[] {
  const groups = new Map<string, ClassSummary & { sum: number }>();
  for (const d of detections) {
    const g = groups.get(d.label) ?? { label: d.label, name: detectionName(d), kind: d.kind, severe: SEVERE_ANOMALIES.has(d.label), count: 0, maxConfidence: 0, avgConfidence: 0, sum: 0 };
    g.count += 1;
    g.sum += d.confidence;
    g.maxConfidence = Math.max(g.maxConfidence, d.confidence);
    g.avgConfidence = g.sum / g.count;
    groups.set(d.label, g);
  }
  const rank = (g: ClassSummary) => (g.kind === 'cacho' ? 0 : g.severe ? 1 : 2);
  return [...groups.values()].map(({ sum: _sum, ...g }) => g).sort((a, b) => rank(a) - rank(b) || b.count - a.count || a.name.localeCompare(b.name));
}
