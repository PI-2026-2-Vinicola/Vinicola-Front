import type { Variety, VarietyId } from './types';

/**
 * Biblioteca educacional das variedades cultivadas na propriedade demonstrativa.
 * As cores `chartColor` formam uma paleta categórica validada para daltonismo
 * (protanopia/deuteranopia) e contraste ≥ 3:1 sobre fundo branco.
 */
export const VARIETIES: Variety[] = [
  {
    id: 'cabernet-sauvignon',
    name: 'Cabernet Sauvignon',
    type: 'Tinta',
    color: 'Negro-azulada',
    berryColor: '#3b2456',
    maturationCycle: 'Tardia (ciclo longo)',
    origin: 'Bordeaux, França',
    description:
      'Uma das castas tintas mais cultivadas do mundo. Origina vinhos estruturados, com taninos marcantes e bom potencial de guarda. No Vale do São Francisco, o clima semiárido e a irrigação controlada permitem mais de uma safra por ano.',
    characteristics: [
      'Cachos pequenos a médios, cilíndrico-cônicos',
      'Bagas pequenas e esféricas',
      'Casca espessa e resistente',
      'Alta concentração de taninos e antocianinas',
    ],
    visualTraits: [
      'Coloração negro-azulada uniforme quando madura',
      'Pruína evidente (camada cerosa esbranquiçada)',
      'Bagas firmes e de tamanho homogêneo',
      'Engaço lignificado na maturação',
    ],
    criteria: {
      boa: 'Coloração negro-azulada uniforme, bagas íntegras, firmes e de tamanho homogêneo, com pruína preservada.',
      atencao: 'Bagas avermelhadas ou esverdeadas entre as maduras (maturação desuniforme), pequenas manchas ou tamanho irregular.',
      critica: 'Bagas murchas, rachadas ou com manchas escuras/acinzentadas compatíveis com podridão ou doenças fúngicas.',
    },
    chartColor: '#a3325a',
  },
  {
    id: 'syrah',
    name: 'Syrah',
    type: 'Tinta',
    color: 'Preto-violácea',
    berryColor: '#2c2148',
    maturationCycle: 'Média',
    origin: 'Vale do Rhône, França',
    description:
      'Casta de destaque nos vinhos tropicais do Vale do São Francisco. Adaptou-se muito bem ao clima quente e seco da região, originando vinhos frutados, especiados e de cor intensa.',
    characteristics: [
      'Cachos médios, cilíndricos e alongados',
      'Bagas pequenas a médias, levemente ovaladas',
      'Casca fina a média',
      'Planta vigorosa',
    ],
    visualTraits: [
      'Coloração preto-violácea intensa',
      'Bagas ovaladas com pruína abundante',
      'Cachos moderadamente compactos',
      'Tendência à desidratação quando sobremadura',
    ],
    criteria: {
      boa: 'Cor preto-violácea homogênea, bagas túrgidas e sem lesões aparentes.',
      atencao: 'Início de desidratação em algumas bagas, coloração irregular ou compactação excessiva do cacho.',
      critica: 'Bagas enrugadas em grande parte do cacho, rachaduras ou sinais visuais de podridão.',
    },
    chartColor: '#2a78d6',
  },
  {
    id: 'tempranillo',
    name: 'Tempranillo',
    type: 'Tinta',
    color: 'Negro-azulada com reflexos rubi',
    berryColor: '#3d1a40',
    maturationCycle: 'Precoce',
    origin: 'Rioja e Ribera del Duero, Espanha',
    description:
      'Principal casta da Espanha, de maturação precoce. Produz vinhos equilibrados, com aromas de frutas vermelhas, e integra o portfólio de tintos do semiárido nordestino.',
    characteristics: [
      'Cachos médios a grandes, compactos e alados',
      'Bagas médias e esféricas',
      'Casca espessa',
      'Ciclo curto',
    ],
    visualTraits: [
      'Coloração negro-azulada com reflexos avermelhados',
      'Cachos cônicos, frequentemente com “asa”',
      'Bagas uniformes',
      'Pruína moderada',
    ],
    criteria: {
      boa: 'Cacho compacto com coloração uniforme e bagas íntegras.',
      atencao: 'Compactação excessiva, bagas amassadas ou coloração desigual entre regiões do cacho.',
      critica: 'Bagas rompidas no interior do cacho, escurecimento ou mofo aparente.',
    },
    chartColor: '#eb6834',
  },
  {
    id: 'touriga-nacional',
    name: 'Touriga Nacional',
    type: 'Tinta',
    color: 'Azul-escura',
    berryColor: '#28244f',
    maturationCycle: 'Média',
    origin: 'Douro e Dão, Portugal',
    description:
      'Emblemática casta portuguesa, conhecida pela intensidade aromática — com notas florais de violeta — e pela cor profunda. Tem sido cultivada com sucesso em regiões de clima quente.',
    characteristics: [
      'Cachos pequenos, cônicos e soltos',
      'Bagas pequenas e arredondadas',
      'Casca espessa',
      'Baixa produtividade e alta concentração',
    ],
    visualTraits: [
      'Coloração azul-escura profunda',
      'Cachos soltos e bem arejados',
      'Bagas pequenas e numerosas',
      'Pruína abundante',
    ],
    criteria: {
      boa: 'Cacho solto, bagas pequenas e de cor azul-escura homogênea.',
      atencao: 'Desavinho acentuado (bagas faltantes ou muito pequenas) ou coloração incompleta.',
      critica: 'Bagas secas, manchadas ou com lesões visíveis em várias regiões do cacho.',
    },
    chartColor: '#1a9aa0',
  },
  {
    id: 'chenin-blanc',
    name: 'Chenin Blanc',
    type: 'Branca',
    color: 'Verde-amarelada',
    berryColor: '#c9d27a',
    maturationCycle: 'Média a tardia',
    origin: 'Vale do Loire, França',
    description:
      'Casta branca versátil, muito utilizada no Vale do São Francisco para vinhos brancos tranquilos e espumantes. Apresenta boa acidez e aromas de maçã, pera e abacaxi.',
    characteristics: [
      'Cachos médios, compactos e cônicos',
      'Bagas médias e ovaladas',
      'Casca fina — mais sensível a podridões',
      'Boa acidez natural',
    ],
    visualTraits: [
      'Coloração verde-amarelada, dourada na maturação plena',
      'Bagas translúcidas',
      'Cachos compactos',
      'Possíveis pontos acastanhados por sol intenso',
    ],
    criteria: {
      boa: 'Bagas verde-amareladas translúcidas, íntegras e de tamanho regular.',
      atencao: 'Bagas muito verdes junto a maduras, manchas de queimadura solar ou compactação excessiva.',
      critica: 'Bagas acastanhadas, rachadas ou com mofo acinzentado — padrão compatível com podridão.',
    },
    chartColor: '#6b4fc8',
  },
  {
    id: 'moscato-canelli',
    name: 'Moscato Canelli',
    type: 'Branca',
    color: 'Amarelo-dourada',
    berryColor: '#e3c46e',
    maturationCycle: 'Precoce',
    origin: 'Piemonte, Itália',
    description:
      'Casta aromática de uvas brancas, base dos espumantes moscatéis — produto em que o Vale do São Francisco é referência nacional. Aromas florais e de frutas tropicais.',
    characteristics: [
      'Cachos médios e cilíndricos',
      'Bagas médias e esféricas',
      'Alta intensidade aromática (terpenos)',
      'Casca fina',
    ],
    visualTraits: [
      'Coloração amarelo-dourada',
      'Bagas redondas e translúcidas',
      'Cachos medianamente compactos',
      'Pontos âmbar na maturação avançada',
    ],
    criteria: {
      boa: 'Bagas douradas, íntegras, com coloração uniforme e boa turgidez.',
      atencao: 'Maturação desuniforme (bagas esverdeadas), pequenas manchas ou danos superficiais.',
      critica: 'Bagas escurecidas, rompidas ou com sinais de podridão e desidratação.',
    },
    chartColor: '#d4588a',
  },
];

export const VARIETY_BY_ID = Object.fromEntries(VARIETIES.map((v) => [v.id, v])) as Record<VarietyId, Variety>;

export const varietyName = (id: VarietyId) => VARIETY_BY_ID[id]?.name ?? id;

/** Rótulo de classe do modelo YOLO (snake_case, como no dataset de treinamento). */
export const yoloClass = (id: VarietyId) => id.replace(/-/g, '_');

/** Tons usados na ilustração procedural das bagas (escuro, médio, claro) e se a variedade tem pruína. */
export const GRAPE_TONES: Record<VarietyId, { dark: string; mid: string; light: string; bloom: boolean }> = {
  'cabernet-sauvignon': { dark: '#150c24', mid: '#2e1f4c', light: '#6a5a92', bloom: true },
  syrah: { dark: '#110b20', mid: '#271d45', light: '#5d5288', bloom: true },
  tempranillo: { dark: '#1d0a22', mid: '#3f1a40', light: '#7a4470', bloom: true },
  'touriga-nacional': { dark: '#100e2a', mid: '#262458', light: '#5c5a9c', bloom: true },
  'chenin-blanc': { dark: '#8d9d3c', mid: '#c4cf70', light: '#f0f4c4', bloom: false },
  'moscato-canelli': { dark: '#b58a2c', mid: '#e0bf62', light: '#faebb0', bloom: false },
};
