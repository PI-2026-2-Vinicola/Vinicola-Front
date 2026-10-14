import type { ThingSpeakFeed, ThingSpeakPeriod } from '../data/types';
import { http } from './http';

/**
 * Dados do canal do ThingSpeak, sempre pela API OASIS: o navegador nunca fala com o ThingSpeak
 * nem conhece a Read API Key (configurada só no servidor).
 */
export const getThingSpeakFeed = (period: ThingSpeakPeriod, results = 100) => http<ThingSpeakFeed>('/iot/thingspeak', { query: { period, results } });

export const PERIOD_OPTIONS: { value: ThingSpeakPeriod; label: string }[] = [
  { value: 'recent', label: 'Últimos registros' },
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

/** Página pública do canal no ThingSpeak (canais privados pedem login no próprio ThingSpeak). */
export const channelUrl = (id: number | string) => `https://thingspeak.mathworks.com/channels/${id}`;
