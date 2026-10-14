import { describe, expect, it } from 'vitest';
import type { AgritecWindow, Detection, ThingSpeakEntry, ThingSpeakField } from '../data/types';
import { summarizeDetections } from './detections';
import { chartableFields, fieldSeries, formatFieldValue, hoursSince, spansMultipleDays } from './thingspeak';
import { validateImageFile } from './upload';
import { filterByRisk, formatHarvest, formatWindow, monthsCovered } from './zarc';

const entry = (createdAt: string, values: Record<string, number | null>): ThingSpeakEntry => ({ createdAt, entryId: null, values });
const field = (partial: Partial<ThingSpeakField>): ThingSpeakField => ({
  key: 'field1', name: 'Campo', unit: null, numeric: true, latest: null, latestText: null, latestAt: null, count: 0, min: null, max: null, avg: null, ...partial,
});
const win = (partial: Partial<AgritecWindow>): AgritecWindow => ({
  cycle: 'PERENE', soil: 'AD1', startDay: 1, startMonth: 10, endDay: 31, endMonth: 12, risk: 20, harvestStart: 2026, harvestEnd: 2027, ordinance: null, ...partial,
});

describe('ThingSpeak', () => {
  it('formata valores sem inventar unidade', () => {
    expect(formatFieldValue(27.456)).toBe('27,46');
    expect(formatFieldValue(27.456, '°C')).toBe('27,46 °C');
    expect(formatFieldValue(1234.56, 'lx')).toBe('1.234,6 lx');
    expect(formatFieldValue(null, '%')).toBe('—');
  });
  it('mantém lacunas na série e identifica períodos com mais de um dia', () => {
    const entries = [entry('2026-10-14T10:00:00Z', { field1: 1 }), entry('2026-10-15T10:00:00Z', { field1: null })];
    expect(fieldSeries(entries, 'field1')).toEqual([1, null]);
    expect(fieldSeries(entries, 'field2')).toEqual([null, null]);
    expect(spansMultipleDays(entries)).toBe(true);
    expect(spansMultipleDays(entries.slice(0, 1))).toBe(false);
  });
  it('só desenha gráficos de campos numéricos com dados', () => {
    const fields = [field({ key: 'field1', count: 3 }), field({ key: 'field2', count: 0 }), field({ key: 'field3', numeric: false, count: 2 })];
    expect(chartableFields(fields).map((f) => f.key)).toEqual(['field1']);
  });
  it('calcula a idade da última leitura', () => {
    expect(hoursSince(null)).toBeNull();
    expect(hoursSince('2026-10-14T10:00:00Z', Date.parse('2026-10-14T13:00:00Z'))).toBe(3);
  });
});

describe('Zarc', () => {
  it('formata a janela de plantio', () => {
    expect(formatWindow(win({ startDay: 1, startMonth: 4, endDay: 31, endMonth: 5 }))).toBe('01/04 a 31/05');
    expect(formatHarvest(win({}))).toBe('2026/2027');
    expect(formatHarvest(win({ harvestStart: null, harvestEnd: null }))).toBe('—');
  });
  it('calcula os meses cobertos, inclusive na virada do ano', () => {
    expect(monthsCovered(win({ startMonth: 4, endMonth: 6 }))).toEqual([4, 5, 6]);
    expect(monthsCovered(win({ startMonth: 11, endMonth: 2 }))).toEqual([11, 12, 1, 2]);
    expect(monthsCovered(win({ startMonth: 3, endMonth: 3, startDay: 1, endDay: 20 }))).toEqual([3]);
    expect(monthsCovered(win({ startMonth: 3, endMonth: 3, startDay: 20, endDay: 10 }))).toHaveLength(12);
  });
  it('filtra pelo risco máximo', () => {
    const ws = [win({ risk: 20 }), win({ risk: 30 }), win({ risk: 40 })];
    expect(filterByRisk(ws, 30).map((w) => w.risk)).toEqual([20, 30]);
  });
});

describe('validação de imagem', () => {
  const ok = { name: 'cacho.jpg', type: 'image/jpeg', size: 1024 };
  it('aceita JPEG, PNG e WEBP dentro do limite', () => {
    expect(validateImageFile(ok, 8)).toBeNull();
    expect(validateImageFile({ ...ok, type: 'image/webp' }, 8)).toBeNull();
  });
  it('rejeita formatos, arquivos vazios e grandes demais com mensagens claras', () => {
    expect(validateImageFile({ name: 'IMG_1.HEIC', type: '', size: 10 }, 8)).toMatch(/HEIC/);
    expect(validateImageFile({ ...ok, type: 'image/gif' }, 8)).toMatch(/JPEG, PNG ou WEBP/);
    expect(validateImageFile({ ...ok, size: 0 }, 8)).toMatch(/vazio/);
    expect(validateImageFile({ ...ok, size: 9 * 1024 * 1024 }, 8)).toMatch(/limite é 8 MB/);
  });
});

describe('resumo das detecções', () => {
  const det = (kind: Detection['kind'], label: string, confidence: number): Detection => ({ kind, label, confidence, box: [0, 0, 0.1, 0.1] });
  it('agrupa por classe com contagem e confiança, cachos primeiro', () => {
    const summary = summarizeDetections([det('anomalia', 'mancha_leve', 0.6), det('anomalia', 'podridao', 0.7), det('cacho', 'syrah', 0.9), det('anomalia', 'podridao', 0.9)]);
    expect(summary.map((s) => [s.name, s.count])).toEqual([['Cacho — Syrah', 1], ['Sinais de podridão', 2], ['Manchas leves', 1]]);
    expect(summary[1].maxConfidence).toBe(0.9);
    expect(summary[1].avgConfidence).toBeCloseTo(0.8);
    expect(summarizeDetections([])).toEqual([]);
  });
});
