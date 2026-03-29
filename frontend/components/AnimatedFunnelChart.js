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

export default function AnimatedFunnelChart({ trace, onSegmentClick }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState(null);

  const H = typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 420;
  const M = { t: 20, r: 20, b: 20, l: 20 };
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

  const values = trace?.x || [];
  const labels = trace?.y || [];
  const colors = Array.isArray(trace?.marker?.color) ? trace.marker.color : [];
  const n = values.length;
  if (!n) return null;

  const maxVal = Math.max(...values);
  const total = values.reduce((a, b) => a + b, 0);
  const segH = iH / n;
  const gap = 6;

  const segs = values.map((val, i) => {
    const barW = (val / maxVal) * iW * 0.92;
    const x = (iW - barW) / 2;
    const y = i * segH + gap / 2;
    const h = segH - gap;
    return { x, y, w: barW, h, val, label: labels[i] || '', col: colors[i] || '#e94560', i };
  });

  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  return (
    <div ref={ref} className="animated-chart-wrap">
      <svg width={w} height={H} className="animated-chart-svg">
        <defs>
          {segs.map(s => (
            <linearGradient key={s.i} id={`fg${uid}${s.i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={darker(s.col, 18)} />
              <stop offset="25%" stopColor={lighter(s.col, 10)} />
              <stop offset="50%" stopColor={lighter(s.col, 28)} />
              <stop offset="75%" stopColor={lighter(s.col, 10)} />
              <stop offset="100%" stopColor={darker(s.col, 18)} />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${M.l},${M.t})`}>
          {segs.map(s => (
            <g key={s.i}>
              {/* animated segment */}
              <rect
                className="pulse-funnel"
                x={s.x} y={s.y}
                width={s.w} height={s.h}
                rx="8"
                fill={`url(#fg${uid}${s.i})`}
                style={{
                  animationDelay: `${s.i * 0.18}s, ${s.i * 0.18 + 0.7}s`,
                  '--glow': s.col,
                  cursor: 'pointer',
                  opacity: hover !== null && hover !== s.i ? 0.5 : 1,
                  transition: 'opacity .25s',
                }}
                onMouseEnter={() => setHover(s.i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSegmentClick?.({ label: s.label, value: s.val })}
              />
              {/* label + value inside segment */}
              <text
                x={iW / 2} y={s.y + s.h / 2 - 6}
                fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="600"
                textAnchor="middle" pointerEvents="none">
                {s.label}
              </text>
              <text
                x={iW / 2} y={s.y + s.h / 2 + 12}
                fill="rgba(255,255,255,0.7)" fontSize="11"
                textAnchor="middle" pointerEvents="none">
                R$ {s.val.toLocaleString('pt-BR')} ({((s.val / total) * 100).toFixed(1)}%)
              </text>
            </g>
          ))}

          {/* hover % tooltip */}
          {hover !== null && segs[hover] && (() => {
            const s = segs[hover];
            return (
              <g className="svg-tip" transform={`translate(${iW / 2},${s.y - 6})`}>
                <rect x="-52" y="-22" width="104" height="20" rx="5"
                  fill="rgba(12,10,29,0.92)" stroke="rgba(168,85,247,0.4)" strokeWidth="1" />
                <text x="0" y="-8" fill="#fff" fontSize="10" textAnchor="middle">
                  {((s.val / total) * 100).toFixed(1)}% do total
                </text>
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
}
