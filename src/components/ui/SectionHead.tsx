import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function SectionHead({ eyebrow, title, text, center = false }: { eyebrow: string; title: ReactNode; text?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={`section-head ${center ? 'center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="display">{title}</h2>
      {text && <p>{text}</p>}
    </Reveal>
  );
}
