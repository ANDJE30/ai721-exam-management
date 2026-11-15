/* =====================================================================
   Modèle : évaluations, répartition en salles, codes-barres, statistiques
   ===================================================================== */
function newEval({ level, subj, trim, sit, date, start, end, classes, bareme = 20, double = false, consignes = '' }) {
  return {
    id: uid('e'), level, subj, trim: +trim, sit: +sit, date, start, end, classes: classes.slice(),
    bareme: +bareme || 20, double: !!double, consignes, status: 'planifiee',
    placement: null, marks: {}, anon: { lifted: false },
    deadline: addDays(date, +(S.settings.delaiSaisie || 7)), createdAt: Date.now(), updatedAt: Date.now()
  };
}
const evalLabel = e => `${subjByCode(e.subj).nom} · T${e.trim} · S${e.sit}`;
const evalShort = e => `${subjByCode(e.subj).abbr} T${e.trim}S${e.sit}`;
const evalClassNames = e => e.classes.map(id => S.classes[id]?.nom || '?').join(', ');

/* ---------- Code-barres : N CC MM T S TTT KK (12 chiffres, Code 128 jeu C) ---------- */
function mod97Key(base10) { const n = Number(base10); return 98 - ((n * 100) % 97); }
function makeCode(levelCode, classRang, subj, trim, sit, table) {
  const base = `${levelCode}${pad(classRang, 2)}${pad(subj, 2)}${trim}${sit}${pad(table, 3)}`;
  return base + pad(mod97Key(base), 2);
}
function codeOf(e, cid, table) { const c = S.classes[cid]; return makeCode(levelById(e.level).code, c ? c.rang : 0, e.subj, e.trim, e.sit, table); }
const fmtCode = c => c ? `${c.slice(0, 1)} ${c.slice(1, 3)} ${c.slice(3, 5)} ${c.slice(5, 7)} ${c.slice(7, 10)} ${c.slice(10)}` : '';
/* Douchette réglée en QWERTY sur un clavier AZERTY : « &é"'(-è_çà » au lieu de « 1234567890 » */
const AZERTY_DIGITS = { '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5', '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0' };
function scanDigits(raw) { let s = String(raw || ''); if (!/\d/.test(s) && /[&é"'(è_çà]/.test(s)) s = s.replace(/[&é"'(\-è_çà]/g, c => AZERTY_DIGITS[c]); return s.replace(/\D/g, ''); }
function parseCode(raw) {
  const d = scanDigits(raw);
  if (d.length !== 12) return { ok: false, err: `Le code doit compter 12 chiffres (lu : ${d.length}).`, digits: d };
  const base = d.slice(0, 10), key = +d.slice(10);
  const ok = ((Number(base) * 100 + key) % 97) === 1;
  const r = { digits: d, N: +d[0], CC: +d.slice(1, 3), MM: d.slice(3, 5), T: +d[5], S: +d[6], TTT: +d.slice(7, 10), KK: key, ok };
  if (!ok) r.err = 'Clé de contrôle invalide : code mal lu ou mal saisi.';
  r.level = levelByCode(r.N); r.subject = subjByCode(r.MM);
  r.cls = Object.values(S.classes).find(c => r.level && c.level === r.level.id && c.rang === r.CC);
  return r;
}
function locateCode(raw, preferEval) {
  const p = parseCode(raw); if (!p.ok) return { p };
  const cands = Object.values(S.evals).filter(e => p.level && e.level === p.level.id && e.subj === p.MM && e.trim === p.T && e.sit === p.S && e.placement);
  if (preferEval) cands.sort((a, b) => (b.id === preferEval.id) - (a.id === preferEval.id));
  for (const e of cands) {
    const entry = e.placement.list.find(x => x[2] === p.TTT);
    if (entry && S.classes[entry[1]] && S.classes[entry[1]].rang === p.CC) return { p, e, entry, cls: S.classes[entry[1]] };
  }
  return { p, err: 'Aucune copie ne correspond à ce code dans les épreuves enregistrées.' };
}
const markKey = table => pad(table, 3);

/* ---------- Répartition des élèves dans les salles ---------- */
const PLACE_MODES = {
  brassage: 'Brassage alterné des classes (anti-fraude)',
  classe: 'Classe par classe, ordre alphabétique',
  alpha: 'Ordre alphabétique sur tout le niveau',
  aleatoire: 'Tirage aléatoire reproductible'
};
function candidatesOf(e) {
  const out = [];
  e.classes.map(id => S.classes[id]).filter(Boolean).sort((a, b) => a.rang - b.rang).forEach(c => studentsOf(c).forEach(s => out.push({ sid: s.id, cid: c.id, name: fullName(s) })));
  return out;
}
function autoPlace(e, mode, roomIds, opts = {}) {
  const cand = candidatesOf(e);
  let ordered;
  if (mode === 'alpha') ordered = cand.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  else if (mode === 'aleatoire') { const seed = opts.seed || Math.floor(Math.random() * 1e6); opts.seed = seed; ordered = shuffle(cand, seededRandom(seed)); }
  else if (mode === 'brassage') {
    const by = {}; cand.forEach(x => (by[x.cid] = by[x.cid] || []).push(x));
    const queues = Object.values(by); ordered = [];
    const max = Math.max(0, ...queues.map(q => q.length));
    for (let i = 0; i < max; i++) queues.forEach(q => { if (q[i]) ordered.push(q[i]); });
  } else ordered = cand;
  const rooms = roomIds.map(roomById).filter(Boolean);
  const total = ordered.length;
  const cap = rooms.reduce((a, r) => a + (+r.capacite || 0), 0);
  if (!rooms.length) throw new Error('Sélectionnez au moins une salle de composition.');
  if (cap < total) throw new Error(`Capacité insuffisante : ${cap} places pour ${total} élèves. Ajoutez des salles.`);
  if (total > 999) throw new Error('Le numéro de table est limité à 999 par épreuve.');
  const list = []; const rr = []; let t = 1; let i = 0;
  const per = opts.equilibrer ? Math.ceil(total / rooms.length) : null;
  for (const r of rooms) {
    if (i >= total) break;
    const n = Math.min(per ? Math.min(per, +r.capacite) : +r.capacite, total - i);
    const from = t;
    for (let k = 0; k < n; k++, i++, t++) { const x = ordered[i]; list.push([x.sid, x.cid, t, x.name]); }
    rr.push({ id: r.id, nom: r.nom, from, to: t - 1, surv: [] });
  }
  if (i < total) return autoPlace(e, mode, roomIds, { ...opts, equilibrer: false }); // salle trop petite pour l'équilibrage : remplissage simple
  const prevSurv = {}; (e.placement?.rooms || []).forEach(r => prevSurv[r.id] = r.surv || []);
  rr.forEach(r => r.surv = prevSurv[r.id] || []);
  e.placement = { mode, seed: opts.seed || null, at: Date.now(), by: S.caps.userName || 'Secrétariat', list, rooms: rr };
  if (e.status === 'planifiee') e.status = 'preparee';
  return e;
}
const roomOfTable = (e, table) => (e.placement?.rooms || []).find(r => table >= r.from && table <= r.to);
function autoSurveillants(e, perRoom = 2) {
  if (!e.placement) return;
  const busy = new Set(Object.values(S.evals).filter(o => o.id !== e.id && o.date === e.date && overlap(o, e) && o.placement).flatMap(o => o.placement.rooms.flatMap(r => r.surv || [])));
  const subjTeachers = new Set(e.classes.map(cid => S.classes[cid]?.subjects.find(s => s.m === e.subj)?.prof).filter(Boolean));
  const pool = S.teachers.filter(t => !busy.has(t.id) && !subjTeachers.has(t.id)).map(t => t.id);
  const rnd = seededRandom(Date.now() % 100000);
  const sh = shuffle(pool, rnd); let k = 0;
  e.placement.rooms.forEach(r => { r.surv = []; for (let j = 0; j < perRoom && k < sh.length; j++) r.surv.push(sh[k++]); });
  return sh.length >= perRoom * e.placement.rooms.length;
}
const overlap = (a, b) => a.date === b.date && minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end);

/* ---------- Notes ---------- */
function finalMark(m, e) {
  if (!m || m.st === 'ABS' || m.st === 'DISP' || m.st === 'FRAUDE') return null;
  if (m.n === null || m.n === undefined || m.n === '') return null;
  let v = +m.n;
  if (e && e.double) { if (m.n3 !== undefined && m.n3 !== null && m.n3 !== '') v = +m.n3; else if (m.n2 !== undefined && m.n2 !== null && m.n2 !== '') v = (+m.n + +m.n2) / 2; else return null; }
  const bar = e ? (+e.bareme || 20) : 20;
  return bar === 20 ? v : v * 20 / bar;
}
function markDone(m, e) { if (!m) return false; if (['ABS', 'DISP', 'FRAUDE'].includes(m.st)) return true; return finalMark(m, e) !== null; }
function needsArbitration(m, e) { return e.double && m && m.n !== undefined && m.n !== null && m.n !== '' && m.n2 !== undefined && m.n2 !== null && m.n2 !== '' && Math.abs(m.n - m.n2) >= (+S.settings.ecartDouble || 3) && (m.n3 === undefined || m.n3 === null || m.n3 === ''); }
function progressOf(e) {
  const total = e.placement ? e.placement.list.length : 0;
  let done = 0, abs = 0, arb = 0;
  if (e.placement) e.placement.list.forEach(([, , t]) => { const m = e.marks?.[markKey(t)]; if (markDone(m, e)) done++; if (m && m.st === 'ABS') abs++; if (needsArbitration(m, e)) arb++; });
  return { total, done, abs, arb, pct: total ? Math.round(done * 100 / total) : 0, missing: total - done };
}
function statsOf(vals) {
  const v = vals.filter(x => x !== null && !isNaN(x)).map(Number).sort((a, b) => a - b);
  const n = v.length; const seuil = +S.settings.seuilReussite || 10;
  if (!n) return { n: 0, mean: null, min: null, max: null, sd: null, med: null, pass: 0, rate: null, bins: [0, 0, 0, 0, 0, 0, 0] };
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const med = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
  const pass = v.filter(x => x >= seuil).length;
  const edges = [5, 8, 10, 12, 14, 16]; const bins = [0, 0, 0, 0, 0, 0, 0];
  v.forEach(x => { let k = edges.findIndex(ed => x < ed); if (k < 0) k = 6; bins[k]++; });
  return { n, mean, min: v[0], max: v[n - 1], sd, med, pass, rate: pass * 100 / n, bins };
}
const BIN_LABELS = ['[0 ; 5[', '[5 ; 8[', '[8 ; 10[', '[10 ; 12[', '[12 ; 14[', '[14 ; 16[', '[16 ; 20]'];
function appreciation(n) { if (n === null || n === undefined) return ''; if (n < 5) return 'Très insuffisant'; if (n < 8) return 'Insuffisant'; if (n < 10) return 'Médiocre'; if (n < 12) return 'Passable'; if (n < 14) return 'Assez bien'; if (n < 16) return 'Bien'; if (n < 18) return 'Très bien'; return 'Excellent'; }
/* Résultats désanonymisés par classe */
function resultsByClass(e) {
  const out = {};
  e.classes.forEach(cid => out[cid] = []);
  (e.placement?.list || []).forEach(([sid, cid, t, name]) => {
    const m = e.marks?.[markKey(t)] || null; const f = finalMark(m, e);
    const fs = findStudent(sid); const st = fs ? fs.st : null;
    (out[cid] = out[cid] || []).push({ sid, cid, table: t, name: st ? fullName(st) : name, mat: st?.mat || '', sexe: st?.sexe || '', mark: m, note: f, st: m?.st || (f === null ? '—' : 'P') });
  });
  Object.values(out).forEach(a => a.sort((x, y) => x.name.localeCompare(y.name, 'fr')));
  return out;
}
/* Rang dans la classe */
function withRanks(rows) {
  const sorted = rows.filter(r => r.note !== null).slice().sort((a, b) => b.note - a.note);
  const rank = {}; sorted.forEach((r, i) => { rank[r.sid] = (i > 0 && sorted[i - 1].note === r.note) ? rank[sorted[i - 1].sid] : i + 1; });
  return rows.map(r => ({ ...r, rang: rank[r.sid] || null }));
}

/* ---------- Contrôles de cohérence ---------- */
function conflictsOf(levelId) {
  const out = [];
  const evs = Object.values(S.evals);
  const mine = levelId ? evs.filter(e => e.level === levelId) : evs;
  for (const e of mine) {
    for (const o of evs) {
      if (o.id <= e.id && (levelId ? o.level === levelId : true)) continue;
      if (!overlap(e, o)) continue;
      const common = e.classes.filter(c => o.classes.includes(c));
      if (common.length) out.push({ sev: 'bad', e, msg: `Chevauchement le ${fmtDate(e.date, 'dm')} : ${evalShort(e)} et ${evalShort(o)} pour ${common.map(c => S.classes[c]?.nom).join(', ')}.` });
      if (e.placement && o.placement) {
        const rs = e.placement.rooms.map(r => r.id).filter(r => o.placement.rooms.some(x => x.id === r));
        if (rs.length) out.push({ sev: 'bad', e, msg: `Salle occupée deux fois le ${fmtDate(e.date, 'dm')} (${rs.slice(0, 4).map(r => roomById(r)?.nom || r).join(', ')}${rs.length > 4 ? ` et ${rs.length - 4} autre(s)` : ''}) : ${evalShort(e)} ${levelById(e.level).roman} et ${evalShort(o)} ${levelById(o.level).roman}.` });
      }
    }
    e.classes.forEach(cid => { const c = S.classes[cid]; if (!c) return; if (!studentsOf(c).length) out.push({ sev: 'warn', e, msg: `${c.nom} n’a aucun élève enregistré (${evalShort(e)}).` }); const sj = c.subjects.find(s => s.m === e.subj); if (!sj) out.push({ sev: 'warn', e, msg: `${subjByCode(e.subj).nom} n’est pas au programme de ${c.nom}.` }); else if (!sj.prof) out.push({ sev: 'info', e, msg: `Pas d’enseignant de ${subjByCode(e.subj).abbr} associé à ${c.nom}.` }); });
    if (e.placement) {
      const cur = new Set(candidatesOf(e).map(x => x.sid)); const placed = new Set(e.placement.list.map(x => x[0]));
      const added = [...cur].filter(x => !placed.has(x)).length;
      if (added && !e.anon?.lifted) out.push({ sev: 'warn', e, msg: `${evalShort(e)} (${fmtDate(e.date, 'dm')}) : ${added} élève(s) inscrit(s) après la génération des codes. Regénérez la répartition.` });
    }
    const pr = progressOf(e);
    if (e.placement && ['composee', 'saisie'].includes(e.status) && e.deadline && e.deadline < todayISO() && pr.missing) out.push({ sev: 'warn', e, msg: `Saisie en retard : ${evalShort(e)} ${levelById(e.level).roman}, ${pr.missing} copie(s) sans note (échéance ${fmtDate(e.deadline, 'short')}).` });
    if (e.status === 'planifiee' && e.date <= addDays(todayISO(), 2) && e.date >= todayISO()) out.push({ sev: 'warn', e, msg: `${evalShort(e)} ${levelById(e.level).roman} a lieu le ${fmtDate(e.date, 'dm')} et ses codes-barres ne sont pas générés.` });
  }
  return out;
}
/* État d'une cellule classe × matière pour une situation */
function cellState(cid, subj, trim, sit) {
  const e = Object.values(S.evals).find(x => x.subj === subj && x.trim === trim && x.sit === sit && x.classes.includes(cid));
  if (!e) return { s: 0, e: null };
  if (['desanonymisee', 'cloturee'].includes(e.status)) { const rows = resultsByClass(e)[cid] || []; const st = statsOf(rows.map(r => r.note)); return { s: 4, e, mean: st.mean }; }
  if (['composee', 'saisie'].includes(e.status)) { const rows = (e.placement?.list || []).filter(x => x[1] === cid); const done = rows.filter(x => markDone(e.marks?.[markKey(x[2])], e)).length; return { s: 3, e, pct: rows.length ? Math.round(done * 100 / rows.length) : 0 }; }
  if (e.status === 'preparee') return { s: 2, e };
  return { s: 1, e };
}
