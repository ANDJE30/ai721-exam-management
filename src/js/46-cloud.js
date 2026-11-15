/* =====================================================================
   Base en ligne Firebase : stockage partagé, comptes nominatifs, rôles
   ===================================================================== */
const CLOUD = { db: null, auth: null, user: null, profile: null, cfg: null };
const ROLES = {
  coordination: 'Coordination', prefet: 'Préfet des études', secretariat: 'Secrétariat des évaluations',
  lecture: 'Lecture seule', attente: 'En attente de validation', desactive: 'Compte désactivé'
};
const LIBS = {
  jspdf: 'vendor/jspdf.umd.min.js', autotable: 'vendor/jspdf.plugin.autotable.min.js', xlsx: 'vendor/xlsx.full.min.js',
  fbapp: 'vendor/firebase-app-compat.js', fbauth: 'vendor/firebase-auth-compat.js', fbstore: 'vendor/firebase-firestore-compat.js'
};
const _loaded = {};
function loadScript(src) {
  if (_loaded[src]) return _loaded[src];
  _loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete _loaded[src]; rej(new Error('Chargement impossible : ' + src + '. Vérifiez la connexion.')); }; document.head.appendChild(s); });
  return _loaded[src];
}
async function ensurePdfLibs() { if (!window.jspdf) await loadScript(LIBS.jspdf); if (!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable)) await loadScript(LIBS.autotable); }
async function ensureXlsx() { if (!window.XLSX) await loadScript(LIBS.xlsx); }

/* Firestore refuse les tableaux imbriqués : [[a,b],[c,d]] devient [{__a:[a,b]},{__a:[c,d]}] */
function fbEncode(v) {
  if (Array.isArray(v)) return v.map(x => Array.isArray(x) ? { __a: fbEncode(x) } : fbEncode(x));
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) if (x !== undefined) o[k] = fbEncode(x); return o; }
  return v;
}
function fbDecode(v) {
  if (Array.isArray(v)) return v.map(fbDecode);
  if (v && typeof v === 'object') { const ks = Object.keys(v); if (ks.length === 1 && ks[0] === '__a' && Array.isArray(v.__a)) return fbDecode(v.__a); const o = {}; for (const [k, x] of Object.entries(v)) o[k] = fbDecode(x); return o; }
  return v;
}
function fbErr(e) {
  const c = String((e && e.code) || '');
  if (c.includes('permission-denied')) return 'Votre profil ne permet pas cette opération.';
  if (c.includes('unavailable')) return 'Base en ligne injoignable : la modification partira au retour de la connexion.';
  if (c.includes('resource-exhausted')) return 'Quota gratuit du jour atteint. Réessayez demain.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-login')) return 'Adresse e-mail ou mot de passe incorrect.';
  if (c.includes('email-already-in-use')) return 'Un compte existe déjà avec cette adresse. Connectez-vous ou utilisez « Mot de passe oublié ».';
  if (c.includes('weak-password')) return 'Mot de passe trop court : 8 caractères au moins.';
  if (c.includes('invalid-email')) return 'Adresse e-mail invalide.';
  if (c.includes('too-many-requests')) return 'Trop de tentatives. Patientez quelques minutes.';
  if (c.includes('network-request-failed')) return 'Pas de connexion Internet.';
  if (c.includes('operation-not-allowed')) return 'La connexion par e-mail n’est pas activée dans le projet Firebase (Authentication › Sign-in method).';
  return (e && e.message) || String(e);
}
class CloudStore {
  constructor(db) { this.db = db; this.kind = 'cloud'; }
  /* N'attend pas l'accusé du serveur au-delà de 2,5 s : hors connexion, l'écriture reste en file et part plus tard */
  async _w(p, ms = 2500) {
    let err = null; const done = p.then(() => true, e => { err = e; return true; });
    const ok = await Promise.race([done, sleep(ms).then(() => false)]);
    if (err) { toast(fbErr(err), 'bad'); return false; }
    if (!ok) p.catch(e => toast(fbErr(e), 'bad'));
    return true;
  }
  async get(path) { try { const s = await this.db.doc(path).get(); return s.exists ? fbDecode(s.data()) : null; } catch (e) { return null; } }
  async set(path, data) { return this._w(this.db.doc(path).set(fbEncode(clone(data)))); }
  async update(path, partial) { return this._w(this.db.doc(path).set(fbEncode(clone(partial)), { merge: true })); }
  async delete(path) { return this._w(this.db.doc(path).delete()); }
  /* Écritures groupées : lots de 40 documents au plus, 8 Mo au plus par lot */
  async setMany(entries) {
    let b = this.db.batch(), n = 0, size = 0; const commits = [];
    for (const [p, d] of entries) { const enc = fbEncode(clone(d)); const sz = JSON.stringify(enc).length; if (n && (n >= 40 || size + sz > 8e6)) { commits.push(b.commit()); b = this.db.batch(); n = 0; size = 0; } b.set(this.db.doc(p), enc); n++; size += sz; }
    if (n) commits.push(b.commit());
    return this._w(Promise.all(commits), 180000);
  }
  async list(col) { try { const q = await this.db.collection(col).get(); return q.docs.map(d => ({ id: d.id, data: fbDecode(d.data()) })); } catch (e) { return []; } }
  subscribe(col, cb) { try { return this.db.collection(col).onSnapshot(snap => { if (snap.metadata.hasPendingWrites) return; cb(snap.docs.map(d => ({ id: d.id, data: fbDecode(d.data()) }))); }, e => console.warn(col, e)); } catch (e) { return () => { }; } }
}

function cloudConfig() { return window.ASTRA_FIREBASE_CONFIG || lsGet('fbcfg', null); }
function parseFirebaseConfig(txt) {
  const o = {}; String(txt || '').replace(/["']?(\w+)["']?\s*:\s*["']([^"']*)["']/g, (m, k, v) => { o[k] = v; return m; });
  if (!o.apiKey || !o.projectId || !o.appId) return null;
  if (!o.authDomain) o.authDomain = o.projectId + '.firebaseapp.com';
  return { apiKey: o.apiKey, authDomain: o.authDomain, projectId: o.projectId, storageBucket: o.storageBucket || '', messagingSenderId: o.messagingSenderId || '', appId: o.appId };
}
async function cloudBoot(cfg) {
  await loadScript(LIBS.fbapp); await Promise.all([loadScript(LIBS.fbauth), loadScript(LIBS.fbstore)]);
  const fb = window.firebase; fb.initializeApp(cfg);
  CLOUD.cfg = cfg; CLOUD.auth = fb.auth(); CLOUD.db = fb.firestore();
  try { CLOUD.db.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) { }
  if (window.ASTRA_EMULATOR) { CLOUD.auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); CLOUD.db.useEmulator('127.0.0.1', 8080); }
  else { try { await CLOUD.db.enablePersistence({ synchronizeTabs: true }); } catch (e) { } }
  return new Promise(res => {
    let first = true;
    CLOUD.auth.onAuthStateChanged(async u => {
      CLOUD.user = u;
      try { if (!u) { S.mode = 'cloud'; renderLogin(); } else await cloudEnter(u); } catch (e) { console.error(e); renderBlocked('Ouverture impossible : ' + fbErr(e)); }
      if (first) { first = false; res(); }
    });
  });
}
async function cloudEnter(u) {
  $('#app').innerHTML = splashHTML('Ouverture de votre espace…');
  const db = CLOUD.db; let prof = null;
  try { const s = await db.doc('users/' + u.uid).get(); prof = s.exists ? s.data() : null; } catch (e) { }
  if (!prof) {
    let owner = null; try { const o = await db.doc('cfg/owner').get(); owner = o.exists ? o.data() : null; } catch (e) { }
    const name = (lsGet('pendingName', '') || u.displayName || u.email.split('@')[0]).trim();
    if (!owner) {
      prof = { name, email: u.email, role: 'coordination', levels: [], createdAt: Date.now(), lastSeen: Date.now() };
      const b = db.batch(); b.set(db.doc('cfg/owner'), { uid: u.uid, email: u.email, at: Date.now() }); b.set(db.doc('users/' + u.uid), prof);
      try { await b.commit(); } catch (e) { return renderBlocked('Création du compte de coordination impossible : ' + fbErr(e) + ' Vérifiez que les règles de sécurité Firestore ont été publiées.'); }
      setTimeout(() => toast('Premier compte de cette base : vous êtes la coordination. Les comptes suivants attendront votre validation.', 'ok'), 600);
    } else {
      prof = { name, email: u.email, role: 'attente', levels: [], createdAt: Date.now(), lastSeen: Date.now() };
      try { await db.doc('users/' + u.uid).set(prof); } catch (e) { }
    }
  }
  CLOUD.profile = prof;
  if (prof.role === 'attente') return renderBlocked('Votre compte est créé. La coordination doit maintenant lui attribuer un rôle ; rechargez la page une fois prévenu.');
  if (prof.role === 'desactive') return renderBlocked('Ce compte est désactivé. Adressez-vous à la coordination du second cycle.');
  db.doc('users/' + u.uid).set({ lastSeen: Date.now(), email: u.email }, { merge: true }).catch(() => { });
  S.store = new CloudStore(db); S.mode = 'cloud';
  S.ui.role = prof.role === 'coordination' ? 'coordination' : 'secretariat'; S.ui.unlocked = prof.role === 'coordination';
  S.caps.userId = u.uid; S.caps.userName = prof.name || u.email;
  if (prof.role === 'prefet' && prof.levels?.length && (!S.ui.level || !prof.levels.includes(S.ui.level))) S.ui.level = prof.levels[0];
  await loadAll(); subscribeShared();
  if (!S.ui.sit) S.ui.sit = S.settings.sitCourante || 1;
  route();
}
const canWriteRole = () => S.mode !== 'cloud' || ['coordination', 'prefet', 'secretariat'].includes(CLOUD.profile?.role);
function splashHTML(msg) { return `<div class="home"><section class="hero" style="padding-bottom:60px"><div class="in-hero"><div class="bar-top"><div class="inst">${logoHTML()}<div><b>${esc(S.settings.etab)}</b><span>${esc(S.settings.tutelle)}</span></div></div></div><div class="ttl"><div class="eyebrow">Secrétariat des évaluations</div><h1>AI721 <em>ASTRA LUZ</em> 2.0</h1><p>${esc(msg)}</p></div></div></section></div>`; }
function renderBlocked(msg) {
  $('#app').innerHTML = `<div class="home"><section class="hero" style="padding-bottom:40px"><div class="in-hero"><div class="bar-top"><div class="inst">${logoHTML()}<div><b>${esc(S.settings.etab)}</b><span>AI721 ASTRA LUZ 2.0</span></div></div></div></div></section>
    <div class="prefs" style="margin-top:-20px;grid-template-columns:minmax(0,560px);justify-content:center"><div class="panel stack"><h2>Accès en attente</h2><p>${esc(msg)}</p><p class="small muted">Compte : ${esc(CLOUD.user?.email || '')}</p><div class="row"><button class="btn" id="bl-reload">${ic('refresh')}Recharger</button><button class="btn ghost" id="bl-out">Se déconnecter</button></div></div></div></div>`;
  $('#bl-reload').onclick = () => location.reload();
  $('#bl-out').onclick = () => CLOUD.auth.signOut();
}
function renderLogin() {
  const st = S.settings;
  $('#app').innerHTML = `<div class="home">
    <section class="hero" style="padding-bottom:110px"><canvas id="sky" aria-hidden="true"></canvas><div class="in-hero">
      <div class="bar-top"><div class="inst">${logoHTML()}<div><b>${esc(st.etab)}</b><span>${esc(st.tutelle)} · ${esc(st.ville)}</span></div></div><span class="modechip">Base en ligne sécurisée</span></div>
      <div class="ttl"><div class="eyebrow">Secrétariat des évaluations · second cycle · année scolaire ${esc(st.annee)}</div><h1>AI721 <em>ASTRA LUZ</em> 2.0</h1><p>Connectez-vous avec le compte nominatif que la coordination a validé. Chaque action est enregistrée sous votre nom au journal d’audit.</p></div>
    </div></section>
    <div class="prefs" style="grid-template-columns:minmax(0,440px);justify-content:center">
      <form class="panel stack" id="lg-form" autocomplete="on" style="padding:22px">
        <div class="tabs" role="tablist"><button type="button" class="on" data-lt="in">Se connecter</button><button type="button" data-lt="up">Créer un compte</button></div>
        <label class="f" id="lg-name-w" hidden>Nom et prénom<input class="in" id="lg-name" autocomplete="name" placeholder="M. NOM Prénom"></label>
        <label class="f">Adresse e-mail<input class="in" id="lg-email" type="email" autocomplete="username" required></label>
        <label class="f">Mot de passe<input class="in" id="lg-pw" type="password" autocomplete="current-password" required minlength="8"></label>
        <p class="small" id="lg-err" style="color:var(--bad);min-height:1.2em"></p>
        <button class="btn primary" id="lg-go" type="submit" style="justify-content:center">${ic('unlock')}Se connecter</button>
        <div class="row between small"><button type="button" class="btn ghost sm" id="lg-reset">Mot de passe oublié</button><button type="button" class="btn ghost sm" id="lg-demo">${ic('star')}Démonstration sans compte</button></div>
        <p class="tiny muted">Un nouveau compte reste en attente jusqu’à ce que la coordination lui attribue un rôle. Le tout premier compte créé sur une base vide devient le compte de coordination.</p>
      </form></div></div>`;
  drawSky();
  let mode = 'in'; const err = m => $('#lg-err').textContent = m || '';
  $$('[data-lt]').forEach(b => b.onclick = () => { mode = b.dataset.lt; $$('[data-lt]').forEach(x => x.classList.toggle('on', x === b)); $('#lg-name-w').hidden = mode !== 'up'; $('#lg-go').innerHTML = mode === 'up' ? `${ic('plus')}Créer mon compte` : `${ic('unlock')}Se connecter`; $('#lg-pw').autocomplete = mode === 'up' ? 'new-password' : 'current-password'; err(''); });
  $('#lg-form').onsubmit = async ev => {
    ev.preventDefault(); err(''); const email = $('#lg-email').value.trim(), pw = $('#lg-pw').value;
    const btn = $('#lg-go'); btn.disabled = true;
    try {
      if (mode === 'up') { const name = $('#lg-name').value.trim(); if (name.length < 3) { err('Indiquez votre nom et votre prénom.'); btn.disabled = false; return; } if (pw.length < 8) { err('Mot de passe trop court : 8 caractères au moins.'); btn.disabled = false; return; } lsSet('pendingName', name); const r = await CLOUD.auth.createUserWithEmailAndPassword(email, pw); try { await r.user.updateProfile({ displayName: name }); } catch (e) { } }
      else await CLOUD.auth.signInWithEmailAndPassword(email, pw);
    } catch (e) { err(fbErr(e)); btn.disabled = false; }
  };
  $('#lg-reset').onclick = async () => { const email = $('#lg-email').value.trim(); if (!email) return err('Saisissez d’abord votre adresse e-mail.'); try { await CLOUD.auth.sendPasswordResetEmail(email); toast('Lien de réinitialisation envoyé à ' + email + '. Pensez aux courriers indésirables.', 'ok'); } catch (e) { err(fbErr(e)); } };
  $('#lg-demo').onclick = async () => { lsSet('demo', true); S.cloudDemo = true; await switchMode('demo'); };
}
function userMenu() {
  const p = CLOUD.profile || {};
  openModal({ title: p.name || 'Mon compte', body: `<div class="copy-card"><div><span>Adresse</span><b style="font-size:13px">${esc(CLOUD.user?.email || '')}</b></div><div><span>Rôle</span><b style="font-size:13px">${esc(ROLES[p.role] || p.role)}</b></div>${p.levels?.length ? `<div><span>Préfecture</span><b style="font-size:13px">${p.levels.map(l => levelById(l)?.nom).join(', ')}</b></div>` : ''}</div><p class="small muted">Base en ligne : projet ${esc(CLOUD.cfg?.projectId || '')}.</p>`,
    actions: [{ label: 'Changer mon mot de passe', onClick: async () => { try { await CLOUD.auth.sendPasswordResetEmail(CLOUD.user.email); toast('Lien envoyé à ' + CLOUD.user.email + '.', 'ok'); } catch (e) { toast(fbErr(e), 'bad'); } return false; } }, { label: `${ic('x')}Se déconnecter`, cls: 'danger', onClick: async c => { c(); await CLOUD.auth.signOut(); location.hash = ''; } }] });
}

/* ---------- Écran : utilisateurs et rôles (coordination) ---------- */
V.utilisateurs = el => {
  if (S.mode !== 'cloud') { el.innerHTML = pageHead('Utilisateurs et rôles') + '<div class="panel empty"><h3>Comptes disponibles avec la base en ligne</h3><p>Connectez une base Firebase dans Paramètres pour gérer des comptes nominatifs.</p></div>'; return; }
  if (CLOUD.profile?.role !== 'coordination') { el.innerHTML = pageHead('Utilisateurs et rôles') + '<div class="panel empty"><h3>Écran réservé à la coordination</h3></div>'; return; }
  el.innerHTML = pageHead('Utilisateurs et rôles', 'Chaque personne crée son compte depuis la page de connexion. Le compte reste en attente jusqu’à ce que vous lui attribuiez un rôle ici. Les droits sont vérifiés par le serveur, pas seulement par l’écran.') +
    `<div class="tw"><table class="t"><thead><tr><th>Nom</th><th>Adresse e-mail</th><th>Rôle</th><th>Préfecture(s)</th><th>Dernière connexion</th><th></th></tr></thead><tbody id="us-body"><tr><td colspan="6"><span class="spin"></span></td></tr></tbody></table></div>
    <div class="panel"><header><h3>Ce que permet chaque rôle</h3></header><div class="tw"><table class="t"><thead><tr><th>Rôle</th><th>Droits</th></tr></thead><tbody>
      <tr><td><b>Coordination</b></td><td>Tout, dont la levée d’anonymat, les corrections après levée, la clôture, les suppressions, la restauration, les paramètres et la gestion des comptes.</td></tr>
      <tr><td><b>Préfet des études</b></td><td>Tout le travail du secrétariat, la modification des paramètres de l’établissement ; ouvre par défaut sa préfecture.</td></tr>
      <tr><td><b>Secrétariat des évaluations</b></td><td>Imports, planning, répartition, éditions, absences, saisie des notes sous code.</td></tr>
      <tr><td><b>Lecture seule</b></td><td>Consultation des plannings et des résultats désanonymisés, éditions PDF ; aucune écriture.</td></tr>
      <tr><td><b>Compte désactivé</b></td><td>Plus aucun accès ; l’historique du journal est conservé.</td></tr></tbody></table></div></div>`;
  (async () => {
    let users = []; try { const q = await CLOUD.db.collection('users').get(); users = q.docs.map(d => ({ uid: d.id, ...d.data() })); } catch (e) { toast(fbErr(e), 'bad'); }
    users.sort((a, b) => ((a.role === 'attente') ? -1 : 0) - ((b.role === 'attente') ? -1 : 0) || String(a.name).localeCompare(String(b.name), 'fr'));
    const body = $('#us-body', el); if (!body) return;
    body.innerHTML = users.map(u => `<tr data-uid="${esc(u.uid)}"><td><b>${esc(u.name || '')}</b>${u.uid === CLOUD.user.uid ? ' <span class="pill gold plain">vous</span>' : ''}${u.role === 'attente' ? ' <span class="pill warn">à valider</span>' : ''}</td><td class="small">${esc(u.email || '')}</td><td><select class="in us-role" ${u.uid === CLOUD.user.uid ? 'disabled' : ''}>${optList(Object.entries(ROLES), u.role)}</select></td><td><div class="row" style="gap:6px">${LEVELS.map(l => `<label class="check small"><input type="checkbox" class="us-lv" value="${l.id}" ${u.levels?.includes(l.id) ? 'checked' : ''}> ${l.roman}</label>`).join('')}</div></td><td class="small">${fmtDT(u.lastSeen)}</td><td class="r"><button class="btn sm primary us-save">Enregistrer</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Aucun compte.</td></tr>';
    $$('.us-save', body).forEach(b => b.onclick = async () => { const tr = b.closest('tr'); const uid = tr.dataset.uid; const role = $('.us-role', tr).value; const levels = $$('.us-lv:checked', tr).map(i => i.value); try { await CLOUD.db.doc('users/' + uid).set({ role, levels }, { merge: true }); audit('Comptes', `${$('td b', tr).textContent} : rôle ${ROLES[role]}${levels.length ? ' (' + levels.join(', ') + ')' : ''}`); toast('Compte mis à jour.', 'ok'); } catch (e) { toast(fbErr(e), 'bad'); } });
  })();
};

/* ---------- Paramètres : connexion à la base en ligne ---------- */
function cloudPanelHTML() {
  if (S.mode === 'shared' || (!window.ASTRA_WEB && S.mode !== 'cloud')) return '';
  if (S.mode === 'cloud') return `<div class="panel"><header><h3>Base en ligne</h3><span class="pill ok">connectée</span></header><div class="fgrid"><label class="f">Projet Firebase<input class="in mono" value="${esc(CLOUD.cfg?.projectId || '')}" disabled></label><label class="f">Compte<input class="in" value="${esc(CLOUD.user?.email || '')}" disabled></label><label class="f">Rôle<input class="in" value="${esc(ROLES[CLOUD.profile?.role] || '')}" disabled></label></div><p class="small muted" style="margin-top:8px">Données hébergées par Google Firebase (offre gratuite Spark), synchronisées en temps réel et conservées sur chaque poste pour le travail hors connexion. ${CLOUD.profile?.role === 'coordination' ? 'Les comptes se gèrent dans « Utilisateurs et rôles ».' : ''}</p></div>`;
  const ls = lsGet('fbcfg', null);
  return `<div class="panel"><header><h3>Base en ligne (Firebase)</h3><span class="pill ${ls ? 'info' : 'neutral'}">${ls ? 'configurée sur ce poste' : 'non connectée'}</span></header><div class="stack">
    <p class="small">Pour partager les données entre tous les postes avec des comptes nominatifs, créez un projet Firebase gratuit (manuel, chapitre « Mise en ligne »), puis collez ici le bloc <span class="mono">firebaseConfig</span> affiché par la console Firebase.</p>
    <textarea class="in mono" id="fb-cfg" rows="7" placeholder="const firebaseConfig = {\n  apiKey: &quot;…&quot;,\n  authDomain: &quot;…&quot;,\n  projectId: &quot;…&quot;,\n  appId: &quot;…&quot;\n};">${ls ? esc(JSON.stringify(ls, null, 2)) : ''}</textarea>
    <div class="row"><button class="btn primary" data-fb="save">${ic('check')}Connecter ce poste à la base en ligne</button>${ls ? `<button class="btn ghost" data-fb="clear">Déconnecter ce poste</button>` : ''}</div>
    <p class="tiny muted">Avant de basculer, téléchargez une sauvegarde de la base locale : après la création du compte de coordination, restaurez-la dans la base en ligne.</p></div></div>`;
}
function bindCloudPanel(el) {
  const b = $('[data-fb=save]', el); if (b) b.onclick = () => { const c = parseFirebaseConfig($('#fb-cfg', el).value); if (!c) return toast('Configuration incomplète : apiKey, projectId et appId sont attendus.', 'bad'); lsSet('fbcfg', c); lsSet('demo', false); toast('Configuration enregistrée. Rechargement…', 'ok'); setTimeout(() => { location.hash = ''; location.reload(); }, 800); };
  const c = $('[data-fb=clear]', el); if (c) c.onclick = () => { try { localStorage.removeItem('astraluz:fbcfg'); } catch (e) { } location.reload(); };
}
