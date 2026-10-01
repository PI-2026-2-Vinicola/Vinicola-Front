import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ANOMALY_LABEL, SEVERE_ANOMALIES } from '../../data/labels';
import type { Detection, Reading } from '../../data/types';
import { imageObjectUrl } from '../../services/http';

/** URL local de uma imagem protegida da API (o navegador não envia o token em <img src>). */
export function useAuthImage(apiPath: string | null | undefined) {
  const [state, setState] = useState<{ url: string | null; error: boolean; loading: boolean }>({ url: null, error: false, loading: !!apiPath });
  useEffect(() => {
    if (!apiPath) {
      setState({ url: null, error: false, loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    imageObjectUrl(apiPath)
      .then((url) => alive && setState({ url, error: false, loading: false }))
      .catch(() => alive && setState({ url: null, error: true, loading: false }));
    return () => {
      alive = false;
    };
  }, [apiPath]);
  return state;
}

function boxClass(d: Detection) {
  if (d.kind === 'cacho') return 'det-box cluster';
  return `det-box ${SEVERE_ANOMALIES.has(d.label) ? 'severe' : 'mild'}`;
}

function NoImage({ reading }: { reading: Reading }) {
  const reason =
    reading.source === 'importacao' ? 'Registro importado de arquivo — sem imagem associada.' : reading.source === 'demonstracao' ? 'Registro de demonstração — sem imagem.' : 'Imagem não disponível.';
  return (
    <div className="reading-noimage">
      <ImageOff aria-hidden="true" />
      <span>{reason}</span>
    </div>
  );
}

/** Imagem processada da leitura com as caixas detectadas sobrepostas. */
export function ReadingImage({ reading, thumb = false, showBoxes = true }: { reading: Reading; thumb?: boolean; showBoxes?: boolean }) {
  const path = thumb ? (reading.thumbUrl ?? reading.imageUrl) : reading.imageUrl;
  const { url, error, loading } = useAuthImage(path);
  if (!path) return thumb ? <div className="reading-thumb-empty" aria-label="Sem imagem"><ImageOff aria-hidden="true" /></div> : <NoImage reading={reading} />;
  if (error) return thumb ? <div className="reading-thumb-empty"><ImageOff aria-hidden="true" /></div> : <div className="reading-noimage"><ImageOff aria-hidden="true" /><span>Não foi possível carregar a imagem.</span></div>;
  return (
    <div className={`reading-figure ${thumb ? 'is-thumb' : ''} ${loading ? 'is-loading' : ''}`}>
      {url && <img src={url} alt={`Captura ${reading.id} do sensor ${reading.sensorId}`} loading="lazy" decoding="async" />}
      {url && showBoxes && !thumb && (
        <div className="det-layer" aria-hidden="true">
          {reading.detections.map((d, i) => (
            <div
              key={i}
              className={boxClass(d)}
              style={{ left: `${d.box[0] * 100}%`, top: `${d.box[1] * 100}%`, width: `${d.box[2] * 100}%`, height: `${d.box[3] * 100}%` }}
            >
              <span>
                {d.kind === 'cacho' ? 'cacho' : (ANOMALY_LABEL[d.label] ?? d.label)} {(d.confidence * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
