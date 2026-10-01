import { Check, Copy, KeyRound } from 'lucide-react';
import { useState } from 'react';

/** Exibe o token do dispositivo, que a API devolve uma única vez. */
export function TokenReveal({ sensorId, token, onDone }: { sensorId: string; token: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="token-reveal">
      <div className="kpi-icon">
        <KeyRound />
      </div>
      <h3>Token do dispositivo {sensorId}</h3>
      <p>
        Copie e grave no firmware (<code>DEVICE_TOKEN</code> em <code>config.h</code>) ou no gateway de edge. <strong>Ele não será exibido novamente</strong> — se perder, gere um novo token na página do sensor.
      </p>
      <div className="token-box">
        <code>{token}</code>
        <button className="btn btn-secondary btn-sm" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <button className="btn btn-primary" onClick={onDone}>
        Concluir
      </button>
    </div>
  );
}
