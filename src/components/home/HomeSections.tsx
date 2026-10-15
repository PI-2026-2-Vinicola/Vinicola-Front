import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Camera,
  ClipboardList,
  FileText,
  Grape,
  History,
  Info,
  LayoutDashboard,
  Lock,
  MessagesSquare,
  Radio,
  ScanSearch,
  Sprout,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { VARIETIES } from '../../data/varieties';
import { usePublicOverview } from '../../hooks/queries';
import { formatNumber, formatRelative } from '../../lib/format';
import { HERO_PHOTO, VARIETY_PHOTOS } from '../../data/photos';
import { VineyardRows } from '../landing/VineyardRows';
import { Photo } from '../ui/Photo';
import { Reveal } from '../ui/Reveal';
import { SectionHead } from '../ui/SectionHead';

/* ------------------------------------------------------------------ apresentação */
const OFFER = [
  { icon: MessagesSquare, title: 'Conteúdo da Embrapa', text: 'Perguntas e respostas sobre o cultivo da uva.' },
  { icon: Radio, title: 'Dados dos sensores', text: 'Leituras publicadas pelos dispositivos do campo.' },
  { icon: Camera, title: 'Análise de fotos', text: 'Regiões do cacho marcadas e explicadas.' },
];

export function HomeHero() {
  const overview = usePublicOverview();
  const o = overview.data && (overview.data.analyses30d > 0 || overview.data.sensorsTotal > 0) ? overview.data : null;
  return (
    <section className="hero home-hero">
      <VineyardRows className="hero-rows" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Projeto Integrador · Vale do São Francisco</span>
          <h1 className="display">
            Do vinhedo à informação, <em>em linguagem simples.</em>
          </h1>
          <p className="hero-sub">
            A OASIS reúne conteúdo técnico sobre o cultivo da uva, dados enviados por sensores instalados no campo e uma ferramenta que analisa fotos de cachos — para que
            estudantes, produtores e visitantes entendam melhor o que acontece no vinhedo.
          </p>
          <div className="hero-ctas">
            <Link to="/uvas" className="btn btn-lg btn-light">
              Conhecer as uvas <ArrowRight className="arrow" />
            </Link>
            <a href="#como-usar" className="btn btn-lg btn-glass">
              Como usar a plataforma
            </a>
          </div>
          {o && (
            <p className="home-hero-numbers">
              Na plataforma: {formatNumber(o.analyses30d)} análises nos últimos 30 dias · {o.sensorsOnline} de {o.sensorsTotal} sensores comunicando
              {o.lastAnalysisAt ? ` · última análise ${formatRelative(o.lastAnalysisAt)}` : ''}
            </p>
          )}
        </div>
        <div className="home-hero-visual">
          <div className="home-hero-frame">
            <Photo photo={HERO_PHOTO} eager sizes="(max-width: 900px) 100vw, 560px" />
          </div>
          <div className="float-card home-hero-card">
            <div className="fr-title">O que você encontra aqui</div>
            <ul>
              {OFFER.map((x) => (
                <li key={x.title}>
                  <x.icon aria-hidden="true" />
                  <span>
                    <strong>{x.title}</strong>
                    {x.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Conhecimento técnico confiável',
    text: 'Perguntas e respostas elaboradas por pesquisadores da Embrapa e épocas de plantio indicadas pelo Zoneamento Agrícola de Risco Climático.',
  },
  { icon: Activity, title: 'Dados do campo', text: 'Leituras que os sensores do vinhedo publicam na plataforma ThingSpeak, com gráficos e o horário da última atualização.' },
  { icon: ScanSearch, title: 'Análise de fotos', text: 'Envie a foto de um cacho e veja as regiões identificadas, a classificação e as observações geradas pelo sistema.' },
];

export function ProjectIntro() {
  return (
    <section className="section" id="projeto">
      <div className="container">
        <SectionHead
          eyebrow="O projeto"
          title="Tecnologia a serviço de quem cultiva — e de quem quer aprender."
          text="A OASIS é uma plataforma acadêmica desenvolvida no Projeto Integrador “Inteligência de Dados no Vale do São Francisco”. Ela foi pensada para tornar mais fácil acompanhar o vinhedo e consultar informação confiável sobre a uva."
        />
        <div className="feature-list">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} className="feature">
              <span className="feature-icon">
                <f.icon aria-hidden="true" />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="acronym-line">
          <span className="acronym-full">
            <b>O</b>bservação <b>A</b>groambiental <b>S</b>ensorizada, <b>I</b>nteligente e <b>S</b>ustentável
          </span>
          <span className="muted">é o que significa o nome OASIS.</span>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ conhecendo as uvas */
const PHENOLOGY = [
  { title: 'Poda', text: 'Define quantas gemas vão brotar e prepara a planta para a nova safra.' },
  { title: 'Brotação', text: 'As gemas se abrem e surgem os ramos e as primeiras folhas.' },
  { title: 'Floração', text: 'Os cachos de flores se abrem; as flores fecundadas darão origem às bagas.' },
  { title: 'Formação das bagas', text: 'As bagas crescem, ainda verdes e firmes.' },
  { title: 'Pintor (véraison)', text: 'As bagas amolecem, mudam de cor e passam a acumular açúcar.' },
  { title: 'Maturação e colheita', text: 'Açúcar, acidez e cor chegam ao ponto desejado para cada uso.' },
];

export function LearnGrapes() {
  return (
    <section className="section section-rose" id="uvas">
      <div className="container">
        <SectionHead eyebrow="Conhecendo as uvas" title="Um fruto antigo, um cultivo cheio de etapas." />
        <div className="learn-grid">
          <Reveal className="learn-text">
            <h3>O que é a uva</h3>
            <p>
              A uva é o fruto da videira, planta do gênero <em>Vitis</em>. A maior parte das uvas usadas para vinho pertence à espécie europeia <em>Vitis vinifera</em>, como
              Cabernet Sauvignon, Syrah e Chenin Blanc. Uvas americanas e híbridas, como Isabel e Niágara, também são muito cultivadas no Brasil, sobretudo para suco, vinho de
              mesa e consumo <em>in natura</em>.
            </p>
            <h3>Uvas de mesa e uvas para processamento</h3>
            <p>
              As uvas de mesa são consumidas frescas e valorizadas pela aparência, pelo sabor e pela firmeza das bagas. As uvas para processamento viram vinho, suco e espumante, e
              são avaliadas sobretudo pelo equilíbrio entre açúcar e acidez.
            </p>
            <div className="vale-callout" id="vale">
              <h3>Uvas no Vale do São Francisco</h3>
              <p>
                O Submédio do Vale do São Francisco, na divisa entre Pernambuco e Bahia, é um dos principais polos de fruticultura irrigada do país e referência na produção de uvas
                de mesa e de vinhos tropicais. Sem inverno rigoroso, é a poda que marca o início de cada ciclo; com o sol forte do Semiárido e a irrigação, é possível colher mais
                de uma safra por ano.
              </p>
            </div>
          </Reveal>
          <Reveal className="phenology-card" delay={120}>
            <h3>Do broto à colheita</h3>
            <ol className="phenology">
              {PHENOLOGY.map((p) => (
                <li key={p.title}>
                  <strong>{p.title}</strong>
                  <span>{p.text}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="variety-strip">
          <div className="row-between">
            <h3>Variedades acompanhadas pelo projeto</h3>
            <Link to="/uvas?aba=variedades" className="link">
              Ver todas <ArrowRight />
            </Link>
          </div>
          <div className="grape-rail">
            {VARIETIES.map((v, i) => (
              <Reveal key={v.id} delay={i * 60}>
                <Link to={`/uvas/${v.id}`} className="grape-mini">
                  <div className="grape-mini-media">
                    <Photo photo={VARIETY_PHOTOS[v.id]} sizes="(max-width: 560px) 50vw, (max-width: 1100px) 33vw, 200px" />
                  </div>
                  <div className="txt">
                    <strong>{v.name}</strong>
                    <span>
                      Uva {v.type.toLowerCase()} · {v.color}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        <p className="ref-line">
          Para se aprofundar:{' '}
          <a href="https://www.embrapa.br/uva-e-vinho" target="_blank" rel="noopener noreferrer">
            Embrapa Uva e Vinho
          </a>
          ,{' '}
          <a href="https://www.embrapa.br/semiarido" target="_blank" rel="noopener noreferrer">
            Embrapa Semiárido
          </a>{' '}
          e as <Link to="/uvas">perguntas e respostas da Embrapa</Link> na aba Uvas.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ como usar */
const STEPS = [
  { icon: Grape, title: 'Consulte as uvas', text: 'Pesquise perguntas e respostas da Embrapa, veja as épocas de plantio indicadas para municípios do Vale e conheça as variedades acompanhadas.', to: '/uvas', login: false },
  { icon: Activity, title: 'Acompanhe o monitoramento', text: 'Veja as leituras mais recentes dos sensores, a hora da última atualização e a evolução de cada medida em gráficos.', to: '/monitoramento', login: true },
  { icon: Camera, title: 'Envie uma foto', text: 'Em Análises, escolha a foto de um cacho, confira a prévia e envie. O sistema marca as regiões identificadas e explica o resultado.', to: '/analises', login: true },
  { icon: ClipboardList, title: 'Consulte os resultados', text: 'No histórico e na classificação, compare as análises ao longo do tempo, filtre por talhão e exporte os dados.', to: '/historico', login: true },
];

export function HowToUse() {
  return (
    <section className="section" id="como-usar">
      <div className="container">
        <SectionHead eyebrow="Como usar" title="Quatro passos para aproveitar a plataforma." />
        <ol className="steps-list">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 80} className="step-item">
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <s.icon className="step-icon" aria-hidden="true" />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <Link to={s.to} className="link">
                {s.login ? 'Acessar (requer login)' : 'Acessar'} <ArrowRight />
              </Link>
            </Reveal>
          ))}
        </ol>
        <p className="muted small how-note">
          <Users size={15} aria-hidden="true" /> As contas de acesso são criadas pelo administrador do projeto. A aba Uvas, esta página e a documentação técnica são abertas a
          todos.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ benefícios */
const BENEFITS = [
  { icon: BookOpen, title: 'Informação confiável em um só lugar', text: 'Conteúdo técnico da Embrapa reunido aos dados do próprio vinhedo, sem precisar procurar em vários sites.' },
  { icon: Radio, title: 'Acompanhamento à distância', text: 'As leituras dos sensores podem ser consultadas a qualquer momento, com a hora exata da última atualização.' },
  { icon: History, title: 'Registro organizado', text: 'Cada análise de foto fica guardada com data, talhão e resultado, o que facilita comparar a evolução ao longo da safra.' },
  { icon: Sprout, title: 'Apoio à conversa com o técnico', text: 'Imagens, leituras e histórico ajudam a decidir o que observar em campo e a dialogar com o responsável técnico.' },
];

export function Benefits() {
  return (
    <section className="section section-rose" id="beneficios">
      <div className="container">
        <SectionHead eyebrow="Por que usar" title="O que a tecnologia pode oferecer — e o que ela não substitui." />
        <div className="benefit-grid">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 70} className="benefit">
              <b.icon aria-hidden="true" />
              <div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="notice" style={{ marginTop: 28 }}>
          <Info />
          <span>
            A OASIS é uma <strong>ferramenta de apoio</strong>. As análises de imagem são computacionais: não substituem a avaliação de um engenheiro agrônomo ou responsável
            técnico e não garantem ganhos de produção.
          </span>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ navegação */
export function Shortcuts() {
  const { user } = useAuth();
  const items = [
    { to: '/uvas', icon: Grape, title: 'Uvas', text: 'Perguntas e respostas da Embrapa, épocas de plantio e variedades.', login: false },
    { to: '/monitoramento', icon: Activity, title: 'Monitoramento', text: 'Leituras dos sensores do campo, com gráficos e atualização automática.', login: true },
    { to: '/analises', icon: BarChart3, title: 'Análise de imagem', text: 'Envio de fotos de cachos e painel com os resultados.', login: true },
    { to: '/historico', icon: History, title: 'Histórico', text: 'Todas as análises, com filtros e exportação.', login: true },
    user
      ? { to: '/dashboard', icon: LayoutDashboard, title: 'Dashboard', text: 'Visão geral de sensores, análises e alertas.', login: true }
      : { to: '/login', icon: Lock, title: 'Entrar', text: 'Acesse as áreas da plataforma com sua conta.', login: false },
    { to: '/sobre', icon: FileText, title: 'Sobre (documentação técnica)', text: 'Arquitetura, integrações, tecnologias e limitações.', login: false },
  ];
  return (
    <section className="section" id="explorar">
      <div className="container">
        <SectionHead eyebrow="Explore" title="Por onde começar." />
        <div className="shortcut-grid">
          {items.map((s, i) => (
            <Reveal key={s.to} delay={i * 50}>
              <Link to={s.to} className="shortcut">
                <span className="kpi-icon">
                  <s.icon aria-hidden="true" />
                </span>
                <span className="shortcut-text">
                  <strong>{s.title}</strong>
                  <span>{s.text}</span>
                </span>
                <span className={`shortcut-tag ${s.login ? 'is-locked' : ''}`}>{s.login ? 'Requer login' : 'Aberto'}</span>
                <ArrowRight className="shortcut-arrow" aria-hidden="true" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
