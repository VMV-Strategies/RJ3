// LiftLog persistence layer (IndexedDB).
// Weights are stored in pounds internally; the UI converts for kg users.
// To change the schema later: bump DB_VERSION and add an `if (old < N)` block in upgrade().

const DB_NAME = 'liftlog';
const DB_VERSION = 1;
export const STORES = ['meta', 'measurements', 'workouts', 'templates', 'customExercises', 'images'];

let dbPromise = null;

function upgrade(db, old) {
  if (old < 1) {
    db.createObjectStore('meta');                                   // settings, active workout, favorites, recents
    db.createObjectStore('measurements', { keyPath: 'date' });      // one entry per day
    const w = db.createObjectStore('workouts', { keyPath: 'id' });
    w.createIndex('startTime', 'startTime');
    db.createObjectStore('templates', { keyPath: 'id' });
    db.createObjectStore('customExercises', { keyPath: 'id' });
    db.createObjectStore('images');                                 // custom exercise images (data URLs), keyed by exercise id
  }
  // Future migrations go here, e.g. if (old < 2) { ... }
}

export function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => upgrade(req.result, e.oldVersion);
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Database upgrade blocked. Close other LiftLog tabs and reopen.'));
  });
  return dbPromise;
}

const done = t => new Promise((res, rej) => {
  t.oncomplete = () => res();
  t.onerror = () => rej(t.error);
  t.onabort = () => rej(t.error || new Error('Transaction aborted'));
});
const result = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export async function get(store, key) {
  const db = await open();
  return result(db.transaction(store).objectStore(store).get(key));
}
export async function getAll(store) {
  const db = await open();
  return result(db.transaction(store).objectStore(store).getAll());
}
export async function entries(store) {
  const db = await open();
  const os = db.transaction(store).objectStore(store);
  const [keys, vals] = await Promise.all([result(os.getAllKeys()), result(os.getAll())]);
  return keys.map((k, i) => [k, vals[i]]);
}
export async function put(store, value, key) {
  const db = await open();
  const t = db.transaction(store, 'readwrite');
  key === undefined ? t.objectStore(store).put(value) : t.objectStore(store).put(value, key);
  return done(t);
}
export async function del(store, key) {
  const db = await open();
  const t = db.transaction(store, 'readwrite');
  t.objectStore(store).delete(key);
  return done(t);
}

// Several writes in one all-or-nothing transaction.
// ops: [{ store, op: 'put' | 'delete', value, key }]
export async function batch(ops) {
  if (!ops.length) return;
  const db = await open();
  const stores = [...new Set(ops.map(o => o.store))];
  const t = db.transaction(stores, 'readwrite');
  for (const o of ops) {
    const os = t.objectStore(o.store);
    if (o.op === 'delete') os.delete(o.key);
    else if (o.key === undefined) os.put(o.value);
    else os.put(o.value, o.key);
  }
  return done(t);
}

// Replace everything (backup restore). Runs in a single transaction: either the
// whole restore succeeds or nothing changes.
export async function replaceAll(d) {
  const db = await open();
  const t = db.transaction(STORES, 'readwrite');
  for (const s of STORES) t.objectStore(s).clear();
  const meta = t.objectStore('meta');
  meta.put(d.settings, 'settings');
  meta.put(d.favorites || [], 'favorites');
  meta.put(d.recents || [], 'recents');
  if (d.activeWorkout) meta.put(d.activeWorkout, 'active');
  if (d.snapshot) meta.put(d.snapshot, 'preImportSnapshot');
  for (const m of d.bodyMeasurements) t.objectStore('measurements').put(m);
  for (const w of d.workouts) t.objectStore('workouts').put(w);
  for (const x of d.templates) t.objectStore('templates').put(x);
  for (const c of d.customExercises) t.objectStore('customExercises').put(c);
  for (const [k, v] of Object.entries(d.customExerciseImages || {})) t.objectStore('images').put(v, k);
  return done(t);
}
