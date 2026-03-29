import { carregarKPIs } from '@/lib/dados';

export default function handler(req, res) {
  const { id } = req.query;

  const kpiMap = { '1': 'kpi_1', '2': 'kpi_2', '3': 'kpi_3' };
  const chave = kpiMap[id];

  if (!chave) {
    return res.status(400).json({ erro: 'KPI inválido. Use 1, 2 ou 3.' });
  }

  try {
    const dados = carregarKPIs();
    res.status(200).json(dados[chave]);
  } catch (err) {
    res.status(500).json({ erro: `Falha ao carregar KPI ${id}`, detalhe: err.message });
  }
}
