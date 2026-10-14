import { formatBytes } from './format';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Validação local antes do envio (a API valida de novo, inclusive o conteúdo real do arquivo). */
export function validateImageFile(file: { name: string; type: string; size: number }, maxMb: number): string | null {
  const name = file.name.toLowerCase();
  if (/^image\/hei[cf]$/.test(file.type) || /\.(heic|heif)$/.test(name))
    return 'Fotos HEIC/HEIF (padrão de alguns celulares) não são aceitas. Exporte a foto como JPEG e envie novamente.';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Formato não suportado. Envie uma foto JPEG, PNG ou WEBP.';
  if (file.size === 0) return 'O arquivo está vazio.';
  if (file.size > maxMb * 1024 * 1024) return `A imagem tem ${formatBytes(file.size)}; o limite é ${maxMb} MB.`;
  return null;
}

/** Confirma no navegador que o arquivo é uma imagem legível (arquivos corrompidos falham aqui). */
export function decodeImage(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Não foi possível ler a imagem: o arquivo parece corrompido ou não é uma foto válida.'));
    img.src = url;
  });
}
