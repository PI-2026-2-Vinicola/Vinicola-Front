import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { EmbrapaQuestion, EmbrapaScope } from '../../data/types';
import { useEmbrapaSearch, useIntegrations } from '../../hooks/queries';
import { formatNumber } from '../../lib/format';
import { EMBRAPA_LINKS, TOPICS } from '../../services/embrapa';
import { IntegrationPending, SourceNote } from '../ui/Integration';
import { EmptyState, ErrorState, LoadingBlock } from '../ui/States';

const DEFAULT_TOPIC = TOPICS[0];

function QuestionItem({ item }: { item: EmbrapaQuestion }) {
  const [open, setOpen] = useState(false);
  const answerId = `resposta-${item.id}`;
  // questionHtml, snippetHtml e answerHtml chegam sanitizados pela API OASIS (lista de permissões em app/services/sanitize.py).
  return (
    <li className="qa-item">
      {item.chapter && <span className="qa-chapter">{item.chapter}</span>}
      <h3 dangerouslySetInnerHTML={{ __html: item.questionHtml }} />
      {open ? (
        <div id={answerId} className="qa-answer prose" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
      ) : (
        <div className="qa-snippet" dangerouslySetInnerHTML={{ __html: item.snippetHtml }} />
      )}
      <div className="qa-foot">
        <button type="button" className="link" aria-expanded={open} aria-controls={answerId} onClick={() => setOpen((o) => !o)}>
          {open ? 'Recolher resposta' : 'Ler resposta completa'} <ChevronDown className={open ? 'rot-180' : ''} />
        </button>
        <span className="muted small">
          {item.book ?? 'Coleção 500 Perguntas 500 Respostas'}
          {item.year ? ` (${item.year})` : ''}
          {item.number ? ` · pergunta ${item.number}` : ''}
        </span>
        {item.pdfUrl && (
          <a className="link" href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
            Livro em PDF <ExternalLink />
          </a>
        )}
      </div>
    </li>
  );
}

/** Busca na Coleção 500 Perguntas 500 Respostas da Embrapa (API RespondeAgro), pelo livro sobre uva ou por toda a coleção. */
export function QuestionSearch({ onShowVarieties }: { onShowVarieties: () => void }) {
  const integrations = useIntegrations();
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() || DEFAULT_TOPIC;
  const page = Math.max(1, Number(params.get('pagina')) || 1);
  const scope: EmbrapaScope = params.get('livros') === 'todos' ? 'all' : 'grape';
  const [input, setInput] = useState(q);
  const [inputError, setInputError] = useState<string | null>(null);
  const configured = integrations.data?.embrapa.configured ?? false;
  const search = useEmbrapaSearch(q, page, scope, configured);

  useEffect(() => setInput(q), [q]);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = input.trim();
    if (term.length < 2) return setInputError('Digite pelo menos 2 caracteres.');
    setInputError(null);
    update({ q: term, pagina: null });
  };

  if (integrations.isPending) return <LoadingBlock height={240} />;
  if (integrations.isError) return <ErrorState error={integrations.error} onRetry={() => void integrations.refetch()} />;
  if (!configured)
    return (
      <IntegrationPending
        title="As perguntas e respostas da Embrapa ainda não estão disponíveis neste servidor"
        action={
          <>
            <button className="btn btn-primary btn-sm" onClick={onShowVarieties}>
              Ver as variedades monitoradas
            </button>
            <Link to="/sobre#embrapa" className="btn btn-secondary btn-sm">
              Como a integração funciona
            </Link>
          </>
        }
      >
        <p>
          Este conteúdo vem da API RespondeAgro, da plataforma{' '}
          <a href={EMBRAPA_LINKS.agroapi} target="_blank" rel="noopener noreferrer">
            AgroAPI da Embrapa
          </a>
          , que exige credenciais de acesso. Enquanto elas não forem configuradas, nenhum texto é exibido no lugar, para não ser confundido com informação oficial da Embrapa.
        </p>
        <p className="small">
          Administradores: defina <code>EMBRAPA_CONSUMER_KEY</code> e <code>EMBRAPA_CONSUMER_SECRET</code> no arquivo <code>.env</code> da API e reinicie o serviço.
        </p>
      </IntegrationPending>
    );

  const data = search.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const book = data?.items.find((i) => i.bookId === data.bookId)?.book;

  return (
    <div className="stack">
      <section className="card card-pad qa-search">
        <form className="qa-form" onSubmit={submit} role="search">
          <label htmlFor="qa-q" className="sr-only">
            Buscar nas perguntas e respostas da Embrapa
          </label>
          <div className="input-icon">
            <Search aria-hidden="true" />
            <input
              id="qa-q"
              className="input"
              value={input}
              maxLength={120}
              placeholder="Ex.: poda, irrigação, míldio, colheita"
              onChange={(e) => setInput(e.target.value)}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'qa-q-error' : undefined}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Buscar
          </button>
        </form>
        {inputError && (
          <p id="qa-q-error" className="field-error" role="alert">
            {inputError}
          </p>
        )}
        <div className="qa-options">
          <div className="chip-row" role="group" aria-label="Assuntos sugeridos">
            {TOPICS.map((t) => (
              <button key={t} className="chip" aria-pressed={q.toLowerCase() === t.toLowerCase()} onClick={() => update({ q: t, pagina: null })}>
                {t}
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Livros consultados">
            <button aria-pressed={scope === 'grape'} onClick={() => update({ livros: null, pagina: null })}>
              Livro sobre uva
            </button>
            <button aria-pressed={scope === 'all'} onClick={() => update({ livros: 'todos', pagina: null })}>
              Toda a coleção
            </button>
          </div>
        </div>
      </section>

      <section className="card qa-results" aria-busy={search.isFetching}>
        {search.isPending ? (
          <LoadingBlock height={260} label="Consultando a Embrapa…" />
        ) : search.isError ? (
          <ErrorState error={search.error} onRetry={() => void search.refetch()} />
        ) : data!.items.length === 0 ? (
          <EmptyState icon={<BookOpen aria-hidden="true" />} title={`Nenhuma pergunta encontrada para “${data!.query}”`}>
            {scope === 'grape' ? 'Tente outro termo ou pesquise em toda a coleção.' : 'Tente outro termo.'}
          </EmptyState>
        ) : (
          <>
            <header className="qa-results-head">
              <p>
                <strong>
                  {data!.totalIsExact ? '' : 'mais de '}
                  {formatNumber(data!.total)} {data!.total === 1 ? 'pergunta' : 'perguntas'}
                </strong>{' '}
                para “{data!.query}”{scope === 'grape' && book ? <> no livro <em>{book}</em></> : ' em toda a coleção'}
              </p>
            </header>
            <ol className={`qa-list ${search.isPlaceholderData ? 'is-refreshing' : ''}`}>
              {data!.items.map((item) => (
                <QuestionItem key={item.id} item={item} />
              ))}
            </ol>
            {pages > 1 && (
              <div className="pagination">
                <span>
                  {(page - 1) * data!.pageSize + 1}–{Math.min(page * data!.pageSize, data!.total)} de {formatNumber(data!.total)}
                </span>
                <div className="row">
                  <button className="icon-btn" onClick={() => update({ pagina: String(page - 1) })} disabled={page <= 1} aria-label="Página anterior">
                    <ChevronLeft />
                  </button>
                  <span>
                    Página {page} de {pages}
                  </span>
                  <button className="icon-btn" onClick={() => update({ pagina: String(page + 1) })} disabled={page >= Math.min(pages, 50)} aria-label="Próxima página">
                    <ChevronRight />
                  </button>
                </div>
              </div>
            )}
            <div className="qa-source">
              <SourceNote source={data!.source} fetchedAt={data!.fetchedAt} extra="respostas elaboradas por pesquisadores da Embrapa" />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
