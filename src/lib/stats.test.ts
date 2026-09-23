import { describe, expect, it } from 'vitest';
import { generateDemoData } from '../data/generate';
import { SENSOR_SEEDS } from '../data/sensors';
import { countByQuality, filterReadings, groupByDay, periodRange } from './stats';

const NOW = new Date('2026-09-23T15:30:00');
const data = generateDemoData(NOW);

describe('dados simulados', () => {
  it('gera ao menos 4 sensores e histórico de vários dias', () => {
    expect(data.sensors.length).toBeGreaterThanOrEqual(4);
    const days = new Set(data.readings.map((r) => r.capturedAt.slice(0, 10)));
    expect(days.size).toBeGreaterThanOrEqual(25);
  });

  it('é determinístico para a mesma data de referência', () => {
    const again = generateDemoData(NOW);
    expect(again.readings.map((r) => r.id + r.quality)).toEqual(data.readings.map((r) => r.id + r.quality));
  });

  it('não gera leituras no futuro nem para sensores offline após a queda', () => {
    const offline = SENSOR_SEEDS.find((s) => s.status === 'offline')!;
    const limit = NOW.getTime() - offline.silentHours * 3600_000;
    for (const r of data.readings) {
      expect(new Date(r.capturedAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
      if (r.sensorId === offline.id) expect(new Date(r.capturedAt).getTime()).toBeLessThanOrEqual(limit);
    }
  });

  it('contém todas as classificações e confiança entre 0 e 1', () => {
    const c = countByQuality(data.readings);
    expect(c.boa).toBeGreaterThan(0);
    expect(c.atencao).toBeGreaterThan(0);
    expect(c.critica).toBeGreaterThan(0);
    expect(c.boa + c.atencao + c.critica).toBe(c.total);
    expect(data.readings.every((r) => r.confidence > 0 && r.confidence < 1)).toBe(true);
  });
});

describe('filtros', () => {
  it('filtra por variedade, sensor e qualidade', () => {
    const r = filterReadings(data.readings, { varietyId: 'syrah', quality: 'boa', period: 'todos' }, NOW);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.varietyId === 'syrah' && x.quality === 'boa')).toBe(true);
    const s = filterReadings(data.readings, { sensorId: 'S-001', period: 'todos' }, NOW);
    expect(s.every((x) => x.sensorId === 'S-001')).toBe(true);
  });

  it('respeita o período de 7 dias', () => {
    const [start] = periodRange({ period: '7' }, NOW);
    const r = filterReadings(data.readings, { period: '7' }, NOW);
    expect(r.every((x) => new Date(x.capturedAt).getTime() >= start)).toBe(true);
    expect(r.length).toBeLessThan(data.readings.length);
  });

  it('pesquisa por nome da variedade sem acentos', () => {
    const r = filterReadings(data.readings, { search: 'moscato', period: 'todos' }, NOW, { 'moscato-canelli': 'Moscato Canelli' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.varietyId === 'moscato-canelli')).toBe(true);
  });

  it('agrupa por dia incluindo dias vazios', () => {
    const [start, end] = periodRange({ period: '14' }, NOW);
    const days = groupByDay(filterReadings(data.readings, { period: '14' }, NOW), start, end);
    expect(days).toHaveLength(14);
  });
});
