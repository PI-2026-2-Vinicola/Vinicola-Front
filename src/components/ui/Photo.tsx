import { Grape } from 'lucide-react';
import { useState } from 'react';
import type { Photo as PhotoData } from '../../data/photos';

interface PhotoProps {
  photo: PhotoData;
  className?: string;
  /** Carregamento imediato (imagem principal acima da dobra). */
  eager?: boolean;
  /**
   * Crédito sobre a foto (desligado por padrão: a atribuição exigida pelas licenças fica na
   * seção "Créditos das fotografias" da página Sobre). "links" leva ao arquivo e à licença;
   * "text" é só texto (para cartões que já são links).
   */
  credit?: 'links' | 'text' | 'none';
  sizes?: string;
}

/**
 * Fotografia com dimensões declaradas (sem salto de layout), recorte sem distorção (object-fit),
 * texto alternativo e crédito de autoria/licença. Se o arquivo não carregar, mostra um bloco
 * neutro com o nome da imagem no lugar de um espaço vazio ou de um ícone quebrado.
 */
export function Photo({ photo, className = '', eager = false, credit = 'none', sizes }: PhotoProps) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`photo ${className}`}>
      {failed ? (
        <div className="scene photo-fallback" role="img" aria-label={photo.alt}>
          <Grape aria-hidden="true" />
          <span>Imagem indisponível</span>
        </div>
      ) : (
        <img
          className="scene photo-img"
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={photo.focus ? { objectPosition: photo.focus } : undefined}
          onError={() => setFailed(true)}
        />
      )}
      {credit !== 'none' && (
        <figcaption className="photo-credit" title={photo.caption}>
          {credit === 'links' ? (
            <>
              Foto:{' '}
              <a href={photo.source} target="_blank" rel="noopener noreferrer">
                {photo.author}
              </a>{' '}
              ·{' '}
              <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer license">
                {photo.license}
              </a>
            </>
          ) : (
            <>
              Foto: {photo.author} · {photo.license}
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
