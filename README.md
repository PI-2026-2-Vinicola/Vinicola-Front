# OSAIS — Frontend

**Observação Agroambiental Sensorizada, Inteligente e Sustentável**

Aplicação web da OSAIS: IoT + Inteligência Artificial + visão computacional (YOLO) para monitoramento e classificação de uvas, integrada ao Projeto Integrador **“Inteligência de Dados no Vale do São Francisco”**.

> Observar → Sensorizar → Analisar → Inteligir → Sustentar

O protótipo é **totalmente demonstrável sem sensores físicos**: sem `VITE_API_URL`, os dados (6 sensores, 6 variedades e cerca de 1.400 leituras em 30 dias) são gerados no navegador de forma determinística. Com `VITE_API_URL`, a mesma interface consome a API FastAPI do repositório [`Vinicola-back`](https://github.com/PI-2026-2-Vinicola/Vinicola-back).

## Funcionalidades

| Área | O que tem |
| --- | --- |
| **Landing** (`/`) | Hero com a demonstração animada do pipeline (captura → processamento → YOLO → resultado), significado da sigla, ciclo conceitual, arquitetura Device/Edge/Cloud, integração YOLO (entrada → saída), prévia da plataforma, biblioteca de uvas, Vale do São Francisco, sustentabilidade, tecnologias e CTA final |
| **Login** (`/login`) | Autenticação simulada com três perfis e recuperação de senha |
| **Dashboard** (`/dashboard`) | Sensores ativos, leituras, uvas analisadas, qualidade geral, alertas, distribuição de qualidade, análises por período, evolução, atividade dos sensores, distribuição das variedades, mapa e últimas leituras |
| **Sensores** (`/sensores`) | Mapa (Leaflet, com camadas mapa/satélite e talhões), marcadores distintos para ativo/atenção/offline, cartões e tabela de sensores |
| **Sensor** (`/sensores/:id`) | Página individual com filtros de período (inclusive personalizado), indicadores, gráfico e linha do tempo das leituras |
| **Análises** (`/analises`) | Painel analítico filtrável por variedade, período e sensor; histórico por variedade; aba **Registro e processamento**, com o pipeline animado Sensor IoT → Captura → Envio → Processamento → YOLO/IA → Identificação → Classificação → Armazenamento, captura automática e envio de imagem |
| **Histórico** (`/historico`) | Tabela com pesquisa, filtros (período, sensor, variedade, classificação, qualidade), ordenação, paginação, exportação CSV e modal de detalhes |
| **Análise** (`/historico/:id`) | Imagem analisada com as caixas do YOLO, barra de confiança, resultado da IA, maturação, observações e informações do sensor |
| **Uvas** (`/uvas`, `/uvas/:id`) | Biblioteca educacional com características, critérios de classificação (Boa, Atenção e Necessita atenção) e histórico por variedade |
| **Sobre** (`/sobre`) | Conceito, arquitetura, roteiro de integração com o campo real, Projeto Integrador e tecnologias |
| **Integrações** (`/integracoes`) | Somente para administradores: fonte de dados, modelo, endpoints, exemplo de ingestão e matriz de permissões |

### Perfis de demonstração

Senha para todos os perfis: `osais2026`

| Perfil | E-mail | Acesso |
| --- | --- | --- |
| Administrador | `admin@osais.agr.br` | Acesso total (inclui Integrações) |
| Gestor | `gestor@osais.agr.br` | Dashboard, sensores, análises e histórico |
| Operador | `operador@osais.agr.br` | Leituras, imagens e resultados das análises |

## Identidade visual

- **Identidade:** vinho (`#6d1c3f` / `#a3325a`), rosa claro (`#f7d6e1`) e branco.
- **Status (separados da identidade):** verde = Boa, amarelo = Atenção, vermelho = Necessita atenção. Sempre acompanhados de ícone e rótulo.
- **Variedades nos gráficos:** paleta categórica validada para daltonismo (protanopia/deuteranopia) e contraste ≥ 3:1.
- **Tipografia:** Fraunces (títulos) e Inter (interface).
- **Scrolling Transparent Navbar:** a barra começa transparente sobre o hero e ganha um fundo *glassmorphism* ao rolar.
- **Imagens das uvas:** geradas proceduralmente em SVG (`GrapeScene`), com as caixas de detecção desenhadas sobre a imagem. No modo API, a imagem real enviada pelo sensor substitui a ilustração.

## Executando

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de produção em dist/
npm test           # testes (Vitest) do gerador de dados e dos filtros
```

### Conectando à API

```bash
cp .env.example .env
# VITE_API_URL=http://localhost:8000
npm run dev
```

A API está no repositório `Vinicola-back`. Com ela conectada, o login usa JWT, as listas vêm de `/api/v1/sensors` e `/api/v1/readings`, e o envio de imagem na aba **Registro e processamento** chama `POST /api/v1/ingest`, o mesmo endpoint usado pelo ESP32 e pelo gateway de edge.

## Estrutura

```
src/
├── components/
│   ├── analysis/   # detalhe da análise, saída YOLO, pipeline, histórico por variedade
│   ├── charts/     # Chart.js (configuração, cards com visão em tabela)
│   ├── grape/      # GrapeScene — imagem procedural + caixas YOLO + HUD da câmera
│   ├── landing/    # seções da landing page
│   ├── layout/     # navbar, footer, page hero, guards de acesso
│   ├── map/        # mapa Leaflet dos sensores
│   └── ui/         # badges, KPI, modal, filtros, reveal, count-up
├── context/        # AuthContext (perfis) e DataContext (fonte de dados)
├── data/           # tipos, variedades, sensores e gerador de dados simulados
├── lib/            # filtros, agregações e formatação (pt-BR)
├── pages/          # rotas
├── services/api.ts # camada de dados: demo ↔ API
└── styles/         # tokens e CSS
```

## Contrato de dados

O tipo `Reading` (`src/data/types.ts`) é o mesmo retornado pela API:

```json
{
  "id": "OS-01424",
  "sensorId": "S-001",
  "block": "Bloco A",
  "location": "Bloco A — Fileira 12",
  "capturedAt": "2026-09-23T16:52:00.000Z",
  "varietyId": "cabernet-sauvignon",
  "quality": "boa",
  "confidence": 0.94,
  "maturation": "adequada",
  "visualCondition": "Boa",
  "classification": "APROVADA",
  "observations": "Cacho uniforme…",
  "detections": [{ "kind": "cacho", "label": "cabernet_sauvignon", "confidence": 0.94, "box": [0.31, 0.15, 0.37, 0.64] }],
  "clustersDetected": 1,
  "imageUrl": "/api/v1/readings/OS-01424/image",
  "modelVersion": "YOLOv8n-osais v0.3",
  "processingMs": 312,
  "stage": "concluida"
}
```

As caixas (`box`) seguem o formato normalizado do YOLO: `x, y, largura, altura`, com valores entre 0 e 1.

## Publicação

O build é estático (`dist/`). Já estão incluídos `vercel.json` e `public/_redirects` (Netlify) com o *fallback* das rotas. Para publicar em um subdiretório, como no GitHub Pages, use `VITE_BASE=/nome-do-repo/ npm run build`.

---

A classificação apresentada é baseada na análise computacional da imagem e **não substitui a avaliação agronômica profissional**.
