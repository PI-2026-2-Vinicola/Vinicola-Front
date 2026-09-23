import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Reading, Sensor } from '../data/types';
import { VARIETIES } from '../data/varieties';
import { loadData, type DataSource } from '../services/api';

interface SensorStats {
  analyses: number;
  lastReading?: Reading;
}

interface DataValue {
  loading: boolean;
  error: string | null;
  source: DataSource;
  now: Date;
  sensors: Sensor[];
  readings: Reading[];
  sensorById: Record<string, Sensor>;
  sensorStats: Record<string, SensorStats>;
  varietyNames: Record<string, string>;
  addReading: (reading: Reading) => void;
  updateReading: (id: string, patch: Partial<Reading>) => void;
  lastSeq: () => number;
}

const DataContext = createContext<DataValue | null>(null);
const varietyNames = Object.fromEntries(VARIETIES.map((v) => [v.id, v.name]));

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ sensors: Sensor[]; readings: Reading[]; source: DataSource }>({ sensors: [], readings: [], source: 'demo' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    loadData()
      .then((d) => alive && setState(d))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const addReading = useCallback((reading: Reading) => {
    setState((s) => ({
      ...s,
      readings: [reading, ...s.readings],
      sensors: s.sensors.map((x) => (x.id === reading.sensorId ? { ...x, lastCommunication: reading.capturedAt } : x)),
    }));
  }, []);

  const updateReading = useCallback((id: string, patch: Partial<Reading>) => {
    setState((s) => ({ ...s, readings: s.readings.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }, []);

  const value = useMemo<DataValue>(() => {
    const sensorById = Object.fromEntries(state.sensors.map((s) => [s.id, s]));
    const sensorStats: Record<string, SensorStats> = {};
    for (const s of state.sensors) sensorStats[s.id] = { analyses: 0 };
    for (const r of state.readings) {
      if (r.stage !== 'concluida') continue;
      const st = (sensorStats[r.sensorId] ??= { analyses: 0 });
      st.analyses += 1;
      if (!st.lastReading || r.capturedAt > st.lastReading.capturedAt) st.lastReading = r;
    }
    const completed = state.readings.filter((r) => r.stage === 'concluida');
    return {
      loading,
      error,
      source: state.source,
      now,
      sensors: state.sensors,
      readings: completed,
      sensorById,
      sensorStats,
      varietyNames,
      addReading,
      updateReading,
      lastSeq: () => state.readings.reduce((m, r) => Math.max(m, Number(r.id.replace(/\D/g, '')) || 0), 0),
    };
  }, [state, loading, error, now, addReading, updateReading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
