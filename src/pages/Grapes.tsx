import { CalendarRange, Grape, MessagesSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { QuestionSearch } from '../components/embrapa/QuestionSearch';
import { ZarcPanel } from '../components/embrapa/ZarcPanel';
import { VarietyLibrary } from '../components/grape/VarietyLibrary';
import { PageHero } from '../components/layout/PageHero';

const TABS = [
  { id: 'perguntas', label: 'Perguntas e respostas', icon: MessagesSquare, hint: 'Conteúdo técnico da Embrapa sobre o cultivo da uva.' },
  { id: 'plantio', label: 'Época de plantio (Zarc)', icon: CalendarRange, hint: 'Janelas de plantio de menor risco climático por município.' },
  { id: 'variedades', label: 'Variedades monitoradas', icon: Grape, hint: 'As uvas do catálogo usado nas análises da OASIS.' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Grapes() {
  const [params, setParams] = useSearchParams();
  const tab: TabId = TABS.find((t) => t.id === params.get('aba'))?.id ?? 'perguntas';
  const setTab = (id: TabId) => setParams(id === 'perguntas' ? {} : { aba: id }, { replace: true });

  return (
    <>
      <PageHero
        eyebrow="Viticultura"
        title="Uvas"
        description="Perguntas e respostas da Embrapa sobre o cultivo da uva, épocas de plantio indicadas pelo Zoneamento Agrícola de Risco Climático e as variedades acompanhadas pelo projeto."
      />
      <div className="container page-body">
        <div className="card grape-tabs">
          <div className="tabs" role="tablist" aria-label="Seções da página Uvas">
            {TABS.map((t) => (
              <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`painel-${t.id}`} onClick={() => setTab(t.id)}>
                <t.icon aria-hidden="true" /> {t.label}
              </button>
            ))}
          </div>
          <p className="grape-tabs-hint">{TABS.find((t) => t.id === tab)!.hint}</p>
        </div>
        <div role="tabpanel" id={`painel-${tab}`} aria-labelledby={`tab-${tab}`} className="grape-panel">
          {tab === 'perguntas' && <QuestionSearch onShowVarieties={() => setTab('variedades')} />}
          {tab === 'plantio' && <ZarcPanel />}
          {tab === 'variedades' && <VarietyLibrary />}
        </div>
      </div>
    </>
  );
}
