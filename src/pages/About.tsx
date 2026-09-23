import { BrainCircuit, Cpu, Database, Server } from 'lucide-react';
import { PageHero } from '../components/layout/PageHero';
import { Architecture, Cycle, FullFlow, Meaning, SectionHead, Sustainability, TechStack, ValeSection } from '../components/landing/Sections';
import { Reveal } from '../components/ui/Reveal';

const ROADMAP = [
  {
    icon: Cpu,
    title: 'ESP32 + câmera real',
    repo: 'Vinicola-back · iot/esp32-cam',
    text: 'Firmware que captura a imagem em intervalos programados e a envia via HTTP (multipart) ou MQTT com o token do dispositivo.',
  },
  {
    icon: Server,
    title: 'API OSAIS (FastAPI)',
    repo: 'Vinicola-back · app/',
    text: 'Endpoints de ingestão, sensores, leituras e autenticação — com o mesmo contrato JSON usado por este frontend.',
  },
  {
    icon: Database,
    title: 'Banco de dados',
    repo: 'Vinicola-bd',
    text: 'Esquemas PostgreSQL e MySQL, visões para os indicadores do dashboard e estrutura equivalente para Firebase.',
  },
  {
    icon: BrainCircuit,
    title: 'Modelo YOLO treinado',
    repo: 'Vinicola-back · ml/',
    text: 'Pipeline de treino com imagens reais das variedades. Basta publicar os pesos e definir OSAIS_DETECTOR=yolo para trocar a simulação pela inferência real.',
  },
];

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="Sobre a OSAIS"
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
            title="Do protótipo à operação."
            text="Este protótipo é totalmente demonstrável sem sensores físicos. A arquitetura já está pronta para conectar os componentes reais:"
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
