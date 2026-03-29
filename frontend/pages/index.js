import Head from 'next/head';
import { useState } from 'react';
import { useKPIData } from '@/hooks/useKPIData';
import ResumoCards from '@/components/ResumoCards';
import KPICard from '@/components/KPICard';
import PlanilhaInfo from '@/components/PlanilhaInfo';

export default function Home() {
  const { dados, carregando, erro, wsConectado, modo, recarregar } = useKPIData();
  const [tabAtiva, setTabAtiva] = useState('todos');

  return (
    <>
      <Head>
        <title>KPI GANGSTAS - Análise de Funil de Vendas</title>
        <meta name="description" content="Dashboard de KPIs do Funil de Vendas" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0c0a1d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <div className="container">
        {/* Header */}
        <header className="header">
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
            <div className="tabs">
              <button className={`tab-btn ${tabAtiva === 'todos' ? 'active' : ''}`} onClick={() => setTabAtiva('todos')}>
                Todos
              </button>
              <button className={`tab-btn ${tabAtiva === 'kpi1' ? 'active' : ''}`} onClick={() => setTabAtiva('kpi1')}>
                Conversão
              </button>
              <button className={`tab-btn ${tabAtiva === 'kpi2' ? 'active' : ''}`} onClick={() => setTabAtiva('kpi2')}>
                Valor
              </button>
              <button className={`tab-btn ${tabAtiva === 'kpi3' ? 'active' : ''}`} onClick={() => setTabAtiva('kpi3')}>
                Tempo
              </button>
            </div>

            {/* KPIs */}
            {(tabAtiva === 'todos' || tabAtiva === 'kpi1') && (
              <KPICard kpi={dados.kpi_1} numero={1} />
            )}
            {(tabAtiva === 'todos' || tabAtiva === 'kpi2') && (
              <KPICard kpi={dados.kpi_2} numero={2} />
            )}
            {(tabAtiva === 'todos' || tabAtiva === 'kpi3') && (
              <KPICard kpi={dados.kpi_3} numero={3} />
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
