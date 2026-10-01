import { useSearchParams } from 'react-router-dom';
import { isPeriod, periodQuery, type Period } from './period';

/** Período guardado na URL (?periodo=7 | ?periodo=custom&de=…&ate=…), para links compartilháveis. */
export function usePeriodParams(defaultPeriod: Period = '7') {
  const [params, setParams] = useSearchParams();
  const raw = params.get('periodo');
  const period: Period = isPeriod(raw) ? raw : defaultPeriod;
  const from = params.get('de') ?? '';
  const to = params.get('ate') ?? '';
  const setPeriod = (p: Period, f?: string, t?: string) => {
    const next = new URLSearchParams(window.location.search);
    if (p === defaultPeriod) next.delete('periodo');
    else next.set('periodo', p);
    if (p === 'custom' && f) next.set('de', f);
    else next.delete('de');
    if (p === 'custom' && t) next.set('ate', t);
    else next.delete('ate');
    setParams(next, { replace: true });
  };
  return { period, from, to, setPeriod, query: periodQuery(period, from, to) };
}
