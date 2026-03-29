import { useState, useEffect, useRef, useMemo } from 'react';

/* ── colour helpers (hex only) ── */
function hexRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128];
}
function lighter(hex, pct) {
  const [r, g, b] = hexRgb(hex), f = pct / 100;
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * f))},${Math.min(255, Math.round(g + (255 - g) * f))},${Math.min(255, Math.round(b + (255 - b) * f))})`;
}
function darker(hex, pct) {
  const [r, g, b] = hexRgb(hex), f = 1 - pct / 100;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

export default function AnimatedBarChart({ traces, barmode, onBarClick }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState(null);

  const H = typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 420;
  const M = { t: 30, r: 20, b: 70, l: 58 };
  const iW = Math.max(80, w - M.l - M.r);
  const iH = Math.max(80, H - M.t - M.b);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    setW(el.offsetWidth || 600);
    return () => ro.disconnect();
  }, []);

  const stacked = barmode === 'stack';
  const cats = traces[0]?.x || [];
  const nTr = traces.length;
  const nCat = cats.length;
  if (!nCat || !nTr) return null;

  /* max Y */
  let maxY = stacked
    ? Math.max(...cats.map((_, ci) => traces.reduce((s, t) => s + (t.y[ci] || 0), 0)))
    : Math.max(...traces.flatMap(t => t.y));
  maxY *= 1.12;

  /* bar geometry */
  const gW = iW / nCat;
  const pad = gW * 0.22;
  const aW = gW - pad;
  const bW = stacked ? aW : aW / nTr;
  const gap = stacked ? 0 : Math.min(3, bW * 0.08);
  const yOf = v => iH * (1 - v / maxY);

  /* y-axis ticks */
  const nTick = 5;
  const step = maxY / nTick;
  const ticks = Array.from({ length: nTick + 1 }, (_, i) => step * i);

  /* build bar rects */
  const bars = [];
  let idx = 0;
  cats.forEach((cat, ci) => {
    let base = 0;
    traces.forEach((tr, ti) => {
      const v = tr.y[ci] || 0;
      const col = tr.marker?.color || '#e94560';
      let bx, by, bh;
      if (stacked) {
        bx = ci * gW + pad / 2;
        by = yOf(base + v);
        bh = (v / maxY) * iH;
        base += v;
      } else {
        bx = ci * gW + pad / 2 + ti * bW + gap * ti;
        by = yOf(v);
        bh = (v / maxY) * iH;
      }
      bars.push({ x: bx, y: by, w: bW - gap, h: bh, v, col, cat, name: tr.name, ci, ti, i: idx++ });
    });
  });

  /* unique id prefix to avoid gradient collisions across charts */
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  return (
    <div ref={ref} className="animated-chart-wrap">
      <svg width={w} height={H} className="animated-chart-svg">
        <defs>
          {bars.map(b => (
            <linearGradient key={b.i} id={`bg${uid}${b.i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lighter(b.col, 42)} />
              <stop offset="28%" stopColor={lighter(b.col, 14)} />
              <stop offset="62%" stopColor={b.col} />
              <stop offset="100%" stopColor={darker(b.col, 30)} />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${M.l},${M.t})`}>
          {/* grid lines + y labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={0} y1={yOf(t)} x2={iW} y2={yOf(t)} stroke="rgba(255,255,255,0.06)" />
              <text x={-10} y={yOf(t) + 4} fill="rgba(255,255,255,0.45)" fontSize="10" textAnchor="end">
                {t >= 1000 ? `${(t / 1000).toFixed(0)}k` : t % 1 === 0 ? String(Math.round(t)) : t.toFixed(1)}
              </text>
            </g>
          ))}

          {/* animated bars */}
          {bars.map(b => (
            <rect
              key={b.i}
              className="pulse-bar"
              x={b.x} y={b.y}
              width={Math.max(0, b.w)} height={Math.max(0, b.h)}
              rx="4"
              fill={`url(#bg${uid}${b.i})`}
              style={{
                animationDelay: `${b.i * 0.10}s, ${b.i * 0.10 + 0.75}s`,
                '--glow': b.col,
                cursor: 'pointer',
                opacity: hover !== null && hover !== b.i ? 0.45 : 1,
                transition: 'opacity .25s',
              }}
              onMouseEnter={() => setHover(b.i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onBarClick?.({ label: b.cat, traceName: b.name, value: b.v })}
            />
          ))}

          {/* hover tooltip */}
          {hover !== null && bars[hover] && (() => {
            const b = bars[hover];
            const tx = b.x + b.w / 2, ty = b.y - 12;
            const txt = b.v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
            const tw = Math.max(64, txt.length * 8 + 24);
            return (
              <g className="svg-tip">
                <rect x={tx - tw / 2} y={ty - 24} width={tw} height={22} rx="6"
                  fill="rgba(12,10,29,0.92)" stroke="rgba(168,85,247,0.45)" strokeWidth="1" />
                <text x={tx} y={ty - 9} fill="#fff" fontSize="11" textAnchor="middle">{txt}</text>
              </g>
            );
          })()}

          {/* x-axis labels */}
          {cats.map((c, i) => (
            <text key={i} x={i * gW + gW / 2} y={iH + 22}
              fill="rgba(255,255,255,0.55)" fontSize="11" textAnchor="middle">{c}</text>
          ))}
        </g>

        {/* legend */}
        <g transform={`translate(${M.l},${H - 16})`}>
          {traces.map((tr, ti) => {
            const lx = ti * Math.min(180, iW / nTr);
            return (
              <g key={ti} transform={`translate(${lx},0)`}>
                <rect width="10" height="10" rx="2" fill={tr.marker?.color} />
                <text x="14" y="9" fill="rgba(255,255,255,0.6)" fontSize="10">{tr.name}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
