'use strict';
/* =====================================================================
   AI721_ASTRA_LUZ_2.0 — noyau : constantes, utilitaires, stockage, état
   ===================================================================== */
const APP = { name: 'AI721_ASTRA_LUZ_2.0', short: 'ASTRA LUZ', version: '2.0.0', build: '2026-11' };

const LEVELS = [
  { id: '2nde', code: 1, nom: 'Seconde', pref: 'Préfecture de Seconde', roman: '2nde' },
  { id: '1ere', code: 2, nom: 'Première', pref: 'Préfecture de Première', roman: '1re' },
  { id: 'tle', code: 3, nom: 'Terminale', pref: 'Préfecture de Terminale', roman: 'Tle' }
];
const levelById = id => LEVELS.find(l => l.id === id);
const levelByCode = c => LEVELS.find(l => l.code === +c);

const POLES = {
  EG_GROUPE: 'Enseignement général · groupe',
  EG_LIT: 'Enseignement général · solo littéraire',
  EG_SCI: 'Enseignement général · solo scientifique',
  ET: 'Enseignement technique · solo'
};

const DEFAULT_CLASSES = [
  ['2nde', 'EG_GROUPE', ['2C1', '2C2', '2C3', '2C4', '2C5', '2C6']],
  ['2nde', 'EG_LIT', ['2A']],
  ['2nde', 'EG_SCI', ['2TI']],
  ['2nde', 'ET', ['2SES1', '2SES2']],
  ['1ere', 'EG_GROUPE', ['PC1', 'PC2', 'PCE', 'PD1', 'PD2', 'PD3', 'PDE']],
  ['1ere', 'EG_LIT', ['PA']],
  ['1ere', 'EG_SCI', ['PTI']],
  ['1ere', 'ET', ['PSES']],
  ['tle', 'EG_GROUPE', ['TC', 'TCE', 'TD1', 'TD2', 'TD3', 'TDE']],
  ['tle', 'EG_LIT', ['TA']],
  ['tle', 'EG_SCI', ['TTI']],
  ['tle', 'ET', ['TSES']]
];

/* Catalogue de matières proposé : codes à deux chiffres repris dans le code-barres. À valider par les préfets. */
const DEFAULT_SUBJECTS = [
  ['01', 'FRAN', 'Français'], ['02', 'ANG', 'Anglais'], ['03', 'MATH', 'Mathématiques'],
  ['04', 'PHY', 'Physique'], ['05', 'CHIM', 'Chimie'], ['06', 'SVT', 'SVTEEHB'],
  ['07', 'HIST', 'Histoire'], ['08', 'GEO', 'Géographie'], ['09', 'ECM', 'Éducation à la citoyenneté et à la morale'],
  ['10', 'PHILO', 'Philosophie'], ['11', 'INFO', 'Informatique'], ['12', 'EPS', 'Éducation physique et sportive'],
  ['13', 'LV2', 'Langue vivante II (espagnol / allemand)'], ['14', 'LCN', 'Langues et cultures nationales'],
  ['15', 'LIT', 'Littérature'], ['16', 'TECH', 'Technologie / sciences de l’ingénieur'],
  ['17', 'ALGO', 'Algorithmique et programmation'], ['18', 'RSI', 'Réseaux et systèmes informatiques'],
  ['19', 'ECO', 'Sciences économiques'], ['20', 'SOC', 'Sociologie'], ['21', 'COMPTA', 'Comptabilité et gestion']
].map(([code, abbr, nom]) => ({ code, abbr, nom }));

function defaultSubjectsFor(levelId, pole, name) {
  const s = ['01', '02', '03', '07', '08', '09', '11', '12'];
  const add = (...c) => c.forEach(x => { if (!s.includes(x)) s.push(x); });
  if (levelId !== '2nde') add('10');
  if (pole === 'EG_GROUPE') { add('04', '05'); if (/D/.test(name) || levelId === '2nde') add('06'); if (/E$|CE$/.test(name)) add('16'); }
  if (pole === 'EG_LIT') add('13', '14', '15', '06');
  if (pole === 'EG_SCI') add('04', '05', '17', '18');
  if (pole === 'ET') add('19', '20', '21');
  if (levelId === '2nde' && pole === 'EG_GROUPE') add('13');
  return s.sort().map(code => ({ m: code, prof: '', coef: defaultCoef(code, pole, name) }));
}
function defaultCoef(code, pole, name) {
  if (pole === 'EG_GROUPE') { if (code === '03') return /C/.test(name) ? 5 : 4; if (['04', '05'].includes(code)) return /C/.test(name) ? 3 : 2; if (code === '06') return /D/.test(name) ? 4 : 2; }
  if (pole === 'EG_LIT') { if (['01', '10', '15'].includes(code)) return 4; }
  if (pole === 'EG_SCI' && ['17', '18', '03'].includes(code)) return 4;
  if (pole === 'ET' && ['19', '21'].includes(code)) return 4;
  if (code === '12' || code === '09') return 1;
  return 2;
}

const DEFAULT_LOGO = 'data:image/jpeg;base64,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JbSxv5rq0bknex44IHYmvWKrE1L2jF6JCgt2wrwf48xBdc0iboWgdfybP9a94ryT4y+GtX8QXGknSrCa6MayB/LAwuSuMk/SpwskqqbdkOorrQ9P0pxJo9k4/igjP5qK8e+PF6ZLvRtMjyWw0xUdySAP5GrNivxcNrbWscNva28SrGufLB2gAc5JOcCtvX/hze+JvG1vrV3fRRWlusQWEKWZtpyQegGST61pTUaVTmk00S25KyR5v4i8K+NdT04a7qWnRW6WMCoqRYDhFxg4BJOBzyc16D4J8Qw/ELwXd6HqRDXqQmKUsPvgjCuPcHGfce9emPGkkZR1DKwwQRkEehqCx0yx06Py7Kzgtk9Iowo/SonieeNmtVtYahZ6M8d8OfBe9aMJr+ouloHLizt3J3HpknoPwBNeuaPo1hoVgljp1slvbp0VR1Pck9Sfc1pUVnUrTqfEylFLYKKKKyKCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/9k=';
const DEFAULT_SETTINGS = {
  etab: 'Collège François-Xavier Vogt',
  sigle: 'CFX VOGT',
  tutelle: 'Secrétariat à l’Éducation de l’Archidiocèse de Yaoundé',
  ville: 'Yaoundé',
  annee: '2026-2027',
  coordo: 'M. ANDJE IBOT Georges',
  coordoTitre: 'Coordonnateur d’informatique du second cycle',
  prefets: { '2nde': '', '1ere': '', 'tle': '' },
  enteteFR: 'RÉPUBLIQUE DU CAMEROUN\nPaix – Travail – Patrie\nMINISTÈRE DES ENSEIGNEMENTS SECONDAIRES\nSECRÉTARIAT À L’ÉDUCATION DE L’ARCHIDIOCÈSE DE YAOUNDÉ\nCOLLÈGE FRANÇOIS-XAVIER VOGT',
  enteteEN: 'REPUBLIC OF CAMEROON\nPeace – Work – Fatherland\nMINISTRY OF SECONDARY EDUCATION\nEDUCATION SECRETARIAT OF THE ARCHDIOCESE OF YAOUNDÉ\nFRANÇOIS-XAVIER VOGT COLLEGE',
  logo: '', pdfStyle: 'etablissement', departement: 'Secrétariat des évaluations',
  trimCourant: 1, sitCourante: 1,
  seuilReussite: 10, delaiSaisie: 7, tailleLot: 25, ecartDouble: 3,
  sitDates: {}
};

/* ---------------- Utilitaires ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n, l) => String(n).padStart(l, '0');
const uid = (p = '') => p + Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 6);
const clone = o => JSON.parse(JSON.stringify(o));
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`; };
const isoToDate = iso => new Date(iso + 'T12:00:00');
const addDays = (iso, n) => { const d = isoToDate(iso); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`; };
const fmtDate = (iso, opt = 'long') => { if (!iso) return '—'; const d = isoToDate(iso); if (opt === 'short') return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); if (opt === 'dm') return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
const fmtTime = t => t ? t.replace(':', ' h ') : '';
const fmtDT = ts => ts ? new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const minutes = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
const duree = (a, b) => { const d = minutes(b) - minutes(a); if (d <= 0) return '—'; const h = Math.floor(d / 60), m = d % 60; return h ? `${h} h${m ? ' ' + pad(m, 2) : ''}` : `${m} min`; };
const fmtNote = n => (n === null || n === undefined || n === '' || isNaN(n)) ? '' : (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const upperName = s => String(s || '').trim().toUpperCase();
const capName = s => String(s || '').trim().toLowerCase().replace(/(^|[\s\-'’])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
const fullName = st => `${upperName(st.nom)} ${capName(st.prenom)}`.trim();
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function deepMerge(a, b) {
  const out = (a && typeof a === 'object' && !Array.isArray(a)) ? { ...a } : {};
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = v;
  }
  return out;
}
async function sha256(txt) {
  try { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)); return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 0; for (const c of txt) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h; }
}
function seededRandom(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
function shuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const lsGet = (k, d) => { try { const v = localStorage.getItem('astraluz:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem('astraluz:' + k, JSON.stringify(v)); } catch (e) { } };

/* ---------------- Stockage : base partagée (claude.ai) ou locale (IndexedDB) ---------------- */
class LocalStore {
  constructor(ns) { this.ns = ns; this.kind = ns === 'demo' ? 'demo' : 'local'; this.mem = new Map(); this.idb = null; }
  async open() {
    try {
      this.idb = await new Promise((res, rej) => {
        const r = indexedDB.open('astraluz-' + this.ns, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      const all = await new Promise((res, rej) => {
        const out = new Map(); const tx = this.idb.transaction('kv', 'readonly'); const st = tx.objectStore('kv');
        const req = st.openCursor(); req.onsuccess = () => { const c = req.result; if (c) { out.set(c.key, c.value); c.continue(); } else res(out); }; req.onerror = () => rej(req.error);
      });
      this.mem = all;
    } catch (e) { this.idb = null; this.volatile = true; }
    return this;
  }
  _persist(path, val) {
    if (!this.idb) return;
    try { const tx = this.idb.transaction('kv', 'readwrite'); const st = tx.objectStore('kv'); val === undefined ? st.delete(path) : st.put(val, path); } catch (e) { }
  }
  async get(path) { const v = this.mem.get(path); return v === undefined ? null : clone(v); }
  async set(path, data) { this.mem.set(path, clone(data)); this._persist(path, clone(data)); }
  async update(path, partial) { const cur = this.mem.get(path) || {}; const v = deepMerge(cur, partial); this.mem.set(path, v); this._persist(path, clone(v)); }
  async delete(path) { this.mem.delete(path); this._persist(path, undefined); }
  async list(col) { const out = []; const pre = col + '/'; for (const [k, v] of this.mem) { if (k.startsWith(pre) && !k.slice(pre.length).includes('/')) out.push({ id: k.slice(pre.length), data: clone(v) }); } return out; }
  subscribe() { return () => { }; }
  async setMany(entries) { for (const [p, d] of entries) await this.set(p, d); }
  async wipe() { for (const k of [...this.mem.keys()]) await this.delete(k); }
}
class SharedStore {
  constructor(db) { this.db = db; this.kind = 'shared'; this.exists = new Set(); }
  async _retry(fn) { try { return await fn(); } catch (e) { if (e && e.code === 'unavailable') { await sleep(400 + Math.random() * 600); return fn(); } throw e; } }
  async get(path) { const s = await this._retry(() => this.db.doc(path).get()); if (s.exists) { this.exists.add(path); return clone(s.data()); } return null; }
  async set(path, data) { await this._retry(() => this.db.doc(path).set(clone(data))); this.exists.add(path); }
  async update(path, partial) {
    if (!this.exists.has(path)) { const cur = await this.get(path); if (!cur) return this.set(path, deepMerge({}, partial)); }
    try { await this._retry(() => this.db.doc(path).update(clone(partial))); }
    catch (e) { if (e && e.code === 'invalid_argument') { const cur = await this.get(path); await this.set(path, deepMerge(cur || {}, partial)); } else throw e; }
  }
  async delete(path) { await this._retry(() => this.db.doc(path).delete()); this.exists.delete(path); }
  async list(col) { const q = await this._retry(() => this.db.collection(col).get()); return q.docs.map(d => { this.exists.add(col + '/' + d.id); return { id: d.id, data: clone(d.data()) }; }); }
  async setMany(entries) { for (const [p, d] of entries) await this.set(p, d); }
  subscribe(col, cb) {
    try { return this.db.collection(col).onSnapshot(snap => { if (snap.metadata && snap.metadata.hasPendingWrites) return; cb(snap.docs.map(d => ({ id: d.id, data: d.data() }))); }, () => { }); }
    catch (e) { return () => { }; }
  }
}

/* ---------------- État global ---------------- */
const S = {
  store: null, mode: 'local', ready: false,
  settings: { ...clone(DEFAULT_SETTINGS), logo: DEFAULT_LOGO }, subjects: [], teachers: [], rooms: [], classes: {}, evals: {}, security: {},
  caps: { downloads: null, user: null, userName: '' },
  ui: { level: lsGet('level', null), view: 'accueil', role: 'secretariat', unlocked: false, filters: {}, sel: {} }
};
const subjByCode = c => S.subjects.find(s => s.code === c) || { code: c, abbr: c, nom: 'Matière ' + c };
const teacherById = id => S.teachers.find(t => t.id === id);
const teacherName = id => { const t = teacherById(id); return t ? `${t.civ ? t.civ + ' ' : ''}${upperName(t.nom)} ${capName(t.prenom || '')}`.trim() : ''; };
const classesOf = levelId => Object.values(S.classes).filter(c => c.level === levelId).sort((a, b) => a.rang - b.rang);
const evalsOf = levelId => Object.values(S.evals).filter(e => e.level === levelId);
const studentsOf = cls => (cls.students || []).filter(s => s.statut !== 'parti').sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr'));
const findStudent = sid => { for (const c of Object.values(S.classes)) { const s = (c.students || []).find(x => x.id === sid); if (s) return { st: s, cls: c }; } return null; };
const roomById = id => S.rooms.find(r => r.id === id);

const STATUS = {
  planifiee: { l: 'Planifiée', c: 'info', step: 1 },
  preparee: { l: 'Codes générés', c: 'accent', step: 2 },
  composee: { l: 'Composée', c: 'warn', step: 3 },
  saisie: { l: 'Saisie en cours', c: 'warn', step: 3 },
  desanonymisee: { l: 'Désanonymisée', c: 'ok', step: 4 },
  cloturee: { l: 'Clôturée', c: 'ok', step: 5 }
};
const statusPill = st => { const s = STATUS[st] || STATUS.planifiee; return `<span class="pill ${s.c}">${s.l}</span>`; };
const trimOfSit = s => Math.ceil(s / 2);

/* ---------------- Journal d'audit ---------------- */
async function audit(action, detail = '', level = '') {
  const day = todayISO().replace(/-/g, '');
  const key = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const who = S.mode === 'cloud' ? (S.caps.userName || 'Utilisateur') : (S.ui.role === 'coordination' ? 'Coordination' : 'Secrétariat');
  try { await S.store.update('logs/' + day, { day: todayISO(), entries: { [key]: { at: Date.now(), who, uid: S.caps.userId || null, role: S.ui.role, action, detail: String(detail).slice(0, 400), level: level || S.ui.level || '' } } }); } catch (e) { }
}

/* ---------------- Chargement / initialisation ---------------- */
async function loadAll() {
  const st = S.store;
  const [settings, subjects, teachers, rooms, security, classes, evals] = await Promise.all([
    st.get('cfg/settings'), st.get('cfg/subjects'), st.get('cfg/teachers'), st.get('cfg/rooms'), st.get('cfg/security'), st.list('classes'), st.list('evals')
  ]);
  S.initialized = !!settings;
  S.settings = deepMerge(clone(DEFAULT_SETTINGS), settings || {});
  if (!S.settings.logo) S.settings.logo = DEFAULT_LOGO;
  S.subjects = (subjects && subjects.list) || (settings ? [] : clone(DEFAULT_SUBJECTS));
  S.teachers = (teachers && teachers.list) || [];
  S.rooms = (rooms && rooms.list) || [];
  S.security = security || {};
  S.classes = {}; classes.forEach(c => S.classes[c.id] = c.data);
  S.evals = {}; evals.forEach(e => S.evals[e.id] = e.data);
}
function buildDefaultClasses() {
  const out = {};
  for (const [lv, pole, names] of DEFAULT_CLASSES) {
    for (const n of names) {
      const rang = Object.values(out).filter(c => c.level === lv).length + 1;
      const id = 'c_' + n.toLowerCase();
      out[id] = { id, level: lv, nom: n, pole, rang, titulaire: '', students: [], subjects: defaultSubjectsFor(lv, pole, n) };
    }
  }
  return out;
}
async function initStructure() {
  const st = S.store;
  await st.set('cfg/settings', clone(DEFAULT_SETTINGS));
  await st.set('cfg/subjects', { list: clone(DEFAULT_SUBJECTS) });
  await st.set('cfg/teachers', { list: [] });
  await st.set('cfg/rooms', { list: [] });
  const cls = buildDefaultClasses();
  await st.setMany(Object.values(cls).map(c => ['classes/' + c.id, c]));
  await audit('Initialisation', 'Structure 2026-2027 : 29 classes, ' + DEFAULT_SUBJECTS.length + ' matières');
  await loadAll();
}
const saveSettings = () => S.store.set('cfg/settings', S.settings);
const saveSubjects = () => S.store.set('cfg/subjects', { list: S.subjects });
const saveTeachers = () => S.store.set('cfg/teachers', { list: S.teachers });
const saveRooms = () => S.store.set('cfg/rooms', { list: S.rooms });
const saveClass = c => S.store.set('classes/' + c.id, c);
const saveEval = e => { e.updatedAt = Date.now(); return S.store.set('evals/' + e.id, e); };

/* ---------------- Jeu de démonstration (données fictives) ---------------- */
const DEMO_NOMS = ['MBARGA', 'NGONO', 'ESSOMBA', 'ATANGANA', 'FOUDA', 'OWONA', 'NKODO', 'ABENA', 'BELINGA', 'ETOA', 'MANGA', 'NDZANA', 'ONANA', 'ZANGA', 'EKANI', 'MBALLA', 'NGUEMA', 'TSALA', 'AMBASSA', 'KAMGA', 'FOTSO', 'NJOYA', 'KENGNE', 'TAGNE', 'DJOMO', 'MOUNA', 'EBOGO', 'NDONGO', 'MVONDO', 'ELLA', 'NANGA', 'ABOMO', 'MEKA', 'ESSAMA', 'NOAH', 'BIWOLE', 'TCHAMENI', 'WANDJI', 'NOUMSSI', 'SIMO', 'YOUMBI', 'EYEBE', 'AYISSI', 'MESSI', 'OBAMA', 'ENOW', 'TABI', 'NKWETTA', 'EBANGA', 'MINKO'];
const DEMO_PRENOMS_F = ['Marie-Claire', 'Christelle', 'Larissa', 'Murielle', 'Sandrine', 'Danielle', 'Josiane', 'Laure', 'Carine', 'Grâce', 'Ornella', 'Merveille', 'Rosine', 'Pauline', 'Inès', 'Audrey', 'Brenda', 'Estelle', 'Flore', 'Gaëlle', 'Hélène', 'Irène', 'Joëlle', 'Kelly', 'Lydie', 'Michelle', 'Nadège', 'Prisca', 'Raïssa', 'Stéphanie'];
const DEMO_PRENOMS_M = ['Jean-Paul', 'Boris', 'Ulrich', 'Brice', 'Franck', 'Yannick', 'Hervé', 'Arnaud', 'Steve', 'Junior', 'Kévin', 'Emmanuel', 'Cédric', 'Daniel', 'Patrick', 'Aurélien', 'Bertrand', 'Christian', 'Didier', 'Éric', 'Fabrice', 'Gilles', 'Hugues', 'Ivan', 'Joël', 'Landry', 'Martial', 'Nathan', 'Olivier', 'Romaric'];
async function buildDemo() {
  const st = S.store; await st.wipe();
  const rnd = seededRandom(20262027);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const settings = clone(DEFAULT_SETTINGS);
  settings.prefets = { '2nde': 'M. EXEMPLE Préfet 2nde', '1ere': 'Mme EXEMPLE Préfète 1re', 'tle': 'M. EXEMPLE Préfet Tle' };
  settings.trimCourant = 1; settings.sitCourante = 2;
  await st.set('cfg/settings', settings);
  await st.set('cfg/subjects', { list: clone(DEFAULT_SUBJECTS) });
  const teachers = [];
  for (let i = 0; i < 46; i++) { const f = rnd() < .45; teachers.push({ id: 'p' + pad(i + 1, 3), civ: f ? 'Mme' : 'M.', nom: pick(DEMO_NOMS), prenom: pick(f ? DEMO_PRENOMS_F : DEMO_PRENOMS_M), tel: '6' + Math.floor(70000000 + rnd() * 29999999), matieres: [] }); }
  const rooms = []; const roomsByLevel = {};
  ['A', 'B', 'C'].forEach((b, bi) => { roomsByLevel[LEVELS[bi].id] = []; for (let i = 1; i <= 13; i++) { const r = { id: 'r' + b + pad(i, 2), nom: `Salle ${b}${i}`, capacite: [44, 46, 48, 50][(i + bi) % 4], batiment: 'Bâtiment ' + b }; rooms.push(r); roomsByLevel[LEVELS[bi].id].push(r.id); } });
  await st.set('cfg/rooms', { list: rooms });
  const cls = buildDefaultClasses();
  let tIdx = 0; let mat = 1;
  for (const c of Object.values(cls)) {
    const n = c.pole === 'EG_GROUPE' ? 52 + Math.floor(rnd() * 14) : 34 + Math.floor(rnd() * 14);
    for (let i = 0; i < n; i++) { const f = rnd() < .52; c.students.push({ id: 's' + pad(mat, 5), mat: '26V' + pad(mat, 4), nom: pick(DEMO_NOMS), prenom: pick(f ? DEMO_PRENOMS_F : DEMO_PRENOMS_M) + (rnd() < .3 ? ' ' + pick(f ? DEMO_PRENOMS_F : DEMO_PRENOMS_M) : ''), sexe: f ? 'F' : 'M', dn: `${2008 + ['2nde', '1ere', 'tle'].indexOf(c.level) * -1 + Math.floor(rnd() * 2)}-${pad(1 + Math.floor(rnd() * 12), 2)}-${pad(1 + Math.floor(rnd() * 28), 2)}`, statut: rnd() < .08 ? 'redoublant' : 'nouveau' }); mat++; }
    c.subjects.forEach(s => { const t = teachers[tIdx++ % teachers.length]; s.prof = t.id; if (!t.matieres.includes(s.m)) t.matieres.push(s.m); });
    c.titulaire = teachers[(tIdx * 7) % teachers.length].id;
    await st.set('classes/' + c.id, c);
  }
  await st.set('cfg/teachers', { list: teachers });
  S.settings = settings; S.subjects = clone(DEFAULT_SUBJECTS); S.teachers = teachers; S.rooms = rooms; S.classes = cls; S.evals = {};
  // Situation 1 (composée, désanonymisée) et situation 2 (en cours) pour quelques matières
  const planS1 = ['03', '01', '02', '04', '06', '07', '11', '13', '19', '17', '10'];
  const day0 = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
  const slots = [['07:30', '09:30'], ['10:00', '12:00'], ['13:00', '15:00']];
  for (const lv of LEVELS) {
    const lc = classesOf(lv.id);
    let k = 0;
    for (const m of planS1) {
      const classes = lc.filter(c => c.subjects.some(s => s.m === m)).map(c => c.id); if (!classes.length) continue;
      const slot = slots[k % 3]; const date = day0[Math.floor(k / 3) % 5]; k++;
      const e = newEval({ level: lv.id, subj: m, trim: 1, sit: 1, date, start: slot[0], end: slot[1], classes });
      autoPlace(e, 'brassage', roomsByLevel[lv.id]);
      e.status = 'desanonymisee'; e.marks = {};
      const lvlBias = (rnd() - .5) * 2;
      e.placement.list.forEach(([sid, cid, table]) => { const r = rnd(); if (r < .03) e.marks[pad(table, 3)] = { st: 'ABS', at: Date.now() }; else { let v = 10.6 + lvlBias + (cid.charCodeAt(cid.length - 1) % 5 - 2) * .6 + gaussian(rnd) * 3.4; v = Math.max(0, Math.min(20, Math.round(v * 4) / 4)); e.marks[pad(table, 3)] = { n: v, st: 'P', at: Date.now(), by: 'Démo' }; } });
      e.anon = { lifted: true, at: Date.parse(addDays(date, 9) + 'T10:00:00'), by: 'Coordination (démo)' };
      e.deadline = addDays(date, 7);
      S.evals[e.id] = e; await st.set('evals/' + e.id, e);
    }
    // Situation 2 : semaine du 9 novembre 2026
    const planS2 = [['03', '2026-11-09', 0], ['01', '2026-11-09', 1], ['02', '2026-11-10', 0], ['07', '2026-11-10', 1], ['04', '2026-11-11', 0], ['11', '2026-11-11', 1], ['06', '2026-11-12', 0], ['13', '2026-11-12', 1], ['19', '2026-11-13', 0], ['17', '2026-11-13', 1], ['10', '2026-11-13', 2]];
    for (const [m, date, si] of planS2) {
      const classes = lc.filter(c => c.subjects.some(s => s.m === m)).map(c => c.id); if (!classes.length) continue;
      const e = newEval({ level: lv.id, subj: m, trim: 1, sit: 2, date, start: slots[si][0], end: slots[si][1], classes });
      if (m === '03' || m === '01') { autoPlace(e, 'brassage', roomsByLevel[lv.id]); e.status = 'preparee'; }
      S.evals[e.id] = e; await st.set('evals/' + e.id, e);
    }
  }
  // Une épreuve composée en cours de saisie (Informatique 1re, situation 2 anticipée)
  const lv = '1ere'; const classes = classesOf(lv).filter(c => c.subjects.some(s => s.m === '18')).map(c => c.id);
  if (classes.length) {
    const e = newEval({ level: lv, subj: '18', trim: 1, sit: 2, date: '2026-10-30', start: '10:00', end: '12:00', classes });
    autoPlace(e, 'classe', roomsByLevel[lv]); e.status = 'saisie'; e.marks = {};
    e.placement.list.forEach(([sid, cid, table], i) => { if (i % 3 !== 0) e.marks[pad(table, 3)] = { n: Math.max(0, Math.min(20, Math.round((11 + gaussian(rnd) * 3) * 4) / 4)), st: 'P', at: Date.now(), by: 'Démo' }; });
    e.deadline = '2026-11-06'; S.evals[e.id] = e; await st.set('evals/' + e.id, e);
  }
  await audit('Démonstration', 'Jeu de données fictives généré');
}
function gaussian(rnd) { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
