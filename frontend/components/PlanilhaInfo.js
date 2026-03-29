export default function PlanilhaInfo({ resumo, meta, kpi2 }) {
  if (!resumo || !meta) return null;

  const campos = [
    'ID', 'Etapa', 'Canal', 'Leads', 'Conversao_Percentual',
    'Tempo_dias', 'Valor_Potencial', 'Responsavel',
    'Data_Prospecção', 'Data_Contato', 'Data_Proposta',
    'Data_Fechamento', 'Status', 'Origem_Lead'
  ];

  const valorGanho = kpi2?.dados?.find(d => d.Status === 'Ganho')?.valor_total || 0;
  const valorPerdido = kpi2?.dados?.find(d => d.Status === 'Perdido')?.valor_total || 0;
  const valorTotal = resumo.valor_total_pipeline || 0;
  const roiPercent = valorTotal > 0 ? ((valorGanho / valorTotal) * 100).toFixed(1) : '0.0';
  const roiClass = valorGanho > valorPerdido ? 'roi-positivo' : 'roi-negativo';

  return (
    <section className="planilha-section">
      {/* Título da seção */}
      <div className="planilha-section-title">
        <span className="planilha-section-line" />
        <h2>Sobre os Dados</h2>
        <span className="planilha-section-line" />
      </div>

      <div className="planilha-card">
        {/* Glow decorativo */}
        <div className="planilha-glow" />

        {/* Header com nome e info */}
        <div className="planilha-header">
          <div className="planilha-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
          </div>
          <div className="planilha-title-block">
            <h3>{meta.planilha}</h3>
            <p>{resumo.total_registros} registros &middot; 14 campos</p>
          </div>
        </div>

        {/* Corpo — layout horizontal em 2 colunas: esquerda (periodo+objetivo) / direita (ROI) */}
        <div className="planilha-body">
          {/* Coluna esquerda: info cards compactos */}
          <div className="planilha-info-col">
            <div className="planilha-detail">
              <span className="detail-label">Período</span>
              <span className="detail-value">{formatDate(resumo.periodo?.inicio)} — {formatDate(resumo.periodo?.fim)}</span>
            </div>
            <div className="planilha-detail">
              <span className="detail-label">Objetivo</span>
              <span className="detail-value detail-desc">
                Analisar o funil de vendas por canal, status e ciclo de tempo,
                identificando gargalos e oportunidades para maximizar conversões.
              </span>
            </div>
          </div>

          {/* Coluna direita: ROI */}
          <div className="planilha-roi-col">
            <div className="roi-ring">
              <svg viewBox="0 0 120 120" className="roi-svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#roiGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Number(roiPercent) * 3.267} 326.7`}
                  transform="rotate(-90 60 60)"
                  className="roi-arc"
                />
                <defs>
                  <linearGradient id="roiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="roi-center">
                <span className={`roi-number ${roiClass}`}>{roiPercent}%</span>
                <span className="roi-label">ROI</span>
              </div>
            </div>
            <div className="roi-meta">
              <span className="roi-line roi-ganho">Ganho R${Number(valorGanho).toLocaleString('pt-BR')}</span>
              <span className="roi-line roi-pipeline">Pipeline R${Number(valorTotal).toLocaleString('pt-BR')}</span>
              {valorGanho <= valorPerdido && (
                <span className="roi-alert">Perdido supera ganho</span>
              )}
            </div>
          </div>
        </div>

        {/* Campos — lista de tags no rodapé do card */}
        <div className="planilha-campos">
          <span className="campos-label">Campos da planilha</span>
          <div className="campos-list">
            {campos.map((c, i) => (
              <span key={c} className="campo-pill" style={{ animationDelay: `${i * 0.03}s` }}>{c}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
