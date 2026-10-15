import cabernetSauvignon from '../assets/fotos/cabernet-sauvignon.jpg';
import cheninBlanc from '../assets/fotos/chenin-blanc.jpg';
import moscatoCanelli from '../assets/fotos/moscato-canelli.jpg';
import syrah from '../assets/fotos/syrah.jpg';
import tempranillo from '../assets/fotos/tempranillo.jpg';
import tourigaNacional from '../assets/fotos/touriga-nacional.jpg';
import valeSaoFrancisco from '../assets/fotos/vale-sao-francisco-petrolina.jpg';
import type { VarietyId } from './types';

/**
 * Fotografias reais do Wikimedia Commons, conferidas em 10/2026: arquivo original, autor, licença
 * livre (CC BY / CC BY-SA) e metadados da câmera (ou acervo institucional, no caso do JKI).
 * As cópias em src/assets/fotos foram apenas redimensionadas (máx. 1200 px) e recomprimidas.
 * A licença exige atribuição: os créditos ficam na seção "Créditos das fotografias" da página Sobre.
 */
export interface Photo {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  /** Ponto de enquadramento quando a foto é recortada (object-position). */
  focus?: string;
}

const BY2 = { license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/deed.pt-br' };
const BY3 = { license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/deed.pt-br' };
const BYSA4 = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br' };

export const HERO_PHOTO: Photo = {
  src: valeSaoFrancisco,
  width: 1200,
  height: 798,
  alt: 'Cachos de uva verde pendurados sob a latada de um parreiral em Petrolina, Pernambuco',
  caption: 'Parreiral em Petrolina (PE), Vale do São Francisco',
  author: 'Otávio Nogueira',
  ...BY2,
  source: 'https://commons.wikimedia.org/wiki/File:Vale_do_S%C3%A3o_Franciscou-Petrolina-PE-UVAS.jpg',
  focus: 'center 35%',
};

export const VARIETY_PHOTOS: Record<VarietyId, Photo> = {
  'cabernet-sauvignon': {
    src: cabernetSauvignon,
    width: 800,
    height: 1200,
    alt: 'Cacho de Cabernet Sauvignon com bagas negro-azuladas na videira',
    caption: 'Cabernet Sauvignon em Lalande-de-Pomerol, Bordeaux (França)',
    author: 'Christophe Eyquem',
    ...BY3,
    source: 'https://commons.wikimedia.org/wiki/File:Grappe_de_raisin_cabernet_sauvignon.jpg',
    focus: 'center 45%',
  },
  syrah: {
    src: syrah,
    width: 1200,
    height: 800,
    alt: 'Cachos de Syrah maduros, de bagas escuras, entre as folhas da videira',
    caption: 'Syrah no vinhedo Hahn, Califórnia (EUA)',
    author: 'Hahn Family Wines',
    ...BY2,
    source: 'https://commons.wikimedia.org/wiki/File:Syrah_grapes_at_Hahn_vineyard.jpg',
    focus: '45% center',
  },
  tempranillo: {
    src: tempranillo,
    width: 1200,
    height: 800,
    alt: 'Bagas de Tempranillo em close, com cacho maduro ao fundo',
    caption: 'Tempranillo na Rioja Alavesa (Espanha)',
    author: 'María Jesús Tomé',
    ...BY2,
    source: 'https://commons.wikimedia.org/wiki/File:Tempranillo_grapes_from_Rioja_Alavesa.jpg',
  },
  'touriga-nacional': {
    src: tourigaNacional,
    width: 640,
    height: 480,
    alt: 'Cachos de Touriga Nacional recém-colhidos sendo selecionados à mão em uma mesa de triagem',
    caption: 'Seleção de Touriga Nacional na colheita, Barão de Nelas (Portugal)',
    author: 'Marina de Brito',
    ...BY2,
    source: 'https://commons.wikimedia.org/wiki/File:Touriga_Nacional_Sorting_the_Touriga_Nacional_Grapes.jpg',
    focus: '70% center',
  },
  'chenin-blanc': {
    src: cheninBlanc,
    width: 800,
    height: 1200,
    alt: 'Cacho de Chenin Blanc com bagas verde-amareladas na videira',
    caption: 'Chenin Blanc no campo — acervo de ampelografia do Julius Kühn-Institut (Alemanha)',
    author: 'Doris Schneider (JKI)',
    ...BYSA4,
    source: 'https://commons.wikimedia.org/wiki/File:VIVC2527_CHENIN_BLANC_Cluster_in_the_field_8949.jpg',
    focus: 'center 40%',
  },
  'moscato-canelli': {
    src: moscatoCanelli,
    width: 1200,
    height: 900,
    alt: 'Cachos de Moscato (Muscat blanc à petits grains) de bagas claras na videira',
    caption: 'Muscat blanc à petits grains — a uva do Moscato Canelli — no Domaine Pater Noster (Tchéquia)',
    author: 'Petrconti',
    ...BYSA4,
    source: 'https://commons.wikimedia.org/wiki/File:Muscat_blanc_%C3%BAroda_2022.jpg',
  },
};

export const PHOTO_CREDITS: Photo[] = [HERO_PHOTO, ...Object.values(VARIETY_PHOTOS)];
