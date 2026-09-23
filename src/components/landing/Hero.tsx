import { ArrowRight, BrainCircuit, Camera, ChartNoAxesCombined, Image, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { avgConfidence } from '../../lib/stats';
import { CountUp } from '../ui/CountUp';
import { HeroShowcase } from './HeroShowcase';
import { VineyardRows } from './VineyardRows';

const FLOW = [
  { icon: Camera, title: 'Sensor IoT', text: 'ESP32 + câmera no vinhedo' },
  { icon: Image, title: 'Imagem', text: 'Captura periódica dos cachos' },
  { icon: BrainCircuit, title: 'IA', text: 'Visão computacional com YOLO' },
  { icon: ChartNoAxesCombined, title: 'Análise', text: 'Variedade, qualidade e maturação' },
  { icon: Lightbulb, title: 'Informação', text: 'Indicadores claros para decidir' },
];

export function Hero() {
  const { sensors, readings } = useData();
  const online = sensors.filter((s) => s.status !== 'offline').length;
  return (
    <section className="hero">
      <VineyardRows className="hero-rows" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">IoT · Inteligência Artificial · Visão Computacional</span>
          <h1 className="display">
            Observe o campo. Entenda os dados. <em>Decida melhor.</em>
          </h1>
          <p className="hero-sub">
            A OSAIS conecta sensores, Inteligência Artificial e visão computacional para transformar imagens do cultivo em informações inteligentes sobre as uvas.
          </p>
          <div className="hero-ctas">
            <Link to="/dashboard" className="btn btn-lg btn-light">
              Acessar plataforma <ArrowRight className="arrow" />
            </Link>
            <a href="#solucao" className="btn btn-lg btn-glass">
              Conhecer a solução
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>
                <CountUp value={online} />/{sensors.length}
              </strong>
              <span>sensores ativos</span>
            </div>
            <div>
              <strong>
                <CountUp value={readings.length} />
              </strong>
              <span>análises em 30 dias</span>
            </div>
            <div>
              <strong>
                <CountUp value={6} />
              </strong>
              <span>variedades monitoradas</span>
            </div>
            <div>
              <strong>
                <CountUp value={avgConfidence(readings) * 100} decimals={1} suffix="%" />
              </strong>
              <span>confiança média da IA</span>
            </div>
          </div>
        </div>
        <HeroShowcase />
      </div>
      <div className="hero-flow">
        <div className="container">
          <div className="flow">
            <div className="flow-line" aria-hidden="true" />
            {FLOW.map((f) => (
              <div className="flow-step" key={f.title}>
                <div className="flow-icon">
                  <f.icon />
                </div>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
