/* =====================================================================
   Statistiques, centre d'impression, journal, paramètres
   ===================================================================== */
V.statistiques = el => {
  const lvIds = levelsInScope(); const sit = +(S.ui.sel.ssit ?? curSit());
  const evs = Object.values(S.evals).filter(e => lvIds.includes(e.level) && e.anon?.lifted && (!sit || e.sit === sit));
  el.innerHTML = pageHead('Statistiques', 'Calculées sur les épreuves dont l’anonymat est levé. Moyennes brutes sur 20, sans coefficient.',
    `<label class="f" style="flex-direction:row;align-items:center;gap:6px">Situation<select class="in" id="ss" style="width:auto"><option value="0" ${!sit ? 'selected' : ''}>Toutes</option>${sitOpts(sit)}</select></label><button class="btn" data-act="xlsx">${ic('download')}Excel</button><button class="btn primary" data-act="pdf">${ic('print')}Rapport PDF</button>`) +
    (evs.length ? lvIds.map(lv => statsLevel(lv, evs.filter(e => e.level === lv))).join('') : '<div class="panel empty"><h3>Pas encore de résultats</h3><p>Les tableaux apparaissent après la première levée d’anonymat.</p></div>');
  $('#ss', el).onchange = ev => { S.ui.sel.ssit = +ev.target.value; render(); };
  $('[data-act=pdf]', el).onclick = () => evs.length ? runPdf(`rapport-statistique-${sit ? 's' + sit : 'annee'}.pdf`, 'Rapport statistique', doc => addStats(doc, evs)) : toast('Aucune épreuve désanonymisée.', 'bad');
  $('[data-act=xlsx]', el).onclick = () => { if (!evs.length) return toast('Aucune donnée.', 'bad'); xlsxSave(`statistiques-${sit ? 's' + sit : 'annee'}.xlsx`, lvIds.map(lv => { const t = crossTable(lv, evs.filter(e => e.level === lv)); return { name: levelById(lv).nom, rows: [['Matière', ...t.cls.map(c => c.nom), 'Niveau'], ...t.subs.map(s => [s.nom, ...t.cls.map(c => t.cell[s.code + c.id] ?? ''), t.rowMean[s.code] ?? '']), ['Moyenne', ...t.cls.map(c => t.colMean[c.id] ?? ''), '']] }; })); };
  $$('[data-subj-chart]', el).forEach(s => s.onchange = () => { S.ui.sel['sc_' + s.dataset.subjChart] = s.value; render(); });
};
function crossTable(lv, evs) {
  const cls = classesOf(lv); const subs = S.subjects.filter(s => evs.some(e => e.subj === s.code)); const cell = {}, rowMean = {}, colVals = {};
  subs.forEach(s => { const all = []; cls.forEach(c => { const vals = []; evs.filter(e => e.subj === s.code && e.classes.includes(c.id)).forEach(e => (resultsByClass(e)[c.id] || []).forEach(r => r.note !== null && vals.push(r.note))); if (vals.length) { const m = statsOf(vals).mean; cell[s.code + c.id] = Math.round(m * 100) / 100; (colVals[c.id] = colVals[c.id] || []).push(...vals); all.push(...vals); } }); if (all.length) rowMean[s.code] = Math.round(statsOf(all).mean * 100) / 100; });
  const colMean = {}; Object.entries(colVals).forEach(([k, v]) => colMean[k] = Math.round(statsOf(v).mean * 100) / 100);
  return { cls, subs, cell, rowMean, colMean };
}
function statsLevel(lv, evs) {
  if (!evs.length) return `<div class="panel"><header><h3>${levelById(lv).nom}</h3></header><p class="muted small">Aucune épreuve désanonymisée.</p></div>`;
  const t = crossTable(lv, evs); const seuil = +S.settings.seuilReussite || 10;
  const color = v => v === undefined ? '' : v < seuil - 2 ? 'background:var(--bad-soft);color:var(--bad)' : v < seuil ? 'background:var(--warn-soft);color:var(--warn)' : v >= seuil + 3 ? 'background:var(--ok-soft);color:var(--ok)' : '';
  const sc = S.ui.sel['sc_' + lv] || t.subs[0]?.code;
  const chartData = t.cls.map(c => ({ l: c.nom, v: t.cell[sc + c.id] ?? null })).filter(d => d.v !== null);
  return `<div class="panel"><header><h3>${levelById(lv).nom} · moyennes par matière et par classe</h3><div class="legend"><span><i style="background:var(--bad-soft)"></i>&lt; ${seuil - 2}</span><span><i style="background:var(--warn-soft)"></i>&lt; ${seuil}</span><span><i style="background:var(--ok-soft)"></i>≥ ${seuil + 3}</span></div></header>
    <div class="tw"><table class="t"><thead><tr><th>Matière</th>${t.cls.map(c => `<th class="c mono">${esc(c.nom)}</th>`).join('')}<th class="c">Niveau</th></tr></thead><tbody>${t.subs.map(s => `<tr><td><b>${esc(s.abbr)}</b> <span class="small muted">${esc(s.nom)}</span></td>${t.cls.map(c => { const v = t.cell[s.code + c.id]; return `<td class="c num" style="${color(v)}">${v === undefined ? '' : fmtNote(v)}</td>`; }).join('')}<td class="c num"><b>${fmtNote(t.rowMean[s.code])}</b></td></tr>`).join('')}<tr><td><b>Toutes matières</b></td>${t.cls.map(c => `<td class="c num"><b>${fmtNote(t.colMean[c.id])}</b></td>`).join('')}<td></td></tr></tbody></table></div>
    <div class="row" style="margin-top:14px"><b>Comparaison des classes en</b><select class="in" data-subj-chart="${lv}" style="width:auto">${subjOpts(sc, t.subs)}</select></div>${barChartSvg(chartData, { max: 20, ref: seuil, h: 200 })}</div>`;
}

/* ---------- Centre d'impression ---------- */
V.editions = el => {
  const lvIds = levelsInScope(); const all = scopeEvals(e => !!e.placement);
  const dates = [...new Set(all.map(e => e.date))].sort();
  const dSel = S.ui.sel.pdate && dates.includes(S.ui.sel.pdate) ? S.ui.sel.pdate : (dates.find(d => d >= todayISO()) || dates[dates.length - 1] || todayISO()); S.ui.sel.pdate = dSel;
  const ofDate = all.filter(e => e.date === dSel);
  const sit = curSit(); const ofSit = scopeEvals(e => e.sit === sit);
  el.innerHTML = pageHead('Centre d’impression', 'Chaque édition regroupe toutes les classes, salles ou épreuves choisies dans un seul fichier PDF, prêt à imprimer en une fois.') + `
    <div class="panel"><header><h3>Éditions par date d’épreuve</h3></header>
      ${dates.length ? `<div class="fgrid"><label class="f">Date<select class="in" id="pd">${optList(dates.map(d => [d, fmtDate(d)]), dSel)}</select></label></div>
      <div class="stack" style="margin-top:12px"><b class="small">Épreuves de ce jour (cochez celles à éditer)</b><div class="row" id="pev">${ofDate.map(e => `<label class="check pill neutral plain" style="padding:4px 10px"><input type="checkbox" value="${e.id}" checked> ${levelById(e.level).roman} · ${esc(subjByCode(e.subj).abbr)} · ${e.start}</label>`).join('')}</div></div>
      <div class="grid g3" style="margin-top:14px">
        ${printCard('listes', 'Listes de classe avec codes-barres', 'Toutes les classes du niveau pour la même matière et la même date, une classe par page, émargement compris.')}
        ${printCard('emarg', 'Émargement et PV de salle', 'Une liste par salle triée par numéro de table, avec le procès-verbal de salle à signer.')}
        ${printCard('etiq', 'Étiquettes adhésives', 'Planches A4 : étiquette nominative pour l’en-tête détachable et étiquette anonyme pour la copie.')}
        ${printCard('bord', 'Bordereaux de notation', `Lots de ${S.settings.tailleLot} copies anonymes, avec cases de note, à remettre aux correcteurs.`)}
        ${printCard('corr', 'Tables de correspondance', 'Code ↔ élève, à placer sous pli scellé. Réservé à la coordination.')}
        ${printCard('dossier', 'Dossier complet du jour', 'Sommaire, émargements, listes de classe et bordereaux de toutes les épreuves cochées.', true)}
      </div>` : '<div class="empty small">Aucune épreuve n’a encore ses codes-barres. Générez une répartition depuis « Préparation et codes-barres ».</div>'}</div>
    <div class="panel"><header><h3>Éditions de la situation ${sit}</h3><span class="small muted">${ofSit.length} épreuve(s)</span></header><div class="grid g3">
      ${printCard('planning', 'Planning de la situation', 'Tableau paysage par préfecture : dates, créneaux, classes, salles, statut.')}
      ${printCard('releves', 'Relevés de notes', 'Toutes les épreuves désanonymisées de la situation, une classe par page.')}
      ${printCard('stats', 'Rapport statistique', 'Moyennes, taux de réussite, répartition et palmarès par épreuve.')}
      ${printCard('xlsx', 'Notes en Excel', 'Un classeur : une feuille par classe, une colonne par matière.')}
    </div></div>
    <div class="panel"><header><h3>Fiches de suivi des élèves</h3></header><div class="row"><select class="in" id="fcls" style="width:auto">${optList(lvIds.flatMap(classesOf).map(c => [c.id, c.nom]), '')}</select><button class="btn" data-p="fiches">${ic('print')}Fiches de toute la classe (1 PDF)</button></div></div>`;
  $('#pd', el)?.addEventListener('change', ev => { S.ui.sel.pdate = ev.target.value; render(); });
  const chosen = () => $$('#pev input:checked', el).map(i => S.evals[i.value]);
  const tag = `${dSel}-${fileSafe(scopeLabel())}`;
  $$('[data-p]', el).forEach(b => b.onclick = async () => {
    const k = b.dataset.p; const evs = chosen();
    const needEv = ['listes', 'emarg', 'etiq', 'bord', 'corr', 'dossier'].includes(k);
    if (needEv && !evs.length) return toast('Cochez au moins une épreuve.', 'bad');
    if (k === 'listes') runPdf(`listes-classe-${tag}.pdf`, 'Listes de classe', doc => addListesClasse(doc, evs));
    if (k === 'emarg') runPdf(`emargement-${tag}.pdf`, 'Émargement', doc => addEmargement(doc, evs));
    if (k === 'etiq') labelDialog(evs, tag);
    if (k === 'bord') runPdf(`bordereaux-${tag}.pdf`, 'Bordereaux', doc => addBordereaux(doc, evs));
    if (k === 'corr') { if (await requireCoord('Éditer les tables de correspondance.')) runPdf(`correspondance-${tag}.pdf`, 'Correspondance', doc => addCorrespondance(doc, evs)); }
    if (k === 'dossier') dossierDialog(evs, tag);
    if (k === 'planning') runPdf(`planning-s${sit}-${fileSafe(scopeLabel())}.pdf`, 'Planning', doc => addPlanning(doc, lvIds, { sit }), 'l');
    if (k === 'releves') { const l = ofSit.filter(e => e.anon?.lifted); l.length ? runPdf(`releves-s${sit}-${fileSafe(scopeLabel())}.pdf`, 'Relevés de notes', doc => addReleves(doc, l)) : toast('Aucune épreuve désanonymisée dans cette situation.', 'bad'); }
    if (k === 'stats') { const l = ofSit.filter(e => e.anon?.lifted); l.length ? runPdf(`statistiques-s${sit}.pdf`, 'Rapport statistique', doc => addStats(doc, l)) : toast('Aucune épreuve désanonymisée.', 'bad'); }
    if (k === 'xlsx') exportSitXlsx(lvIds, ofSit.filter(e => e.anon?.lifted), sit);
    if (k === 'fiches') { const c = S.classes[$('#fcls', el).value]; if (c) runPdf(`fiches-suivi-${fileSafe(c.nom)}.pdf`, 'Fiches de suivi', doc => studentsOf(c).forEach(s => addFicheEleve(doc, s.id))); }
  });
};
const printCard = (k, t, d, primary) => `<div class="panel flat" style="background:var(--surface-2);display:flex;flex-direction:column;gap:8px"><h4>${t}</h4><p class="small muted" style="flex:1">${d}</p><div><button class="btn sm ${primary ? 'primary' : ''}" data-p="${k}">${ic('print')}Générer</button></div></div>`;
function dossierDialog(evs, tag) {
  openModal({ title: 'Dossier complet du jour', body: `<p class="small muted">${evs.length} épreuve(s). Tout sort dans un seul PDF, dans l’ordre ci-dessous.</p><label class="check"><input type="checkbox" id="d1" checked> Listes d’émargement et PV par salle</label><label class="check"><input type="checkbox" id="d2" checked> Listes de classe avec codes-barres</label><label class="check"><input type="checkbox" id="d3" checked> Bordereaux de notation anonymes</label><label class="check"><input type="checkbox" id="d4"> Tables de correspondance (coordination)</label>`,
    actions: [{ label: 'Annuler' }, { label: `${ic('print')}Générer`, cls: 'primary', onClick: async (close, m) => { const o = { emarg: $('#d1', m).checked, listes: $('#d2', m).checked, bord: $('#d3', m).checked, corr: $('#d4', m).checked }; close(); if (o.corr && !(await requireCoord('Inclure les tables de correspondance.'))) o.corr = false; runPdf(`dossier-${tag}.pdf`, 'Dossier du jour', doc => addDossierJournee(doc, evs, o)); } }] });
}
function exportSitXlsx(lvIds, evs, sit) {
  if (!evs.length) return toast('Aucune épreuve désanonymisée dans cette situation.', 'bad');
  const sheets = [];
  lvIds.forEach(lv => classesOf(lv).forEach(c => { const es = evs.filter(e => e.classes.includes(c.id)).sort((a, b) => a.subj.localeCompare(b.subj)); if (!es.length) return;
    const res = es.map(e => resultsByClass(e)[c.id] || []);
    const rows = [['Matricule', 'Noms et prénoms', 'Sexe', ...es.map(e => `${subjByCode(e.subj).abbr} (coef ${c.subjects.find(s => s.m === e.subj)?.coef ?? '?'})`)]];
    studentsOf(c).forEach(s => rows.push([s.mat, fullName(s), s.sexe, ...res.map(r => { const x = r.find(z => z.sid === s.id); return x ? (x.note === null ? x.st : Math.round(x.note * 100) / 100) : ''; })]));
    sheets.push({ name: c.nom, rows, cols: [12, 34, 6, ...es.map(() => 12)] }); }));
  xlsxSave(`notes-situation-${sit}.xlsx`, sheets);
}

/* ---------- Journal d'audit ---------- */
V.journal = el => {
  el.innerHTML = pageHead('Journal d’audit', 'Chaque action sensible est horodatée : imports, répartitions, notes modifiées, levées d’anonymat, éditions.', `<button class="btn" data-act="csv">${ic('download')}Exporter (Excel)</button>`) + '<div id="jl" class="panel"><div class="row"><span class="spin"></span>Chargement…</div></div>';
  (async () => {
    const days = await S.store.list('logs'); const entries = [];
    days.forEach(d => Object.values(d.data.entries || {}).forEach(x => entries.push(x)));
    entries.sort((a, b) => b.at - a.at);
    const lvIds = levelsInScope(); const shown = entries.filter(x => S.ui.level === 'all' || !x.level || lvIds.includes(x.level) || x.level === 'all').slice(0, 400);
    const names = {}; const ids = [...new Set(shown.map(x => x.uid).filter(Boolean))];
    if (ids.length && S.caps.user) { try { const ps = await S.caps.user.profiles(ids); Object.entries(ps || {}).forEach(([k, p]) => { if (p && p.name) names[k] = p.name; }); } catch (e) { } }
    const box = $('#jl', el); if (!box) return;
    box.outerHTML = `<div class="tw"><table class="t"><thead><tr><th>Date et heure</th><th>Utilisateur</th><th>Action</th><th>Détail</th></tr></thead><tbody>${shown.map(x => `<tr><td class="small mono">${fmtDT(x.at)}</td><td class="small">${esc(names[x.uid] || x.who)}${x.role === 'coordination' ? ' <span class="pill gold plain">coord.</span>' : ''}</td><td><b>${esc(x.action)}</b></td><td class="small">${esc(x.detail)}</td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Journal vide.</div></td></tr>'}</tbody></table></div>`;
    $('[data-act=csv]', el).onclick = () => xlsxSave('journal-audit.xlsx', [{ name: 'Journal', rows: [['Date', 'Utilisateur', 'Profil', 'Niveau', 'Action', 'Détail'], ...entries.map(x => [fmtDT(x.at), names[x.uid] || x.who, x.role, x.level, x.action, x.detail])], cols: [18, 22, 12, 8, 22, 80] }]);
  })();
};

/* ---------- Paramètres ---------- */
V.parametres = el => {
  const st = S.settings;
  el.innerHTML = pageHead('Paramètres et sauvegarde', 'Identité de l’établissement, en-têtes des documents, règles de saisie, sécurité et sauvegardes.') + `
  <div class="grid g2">
    <div class="panel"><header><h3>Établissement</h3></header><div class="stack">
      <div class="fgrid"><label class="f">Nom<input class="in" id="p-etab" value="${esc(st.etab)}"></label><label class="f">Sigle<input class="in" id="p-sigle" value="${esc(st.sigle)}"></label><label class="f">Ville<input class="in" id="p-ville" value="${esc(st.ville)}"></label><label class="f">Année scolaire<input class="in" id="p-annee" value="${esc(st.annee)}"></label></div>
      <label class="f">Tutelle<input class="in" id="p-tut" value="${esc(st.tutelle)}"></label>
      <div class="fgrid"><label class="f">Coordonnateur<input class="in" id="p-coord" value="${esc(st.coordo)}"></label><label class="f">Fonction<input class="in" id="p-coordt" value="${esc(st.coordoTitre)}"></label></div>
      <div class="fgrid">${LEVELS.map(l => `<label class="f">Préfet de ${l.nom}<input class="in" data-pref="${l.id}" value="${esc(st.prefets?.[l.id] || '')}"></label>`).join('')}</div>
      <div class="row" style="align-items:center">${logoHTML('logo')}<style>.panel .logo{width:64px;height:64px}</style><label class="btn">${ic('upload')}Charger le logo<input type="file" id="p-logo" accept="image/png,image/jpeg" hidden></label>${st.logo && st.logo !== DEFAULT_LOGO ? `<button class="btn ghost" data-act="nologo">Revenir au logo du collège</button>` : '<span class="small muted">Logo du Collège François-Xavier Vogt utilisé par défaut.</span>'}</div>
    </div></div>
    <div class="panel"><header><h3>En-tête des PDF</h3></header><div class="fgrid" style="margin-bottom:10px"><label class="f">Modèle d’en-tête<select class="in" id="p-style">${optList([['etablissement', 'Établissement : tableau encadré avec logo (modèle du collège)'], ['officiel', 'Officiel bilingue : République du Cameroun']], st.pdfStyle)}</select></label><label class="f">Service (modèle établissement)<input class="in" id="p-dep" value="${esc(st.departement || '')}"></label></div><div class="fgrid"><label class="f">Colonne française<textarea class="in" id="p-fr" rows="6">${esc(st.enteteFR)}</textarea></label><label class="f">Colonne anglaise<textarea class="in" id="p-en" rows="6">${esc(st.enteteEN)}</textarea></label></div><p class="small muted">Une ligne par niveau hiérarchique. Le logo s’insère au centre.</p></div>
    <div class="panel"><header><h3>Règles d’évaluation</h3></header><div class="fgrid">
      <label class="f">Situation courante par défaut<select class="in" id="p-sit">${sitOpts(st.sitCourante)}</select></label>
      <label class="f">Seuil de réussite (/20)<input class="in num" type="number" step="0.5" id="p-seuil" value="${st.seuilReussite}"></label>
      <label class="f">Délai de saisie (jours)<input class="in num" type="number" id="p-delai" value="${st.delaiSaisie}"></label>
      <label class="f">Copies par bordereau<input class="in num" type="number" id="p-lot" value="${st.tailleLot}"></label>
      <label class="f">Écart déclenchant un arbitrage<input class="in num" type="number" step="0.5" id="p-ecart" value="${st.ecartDouble}"></label></div></div>
    <div class="panel"><header><h3>Sécurité</h3></header><div class="stack">
      <p class="small">${S.security.pinHash ? '<span class="pill ok">PIN défini</span> Les actions sensibles demandent le PIN de la coordination.' : '<span class="pill warn">aucun PIN</span> Définissez un PIN pour protéger la levée d’anonymat, les corrections et les suppressions.'}</p>
      <div class="fgrid"><label class="f">Nouveau PIN (4 à 8 chiffres)<input class="in mono" type="password" id="p-pin" inputmode="numeric" autocomplete="new-password"></label><label class="f">Confirmation<input class="in mono" type="password" id="p-pin2" inputmode="numeric" autocomplete="new-password"></label></div>
      <div class="row"><button class="btn" data-act="pin">${ic('lock')}Enregistrer le PIN</button>${S.security.pinHash ? `<button class="btn ghost" data-act="pinreset">PIN oublié</button>` : ''}</div>
      <p class="tiny muted">Le PIN est stocké sous forme d’empreinte SHA-256. Il protège l’interface ; la confidentialité repose aussi sur la liste des personnes qui ont accès à l’application.</p></div></div>
  </div>
  <div class="row"><button class="btn primary" data-act="save">${ic('check')}Enregistrer les paramètres</button></div>
  ${cloudPanelHTML()}
  <div class="grid g2">
    <div class="panel"><header><h3>Sauvegarde et restauration</h3><span class="pill ${['shared', 'cloud'].includes(S.mode) ? 'ok' : 'info'}">${esc(modeLabel())}</span></header><div class="stack">
      <p class="small muted">La sauvegarde contient toute la base : paramètres, classes, élèves, enseignants, salles, épreuves et notes. Conservez-la sur une clé USB après chaque séance de saisie.</p>
      <div class="row"><button class="btn" data-act="backup">${ic('download')}Télécharger la sauvegarde (.json)</button><label class="btn">${ic('upload')}Restaurer<input type="file" id="p-restore" accept=".json,application/json" hidden></label></div></div></div>
    <div class="panel"><header><h3>Zone sensible</h3></header><div class="stack">
      <p class="small muted">Nouvelle année : archive d’abord la base, puis efface épreuves et notes en gardant classes, matières, enseignants et salles.</p>
      <div class="row"><button class="btn danger" data-act="newyear">${ic('refresh')}Préparer une nouvelle année</button><button class="btn danger" data-act="wipe">${ic('trash')}Tout effacer</button></div></div></div></div>
  <p class="tiny muted">${APP.name} · version ${APP.version} · proposé par ${esc(st.coordo)}, ${esc(st.coordoTitre)}.</p>`;
  bindCloudPanel(el);
  $('#p-logo', el).onchange = ev => { const f = ev.target.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { const img = new Image(); img.onload = async () => { const c = document.createElement('canvas'); const k = Math.min(1, 320 / Math.max(img.width, img.height)); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); S.settings.logo = c.toDataURL('image/png'); await saveSettings(); audit('Paramètres', 'Logo mis à jour'); toast('Logo enregistré.', 'ok'); render(); }; img.src = fr.result; }; fr.readAsDataURL(f); };
  $$('[data-act]', el).forEach(b => b.onclick = async () => {
    const a = b.dataset.act;
    if (a === 'nologo') { S.settings.logo = ''; await saveSettings(); render(); }
    if (a === 'save') { const v = id => $(id, el).value; Object.assign(S.settings, { etab: v('#p-etab'), sigle: v('#p-sigle'), ville: v('#p-ville'), annee: v('#p-annee'), tutelle: v('#p-tut'), coordo: v('#p-coord'), coordoTitre: v('#p-coordt'), enteteFR: v('#p-fr'), enteteEN: v('#p-en'), pdfStyle: v('#p-style'), departement: v('#p-dep'), sitCourante: +v('#p-sit'), trimCourant: trimOfSit(+v('#p-sit')), seuilReussite: +v('#p-seuil') || 10, delaiSaisie: +v('#p-delai') || 7, tailleLot: +v('#p-lot') || 25, ecartDouble: +v('#p-ecart') || 3 }); S.settings.prefets = {}; $$('[data-pref]', el).forEach(i => S.settings.prefets[i.dataset.pref] = i.value.trim()); await saveSettings(); audit('Paramètres', 'Paramètres modifiés'); toast('Paramètres enregistrés.', 'ok'); render(); }
    if (a === 'pin') { const p1 = $('#p-pin', el).value, p2 = $('#p-pin2', el).value; if (!/^\d{4,8}$/.test(p1) || p1 !== p2) return toast('PIN de 4 à 8 chiffres, identique dans les deux champs.', 'bad'); if (S.security.pinHash && !(await requireCoord('Changer le PIN.'))) return; S.security.pinHash = await sha256('astraluz:' + p1); await S.store.set('cfg/security', S.security); audit('Sécurité', 'PIN de la coordination défini'); toast('PIN enregistré.', 'ok'); render(); }
    if (a === 'pinreset') { const allowed = S.mode === 'shared' ? !!(await S.caps.user?.isOwner?.()) : true; if (!allowed) return toast('Seul le propriétaire de l’application peut effacer le PIN.', 'bad'); if (!(await confirmBox('Effacer le PIN', 'Le PIN de la coordination sera supprimé. Définissez-en un nouveau aussitôt après.', 'Effacer le PIN', true))) return; S.security = {}; await S.store.set('cfg/security', {}); S.ui.role = 'secretariat'; S.ui.unlocked = false; audit('Sécurité', 'PIN effacé (PIN oublié)'); toast('PIN effacé.', 'ok'); render(); }
    if (a === 'backup') { const logs = await S.store.list('logs'); const dump = { app: APP.name, version: APP.version, at: new Date().toISOString(), mode: S.mode, settings: S.settings, subjects: S.subjects, teachers: S.teachers, rooms: S.rooms, classes: S.classes, evals: S.evals, logs }; saveBlob(`sauvegarde-astraluz-${todayISO()}.json`, new Blob([JSON.stringify(dump)], { type: 'application/json' })); audit('Sauvegarde', 'Export complet de la base'); }
    if (a === 'newyear') { if (!(await requireCoord('Préparer une nouvelle année.'))) return; if (!(await confirmBox('Nouvelle année', 'Toutes les épreuves et toutes les notes seront effacées. Avez-vous téléchargé la sauvegarde de l’année ?', 'Effacer épreuves et notes', true))) return; await withBusy('Nettoyage…', async () => { for (const id of Object.keys(S.evals)) await S.store.delete('evals/' + id); S.evals = {}; }); audit('Nouvelle année', 'Épreuves et notes effacées'); render(); }
    if (a === 'wipe') { if (!(await requireCoord('Tout effacer.'))) return; if (!(await confirmBox('Tout effacer', 'La base sera entièrement vidée. Cette opération est irréversible sans sauvegarde.', 'Tout effacer', true))) return; await withBusy('Effacement…', async () => { const paths = ['cfg/settings', 'cfg/subjects', 'cfg/teachers', 'cfg/rooms', 'cfg/security', ...Object.keys(S.classes).map(k => 'classes/' + k), ...Object.keys(S.evals).map(k => 'evals/' + k), ...(await S.store.list('logs')).map(d => 'logs/' + d.id)]; for (const p of paths) await S.store.delete(p); await loadAll(); }); S.ui.view = 'accueil'; location.hash = 'accueil'; render(); }
  });
  $('#p-restore', el).onchange = async ev => { const f = ev.target.files[0]; if (!f) return; if (!(await requireCoord('Restaurer une sauvegarde.'))) return; try { const d = JSON.parse(await f.text()); if (!d.settings || !d.classes) throw new Error('Fichier de sauvegarde non reconnu.'); if (!(await confirmBox('Restaurer', `Remplacer la base actuelle par la sauvegarde du ${esc(fmtDT(Date.parse(d.at)))} (${Object.keys(d.classes).length} classes, ${Object.keys(d.evals || {}).length} épreuves) ?`, 'Restaurer', true))) return; await withBusy('Restauration…', async () => { for (const k of Object.keys(S.evals)) if (!(d.evals || {})[k]) await S.store.delete('evals/' + k); for (const k of Object.keys(S.classes)) if (!d.classes[k]) await S.store.delete('classes/' + k); await S.store.set('cfg/settings', d.settings); await S.store.set('cfg/subjects', { list: d.subjects || [] }); await S.store.set('cfg/teachers', { list: d.teachers || [] }); await S.store.set('cfg/rooms', { list: d.rooms || [] }); await S.store.setMany([...Object.values(d.classes).map(c => ['classes/' + c.id, c]), ...Object.values(d.evals || {}).map(e => ['evals/' + e.id, e])]); await loadAll(); }); audit('Restauration', `Sauvegarde du ${d.at}`); toast('Base restaurée.', 'ok'); render(); } catch (e) { toast(e.message, 'bad'); } };
};
