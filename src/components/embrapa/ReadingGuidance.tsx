import { BookOpen, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Reading } from '../../data/types';
import { useIntegrations, useReadingGuidance } from '../../hooks/queries';
import { formatNumber } from '../../lib/format';
import { SourceNote } from '../ui/Integration';
import { EmptyState, ErrorState, LoadingBlock } from '../ui/States';
import { QuestionItem } from './QuestionSearch';

/**
 * Liga a análise da imagem (YOLO ou análise de cor) ao conteúdo da Embrapa: para cada anomalia
 * detectada, as perguntas e respostas do livro de uva do RespondeAgro sobre o problema.
 */
export function ReadingGuidancePanel({ reading }: { reading: Reading }) {
  const hasAnomaly = reading.detections.some((d) => d.kind === 'anomalia');
  const integrations = useIntegrations();
  const configured = integrations.data?.embrapa.configured ?? false;
  const guidance = useReadingGuidance(reading.id, hasAnomaly && configured);

  if (!hasAnomaly || integrations.isPending) return null;

  return (
    <section className="card" aria-busy={guidance.isFetching}>
      <div className="card-head card-pad" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="card-title">Orientações da Embrapa para esta leitura</h3>
          <p className="card-sub">Anomalias apontadas pelo modelo ({reading.modelVersion}) consultadas no livro sobre uva da Coleção 500 Perguntas 500 Respostas.</p>
        </div>
      </div>
      {!configured ? (
        <div className="card-pad">
          <p className="muted">
            A consulta à Embrapa ainda não está configurada no servidor, por isso nenhuma orientação é exibida.{' '}
            <Link to="/sobre#embrapa">Como a integração funciona</Link>
          </p>
        </div>
      ) : guidance.isPending ? (
        <LoadingBlock height={200} label="Consultando a Embrapa…" />
      ) : guidance.isError ? (
        <ErrorState error={guidance.error} onRetry={() => void guidance.refetch()} />
      ) : guidance.data.anomalies.length === 0 ? (
        <EmptyState icon={<ShieldCheck aria-hidden="true" />} title="Sem anomalias para consultar">
          {guidance.data.detail ?? 'As detecções desta leitura ficaram abaixo da confiança mínima.'}
        </EmptyState>
      ) : (
        <>
          {guidance.data.anomalies.map((a) => (
            <div key={a.anomaly} className="card-pad">
              <h4 className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className={`badge badge-${a.severe ? 'critica' : 'atencao'}`}>{a.label}</span>
                <span className="muted small">
                  confiança {formatNumber(Math.round(a.confidence * 100))}% · busca “{a.query}” · {formatNumber(a.total)} {a.total === 1 ? 'resultado' : 'resultados'}
                </span>
              </h4>
              {a.items.length === 0 ? (
                <p className="muted small">
                  <BookOpen aria-hidden="true" /> O livro sobre uva não tem perguntas para este termo.
                </p>
              ) : (
                <ol className="qa-list">
                  {a.items.map((item) => (
                    <QuestionItem key={item.id} item={item} />
                  ))}
                </ol>
              )}
              <Link className="link small" to={`/uvas?q=${encodeURIComponent(a.query)}`}>
                Ver mais na aba Uvas
              </Link>
            </div>
          ))}
          <div className="card-pad">
            <SourceNote source={guidance.data.source} fetchedAt={guidance.data.fetchedAt} extra="a detecção automática não substitui a avaliação de um responsável técnico" />
          </div>
        </>
      )}
    </section>
  );
}
