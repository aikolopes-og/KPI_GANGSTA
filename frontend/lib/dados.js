import fs from 'fs';
import path from 'path';

/**
 * Carrega os dados KPI do JSON pré-processado pelo Python.
 * Funciona tanto em localhost (Docker) quanto na Vercel.
 */
export function carregarKPIs() {
  const filePath = path.join(process.cwd(), 'data', 'kpis.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}
