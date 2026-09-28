// Original, code-drawn anatomical muscle maps (front and back views).
// Shapes are drawn for the figure's left side and mirrored.

const SIL = [
  ['c', 50, 15, 9], ['r', 45.5, 22, 9, 11, 3],
  ['p', 'M29 33 Q50 28 71 33 Q74 44 70 52 Q66 74 65 98 L35 98 Q34 74 30 52 Q26 44 29 33Z'],
  ['e', 24.5, 58, 6, 15], ['e', 20.5, 84, 5, 12.5], ['c', 19, 99, 4],
  ['p', 'M35 96 H65 L67 112 H33Z'],
  ['e', 41, 130, 9.5, 26], ['e', 41.5, 170, 6, 19], ['e', 42, 194, 6, 3.2],
];

const FRONT = {
  traps: [['e', 41.5, 32, 5, 2.6]],
  frontDelts: [['e', 31, 40, 5.5, 6]],
  sideDelts: [['e', 25.5, 44, 3, 6]],
  chest: [['p', 'M35 37 Q44 34 49.3 37 L49.3 55 Q42 59 35 54 Q32 45 35 37Z']],
  biceps: [['e', 24, 60, 4.2, 9.5]],
  forearms: [['e', 20.5, 84, 3.8, 11]],
  abs: [['p', 'M44.5 58 H49.4 V96 Q46 96 44.5 93Z']],
  obliques: [['e', 38.5, 76, 3.8, 12]],
  abductors: [['e', 34.5, 106, 3, 7]],
  quads: [['e', 41, 130, 7, 21]],
  adductors: [['e', 47, 120, 2.6, 11]],
  tibialis: [['e', 40.5, 168, 2.6, 13]],
  calves: [['e', 45, 168, 2.2, 10]],
};

const BACK = {
  traps: [['p', 'M41 31 Q46 28 49.4 28 L49.4 58 L43 42Z']],
  rearDelts: [['e', 30, 40, 5.5, 5.5]],
  sideDelts: [['e', 25.5, 44, 3, 6]],
  upperBack: [['e', 42, 48, 4, 6.5]],
  lats: [['p', 'M32 48 Q37 52 45 64 L44 82 Q37 78 33 68 Q31 58 32 48Z']],
  lowerBack: [['e', 46.5, 88, 3, 10]],
  obliques: [['e', 36.5, 86, 2.8, 7]],
  triceps: [['e', 24, 58, 4.2, 9.5]],
  forearms: [['e', 20.5, 84, 3.8, 11]],
  abductors: [['e', 36, 99, 4, 4]],
  glutes: [['e', 43, 107, 7.5, 9]],
  hamstrings: [['e', 41, 136, 6.5, 18]],
  adductors: [['e', 47.3, 124, 2.4, 9]],
  calves: [['e', 41, 166, 5, 12]],
};

const ALIAS = {
  core: ['abs', 'obliques'],
  fullBody: ['quads', 'glutes', 'hamstrings', 'lowerBack', 'traps', 'frontDelts'],
};
const BACK_KEYS = new Set(['lats', 'upperBack', 'lowerBack', 'traps', 'rearDelts', 'triceps', 'glutes', 'hamstrings', 'calves']);
const LOWER_KEYS = new Set(['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves', 'tibialis']);

const arr = v => (Array.isArray(v) ? v : v ? [v] : []);
const expand = list => arr(list).flatMap(m => ALIAS[m] || [m]);

function shape(s, attr) {
  const [k, ...a] = s;
  if (k === 'e') return `<ellipse cx="${a[0]}" cy="${a[1]}" rx="${a[2]}" ry="${a[3]}" ${attr}/>`;
  if (k === 'c') return `<circle cx="${a[0]}" cy="${a[1]}" r="${a[2]}" ${attr}/>`;
  if (k === 'r') return `<rect x="${a[0]}" y="${a[1]}" width="${a[2]}" height="${a[3]}" rx="${a[4]}" ${attr}/>`;
  return `<path d="${a[0]}" ${attr}/>`;
}

// paint: function(kind) -> attribute string, kind in body|idle|pri|sec
function figure(regions, pri, sec, paint) {
  const body = SIL.map(s => shape(s, paint('body'))).join('');
  let m = '';
  for (const [key, shapes] of Object.entries(regions)) {
    const kind = pri.has(key) ? 'pri' : sec.has(key) ? 'sec' : 'idle';
    m += shapes.map(s => shape(s, paint(kind))).join('');
  }
  const mirror = x => `<g>${x}</g><g transform="translate(100 0) scale(-1 1)">${x}</g>`;
  return mirror(body) + mirror(m); // outline on both sides first, then muscles on top
}

const cssPaint = k => `class="mm-${k}"`;

export function muscleMapSVG(primary, secondary) {
  const pri = new Set(expand(primary));
  const sec = new Set(expand(secondary).filter(m => !pri.has(m)));
  return `<svg class="mm" viewBox="0 0 210 212" aria-hidden="true" focusable="false">
    <g>${figure(FRONT, pri, sec, cssPaint)}</g>
    <g transform="translate(110 0)">${figure(BACK, pri, sec, cssPaint)}</g>
    <text x="50" y="210" text-anchor="middle" class="mm-t">Front</text>
    <text x="160" y="210" text-anchor="middle" class="mm-t">Back</text>
  </svg>`;
}

const cache = new Map();
export function resetThumbs() { cache.clear(); }

// Small single-view thumbnail as a data URL (cheap to render in long lists).
export function muscleThumb(e, colors) {
  const key = e.id + '|' + colors.pri + colors.body;
  if (cache.has(key)) return cache.get(key);
  const pri = new Set(expand(e.primary));
  const sec = new Set(expand(e.secondary).filter(m => !pri.has(m)));
  const prim = expand(e.primary);
  const back = prim.some(m => BACK_KEYS.has(m)) && !prim.includes('quads');
  const lower = prim.every(m => LOWER_KEYS.has(m));
  const vb = lower ? '14 92 72 112' : '6 2 88 104';
  const paint = k => `fill="${colors[k]}"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${figure(back ? BACK : FRONT, pri, sec, paint)}</svg>`;
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  cache.set(key, url);
  return url;
}
