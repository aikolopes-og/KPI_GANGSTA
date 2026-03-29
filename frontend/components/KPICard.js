import { useState } from 'react';
import dynamic from 'next/dynamic';

// Importação dinâmica do Plotly (apenas client-side)
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function KPICard({ kpi, numero }) {
  const [tipoGrafico, setTipoGrafico] = useState('matplotlib');

  if (!kpi) return null;

  return (
    <div className="kpi-section">
      <h2>KPI {numero} — {kpi.titulo}</h2>
      <p className="descricao">{kpi.descricao}</p>

      {/* Toggle tipo de gráfico */}
      <div className="chart-toggle">
        <button
          className={tipoGrafico === 'matplotlib' ? 'active' : ''}
          onClick={() => setTipoGrafico('matplotlib')}
        >
          Estático
        </button>
        <button
          className={tipoGrafico === 'plotly' ? 'active' : ''}
          onClick={() => setTipoGrafico('plotly')}
        >
          Interativo
        </button>
        <button
          className={tipoGrafico === 'tabela' ? 'active' : ''}
          onClick={() => setTipoGrafico('tabela')}
        >
          Tabela
        </button>
      </div>

      {/* Gráfico */}
      <div className="grafico-container">
        {tipoGrafico === 'matplotlib' && kpi.matplotlib_img && (
          <img
            src={`data:image/png;base64,${kpi.matplotlib_img}`}
            alt={`Gráfico ${kpi.titulo}`}
          />
        )}
        {tipoGrafico === 'plotly' && kpi.plotly_json && (
          <Plot
            data={kpi.plotly_json.data}
            layout={{
              ...kpi.plotly_json.layout,
              autosize: true,
              height: typeof window !== 'undefined' && window.innerWidth < 768 ? 280 : 420,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: 'rgba(255,255,255,0.65)', size: 11, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
              margin: { l: 50, r: 16, t: 40, b: 50 },
              xaxis: { ...kpi.plotly_json.layout?.xaxis, gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)' },
              yaxis: { ...kpi.plotly_json.layout?.yaxis, gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)' },
            }}
            config={{ responsive: true, displayModeBar: false, locale: 'pt-BR' }}
            style={{ width: '100%' }}
          />
        )}
        {tipoGrafico === 'tabela' && (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <TabelaDados dados={kpi.dados || kpi.dados_canal} />
          </div>
        )}
      </div>

      {/* Insight */}
      {kpi.insight && (
        <div className="insight-box">
          <h4>Insight Analítico</h4>
          <p>{kpi.insight}</p>
        </div>
      )}
    </div>
  );
}

function TabelaDados({ dados }) {
  if (!dados || dados.length === 0) return <p>Sem dados disponíveis</p>;

  const colunas = Object.keys(dados[0]);

  return (
    <table className="tabela-dados">
      <thead>
        <tr>
          {colunas.map(col => (
            <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dados.map((row, i) => (
          <tr key={i}>
            {colunas.map(col => (
              <td key={col}>
                {typeof row[col] === 'number'
                  ? row[col].toLocaleString('pt-BR')
                  : String(row[col])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
