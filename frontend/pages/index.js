import Head from 'next/head';
import { useState, useCallback } from 'react';
import { useKPIData } from '@/hooks/useKPIData';
import ResumoCards from '@/components/ResumoCards';
import KPICard from '@/components/KPICard';
import PlanilhaInfo from '@/components/PlanilhaInfo';

const TABS = [
  { id: 'kpi3', label: 'Tempo' },
  { id: 'kpi2', label: 'Valor' },
  { id: 'kpi1', label: 'Conversão' },
  { id: 'todos', label: 'Todos' },
];
const CHART_CYCLE = ['plotly', 'matplotlib', 'tabela'];

export default function Home() {
  const { dados, carregando, erro, wsConectado, modo, recarregar } = useKPIData();
  const [tabAtiva, setTabAtiva] = useState('todos');
  const [chartType, setChartType] = useState('plotly');

  const activeIdx = TABS.findIndex(t => t.id === tabAtiva);

  const handleTab = useCallback((id) => {
    if (id === tabAtiva) {
      setChartType(prev => CHART_CYCLE[(CHART_CYCLE.indexOf(prev) + 1) % CHART_CYCLE.length]);
    } else {
      setTabAtiva(id);
    }
  }, [tabAtiva]);

  return (
    <>
      <Head>
        <title>KPI GANGSTAS - Análise de Funil de Vendas</title>
        <meta name="description" content="Dashboard de KPIs do Funil de Vendas" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0c0a1d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </Head>

      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-logo">
            <svg viewBox="0 0 64 64" className="ninja-icon" aria-hidden="true">
              <circle cx="32" cy="26" r="14" fill="rgba(255,255,255,0.08)"/>
              <rect x="18" y="20" width="28" height="12" rx="6" fill="var(--accent)"/>
              <ellipse cx="26" cy="26" rx="3.5" ry="2" fill="#fff"/>
              <ellipse cx="38" cy="26" rx="3.5" ry="2" fill="#fff"/>
              <ellipse cx="26.5" cy="26" rx="1.5" ry="1.5" fill="currentColor"/>
              <ellipse cx="38.5" cy="26" rx="1.5" ry="1.5" fill="currentColor"/>
              <path d="M46 24 Q52 22 54 18" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <path d="M46 27 Q54 28 56 24" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>KPI GANGSTAS</h1>
          <p>Análise do Funil de Vendas</p>
          <div className={`ws-status ${wsConectado ? 'connected' : 'disconnected'}`}>
            <span className="dot"></span>
            {modo === 'tempo-real' ? 'Tempo real' : 'Estático'}
          </div>
        </header>

        {/* Erro */}
        {erro && (
          <div className="error-card">
            <p>Erro ao carregar dados: {erro}</p>
            <button onClick={recarregar}>Tentar novamente</button>
          </div>
        )}

        {/* Loading */}
        {carregando && !dados && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Carregando dados do funil de vendas...</p>
          </div>
        )}

        {/* Conteúdo */}
        {dados && (
          <>
            {/* Resumo */}
            <ResumoCards resumo={dados.resumo} />

            {/* Tabs de navegação */}
            <div className="tabs" role="tablist">
              <div className="tab-indicator" style={{ transform: `translateX(${activeIdx * 100}%)` }} />
              {TABS.map(tab => (
                <button key={tab.id} role="tab" aria-selected={tabAtiva === tab.id}
                  className={`tab-btn ${tabAtiva === tab.id ? 'active' : ''}`}
                  onClick={() => handleTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* KPIs */}
            {(tabAtiva === 'todos' || tabAtiva === 'kpi1') && (
              <KPICard kpi={dados.kpi_1} numero={1} tipoGraficoGlobal={chartType} />
            )}
            {(tabAtiva === 'todos' || tabAtiva === 'kpi2') && (
              <KPICard kpi={dados.kpi_2} numero={2} tipoGraficoGlobal={chartType} />
            )}
            {(tabAtiva === 'todos' || tabAtiva === 'kpi3') && (
              <KPICard kpi={dados.kpi_3} numero={3} tipoGraficoGlobal={chartType} />
            )}

            {/* Dados da Planilha — seção final */}
            <PlanilhaInfo resumo={dados.resumo} meta={dados._meta} kpi2={dados.kpi_2} />
          </>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>KPI GANGSTAS © 2026 — Análise de Funil de Vendas com Python (Pandas + Matplotlib) e Next.js</p>
        </footer>
      </div>
    </>
  );
}
