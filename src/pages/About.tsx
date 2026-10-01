import { BrainCircuit, Cpu, Database, Server } from 'lucide-react';
import { PageHero } from '../components/layout/PageHero';
import { Architecture, Cycle, FullFlow, Meaning, SectionHead, Sustainability, TechStack, ValeSection } from '../components/landing/Sections';
import { Reveal } from '../components/ui/Reveal';

const ROADMAP = [
  {
    icon: Cpu,
    title: 'ESP32 + câmera real',
    repo: 'Vinicola-back · iot/esp32-cam',
    text: 'Firmware que captura a imagem em intervalos programados e a envia via HTTP (multipart) ou MQTT com o token individual do dispositivo, junto com bateria, sinal e — com DHT22 — temperatura e umidade.',
  },
  {
    icon: Server,
    title: 'API OASIS (FastAPI)',
    repo: 'Vinicola-back · app/',
    text: 'Ingestão e análise de imagens, sensores, medições ambientais, importação de arquivos, indicadores, usuários e auditoria — com o mesmo contrato JSON usado por este frontend.',
  },
  {
    icon: Database,
    title: 'Banco de dados',
    repo: 'Vinicola-bd',
    text: 'SQLite, PostgreSQL ou MySQL/MariaDB, com visões analíticas para relatórios e Data Science.',
  },
  {
    icon: BrainCircuit,
    title: 'Modelo YOLO treinado',
    repo: 'Vinicola-back · ml/',
    text: 'Hoje as imagens são analisadas por segmentação de cor. Com imagens anotadas do próprio vinhedo, o pipeline de treino gera os pesos YOLO; ao colocá-los em models/oasis-grapes.pt, a API passa a usá-los automaticamente.',
  },
];

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="Sobre a OASIS"
        title="Observação Agroambiental Sensorizada, Inteligente e Sustentável"
        description="Uma solução de IoT, Inteligência Artificial e visão computacional para monitoramento e classificação de uvas — do vinhedo ao dashboard."
      />
      <Meaning />
      <Cycle />
      <Architecture />
      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="Preparada para o campo real"
            title="Do campo à operação."
            text="Os componentes que levam os dados do vinhedo até o painel:"
          />
          <div className="grid-2">
            {ROADMAP.map((r, i) => (
              <Reveal key={r.title} delay={i * 70} className="card card-pad card-hover">
                <div className="row" style={{ marginBottom: 12 }}>
                  <div className="kpi-icon" style={{ margin: 0 }}>
                    <r.icon />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18 }}>
                      {i + 1}. {r.title}
                    </h3>
                    <span className="mono muted">{r.repo}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--ink-600)', fontSize: 15 }}>{r.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <ValeSection />
      <Sustainability />
      <TechStack />
      <FullFlow />
    </>
  );
}
