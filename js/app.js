// LiftLog — main application
import * as db from './db.js';
import { EXERCISES, EX_BY_ID, MUSCLES, EQUIPMENT, FILTER_GROUPS, EXERCISE_DB_VERSION, muscleLabel, searchText, describe } from './data.js';
import { lineChart } from './charts.js';

const APP_VERSION = '1.0.0';
const SCHEMA_VERSION = 1;
const LB_PER_KG = 2.20462262185;
const DAY = 86400000;

const DEFAULTS = { theme: 'system', units: 'lb', defaultSets: 3, increment: 5, showRPE: false, showSetTypes: false, excludeWarmups: true, onboarded: false, lastBackup: null };
const SET_TYPES = { working: 'Working', warmup: 'Warm-up', backoff: 'Back-off', drop: 'Drop set', failure: 'Failure' };
const SET_SHORT = { working: '', warmup: 'W', backoff: 'B', drop: 'D', failure: 'F' };
const NO_LOAD_EQUIP = new Set(['Bodyweight', 'Weighted bodyweight', 'Resistance band']);

const S = {
  settings: { ...DEFAULTS }, meas: [], workouts: [], templates: [], custom: [], customMap: {},
  favs: new Set(), recents: [], session: null, snapshotAt: null,
  tab: 'today', wSeg: 'templates', pSeg: 'body',
  lib: { q: '', group: 'all', equip: '' }, bodyRange: '3M', bodyMA: true,
  stack: [], onbStep: 0, persisted: null, ready: false,
};

// ---------- utilities
const $ = s => document.querySelector(s);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dateOf = v => (typeof v === 'string' ? parseYmd(v) : new Date(v));
const fmtDate = (v, o = { month: 'short', day: 'numeric' }) => dateOf(v).toLocaleDateString(undefined, o);
const fmtTime = t => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const num = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
const unit = () => S.settings.units;
const toDisp = lb => (lb == null ? null : unit() === 'kg' ? lb / LB_PER_KG : lb);
const fromDisp = v => (v == null ? null : unit() === 'kg' ? v * LB_PER_KG : v);
const fmtNum = (v, d = 1) => (v == null || !isFinite(v) ? '–' : (Math.round(v * 10 ** d) / 10 ** d).toLocaleString(undefined, { maximumFractionDigits: d }));
const fmtW = lb => fmtNum(toDisp(lb));
const fmtVol = lb => fmtNum(toDisp(lb), 0);
const inVal = lb => (lb == null ? '' : String(Math.round(toDisp(lb) * 100) / 100));
const signed = (v, d = 1) => (Math.abs(v) < 0.05 ? '±0' : (v > 0 ? '+' : '−') + fmtNum(Math.abs(v), d));
const fmtDur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + ':' + pad(m) : m) + ':' + pad(s % 60); };
const e1rm = (w, r) => w * (1 + r / 30);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const ICON = {
  today: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24"><path d="M2.5 12h19M5 8v8M8 6v12M16 6v12M19 8v8"/></svg>',
  book: '<svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M3.5 19.5h17"/><path d="M5 15l4.5-5 4 3 6-7"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" class="i"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" class="i"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  down: '<svg viewBox="0 0 24 24" class="i"><path d="M6 9l6 6 6-6"/></svg>',
  back: '<svg viewBox="0 0 24 24" class="i"><path d="M15 5l-7 7 7 7"/></svg>',
  star: '<svg viewBox="0 0 24 24" class="i"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"/></svg>',
  info: '<svg viewBox="0 0 24 24" class="i"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>',
  up: '<svg viewBox="0 0 24 24" class="i"><path d="M6 15l6-6 6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" class="i"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  dots: '<svg viewBox="0 0 24 24" class="i"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>',
};

// ---------- toast & dialogs
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

function dialog({ title, body = '', buttons, input = null, sheet = false }) {
  return new Promise(res => {
    const wrap = document.createElement('div');
    wrap.className = 'dlg-wrap' + (sheet ? ' as-sheet' : '');
    wrap.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t">
      <h2 id="dlg-t">${esc(title)}</h2>${body ? `<p class="dlg-p">${body}</p>` : ''}
      ${input ? `<input class="dlg-in" type="text" value="${esc(input.value || '')}" placeholder="${esc(input.placeholder || '')}" aria-label="${esc(title)}">` : ''}
      <div class="dlg-btns ${sheet ? 'stack' : ''}">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></div>`;
    const close = v => { wrap.remove(); res(v); };
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) { const btn = buttons[+b.dataset.i]; close(btn.value === '__input' ? wrap.querySelector('.dlg-in').value : btn.value); }
      else if (e.target === wrap) close(null);
    });
    document.body.appendChild(wrap);
    const inp = wrap.querySelector('.dlg-in');
    if (inp) inp.focus(); else wrap.querySelector('.dlg-btns .btn:last-child')?.focus({ preventScroll: true });
  });
}
const confirmDlg = (title, body, ok = 'Confirm', danger = false) =>
  dialog({ title, body, buttons: [{ label: 'Cancel', value: false, cls: 'ghost' }, { label: ok, value: true, cls: danger ? 'danger' : 'primary' }] });
const promptDlg = (title, value, placeholder) =>
  dialog({ title, input: { value, placeholder }, buttons: [{ label: 'Cancel', value: null, cls: 'ghost' }, { label: 'Save', value: '__input', cls: 'primary' }] });
const actionSheet = (title, items) =>
  dialog({ title, sheet: true, buttons: [...items.map(i => ({ label: i.label, value: i.value, cls: i.danger ? 'danger-ghost' : 'ghost' })), { label: 'Cancel', value: null, cls: 'cancel' }] });

// ---------- exercises
function ex(id) {
  return EX_BY_ID[id] || S.customMap[id] || { id, name: 'Unknown exercise', family: id, variation: '', primary: 'fullBody', secondary: [], equipment: 'Other', patternLabel: '', instructions: [], tips: [], metric: 'reps', missing: true };
}
const allExercises = () => EXERCISES.concat(S.custom.filter(c => !c.archived));
const familyOf = e => allExercises().filter(x => x.family === e.family);
const isTime = e => e.metric === 'time';


// ---------- body composition
const comp = m => (m && m.bf != null ? { fat: m.weight * m.bf / 100, lean: m.weight - m.weight * m.bf / 100 } : { fat: null, lean: null });
function measAtOrBefore(date) { let r = null; for (const m of S.meas) { if (m.date <= date) r = m; else break; } return r; }
const todayMeas = () => S.meas.find(m => m.date === ymd(new Date()));

// ---------- workout stats
function eligible(s) { return s.done && s.reps > 0 && !(S.settings.excludeWarmups && s.type === 'warmup'); }
function workoutStats(w) {
  let sets = 0, reps = 0, vol = 0, exs = 0;
  for (const we of w.exercises) {
    const e = ex(we.exerciseId); let any = false;
    for (const s of we.sets) {
      if (!eligible(s)) continue;
      any = true; sets++;
      if (!isTime(e)) { reps += s.reps; vol += (s.weight || 0) * s.reps; }
    }
    if (any) exs++;
  }
  return { sets, reps, vol, exs, dur: w.endTime ? w.endTime - w.startTime : Date.now() - w.startTime };
}
function exerciseSessions(ids, excludeId) {
  const out = [];
  for (const w of S.workouts) {
    if (w.id === excludeId) continue;
    const sets = [];
    for (const we of w.exercises) if (ids.has(we.exerciseId)) sets.push(...we.sets.filter(eligible));
    if (sets.length) out.push({ w, sets });
  }
  return out.sort((a, b) => a.w.startTime - b.w.startTime);
}
function records(sessions) {
  const r = { maxW: 0, maxWSet: null, e1: 0, e1Set: null, setVol: 0, setVolSet: null, sessVol: 0, sessVolDate: null, sessions: sessions.length, sets: 0, repAt: new Map(), maxReps: 0 };
  for (const { w, sets } of sessions) {
    let sv = 0;
    for (const s of sets) {
      const wt = s.weight || 0; r.sets++;
      sv += wt * s.reps;
      if (wt > r.maxW || (wt === r.maxW && r.maxWSet && s.reps > r.maxWSet.reps)) { r.maxW = wt; r.maxWSet = s; }
      const e = e1rm(wt, s.reps); if (e > r.e1) { r.e1 = e; r.e1Set = s; }
      if (wt * s.reps > r.setVol) { r.setVol = wt * s.reps; r.setVolSet = s; }
      r.repAt.set(wt, Math.max(r.repAt.get(wt) || 0, s.reps));
      r.maxReps = Math.max(r.maxReps, s.reps);
    }
    if (sv > r.sessVol) { r.sessVol = sv; r.sessVolDate = w.date; }
  }
  return r;
}
function repBestAtOrAbove(r, wt) { let b = 0; for (const [k, v] of r.repAt) if (k >= wt) b = Math.max(b, v); return b; }

function prsFor(w) {
  const res = [];
  for (const we of w.exercises) {
    const e = ex(we.exerciseId);
    const sets = we.sets.filter(eligible);
    if (!sets.length) continue;
    const prior = records(exerciseSessions(new Set([we.exerciseId]), w.id).filter(s => s.w.startTime < w.startTime));
    if (!prior.sessions) continue;
    const kinds = new Set(), flagged = new Set(); let sv = 0;
    for (const s of sets) {
      const wt = s.weight || 0;
      if (isTime(e)) { if (s.reps > prior.maxReps) { kinds.add('Longest hold'); flagged.add(s.id); } continue; }
      sv += wt * s.reps;
      if (wt > prior.maxW) { kinds.add('Weight'); flagged.add(s.id); }
      if (wt > 0 && e1rm(wt, s.reps) > prior.e1 + 1e-9) { kinds.add('Est. 1RM'); flagged.add(s.id); }
      if (wt > 0 && wt * s.reps > prior.setVol) { kinds.add('Set volume'); flagged.add(s.id); }
      const best = repBestAtOrAbove(prior, wt);
      if (best > 0 && s.reps > best) { kinds.add('Reps'); flagged.add(s.id); }
    }
    if (sv > 0 && sv > prior.sessVol) kinds.add('Session volume');
    if (kinds.size) res.push({ exerciseId: we.exerciseId, kinds: [...kinds], flagged });
  }
  return res;
}
function lastPerformance(exId, w) {
  for (const h of S.workouts) {
    if (w && (h.id === w.id || h.startTime >= w.startTime)) continue;
    const we = h.exercises.find(x => x.exerciseId === exId);
    const sets = we ? we.sets.filter(s => s.done) : [];
    if (sets.length) return { w: h, sets };
  }
  return null;
}
const repRange = t => (t.repMax && t.repMax !== t.repMin ? `${t.repMin}–${t.repMax}` : `${t.repMin}`);
const estMinutes = t => Math.max(10, Math.round((t.exercises.reduce((a, x) => a + x.sets, 0) * 2.5 + t.exercises.length * 1.5) / 5) * 5);
function fmtSet(s, e) {
  const tag = S.settings.showSetTypes && s.type !== 'working' ? `<span class="tag">${SET_SHORT[s.type]}</span>` : '';
  if (isTime(e)) return `${s.weight ? fmtW(s.weight) + ' ' + unit() + ', ' : ''}${s.reps ?? '–'} s${tag}`;
  return `${fmtW(s.weight)} × ${s.reps ?? '–'}${tag}`;
}
function sortWorkouts() { S.workouts.sort((a, b) => b.startTime - a.startTime); }
function templateLastUsed(t) { const w = S.workouts.find(w => w.templateId === t.id); return w ? w.startTime : 0; }
function orderedTemplates() { return [...S.templates].sort((a, b) => templateLastUsed(a) - templateLastUsed(b)); }

// ---------- persistence
const saveSettings = () => db.put('meta', S.settings, 'settings');
const saveFavs = () => db.put('meta', [...S.favs], 'favorites');
function touchRecent(id) {
  S.recents = [id, ...S.recents.filter(x => x !== id)].slice(0, 20);
  db.put('meta', S.recents, 'recents');
}
let saveTimer = null;
function saveSession(now) {
  if (!S.session || S.session.mode !== 'active') return;
  clearTimeout(saveTimer);
  const run = () => {
    if (!S.session || S.session.mode !== 'active') return;
    S.session.w.updatedAt = Date.now();
    db.put('meta', clone(S.session.w), 'active').catch(err => toast('Could not save workout: ' + err.message));
  };
  if (now) run(); else saveTimer = setTimeout(run, 250);
}
function flushSession() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveSession(true); } }

async function loadAll() {
  const [settings, active, favs, recents, meas, workouts, templates, custom, snap] = await Promise.all([
    db.get('meta', 'settings'), db.get('meta', 'active'), db.get('meta', 'favorites'), db.get('meta', 'recents'),
    db.getAll('measurements'), db.getAll('workouts'), db.getAll('templates'), db.getAll('customExercises'),
    db.get('meta', 'preImportSnapshot'),
  ]);
  S.settings = { ...DEFAULTS, ...(settings || {}) };
  S.favs = new Set(favs || []);
  S.recents = recents || [];
  S.meas = (meas || []).sort((a, b) => (a.date < b.date ? -1 : 1));
  S.workouts = workouts || []; sortWorkouts();
  S.templates = (templates || []).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  S.custom = custom || [];
  S.customMap = Object.fromEntries(S.custom.map(c => [c.id, c]));
  S.session = active ? { mode: 'active', w: active, open: false } : null;
  S.snapshotAt = snap ? snap.exportDate : null;
}

// =================================================================== RENDER
function render() {
  const onb = $('#onb');
  if (!S.settings.onboarded) { onb.hidden = false; onb.innerHTML = onboardingHTML(); $('#shell').hidden = true; return; }
  onb.hidden = true; $('#shell').hidden = false;
  const v = $('#view'); const st = v.scrollTop;
  v.innerHTML = VIEWS[S.tab]();
  v.scrollTop = st;
  renderTabs(); renderMini(); renderSession(); renderOverlays();
}
const renderView = () => { const v = $('#view'); const st = v.scrollTop; v.innerHTML = VIEWS[S.tab](); v.scrollTop = st; };

const TABS = [['today', 'Today', ICON.today], ['workouts', 'Workouts', ICON.dumbbell], ['exercises', 'Exercises', ICON.book], ['progress', 'Progress', ICON.chart], ['more', 'More', ICON.more]];
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, l, i]) => `<button class="tab" data-a="tab" data-tab="${k}" ${S.tab === k ? 'aria-current="page"' : ''}>${i}<span>${l}</span></button>`).join('');
}
function renderMini() {
  const m = $('#mini');
  const on = S.session && S.session.mode === 'active' && !S.session.open;
  m.hidden = !on;
  if (on) m.innerHTML = `<button class="mini-btn" data-a="resume"><span class="mini-dot" aria-hidden="true"></span><span class="mini-t"><strong>${esc(S.session.w.name)}</strong><span id="mini-clock">${clock(Date.now() - S.session.w.startTime)}</span></span><span class="mini-r">Resume</span></button>`;
  document.body.classList.toggle('has-mini', !!on);
}

const stat = (label, value, u) => `<div class="stat"><span class="stat-l">${label}</span><span class="stat-v">${value}${value !== '–' && u ? `<span class="u">${u}</span>` : ''}</span></div>`;
const seg = (act, cur, opts, label) => `<div class="seg" role="group" aria-label="${esc(label)}">${opts.map(([v, l]) => `<button data-a="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;
const empty = (t, p, btn = '') => `<div class="empty"><p class="empty-t">${t}</p><p class="empty-p">${p}</p>${btn}</div>`;

// ---------- Today
function vToday() {
  const now = new Date();
  const m = S.meas.at(-1);
  let body;
  if (!m) body = `<section class="card">${empty('No body measurements yet', 'Log your first measurement to start tracking your body composition.', '<button class="btn primary" data-a="bodyLog">Log measurement</button>')}</section>`;
  else {
    const c = comp(m);
    body = `<section class="card">
      <div class="card-h"><h2>Body</h2><span class="muted sm">${m.date === ymd(now) ? 'Today' : 'Logged ' + fmtDate(m.date)}</span>
      <button class="btn sm" data-a="bodyLog">${todayMeas() ? 'Edit today' : 'Log today'}</button></div>
      <div class="stat-grid">${stat('Weight', fmtW(m.weight), unit())}${stat('Body fat', m.bf == null ? '–' : fmtNum(m.bf), '%')}${stat('Fat mass', c.fat == null ? '–' : fmtW(c.fat), unit())}${stat('Lean mass', c.lean == null ? '–' : fmtW(c.lean), unit())}</div>
      ${deltasHTML(m)}</section>`;
  }
  let wk;
  if (S.session && S.session.mode === 'active') {
    const w = S.session.w;
    wk = `<section class="card live"><div class="card-h"><h2>Workout in progress</h2></div>
      <p class="live-n">${esc(w.name)}</p><p class="muted">${plural(w.exercises.length, 'exercise')}, started ${fmtTime(w.startTime)}</p>
      <button class="btn primary block lg" data-a="resume">Resume workout</button></section>`;
  } else {
    const tpls = orderedTemplates();
    const next = tpls[0];
    wk = `<section class="card"><div class="card-h"><h2>Today’s workout</h2></div>
      ${next ? `<div class="next"><p class="next-n">${esc(next.name)}</p><p class="muted">${plural(next.exercises.length, 'exercise')}, about ${estMinutes(next)} min</p>
        <p class="next-ex">${next.exercises.slice(0, 5).map(x => esc(ex(x.exerciseId).name)).join(', ')}${next.exercises.length > 5 ? '…' : ''}</p>
        <button class="btn primary block lg" data-a="startTpl" data-id="${next.id}">Start ${esc(next.name)}</button></div>
        ${tpls.length > 1 ? `<div class="alt">${tpls.slice(1, 4).map(t => `<button class="chip" data-a="startTpl" data-id="${t.id}">${esc(t.name)}</button>`).join('')}</div>` : ''}` : ''}
      <button class="btn ${next ? 'ghost' : 'primary lg'} block" data-a="startEmpty">Start empty workout</button></section>`;
  }
  const last = S.workouts[0];
  const lastHTML = last ? (() => { const st = workoutStats(last); return `<section><h2 class="sec-h">Last workout</h2>
    <button class="row" data-a="openWorkout" data-id="${last.id}"><span class="row-main"><span class="n">${esc(last.name)}</span>
    <span class="muted sm">${fmtDate(last.date, { weekday: 'short', month: 'short', day: 'numeric' })}, ${fmtDur(st.dur)}, ${plural(st.sets, 'set')}, ${fmtVol(st.vol)} ${unit()}</span></span></button></section>`; })() : '';
  return `<div class="page"><header class="page-h"><div><p class="muted">${now.toLocaleDateString(undefined, { weekday: 'long' })}</p><h1>${now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h1></div></header>
    ${wk}${body}${lastHTML}</div>`;
}
function deltasHTML(m) {
  const d = parseYmd(m.date);
  const cols = [['Yesterday', 1], ['7 days', 7], ['30 days', 30]].map(([l, n]) => {
    const ref = measAtOrBefore(ymd(new Date(d.getTime() - n * DAY)));
    if (!ref) return `<div class="delta"><span class="stat-l">${l}</span><span class="muted">–</span></div>`;
    const dw = toDisp(m.weight) - toDisp(ref.weight);
    const dbf = m.bf != null && ref.bf != null ? m.bf - ref.bf : null;
    return `<div class="delta"><span class="stat-l">${l}</span><span class="dv">${signed(dw)} ${unit()}</span>${dbf != null ? `<span class="muted sm">${signed(dbf)}% fat</span>` : ''}</div>`;
  });
  return `<div class="deltas">${cols.join('')}</div>`;
}

// ---------- Workouts tab
function vWorkouts() {
  const act = S.session && S.session.mode === 'active';
  const top = act ? `<button class="btn primary block lg" data-a="resume">Resume workout in progress</button>` : `<button class="btn primary block lg" data-a="startEmpty">Start empty workout</button>`;
  let body;
  if (S.wSeg === 'templates') {
    body = S.templates.length ? S.templates.map(t => `<div class="tpl">
        <button class="tpl-main" data-a="tplEdit" data-id="${t.id}"><span class="n">${esc(t.name)}</span>
        <span class="muted sm">${plural(t.exercises.length, 'exercise')}, about ${estMinutes(t)} min</span>
        <span class="tpl-ex">${t.exercises.map(x => esc(ex(x.exerciseId).name)).join(', ') || 'No exercises yet'}</span></button>
        <div class="tpl-act"><button class="btn primary sm" data-a="startTpl" data-id="${t.id}">Start</button>
        <button class="icon-btn" data-a="tplMenu" data-id="${t.id}" aria-label="Options for ${esc(t.name)}">${ICON.dots}</button></div></div>`).join('')
      : empty('No templates yet', 'Create a reusable workout to make starting your next session faster.', '<button class="btn primary" data-a="tplNew">Create template</button>');
    body += `<div class="btn-row"><button class="btn" data-a="tplNew">${ICON.plus} New template</button>${S.templates.some(t => ['Push', 'Pull', 'Legs'].includes(t.name)) ? '' : '<button class="btn ghost" data-a="addStarters">Add Push, Pull, Legs</button>'}</div>`;
  } else {
    if (!S.workouts.length) body = empty('No workouts yet', 'Your first workout starts here.', act ? '' : '<button class="btn primary" data-a="startEmpty">Start workout</button>');
    else {
      let month = ''; body = '';
      for (const w of S.workouts) {
        const mo = fmtDate(w.date, { month: 'long', year: 'numeric' });
        if (mo !== month) { if (month) body += '</div>'; month = mo; body += `<h2 class="sec-h">${mo}</h2><div class="list">`; }
        const st = workoutStats(w); const prs = prsFor(w).length;
        body += `<button class="row" data-a="openWorkout" data-id="${w.id}"><span class="row-date"><span>${fmtDate(w.date, { weekday: 'short' })}</span><strong>${dateOf(w.date).getDate()}</strong></span>
          <span class="row-main"><span class="n">${esc(w.name)}</span><span class="muted sm">${fmtDur(st.dur)}, ${plural(st.exs, 'exercise')}, ${plural(st.sets, 'set')}, ${fmtVol(st.vol)} ${unit()}</span></span>
          ${prs ? `<span class="pr-pill">${prs} PR</span>` : ''}</button>`;
      }
      body += '</div>';
    }
  }
  return `<div class="page"><header class="page-h"><h1>Workouts</h1></header>${top}
    ${seg('wSeg', S.wSeg, [['templates', 'Templates'], ['history', 'History']], 'Workouts view')}${body}</div>`;
}

// ---------- Exercise lists (library + picker)
function filterExercises({ q, group, equip }) {
  const g = FILTER_GROUPS.find(x => x[0] === group);
  const muscles = g && g[2] ? new Set(g[2]) : null;
  const toks = (q || '').toLowerCase().replace(/[-–—]/g, ' ').split(/\s+/).filter(Boolean);
  let list = allExercises().filter(e => (!muscles || muscles.has(e.primary)) && (!equip || e.equipment === equip) && toks.every(t => (e._s || searchText(e)).includes(t)));
  list.sort((a, b) => a.name.localeCompare(b.name));
  if (toks.length) { const t0 = toks.join(' '); list.sort((a, b) => (b.name.toLowerCase().startsWith(t0) ? 1 : 0) - (a.name.toLowerCase().startsWith(t0) ? 1 : 0)); }
  return list;
}
const exRow = (e, pick) => pick ? `<div class="ex-row pick"><button class="ex-add" data-a="pickAdd" data-id="${e.id}"><span class="ex-row-t"><span class="n">${esc(e.name)}</span><span class="muted sm">${muscleLabel(e)}, ${esc(e.equipment)}</span></span><span class="add-pill">${ICON.plus}Add</span></button><button class="icon-btn" data-a="exOpen" data-id="${e.id}" aria-label="About ${esc(e.name)}">${ICON.info}</button></div>` : `<button class="ex-row" data-a="exOpen" data-id="${e.id}"><span class="ex-row-t"><span class="n">${esc(e.name)}</span><span class="muted sm">${muscleLabel(e)}</span><span class="muted xs">${esc(e.equipment)}${e.builtIn ? '' : ', custom'}</span></span>${S.favs.has(e.id) ? `<span class="fav-on" aria-label="Favorite">${ICON.star}</span>` : ''}</button>`;
function exListHTML(o) {
  const filtered = o.q || o.group !== 'all' || o.equip;
  const list = filterExercises(o);
  const pick = o.type === 'picker';
  const row = e => exRow(e, pick);
  let h = '';
  const typed = (o.q || '').trim();
  const quick = pick && typed && !allExercises().some(e => e.name.toLowerCase() === typed.toLowerCase())
    ? `<button class="btn ${list.length ? '' : 'primary'} block quick" data-a="quickAdd">${ICON.plus} Add “${esc(typed)}” as a new exercise</button>` : '';
  if (quick && !list.length) h += quick;
  if (pick && !typed) h += `<p class="muted sm pick-tip">Type any exercise name to add it, even if it’s not in the list.</p>`;
  if (!filtered) {
    const rec = S.recents.map(id => ex(id)).filter(e => !e.missing && !e.archived).slice(0, 6);
    const fav = [...S.favs].map(id => ex(id)).filter(e => !e.missing && !e.archived).sort((a, b) => a.name.localeCompare(b.name));
    if (rec.length) h += `<h3 class="list-h">Recently used</h3><div class="list">${rec.map(row).join('')}</div>`;
    if (fav.length) h += `<h3 class="list-h">Favorites</h3><div class="list">${fav.map(row).join('')}</div>`;
    h += `<h3 class="list-h">All exercises (${list.length})</h3>`;
  } else h += `<h3 class="list-h">${plural(list.length, 'result')}</h3>`;
  h += list.length ? `<div class="list">${list.map(row).join('')}</div>` : pick ? '' : empty('No matching exercises', 'Try a different search, or create a custom exercise.', '<button class="btn" data-a="customNew">New exercise</button>');
  if (quick && list.length) h += quick;
  return h;
}
const chips = (cur, act) => `<div class="chips" role="group" aria-label="Muscle group">${FILTER_GROUPS.map(([k, l]) => `<button class="chip" data-a="${act}" data-g="${k}" aria-pressed="${cur === k}">${l}</button>`).join('')}</div>`;
const equipSelect = (cur, key) => `<label class="sel"><span class="sr">Equipment</span><select data-in="${key}"><option value="">All equipment</option>${EQUIPMENT.map(q => `<option ${q === cur ? 'selected' : ''}>${q}</option>`).join('')}</select></label>`;
const searchBox = (val, key) => `<input type="search" class="search" data-in="${key}" value="${esc(val)}" placeholder="Search name, muscle, equipment" aria-label="Search exercises" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">`;

function vExercises() {
  return `<div class="page"><header class="page-h"><h1>Exercises</h1><button class="btn sm" data-a="customNew">${ICON.plus} New</button></header>
    ${searchBox(S.lib.q, 'libQ')}${chips(S.lib.group, 'libGroup')}${equipSelect(S.lib.equip, 'libEquip')}
    <div id="lib-list">${exListHTML(S.lib)}</div></div>`;
}

// ---------- Progress
const RANGES = [['1M', 30], ['3M', 91], ['6M', 182], ['1Y', 365], ['ALL', 1e6]];
const rangeStart = r => Date.now() - RANGES.find(x => x[0] === r)[1] * DAY;
function changeHead(label, pts, fmt, u) {
  if (pts.length < 2) return `<div class="ch-h"><h3>${label}</h3></div>`;
  const a = pts[0].v, b = pts.at(-1).v;
  return `<div class="ch-h"><h3>${label}</h3><span class="ch-v">${fmt(a)} → ${fmt(b)}</span><span class="ch-d ${b - a < 0 ? 'neg' : b - a > 0 ? 'pos' : ''}">${signed(b - a)}${u}</span></div>`;
}
function vProgress() {
  let body;
  if (S.pSeg === 'body') {
    if (!S.meas.length) body = empty('No body measurements', 'Log your first measurement to start tracking your body composition.', '<button class="btn primary" data-a="bodyLog">Log measurement</button>');
    else {
      const from = rangeStart(S.bodyRange);
      const ms = S.meas.filter(m => parseYmd(m.date).getTime() >= from);
      const pts = f => ms.map(m => ({ t: parseYmd(m.date).getTime(), v: f(m) })).filter(p => p.v != null);
      const f1 = v => fmtNum(v);
      const charts = [
        ['Body weight', pts(m => toDisp(m.weight)), ' ' + unit()],
        ['Body fat', pts(m => m.bf), '%'],
        ['Fat mass', pts(m => (m.bf == null ? null : toDisp(comp(m).fat))), ' ' + unit()],
        ['Lean mass', pts(m => (m.bf == null ? null : toDisp(comp(m).lean))), ' ' + unit()],
      ].map(([l, p, u]) => `<section class="card chart-card">${changeHead(l, p, f1, u)}${lineChart(p, { fmt: f1, ma: S.bodyMA, label: l })}</section>`).join('');
      body = `${seg('bodyRange', S.bodyRange, RANGES.map(r => [r[0], r[0]]), 'Time range')}
        <button class="toggle-row compact" data-a="bodyMA" role="switch" aria-checked="${S.bodyMA}"><span>7-day moving average</span><span class="sw"></span></button>
        ${charts}
        <div class="card-h"><h2 class="sec-h">Measurements</h2><button class="btn sm" data-a="bodyLog">${ICON.plus} Log</button></div>
        <div class="list">${[...S.meas].reverse().slice(0, S.showAllMeas ? 9999 : 20).map(m => `<button class="row" data-a="bodyLog" data-date="${m.date}"><span class="row-main"><span class="n">${fmtDate(m.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span class="muted sm">${fmtW(m.weight)} ${unit()}${m.bf != null ? `, ${fmtNum(m.bf)}% fat, lean ${fmtW(comp(m).lean)} ${unit()}` : ''}</span></span></button>`).join('')}</div>
        ${S.meas.length > 20 && !S.showAllMeas ? '<button class="btn ghost block" data-a="showAllMeas">Show all measurements</button>' : ''}`;
    }
  } else {
    const seen = new Map();
    for (const w of S.workouts) for (const we of w.exercises) if (!seen.has(we.exerciseId) && we.sets.some(eligible)) seen.set(we.exerciseId, w.date);
    body = seen.size ? `<div class="list">${[...seen].map(([id, d]) => { const e = ex(id); const r = records(exerciseSessions(new Set([id])));
        return `<button class="ex-row" data-a="exProg" data-id="${id}"><span class="ex-row-t"><span class="n">${esc(e.name)}</span>
        <span class="muted sm">Last ${fmtDate(d)}, ${plural(r.sessions, 'session')}</span><span class="muted xs">${isTime(e) ? `Best ${r.maxReps} s` : `Best est. 1RM ${fmtW(r.e1)} ${unit()}`}</span></span></button>`; }).join('')}</div>`
      : empty('No exercise history yet', 'Complete a workout and your strength progress appears here.', '');
  }
  return `<div class="page"><header class="page-h"><h1>Progress</h1></header>${seg('pSeg', S.pSeg, [['body', 'Body'], ['exercises', 'Exercises']], 'Progress view')}${body}</div>`;
}

// ---------- More
const toggle = (k, label, sub = '') => `<button class="toggle-row" data-a="toggleSet" data-k="${k}" role="switch" aria-checked="${!!S.settings[k]}"><span><span>${label}</span>${sub ? `<span class="muted xs">${sub}</span>` : ''}</span><span class="sw"></span></button>`;
function vMore() {
  const s = S.settings;
  const incs = unit() === 'kg' ? [1, 2.5, 5] : [2.5, 5, 10];
  const demo = S.workouts.some(w => w.demo) || S.meas.some(m => m.demo) || S.templates.some(t => t.demo);
  return `<div class="page"><header class="page-h"><h1>More</h1></header>
  <h2 class="sec-h">Appearance</h2>${seg('setTheme', s.theme, [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], 'Appearance')}
  <h2 class="sec-h">Workout defaults</h2>
  <div class="card settings">
    <div class="set-line"><span>Default sets</span><div class="stepper"><button data-a="setDefSets" data-d="-1" aria-label="Fewer sets">−</button><output>${s.defaultSets}</output><button data-a="setDefSets" data-d="1" aria-label="More sets">+</button></div></div>
    <div class="set-line col"><span>Weight increment</span>${seg('setInc', s.increment, incs.map(v => [v, `${v} ${unit()}`]), 'Weight increment')}</div>
    ${toggle('showRPE', 'Show RPE')}${toggle('showSetTypes', 'Show set types', 'Warm-up, back-off, drop set, failure')}
    ${toggle('excludeWarmups', 'Exclude warm-ups from records', 'Warm-up sets won’t count toward PRs or volume')}
  </div>
  <h2 class="sec-h">Units</h2>${seg('setUnits', s.units, [['lb', 'Pounds (lb)'], ['kg', 'Kilograms (kg)']], 'Weight units')}
  <h2 class="sec-h">Data & backup</h2>
  <div class="card settings">
    <p class="muted sm">Your data lives only on this iPhone. ${s.lastBackup ? `Last backup ${fmtDate(s.lastBackup, { month: 'short', day: 'numeric', year: 'numeric' })}.` : '<strong>You haven’t made a backup yet.</strong>'}</p>
    <button class="btn primary block" data-a="exportJSON">Export full backup</button>
    <div class="btn-row"><button class="btn sm" data-a="exportCSV" data-k="body">Body CSV</button><button class="btn sm" data-a="exportCSV" data-k="workouts">Workouts CSV</button><button class="btn sm" data-a="exportCSV" data-k="sets">Exercise CSV</button></div>
    <label class="btn block file-btn">Import backup<input type="file" accept="application/json,.json" data-change="importFile" hidden></label>
    ${S.snapshotAt ? `<button class="btn ghost block" data-a="undoImport">Restore data from before last import</button>` : ''}
    <p class="muted xs">Storage: ${S.persisted === true ? 'protected from automatic clearing' : S.persisted === false ? 'not yet protected; back up regularly' : 'checking…'}</p>
  </div>
  <h2 class="sec-h">Exercises</h2>
  <div class="list">
    <button class="row" data-a="customList"><span class="row-main"><span class="n">Custom exercises</span><span class="muted sm">${plural(S.custom.filter(c => !c.archived).length, 'exercise')}</span></span></button>
  </div>
  <h2 class="sec-h">Demo data</h2>
  <div class="card settings"><p class="muted sm">Sample workouts, measurements and templates for trying the app. Demo records are tagged and never replace your own data.</p>
    ${demo ? '<button class="btn danger-ghost block" data-a="demoRemove">Remove demo data</button>' : '<button class="btn block" data-a="demoLoad">Load demo data</button>'}</div>
  <h2 class="sec-h">About</h2>
  <div class="card settings about"><div><span>Version</span><span>${APP_VERSION}</span></div><div><span>Exercise database</span><span>${EXERCISE_DB_VERSION}, ${EXERCISES.length} exercises</span></div><div><span>Data schema</span><span>v${SCHEMA_VERSION}</span></div></div>
  </div>`;
}
const VIEWS = { today: vToday, workouts: vWorkouts, exercises: vExercises, progress: vProgress, more: vMore };

// ---------- Onboarding
function onboardingHTML() {
  if (S.onbStep === 0) return `<div class="onb"><div class="onb-mark" aria-hidden="true">${ICON.dumbbell}</div><h1 class="onb-t">LiftLog</h1>
    <p class="onb-p">Track your training.<br>See your progress.<br>Own your data.</p><button class="btn primary lg block" data-a="onbNext">Get started</button></div>`;
  if (S.onbStep === 1) return `<div class="onb"><h1 class="onb-h">Which units do you lift in?</h1><p class="muted">You can change this later in More.</p>
    <div class="onb-units"><button class="unit-btn" data-a="onbUnit" data-v="lb" aria-pressed="${unit() === 'lb'}">lb</button><button class="unit-btn" data-a="onbUnit" data-v="kg" aria-pressed="${unit() === 'kg'}">kg</button></div>
    <button class="btn primary lg block" data-a="onbNext">Continue</button></div>`;
  return `<div class="onb"><h1 class="onb-h">How do you want to start?</h1>
    <button class="onb-opt" data-a="onbFinish" data-v="starters"><strong>Use starter templates</strong><span class="muted">Push, Pull and Legs, fully editable</span></button>
    <button class="onb-opt" data-a="onbFinish" data-v="workout"><strong>Start a workout now</strong><span class="muted">Add exercises as you go</span></button>
    <button class="btn ghost block" data-a="onbFinish" data-v="none">Skip for now</button></div>`;
}

// =================================================================== SESSION (active workout / editing a past one)
let timer = null;
function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    if (!S.session || S.session.mode !== 'active') return;
    const t = clock(Date.now() - S.session.w.startTime);
    const a = $('#ses-clock'), b = $('#mini-clock');
    if (a) a.textContent = t; if (b) b.textContent = t;
  }, 1000);
}
function renderSession() {
  const host = $('#session');
  const on = S.session && S.session.open;
  if (!on) { host.hidden = true; host.innerHTML = ''; return; }
  const prev = host.querySelector('.ses-body'); const st = prev ? prev.scrollTop : 0;
  host.hidden = false; host.innerHTML = sessionHTML();
  host.querySelector('.ses-body').scrollTop = st;
}
function sessionHTML() {
  const { w, mode } = S.session; const edit = mode === 'edit';
  const flagged = new Set(prsFor(w).flatMap(p => [...p.flagged]));
  return `<header class="ses-h">
    ${edit ? '<button class="btn ghost sm" data-a="sesCancelEdit">Cancel</button>' : `<button class="icon-btn" data-a="sesMin" aria-label="Minimize workout">${ICON.down}</button>`}
    <div class="ses-title"><input class="ses-name" data-in="wName" value="${esc(w.name)}" aria-label="Workout name" enterkeyhint="done">
    <span class="muted sm" id="ses-clock">${edit ? fmtDate(w.date, { weekday: 'short', month: 'short', day: 'numeric' }) : clock(Date.now() - w.startTime)}</span></div>
    <button class="btn primary sm" data-a="${edit ? 'sesSaveEdit' : 'sesFinish'}">${edit ? 'Save' : 'Finish'}</button></header>
  <div class="ses-body">
    ${edit ? `<div class="card edit-meta"><label class="field"><span>Date</span><input type="date" data-in="wDate" value="${w.date}" max="${ymd(new Date())}"></label>
      <label class="field"><span>Duration (min)</span><input inputmode="numeric" data-in="wDur" value="${Math.round((w.endTime - w.startTime) / 60000)}"></label></div>` : ''}
    ${w.exercises.length ? w.exercises.map((we, i) => exCardHTML(we, i, w, flagged)).join('') : empty('Add your first exercise', 'Browse the library, preview the movement, then add it.', '')}
    <button class="btn primary block lg" data-a="sesAddEx">${ICON.plus} Add exercise</button>
    <label class="field"><span>Workout notes</span><textarea data-in="wNotes" rows="3" placeholder="How did it go?">${esc(w.notes || '')}</textarea></label>
    ${edit ? `<button class="btn danger-ghost block" data-a="histDelete" data-id="${w.id}">Delete workout</button>` : '<button class="btn danger-ghost block" data-a="sesDiscard">Discard workout</button>'}
  </div>`;
}
function exCardHTML(we, i, w, flagged) {
  const e = ex(we.exerciseId); const st = S.settings; const time = isTime(e);
  const last = lastPerformance(we.exerciseId, w); const tgt = we.target;
  return `<article class="ex-card" aria-label="${esc(e.name)}">
    <div class="ex-head"><button class="ex-name" data-a="exInfo" data-id="${e.id}"><span><span class="n">${esc(e.name)}</span><span class="muted sm">${muscleLabel(e)}</span></span></button>
    <button class="icon-btn" data-a="exMenu" data-ei="${i}" aria-label="Options for ${esc(e.name)}">${ICON.dots}</button></div>
    <div class="ex-sets"><span>Sets</span><div class="stepper"><button data-a="exSets" data-ei="${i}" data-d="-1" aria-label="Remove a set" ${we.sets.length <= 1 ? 'disabled' : ''}>−</button><output>${we.sets.length}</output><button data-a="exSets" data-ei="${i}" data-d="1" aria-label="Add a set">+</button></div></div>
    ${tgt ? `<p class="target">Target ${tgt.sets} × ${repRange(tgt)}${time ? ' s' : ''}${tgt.rpe ? ` at RPE ${tgt.rpe}` : ''}</p>` : ''}
    ${last ? `<div class="last"><p class="last-h">Last time, ${fmtDate(last.w.date)}</p><ol>${last.sets.map((s, n) => `<li><span class="ln">${n + 1}</span>${fmtSet(s, e)}</li>`).join('')}</ol></div>` : '<p class="last none">First time logging this exercise</p>'}
    <div class="set-h ${st.showRPE ? 'rpe' : ''}"><span>Set</span><span>${time ? 'Load ' + unit() : unit()}</span><span>${time ? 'Sec' : 'Reps'}</span>${st.showRPE ? '<span>RPE</span>' : ''}<span class="sr">Done</span></div>
    ${we.sets.map((s, si) => setRowHTML(we, i, s, si, e, last, tgt, flagged)).join('')}
    <button class="add-set" data-a="addSet" data-ei="${i}">${ICON.plus} Add set</button>
    ${we.notes ? `<p class="ex-note">${esc(we.notes)}</p>` : ''}
  </article>`;
}
function setRowHTML(we, ei, s, si, e, last, tgt, flagged) {
  const st = S.settings; const prev = last && last.sets[si];
  const label = st.showSetTypes && s.type !== 'working' ? SET_SHORT[s.type] : si + 1;
  const rph = prev ? String(prev.reps) : tgt ? repRange(tgt) : '';
  const d = `data-ei="${ei}" data-si="${si}"`;
  return `<div class="set-row ${s.done ? 'done' : ''} ${st.showRPE ? 'rpe' : ''}">
    <button class="set-no ${st.showSetTypes && s.type !== 'working' ? 't-' + s.type : ''}" data-a="setMenu" ${d} aria-label="Set ${si + 1} options${s.type !== 'working' ? ', ' + SET_TYPES[s.type] : ''}">${label}${flagged.has(s.id) ? '<span class="pr" title="Personal record">PR</span>' : ''}</button>
    <div class="wt"><button class="bump" data-a="bump" data-d="-1" ${d} aria-label="Decrease weight">−</button>
    <input class="in" data-in="w" ${d} inputmode="decimal" enterkeyhint="next" value="${inVal(s.weight)}" placeholder="${prev ? inVal(prev.weight) : ''}" aria-label="Set ${si + 1} weight in ${unit()}">
    <button class="bump" data-a="bump" data-d="1" ${d} aria-label="Increase weight">+</button></div>
    <input class="in" data-in="r" ${d} inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" value="${s.reps ?? ''}" placeholder="${esc(rph)}" aria-label="Set ${si + 1} ${isTime(e) ? 'seconds' : 'reps'}">
    ${st.showRPE ? `<input class="in" data-in="rpe" ${d} inputmode="decimal" value="${s.rpe ?? ''}" placeholder="${tgt && tgt.rpe ? tgt.rpe : '–'}" aria-label="Set ${si + 1} RPE">` : ''}
    <button class="chk" data-a="toggleDone" ${d} aria-pressed="${s.done}" aria-label="Set ${si + 1} complete">${ICON.check}</button>
  </div>${s.note ? `<p class="set-note">${esc(s.note)}</p>` : ''}`;
}

// =================================================================== OVERLAYS
function renderOverlays() {
  const host = $('#overlays');
  const prev = host.querySelector('.ov-body');
  if (prev && host.dataset.key) { const it = S.stack.find(i => i.key === host.dataset.key); if (it) it.scroll = prev.scrollTop; }
  const top = S.stack.at(-1);
  if (!top) { host.innerHTML = ''; host.dataset.key = ''; return; }
  host.innerHTML = OV[top.type](top);
  const same = host.dataset.key === top.key;
  host.dataset.key = top.key;
  const b = host.querySelector('.ov-body'); if (b) b.scrollTop = top.scroll || 0;
  if (!same) host.querySelector('.ov')?.classList.add('enter');
}
function push(o) { o.key = uid(); S.stack.push(o); renderOverlays(); }
function pop() { S.stack.pop(); renderOverlays(); }
const topOv = () => S.stack.at(-1);
const ovHead = (left, title, right = '<span></span>') => `<header class="ov-h">${left}<h2>${title}</h2>${right}</header>`;
const backBtn = (label = 'Back') => `<button class="btn ghost sm back" data-a="pop">${ICON.back}${label}</button>`;

const OV = {};

OV.picker = o => `<div class="ov">${ovHead(backBtn('Cancel'), o.mode === 'template' ? 'Add to template' : 'Add exercise')}
  <div class="ov-sub">${searchBox(o.q, 'pickQ')}${chips(o.group, 'pickGroup')}${equipSelect(o.equip, 'pickEquip')}</div>
  <div class="ov-body" id="pick-list">${exListHTML(o)}</div></div>`;

OV.preview = o => {
  const e = ex(o.id); const fam = familyOf(e);
  const canAdd = o.mode === 'workout' || o.mode === 'template' || (o.mode === 'browse' && S.session && S.session.mode === 'active' && !o.fromSession);
  const addLabel = o.mode === 'template' ? 'Add to template' : o.mode === 'workout' ? 'Add to workout' : 'Add to current workout';
  const dl = [['Primary', muscleLabel(e)], ['Secondary', e.secondary.map(m => MUSCLES[m]).join(', ') || 'None'], ['Equipment', e.equipment], ['Movement', e.patternLabel || '–'], ['Type', e.unilateral ? 'One side at a time' : 'Both sides together'], ['Logged as', isTime(e) ? 'Time (seconds)' : 'Weight × reps']];
  return `<div class="ov">${ovHead(backBtn(), '', `<button class="icon-btn ${S.favs.has(e.id) ? 'fav-on' : ''}" data-a="favToggle" data-id="${e.id}" aria-pressed="${S.favs.has(e.id)}" aria-label="Favorite">${ICON.star}</button>`)}
  <div class="ov-body pv">
    <h1 class="pv-t">${esc(e.name)}</h1>
    ${fam.length > 1 ? `<h3 class="list-h">Choose variation</h3><div class="vars">${fam.map(v => `<button class="var" data-a="pvVar" data-id="${v.id}" aria-pressed="${v.id === e.id}"><span class="n">${esc(v.variation || v.name)}</span><span class="muted xs">${muscleLabel(v)}</span></button>`).join('')}</div>` : ''}
    <dl class="dl">${dl.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    ${e.builtIn ? `<p class="pv-desc">${esc(describe(e))}</p>` : ''}
    ${e.instructions && e.instructions.length ? `<h3 class="list-h">Movement</h3><ol class="steps">${e.instructions.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    ${e.tips && e.tips.length ? `<h3 class="list-h">Technique tips</h3><ul class="tips">${e.tips.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    ${e.notes ? `<h3 class="list-h">Notes</h3><p>${esc(e.notes)}</p>` : ''}
    ${S.workouts.some(w => w.exercises.some(x => x.exerciseId === e.id)) ? `<button class="btn ghost block" data-a="exProg" data-id="${e.id}">View progress</button>` : ''}
    ${!e.builtIn ? `<button class="btn ghost block" data-a="customEdit" data-id="${e.id}">Edit custom exercise</button>` : ''}
  </div>
  ${canAdd ? `<footer class="ov-f"><button class="btn primary block lg" data-a="pvAdd">${addLabel}</button></footer>` : ''}</div>`;
};

OV.tplEdit = o => {
  const d = o.draft; const rpe = S.settings.showRPE;
  return `<div class="ov">${ovHead('<button class="btn ghost sm" data-a="tplCancel">Cancel</button>', o.isNew ? 'New template' : 'Edit template', '<button class="btn primary sm" data-a="tplSave">Save</button>')}
  <div class="ov-body">
    <label class="field"><span>Template name</span><input data-in="tName" value="${esc(d.name)}" placeholder="e.g. Push day" enterkeyhint="done"></label>
    ${d.exercises.length ? d.exercises.map((te, i) => { const e = ex(te.exerciseId); return `<div class="card te">
      <div class="ex-head"><button class="ex-name" data-a="exInfo" data-id="${e.id}"><span><span class="n">${esc(e.name)}</span><span class="muted sm">${muscleLabel(e)}</span></span></button>
      <div class="te-move"><button class="icon-btn" data-a="teMove" data-i="${i}" data-d="-1" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button><button class="icon-btn" data-a="teMove" data-i="${i}" data-d="1" aria-label="Move down" ${i === d.exercises.length - 1 ? 'disabled' : ''}>${ICON.down}</button><button class="icon-btn" data-a="teRemove" data-i="${i}" aria-label="Remove ${esc(e.name)}">${ICON.x}</button></div></div>
      <div class="te-grid"><div><span class="stat-l">Sets</span><div class="stepper"><button data-a="teSets" data-i="${i}" data-d="-1" aria-label="Fewer sets">−</button><output>${te.sets}</output><button data-a="teSets" data-i="${i}" data-d="1" aria-label="More sets">+</button></div></div>
      <div><span class="stat-l">${isTime(e) ? 'Seconds' : 'Rep range'}</span><div class="range"><input class="in" inputmode="numeric" data-in="teMin" data-i="${i}" value="${te.repMin ?? ''}" aria-label="Minimum"><span>–</span><input class="in" inputmode="numeric" data-in="teMax" data-i="${i}" value="${te.repMax ?? ''}" aria-label="Maximum"></div></div>
      ${rpe ? `<div><span class="stat-l">RPE</span><input class="in" inputmode="decimal" data-in="teRpe" data-i="${i}" value="${te.rpe ?? ''}" placeholder="–" aria-label="Target RPE"></div>` : ''}</div>
      <label class="field slim"><span class="sr">Notes</span><input data-in="teNotes" data-i="${i}" value="${esc(te.notes || '')}" placeholder="Notes (seat height, grip…)"></label></div>`; }).join('')
      : empty('No exercises yet', 'Add exercises and set how many sets and reps you’re aiming for.', '')}
    <button class="btn primary block lg" data-a="tplAddEx">${ICON.plus} Add exercise</button>
  </div></div>`;
};

OV.workout = o => {
  const w = S.workouts.find(x => x.id === o.id);
  if (!w) return `<div class="ov">${ovHead(backBtn(), 'Workout')}<div class="ov-body">${empty('Workout not found', 'It may have been deleted.', '')}</div></div>`;
  const st = workoutStats(w); const prs = prsFor(w); const fl = new Set(prs.flatMap(p => [...p.flagged]));
  return `<div class="ov">${ovHead(backBtn(), fmtDate(w.date, { month: 'short', day: 'numeric', year: 'numeric' }), `<button class="btn ghost sm" data-a="histEdit" data-id="${w.id}">Edit</button>`)}
  <div class="ov-body">
    <h1 class="pv-t">${esc(w.name)}</h1><p class="muted">${fmtDate(w.date, { weekday: 'long', month: 'long', day: 'numeric' })}, ${fmtTime(w.startTime)}</p>
    ${summaryGrid(st, prs.length)}${prsList(prs)}
    ${w.exercises.map(we => { const e = ex(we.exerciseId); return `<div class="card wd"><button class="ex-name" data-a="exProg" data-id="${e.id}"><span class="n">${esc(e.name)}</span></button>
      <ol class="wd-sets">${we.sets.map(s => `<li class="${s.done ? '' : 'undone'}">${fmtSet(s, e)}${s.rpe ? ` <span class="muted xs">RPE ${s.rpe}</span>` : ''}${fl.has(s.id) ? ' <span class="pr-pill">PR</span>' : ''}${s.done ? '' : ' <span class="muted xs">not completed</span>'}</li>`).join('')}</ol>
      ${we.notes ? `<p class="ex-note">${esc(we.notes)}</p>` : ''}</div>`; }).join('')}
    ${w.notes ? `<div class="card"><h3 class="list-h">Notes</h3><p>${esc(w.notes)}</p></div>` : ''}
    <button class="btn primary block lg" data-a="histRepeat" data-id="${w.id}">Repeat workout</button>
    <button class="btn block" data-a="histTemplate" data-id="${w.id}">Create template from workout</button>
    <button class="btn danger-ghost block" data-a="histDelete" data-id="${w.id}">Delete workout</button>
  </div></div>`;
};
function summaryGrid(st, prs) {
  return `<div class="stat-grid three">${stat('Duration', fmtDur(st.dur), '')}${stat('Exercises', st.exs, '')}${stat('Working sets', st.sets, '')}${stat('Total reps', st.reps, '')}${stat('Volume', fmtVol(st.vol), unit())}${stat('PRs', prs, '')}</div>`;
}
const prsList = prs => (prs.length ? `<div class="card prs"><h3 class="list-h">Personal records</h3>${prs.map(p => `<p><strong>${esc(ex(p.exerciseId).name)}</strong><span class="muted sm">${p.kinds.join(', ')}</span></p>`).join('')}</div>` : '');

OV.summary = o => {
  const w = S.workouts.find(x => x.id === o.id); if (!w) return '';
  const st = workoutStats(w); const prs = prsFor(w); const sug = o.suggest;
  return `<div class="ov">${ovHead('<span></span>', 'Workout complete', '<button class="btn primary sm" data-a="pop">Done</button>')}
  <div class="ov-body"><h1 class="pv-t">${esc(w.name)}</h1><p class="muted">${fmtDate(w.date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    ${summaryGrid(st, prs.length)}${prsList(prs)}
    ${sug && !o.handled ? `<div class="card"><h3 class="list-h">Update “${esc(sug.name)}”?</h3><p class="muted sm">You’ve used a different number of sets than the template for two sessions in a row:</p>
      <ul class="tips">${sug.changes.map(c => `<li>${esc(ex(c.exerciseId).name)}: ${c.from} → ${c.to} sets</li>`).join('')}</ul>
      <div class="btn-row"><button class="btn primary" data-a="applyTplUpdate">Update template</button><button class="btn ghost" data-a="skipTplUpdate">Keep as is</button></div></div>` : ''}
    <button class="btn block" data-a="openWorkoutReplace" data-id="${w.id}">View full workout</button></div></div>`;
};

OV.exprog = o => {
  const e = ex(o.id); const fam = familyOf(e);
  const ids = new Set(o.combine ? fam.map(x => x.id) : [e.id]);
  const all = exerciseSessions(ids); const r = records(all); const time = isTime(e);
  const from = rangeStart(o.range); const ss = all.filter(s => s.w.startTime >= from);
  const series = f => ss.map(s => ({ t: s.w.startTime, v: f(s.sets) }));
  const W = v => fmtNum(toDisp(v)); const f1 = v => fmtNum(v); const f0 = v => fmtNum(v, 0);
  const charts = time
    ? [['Longest hold (s)', series(x => Math.max(...x.map(s => s.reps))), f0], ['Total time (s)', series(x => x.reduce((a, s) => a + s.reps, 0)), f0]]
    : [[`Estimated 1RM (${unit()})`, series(x => toDisp(Math.max(...x.map(s => e1rm(s.weight || 0, s.reps))))), f1],
       [`Maximum weight (${unit()})`, series(x => toDisp(Math.max(...x.map(s => s.weight || 0)))), f1],
       [`Best set volume (${unit()})`, series(x => toDisp(Math.max(...x.map(s => (s.weight || 0) * s.reps)))), f0],
       [`Session volume (${unit()})`, series(x => toDisp(x.reduce((a, s) => a + (s.weight || 0) * s.reps, 0))), f0]];
  const stats = time
    ? `${stat('Longest hold', r.maxReps, 's')}${stat('Sessions', r.sessions, '')}${stat('Working sets', r.sets, '')}`
    : `${stat('Best weight', W(r.maxW), unit())}${stat('Best est. 1RM', W(r.e1), unit())}${stat('Best set', r.e1Set ? `${W(r.e1Set.weight || 0)} × ${r.e1Set.reps}` : '–', '')}
       ${stat('Best session volume', fmtVol(r.sessVol), unit())}${stat('Sessions', r.sessions, '')}${stat('Working sets', r.sets, '')}`;
  return `<div class="ov">${ovHead(backBtn(), 'Progress', `<button class="btn ghost sm" data-a="exOpenInfo" data-id="${e.id}">Details</button>`)}
  <div class="ov-body"><div class="ex-name big"><span><span class="n">${esc(e.name)}</span><span class="muted sm">${muscleLabel(e)}</span></span></div>
    ${fam.length > 1 ? `<button class="toggle-row compact" data-a="progCombine" role="switch" aria-checked="${!!o.combine}"><span>Include all ${esc(e.family)} variations</span><span class="sw"></span></button>` : ''}
    ${r.sessions ? `<div class="stat-grid three">${stats}</div>
    ${seg('progRange', o.range, RANGES.map(x => [x[0], x[0]]), 'Time range')}
    ${charts.map(([l, p, f]) => `<section class="card chart-card"><div class="ch-h"><h3>${l}</h3></div>${lineChart(p, { fmt: f, label: l })}</section>`).join('')}
    <h3 class="list-h">Recent sessions</h3><div class="list">${[...all].reverse().slice(0, 12).map(s => `<button class="row" data-a="openWorkout" data-id="${s.w.id}"><span class="row-main"><span class="n">${fmtDate(s.w.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span class="muted sm">${s.sets.map(x => fmtSet(x, e)).join(', ')}</span></span></button>`).join('')}</div>`
    : empty('No completed sets yet', 'Log this exercise in a workout to see your progress.', '')}
  </div></div>`;
};

OV.body = o => {
  const wv = num(o.w), bv = num(o.bf);
  const fat = wv != null && bv != null ? wv * bv / 100 : null;
  return `<div class="ov sheet-ov"><div class="sheet" role="dialog" aria-modal="true" aria-label="Log measurement">
  ${ovHead('<button class="btn ghost sm" data-a="pop">Cancel</button>', o.existing ? 'Edit measurement' : 'Log measurement', '<button class="btn primary sm" data-a="bodySave">Save</button>')}
  <div class="ov-body">
    <label class="field"><span>Date</span><input type="date" data-in="bDate" value="${o.date}" max="${ymd(new Date())}"></label>
    <div class="two"><label class="field"><span>Weight (${unit()})</span><input class="big-in" inputmode="decimal" data-in="bW" value="${esc(o.w)}" placeholder="${S.meas.length ? inVal(S.meas.at(-1).weight) : ''}"></label>
    <label class="field"><span>Body fat (%)</span><input class="big-in" inputmode="decimal" data-in="bBf" value="${esc(o.bf)}" placeholder="${S.meas.at(-1)?.bf ?? ''}"></label></div>
    <div class="stat-grid"><div class="stat"><span class="stat-l">Fat mass</span><span class="stat-v" id="b-fat">${fat == null ? '–' : fmtNum(fat)}<span class="u">${unit()}</span></span></div>
    <div class="stat"><span class="stat-l">Lean mass</span><span class="stat-v" id="b-lean">${fat == null ? '–' : fmtNum(wv - fat)}<span class="u">${unit()}</span></span></div></div>
    ${o.existing ? '<button class="btn danger-ghost block" data-a="bodyDelete">Delete measurement</button>' : ''}
  </div></div></div>`;
};

OV.customList = () => {
  const list = S.custom.filter(c => !c.archived).sort((a, b) => a.name.localeCompare(b.name));
  return `<div class="ov">${ovHead(backBtn(), 'Custom exercises', `<button class="btn primary sm" data-a="customNew">${ICON.plus} New</button>`)}
  <div class="ov-body">${list.length ? `<div class="list">${list.map(exRow).join('')}</div>` : empty('No custom exercises', 'Add exercises that aren’t in the library. They work everywhere built-in exercises do.', '<button class="btn primary" data-a="customNew">New exercise</button>')}</div></div>`;
};

OV.customEdit = o => {
  const d = o.draft;
  return `<div class="ov">${ovHead('<button class="btn ghost sm" data-a="pop">Cancel</button>', o.isNew ? 'New exercise' : 'Edit exercise', '<button class="btn primary sm" data-a="customSave">Save</button>')}
  <div class="ov-body">
    <label class="field"><span>Name</span><input data-in="cName" value="${esc(d.name)}" placeholder="e.g. Hammer Strength Row"></label>
    <div class="two"><label class="field"><span>Exercise family</span><input data-in="cFamily" value="${esc(d.family)}" placeholder="Groups variations together"></label>
    <label class="field"><span>Variation</span><input data-in="cVar" value="${esc(d.variation)}" placeholder="e.g. Neutral grip"></label></div>
    <label class="field"><span>Primary muscle</span><select data-in="cPrimary">${Object.entries(MUSCLES).map(([k, l]) => `<option value="${k}" ${d.primary === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="field"><span>Secondary muscles</span><div class="chips wrap">${Object.entries(MUSCLES).filter(([k]) => k !== d.primary).map(([k, l]) => `<button class="chip" data-a="cSec" data-k="${k}" aria-pressed="${d.secondary.includes(k)}">${l}</button>`).join('')}</div></div>
    <label class="field"><span>Equipment</span><select data-in="cEquip">${EQUIPMENT.map(q => `<option ${q === d.equipment ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
    <div class="field"><span>Logged as</span>${seg('cMetric', d.metric, [['reps', 'Weight × reps'], ['time', 'Time (seconds)']], 'Logged as')}</div>
    <button class="toggle-row" data-a="cUni" role="switch" aria-checked="${!!d.unilateral}"><span>One side at a time</span><span class="sw"></span></button>
    <label class="field"><span>Notes</span><textarea data-in="cNotes" rows="3">${esc(d.notes || '')}</textarea></label>
    ${!o.isNew ? '<button class="btn danger-ghost block" data-a="customDelete">Delete exercise</button>' : ''}
  </div></div>`;
};


OV.import = o => {
  const d = o.data; const s = o.summary;
  return `<div class="ov">${ovHead(backBtn('Cancel'), 'Import backup')}
  <div class="ov-body">
  ${o.errors.length ? `<div class="card warn"><h3 class="list-h">This file can’t be restored</h3><ul class="tips">${o.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`
    : `<p class="muted">Exported ${esc(new Date(d.exportDate).toLocaleString())} from LiftLog ${esc(d.appVersion || '')}.</p>
    <div class="card about">${s.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('')}</div>
    <div class="card warn"><p><strong>Importing replaces all data currently on this iPhone.</strong> LiftLog keeps a copy of your current data so you can restore it afterward from More.</p></div>
    <button class="btn danger block lg" data-a="importConfirm">Replace my data with this backup</button>`}
  </div></div>`;
};

// =================================================================== WORKOUT OPERATIONS
function defaultName() { const h = new Date().getHours(); return h < 12 ? 'Morning workout' : h < 17 ? 'Afternoon workout' : 'Evening workout'; }
const blankSet = (type = 'working') => ({ id: uid(), weight: null, reps: null, rpe: null, type, done: false, note: '' });
function newWorkoutExercise(exId, n, target, notes, w) {
  const sets = [];
  for (let i = 0; i < n; i++) sets.push(blankSet());
  touchRecent(exId);
  return { id: uid(), exerciseId: exId, notes: notes || '', target: target || null, sets };
}
async function startWorkout(tpl, src) {
  if (S.session) {
    if (S.session.mode === 'edit') { toast('Save or cancel your edit first'); return; }
    const r = await dialog({ title: 'A workout is already in progress', body: 'Resume it, or finish it before starting another.', buttons: [{ label: 'Cancel', value: null, cls: 'ghost' }, { label: 'Resume', value: 'r', cls: 'primary' }] });
    if (r) A.resume(); return;
  }
  const now = Date.now();
  const w = { id: uid(), date: ymd(new Date()), name: tpl ? tpl.name : src ? src.name : defaultName(), startTime: now, endTime: null, templateId: tpl ? tpl.id : src ? src.templateId || null : null, notes: '', exercises: [], createdAt: now, updatedAt: now };
  if (tpl) for (const te of tpl.exercises) w.exercises.push(newWorkoutExercise(te.exerciseId, te.sets, { sets: te.sets, repMin: te.repMin, repMax: te.repMax, rpe: te.rpe }, te.notes, w));
  if (src) for (const we of src.exercises) {
    const x = newWorkoutExercise(we.exerciseId, we.sets.length || S.settings.defaultSets, we.target, '', w);
    x.sets.forEach((s, i) => { const o = we.sets[i]; if (o) s.type = o.type; });
    w.exercises.push(x);
  }
  S.session = { mode: 'active', w, open: true };
  S.stack = [];
  saveSession(true); render(); startTimer();
}
function setOf(el) { return S.session.w.exercises[+el.dataset.ei].sets[+el.dataset.si]; }
function addExerciseToSession(id) {
  const w = S.session.w;
  w.exercises.push(newWorkoutExercise(id, S.settings.defaultSets, null, '', S.session.mode === 'edit' ? w : null));
  saveSession(true);
  S.session.open = true;
  renderSession(); renderMini();
  const b = $('.ses-body'); if (b) b.scrollTop = b.scrollHeight;
  toast(`Added ${ex(id).name}`);
}
function templateSuggestion(w) {
  const tpl = S.templates.find(t => t.id === w.templateId); if (!tpl) return null;
  const prev = S.workouts.find(x => x.id !== w.id && x.templateId === tpl.id && x.startTime < w.startTime);
  if (!prev) return null;
  const changes = [];
  for (const te of tpl.exercises) {
    const a = w.exercises.find(x => x.exerciseId === te.exerciseId);
    const b = prev.exercises.find(x => x.exerciseId === te.exerciseId);
    if (!a || !b) continue;
    const n = a.sets.length;
    if (n !== te.sets && b.sets.length === n) changes.push({ exerciseId: te.exerciseId, from: te.sets, to: n });
  }
  return changes.length ? { id: tpl.id, name: tpl.name, changes } : null;
}
const populated = s => s.weight != null || s.reps != null || s.done || s.note;

// =================================================================== TEMPLATES
const blankTemplate = () => ({ id: uid(), name: '', exercises: [], createdAt: Date.now(), updatedAt: Date.now() });
function openTemplateEditor(t, isNew) { const draft = clone(t); push({ type: 'tplEdit', draft, isNew, orig: JSON.stringify(draft) }); }
function starterTemplates() {
  const mk = (name, rows) => ({ id: uid(), name, createdAt: Date.now(), updatedAt: Date.now(), exercises: rows.map(([id, sets, repMin, repMax]) => ({ id: uid(), exerciseId: id, sets, repMin, repMax, rpe: null, notes: '' })) });
  return [
    mk('Push', [['incline-dumbbell-bench-press', 3, 6, 10], ['machine-chest-press', 3, 8, 12], ['dumbbell-shoulder-press', 3, 8, 12], ['cable-lateral-raise', 3, 12, 20], ['rope-pushdown', 3, 10, 15], ['overhead-rope-extension', 3, 10, 15]]),
    mk('Pull', [['lat-pulldown', 3, 8, 12], ['chest-supported-dumbbell-row', 3, 8, 12], ['seated-cable-row', 3, 10, 12], ['face-pull', 3, 12, 20], ['ez-bar-curl', 3, 8, 12], ['hammer-curl', 3, 10, 15]]),
    mk('Legs', [['back-squat', 3, 5, 8], ['romanian-deadlift', 3, 8, 10], ['leg-press', 3, 10, 15], ['lying-leg-curl', 3, 10, 15], ['leg-extension', 3, 12, 15], ['standing-calf-raise', 4, 10, 15]]),
  ];
}
async function addStarters() {
  const t = starterTemplates();
  await db.batch(t.map(value => ({ store: 'templates', op: 'put', value })));
  S.templates.push(...t);
}

// =================================================================== BACKUP / CSV
function buildBackup() {
  return {
    app: 'LiftLog', schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION, exportDate: new Date().toISOString(),
    builtInExerciseVersion: EXERCISE_DB_VERSION, weightStorageUnit: 'lb',
    note: 'Weights are stored in pounds. Sets are stored inside each workout exercise.',
    bodyMeasurements: S.meas, customExercises: S.custom,
    workouts: S.workouts, templates: S.templates, favorites: [...S.favs], recents: S.recents, settings: S.settings,
    activeWorkout: S.session && S.session.mode === 'active' ? S.session.w : null,
  };
}
async function saveFile(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  const file = new File([blob], name, { type: mime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  return true;
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\n');
const r1 = v => (v == null ? '' : Math.round(v * 10) / 10);
function csvFor(kind) {
  const u = unit();
  if (kind === 'body') return ['Body Measurements.csv', toCSV([['Date', `Weight (${u})`, 'Body fat %', `Fat mass (${u})`, `Lean mass (${u})`], ...S.meas.map(m => { const c = comp(m); return [m.date, r1(toDisp(m.weight)), m.bf ?? '', r1(toDisp(c.fat)), r1(toDisp(c.lean))]; })])];
  if (kind === 'workouts') return ['Workout History.csv', toCSV([['Date', 'Workout', 'Start', 'End', 'Duration (min)', 'Exercises', 'Working sets', 'Total reps', `Volume (${u})`, 'Notes'], ...[...S.workouts].reverse().map(w => { const st = workoutStats(w); return [w.date, w.name, new Date(w.startTime).toISOString(), w.endTime ? new Date(w.endTime).toISOString() : '', Math.round(st.dur / 60000), st.exs, st.sets, st.reps, Math.round(toDisp(st.vol)), w.notes || '']; })])];
  const rows = [['Date', 'Workout', 'Exercise', 'Family', 'Variation', 'Set', 'Type', `Weight (${u})`, 'Reps / seconds', 'RPE', 'Completed', `Est. 1RM (${u})`, 'Note']];
  for (const w of [...S.workouts].reverse()) for (const we of w.exercises) { const e = ex(we.exerciseId); we.sets.forEach((s, i) => rows.push([w.date, w.name, e.name, e.family, e.variation, i + 1, SET_TYPES[s.type], r1(toDisp(s.weight)), s.reps ?? '', s.rpe ?? '', s.done ? 'yes' : 'no', !isTime(e) && s.reps ? r1(toDisp(e1rm(s.weight || 0, s.reps))) : '', s.note || ''])); }
  return ['Exercise History.csv', toCSV(rows)];
}
function migrateBackup(o) {
  // Future: if (o.schemaVersion === 1) { ...transform to 2...; o.schemaVersion = 2; }
  return o;
}
function validateBackup(o) {
  const errs = [];
  if (!o || typeof o !== 'object') return ['The file isn’t a LiftLog backup.'];
  if (o.app !== 'LiftLog') errs.push('This file wasn’t exported by LiftLog.');
  if (typeof o.schemaVersion !== 'number') errs.push('The backup has no schema version.');
  else if (o.schemaVersion > SCHEMA_VERSION) errs.push('This backup was made by a newer version of LiftLog. Update the app first.');
  for (const k of ['bodyMeasurements', 'workouts', 'templates', 'customExercises']) if (!Array.isArray(o[k])) errs.push(`The backup is missing its ${k} list.`);
  if (errs.length) return errs;
  o.bodyMeasurements.forEach((m, i) => { if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(m.date) || typeof m.weight !== 'number') errs.push(`Measurement ${i + 1} is malformed.`); });
  o.workouts.forEach((w, i) => {
    if (!w || !w.id || typeof w.startTime !== 'number' || !Array.isArray(w.exercises)) errs.push(`Workout ${i + 1} is malformed.`);
    else w.exercises.forEach(we => { if (!we.exerciseId || !Array.isArray(we.sets)) errs.push(`Workout ${i + 1} (${w.date}) has a malformed exercise.`); });
  });
  o.templates.forEach((t, i) => { if (!t || !t.id || !Array.isArray(t.exercises)) errs.push(`Template ${i + 1} is malformed.`); });
  o.customExercises.forEach((c, i) => { if (!c || !c.id || !c.name) errs.push(`Custom exercise ${i + 1} is malformed.`); });
  return errs.slice(0, 8);
}
function backupSummary(o) {
  const range = arr => (arr.length ? ` (${fmtDate(arr[0], { month: 'short', day: 'numeric', year: 'numeric' })} to ${fmtDate(arr.at(-1), { month: 'short', day: 'numeric', year: 'numeric' })})` : '');
  const md = o.bodyMeasurements.map(m => m.date).sort();
  const wd = o.workouts.map(w => w.startTime).sort((a, b) => a - b);
  return [['Body measurements', o.bodyMeasurements.length + range(md)], ['Workouts', o.workouts.length + range(wd)], ['Templates', o.templates.length], ['Custom exercises', o.customExercises.length], ['Favorites', (o.favorites || []).length], ['Workout in progress', o.activeWorkout ? 'Yes' : 'No']];
}
async function restore(o, snapshot) {
  await db.replaceAll({ ...o, settings: { ...DEFAULTS, ...(o.settings || {}), onboarded: true }, snapshot });
  await loadAll(); applyTheme(); S.stack = []; render();
}

// =================================================================== DEMO DATA
const DEMO_BASE = { 'incline-dumbbell-bench-press': 65, 'machine-chest-press': 150, 'dumbbell-shoulder-press': 50, 'cable-lateral-raise': 15, 'rope-pushdown': 50, 'overhead-rope-extension': 40, 'lat-pulldown': 140, 'chest-supported-dumbbell-row': 60, 'seated-cable-row': 130, 'face-pull': 40, 'ez-bar-curl': 60, 'hammer-curl': 35, 'back-squat': 225, 'romanian-deadlift': 185, 'leg-press': 360, 'lying-leg-curl': 90, 'leg-extension': 110, 'standing-calf-raise': 160 };
async function loadDemo() {
  const now = new Date(); const days = 45; const ops = [];
  const have = new Set(S.meas.map(m => m.date));
  for (let i = days; i >= 0; i--) {
    if (i % 7 === 3) continue;
    const d = new Date(now); d.setDate(d.getDate() - i); const p = (days - i) / days; const date = ymd(d);
    if (have.has(date)) continue;
    ops.push({ store: 'measurements', op: 'put', value: { date, weight: Math.round((188 - 4 * p + Math.sin(i * 1.7) * 0.6) * 10) / 10, bf: Math.round((16 - p + Math.cos(i) * 0.15) * 10) / 10, demo: true, updatedAt: Date.now() } });
  }
  const tpls = starterTemplates().map(t => ({ ...t, name: t.name + ' (demo)', demo: true }));
  tpls.forEach(value => ops.push({ store: 'templates', op: 'put', value }));
  let k = 0;
  for (let i = days - 1; i >= 1; i -= 3) {
    const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(17, 30, 0, 0);
    const t = tpls[k++ % 3]; const prog = (days - i) / days; const start = d.getTime();
    const w = { id: uid(), date: ymd(d), name: t.name, startTime: start, endTime: start + (48 + (i * 7) % 17) * 60000, templateId: t.id, notes: '', demo: true, createdAt: start, updatedAt: start,
      exercises: t.exercises.map((te, xi) => {
        const base = DEMO_BASE[te.exerciseId] || 50;
        const step = base >= 100 ? 5 : 2.5;
        const wt = Math.round(base * (1 + 0.08 * prog) / step) * step;
        return { id: uid(), exerciseId: te.exerciseId, notes: '', target: { sets: te.sets, repMin: te.repMin, repMax: te.repMax, rpe: null },
          sets: Array.from({ length: te.sets }, (_, si) => ({ id: uid(), weight: si === te.sets - 1 && (i + xi) % 3 === 0 ? wt - step : wt, reps: Math.max(te.repMin, Math.min(te.repMax, te.repMax - si - ((i + xi) % 2) + Math.round(prog))), rpe: null, type: 'working', done: true, note: '' })) };
      }) };
    ops.push({ store: 'workouts', op: 'put', value: w });
  }
  await db.batch(ops); await loadAll();
}
async function removeDemo() {
  const ops = [
    ...S.meas.filter(m => m.demo).map(m => ({ store: 'measurements', op: 'delete', key: m.date })),
    ...S.workouts.filter(w => w.demo).map(w => ({ store: 'workouts', op: 'delete', key: w.id })),
    ...S.templates.filter(t => t.demo).map(t => ({ store: 'templates', op: 'delete', key: t.id })),
  ];
  await db.batch(ops); await loadAll();
}


// =================================================================== ACTIONS
const A = {};
A.tab = el => { S.tab = el.dataset.tab; S.stack = []; render(); $('#view').scrollTop = 0; };
A.pop = () => pop();
A.resume = () => { if (!S.session) return; S.session.open = true; S.stack = []; render(); };
A.sesMin = () => { flushSession(); S.session.open = false; render(); };
A.startEmpty = () => startWorkout(null);
A.startTpl = el => startWorkout(S.templates.find(t => t.id === el.dataset.id));
A.wSeg = el => { S.wSeg = el.dataset.v; renderView(); };
A.pSeg = el => { S.pSeg = el.dataset.v; renderView(); };
A.bodyRange = el => { S.bodyRange = el.dataset.v; renderView(); };
A.bodyMA = () => { S.bodyMA = !S.bodyMA; renderView(); };
A.showAllMeas = () => { S.showAllMeas = true; renderView(); };

// session
A.addSet = el => {
  const we = S.session.w.exercises[+el.dataset.ei]; const prev = we.sets.at(-1);
  we.sets.push({ id: uid(), weight: prev ? prev.weight : null, reps: null, rpe: null, type: prev && prev.type !== 'warmup' ? prev.type : 'working', done: false, note: '' });
  saveSession(true); renderSession();
  $(`.ses-body [data-in="r"][data-ei="${el.dataset.ei}"][data-si="${we.sets.length - 1}"]`)?.focus();
};
A.exSets = async el => {
  const we = S.session.w.exercises[+el.dataset.ei];
  if (+el.dataset.d > 0) { we.sets.push(blankSet()); }
  else {
    if (we.sets.length <= 1) return;
    const s = we.sets.at(-1);
    if (populated(s) && !(await confirmDlg(`Remove set ${we.sets.length}?`, 'It already has a weight or reps entered.', 'Remove', true))) return;
    we.sets.pop();
  }
  saveSession(true); renderSession();
};
A.bump = el => {
  const s = setOf(el); const input = el.parentElement.querySelector('input');
  const cur = s.weight != null ? toDisp(s.weight) : 0;
  const v = Math.max(0, Math.round((cur + +el.dataset.d * S.settings.increment) * 100) / 100);
  s.weight = fromDisp(v); input.value = String(v); saveSession();
};
A.toggleDone = el => {
  const s = setOf(el); const row = el.closest('.set-row'); const we = S.session.w.exercises[+el.dataset.ei]; const e = ex(we.exerciseId);
  if (!s.done) {
    if (s.weight == null) {
      if (NO_LOAD_EQUIP.has(e.equipment) || isTime(e)) s.weight = 0;
      else { toast('Enter the weight for this set'); row.querySelector('[data-in="w"]').focus(); return; }
    }
    if (s.reps == null) { toast(`Enter ${isTime(e) ? 'seconds' : 'reps'} for this set`); row.querySelector('[data-in="r"]').focus(); return; }
  }
  s.done = !s.done; saveSession(true); renderSession();
};
A.setMenu = async el => {
  const ei = +el.dataset.ei, si = +el.dataset.si; const we = S.session.w.exercises[ei]; const s = we.sets[si];
  const items = [];
  if (S.settings.showSetTypes) for (const [k, l] of Object.entries(SET_TYPES)) items.push({ label: (s.type === k ? '✓ ' : '') + l, value: 'type:' + k });
  items.push({ label: s.note ? 'Edit note' : 'Add note', value: 'note' }, { label: 'Duplicate set', value: 'dup' }, { label: 'Delete set', value: 'del', danger: true });
  const r = await actionSheet(`Set ${si + 1}`, items); if (!r) return;
  if (r.startsWith('type:')) s.type = r.slice(5);
  else if (r === 'note') { const n = await promptDlg('Set note', s.note, 'e.g. paused reps'); if (n == null) return; s.note = n.trim(); }
  else if (r === 'dup') we.sets.splice(si + 1, 0, { ...clone(s), id: uid(), done: false });
  else if (r === 'del') {
    if (populated(s) && !(await confirmDlg('Delete this set?', `Set ${si + 1}${s.weight != null || s.reps != null ? ` (${fmtSet(s, ex(we.exerciseId))})` : ''} will be removed.`, 'Delete', true))) return;
    we.sets.splice(si, 1);
  }
  saveSession(true); renderSession();
};
A.exMenu = async el => {
  const i = +el.dataset.ei; const list = S.session.w.exercises; const we = list[i]; const e = ex(we.exerciseId);
  const items = [{ label: 'View exercise details', value: 'info' }, { label: we.notes ? 'Edit note' : 'Add note', value: 'note' }];
  if (i > 0) items.push({ label: 'Move up', value: 'up' });
  if (i < list.length - 1) items.push({ label: 'Move down', value: 'down' });
  items.push({ label: 'Remove exercise', value: 'rm', danger: true });
  const r = await actionSheet(e.name, items); if (!r) return;
  if (r === 'info') return push({ type: 'preview', id: e.id, mode: 'browse', fromSession: true });
  if (r === 'note') { const n = await promptDlg('Exercise note', we.notes, 'e.g. seat on 4'); if (n == null) return; we.notes = n.trim(); }
  if (r === 'up' || r === 'down') { const j = r === 'up' ? i - 1 : i + 1; [list[i], list[j]] = [list[j], list[i]]; }
  if (r === 'rm') { if (we.sets.some(populated) && !(await confirmDlg(`Remove ${e.name}?`, 'Its logged sets in this workout will be removed.', 'Remove', true))) return; list.splice(i, 1); }
  saveSession(true); renderSession();
};
A.exInfo = el => push({ type: 'preview', id: el.dataset.id, mode: 'browse', fromSession: true });
A.sesAddEx = () => push({ type: 'picker', mode: 'workout', q: '', group: 'all', equip: '' });
A.sesFinish = async () => {
  const w = S.session.w; const sets = w.exercises.flatMap(x => x.sets);
  const doneN = sets.filter(s => s.done).length, undone = sets.length - doneN;
  if (!doneN) { await dialog({ title: 'No completed sets', body: 'Check off at least one set, or discard this workout.', buttons: [{ label: 'Keep logging', value: null, cls: 'primary' }] }); return; }
  const ok = await confirmDlg('Finish workout?', undone ? `${plural(undone, 'set')} ${undone === 1 ? 'isn’t' : 'aren’t'} checked off. They’re kept, but don’t count toward your stats.` : `${plural(doneN, 'set')} completed.`, 'Finish');
  if (!ok) return;
  flushSession();
  w.endTime = Date.now(); w.updatedAt = w.endTime;
  try { await db.batch([{ store: 'workouts', op: 'put', value: clone(w) }, { store: 'meta', op: 'delete', key: 'active' }]); }
  catch (err) { w.endTime = null; toast('Could not save workout: ' + err.message); return; }
  S.workouts.unshift(w); sortWorkouts(); S.session = null;
  S.stack = []; render();
  push({ type: 'summary', id: w.id, suggest: templateSuggestion(w) });
};
A.sesDiscard = async () => {
  if (!(await confirmDlg('Discard this workout?', 'All sets logged in this workout will be deleted. This can’t be undone.', 'Discard', true))) return;
  clearTimeout(saveTimer); await db.del('meta', 'active'); S.session = null; render();
};
A.sesSaveEdit = async () => {
  const w = S.session.w;
  if (!w.name.trim()) w.name = 'Workout';
  w.updatedAt = Date.now();
  await db.put('workouts', clone(w));
  const i = S.workouts.findIndex(x => x.id === w.id); S.workouts[i] = w; sortWorkouts();
  S.session = null; render(); toast('Changes saved');
};
A.sesCancelEdit = async () => {
  if (JSON.stringify(S.session.w) !== S.session.orig && !(await confirmDlg('Discard your changes?', '', 'Discard', true))) return;
  S.session = null; render();
};

// history
A.openWorkout = el => push({ type: 'workout', id: el.dataset.id });
A.openWorkoutReplace = el => { S.stack = []; push({ type: 'workout', id: el.dataset.id }); };
A.histEdit = el => {
  if (S.session && S.session.mode === 'active') { toast('Finish your current workout before editing past ones'); return; }
  const w = clone(S.workouts.find(x => x.id === el.dataset.id));
  S.session = { mode: 'edit', w, open: true, orig: JSON.stringify(w) }; S.stack = []; render();
};
A.histRepeat = el => startWorkout(null, S.workouts.find(x => x.id === el.dataset.id));
A.histTemplate = el => {
  const w = S.workouts.find(x => x.id === el.dataset.id);
  const t = blankTemplate(); t.name = w.name;
  t.exercises = w.exercises.map(we => { const reps = we.sets.filter(s => s.done && s.reps).map(s => s.reps);
    return { id: uid(), exerciseId: we.exerciseId, sets: we.sets.length || 3, repMin: we.target ? we.target.repMin : reps.length ? Math.min(...reps) : 8, repMax: we.target ? we.target.repMax : reps.length ? Math.max(...reps) : 12, rpe: we.target ? we.target.rpe : null, notes: '' }; });
  openTemplateEditor(t, true);
};
A.histDelete = async el => {
  const id = el.dataset.id; const w = S.workouts.find(x => x.id === id);
  if (!(await confirmDlg('Delete this workout?', `${esc(w ? w.name : 'This workout')} on ${w ? fmtDate(w.date) : ''} and all its sets will be permanently deleted.`, 'Delete', true))) return;
  await db.del('workouts', id); S.workouts = S.workouts.filter(x => x.id !== id);
  if (S.session && S.session.mode === 'edit' && S.session.w.id === id) S.session = null;
  S.stack = S.stack.filter(o => !(o.type === 'workout' && o.id === id)); render(); toast('Workout deleted');
};

// summary / template update
A.applyTplUpdate = async () => {
  const o = topOv(); const sug = o.suggest; const t = S.templates.find(x => x.id === sug.id);
  if (t) { for (const c of sug.changes) { const te = t.exercises.find(x => x.exerciseId === c.exerciseId); if (te) te.sets = c.to; } t.updatedAt = Date.now(); await db.put('templates', clone(t)); toast('Template updated'); }
  o.handled = true; renderOverlays();
};
A.skipTplUpdate = () => { topOv().handled = true; renderOverlays(); };

// templates
A.tplNew = () => openTemplateEditor(blankTemplate(), true);
A.tplEdit = el => openTemplateEditor(S.templates.find(t => t.id === el.dataset.id), false);
A.tplMenu = async el => {
  const t = S.templates.find(x => x.id === el.dataset.id);
  const r = await actionSheet(t.name, [{ label: 'Start workout', value: 'start' }, { label: 'Edit or rename', value: 'edit' }, { label: 'Duplicate', value: 'dup' }, { label: 'Delete template', value: 'del', danger: true }]);
  if (r === 'start') startWorkout(t);
  if (r === 'edit') openTemplateEditor(t, false);
  if (r === 'dup') { const c = { ...clone(t), id: uid(), name: t.name + ' copy', createdAt: Date.now(), updatedAt: Date.now(), demo: undefined }; c.exercises.forEach(x => (x.id = uid())); await db.put('templates', c); S.templates.push(c); renderView(); toast('Template duplicated'); }
  if (r === 'del') { if (!(await confirmDlg(`Delete “${esc(t.name)}”?`, 'Past workouts started from this template are kept.', 'Delete', true))) return; await db.del('templates', t.id); S.templates = S.templates.filter(x => x.id !== t.id); renderView(); }
};
A.addStarters = async () => { await addStarters(); renderView(); toast('Added Push, Pull and Legs'); };
A.tplAddEx = () => push({ type: 'picker', mode: 'template', q: '', group: 'all', equip: '' });
A.teSets = el => { const o = topOv(); const te = o.draft.exercises[+el.dataset.i]; te.sets = Math.max(1, Math.min(20, te.sets + +el.dataset.d)); renderOverlays(); };
A.teMove = el => { const l = topOv().draft.exercises; const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; renderOverlays(); };
A.teRemove = el => { topOv().draft.exercises.splice(+el.dataset.i, 1); renderOverlays(); };
A.tplSave = async () => {
  const o = topOv(); const d = o.draft; d.name = d.name.trim();
  if (!d.name) { toast('Give the template a name'); $('[data-in="tName"]')?.focus(); return; }
  for (const te of d.exercises) { te.repMin = te.repMin || te.repMax || 8; te.repMax = te.repMax || te.repMin; if (te.repMin > te.repMax) [te.repMin, te.repMax] = [te.repMax, te.repMin]; }
  d.updatedAt = Date.now();
  await db.put('templates', clone(d));
  const i = S.templates.findIndex(t => t.id === d.id); if (i >= 0) S.templates[i] = d; else S.templates.push(d);
  pop(); renderView(); toast('Template saved');
};
A.tplCancel = async () => { const o = topOv(); if (JSON.stringify(o.draft) !== o.orig && !(await confirmDlg('Discard changes to this template?', '', 'Discard', true))) return; pop(); };

// exercise library / picker / preview
A.libGroup = el => { S.lib.group = el.dataset.g; renderView(); };
A.pickGroup = el => { topOv().group = el.dataset.g; renderOverlays(); };
A.exOpen = el => { const t = topOv(); push({ type: 'preview', id: el.dataset.id, mode: t && t.type === 'picker' ? t.mode : 'browse' }); };
A.exOpenInfo = el => push({ type: 'preview', id: el.dataset.id, mode: 'browse', fromSession: true });
A.pvVar = el => { topOv().id = el.dataset.id; renderOverlays(); };
A.favToggle = el => { const id = el.dataset.id; S.favs.has(id) ? S.favs.delete(id) : S.favs.add(id); saveFavs(); renderOverlays(); if (S.tab === 'exercises') renderView(); };
function addPicked(id) {
  const pk = S.stack.find(x => x.type === 'picker'); const mode = pk ? pk.mode : 'workout';
  S.stack = S.stack.filter(x => x.type !== 'picker' && x.type !== 'preview');
  if (mode === 'template') {
    const ed = S.stack.find(x => x.type === 'tplEdit');
    ed.draft.exercises.push({ id: uid(), exerciseId: id, sets: S.settings.defaultSets, repMin: 8, repMax: 12, rpe: null, notes: '' });
    touchRecent(id); renderOverlays(); toast(`Added ${ex(id).name}`); return;
  }
  renderOverlays(); addExerciseToSession(id);
}
A.pickAdd = el => addPicked(el.dataset.id);
A.quickAdd = async () => {
  const name = topOv().q.trim(); if (!name) return;
  const c = { id: 'c-' + uid(), name, family: name, exerciseFamily: name, variation: '', primary: 'other', primaryMuscle: 'other', emphasis: '', secondary: [], secondaryMuscles: [], equipment: 'Other', metric: 'reps', unilateral: false, unilateralOrBilateral: 'bilateral', notes: '', movementPattern: 'custom', patternLabel: 'Custom exercise', instructions: [], tips: [], builtIn: false, archived: false, createdAt: Date.now(), updatedAt: Date.now() };
  await db.put('customExercises', c);
  S.custom.push(c); S.customMap[c.id] = c;
  addPicked(c.id);
};
A.pvAdd = () => {
  const o = topOv();
  if (S.stack.some(x => x.type === 'picker')) return addPicked(o.id);
  if (o.mode === 'template') {
    const ed = S.stack.find(x => x.type === 'tplEdit');
    ed.draft.exercises.push({ id: uid(), exerciseId: o.id, sets: S.settings.defaultSets, repMin: 8, repMax: 12, rpe: null, notes: '' });
    touchRecent(o.id);
    S.stack = S.stack.filter(x => x.type !== 'picker' && x.type !== 'preview'); renderOverlays(); toast(`Added ${ex(o.id).name}`);
    return;
  }
  S.stack = S.stack.filter(x => x.type !== 'picker' && x.type !== 'preview');
  renderOverlays(); addExerciseToSession(o.id);
};
A.exProg = el => push({ type: 'exprog', id: el.dataset.id, range: 'ALL', combine: false });
A.progRange = el => { topOv().range = el.dataset.v; renderOverlays(); };
A.progCombine = () => { const o = topOv(); o.combine = !o.combine; renderOverlays(); };

// body
A.bodyLog = el => {
  const date = el.dataset.date || ymd(new Date());
  const m = S.meas.find(x => x.date === date);
  push({ type: 'body', date, existing: !!m, w: m ? inVal(m.weight) : '', bf: m && m.bf != null ? String(m.bf) : '' });
};
A.bodySave = async () => {
  const o = topOv(); const w = num(o.w), bf = num(o.bf);
  if (w == null || w <= 0 || fromDisp(w) > 1500) { toast('Enter a valid weight'); return; }
  if (bf != null && (bf <= 0 || bf >= 75)) { toast('Body fat should be between 0 and 75%'); return; }
  const m = { date: o.date, weight: fromDisp(w), bf, updatedAt: Date.now() };
  await db.put('measurements', m);
  S.meas = S.meas.filter(x => x.date !== o.date).concat(m).sort((a, b) => (a.date < b.date ? -1 : 1));
  pop(); renderView(); toast('Measurement saved');
};
A.bodyDelete = async () => {
  const o = topOv();
  if (!(await confirmDlg('Delete this measurement?', `The entry for ${fmtDate(o.date, { month: 'long', day: 'numeric', year: 'numeric' })} will be removed.`, 'Delete', true))) return;
  await db.del('measurements', o.date); S.meas = S.meas.filter(x => x.date !== o.date); pop(); renderView();
};

// custom exercises
A.customList = () => push({ type: 'customList' });
A.customNew = () => push({ type: 'customEdit', isNew: true, draft: { id: 'c-' + uid(), name: '', family: '', variation: '', primary: 'chest', secondary: [], equipment: 'Dumbbell', metric: 'reps', unilateral: false, notes: '' } });
A.customEdit = el => { const c = S.customMap[el.dataset.id]; push({ type: 'customEdit', isNew: false, draft: clone(c) }); };
A.cSec = el => { const d = topOv().draft; const k = el.dataset.k; d.secondary = d.secondary.includes(k) ? d.secondary.filter(x => x !== k) : [...d.secondary, k]; renderOverlays(); };
A.cMetric = el => { topOv().draft.metric = el.dataset.v; renderOverlays(); };
A.cUni = () => { const d = topOv().draft; d.unilateral = !d.unilateral; renderOverlays(); };
A.customSave = async () => {
  const o = topOv(); const d = o.draft; d.name = d.name.trim();
  if (!d.name) { toast('Give the exercise a name'); return; }
  if (allExercises().some(e => e.id !== d.id && e.name.toLowerCase() === d.name.toLowerCase())) { toast('An exercise with that name already exists'); return; }
  const c = { ...d, family: d.family.trim() || d.name, exerciseFamily: d.family.trim() || d.name, variation: d.variation.trim(), primaryMuscle: d.primary, secondary: d.secondary.filter(m => m !== d.primary), emphasis: '', movementPattern: 'custom', patternLabel: 'Custom exercise', unilateralOrBilateral: d.unilateral ? 'unilateral' : 'bilateral', instructions: [], tips: [], builtIn: false, archived: false, createdAt: d.createdAt || Date.now(), updatedAt: Date.now() };
  c.secondaryMuscles = c.secondary;
  await db.put('customExercises', c);
  S.custom = S.custom.filter(x => x.id !== c.id).concat(c); S.customMap[c.id] = c;
  pop(); renderOverlays(); renderView(); toast('Exercise saved');
};
A.customDelete = async () => {
  const o = topOv(); const id = o.draft.id;
  const used = S.workouts.some(w => w.exercises.some(x => x.exerciseId === id)) || S.templates.some(t => t.exercises.some(x => x.exerciseId === id)) || (S.session && S.session.w.exercises.some(x => x.exerciseId === id));
  if (used) {
    if (!(await confirmDlg('Hide this exercise?', 'It’s used in your workouts or templates, so its history is kept. It will be hidden from the library.', 'Hide', true))) return;
    const c = { ...S.customMap[id], archived: true, updatedAt: Date.now() }; await db.put('customExercises', c);
    S.custom = S.custom.map(x => (x.id === id ? c : x)); S.customMap[id] = c;
  } else {
    if (!(await confirmDlg('Delete this exercise?', '', 'Delete', true))) return;
    await db.del('customExercises', id);
    S.custom = S.custom.filter(x => x.id !== id); delete S.customMap[id];
  }
  S.stack = S.stack.filter(x => !(x.type === 'preview' && x.id === id)); pop(); renderView();
};

// settings
A.setTheme = async el => { S.settings.theme = el.dataset.v; await saveSettings(); applyTheme(); render(); };
A.setUnits = async el => { const u = el.dataset.v; if (u === S.settings.units) return; S.settings.units = u; S.settings.increment = u === 'kg' ? 2.5 : 5; await saveSettings(); render(); };
A.setInc = async el => { S.settings.increment = +el.dataset.v; await saveSettings(); renderView(); };
A.setDefSets = async el => { S.settings.defaultSets = Math.max(1, Math.min(10, S.settings.defaultSets + +el.dataset.d)); await saveSettings(); renderView(); };
A.toggleSet = async el => { const k = el.dataset.k; S.settings[k] = !S.settings[k]; await saveSettings(); render(); };

// data
A.exportJSON = async () => {
  const name = `LiftLog Backup ${ymd(new Date())}.json`;
  const ok = await saveFile(name, JSON.stringify(buildBackup(), null, 1), 'application/json');
  if (ok) { S.settings.lastBackup = Date.now(); await saveSettings(); renderView(); }
};
A.exportCSV = el => { const [n, t] = csvFor(el.dataset.k); saveFile(n, t, 'text/csv'); };
A.importConfirm = async () => {
  const o = topOv();
  if (!(await confirmDlg('Replace all data?', 'Everything currently in LiftLog on this iPhone will be replaced by the backup.', 'Replace', true))) return;
  try { flushSession(); await restore(o.data, buildBackup()); toast('Backup restored'); }
  catch (err) { toast('Restore failed. Nothing was changed. ' + err.message); }
};
A.undoImport = async () => {
  const snap = await db.get('meta', 'preImportSnapshot'); if (!snap) return;
  if (!(await confirmDlg('Restore previous data?', `This brings back your data as it was on ${new Date(snap.exportDate).toLocaleString()}, before the last import. Current data will be replaced.`, 'Restore', true))) return;
  await restore(snap, null); toast('Previous data restored');
};
A.demoLoad = async () => { if (!(await confirmDlg('Load demo data?', 'Adds sample workouts, measurements and templates. Your own data isn’t changed, and you can remove the demo data at any time.', 'Load'))) return; await loadDemo(); render(); toast('Demo data loaded'); };
A.demoRemove = async () => { if (!(await confirmDlg('Remove demo data?', 'Only records created by “Load demo data” are removed.', 'Remove', true))) return; await removeDemo(); render(); toast('Demo data removed'); };

// onboarding
A.onbNext = () => { S.onbStep++; render(); };
A.onbUnit = el => { S.settings.units = el.dataset.v; S.settings.increment = el.dataset.v === 'kg' ? 2.5 : 5; render(); };
A.onbFinish = async el => {
  S.settings.onboarded = true; await saveSettings();
  if (el.dataset.v === 'starters') await addStarters();
  S.tab = el.dataset.v === 'starters' ? 'workouts' : 'today';
  render();
  if (el.dataset.v === 'workout') startWorkout(null);
};

// =================================================================== INPUTS
const INPUT = {
  w: t => { setOf(t).weight = fromDisp(num(t.value)); saveSession(); },
  r: t => { const v = num(t.value); setOf(t).reps = v == null ? null : Math.max(0, Math.round(v)); saveSession(); },
  rpe: t => { const v = num(t.value); setOf(t).rpe = v == null ? null : Math.min(10, Math.max(1, v)); saveSession(); },
  wName: t => { S.session.w.name = t.value; saveSession(); },
  wNotes: t => { S.session.w.notes = t.value; saveSession(); },
  wDate: t => { if (!t.value) return; const w = S.session.w; const d = parseYmd(t.value); const o = new Date(w.startTime); d.setHours(o.getHours(), o.getMinutes()); const dur = w.endTime - w.startTime; w.date = t.value; w.startTime = d.getTime(); w.endTime = w.startTime + dur; },
  wDur: t => { const v = num(t.value); if (v != null && v > 0) S.session.w.endTime = S.session.w.startTime + v * 60000; },
  libQ: t => { S.lib.q = t.value; $('#lib-list').innerHTML = exListHTML(S.lib); },
  libEquip: t => { S.lib.equip = t.value; $('#lib-list').innerHTML = exListHTML(S.lib); },
  pickQ: t => { topOv().q = t.value; $('#pick-list').innerHTML = exListHTML(topOv()); },
  pickEquip: t => { topOv().equip = t.value; $('#pick-list').innerHTML = exListHTML(topOv()); },
  tName: t => { topOv().draft.name = t.value; },
  teMin: t => { const v = num(t.value); topOv().draft.exercises[+t.dataset.i].repMin = v == null ? null : Math.round(v); },
  teMax: t => { const v = num(t.value); topOv().draft.exercises[+t.dataset.i].repMax = v == null ? null : Math.round(v); },
  teRpe: t => { topOv().draft.exercises[+t.dataset.i].rpe = num(t.value); },
  teNotes: t => { topOv().draft.exercises[+t.dataset.i].notes = t.value; },
  bDate: t => { const o = topOv(); if (!t.value) return; o.date = t.value; const m = S.meas.find(x => x.date === o.date); o.existing = !!m; if (m) { o.w = inVal(m.weight); o.bf = m.bf != null ? String(m.bf) : ''; } renderOverlays(); },
  bW: t => { topOv().w = t.value; bodyCalc(); },
  bBf: t => { topOv().bf = t.value; bodyCalc(); },
  cName: t => { topOv().draft.name = t.value; },
  cFamily: t => { topOv().draft.family = t.value; },
  cVar: t => { topOv().draft.variation = t.value; },
  cPrimary: t => { const d = topOv().draft; d.primary = t.value; d.secondary = d.secondary.filter(m => m !== t.value); renderOverlays(); },
  cEquip: t => { topOv().draft.equipment = t.value; },
  cNotes: t => { topOv().draft.notes = t.value; },
};
function bodyCalc() {
  const o = topOv(); const w = num(o.w), bf = num(o.bf);
  const fat = w != null && bf != null ? w * bf / 100 : null;
  $('#b-fat').innerHTML = (fat == null ? '–' : fmtNum(fat)) + `<span class="u">${unit()}</span>`;
  $('#b-lean').innerHTML = (fat == null ? '–' : fmtNum(w - fat)) + `<span class="u">${unit()}</span>`;
}
const CHANGE = {
  importFile: async t => {
    const f = t.files[0]; t.value = ''; if (!f) return;
    let data = null, errors;
    try { data = migrateBackup(JSON.parse(await f.text())); errors = validateBackup(data); } catch { errors = ['The file couldn’t be read as JSON.']; }
    push({ type: 'import', data, errors, summary: errors.length ? [] : backupSummary(data) });
  },
};

// =================================================================== STARTUP
function applyTheme() {
  const t = S.settings.theme; const r = document.documentElement;
  if (t === 'system') r.removeAttribute('data-theme'); else r.dataset.theme = t;
}
function bindEvents() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    const f = A[el.dataset.a]; if (f) { e.preventDefault(); Promise.resolve(f(el, e)).catch(err => { console.error(err); toast('Something went wrong: ' + err.message); }); }
  });
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.in; if (k && INPUT[k]) INPUT[k](e.target); });
  document.addEventListener('change', e => {
    const k = e.target.dataset && e.target.dataset.change; if (k && CHANGE[k]) CHANGE[k](e.target);
    if (e.target.tagName === 'SELECT' && e.target.dataset.in && INPUT[e.target.dataset.in]) INPUT[e.target.dataset.in](e.target);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return; const t = e.target; if (!t.dataset) return;
    if (t.dataset.in === 'w') { e.preventDefault(); t.closest('.set-row').querySelector('[data-in="r"]').focus(); }
    else if (['r', 'rpe', 'wName', 'tName'].includes(t.dataset.in) || t.type === 'search') { e.preventDefault(); t.blur(); }
  });
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('in')) setTimeout(() => e.target.select && e.target.select(), 0); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSession(); });
  window.addEventListener('pagehide', flushSession);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S.settings.theme === 'system') { applyTheme(); render(); } });
}
async function init() {
  bindEvents();
  try { await loadAll(); }
  catch (err) { document.body.innerHTML = `<div class="fatal"><h1>LiftLog couldn’t open its database</h1><p>${esc(err.message)}</p><p>Close LiftLog completely and open it again. Your data hasn’t been deleted.</p></div>`; return; }
  applyTheme(); S.ready = true;
  if (S.session) S.session.open = true;
  render(); startTimer();
  if (navigator.storage && navigator.storage.persist) {
    try { S.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist()); } catch { S.persisted = false; }
    if (S.tab === 'more') renderView();
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
