# OASIS — Frontend

**Observação Agroambiental Sensorizada, Inteligente e Sustentável**

Aplicação web da OASIS (IoT + visão computacional para monitoramento e classificação de uvas), do Projeto Integrador **“Inteligência de Dados no Vale do São Francisco”**.

Todos os dados exibidos vêm da API [`Vinicola-back`](https://github.com/PI-2026-2-Vinicola/Vinicola-back): não há dados gerados no navegador. Sem dados registrados, as telas mostram estados vazios e orientam o primeiro passo (cadastrar sensor, importar arquivo ou enviar imagem).

## Executando

Pré-requisito: a API rodando em `http://localhost:8000` (veja o README do Vinicola-back).

```bash
npm install
npm run dev        # http://localhost:5173 — /api é encaminhado para http://localhost:8000
npm run build      # verificação de tipos + build de produção em dist/
npm test           # testes (Vitest)
```

Para apontar o servidor de desenvolvimento para outra API: `OASIS_API_PROXY=http://192.168.0.10:8000 npm run dev`.

Na primeira execução da API, o administrador inicial é criado com o e-mail `OASIS_ADMIN_EMAIL` (padrão `admin@oasis.agr.br`) e a senha de `OASIS_ADMIN_PASSWORD` — ou uma senha aleatória exibida no terminal da API. Os demais usuários são criados em **Administração → Usuários**.

### Produção

```bash
VITE_API_URL=https://api.suaempresa.com.br npm run build
```

`VITE_API_URL` vazio = API na mesma origem do site (ex.: proxy reverso servindo `/api`). `VITE_BASE` define o subdiretório de publicação. `vercel.json` e `public/_redirects` já redirecionam as rotas para o `index.html`. Inclua a origem do site em `CORS_ORIGINS` na API.

## Páginas

| Rota | Perfis | Conteúdo |
| --- | --- | --- |
| `/` | público | Apresentação da solução; números agregados reais (`/public/overview`); ilustrações do fluxo identificadas como tal |
| `/uvas`, `/uvas/:id` | público | Biblioteca de variedades e critérios de classificação; com login, histórico real da variedade |
| `/sobre` | público | Conceito, arquitetura e Projeto Integrador |
| `/login` | público | Login com mensagens de erro e bloqueio por tentativas; orientação de redefinição de senha pelo administrador |
| `/dashboard` | admin, gestor | Indicadores do período com comparação ao período anterior, ambiente (temperatura/umidade), gráficos por dia/hora, evolução, sensores, variedades, mapa, alertas e últimas leituras |
| `/sensores` | admin, gestor | Mapa com coordenadas reais, status calculado, filtros por status/bloco/busca, tabela e cartões; cadastro de sensor (admin) com exibição única do token |
| `/sensores/:id` | admin, gestor | Indicadores, leituras por dia, condições ambientais, bateria e sinal, leituras paginadas; editar, gerar token, desativar, registrar medição |
| `/analises` | todos | **Enviar imagem** (validação → análise na API → resultado com caixas sobre a foto) e **Painel analítico** filtrável |
| `/classificacao` | todos | Resultado por variedade (quantidade, % por classificação, confiança), filtro por tipo e período, evolução e maturação |
| `/historico`, `/historico/:id` | todos | Histórico paginado no servidor com filtros combináveis (período, sensor, bloco, variedade, qualidade, classificação, maturação, origem, busca), ordenação, exportação CSV, detalhe e exclusão (admin) |
| `/importacao` | admin, gestor | Importação de leituras, sensores e medições (CSV, Excel, JSON) com pré-visualização validada pelo servidor, tratamento de duplicados e histórico de importações |
| `/administracao` | admin | Usuários e perfis, estado do sistema, auditoria e integração de dispositivos |
| `/conta` | todos | Dados do usuário e troca de senha |

As permissões da interface espelham as regras da API, que é quem de fato autoriza cada operação.

## Estrutura

```
src/
├── services/http.ts      # fetch com token, timeout, erros em português, download e imagens autenticadas
├── services/api.ts       # funções tipadas para cada endpoint + matriz de permissões
├── hooks/queries.ts      # consultas React Query (cache, paginação mantendo dados anteriores)
├── context/AuthContext   # sessão validada em /auth/me; expiração encerra a sessão
├── data/                 # tipos do contrato da API, rótulos e catálogo de variedades
├── lib/                  # períodos, formatação, cliente de cache
├── components/
│   ├── layout/           # Navbar (menu superior), PageHeader (faixa no estilo da landing), rodapé, guardas de rota
│   ├── reading/          # imagem real da leitura com as caixas de detecção
│   ├── analysis/         # detalhe da leitura, envio de imagem, histórico por variedade
│   ├── sensors/          # formulário de sensor e exibição do token
│   ├── charts/ map/ ui/  # gráficos (Chart.js), mapa (Leaflet), estados, toasts, filtros
│   └── landing/ grape/   # página inicial e ilustração procedural dos cachos
├── pages/                # uma página por rota (carregadas sob demanda)
└── styles/               # tokens, componentes, landing e app.css (área autenticada)
```

## Estados e feedback

Toda consulta tem estado de carregamento, erro (com “Tentar novamente” e mensagem específica para falta de conexão com a API ou falta de permissão) e vazio. Indicadores sem base exibem “—” em vez de zero inventado; a evolução das classificações pede pelo menos dois dias com dados. Ações (cadastro, envio, importação, exclusão, troca de senha) mostram progresso, erros de validação do servidor e notificação de sucesso, e atualizam automaticamente as telas dependentes.

## Identidade visual

- Vinho (`#6d1c3f` / `#86264e`), rosa claro e branco; cores de status (verde, amarelo, vermelho) sempre com ícone e rótulo.
- A área autenticada segue o estilo da página inicial: menu transparente centralizado no topo (ganha fundo ao rolar), faixa vinho com sobretítulo e título em Fraunces, e cartões sobrepostos à faixa. Em telas menores o menu vira o botão ☰.
- Tipografia Fraunces (títulos da página pública) e Inter (interface).
- As figuras de cachos da página inicial e da biblioteca são ilustrações vetoriais e estão marcadas como tal; nas leituras, a imagem exibida é a foto real processada pela API.

---

A classificação é baseada na análise computacional da imagem e **não substitui a avaliação agronômica profissional**.
