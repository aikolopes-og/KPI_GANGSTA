export default function ResumoCards({ resumo }) {
  if (!resumo) return null;

  const cards = [
    { label: 'Total de Registros', valor: resumo.total_registros, formato: 'numero' },
    { label: 'Total de Leads', valor: resumo.total_leads, formato: 'numero' },
    { label: 'Valor Total Pipeline', valor: resumo.valor_total_pipeline, formato: 'moeda' },
    { label: 'Período', valor: `${resumo.periodo?.inicio} a ${resumo.periodo?.fim}`, formato: 'texto' },
  ];

  // Adicionar cards de status
  if (resumo.distribuicao_status) {
    Object.entries(resumo.distribuicao_status).forEach(([status, qtd]) => {
      cards.push({ label: status, valor: qtd, formato: 'numero' });
    });
  }

  return (
    <div className="resumo-grid">
      {cards.map((card, i) => (
        <div key={i} className="resumo-card">
          <div className="valor">
            {card.formato === 'moeda'
              ? `R$${Number(card.valor).toLocaleString('pt-BR')}`
              : card.formato === 'numero'
                ? Number(card.valor).toLocaleString('pt-BR')
                : card.valor}
          </div>
          <div className="label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
