// Minimal dependency-free SVG line chart.
const DAY = 86400000;

export function movingAverage(pts, days = 7) {
  return pts.map((p, i) => {
    let s = 0, n = 0;
    for (let j = i; j >= 0 && p.t - pts[j].t < days * DAY; j--) { s += pts[j].v; n++; }
    return { t: p.t, v: s / n };
  });
}

let gid = 0;
export function lineChart(series, { fmt = v => String(v), height = 150, ma = false, label = 'Chart', empty = 'Not enough data in this period yet.' } = {}) {
  const pts = series.filter(p => p.v != null && isFinite(p.v)).sort((a, b) => a.t - b.t);
  if (pts.length < 2) return `<p class="chart-empty">${empty}</p>`;
  const line = ma ? movingAverage(pts) : pts;
  const W = 340, H = height, L = 2, R = 6, T = 16, B = 20;
  let x0 = pts[0].t, x1 = pts.at(-1).t; if (x1 === x0) x1 = x0 + DAY;
  const all = pts.map(p => p.v).concat(line.map(p => p.v));
  let y0 = Math.min(...all), y1 = Math.max(...all);
  const pad = (y1 - y0) * 0.15 || Math.abs(y1) * 0.05 || 1; y0 -= pad; y1 += pad;
  const X = t => L + (t - x0) / (x1 - x0) * (W - L - R);
  const Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const d = line.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join('');
  const area = d + `L${X(line.at(-1).t).toFixed(1)} ${H - B}L${X(line[0].t).toFixed(1)} ${H - B}Z`;
  const id = 'cg' + (++gid);
  const raw = ma
    ? pts.map(p => `<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="1.7" class="c-raw"/>`).join('')
    : pts.length <= 40 ? pts.map(p => `<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.3" class="c-dot"/>`).join('') : '';
  const last = line.at(-1);
  const dt = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const hi = Math.max(...all), lo = Math.min(...all);
  const aria = `${label}: ${fmt(line[0].v)} on ${dt(line[0].t)} to ${fmt(last.v)} on ${dt(last.t)}. Range ${fmt(lo)} to ${fmt(hi)}.`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">
    <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="c-g1"/><stop offset="1" class="c-g2"/></linearGradient></defs>
    <line x1="0" x2="${W}" y1="${Y(hi).toFixed(1)}" y2="${Y(hi).toFixed(1)}" class="c-grid"/>
    <line x1="0" x2="${W}" y1="${Y(lo).toFixed(1)}" y2="${Y(lo).toFixed(1)}" class="c-grid"/>
    <path d="${area}" fill="url(#${id})"/>
    ${raw}
    <path d="${d}" class="c-line"/>
    <circle cx="${X(last.t).toFixed(1)}" cy="${Y(last.v).toFixed(1)}" r="4" class="c-end"/>
    <text x="${W - 2}" y="${(Y(hi) - 4).toFixed(1)}" text-anchor="end" class="c-lbl">${fmt(hi)}</text>
    <text x="${W - 2}" y="${(Y(lo) + 12).toFixed(1)}" text-anchor="end" class="c-lbl">${fmt(lo)}</text>
    <text x="0" y="${H - 4}" class="c-lbl">${dt(pts[0].t)}</text>
    <text x="${W - 2}" y="${H - 4}" text-anchor="end" class="c-lbl">${dt(pts.at(-1).t)}</text>
  </svg>`;
}
