# OASIS — Frontend

**Observação Agroambiental Sensorizada, Inteligente e Sustentável**

Aplicação web da OASIS (IoT + visão computacional para monitoramento e classificação de uvas), do Projeto Integrador **“Inteligência de Dados no Vale do São Francisco”**.

Todos os dados exibidos vêm da API [`Vinicola-back`](https://github.com/PI-2026-2-Vinicola/Vinicola-back): não há dados gerados no navegador. Sem dados registrados, as telas mostram estados vazios e orientam o primeiro passo (cadastrar sensor, importar arquivo ou enviar imagem).

As integrações externas — **ThingSpeak** (monitoramento IoT) e **Embrapa AgroAPI** (RespondeAgro e Agritec v2, na aba Uvas) — também passam pela API: o navegador nunca fala com esses serviços nem recebe chaves. Por isso não há variáveis `VITE_` para elas; a configuração fica no `.env` do Vinicola-back. Quando uma integração não está configurada, a página explica o que falta em vez de exibir dados substitutos.

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
| `/` | público | Página institucional e educativa: o projeto em linguagem simples, conhecendo as uvas (ciclo da videira, Vale do São Francisco), como usar a plataforma, benefícios (sem promessas de resultado) e atalhos; números agregados reais só quando existem |
| `/uvas` | público | Abas **Perguntas e respostas** (busca na Coleção 500 Perguntas 500 Respostas da Embrapa, livro sobre uva ou toda a coleção, com fonte, data da consulta e link do livro), **Época de plantio** (Zarc via Agritec v2 para municípios do Submédio São Francisco) e **Variedades monitoradas** (catálogo do projeto) |
| `/uvas/:id` | público | Ficha e critérios da variedade, busca da variedade na Embrapa; com login, histórico real |
| `/sobre` | público | Documentação técnica fiel à implementação: situação de cada funcionalidade (com o estado das integrações consultado na API), arquitetura, ThingSpeak, Embrapa, YOLO, tecnologias, fluxo de dados, segurança e referências |
| `/monitoramento` | todos | Canal do ThingSpeak: campos com os nomes do canal, último valor e horário, mín./máx., gráficos (últimos registros, 24 h, 7 ou 30 dias), atualização automática, avisos de canal sem dados ou resposta desatualizada |
| `/login` | público | Login com mensagens de erro e bloqueio por tentativas; orientação de redefinição de senha pelo administrador |
| `/dashboard` | admin, gestor | Indicadores do período com comparação ao período anterior, ambiente (temperatura/umidade), gráficos por dia/hora, evolução, sensores, variedades, mapa, alertas e últimas leituras |
| `/sensores` | admin, gestor | Mapa com coordenadas reais, status calculado, filtros por status/bloco/busca, tabela e cartões; cadastro de sensor (admin) com exibição única do token |
| `/sensores/:id` | admin, gestor | Indicadores, leituras por dia, condições ambientais, bateria e sinal, leituras paginadas; editar, gerar token, desativar, registrar medição |
| `/analises` | todos | **Enviar imagem** (escolha → validação de formato, tamanho, HEIC e arquivo corrompido → prévia → análise na API → imagem enviada × imagem com caixas, detecções por classe com quantidade e confiança, orientação quando nada é detectado; detector em uso e suas classes informados pela API) e **Painel analítico** filtrável |
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
├── services/thingspeak.ts  # canal do ThingSpeak (via API OASIS)
├── services/embrapa.ts     # RespondeAgro e Agritec (via API OASIS)
├── hooks/queries.ts      # consultas React Query (cache, paginação, atualização automática do monitoramento)
├── context/AuthContext   # sessão validada em /auth/me; expiração encerra a sessão
├── data/                 # tipos do contrato da API, rótulos e catálogo de variedades
├── lib/                  # períodos, formatação, séries do ThingSpeak, janelas do Zarc, validação de upload, resumo de detecções
├── components/
│   ├── layout/           # Navbar (menu superior), PageHeader (faixa no estilo da landing), rodapé, guardas de rota
│   ├── home/ about/      # seções da página inicial e da documentação técnica
│   ├── embrapa/          # busca de perguntas e respostas e painel do Zarc
│   ├── reading/          # imagem real da leitura com as caixas de detecção
│   ├── analysis/         # envio de imagem, resultado (comparação e classes), modelo em uso, detalhe da leitura
│   ├── sensors/          # formulário de sensor e exibição do token
│   ├── charts/ map/ ui/  # gráficos (Chart.js), mapa (Leaflet), estados, integrações pendentes, toasts, filtros
│   └── landing/ grape/   # elementos decorativos e ilustração procedural dos cachos, biblioteca de variedades
├── pages/                # uma página por rota (carregadas sob demanda)
└── styles/               # tokens, componentes, landing, content (início e sobre), app.css e integrations.css
```

## Estados e feedback

Toda consulta tem estado de carregamento, erro (com “Tentar novamente” e mensagem específica para falta de conexão com a API ou falta de permissão) e vazio. Indicadores sem base exibem “—” em vez de zero inventado; a evolução das classificações pede pelo menos dois dias com dados. Ações (cadastro, envio, importação, exclusão, troca de senha) mostram progresso, erros de validação do servidor e notificação de sucesso, e atualizam automaticamente as telas dependentes.

Integrações têm, além disso, o estado **não configurado** (explica o que o administrador precisa definir), a **fonte e a data da consulta** em cada resultado e, no monitoramento, o aviso de **dados desatualizados** quando o ThingSpeak falha e a API devolve a última resposta válida. O HTML das respostas da Embrapa chega sanitizado pela API.

## Testes

`npm test` roda os testes Vitest das funções puras (períodos, séries do ThingSpeak, janelas do Zarc, validação de upload e resumo das detecções). `npm run build` faz a verificação de tipos completa.

## Identidade visual

- Vinho (`#6d1c3f` / `#86264e`), rosa claro e branco; cores de status (verde, amarelo, vermelho) sempre com ícone e rótulo.
- A área autenticada segue o estilo da página inicial: menu transparente centralizado no topo (ganha fundo ao rolar), faixa vinho com sobretítulo e título em Fraunces, e cartões sobrepostos à faixa. Em telas menores o menu vira o botão ☰.
- Tipografia Fraunces (títulos da página pública) e Inter (interface).
- As figuras de cachos da página inicial e da biblioteca são ilustrações vetoriais e estão marcadas como tal; nas leituras, a imagem exibida é a foto real processada pela API.
- Com a análise de cor (sem modelo YOLO treinado), o resultado mostra “Variedade (cadastro do talhão)” e “Índice da análise” em vez de “Uva identificada” e “Confiança”, porque a variedade não é reconhecida pela imagem e o índice não é uma probabilidade.

---

A classificação é baseada na análise computacional da imagem e **não substitui a avaliação agronômica profissional**.
