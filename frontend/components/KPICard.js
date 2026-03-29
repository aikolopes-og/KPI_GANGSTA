import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const CHART_TYPES = ['plotly', 'matplotlib', 'tabela'];
const CHART_LABELS = { plotly: 'Interativo', matplotlib: 'Estático', tabela: 'Tabela' };

/**
 * After Plotly renders, inject SVG <linearGradient> defs onto each bar/funnel
 * so bars get a top-to-bottom gradient (lighter → original color → slightly darker).
 * This creates the "gaussian gradient" look on the actual bars.
 */
function applyBarGradients(containerEl) {
  if (!containerEl) return;
  const svg = containerEl.querySelector('svg.main-svg');
  if (!svg) return;

  // Create or find defs
  let defs = svg.querySelector('defs.kpi-grads');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.setAttribute('class', 'kpi-grads');
    svg.prepend(defs);
  }
  defs.innerHTML = '';

  // Find all bar trace paths and funnel paths
  const tracePaths = svg.querySelectorAll('.trace.bars .point > path, .trace.funnel .point > path');
  let gradIdx = 0;
  tracePaths.forEach(path => {
    const fill = path.getAttribute('fill') || path.style.fill;
    if (!fill || fill === 'none' || fill === 'transparent') return;

    const id = `bar-grad-${gradIdx++}`;
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', id);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');

    // Parse color to get lighter/darker versions
    const c = parseColor(fill);
    if (!c) return;

    const stops = [
      { offset: '0%', color: lighten(c, 50), opacity: '1' },
      { offset: '35%', color: lighten(c, 20), opacity: '0.95' },
      { offset: '60%', color: `rgb(${c.r},${c.g},${c.b})`, opacity: '0.9' },
      { offset: '100%', color: darken(c, 30), opacity: '0.85' },
    ];

    stops.forEach(s => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', s.offset);
      stop.setAttribute('stop-color', s.color);
      stop.setAttribute('stop-opacity', s.opacity);
      grad.appendChild(stop);
    });

    defs.appendChild(grad);
    path.style.fill = `url(#${id})`;
  });
}

function parseColor(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  // hex
  const h = str.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (h) return { r: parseInt(h[1],16), g: parseInt(h[2],16), b: parseInt(h[3],16) };
  return null;
}

function lighten(c, pct) {
  const f = pct / 100;
  return `rgb(${Math.min(255, Math.round(c.r + (255 - c.r) * f))},${Math.min(255, Math.round(c.g + (255 - c.g) * f))},${Math.min(255, Math.round(c.b + (255 - c.b) * f))})`;
}

function darken(c, pct) {
  const f = 1 - pct / 100;
  return `rgb(${Math.round(c.r * f)},${Math.round(c.g * f)},${Math.round(c.b * f)})`;
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
  const containerRef = useRef(null);

  useEffect(() => {
    if (tipoGraficoGlobal) setTipoGrafico(tipoGraficoGlobal);
  }, [tipoGraficoGlobal]);

  if (!kpi) return null;

  const handlePlotClick = (e) => {
    if (!e.points?.length) return;
    const pt = e.points[0];
    const dados = kpi.dados || kpi.dados_canal || [];
    const lbl = String(pt.x ?? pt.label ?? '');
    const row = dados.find(d => String(d[Object.keys(d)[0]]) === lbl);
    setSelectedPoint(prev => (prev && prev.label === lbl) ? null : { label: lbl, row });
  };

  // Keep Plotly's original trace data — only style hoverlabels
  const traces = (kpi.plotly_json?.data || []).map(tr => ({
    ...tr,
    hoverlabel: { bgcolor: 'rgba(12,10,29,0.95)', bordercolor: 'rgba(168,85,247,0.5)', font: { color: '#fff', size: 13 } },
  }));

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

      <div className="grafico-container" ref={containerRef}>
        {tipoGrafico === 'matplotlib' && kpi.matplotlib_img && (
          <img src={`data:image/png;base64,${kpi.matplotlib_img}`} alt={`Gráfico ${kpi.titulo}`} />
        )}
        {tipoGrafico === 'plotly' && kpi.plotly_json && (
          <Plot
            data={traces}
            layout={plotLayout}
            config={{ responsive: true, displayModeBar: false, locale: 'pt-BR' }}
            style={{ width: '100%' }}
            className="plotly-alive"
            onClick={handlePlotClick}
            onAfterPlot={() => applyBarGradients(containerRef.current)}
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
