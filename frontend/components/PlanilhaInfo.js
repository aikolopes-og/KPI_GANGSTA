export default function PlanilhaInfo({ resumo, meta, kpi2 }) {
  if (!resumo || !meta) return null;

  const campos = [
    'ID', 'Etapa', 'Canal', 'Leads', 'Conversao_Percentual',
    'Tempo_dias', 'Valor_Potencial', 'Responsavel',
    'Data_Prospecção', 'Data_Contato', 'Data_Proposta',
    'Data_Fechamento', 'Status', 'Origem_Lead'
  ];

  // ROI = Valor Ganho / Valor Total Pipeline
  const valorGanho = kpi2?.dados?.find(d => d.Status === 'Ganho')?.valor_total || 0;
  const valorPerdido = kpi2?.dados?.find(d => d.Status === 'Perdido')?.valor_total || 0;
  const valorTotal = resumo.valor_total_pipeline || 0;
  const roiPercent = valorTotal > 0 ? ((valorGanho / valorTotal) * 100).toFixed(1) : '0.0';
  const roiClass = valorGanho > valorPerdido ? 'roi-positivo' : 'roi-negativo';

  return (
    <div className="planilha-info">
      <div className="planilha-info-header">
        <div className="planilha-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
          </svg>
        </div>
        <div>
          <h3>{meta.planilha}</h3>
          <p className="planilha-sub">Funil de vendas — {resumo.total_registros} registros</p>
        </div>
      </div>

      <div className="planilha-grid">
        {/* Campos */}
        <div className="planilha-item">
          <div className="planilha-item-label">Campos</div>
          <div className="planilha-campos-list">
            {campos.map((c) => (
              <span key={c} className="campo-tag">{c}</span>
            ))}
          </div>
        </div>

        {/* Período */}
        <div className="planilha-item">
          <div className="planilha-item-label">Período</div>
          <div className="planilha-item-valor">
            {formatDate(resumo.periodo?.inicio)} — {formatDate(resumo.periodo?.fim)}
          </div>
        </div>

        {/* Objetivo */}
        <div className="planilha-item">
          <div className="planilha-item-label">Objetivo</div>
          <div className="planilha-item-valor">
            Analisar o funil de vendas por canal, status e ciclo de tempo, identificando
            gargalos e oportunidades de otimização para maximizar conversões e receita.
          </div>
        </div>

        {/* ROI Geral */}
        <div className="planilha-item planilha-roi">
          <div className="planilha-item-label">ROI Geral</div>
          <div className={`roi-valor ${roiClass}`}>
            {roiPercent}%
          </div>
          <div className="roi-detalhe">
            <span className="roi-ganho">Ganho: R${Number(valorGanho).toLocaleString('pt-BR')}</span>
            <span className="roi-separador">/</span>
            <span className="roi-total">Pipeline: R${Number(valorTotal).toLocaleString('pt-BR')}</span>
          </div>
          {valorGanho <= valorPerdido && (
            <div className="roi-alerta">
              Valor perdido (R${Number(valorPerdido).toLocaleString('pt-BR')}) supera o ganho
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
