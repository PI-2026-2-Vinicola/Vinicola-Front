import type { AgritecCulture, AgritecZarc, EmbrapaQuestion, EmbrapaScope, EmbrapaSearch, Municipality } from '../data/types';
import { http } from './http';

/**
 * Conteúdo da Embrapa (AgroAPI), sempre pela API OASIS, que guarda as credenciais OAuth2,
 * mantém cache e sanitiza o HTML das respostas. Rotas públicas: não enviam a sessão do usuário.
 */
export const searchQuestions = (q: string, page = 1, scope: EmbrapaScope = 'grape', pageSize = 8) =>
  http<EmbrapaSearch>('/embrapa/questions', { query: { q, page, pageSize, scope }, anonymous: true });

export const getQuestion = (id: string) => http<EmbrapaQuestion>(`/embrapa/questions/${encodeURIComponent(id)}`, { anonymous: true });

export const getZarcCultures = () => http<AgritecCulture[]>('/embrapa/zarc/cultures', { anonymous: true });

export const getZarc = (cultureId: number, ibge: number) => http<AgritecZarc>('/embrapa/zarc', { query: { cultureId, ibge }, anonymous: true });

export const getMunicipalities = () => http<Municipality[]>('/embrapa/municipalities', { anonymous: true });

/** Assuntos sugeridos na busca — são apenas termos de pesquisa; o conteúdo vem da API. */
export const TOPICS = ['Poda', 'Irrigação', 'Adubação', 'Doenças', 'Pragas', 'Colheita', 'Cultivares', 'Pós-colheita', 'Solo', 'Clima'];

export const EMBRAPA_LINKS = {
  agroapi: 'https://www.agroapi.cnptia.embrapa.br/portal/',
  respondeAgroDoc: 'https://www.agroapi.cnptia.embrapa.br/portal/assets/docs/respondeagro.pdf',
  agritecDoc: 'https://www.agroapi.cnptia.embrapa.br/portal/assets/docs/agritec.pdf',
  zarc: 'https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico',
};
