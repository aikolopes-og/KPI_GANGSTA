import { carregarKPIs } from '@/lib/dados';

export default function handler(req, res) {
  try {
    const dados = carregarKPIs();
    res.status(200).json(dados.resumo);
  } catch (err) {
    res.status(500).json({ erro: 'Falha ao carregar resumo', detalhe: err.message });
  }
}
