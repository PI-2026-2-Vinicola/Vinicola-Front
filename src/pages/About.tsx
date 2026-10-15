import { ArchitectureMap, DocSection, ExtLink, FeatureStatus, StatusBadge } from '../components/about/AboutSections';
import { PageHero } from '../components/layout/PageHero';
import { PHOTO_CREDITS } from '../data/photos';
import { useIntegrations } from '../hooks/queries';

const TOC = [
  ['visao-geral', 'A', 'Visão geral técnica'],
  ['arquitetura', 'B', 'Arquitetura'],
  ['thingspeak', 'C', 'Integração com o ThingSpeak'],
  ['embrapa', 'D', 'Integração com a Embrapa'],
  ['yolo', 'E', 'Visão computacional (YOLO)'],
  ['tecnologias', 'F', 'Tecnologias'],
  ['fluxo', 'G', 'Fluxo de dados'],
  ['seguranca', 'H', 'Segurança e confiabilidade'],
  ['referencias', 'I', 'Referências'],
  ['fotografias', 'J', 'Créditos das fotografias'],
] as const;

const MODEL_CLASSES = [
  ['cabernet_sauvignon, syrah, tempranillo, touriga_nacional, chenin_blanc, moscato_canelli', 'Cacho da variedade', 'Identifica a variedade'],
  ['maturacao_desigual, baga_irregular, mancha_leve', 'Anomalia leve', 'Atenção (EM OBSERVAÇÃO)'],
  ['podridao, baga_murcha, lesao', 'Anomalia grave', 'Necessita atenção (REVISÃO NECESSÁRIA)'],
];

const TECH: [string, string[]][] = [
  ['Frontend', ['React 19 e TypeScript 7', 'Vite 8', 'React Router 7', 'TanStack Query 5 (cache e atualização automática)', 'Chart.js 4 (react-chartjs-2)', 'Leaflet 1.9 (react-leaflet)', 'lucide-react, Inter e Fraunces', 'Vitest']],
  ['Backend', ['Python 3.11+', 'FastAPI e Uvicorn', 'SQLAlchemy 2', 'Pydantic 2 e pydantic-settings', 'PyJWT', 'Pillow e NumPy (imagens)', 'httpx (serviços externos)', 'openpyxl (planilhas)', 'pytest']],
  ['Banco de dados', ['SQLite (padrão de desenvolvimento)', 'PostgreSQL 16', 'MySQL / MariaDB', 'Scripts e visões analíticas no Vinicola-bd']],
  ['Inteligência artificial', ['Ultralytics YOLO (opcional, requirements-ml.txt)', 'Pipeline de treino e inferência em ml/', 'Análise de cor em HSV (NumPy)']],
  ['IoT', ['Firmware Arduino para ESP32-CAM (HTTP multipart ou MQTT)', 'Gateway de edge em FastAPI com fila offline', 'ThingSpeak (canais e API REST)']],
  ['Serviços e infraestrutura', ['Embrapa AgroAPI: RespondeAgro v1 e Agritec v2', 'Docker e Docker Compose (API, PostgreSQL e edge)']],
];

const REFS: [string, [string, string][]][] = [
  [
    'Integrações',
    [
      ['ThingSpeak — Read Data (API REST)', 'https://www.mathworks.com/help/thingspeak/readdata.html'],
      ['ThingSpeak — MQTT Basics', 'https://www.mathworks.com/help/thingspeak/mqtt-basics.html'],
      ['Embrapa AgroAPI — portal', 'https://www.agroapi.cnptia.embrapa.br/portal/'],
      ['AgroAPI — primeiros passos (OAuth2)', 'https://www.agroapi.cnptia.embrapa.br/portal/assets/docs/agroapi-primeiros-passos.pdf'],
      ['API RespondeAgro — documentação', 'https://www.agroapi.cnptia.embrapa.br/portal/assets/docs/respondeagro.pdf'],
      ['API Agritec — documentação', 'https://www.agroapi.cnptia.embrapa.br/portal/assets/docs/agritec.pdf'],
      ['Zoneamento Agrícola de Risco Climático — MAPA', 'https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico'],
    ],
  ],
  [
    'Bibliotecas e ferramentas',
    [
      ['Ultralytics YOLO', 'https://docs.ultralytics.com/'],
      ['FastAPI', 'https://fastapi.tiangolo.com/'],
      ['SQLAlchemy 2', 'https://docs.sqlalchemy.org/en/20/'],
      ['Pydantic', 'https://docs.pydantic.dev/latest/'],
      ['HTTPX', 'https://www.python-httpx.org/'],
      ['React', 'https://react.dev/'],
      ['Vite', 'https://vite.dev/'],
      ['TanStack Query', 'https://tanstack.com/query/latest'],
      ['Chart.js', 'https://www.chartjs.org/docs/latest/'],
      ['Leaflet', 'https://leafletjs.com/'],
    ],
  ],
  [
    'Código-fonte',
    [
      ['Organização PI 2026.2 — Vinícola (GitHub)', 'https://github.com/PI-2026-2-Vinicola'],
      ['Vinicola-Front', 'https://github.com/PI-2026-2-Vinicola/Vinicola-Front'],
      ['Vinicola-back', 'https://github.com/PI-2026-2-Vinicola/Vinicola-back'],
      ['Vinicola-bd', 'https://github.com/PI-2026-2-Vinicola/Vinicola-bd'],
    ],
  ],
];

export default function About() {
  const integrations = useIntegrations();
  const s = integrations.data;
  const live = (configured: boolean | undefined) =>
    configured === undefined ? null : configured ? <StatusBadge level="ok" label="Configurado neste servidor" /> : <StatusBadge level="pending" label="Não configurado neste servidor" />;

  return (
    <>
      <PageHero
        eyebrow="Documentação técnica"
        title="Como a OASIS funciona"
        description="Arquitetura, integrações e recursos computacionais da plataforma, descritos conforme a implementação atual dos repositórios Vinicola-Front, Vinicola-back e Vinicola-bd."
      />
      <div className="container page-body">
        <div className="doc-layout">
          <nav className="card doc-toc" aria-label="Sumário">
            <strong>Nesta página</strong>
            <ol>
              {TOC.map(([id, letter, title]) => (
                <li key={id}>
                  <a href={`#${id}`}>
                    <span>{letter}</span> {title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="doc-content">
            <DocSection id="visao-geral" letter="A" title="Visão geral técnica">
              <p>
                A OASIS combina uma aplicação web, uma API REST e integrações com serviços externos para reunir três tipos de dado: imagens de cachos analisadas por visão
                computacional, leituras de sensores publicadas no ThingSpeak e conteúdo técnico da Embrapa. O código está dividido em três repositórios:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Repositório</th>
                      <th>Responsabilidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="mono">Vinicola-Front</td>
                      <td>Aplicação web (SPA): página inicial, Uvas, Sobre e a área logada (dashboard, sensores, monitoramento, análises, histórico, importação e administração).</td>
                    </tr>
                    <tr>
                      <td className="mono">Vinicola-back</td>
                      <td>API FastAPI, análise de imagens, integrações com ThingSpeak e Embrapa, firmware ESP32-CAM, gateway de edge e pipeline de treino YOLO.</td>
                    </tr>
                    <tr>
                      <td className="mono">Vinicola-bd</td>
                      <td>Esquema do banco para PostgreSQL e MySQL, visões analíticas, consultas e uma proposta de estrutura para Firebase.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h3>Situação das funcionalidades</h3>
              <FeatureStatus status={s} />
            </DocSection>

            <DocSection id="arquitetura" letter="B" title="Arquitetura da aplicação">
              <ArchitectureMap status={s} />
              <p>
                A API concentra as regras de negócio e a autorização: perfis <code>admin</code>, <code>gestor</code> e <code>operador</code> são verificados no servidor em
                cada rota. O contrato JSON usa camelCase e é o mesmo tipado no frontend (<code>src/data/types.ts</code>). As leituras, sensores, medições ambientais,
                importações e a auditoria ficam no banco relacional; as imagens, em disco.
              </p>
            </DocSection>

            <DocSection id="thingspeak" letter="C" title="Integração com o ThingSpeak" status={live(s?.thingspeak.configured)}>
              <p>
                A página <strong>Monitoramento</strong> (área logada) exibe os dados do canal do ThingSpeak configurado no servidor. O frontend chama{' '}
                <code>GET /api/v1/iot/thingspeak</code>; a API consulta <code>GET https://api.thingspeak.com/channels/&#123;id&#125;/feeds.json</code> e devolve os dados
                validados.
              </p>
              <ul className="bullets">
                <li>
                  <strong>Períodos:</strong> últimos N registros (<code>results</code>) ou amostragem de 24 h, 7 dias e 30 dias (<code>days</code> + <code>timescale</code>:
                  primeiro registro de cada janela de 10 min, 1 h ou 4 h). A média do ThingSpeak (<code>average</code>) não é usada porque trata valores NaN como zero.
                </li>
                <li>
                  <strong>Campos:</strong> field1 a field8 aparecem com o nome definido no próprio canal. A unidade só é exibida quando informada em{' '}
                  <code>THINGSPEAK_FIELD_UNITS</code>; nenhuma grandeza é presumida. Valores são convertidos para número (vírgula decimal aceita); texto, NaN e vazios são
                  descartados nos gráficos.
                </li>
                <li>
                  <strong>Atualização:</strong> cache de 15 s no servidor (intervalo mínimo de atualização de um canal no plano gratuito) e atualização automática no painel a
                  cada <code>THINGSPEAK_REFRESH_SECONDS</code> (padrão 60 s), com o horário da última leitura e da última consulta.
                </li>
                <li>
                  <strong>Falhas:</strong> acesso negado (resposta <code>-1</code> ou 401), canal inexistente (404), limite de requisições (429) e tempo esgotado viram mensagens
                  claras. Se houver uma resposta válida de até 1 hora, ela é exibida marcada como desatualizada.
                </li>
                <li>
                  <strong>Credenciais:</strong> canal público precisa apenas de <code>THINGSPEAK_CHANNEL_ID</code>; canal privado precisa também da{' '}
                  <code>THINGSPEAK_READ_API_KEY</code>. As credenciais MQTT (client ID, usuário e senha) autenticam dispositivos no broker MQTT para publicar ou assinar
                  tópicos e não são aceitas pela API REST de leitura, por isso a API não as usa.
                </li>
                <li>Os valores do ThingSpeak são consultados sob demanda e não são gravados no banco da OASIS.</li>
              </ul>
            </DocSection>

            <DocSection id="embrapa" letter="D" title="Integração com a Embrapa (RespondeAgro e Agritec v2)" status={live(s?.embrapa.configured)}>
              <p>
                A aba <strong>Uvas</strong> consome duas APIs da plataforma AgroAPI da Embrapa, sempre por meio da API OASIS. A autenticação segue o fluxo OAuth2 client
                credentials documentado: <code>POST https://api.cnptia.embrapa.br/token</code> com a consumer key e o consumer secret da aplicação; o token (válido por 3.600 s)
                é reutilizado e renovado automaticamente.
              </p>
              <ul className="bullets">
                <li>
                  <strong>RespondeAgro v1</strong> — busca na Coleção 500 Perguntas 500 Respostas: <code>POST /respondeagro/v1/_search/template</code> com os templates{' '}
                  <code>query_one_book</code> (livro <code>uva</code>) e <code>query_all</code>, e <code>GET /respondeagro/v1/_doc/&#123;id&#125;</code>. A resposta traz
                  pergunta, resposta em HTML, capítulo, livro, ano e links do livro em PDF e EPUB. O HTML é sanitizado no servidor por lista de permissões (scripts, eventos e links
                  inseguros são removidos; imagens em base64 são mantidas).
                </li>
                <li>
                  <strong>Agritec v2</strong> — Zoneamento Agrícola de Risco Climático: <code>GET /agritec/v2/culturas</code> (culturas com “uva” no nome, sem identificadores
                  fixos no código), <code>GET /agritec/v2/zoneamento</code> (<code>idCultura</code>, <code>codigoIBGE</code>, <code>risco=todos</code>),{' '}
                  <code>/culturas/&#123;id&#125;/informacoes-adicionais</code> e <code>/solos</code>, para oito municípios do Submédio São Francisco.
                </li>
                <li>
                  <strong>Rotas OASIS (públicas):</strong> <code>/api/v1/embrapa/questions</code>, <code>/questions/&#123;id&#125;</code>, <code>/books</code>,{' '}
                  <code>/zarc/cultures</code>, <code>/zarc</code> e <code>/municipalities</code>.
                </li>
                <li>
                  <strong>Limites de uso:</strong> segundo a documentação oficial, o RespondeAgro é gratuito até 100 mil requisições por mês e o Agritec, por um mês e até 1.000
                  requisições. Por isso as respostas ficam em cache (24 h e 7 dias), as consultas públicas são limitadas a 30 por minuto por IP e, se a AgroAPI falhar, a última
                  resposta obtida é reaproveitada.
                </li>
                <li>
                  <strong>Limitações:</strong> cultivares, adubação e produtividade do Agritec atendem 12 e 5 culturas que não incluem a uva — por isso só o Zarc é usado. O
                  RespondeAgro busca em um livro ou em todos, não em subconjuntos. Sem credenciais, a aba Uvas informa a indisponibilidade em vez de exibir conteúdo substituto.
                </li>
              </ul>
            </DocSection>

            <DocSection
              id="yolo"
              letter="E"
              title="Visão computacional com YOLO"
              status={s ? <StatusBadge level={s.yoloLoaded ? 'ok' : 'partial'} label={s.yoloLoaded ? 'YOLO em uso' : 'Análise de cor em uso'} /> : null}
            >
              <ol className="doc-flow">
                <li>No navegador: foto JPEG, PNG ou WEBP de até 8 MB, verificada antes do envio (formato, tamanho e leitura da imagem) e exibida em prévia.</li>
                <li>
                  <code>POST /api/v1/ingest</code> (multipart, associado a um sensor/talhão): a API decodifica a imagem de fato (limite de 40 MP), corrige a orientação e remove
                  metadados EXIF, inclusive GPS.
                </li>
                <li>O detector roda fora do laço de eventos da API, com tempo limite de 30 s (<code>OASIS_ANALYSIS_TIMEOUT_SECONDS</code>).</li>
                <li>Regras de classificação transformam as detecções em qualidade, condição visual, maturação e observações.</li>
                <li>A imagem (até 1600 px) e a miniatura são gravadas; a resposta traz as caixas normalizadas (x, y, largura, altura entre 0 e 1), exibidas sobre a foto.</li>
              </ol>
              <p>
                <strong>Detectores.</strong> Sem modelo treinado, a API usa a <strong>análise de cor (HSV)</strong>, que localiza a região do cacho e mede manchas acastanhadas,
                mofo acinzentado e bagas fora de cor; a variedade é a cadastrada no talhão do sensor e o índice exibido não é uma probabilidade. Quando o arquivo{' '}
                <code>models/oasis-grapes.pt</code> existir, o <strong>YOLO (Ultralytics)</strong> passa a ser usado automaticamente, com estas classes previstas em{' '}
                <code>ml/dataset.yaml</code>:
              </p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Classes</th>
                      <th>Tipo</th>
                      <th>Efeito na classificação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODEL_CLASSES.map(([classes, kind, effect]) => (
                      <tr key={kind}>
                        <td className="mono">{classes}</td>
                        <td>{kind}</td>
                        <td>{effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Modelos sem nenhuma classe da OASIS — como os modelos genéricos treinados no COCO — são recusados, e classes fora do catálogo são descartadas, para que a saída de
                um modelo genérico nunca seja apresentada como variedade ou anomalia. Anomalias com confiança abaixo de 0,5 não alteram a classificação.
              </p>
              <p>
                <strong>Situação atual:</strong> nenhum peso treinado foi publicado. A integração foi verificada com a biblioteca Ultralytics 8.4 usando um modelo genérico
                apenas para conferir o código (o modelo foi recusado e nenhuma detecção foi aceita, como esperado). O treino depende de imagens do vinhedo anotadas e validadas por
                um responsável técnico (<code>ml/README.md</code>). O resultado é uma análise computacional, não um diagnóstico fitossanitário.
              </p>
            </DocSection>

            <DocSection id="tecnologias" letter="F" title="Tecnologias utilizadas">
              <div className="tech-columns">
                {TECH.map(([group, items]) => (
                  <div key={group}>
                    <h3>{group}</h3>
                    <ul className="bullets">
                      {items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="fluxo" letter="G" title="Fluxo de dados">
              <div className="flow-cards">
                <div>
                  <h3>Imagens</h3>
                  <p>Dispositivo (token) ou usuário → <code>/ingest</code> → validação e limpeza → detector → classificação → banco e disco → histórico, indicadores e páginas.</p>
                </div>
                <div>
                  <h3>Sensores (ThingSpeak)</h3>
                  <p>Dispositivo → canal do ThingSpeak → API OASIS (consulta REST com cache) → Monitoramento, com atualização automática.</p>
                </div>
                <div>
                  <h3>Conteúdo da Embrapa</h3>
                  <p>AgroAPI (RespondeAgro e Agritec) → API OASIS (OAuth2, cache e sanitização do HTML) → aba Uvas, com a fonte e a data da consulta.</p>
                </div>
                <div>
                  <h3>Importação</h3>
                  <p>CSV, Excel ou JSON → pré-visualização validada no servidor → gravação em transação → histórico de importações e auditoria.</p>
                </div>
              </div>
            </DocSection>

            <DocSection id="seguranca" letter="H" title="Segurança e confiabilidade">
              <ul className="bullets">
                <li>
                  <strong>Credenciais:</strong> ficam em variáveis de ambiente (<code>.env</code>, fora do controle de versão; <code>.env.example</code> sem valores) e nunca são
                  enviadas ao navegador. Os registros de URL da biblioteca HTTP são silenciados para que a Read API Key do ThingSpeak não apareça nos logs.
                </li>
                <li>
                  <strong>Acesso:</strong> JWT com expiração, perfis verificados no servidor, bloqueio após tentativas de login e token individual por dispositivo (guardado como
                  hash).
                </li>
                <li>
                  <strong>Entradas:</strong> validação dos dados recebidos, limite de tamanho e decodificação real das imagens, remoção de metadados, consultas parametrizadas e
                  CSV exportado protegido contra fórmulas.
                </li>
                <li>
                  <strong>Conteúdo externo:</strong> HTML sanitizado por lista de permissões; links externos abertos com <code>rel="noopener noreferrer"</code>.
                </li>
                <li>
                  <strong>Resiliência:</strong> tempos limite (ThingSpeak 10 s, AgroAPI 15 s, análise 30 s), cache, reaproveitamento da última resposta válida, limite de consultas
                  públicas e mensagens de erro em português sem detalhes internos.
                </li>
                <li>
                  <strong>Cabeçalhos:</strong> <code>X-Content-Type-Options</code>, <code>X-Frame-Options</code>, <code>Referrer-Policy</code> e{' '}
                  <code>Cache-Control: no-store</code> nas respostas da API; CORS restrito às origens configuradas.
                </li>
              </ul>
            </DocSection>

            <DocSection id="referencias" letter="I" title="Referências e documentação">
              <div className="ref-columns">
                {REFS.map(([group, links]) => (
                  <div key={group}>
                    <h3>{group}</h3>
                    <ul className="ref-list">
                      {links.map(([label, href]) => (
                        <li key={href}>
                          <ExtLink href={href}>{label}</ExtLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection id="fotografias" letter="J" title="Créditos das fotografias">
              <p>
                As fotos de uvas e videiras são fotografias reais publicadas no Wikimedia Commons sob licenças Creative Commons, que permitem o uso com atribuição. As cópias usadas
                no site foram apenas redimensionadas; o autor e a licença de cada uma estão na lista abaixo.
              </p>
              <ul className="ref-list photo-credits">
                {PHOTO_CREDITS.map((p) => (
                  <li key={p.source}>
                    <strong>{p.caption}</strong> — foto de {p.author}, <ExtLink href={p.licenseUrl}>{p.license}</ExtLink> ·{' '}
                    <ExtLink href={p.source}>arquivo original</ExtLink>
                  </li>
                ))}
              </ul>
            </DocSection>
          </div>
        </div>
      </div>
    </>
  );
}
