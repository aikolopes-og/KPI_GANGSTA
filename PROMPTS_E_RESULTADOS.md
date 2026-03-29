# KPI GANGSTAS - Registro de Prompts e Resultados

<!-- 
  ╔══════════════════════════════════════════════════════════════════╗
  ║  RECADO PARA O COPILOT (CONTEXTO PERSISTENTE)              ║
  ║                                                                 ║
  ║  Este arquivo serve como "memória" do projeto.                  ║
  ║  Ao continuar o desenvolvimento, LEIA ESTE ARQUIVO primeiro     ║
  ║  para entender o que já foi feito e o que falta.                ║
  ║                                                                 ║
  ║  ESTRUTURA DO PROJETO (v2 - Vercel-Ready):                      ║
  ║  - backend/main.py → API FastAPI (WebSocket tempo real, Docker)  ║
  ║  - backend/gerar_kpis.py → Script pré-processamento (Pandas+MPL)║
  ║  - frontend/data/kpis.json → Dados pré-processados              ║
  ║  - frontend/pages/api/ → API Routes Next.js (funciona na Vercel)║
  ║  - frontend/lib/dados.js → Loader do JSON                       ║
  ║  - docker-compose.yml → Container isolado                       ║
  ║  - vercel.json → Config deploy Vercel                           ║
  ║  - Funil_Vendas.xlsx → Planilha fonte (100 registros)           ║
  ║                                                                 ║
  ║  ARQUITETURA HÍBRIDA:                                           ║
  ║  - VERCEL: frontend/data/kpis.json → API Routes → React        ║
  ║  - DOCKER: FastAPI (WebSocket) + Next.js (API Routes)           ║
  ║  - O frontend SEMPRE usa /api/kpis (API route do Next.js)       ║
  ║  - Se backend Docker estiver rodando, WebSocket dá tempo real   ║
  ║                                                                 ║
  ║  3 KPIs IMPLEMENTADOS:                                          ║
  ║  1. Taxa de Conversão por Canal                                 ║
  ║  2. Valor Potencial por Status do Funil                         ║
  ║  3. Tempo Médio do Ciclo de Vendas                              ║
  ║                                                                 ║
  ║  DADOS DA PLANILHA: 14 colunas, 100 registros                   ║
  ║  Colunas: ID, Etapa, Canal, Leads, Conversao_Percentual,        ║
  ║  Tempo_dias, Valor_Potencial, Responsavel, Data_Prospecção,     ║
  ║  Data_Contato, Data_Proposta, Data_Fechamento, Status,          ║
  ║  Origem_Lead                                                     ║
  ║                                                                 ║
  ║  STACK TÉCNICA:                                                  ║
  ║  Backend: Python 3.11, FastAPI, Pandas, Matplotlib, Plotly       ║
  ║  Frontend: Next.js 14, React 18, react-plotly.js                 ║
  ║  Infra: Docker, Docker Compose, Vercel                           ║
  ║  Comunicação: API Routes (Vercel) + WebSocket (Docker)           ║
  ║                                                                 ║
  ║  PORTAS (Docker):                                                ║
  ║  Frontend: http://localhost:3000                                  ║
  ║  Backend API: http://localhost:8000                                ║
  ║                                                                 ║
  ║  FLUXO DE ATUALIZAÇÃO DE DADOS:                                  ║
  ║  1. Editar Funil_Vendas.xlsx                                     ║
  ║  2. Rodar: python backend/gerar_kpis.py                          ║
  ║  3. Rebuild: docker-compose up --build -d                        ║
  ║  (ou git push para Vercel auto-deploy)                           ║
  ║                                                                 ║
  ║  Para edições futuras, o Copilot deve:                           ║
  ║  1. Ler este arquivo para contexto                               ║
  ║  2. Verificar backend/gerar_kpis.py para lógica dos KPIs        ║
  ║  3. Verificar frontend/pages/index.js para UI                    ║
  ║  4. Verificar frontend/pages/api/ para API routes               ║
  ║  5. Atualizar este MD com novos prompts/resultados               ║
  ╚══════════════════════════════════════════════════════════════════╝
-->

---

## Prompt 1 — Configuração Inicial do Ambiente
**Solicitação do Aluno:**
> "Instale as dependências do Next.js, Python libs matplotlib, pandas e streamlit"

**Resultado:**
- Criada estrutura de pastas: `frontend/` (Next.js) e `backend/` (Python)
- Arquivo `backend/requirements.txt` com: fastapi, uvicorn, pandas, matplotlib, openpyxl, plotly, streamlit
- Arquivo `frontend/package.json` com: next, react, react-dom, react-plotly.js
- Dependências instaladas com sucesso

---

## Prompt 2 — Viabilidade Matplotlib + Next.js
**Solicitação do Aluno:**
> "É possível utilizar a visualização de gráficos do matplotlib na exibição do Next.js?"

**Resultado:**
- 3 abordagens apresentadas:
  1. **Exportar como imagens** (base64 PNG) - mais simples
  2. **Plotly** (JSON compartilhado) - recomendado para interatividade
  3. **Streamlit como iframe** - mais pesado
- Recomendação: usar Plotly como ponte entre Python e JavaScript, mantendo Matplotlib para geração estática

---

## Prompt 3 — Amostragem Dinâmica
**Solicitação do Aluno:**
> "E se precisarmos da amostragem dinâmica de modo aos gráficos consultarem e se atualizar dinamicamente?"

**Resultado:**
- Apresentadas 2 soluções:
  1. **WebSockets** (bidirecional, mais moderno) - IMPLEMENTADO
  2. **Server-Sent Events** (SSE, unidirecional, mais simples)
- Decisão: WebSocket para atualização em tempo real a cada 5 segundos

---

## Prompt 4 — Construção Completa do Sistema
**Solicitação do Aluno:**
> "Preciso construir um sistema com essas funções baseados nesses parâmetros. Crie um container Docker isolado para rodar a aplicação localhost inicialmente."
> Planilha alvo: `Funil_Vendas.xlsx`
> Sistema em PT-BR
> Salvar prompts em arquivo MD

**Resultado:**
- **Planilha analisada**: 100 registros, 14 colunas (funil de vendas)
- **3 KPIs escolhidos e implementados**:
  1. **Taxa de Conversão por Canal** — Qual canal tem melhor conversão
  2. **Valor Potencial por Status** — Distribuição de valor no funil
  3. **Tempo Médio do Ciclo** — Eficiência temporal do funil

### Arquivos Criados:
| Arquivo | Descrição |
|---------|-----------|
| `backend/main.py` | API FastAPI com 3 KPIs, Pandas, Matplotlib, Plotly, WebSocket |
| `backend/requirements.txt` | Dependências Python |
| `backend/Dockerfile` | Container Python 3.11 |
| `frontend/pages/index.js` | Página principal do dashboard |
| `frontend/components/KPICard.js` | Componente de exibição de KPI |
| `frontend/components/ResumoCards.js` | Cards de resumo geral |
| `frontend/hooks/useKPIData.js` | Hook de dados + WebSocket |
| `frontend/styles/globals.css` | Estilização dark theme |
| `frontend/Dockerfile` | Container Node.js |
| `docker-compose.yml` | Orquestração dos containers |
| `PROMPTS_E_RESULTADOS.md` | Este arquivo |

### Como Executar:
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

---

## Análise da IA sobre os Dados (Funil_Vendas.xlsx)

### Visão Geral
A planilha contém **100 registros** de um funil de vendas com as seguintes características:
- **2 Etapas**: Leads Gerados (50), Leads Qualificados (50)
- **5 Canais**: Instagram (20), Site (20), Indicação (20), WhatsApp (20), Facebook (20)
- **4 Status**: Em negociação (29), Aberto (25), Ganho (24), Perdido (22)
- **5 Origens de Lead**: Telefone (26), Site (22), Email (20), Redes Sociais (18), Indicação (14)
- **Período**: Jan/2022 a Dez/2025
- **Valor Total no Pipeline**: R$ 490.000

### Indicadores Selecionados e Justificativa

**KPI 1 - Taxa de Conversão por Canal**
> Fundamental para entender quais canais de aquisição são mais eficientes em transformar leads em negócios fechados. Compara a conversão média e a taxa real de fechamento.

**KPI 2 - Valor Potencial por Status**
> Mostra onde está concentrado o valor monetário do pipeline — quanto está em aberto, em negociação, ganho e perdido. Essencial para previsão de receita.

**KPI 3 - Tempo Médio do Ciclo de Vendas**
> Mede a velocidade do funil — quanto tempo leva de prospecção a fechamento, separado por canal e por status. Identifica gargalos no processo.

---

## Prompt 5 — Otimização para Deploy na Vercel
**Solicitação do Aluno:**
> "Agora que já possui uma base do sistema, otimize o mesmo com Next.js para facilitar a deploy no Vercel quando o trabalho for 100% otimizado no localhost"

**Resultado:**
- **Arquitetura reestruturada** para modo híbrido (Docker + Vercel)
- Criado `backend/gerar_kpis.py` — script Python que pré-processa a planilha com Pandas + Matplotlib e gera `frontend/data/kpis.json`
- Criadas **API Routes do Next.js** (`pages/api/kpis.js`, `pages/api/resumo.js`, `pages/api/kpi/[id].js`) que servem os dados do JSON
- O frontend agora consome **APIs locais** (`/api/kpis`) em vez de depender de backend externo
- Hook `useKPIData` atualizado com **modo híbrido**: API Routes (sempre) + WebSocket (quando Docker disponível)
- `next.config.js` otimizado: `standalone` só em Docker, normal para Vercel
- Criado `vercel.json` para configuração de deploy
- Dockerfile do frontend atualizado para incluir `data/kpis.json`
- `docker-compose.yml` simplificado (sem `version` obsoleto)

### Novos Arquivos:
| Arquivo | Descrição |
|---------|----------|
| `backend/gerar_kpis.py` | Script de pré-processamento Pandas+Matplotlib → JSON |
| `frontend/data/kpis.json` | Dados KPI pré-processados (0.35 MB) |
| `frontend/lib/dados.js` | Loader do JSON para API routes |
| `frontend/pages/api/kpis.js` | API Route — todos os KPIs |
| `frontend/pages/api/resumo.js` | API Route — resumo geral |
| `frontend/pages/api/kpi/[id].js` | API Route — KPI individual (1, 2 ou 3) |
| `vercel.json` | Configuração de deploy Vercel |

### Como fazer deploy na Vercel:
1. Rodar `python backend/gerar_kpis.py` (gera o JSON atualizado)
2. Push para GitHub
3. Conectar repositório na Vercel
4. Root Directory: `frontend`
5. Deploy automático

### Como rodar local (Docker):
```bash
python backend/gerar_kpis.py   # Pré-processa dados
docker-compose up --build -d    # Sobe containers
```

---

## Prompt 6 — Redesign iOS 26 Liquid Glass (Mobile-First)
**Solicitação do Aluno:**
> "CONFIRA E OPTIMIZE AS CONFIGURAÇÕES PRIMARIAMENTE MOBILE, E DEPOIS DE EXTREMAMENTE OPTIMIZADA, EQUILIBRE A VERSÃO DESKTOP TAMBÉM. UTILIZE OS CONCEITOS DE DESIGN APRESENTADOS NO IOS 26"

**Conceitos iOS 26 aplicados:**
- **Liquid Glass**: `backdrop-filter: blur(20-40px)` em todos os cards, tabs e indicadores
- **Translucência**: Fundos com `rgba(255,255,255,0.08)` e bordas `rgba(255,255,255,0.15)` criando camadas de profundidade
- **Gradiente vibrante**: Fundo com `radial-gradient` em roxo, azul e rosa sobre base escura (#0c0a1d)
- **Cantos ultra-arredondados**: `border-radius` de 20-36px nos cards, pills com 100px
- **Tipografia SF Pro**: Stack `-apple-system, BlinkMacSystemFont, 'SF Pro Display'`, pesos 600-800, letter-spacing negativo nos títulos
- **Segmented Control (tabs)**: Estilo pílula com fundo translúcido e seleção com glass effect
- **Dynamic Island (status)**: Indicador de modo em formato pill com animação de pulso no dot
- **Animações fade-up**: Cards entram com animação escalonada (staggered entry)
- **Cores via gradiente**: Valores dos resumo-cards com gradientes individuais (vermelho, roxo, azul, verde)
- **Insight cards**: Borda lateral gradiente + backdrop-filter, estilo notificação iOS

**Resultado — Mobile-First:**
- CSS completamente reescrito (~500 linhas) com design system baseado em CSS custom properties
- **Mobile (< 768px)**: Grid 2 colunas nos resumos, tabs com scroll horizontal, fontes otimizadas para toque, `:active` com scale para feedback tátil, `safe-area-inset` para notch/Dynamic Island, `100dvh` para viewports dinâmicas
- **Desktop (≥ 768px)**: Grid 4 colunas nos resumos, espaçamentos maiores, fontes escaladas, containers max-width 900px
- **Large Desktop (≥ 1200px)**: Max-width 1100px, gráficos maiores (450px), fontes de título 2.5rem

**Alterações em componentes:**
- `index.js`: Viewport com `viewport-fit=cover`, meta `apple-mobile-web-app-capable`, remoção de emojis nos tabs (texto limpo para mobile), classe `error-card` no lugar de estilos inline, texto do status pill compacto
- `KPICard.js`: Plotly com `paper_bgcolor/plot_bgcolor: transparent` (integra com glass), `displayModeBar: false` no mobile, altura responsiva via `window.innerWidth`, grid lines semi-transparentes, fonte SF Pro
- `ResumoCards.js`: Sem alterações estruturais (CSS cuida de tudo)

### Arquivos Modificados:
| Arquivo | Alteração |
|---------|-----------|
| `frontend/styles/globals.css` | Reescrita total — iOS 26 Liquid Glass mobile-first |
| `frontend/pages/index.js` | Meta tags iOS, error-card, tabs compactos, header limpo |
| `frontend/components/KPICard.js` | Plotly transparente, sem ModeBar, altura responsiva |

### Breakpoints:
| Breakpoint | Foco |
|-----------|------|
| Base (mobile) | < 768px — Grid 2col, tabs scroll, toque otimizado |
| Tablet/Desktop | ≥ 768px — Grid 4col, espaçamentos ampliados |
| Large Desktop | ≥ 1200px — Container 1100px, gráficos maiores |

---

*Última atualização: 29/03/2026*

---

## Prompt 7 — Fix Vercel Deploy (Dados + Hydration)
**Solicitação do Aluno:**
> "O site na Vercel mostra 'Carregando dados do funil de vendas...' eternamente"

**Resultado — 2 bugs corrigidos:**

**Bug 1**: `frontend/lib/dados.js` usava `fs.readFileSync` — falha em serverless Vercel (sem acesso ao filesystem).
- **Fix**: Trocado para `import kpisData from '../data/kpis.json'` (bundled no build)

**Bug 2**: `frontend/pages/_document.js` retornava `null` — sem `<Html>`, `<Head>`, `<Main>`, `<NextScript>`.
- Sem `<NextScript>`, nenhum bundle JS era carregado → React nunca hidratava → `fetch()` nunca executava
- **Fix**: Document reescrito com estrutura padrão Next.js

**Commits**: `9bb19b6` (dados.js), `a17344f` (_document.js)

---

## Prompt 8 — Componente PlanilhaInfo
**Solicitação do Aluno:**
> "Criar um card retangular mostrando: nome da planilha, conteúdo, campos, período, objetivo e ROI"

**Resultado:**
- Criado `frontend/components/PlanilhaInfo.js` com dados de `resumo`, `_meta` e `kpi_2`
- ROI calculado: Ganho / Pipeline total
- Alerta visual quando valor perdido > valor ganho
- Posicionado após todos os KPIs, antes do footer
- **Commit**: `c3aae1f`

---

## Prompt 9 — Redesign PlanilhaInfo + Efeitos Globais
**Solicitação do Aluno:**
> "O bloco está EXTREMAMENTE FEIO, posicionar por último, usar sombras, efeitos de luz e animações seguindo referências de Liquid Glass Design"

**Resultado:**
- **PlanilhaInfo redesenhado**: section title com linhas divisórias, ROI ring SVG com animação de arco, glow orb, shimmer accent line, pills staggered com fade-in
- **Efeitos globais**: soft shadows em todos os glass cards, hover lift, light refraction (radial gradient pseudo-element), `prefers-reduced-motion` suporte
- **Movido**: de hero position (topo) para bottom (antes do footer)
- **Commit**: `7079cd7`

---

## Prompt 10 — Ninja Icon (Logo + Favicon)
**Solicitação do Aluno:**
> "PUT A 'NINJA' REACT ICON AS A LOGO AND FAV ICON"

**Resultado:**
- Criado `frontend/public/favicon.svg` — ninja com bandana vermelha, olhos brancos, espada roxa sobre fundo escuro
- Inline SVG no header acima do título "KPI GANGSTAS"
- CSS: animação `ninja-float` (3s ease-in-out infinite), drop-shadow accent, 48px mobile / 56px desktop
- Favicon via `<link rel="icon" type="image/svg+xml">` e `<link rel="apple-touch-icon">`
- **Commit**: `b53eddf`

---

## Prompt 11 — Menu Nav Aprimorado + Tabelas + Interativo Default
**Solicitação do Aluno:**
> "Alterar menu de navegação dos KPIs: inversão de ordem, efeitos de motion/light, cor no selecionado, double-click cycling, tabelas com unidades/cores, interativo como padrão"

**Resultado:**
- **Tabs reordenados**: Tempo → Valor → Conversão → Todos (movimento visual ao clicar adjacente)
- **Sliding indicator pill**: elemento animado com `cubic-bezier(0.16, 1, 0.3, 1)`, glow neon sutil, `text-shadow` no ativo
- **Re-clique cicla views**: clicar no tab ativo alterna Interativo → Estático → Tabela
- **Tabelas com unidades**: `%` em conversão/taxa, `R$` em valores, `dias` em tempos, mostradas no header da coluna
- **Teoria das cores nas tabelas**: gradiente vermelho → amarelo → verde por valor relativo (escala invertida para tempo), linhas alternadas, hover roxo, primeira coluna em destaque
- **Interativo como padrão**: Plotly agora é a primeira opção (antes era matplotlib)
- **Click em barras**: expande painel de detalhes com dados completos do item clicado
- **Commit**: `efe5843`

---

## Prompt 12 — Pulse Effect + Gradiente nas Barras
**Solicitação do Aluno:**
> "GAUSSIAN-GRADIENT-COLOR-EFFECT nas barras, PULSE EFFECT nas barras (não no div), motion nos gráficos, soft entrance"

**Resultado:**
- **Cores originais preservadas**: cada trace mantém sua cor original do Plotly (corrige mismatch com legenda)
- **Gradiente SVG nas barras**: após render, inject `<linearGradient>` SVG em cada barra — top claro, meio cor original, bottom escuro (efeito gaussian)
- **Pulse nas barras via CSS**: `@keyframes bar-pulse` aplica `brightness(1→1.25)` + `drop-shadow` nos SVG paths diretamente, com delays staggered por barra
- **Soft entrance**: animação `plot-enter` (fade + slide-up) no container Plotly
- **Container div limpo**: removidos todos os efeitos neon/shimmer do div container
- **Commit**: `47dbfa2`, atualizado

---

| Arquivo | Alteração |
|---------|-----------|
| `frontend/components/KPICard.js` | Gradientes SVG injetados via `onAfterPlot`, sem override de cores, CSS pulse |
| `frontend/styles/globals.css` | `bar-pulse` keyframes com stagger delays, `plot-enter` fade-in |
| `PROMPTS_E_RESULTADOS.md` | Atualizado com prompts 7–12 |
| `README.md` | Criado com descrição do app, URL, stack e instruções |
