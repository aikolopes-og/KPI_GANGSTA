# KPI GANGSTAS

### [https://kpi-gangstas.vercel.app](https://kpi-gangstas.vercel.app)

Dashboard de KPIs para análise de Funil de Vendas, com gráficos interativos, design iOS 26 Liquid Glass e deploy na Vercel.

---

## Sobre

Sistema completo de análise de dados baseado na planilha **Funil_Vendas.xlsx** (100 registros, 14 colunas). Processa os dados com Python (Pandas + Matplotlib + Plotly) e exibe em um dashboard Next.js com design premium mobile-first.

### 3 KPIs Implementados

| KPI | Métrica | Objetivo |
|-----|---------|----------|
| **1** | Taxa de Conversão por Canal | Qual canal de aquisição converte mais leads em vendas |
| **2** | Valor Potencial por Status | Como o valor monetário está distribuído no funil |
| **3** | Tempo Médio do Ciclo de Vendas | Velocidade do funil — de prospecção a fechamento |

### Features

- Gráficos interativos com **animações pulse/breathe** — barras e funil em **React/SVG puro** (sem Plotly)
- **Gradiente gaussian** nas barras via `<linearGradient>` SVG
- **Entrada animada** (scaleY spring) + **brilho pulsatório** contínuo com stagger wave
- Gráficos estáticos (Matplotlib) como alternativa
- Tabelas de dados com **unidades de medida** e **gradiente de cores** por valor
- Click em barras expande **painel de detalhes** com dados completos
- Navegação por tabs com **indicador deslizante animado**
- Card de metadados da planilha com **ROI ring animado**
- Design **iOS 26 Liquid Glass** (backdrop-filter, glassmorphism, gradientes vibrantes)
- **Mobile-first** totalmente responsivo
- **Docker** para desenvolvimento local
- **Vercel** para produção

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 14, React 18, Custom SVG Charts (AnimatedBarChart, AnimatedFunnelChart) |
| **Backend** | Python 3.11, FastAPI, Pandas, Matplotlib, Plotly, OpenPyXL |
| **Infra** | Docker, Docker Compose, Vercel |
| **Design** | iOS 26 Liquid Glass, CSS Custom Properties, SVG animations |

---

## Como Rodar

### Vercel (Produção)

Acesse diretamente: **[kpi-gangstas.vercel.app](https://kpi-gangstas.vercel.app)**

### Docker (Local)

```bash
# 1. Pré-processar dados
python backend/gerar_kpis.py

# 2. Subir containers
docker-compose up --build -d

# 3. Acessar
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

### Atualizar Dados

```bash
# 1. Editar Funil_Vendas.xlsx
# 2. Re-gerar JSON
python backend/gerar_kpis.py

# 3. Rebuild
docker-compose up --build -d
```

---

## Estrutura

```
KPI_GANGSTA/
├── backend/
│   ├── main.py              # API FastAPI + WebSocket
│   ├── gerar_kpis.py        # Pré-processamento Pandas → JSON
│   └── requirements.txt
├── frontend/
│   ├── pages/
│   │   ├── index.js          # Dashboard principal
│   │   ├── _document.js      # Document wrapper
│   │   └── api/              # API Routes (kpis, resumo, kpi/[id])
│   ├── components/
│   │   ├── KPICard.js        # Card de KPI com gráficos + pulse
│   │   ├── ResumoCards.js    # Cards de resumo geral
│   │   └── PlanilhaInfo.js   # Metadados da planilha + ROI
│   ├── hooks/useKPIData.js   # Fetch + WebSocket hook
│   ├── data/kpis.json        # Dados pré-processados
│   └── styles/globals.css    # Design system Liquid Glass
├── tests/e2e_test.py         # Teste end-to-end (47 checks)
├── Funil_Vendas.xlsx         # Planilha fonte
├── docker-compose.yml
├── vercel.json
└── PROMPTS_E_RESULTADOS.md   # Log de prompts e resultados
```

---

## Testes

```bash
python tests/e2e_test.py
```

Executa 5 fases: SELECT → INSERT + DELETE → Re-gerar KPIs → Validar APIs → Restaurar. 47 verificações.

---

*KPI GANGSTAS &copy; 2026*
