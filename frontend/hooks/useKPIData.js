import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook de dados KPI — Modo Híbrido:
 * 1. Sempre carrega via API Route do Next.js (/api/kpis) — funciona em Docker e Vercel
 * 2. Se backend FastAPI estiver disponível (Docker), conecta WebSocket para tempo real
 */
export function useKPIData() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [wsConectado, setWsConectado] = useState(false);
  const [modo, setModo] = useState('estatico');
  const wsRef = useRef(null);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const resp = await fetch('/api/kpis');
      if (!resp.ok) throw new Error('Falha ao carregar dados');
      const data = await resp.json();
      setDados(data);
      setErro(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();

    const backendHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const wsUrl = `ws://${backendHost}:8000/ws/kpis`;
    let reconectar;
    let tentativas = 0;
    const MAX_TENTATIVAS = 3;

    function conectarWS() {
      if (tentativas >= MAX_TENTATIVAS) {
        setModo('estatico');
        return;
      }
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConectado(true);
          setModo('tempo-real');
          tentativas = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setDados(data);
            setCarregando(false);
          } catch (_) { /* ignora */ }
        };

        ws.onclose = () => {
          setWsConectado(false);
          tentativas++;
          if (tentativas < MAX_TENTATIVAS) {
            reconectar = setTimeout(conectarWS, 5000);
          } else {
            setModo('estatico');
          }
        };

        ws.onerror = () => { ws.close(); };
      } catch (_) {
        setModo('estatico');
      }
    }

    conectarWS();

    return () => {
      clearTimeout(reconectar);
      if (wsRef.current) wsRef.current.close();
    };
  }, [carregarDados]);

  return { dados, carregando, erro, wsConectado, modo, recarregar: carregarDados };
}
