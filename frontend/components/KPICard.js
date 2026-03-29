import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const CHART_TYPES = ['plotly', 'matplotlib', 'tabela'];
const CHART_LABELS = { plotly: 'Interativo', matplotlib: 'Estático', tabela: 'Tabela' };

/* ── Bar gradient colors (each bar gets its own color from this palette) ── */
const BAR_COLORS = [
  'rgba(233,69,96,{a})',   // red-pink
  'rgba(168,85,247,{a})',  // purple
  'rgba(59,130,246,{a})',  // blue
  'rgba(52,211,153,{a})',  // green
  'rgba(251,191,36,{a})',  // gold
  'rgba(236,72,153,{a})',  // pink
  'rgba(99,102,241,{a})',  // indigo
];

/* Pulse: oscillate alpha between 0.6 and 1.0 */
function pulseAlpha(tick) {
  return 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(tick * Math.PI * 2));
}

/* Generate bar colors at a given pulse phase (0..1) */
function barColors(n, traceIdx, phase) {
  const a = pulseAlpha(phase);
  return Array.from({ length: n }, (_, i) =>
    BAR_COLORS[(i + traceIdx) % BAR_COLORS.length].replace('{a}', a.toFixed(2))
  );
}

const COL_FORMATS = {
  media_conversao: { suffix: '%', type: 'pct' },
  conversao_percentual: { suffix: '%', type: 'pct' },
  taxa_ganho: { suffix: '%', type: 'pct' },
  valor_total: { prefix: 'R$ ', type: 'money' },
  valor_medio: { prefix: 'R$ ', type: 'money' },
  valor_potencial: { prefix: 'R$ ', type: 'money' },
  media_total: { suffix: ' dias', type: 'time' },
  media_prospeccao: { suffix: ' dias', type: 'time' },
  media_contato: { suffix: ' dias', type: 'time' },
  media_proposta: { suffix: ' dias', type: 'time' },
  tempo_dias: { suffix: ' dias', type: 'time' },
};

function fmtCol(col) { return COL_FORMATS[col.toLowerCase()] || null; }

function fmtVal(col, v) {
  if (typeof v !== 'number') return String(v);
  const f = fmtCol(col);
  if (!f) return v.toLocaleString('pt-BR');
  const s = v.toLocaleString('pt-BR', { maximumFractionDigits: f.type === 'money' ? 0 : 1 });
  return `${f.prefix || ''}${s}${f.suffix || ''}`;
}

function cellColor(col, v, min, max) {
  if (typeof v !== 'number' || min === max) return null;
  const f = fmtCol(col);
  if (!f) return null;
  let r = (v - min) / (max - min);
  if (f.type === 'time') r = 1 - r;
  let R, G, B;
  if (r < 0.5) {
    const t = r * 2;
    R = 248 + t * 3; G = 113 + t * 78; B = 113 - t * 77;
  } else {
    const t = (r - 0.5) * 2;
    R = 251 - t * 199; G = 191 + t * 20; B = 36 + t * 117;
  }
  return `rgb(${Math.round(R)},${Math.round(G)},${Math.round(B)})`;
}

export default function KPICard({ kpi, numero, tipoGraficoGlobal }) {
  const [tipoGrafico, setTipoGrafico] = useState(tipoGraficoGlobal || 'plotly');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [phase, setPhase] = useState(0);
  const [growStep, setGrowStep] = useState(0); // 0=hidden, 1..N=staggered bars growing
  const plotRef = useRef(null);

  useEffect(() => {
    if (tipoGraficoGlobal) setTipoGrafico(tipoGraficoGlobal);
  }, [tipoGraficoGlobal]);

  // Soft entrance: staggered grow from 0 → full over multiple steps
  useEffect(() => {
    if (tipoGrafico !== 'plotly' || !kpi?.plotly_json) return;
    setGrowStep(0);
    const maxBars = Math.max(...kpi.plotly_json.data.map(t => (t.y || t.x || []).length), 1);
    const totalSteps = maxBars + 6; // extra steps for easing to 100%
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setGrowStep(step);
      if (step >= totalSteps) clearInterval(iv);
    }, 120);
    return () => clearInterval(iv);
  }, [tipoGrafico, kpi]);

  // Infinite pulse: smooth breathing on bar colors (~20fps for performance)
  useEffect(() => {
    if (tipoGrafico !== 'plotly') return;
    const start = Date.now();
    const iv = setInterval(() => {
      setPhase(((Date.now() - start) % 2500) / 2500);
    }, 50);
    return () => clearInterval(iv);
  }, [tipoGrafico]);

  if (!kpi) return null;

  const handlePlotClick = (e) => {
    if (!e.points?.length) return;
    const pt = e.points[0];
    const dados = kpi.dados || kpi.dados_canal || [];
    const lbl = String(pt.x ?? pt.label ?? '');
    const row = dados.find(d => String(d[Object.keys(d)[0]]) === lbl);
    setSelectedPoint(prev => (prev && prev.label === lbl) ? null : { label: lbl, row });
  };

  // Build traces with pulsing bar colors + staggered entrance
  const buildTraces = useCallback(() => {
    if (!kpi.plotly_json) return [];
    return kpi.plotly_json.data.map((tr, ti) => {
      const isFunnel = tr.type === 'funnel';
      const isBar = tr.type === 'bar';
      const values = tr.y || tr.x || [];
      const n = values.length;
      const colors = barColors(n, ti, phase);

      const base = {
        ...tr,
        marker: {
          ...tr.marker,
          color: colors,
          line: { ...(tr.marker?.line || {}), width: 1, color: 'rgba(255,255,255,0.1)' },
        },
        hoverlabel: { bgcolor: 'rgba(12,10,29,0.95)', bordercolor: 'rgba(168,85,247,0.5)', font: { color: '#fff', size: 13 } },
      };

      // Staggered soft entrance: each bar grows independently
      if (isBar && growStep < n + 6) {
        const newY = values.map((v, i) => {
          const barProgress = Math.min(1, Math.max(0, (growStep - i) / 6));
          // Ease-out cubic for soft landing
          const eased = 1 - Math.pow(1 - barProgress, 3);
          return v * eased;
        });
        return { ...base, y: newY };
      }
      if (isFunnel && growStep < n + 6) {
        const newX = values.map((v, i) => {
          const barProgress = Math.min(1, Math.max(0, (growStep - i) / 6));
          const eased = 1 - Math.pow(1 - barProgress, 3);
          return v * eased;
        });
        return { ...base, x: newX };
      }
      return base;
    });
  }, [kpi, phase, growStep]);

  const plotLayout = {
    ...kpi.plotly_json?.layout,
    autosize: true,
    height: typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 420,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: 'rgba(255,255,255,0.65)', size: 11, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
    margin: { l: 50, r: 16, t: 40, b: 50 },
    xaxis: { ...kpi.plotly_json?.layout?.xaxis, gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)' },
    yaxis: { ...kpi.plotly_json?.layout?.yaxis, gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.08)' },
  };

  return (
    <div className="kpi-section">
      <h2>KPI {numero} — {kpi.titulo}</h2>
      <p className="descricao">{kpi.descricao}</p>

      <div className="chart-toggle">
        {CHART_TYPES.map(t => (
          <button key={t} className={tipoGrafico === t ? 'active' : ''}
            onClick={() => { setTipoGrafico(t); setSelectedPoint(null); }}>
            {CHART_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grafico-container">
        {tipoGrafico === 'matplotlib' && kpi.matplotlib_img && (
          <img src={`data:image/png;base64,${kpi.matplotlib_img}`} alt={`Gráfico ${kpi.titulo}`} />
        )}
        {tipoGrafico === 'plotly' && kpi.plotly_json && (
          <Plot
            ref={plotRef}
            data={buildTraces()}
            layout={plotLayout}
            config={{ responsive: true, displayModeBar: false, locale: 'pt-BR' }}
            style={{ width: '100%' }}
            onClick={handlePlotClick}
          />
        )}
        {tipoGrafico === 'tabela' && (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <TabelaDados dados={kpi.dados || kpi.dados_canal} />
          </div>
        )}
      </div>

      {selectedPoint?.row && (
        <div className="point-detail-panel">
          <button className="point-detail-close" onClick={() => setSelectedPoint(null)} aria-label="Fechar">&times;</button>
          <h4 className="point-detail-title">{selectedPoint.label}</h4>
          <div className="point-detail-grid">
            {Object.entries(selectedPoint.row).slice(1).map(([k, v]) => (
              <div key={k} className="point-detail-item">
                <span className="point-detail-label">{k.replace(/_/g, ' ')}</span>
                <span className="point-detail-value">{fmtVal(k, v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
  if (!dados || !dados.length) return <p>Sem dados disponíveis</p>;
  const cols = Object.keys(dados[0]);
  const ranges = {};
  cols.forEach(c => {
    const nums = dados.map(r => r[c]).filter(v => typeof v === 'number');
    if (nums.length) ranges[c] = { min: Math.min(...nums), max: Math.max(...nums) };
  });

  return (
    <table className="tabela-dados">
      <thead>
        <tr>
          {cols.map(c => {
            const f = fmtCol(c);
            const unit = f ? (f.suffix || f.prefix || '').trim() : '';
            return (
              <th key={c}>
                {c.replace(/_/g, ' ').toUpperCase()}
                {unit && <span className="th-unit">{unit}</span>}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {dados.map((row, i) => (
          <tr key={i}>
            {cols.map(c => {
              const v = row[c];
              const rng = ranges[c];
              const clr = rng ? cellColor(c, v, rng.min, rng.max) : null;
              return <td key={c} style={clr ? { color: clr } : undefined}>{fmtVal(c, v)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
