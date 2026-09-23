import { ArrowRight, Info, LogIn } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DISCLAIMER } from '../components/analysis/ReadingDetail';
import { VarietyHistory } from '../components/analysis/VarietyHistory';
import { PeriodSegmented } from '../components/ui/Filters';
import { Reveal } from '../components/ui/Reveal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { VarietyId } from '../data/types';
import { VARIETIES, VARIETY_BY_ID } from '../data/varieties';
import { filterReadings, timeBuckets, type PeriodPreset } from '../lib/stats';
import { CriteriaList, GrapeImage } from './Grapes';
import NotFound from './NotFound';

export default function GrapeDetail() {
  const { id } = useParams();
  const variety = VARIETY_BY_ID[id as VarietyId];
  const { can } = useAuth();
  const { readings, now } = useData();
  const [period, setPeriod] = useState<PeriodPreset>('30');
  const list = useMemo(() => filterReadings(readings, { varietyId: id as VarietyId, period }, now), [readings, id, period, now]);
  const buckets = useMemo(() => timeBuckets(list, { period }, now), [list, period, now]);
  if (!variety) return <NotFound />;
  const index = VARIETIES.findIndex((v) => v.id === variety.id);
  const next = VARIETIES[(index + 1) % VARIETIES.length];

  return (
    <>
      <section className="page-hero">
        <div className="container" style={{ alignItems: 'center' }}>
          <div style={{ animation: 'fadeUp .7s var(--ease) both', flex: '1 1 380px' }}>
            <nav className="breadcrumb">
              <Link to="/uvas">Uvas</Link>
            </nav>
            <span className="eyebrow">
              Uva {variety.type.toLowerCase()} · {variety.origin}
            </span>
            <h1 className="display">{variety.name}</h1>
            <p>{variety.description}</p>
          </div>
          <div className="grape-hero-media" style={{ animation: 'fadeUp .8s .1s var(--ease) both' }}>
            <GrapeImage variety={variety} seed={77 + index} />
          </div>
        </div>
      </section>
      <div className="container page-body">
        <div className="grid-3">
          <Reveal className="card card-pad">
            <h3 className="card-title" style={{ marginBottom: 14 }}>
              Ficha
            </h3>
            <dl className="kv">
              <dt>Tipo</dt>
              <dd>{variety.type}</dd>
              <dt>Cor</dt>
              <dd>{variety.color}</dd>
              <dt>Maturação</dt>
              <dd>{variety.maturationCycle}</dd>
              <dt>Origem</dt>
              <dd>{variety.origin}</dd>
            </dl>
          </Reveal>
          <Reveal className="card card-pad" delay={60}>
            <h3 className="card-title" style={{ marginBottom: 14 }}>
              Características
            </h3>
            <ul className="bullets">
              {variety.characteristics.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="card card-pad" delay={120}>
            <h3 className="card-title" style={{ marginBottom: 14 }}>
              Características visuais
            </h3>
            <ul className="bullets">
              {variety.visualTraits.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="section-title">
          <div>
            <h2>Critérios de classificação</h2>
            <p>O que a análise computacional considera para cada classificação de {variety.name}.</p>
          </div>
        </div>
        <Reveal className="card card-pad">
          <CriteriaList variety={variety} />
          <div className="notice" style={{ marginTop: 16 }}>
            <Info />
            <span>{DISCLAIMER}</span>
          </div>
        </Reveal>

        <div className="section-title">
          <div>
            <h2>Histórico de análises</h2>
            <p>Total analisado, distribuição e evolução das classificações desta variedade.</p>
          </div>
          {can('analises') && <PeriodSegmented value={period} onChange={setPeriod} />}
        </div>
        {can('analises') ? (
          <VarietyHistory varietyId={variety.id} readings={list} days={buckets} />
        ) : (
          <div className="card restricted">
            <div className="kpi-icon">
              <LogIn />
            </div>
            <h2>Entre para ver o histórico</h2>
            <p>O histórico de análises desta variedade está disponível para usuários autenticados.</p>
            <Link to="/login" state={{ from: `/uvas/${variety.id}` }} className="btn btn-primary">
              Entrar
            </Link>
          </div>
        )}

        <div className="row-between" style={{ marginTop: 32 }}>
          <Link to="/uvas" className="btn btn-secondary">
            Todas as variedades
          </Link>
          <Link to={`/uvas/${next.id}`} className="btn btn-ghost">
            Próxima: {next.name} <ArrowRight className="arrow" />
          </Link>
        </div>
      </div>
    </>
  );
}
