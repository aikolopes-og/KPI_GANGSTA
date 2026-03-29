import kpisData from '../data/kpis.json';

/**
 * Carrega os dados KPI do JSON pre-processado pelo Python.
 * Usa import direto para que Next.js inclua no bundle (funciona na Vercel).
 */
export function carregarKPIs() {
  return kpisData;
}
