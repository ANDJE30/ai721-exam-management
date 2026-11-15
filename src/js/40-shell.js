/* =====================================================================
   Coquille de l'application : accueil, navigation, barre supérieure
   ===================================================================== */
const NAV = [
  { grp: 'Pilotage', items: [['tableau', 'Tableau de bord', 'dash'], ['planning', 'Planning des évaluations', 'cal']] },
  { grp: 'Référentiels', items: [['eleves', 'Élèves et classes', 'users'], ['matieres', 'Matières et enseignants', 'book'], ['salles', 'Salles de composition', 'door']] },
  { grp: 'Épreuves', items: [['epreuves', 'Préparation et codes-barres', 'barcode'], ['saisie', 'Saisie anonyme des notes', 'scan'], ['resultats', 'Désanonymat et résultats', 'unlock']] },
  { grp: 'Analyse et éditions', items: [['statistiques', 'Statistiques', 'chart'], ['editions', 'Centre d’impression', 'print']] },
  { grp: 'Système', items: [['journal', 'Journal d’audit', 'log'], ['utilisateurs', 'Utilisateurs et rôles', 'user'], ['parametres', 'Paramètres et sauvegarde', 'gear']] }
];
const VIEW_IDS = NAV.flatMap(g => g.items.map(i => i[0]));
const V = {}; // fonctions de rendu des vues
let starAnim = null;

function curSit() { return +(S.ui.sit || S.settings.sitCourante || 1); }
function curTrim() { return trimOfSit(curSit()); }
function levelsInScope() { return S.ui.level && S.ui.level !== 'all' ? [S.ui.level] : LEVELS.map(l => l.id); }
const scopeLabel = () => S.ui.level === 'all' ? 'Coordination du second cycle' : (levelById(S.ui.level)?.pref || '');
const modeLabel = () => ({ shared: 'Base partagée', cloud: 'Base en ligne', local: 'Base locale (ce navigateur)', demo: 'Démonstration' })[S.mode];

function go(view) { if (location.hash !== '#' + view) location.hash = view; else render(); }
function route() {
  const h = (location.hash || '').replace('#', '');
  if (h === 'accueil' || !h || !S.ui.level) { S.ui.view = 'accueil'; }
  else if (VIEW_IDS.includes(h)) S.ui.view = h;
  else S.ui.view = 'tableau';
  render();
}
function render() {
  if (starAnim) { cancelAnimationFrame(starAnim); starAnim = null; }
  const app = $('#app');
  if (S.ui.view === 'accueil') { app.innerHTML = renderHome(); bindHome(); return; }
  if (!$('.shell', app)) { app.innerHTML = renderShellHTML(); }
  renderSide(); renderTop();
  const host = $('#view'); const el = document.createElement('div'); el.className = 'stack'; el.style.gap = '16px';
  host.replaceChildren(el);
  try { (V[S.ui.view] || V.tableau)(el); } catch (e) { console.error(e); el.innerHTML = `<div class="callout bad">Erreur d’affichage : ${esc(e.message)}</div>`; }
  $('.side')?.classList.remove('open'); $('.scrim')?.remove();
  window.scrollTo(0, 0);
}
const rerender = debounce(() => { if (S.ui.view !== 'accueil' && !S.ui.busyForm) { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 250);

/* ---------- Accueil ---------- */
function homeCounts(lv) {
  const cls = classesOf(lv); const st = cls.reduce((a, c) => a + studentsOf(c).length, 0);
  const evs = evalsOf(lv); const up = evs.filter(e => e.date >= todayISO() && !['desanonymisee', 'cloturee'].includes(e.status)).length;
  return { cls, st, evs: evs.length, up };
}
function renderHome() {
  const st = S.settings;
  const cards = LEVELS.map(l => { const c = homeCounts(l.id); return `
    <button class="pref" data-level="${l.id}">
      <div class="row between"><span class="num-l">${l.roman}</span><span class="eyebrow">${esc(st.prefets?.[l.id] || 'Préfet à renseigner')}</span></div>
      <h2>${l.pref}</h2>
      <div class="cls">${c.cls.map(x => `<span>${esc(x.nom)}</span>`).join('') || '<span>aucune classe</span>'}</div>
      <div class="stats"><div><b>${c.cls.length}</b><span>classes</span></div><div><b>${c.st}</b><span>élèves</span></div><div><b>${c.up}</b><span>épreuves à venir</span></div></div>
      <div class="go">Ouvrir le tableau de bord ${ic('dash')}</div>
    </button>`; }).join('');
  const all = LEVELS.map(l => homeCounts(l.id));
  const coord = `<button class="pref coord" data-level="all"><div class="row between"><span class="num-l">2<sup style="font-size:.45em">nd</sup></span><span class="eyebrow">${esc(st.coordo)}</span></div><h2>Coordination du second cycle</h2><p class="muted small">Vue consolidée des trois préfectures : planning croisé, conflits de salles, avancement de la saisie et désanonymats en attente.</p><div class="stats"><div><b>${all.reduce((a, c) => a + c.cls.length, 0)}</b><span>classes</span></div><div><b>${all.reduce((a, c) => a + c.st, 0)}</b><span>élèves</span></div><div><b>${Object.keys(S.evals).length}</b><span>épreuves</span></div></div><div class="go">Vue de coordination ${ic('dash')}</div></button>`;
  const upcoming = Object.values(S.evals).filter(e => e.date >= todayISO() && e.date <= addDays(todayISO(), 10)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 7);
  const init = !S.initialized ? `<div class="callout warn"><b>Base vide.</b> Initialisez la structure 2026-2027 (29 classes réparties en trois préfectures, catalogue de ${DEFAULT_SUBJECTS.length} matières) pour commencer, ou explorez l’application avec des données fictives.</div><div class="row"><button class="btn primary" data-act="init">${ic('check')}Initialiser la structure 2026-2027</button></div>` : '';
  return `<div class="home">
    ${S.mode === 'demo' ? '<div class="demo-band">MODE DÉMONSTRATION : toutes les données affichées sont fictives et restent dans ce navigateur</div>' : ''}
    <section class="hero"><canvas id="sky" aria-hidden="true"></canvas><div class="in-hero">
      <div class="bar-top"><div class="inst">${logoHTML()}<div><b>${esc(st.etab)}</b><span>${esc(st.tutelle)} · ${esc(st.ville)}</span></div></div><span class="modechip">${esc(modeLabel())}</span></div>
      <div class="ttl"><div class="eyebrow">Secrétariat des évaluations · second cycle · année scolaire ${esc(st.annee)}</div>
        <h1>AI721 <em>ASTRA LUZ</em> 2.0</h1>
        <p>Planification des épreuves, répartition des élèves en salles, anonymat des copies par code-barres, saisie des notes à la douchette et levée d’anonymat contrôlée, de la situation 1 à la situation 6.</p></div>
      <div class="codeline" aria-label="Structure du code-barres"><span><b>1</b> niveau</span><span><b>03</b> classe</span><span><b>03</b> matière</span><span><b>12</b> trimestre · situation</span><span><b>047</b> table</span><span><b>38</b> clé</span></div>
    </div></section>
    <div class="prefs">${cards}${coord}</div>
    <div class="home-foot">
      <div class="panel"><header><h3>Circuit d’une épreuve</h3></header><div class="flow">
        <div><b>1. Planifier</b><span>Date, créneau, classes</span></div><div><b>2. Répartir</b><span>Salles et numéros de table</span></div><div><b>3. Imprimer</b><span>Listes, étiquettes, bordereaux</span></div><div><b>4. Saisir</b><span>Notes lues au code-barres</span></div><div><b>5. Lever l’anonymat</b><span>PIN de la coordination</span></div><div><b>6. Publier</b><span>Relevés, statistiques</span></div></div></div>
      <div class="panel"><header><h3>Dans les dix prochains jours</h3></header>${upcoming.length ? `<div class="timeline">${upcoming.map(e => `<div class="it"><span class="d">${fmtDate(e.date, 'dm')}<br>${e.start}</span><span><b>${esc(subjByCode(e.subj).nom)}</b> · ${levelById(e.level).nom}<br><span class="small muted">${esc(evalClassNames(e))}</span></span></div>`).join('')}</div>` : '<p class="muted">Aucune épreuve planifiée sur cette période.</p>'}</div>
      <div class="panel"><header><h3>Base de données</h3><span class="pill ${['shared', 'cloud'].includes(S.mode) ? 'ok' : S.mode === 'demo' ? 'gold' : 'info'}">${esc(modeLabel())}</span></header><div class="stack">
        <p class="small muted">${S.mode === 'cloud' ? 'Les données sont enregistrées dans la base en ligne Firebase du collège, partagées en temps réel et protégées par des comptes nominatifs.' : S.mode === 'shared' ? 'Les données sont enregistrées sur claude.ai et partagées avec les membres du secrétariat qui ont accès à cette application.' : S.mode === 'demo' ? 'Jeu fictif de 29 classes et environ 1 400 élèves pour la formation. Rien n’est écrit dans la base réelle.' : 'Les données restent dans ce navigateur. Faites une sauvegarde régulière depuis Paramètres.'}</p>
        ${init}
        <div class="row">${S.mode === 'demo' ? `<button class="btn" data-act="leave-demo">${ic('x')}Quitter la démonstration</button>` : `<button class="btn" data-act="demo">${ic('star')}Explorer avec des données fictives</button>`}</div>
      </div></div>
    </div></div>`;
}
function bindHome() {
  $$('.pref').forEach(b => b.onclick = () => { S.ui.level = b.dataset.level; lsSet('level', S.ui.level); go('tableau'); if (location.hash === '#tableau') route(); });
  $$('[data-act]').forEach(b => b.onclick = async () => {
    const a = b.dataset.act;
    if (a === 'init') await withBusy('Création de la structure…', async () => { await initStructure(); toast('Structure 2026-2027 créée.', 'ok'); render(); });
    if (a === 'demo') await switchMode('demo');
    if (a === 'leave-demo') await switchMode('real');
  });
  drawSky();
}
function drawSky() {
  const cv = $('#sky'); if (!cv) return; const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
  size(); const rnd = seededRandom(721);
  const stars = Array.from({ length: 150 }, () => ({ x: rnd(), y: rnd(), r: rnd() * 1.3 + .25, p: rnd() * 6.28, s: .4 + rnd() * 1.2 }));
  const cons = [[.62, .18], [.68, .3], [.75, .26], [.81, .38], [.88, .33], [.84, .52], [.92, .6]];
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = t => {
    if (!document.body.contains(cv)) return;
    if (cv.width !== cv.clientWidth * dpr) size();
    const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(231,190,90,.28)'; ctx.lineWidth = 1 * dpr; ctx.beginPath(); cons.forEach(([x, y], i) => i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)); ctx.stroke();
    cons.forEach(([x, y]) => { ctx.fillStyle = 'rgba(231,190,90,.9)'; ctx.beginPath(); ctx.arc(x * W, y * H, 2.2 * dpr, 0, 6.29); ctx.fill(); });
    stars.forEach(s => { const a = reduce ? .7 : .45 + .45 * Math.sin(s.p + t / 1000 * s.s); ctx.fillStyle = `rgba(230,236,255,${a})`; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r * dpr, 0, 6.29); ctx.fill(); });
    if (!reduce) starAnim = requestAnimationFrame(frame);
  };
  frame(0);
}

/* ---------- Coquille ---------- */
function renderShellHTML() {
  return `${S.mode === 'demo' ? '<div class="demo-band">MODE DÉMONSTRATION : données fictives, sans effet sur la base réelle</div>' : ''}
  <div class="shell"><aside class="side" id="side"></aside><div class="main"><div class="top" id="top"></div><main class="content" id="view"></main></div></div>`;
}
function renderSide() {
  const side = $('#side'); if (!side) return;
  const lv = S.ui.level; const evs = Object.values(S.evals).filter(e => lv === 'all' || e.level === lv);
  const cnt = { saisie: evs.filter(e => ['composee', 'saisie'].includes(e.status)).length, resultats: evs.filter(e => ['composee', 'saisie'].includes(e.status) && progressOf(e).missing === 0 && !e.anon?.lifted).length, epreuves: evs.filter(e => e.status === 'planifiee' && e.date >= todayISO()).length };
  side.innerHTML = `<div class="brand" data-home title="Retour à l’accueil">${logoHTML()}<div><b>ASTRA LUZ 2.0</b><span>${esc(scopeLabel())}</span></div></div>
    <nav aria-label="Navigation principale">${NAV.map(g => `<div class="grp">${g.grp}</div>${g.items.filter(([id]) => id !== 'utilisateurs' || (S.mode === 'cloud' && CLOUD.profile?.role === 'coordination')).map(([id, l, i]) => `<a href="#${id}" class="${S.ui.view === id ? 'on' : ''}">${ic(i)}<span>${l}</span>${cnt[id] ? `<span class="cnt">${cnt[id]}</span>` : ''}</a>`).join('')}`).join('')}</nav>
    <div class="foot">${esc(S.settings.sigle)} · ${esc(S.settings.annee)}<br>${APP.name} · v${APP.version}</div>`;
  $('[data-home]', side).onclick = () => go('accueil');
}
function renderTop() {
  const top = $('#top'); if (!top) return;
  top.innerHTML = `<button class="btn ghost menu-btn" data-menu aria-label="Menu">${ic('menu')}</button>
    <div class="lvl" role="tablist" aria-label="Préfecture">${LEVELS.map(l => `<button role="tab" data-lv="${l.id}" class="${S.ui.level === l.id ? 'on' : ''}" title="${l.pref}">${l.roman}</button>`).join('')}<button role="tab" data-lv="all" class="${S.ui.level === 'all' ? 'on' : ''}" title="Coordination du second cycle">Coord.</button></div>
    <select class="in" id="sit-sel" style="width:auto" aria-label="Situation courante">${sitOpts(curSit())}</select>
    <div class="search">${ic('search')}<input class="in" id="q" placeholder="Élève, matricule ou code-barres" autocomplete="off"><div id="q-res" class="panel" hidden style="position:absolute;top:110%;left:0;right:0;z-index:20;padding:6px;max-height:60vh;overflow:auto"></div></div>
    <span class="spacer"></span>
    <span class="pill ${['shared', 'cloud'].includes(S.mode) ? 'ok' : S.mode === 'demo' ? 'gold' : 'info'}" title="Stockage des données">${esc(modeLabel())}</span>
    ${S.mode === 'cloud' ? `<button class="btn sm ${S.ui.role === 'coordination' ? 'gold' : ''}" data-user title="Mon compte">${ic('user')}${esc((CLOUD.profile?.name || '').split(' ').slice(0, 3).join(' ') || 'Mon compte')} · ${esc((ROLES[CLOUD.profile?.role] || '').split(' ')[0])}</button>` : `<button class="btn sm ${S.ui.role === 'coordination' ? 'gold' : ''}" data-role title="Profil de session">${ic(S.ui.role === 'coordination' ? 'unlock' : 'lock')}${S.ui.role === 'coordination' ? 'Coordination' : 'Secrétariat'}</button>`}`;
  $$('[data-lv]', top).forEach(b => b.onclick = () => { S.ui.level = b.dataset.lv; lsSet('level', S.ui.level); render(); });
  $('#sit-sel', top).onchange = ev => { S.ui.sit = +ev.target.value; lsSet('sit', S.ui.sit); render(); };
  $('[data-menu]', top).onclick = () => { const sd = $('#side'); sd.classList.add('open'); const sc = document.createElement('div'); sc.className = 'scrim'; sc.onclick = () => { sd.classList.remove('open'); sc.remove(); }; document.body.appendChild(sc); };
  if ($('[data-user]', top)) $('[data-user]', top).onclick = userMenu;
  if ($('[data-role]', top)) $('[data-role]', top).onclick = async () => { if (S.ui.role === 'coordination') { S.ui.role = 'secretariat'; S.ui.unlocked = false; toast('Profil Secrétariat : les actions sensibles sont verrouillées.'); render(); } else { if (await requireCoord('Passer en profil Coordination (levée d’anonymat, corrections, suppressions).')) render(); } };
  bindSearch($('#q', top), $('#q-res', top));
}
function bindSearch(inp, res) {
  const run = () => {
    const q = inp.value.trim(); if (q.length < 2) { res.hidden = true; return; }
    const digits = scanDigits(q);
    let html = '';
    if (digits.length >= 10 && (/^[\d\s]+$/.test(q) || !/\d/.test(q))) html += `<button class="btn ghost" style="width:100%;justify-content:flex-start" data-code="${digits}">${ic('barcode')}Décoder le code ${esc(fmtCode(digits) || digits)}</button>`;
    const nq = norm(q); const out = [];
    for (const c of Object.values(S.classes)) for (const s of c.students || []) { if (norm(fullName(s)).includes(nq) || norm(s.mat).includes(nq)) out.push({ s, c }); if (out.length > 14) break; }
    html += out.map(({ s, c }) => `<button class="btn ghost" style="width:100%;justify-content:flex-start" data-sid="${s.id}">${ic('user')}<span><b>${esc(fullName(s))}</b> <span class="muted small">${esc(c.nom)} · ${esc(s.mat || '')}</span></span></button>`).join('');
    res.innerHTML = html || '<p class="muted small" style="padding:6px">Aucun résultat.</p>'; res.hidden = false;
    $$('[data-sid]', res).forEach(b => b.onclick = () => { res.hidden = true; inp.value = ''; showStudent(b.dataset.sid); });
    $$('[data-code]', res).forEach(b => b.onclick = () => { res.hidden = true; inp.value = ''; showDecoder(b.dataset.code); });
  };
  inp.addEventListener('input', debounce(run, 120));
  inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const d = scanDigits(inp.value); if (d.length === 12) { res.hidden = true; inp.value = ''; showDecoder(d); } else run(); } if (ev.key === 'Escape') res.hidden = true; });
  document.addEventListener('click', ev => { if (!res.contains(ev.target) && ev.target !== inp) res.hidden = true; });
}
function showDecoder(code) {
  const L = locateCode(code); const p = L.p;
  const showName = L.e && (L.e.anon?.lifted || S.ui.role === 'coordination');
  const m = L.e ? L.e.marks?.[markKey(p.TTT)] : null;
  openModal({ title: 'Décodage d’un code-barres', body: `
    <div class="bc" style="align-self:center">${p.digits.length === 12 ? bcSvg(p.digits) : ''}</div>
    ${p.ok ? '<div class="callout ok">Clé de contrôle valide.</div>' : `<div class="callout bad">${esc(p.err)}</div>`}
    <div class="copy-card"><div><span>Niveau</span><b>${esc(p.level?.nom || p.N || '?')}</b></div><div><span>Classe</span><b>${esc(p.cls?.nom || p.CC || '?')}</b></div><div><span>Matière</span><b>${esc(p.subject?.abbr || p.MM || '?')}</b></div><div><span>Trim. / sit.</span><b>T${p.T ?? '?'} · S${p.S ?? '?'}</b></div><div><span>Table</span><b>${p.TTT !== undefined ? pad(p.TTT, 3) : '?'}</b></div><div><span>Clé</span><b>${p.KK !== undefined ? pad(p.KK, 2) : '?'}</b></div></div>
    ${L.e ? `<div class="stack small"><div>Épreuve : <b>${esc(evalLabel(L.e))}</b> du ${fmtDate(L.e.date)} · ${statusPill(L.e.status)}</div><div>Salle : <b>${esc(roomOfTable(L.e, p.TTT)?.nom || '—')}</b></div><div>Note enregistrée : <b>${m ? (m.st && m.st !== 'P' ? m.st : fmtNote(finalMark(m, L.e)) || 'en attente') : 'aucune'}</b></div><div>Élève : <b>${showName ? esc(L.entry[3]) : 'masqué tant que l’anonymat n’est pas levé'}</b></div></div>` : (p.ok ? `<div class="callout warn">${esc(L.err || '')}</div>` : '')}`,
    actions: [{ label: 'Fermer' }] });
}
function showStudent(sid) {
  const fs = findStudent(sid); if (!fs) return;
  const evs = sortEvals(Object.values(S.evals).filter(e => e.placement?.list.some(x => x[0] === sid)));
  const rows = evs.map(e => { const x = e.placement.list.find(z => z[0] === sid); const m = e.marks?.[markKey(x[2])]; const lifted = e.anon?.lifted; const f = finalMark(m, e);
    return `<tr><td>${fmtDate(e.date, 'short')}</td><td>T${e.trim} S${e.sit}</td><td>${esc(subjByCode(e.subj).nom)}</td><td class="mono">${S.ui.role === 'coordination' || lifted ? esc(fmtCode(codeOf(e, x[1], x[2]))) : '•••'}</td><td class="r"><b>${lifted ? (f === null ? esc(m?.st || '—') : fmtNote(f)) : '<span class="muted">anonyme</span>'}</b></td></tr>`; }).join('');
  openModal({ title: fullName(fs.st), wide: true, body: `
    <div class="copy-card"><div><span>Classe</span><b>${esc(fs.cls.nom)}</b></div><div><span>Matricule</span><b>${esc(fs.st.mat || '—')}</b></div><div><span>Sexe</span><b>${esc(fs.st.sexe || '—')}</b></div><div><span>Naissance</span><b>${fs.st.dn ? fmtDate(fs.st.dn, 'short') : '—'}</b></div><div><span>Statut</span><b>${esc(fs.st.statut || '—')}</b></div></div>
    <div class="tw"><table class="t"><thead><tr><th>Date</th><th>T / S</th><th>Matière</th><th>Code</th><th class="r">Note / 20</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="muted">Aucune épreuve pour cet élève.</td></tr>'}</tbody></table></div>`,
    actions: [{ label: `${ic('print')}Fiche de suivi PDF`, cls: 'primary', onClick: () => { runPdf(`fiche-suivi-${fileSafe(fullName(fs.st))}.pdf`, 'Fiche de suivi', doc => addFicheEleve(doc, sid)); return false; } }, { label: 'Fermer' }] });
}
const pageHead = (title, sub, actions = '') => `<div class="pagehead"><div class="t"><div class="eyebrow">${esc(scopeLabel())} · ${tsLabel(curTrim(), curSit())}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;
function levelPicker(id = 'lv-pick') { return S.ui.level === 'all' ? `<label class="f">Niveau<select class="in" id="${id}">${levelOpts(LEVELS[0].id)}</select></label>` : ''; }
const pickedLevel = (root, id = 'lv-pick') => S.ui.level === 'all' ? ($('#' + id, root)?.value || LEVELS[0].id) : S.ui.level;

async function switchMode(target) {
  await withBusy(target === 'demo' ? 'Préparation des données fictives…' : 'Retour à la base réelle…', async () => {
    if (target === 'demo') { S.realStore = S.realStore || S.store; S.realMode = S.realMode || S.mode; const st = await new LocalStore('demo').open(); S.store = st; S.mode = 'demo'; await loadAll(); if (!S.initialized || !Object.keys(S.evals).length) { await buildDemo(); await loadAll(); } lsSet('demo', true); }
    else { lsSet('demo', false); if (S.cloudDemo || !S.realStore) { location.hash = ''; location.reload(); return; } S.store = S.realStore || S.store; S.mode = S.realMode || 'local'; S.realStore = null; await loadAll(); }
    S.ui.view = 'accueil'; location.hash = 'accueil'; render();
  });
}
