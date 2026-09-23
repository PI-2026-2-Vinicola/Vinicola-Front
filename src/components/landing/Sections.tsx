import {
  Activity,
  ArrowDown,
  ArrowRight,
  BellRing,
  BrainCircuit,
  Camera,
  ChartPie,
  CircleCheck,
  Cloud,
  Cpu,
  Database,
  Droplets,
  Eye,
  Gauge,
  Grape,
  Image,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  Monitor,
  Radio,
  Recycle,
  Router,
  Scale,
  ScanSearch,
  Server,
  ShieldCheck,
  Sparkles,
  Sprout,
  TestTube,
  Wifi,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { VARIETIES } from '../../data/varieties';
import { useInView } from '../../hooks/useInView';
import { avgConfidence, countByQuality, groupByDay, periodRange, filterReadings } from '../../lib/stats';
import { YoloResult } from '../analysis/YoloResult';
import { QualityEvolutionChart } from '../charts/Charts';
import { GrapeScene } from '../grape/GrapeScene';
import { KpiCard } from '../ui/KpiCard';
import { Reveal } from '../ui/Reveal';
import { VineyardRows } from './VineyardRows';

export function SectionHead({ eyebrow, title, text, center = false }: { eyebrow: string; title: ReactNode; text?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={`section-head ${center ? 'center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="display">{title}</h2>
      {text && <p>{text}</p>}
    </Reveal>
  );
}

/* ------------------------- Significado da marca ------------------------- */
export const PILLARS = [
  { letter: 'O', word: 'Observação', icon: Eye, text: 'Monitoramento contínuo das condições do cultivo.' },
  { letter: 'A', word: 'Agroambiental', icon: Sprout, text: 'Aplicação da tecnologia no contexto agrícola e ambiental.' },
  { letter: 'S', word: 'Sensorizada', icon: Radio, text: 'Coleta de dados por sensores e dispositivos IoT.' },
  { letter: 'I', word: 'Inteligente', icon: BrainCircuit, text: 'Uso de Inteligência Artificial e visão computacional para interpretar os dados.' },
  { letter: 'S', word: 'Sustentável', icon: Leaf, text: 'Uso mais eficiente de recursos, apoio à produção e decisões baseadas em dados.' },
];

export function Meaning() {
  return (
    <section className="section" id="solucao">
      <div className="container">
        <SectionHead
          eyebrow="Significado da marca"
          title="Uma sigla, cinco pilares."
          text={
            <span className="acronym-full">
              <b>O</b>bservação <b>A</b>groambiental <b>S</b>ensorizada, <b>I</b>nteligente e <b>S</b>ustentável
            </span>
          }
        />
        <div className="pillars">
          {PILLARS.map((p, i) => (
            <Reveal key={p.word} delay={i * 90} className="pillar">
              <span className="pillar-icon">
                <p.icon />
              </span>
              <div className="pillar-letter">{p.letter}</div>
              <h3>{p.word}</h3>
              <p>{p.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Ciclo ------------------------------ */
const CYCLE = [
  { title: 'Observar', icon: Eye, text: 'Acompanhar o vinhedo de forma contínua.' },
  { title: 'Sensorizar', icon: Camera, text: 'Registrar imagens com sensores IoT.' },
  { title: 'Analisar', icon: ScanSearch, text: 'Processar as imagens com visão computacional.' },
  { title: 'Inteligir', icon: Lightbulb, text: 'Transformar resultados em informação útil.' },
  { title: 'Sustentar', icon: Leaf, text: 'Apoiar decisões mais eficientes e conscientes.' },
];

export function Cycle() {
  return (
    <section className="section section-rose">
      <div className="container">
        <SectionHead
          eyebrow="Conceito central"
          title={<>Observar → Sensorizar → Analisar → Inteligir → Sustentar</>}
          text="Cada etapa da OSAIS transforma o que acontece no campo em conhecimento — do registro da imagem à decisão do produtor."
          center
        />
        <div className="cycle">
          {CYCLE.map((c, i) => (
            <Reveal key={c.title} delay={i * 110} className="cycle-step">
              <div className="cycle-num">
                <c.icon />
              </div>
              <div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="chain" style={{ justifyContent: 'center', marginTop: 64 }}>
          {['Capturar', 'Processar', 'Analisar', 'Classificar', 'Armazenar', 'Visualizar'].map((s, i, a) => (
            <span key={s} style={{ background: 'none', border: 0, padding: 0, height: 'auto' }}>
              <span>{s}</span>
              {i < a.length - 1 && <ArrowRight style={{ marginLeft: 8 }} />}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- Arquitetura IoT --------------------------- */
type Tier = 'device' | 'comunicacao' | 'edge' | 'cloud' | 'decisao';

const ARCH_CARDS: { tier: Tier; tag: string; title: string; icon: typeof Cpu; text: string; items: string[] }[] = [
  {
    tier: 'device',
    tag: 'Device',
    title: 'ESP32 + Câmera',
    icon: Camera,
    text: 'Instalado na fileira do vinhedo, o dispositivo registra imagens dos cachos em intervalos programados, durante o período de luz. É o ponto de contato entre o mundo físico e o digital.',
    items: ['ESP32-CAM / ESP32-S3', 'Câmera OV2640 · OV5640', 'Captura agendada', 'Deep sleep para economia'],
  },
  {
    tier: 'comunicacao',
    tag: 'Comunicação',
    title: 'Envio dos dados',
    icon: Wifi,
    text: 'A imagem e os metadados (sensor, horário, bateria, sinal) são transmitidos pela rede Wi-Fi da propriedade usando HTTP ou MQTT.',
    items: ['Wi-Fi 2.4 GHz', 'HTTP multipart', 'MQTT (tópicos por sensor)', 'Token por dispositivo'],
  },
  {
    tier: 'edge',
    tag: 'Edge',
    title: 'Processamento inicial',
    icon: Router,
    text: 'Próximo ao dispositivo, um gateway faz a preparação da imagem: descarta capturas escuras ou borradas, redimensiona, comprime e encaminha para a API — economizando banda e processamento.',
    items: ['Checagem de nitidez e luz', 'Redimensionamento 640 px', 'Compressão JPEG', 'Fila offline com reenvio'],
  },
  {
    tier: 'cloud',
    tag: 'Cloud',
    title: 'API, banco de dados, YOLO e dashboard',
    icon: Cloud,
    text: 'Na nuvem, a API recebe as imagens, executa o modelo YOLO para identificar variedade, condição e maturação, armazena o resultado e o histórico no banco de dados e disponibiliza tudo no dashboard.',
    items: ['FastAPI (Python)', 'PostgreSQL · MySQL · Firebase', 'YOLO treinado nas variedades', 'Dashboard web responsivo'],
  },
  {
    tier: 'decisao',
    tag: 'Decisão',
    title: 'Informação para agir',
    icon: Lightbulb,
    text: 'Indicadores, alertas e histórico ajudam produtores e gestores a priorizar inspeções e planejar o manejo — sempre com o olhar técnico da equipe.',
    items: ['Alertas de atenção', 'Histórico por talhão', 'Evolução por variedade'],
  },
];

export function Architecture({ id = 'como-funciona' }: { id?: string }) {
  const [active, setActive] = useState<Tier | null>(null);
  const node = (icon: ReactNode, label: string) => (
    <div className="arch-node">
      <i>{icon}</i>
      {label}
    </div>
  );
  const arrow = (
    <div className="arch-arrow" aria-hidden="true">
      <ArrowDown />
    </div>
  );
  return (
    <section className="section section-dark" id={id}>
      <div className="container">
        <SectionHead
          eyebrow="Arquitetura IoT"
          title="Como a OSAIS funciona?"
          text="Três camadas trabalham juntas para levar a imagem do vinhedo até a decisão: Device, Edge e Cloud."
        />
        <div className="arch">
          <Reveal className="arch-diagram" as="div">
            <div className={`arch-tier ${active === 'device' ? 'is-active' : ''}`}>
              <span className="arch-tier-tag">DEVICE</span>
              {node(<Cpu />, 'ESP32 + CÂMERA')}
            </div>
            {arrow}
            <div className={`arch-tier ${active === 'comunicacao' ? 'is-active' : ''}`} style={{ borderStyle: 'none', padding: '0 18px' }}>
              {node(<Wifi />, 'COMUNICAÇÃO · Wi-Fi · MQTT/HTTP')}
            </div>
            {arrow}
            <div className={`arch-tier ${active === 'edge' ? 'is-active' : ''}`}>
              <span className="arch-tier-tag">EDGE</span>
              {node(<Router />, 'PRÉ-PROCESSAMENTO DA IMAGEM')}
            </div>
            {arrow}
            <div className={`arch-tier ${active === 'cloud' ? 'is-active' : ''}`}>
              <span className="arch-tier-tag">CLOUD</span>
              {node(<Server />, 'INTERNET / API')}
              {node(<Database />, 'BANCO DE DADOS')}
              {node(<BrainCircuit />, 'YOLO / IA')}
              {node(<LayoutDashboard />, 'DASHBOARD')}
            </div>
            {arrow}
            <div className="arch-decision">
              <Lightbulb /> DECISÃO
            </div>
          </Reveal>
          <div className="arch-cards">
            {ARCH_CARDS.map((c, i) => (
              <Reveal key={c.tier} delay={i * 60}>
                <article className={`arch-card ${active === c.tier ? 'is-active' : ''}`} onMouseEnter={() => setActive(c.tier)} onMouseLeave={() => setActive(null)}>
                  <div className="arch-card-head">
                    <div className="kpi-icon">
                      <c.icon />
                    </div>
                    <h3>
                      <small>{c.tag}</small>
                      {c.title}
                    </h3>
                  </div>
                  <p>{c.text}</p>
                  <ul>
                    {c.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ YOLO ------------------------------ */
const DETECTS = [
  { icon: Grape, text: 'Espécie / tipo da uva' },
  { icon: Sparkles, text: 'Variedade' },
  { icon: Eye, text: 'Condição visual' },
  { icon: Gauge, text: 'Qualidade aparente' },
  { icon: Sprout, text: 'Estágio de maturação' },
  { icon: BellRing, text: 'Sinais visuais de problemas' },
  { icon: CircleCheck, text: 'Classificação geral' },
];

export function YoloShowcase() {
  const { readings } = useData();
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const sample = useMemo(() => {
    const pool = readings.filter((r) => r.varietyId === 'cabernet-sauvignon' && r.quality === 'boa' && r.maturation === 'adequada');
    return pool.sort((a, b) => Math.abs(a.confidence - 0.94) - Math.abs(b.confidence - 0.94))[0] ?? readings[0];
  }, [readings]);
  if (!sample) return null;
  return (
    <section className="section" id="yolo">
      <div className="container">
        <SectionHead
          eyebrow="Visão computacional"
          title="Da imagem ao resultado com YOLO."
          text="O modelo YOLO (You Only Look Once) localiza os cachos na imagem capturada pelo sensor e classifica o que vê em uma única passada — rápido o suficiente para acompanhar o ritmo do campo."
        />
        <div className="yolo-grid" ref={ref}>
          <Reveal>
            <div className="yolo-io-label">
              <Image /> Entrada · imagem do sensor
            </div>
            <div className="yolo-input">
              {inView && (
                <GrapeScene
                  className="scene"
                  seed={sample.imageSeed}
                  varietyId={sample.varietyId}
                  detections={sample.detections}
                  capturedAt={sample.capturedAt}
                  sensorId={sample.sensorId}
                  block={sample.block}
                  hud
                  animateBoxes
                />
              )}
            </div>
          </Reveal>
          <div className="yolo-arrow">
            <div className="kpi-icon">
              <ArrowRight />
            </div>
            YOLO
          </div>
          <Reveal delay={150}>
            <div className="yolo-io-label">
              <Sparkles /> Saída · resultado da análise
            </div>
            {inView && <YoloResult reading={{ ...sample, confidence: 0.94 }} animate />}
          </Reveal>
        </div>
        <div className="detect-list">
          {DETECTS.map((d, i) => (
            <Reveal key={d.text} delay={i * 50} className="detect-item">
              <d.icon /> {d.text}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Preview da plataforma ------------------------- */
export function PlatformPreview() {
  const { sensors, readings, now } = useData();
  const recent = filterReadings(readings, { period: '14' }, now);
  const counts = countByQuality(recent);
  const [start, end] = periodRange({ period: '14' }, now);
  const days = groupByDay(recent, start, end);
  const questions = [
    'Onde estão os sensores?',
    'Quantas análises foram feitas?',
    'Quais uvas foram identificadas?',
    'Como está a qualidade das uvas?',
    'Quais análises precisam de atenção?',
    'Como os resultados estão evoluindo?',
  ];
  return (
    <section className="section section-rose">
      <div className="container preview">
        <div>
          <SectionHead eyebrow="Plataforma" title="Tudo o que acontece no vinhedo, em um só painel." text="Indicadores, mapa, histórico e alertas organizados para responder rapidamente às perguntas do dia a dia:" />
          <Reveal>
            <ul className="questions">
              {questions.map((q) => (
                <li key={q}>
                  <CircleCheck /> {q}
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Acessar plataforma <ArrowRight className="arrow" />
            </Link>
          </Reveal>
        </div>
        <Reveal className="preview-board" delay={120}>
          <div className="kpi-grid">
            <KpiCard icon={<Cpu />} label="Sensores ativos" value={sensors.filter((s) => s.status !== 'offline').length} total={String(sensors.length)} />
            <KpiCard icon={<ScanSearch />} label="Análises (14 dias)" value={counts.total} />
            <KpiCard icon={<Gauge />} label="Qualidade geral" value={counts.total ? (counts.boa / counts.total) * 100 : 0} suffix="%" accent="good" />
            <KpiCard icon={<Sparkles />} label="Confiança média" value={avgConfidence(recent) * 100} decimals={1} suffix="%" />
          </div>
          <div className="card card-pad">
            <div className="card-title">Evolução das classificações</div>
            <div className="card-sub" style={{ marginBottom: 12 }}>
              % por dia · últimos 14 dias
            </div>
            <div className="chart-box sm">
              <QualityEvolutionChart days={days} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- Uvas (preview) ---------------------------- */
export function GrapesPreview() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title" style={{ marginTop: 0, marginBottom: 40 }}>
          <SectionHead eyebrow="Biblioteca de variedades" title="Conheça nossas uvas." text="Uma pequena biblioteca educacional com as características e os critérios de classificação de cada variedade monitorada." />
          <Link to="/uvas" className="btn btn-secondary">
            Ver todas as variedades <ArrowRight className="arrow" />
          </Link>
        </div>
        <div className="grape-rail">
          {VARIETIES.map((v, i) => (
            <Reveal key={v.id} delay={i * 60}>
              <Link to={`/uvas/${v.id}`} className="grape-mini" style={{ display: 'block' }}>
                <div className="grape-mini-media">
                  <GrapeScene className="scene" seed={1000 + i * 17} varietyId={v.id} detections={[{ kind: 'cacho', label: '', confidence: 1, box: [0.2, 0.16, 0.6, 0.72] }]} showBoxes={false} title={`Ilustração — ${v.name}`} />
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
    </section>
  );
}

/* ------------------------- Vale do São Francisco ------------------------- */
export function ValeSection({ id = 'vale' }: { id?: string }) {
  const blocks = [
    { icon: Radio, label: 'IoT' },
    { icon: Cloud, label: 'Cloud' },
    { icon: ChartPie, label: 'Data Science' },
    { icon: BrainCircuit, label: 'Inteligência Artificial' },
    { icon: ShieldCheck, label: 'Segurança da Informação' },
    { icon: TestTube, label: 'Qualidade de Software' },
  ];
  return (
    <section className="section section-rose" id={id}>
      <div className="container vale">
        <div className="vale-copy">
          <SectionHead eyebrow="Projeto Integrador" title="OSAIS no Vale do São Francisco." />
          <Reveal>
            <p>
              O Submédio do Vale do São Francisco, na divisa entre Pernambuco e Bahia, é um dos principais polos de fruticultura irrigada do país e referência na produção de uvas —
              de mesa e para vinhos tropicais. O clima semiárido, a alta luminosidade e a irrigação permitem mais de uma safra por ano.
            </p>
            <p>
              A OSAIS está inserida no Projeto Integrador <strong>“Inteligência de Dados no Vale do São Francisco”</strong> e representa a <strong>camada de aquisição, processamento e geração de dados de origem</strong>: os sensores coletam informações do ambiente real que podem alimentar uma arquitetura maior.
            </p>
          </Reveal>
        </div>
        <Reveal className="stackup" delay={120}>
          <div className="stackup-caption">Arquitetura do Projeto Integrador</div>
          <div className="stackup-row">
            {blocks.map((b) => (
              <div key={b.label} className="stackup-block">
                <b.icon /> {b.label}
              </div>
            ))}
          </div>
          <div className="arch-arrow" style={{ color: 'var(--wine-400)' }}>
            <ArrowDown style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div className="stackup-base">
            <strong>
              <Grape /> OSAIS — dados de origem
            </strong>
            <span>Sensores IoT + visão computacional no vinhedo: imagens, leituras e classificações que abastecem as demais camadas.</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- Sustentabilidade ---------------------------- */
const SUSTAIN = [
  { icon: Eye, title: 'Acompanhamento do cultivo', text: 'Leituras periódicas criam um retrato contínuo de cada talhão, complementando as vistorias em campo.' },
  { icon: Recycle, title: 'Redução de desperdícios', text: 'Identificar cachos com problemas mais cedo ajuda a planejar intervenções e a evitar perdas na colheita.' },
  { icon: BellRing, title: 'Identificação antecipada', text: 'Alertas destacam leituras que precisam de atenção para que a equipe priorize a inspeção.' },
  { icon: Droplets, title: 'Melhor uso dos recursos', text: 'Dados por talhão apoiam o direcionamento de mão de obra, insumos e irrigação para onde são necessários.' },
  { icon: Scale, title: 'Decisão baseada em evidências', text: 'Histórico, imagens e indicadores reunidos em um só lugar para decisões mais fundamentadas.' },
  { icon: Activity, title: 'Monitoramento contínuo', text: 'Sensores operando ao longo do dia registram a evolução da maturação e da condição visual.' },
];

export function Sustainability() {
  return (
    <section className="section" id="sustentabilidade">
      <div className="container">
        <SectionHead eyebrow="Sustentabilidade" title="Tecnologia para uma produção mais consciente." text="Dados não substituem o conhecimento de quem cultiva — mas ajudam a enxergar mais cedo, agir com mais precisão e usar melhor cada recurso." />
        <div className="sustain-grid">
          {SUSTAIN.map((s, i) => (
            <Reveal key={s.title} delay={i * 70} className="sustain-card">
              <div className="kpi-icon" style={i % 2 ? { background: 'var(--good-bg)', color: 'var(--good-ink)' } : undefined}>
                <s.icon />
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="notice" style={{ marginTop: 28 }}>
          <Leaf />
          <span>
            A OSAIS é uma <strong>ferramenta de apoio à tomada de decisão</strong>. Seus resultados devem ser interpretados em conjunto com a avaliação técnica da equipe e, sozinhos,
            não garantem a sustentabilidade da produção.
          </span>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Tecnologias ------------------------------ */
export const TECH = [
  { icon: Cpu, title: 'IoT', items: ['ESP32', 'Câmera OV2640 / OV5640', 'Wi-Fi', 'MQTT ou HTTP'] },
  { icon: Router, title: 'Edge', items: ['Processamento inicial', 'Preparação da imagem', 'Comunicação com a API'] },
  { icon: Server, title: 'Backend', items: ['Python', 'FastAPI', 'Pydantic', 'JWT'] },
  { icon: Database, title: 'Banco de dados', items: ['PostgreSQL', 'MySQL', 'Firebase'] },
  { icon: BrainCircuit, title: 'Inteligência Artificial', items: ['YOLO (Ultralytics)', 'Detecção e classificação', 'Treino com as variedades cadastradas'] },
  { icon: Monitor, title: 'Frontend', items: ['React', 'TypeScript', 'HTML e CSS', 'Vite'] },
  { icon: ChartPie, title: 'Visualização', items: ['Chart.js', 'Leaflet (mapa)', 'Indicadores animados'] },
  { icon: ShieldCheck, title: 'Qualidade e segurança', items: ['Testes (Vitest / Pytest)', 'Perfis de acesso', 'Token por dispositivo'] },
];

export function TechStack({ id = 'tecnologias' }: { id?: string }) {
  return (
    <section className="section section-rose" id={id}>
      <div className="container">
        <SectionHead eyebrow="Tecnologias" title="Uma pilha pronta para o campo real." text="O protótipo funciona com dados simulados e está preparado para conectar ESP32 + câmera real, API, banco de dados e um modelo YOLO treinado com imagens reais." />
        <div className="tech-grid">
          {TECH.map((t, i) => (
            <Reveal key={t.title} delay={i * 50} className="tech-card">
              <header>
                <div className="kpi-icon">
                  <t.icon />
                </div>
                <h3>{t.title}</h3>
              </header>
              <ul>
                {t.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Fluxo completo --------------------------- */
const FULL_FLOW = ['Captura', 'Sensor IoT', 'Imagem', 'YOLO', 'Classificação', 'Banco de dados', 'Histórico', 'Dashboard', 'Decisão'];

export function FullFlow() {
  const items = [...FULL_FLOW, ...FULL_FLOW];
  return (
    <div className="marquee" aria-label={FULL_FLOW.join(' → ')}>
      <div className="marquee-track" aria-hidden="true">
        {items.map((s, i) => (
          <span key={i} className="marquee-item">
            {s}
            <ArrowRight />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ CTA final ------------------------------ */
export function FinalCta() {
  return (
    <section className="final">
      <VineyardRows className="final-rows" />
      <div className="container" style={{ position: 'relative' }}>
        <Reveal>
          <span className="eyebrow" style={{ color: 'var(--rose-300)' }}>
            OSAIS
          </span>
          <h2 className="display" style={{ marginTop: 16 }}>
            Do campo aos dados.
          </h2>
          <p>
            A OSAIS conecta observação agroambiental, sensores IoT e Inteligência Artificial para transformar imagens e dados do cultivo em informações inteligentes para apoiar
            decisões mais eficientes e sustentáveis.
          </p>
          <Link to="/dashboard" className="btn btn-lg btn-light">
            Explorar a OSAIS <ArrowRight className="arrow" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
