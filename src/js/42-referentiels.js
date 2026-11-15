/* =====================================================================
   Référentiels : élèves et classes, matières et enseignants, salles
   ===================================================================== */
V.eleves = el => {
  const lvIds = levelsInScope();
  const all = lvIds.flatMap(classesOf);
  if (!all.length) { el.innerHTML = pageHead('Élèves et classes') + '<div class="panel empty"><h3>Aucune classe</h3><p>Initialisez la structure depuis l’accueil.</p></div>'; return; }
  let cid = S.ui.sel.cls; if (!cid || !all.some(c => c.id === cid)) cid = all[0].id; S.ui.sel.cls = cid;
  const c = S.classes[cid]; const list = studentsOf(c); const q = S.ui.filters.st || '';
  const shown = q ? list.filter(s => norm(fullName(s) + ' ' + s.mat).includes(norm(q))) : list;
  const gone = (c.students || []).filter(s => s.statut === 'parti');
  el.innerHTML = pageHead('Élèves et classes', 'Chargez les listes par classe ou en une fois pour tout le niveau : une colonne « Classe » dans le fichier répartit les élèves automatiquement.',
    `<button class="btn" data-act="tpl">${ic('download')}Modèle Excel</button><button class="btn primary" data-act="import">${ic('upload')}Importer des listes</button>`) + `
  <div class="grid" style="grid-template-columns:minmax(200px,260px) minmax(0,1fr);align-items:start" id="el-grid">
    <div class="panel" style="padding:8px"><div class="stack" style="gap:2px">${lvIds.map(lv => `<div class="eyebrow" style="padding:8px 8px 2px">${levelById(lv).nom}</div>${classesOf(lv).map(x => `<button class="btn ghost" style="justify-content:space-between;width:100%;${x.id === cid ? 'background:var(--accent-soft);color:var(--accent)' : ''}" data-cls="${x.id}"><span class="mono">${esc(x.nom)}</span><span class="small muted num">${studentsOf(x).length}</span></button>`).join('')}`).join('')}</div></div>
    <div class="stack" style="min-width:0">
      <div class="panel"><header><h3>${esc(c.nom)} <span class="muted small" style="font-family:var(--f-body);font-weight:500">· ${esc(POLES[c.pole] || '')} · rang ${pad(c.rang, 2)} dans le code</span></h3>
        <button class="btn sm" data-act="add">${ic('plus')}Ajouter un élève</button><button class="btn sm" data-act="export">${ic('download')}Excel</button><button class="btn sm danger" data-act="clear">${ic('trash')}Vider</button></header>
        <div class="fgrid"><label class="f">Effectif<input class="in" value="${list.length} élèves · ${list.filter(s => s.sexe === 'F').length} F / ${list.filter(s => s.sexe === 'M').length} G" disabled></label>
          <label class="f">Professeur principal<select class="in" id="tit">${teacherOpts(c.titulaire)}</select></label>
          <label class="f">Rechercher dans la classe<input class="in" id="stq" value="${esc(q)}" placeholder="Nom ou matricule"></label></div></div>
      <div class="tw"><table class="t"><thead><tr><th>N°</th><th>Matricule</th><th>Noms et prénoms</th><th class="c">Sexe</th><th>Naissance</th><th>Statut</th><th></th></tr></thead><tbody>
        ${shown.map((s, i) => `<tr><td class="num muted">${i + 1}</td><td class="mono small">${esc(s.mat)}</td><td><b>${esc(upperName(s.nom))}</b> ${esc(capName(s.prenom))}</td><td class="c">${esc(s.sexe)}</td><td class="small">${s.dn ? fmtDate(s.dn, 'short') : ''}</td><td>${s.statut === 'redoublant' ? '<span class="pill warn plain">redoublant</span>' : '<span class="pill neutral plain">nouveau</span>'}</td><td class="r"><button class="btn sm ghost" data-ed="${s.id}" aria-label="Modifier">${ic('edit')}</button><button class="btn sm ghost" data-fiche="${s.id}" aria-label="Fiche">${ic('eye')}</button></td></tr>`).join('') || `<tr><td colspan="7"><div class="empty"><h3>Liste vide</h3><p>Importez un fichier Excel ou CSV, ou ajoutez les élèves un par un.</p></div></td></tr>`}
      </tbody></table></div>
      ${gone.length ? `<p class="small muted">${gone.length} élève(s) sorti(s) de la classe conservé(s) pour l’historique.</p>` : ''}
    </div></div>`;
  if (window.innerWidth < 760) $('#el-grid', el).style.gridTemplateColumns = 'minmax(0,1fr)';
  $$('[data-cls]', el).forEach(b => b.onclick = () => { S.ui.sel.cls = b.dataset.cls; S.ui.filters.st = ''; render(); });
  $('#stq', el).oninput = debounce(ev => { S.ui.filters.st = ev.target.value; render(); setTimeout(() => { const i = $('#stq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); }, 300);
  $('#tit', el).onchange = async ev => { c.titulaire = ev.target.value; await saveClass(c); toast('Professeur principal enregistré.', 'ok'); };
  $$('[data-ed]', el).forEach(b => b.onclick = () => studentForm(c, (c.students || []).find(s => s.id === b.dataset.ed)));
  $$('[data-fiche]', el).forEach(b => b.onclick = () => showStudent(b.dataset.fiche));
  $$('[data-act]', el).forEach(b => b.onclick = async () => {
    const a = b.dataset.act;
    if (a === 'add') studentForm(c, null);
    if (a === 'import') importStudents(c);
    if (a === 'tpl') xlsxSave('modele-import-eleves.xlsx', [{ name: 'Élèves', rows: [['Matricule', 'Nom', 'Prénoms', 'Sexe', 'Date de naissance', 'Classe', 'Statut'], ['26V0001', 'NOM', 'Prénom', 'F', '2010-03-14', c.nom, 'nouveau']], cols: [12, 22, 26, 6, 16, 10, 12] }]);
    if (a === 'export') xlsxSave(`liste-${fileSafe(c.nom)}.xlsx`, [{ name: c.nom, rows: [['N°', 'Matricule', 'Nom', 'Prénoms', 'Sexe', 'Date de naissance', 'Statut'], ...list.map((s, i) => [i + 1, s.mat, upperName(s.nom), capName(s.prenom), s.sexe, s.dn, s.statut])], cols: [5, 12, 22, 26, 6, 14, 12] }]);
    if (a === 'clear') { if (!(await requireCoord('Vider la liste d’une classe.'))) return; if (await confirmBox('Vider la classe', `Supprimer les ${list.length} élèves de ${esc(c.nom)} ? Les épreuves déjà réparties gardent leur table de correspondance.`, 'Vider la classe', true)) { c.students = []; await saveClass(c); audit('Élèves', `Classe ${c.nom} vidée`); render(); } }
  });
};
function studentForm(c, s) {
  const isNew = !s; s = s || { id: uid('s'), mat: '', nom: '', prenom: '', sexe: 'F', dn: '', statut: 'nouveau' };
  const lvCls = Object.values(S.classes).sort((a, b) => (a.level + pad(a.rang, 2)).localeCompare(b.level + pad(b.rang, 2)));
  openModal({ title: isNew ? `Nouvel élève · ${c.nom}` : fullName(s), body: `<div class="fgrid">
    <label class="f">Matricule<input class="in mono" id="f-mat" value="${esc(s.mat)}"></label>
    <label class="f">Nom<input class="in" id="f-nom" value="${esc(s.nom)}"></label>
    <label class="f">Prénoms<input class="in" id="f-pre" value="${esc(s.prenom)}"></label>
    <label class="f">Sexe<select class="in" id="f-sx">${optList([['F', 'Féminin'], ['M', 'Masculin']], s.sexe)}</select></label>
    <label class="f">Date de naissance<input class="in" type="date" id="f-dn" value="${esc(s.dn)}"></label>
    <label class="f">Statut<select class="in" id="f-st">${optList([['nouveau', 'Nouveau'], ['redoublant', 'Redoublant'], ['parti', 'Sorti de la classe']], s.statut)}</select></label>
    <label class="f">Classe<select class="in" id="f-cl">${optList(lvCls.map(x => [x.id, `${levelById(x.level).roman} · ${x.nom}`]), c.id)}</select></label></div>`,
    actions: [...(isNew ? [] : [{ label: `${ic('trash')}Supprimer`, cls: 'danger', onClick: async close => { if (!(await requireCoord('Supprimer un élève.'))) return false; c.students = c.students.filter(x => x.id !== s.id); await saveClass(c); audit('Élèves', `Suppression de ${fullName(s)} (${c.nom})`); close(); render(); } }]),
      { label: 'Annuler' }, { label: 'Enregistrer', cls: 'primary', onClick: async (close, m) => {
        const v = id => $(id, m).value.trim();
        if (!v('#f-nom')) { toast('Le nom est obligatoire.', 'bad'); return false; }
        Object.assign(s, { mat: v('#f-mat'), nom: upperName(v('#f-nom')), prenom: capName(v('#f-pre')), sexe: v('#f-sx'), dn: v('#f-dn'), statut: v('#f-st') });
        const dest = S.classes[v('#f-cl')];
        if (dest.id !== c.id) { c.students = (c.students || []).filter(x => x.id !== s.id); dest.students = [...(dest.students || []), s]; await saveClass(c); await saveClass(dest); audit('Élèves', `${fullName(s)} transféré de ${c.nom} vers ${dest.nom}`); }
        else { if (isNew) c.students = [...(c.students || []), s]; await saveClass(c); audit('Élèves', `${isNew ? 'Ajout' : 'Modification'} : ${fullName(s)} (${c.nom})`); }
        close(); render(); } }] });
}
function importStudents(c) {
  let parsed = null;
  const md = openModal({ title: 'Importer des listes d’élèves', wide: true, body: `
    <p class="small muted">Formats acceptés : .xlsx, .xls, .csv. Colonnes reconnues : Matricule, Nom, Prénoms, Sexe, Date de naissance, Classe, Statut. Sans colonne « Classe », tout va dans <b>${esc(c.nom)}</b>. Une colonne unique « Noms et prénoms » est aussi acceptée.</p>
    <input type="file" class="in" id="imp-file" accept=".xlsx,.xls,.csv,.ods">
    <div class="row"><label class="check"><input type="radio" name="imp-mode" value="add" checked> Ajouter aux listes existantes</label><label class="check"><input type="radio" name="imp-mode" value="replace"> Remplacer les listes des classes concernées</label></div>
    <div id="imp-prev"></div>`,
    actions: [{ label: 'Annuler' }, { label: `${ic('upload')}Importer`, cls: 'primary', onClick: async (close, m) => {
      if (!parsed || !parsed.ok.length) { toast('Aucune ligne valide à importer.', 'bad'); return false; }
      const mode = $('input[name=imp-mode]:checked', m).value; const touched = new Set();
      await withBusy('Import en cours…', async () => {
        for (const r of parsed.ok) { const cl = S.classes[r.cid]; if (mode === 'replace' && !touched.has(cl.id)) { cl.students = []; } touched.add(cl.id);
          const dup = (cl.students || []).find(x => (r.mat && x.mat === r.mat) || (norm(fullName(x)) === norm(fullName(r)) && (x.dn || '') === (r.dn || '')));
          if (dup) Object.assign(dup, { ...r, id: dup.id, cid: undefined }); else cl.students = [...(cl.students || []), { id: uid('s'), mat: r.mat, nom: r.nom, prenom: r.prenom, sexe: r.sexe, dn: r.dn, statut: r.statut }];
          (cl.students || []).forEach(x => delete x.cid); }
        for (const id of touched) await saveClass(S.classes[id]);
        audit('Import élèves', `${parsed.ok.length} ligne(s) dans ${[...touched].map(id => S.classes[id].nom).join(', ')} (${mode === 'replace' ? 'remplacement' : 'ajout'})`);
      });
      toast(`${parsed.ok.length} élève(s) importé(s).`, 'ok'); close(); render(); } }] });
  $('#imp-file', md.el).onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const { rows } = await readSheet(f); const ok = [], bad = [];
      const clsByName = {}; Object.values(S.classes).forEach(x => clsByName[norm(x.nom).replace(/\s/g, '')] = x);
      rows.forEach((row, i) => {
        let nom = pickCol(row, ['nom', 'noms', 'name']); let prenom = pickCol(row, ['prenom', 'prenoms', 'prenomss', 'firstname']);
        const full = pickCol(row, ['nomsetprenoms', 'nometprenoms', 'nomprenoms', 'nomcomplet', 'eleve']);
        if (!nom && full) { const parts = full.trim().split(/\s+/); const up = parts.filter(p => p === p.toUpperCase() && /\p{L}/u.test(p)); if (up.length && up.length < parts.length) { nom = up.join(' '); prenom = parts.filter(p => !up.includes(p)).join(' '); } else { nom = parts[0]; prenom = parts.slice(1).join(' '); } }
        if (!nom) { if (Object.values(row).some(v => String(v).trim())) bad.push(`Ligne ${i + 2} : nom manquant`); return; }
        const cname = pickCol(row, ['classe', 'class', 'division']);
        let cl = c; if (cname) { cl = clsByName[norm(cname).replace(/\s/g, '')]; if (!cl) { bad.push(`Ligne ${i + 2} : classe « ${cname} » inconnue`); return; } }
        let sx = pickCol(row, ['sexe', 'genre', 's']).toUpperCase(); sx = sx.startsWith('F') ? 'F' : (sx.startsWith('M') || sx.startsWith('G') ? 'M' : '');
        let dn = pickCol(row, ['datedenaissance', 'naissance', 'datenaissance', 'ne', 'nele', 'dn']);
        const mDn = dn.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/); if (mDn) dn = `${mDn[3].length === 2 ? '20' + mDn[3] : mDn[3]}-${pad(mDn[2], 2)}-${pad(mDn[1], 2)}`; else if (!/^\d{4}-\d{2}-\d{2}/.test(dn)) dn = ''; else dn = dn.slice(0, 10);
        const statut = /redoubl/i.test(pickCol(row, ['statut', 'redoublant', 'status'])) ? 'redoublant' : 'nouveau';
        ok.push({ cid: cl.id, mat: pickCol(row, ['matricule', 'mat', 'numero', 'id']), nom: upperName(nom), prenom: capName(prenom), sexe: sx, dn, statut });
      });
      parsed = { ok, bad };
      const by = {}; ok.forEach(r => by[r.cid] = (by[r.cid] || 0) + 1);
      $('#imp-prev', md.el).innerHTML = `<div class="callout ${bad.length ? 'warn' : 'ok'}">${ok.length} ligne(s) valide(s) réparties ainsi : ${Object.entries(by).map(([k, n]) => `<b>${esc(S.classes[k].nom)}</b> ${n}`).join(' · ') || '—'}${bad.length ? `<br>${bad.length} ligne(s) écartée(s) : ${esc(bad.slice(0, 6).join(' ; '))}${bad.length > 6 ? '…' : ''}` : ''}</div>
        <div class="tw" style="max-height:260px;overflow:auto"><table class="t"><thead><tr><th>Classe</th><th>Matricule</th><th>Nom</th><th>Prénoms</th><th>S</th><th>Naissance</th></tr></thead><tbody>${ok.slice(0, 40).map(r => `<tr><td class="mono">${esc(S.classes[r.cid].nom)}</td><td class="mono small">${esc(r.mat)}</td><td>${esc(r.nom)}</td><td>${esc(r.prenom)}</td><td>${esc(r.sexe)}</td><td class="small">${esc(r.dn)}</td></tr>`).join('')}</tbody></table></div>`;
    } catch (e) { $('#imp-prev', md.el).innerHTML = `<div class="callout bad">${esc(e.message)}</div>`; }
  };
}

/* ---------- Matières et enseignants ---------- */
V.matieres = el => {
  const tab = S.ui.sel.mtab || 'programme';
  el.innerHTML = pageHead('Matières et enseignants', 'Programme de chaque classe, coefficients et enseignant responsable. Le code à deux chiffres de chaque matière est inscrit dans le code-barres.') +
    `<div class="tabs">${[['programme', 'Programme des classes'], ['vue', 'Vue d’ensemble'], ['enseignants', 'Enseignants'], ['catalogue', 'Catalogue des matières']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="mt-body" class="stack"></div>`;
  $$('[data-tab]', el).forEach(b => b.onclick = () => { S.ui.sel.mtab = b.dataset.tab; render(); });
  const body = $('#mt-body', el);
  ({ programme: tabProgramme, vue: tabVue, enseignants: tabEnseignants, catalogue: tabCatalogue })[tab](body);
};
function tabProgramme(body) {
  const lvIds = levelsInScope(); const all = lvIds.flatMap(classesOf); if (!all.length) { body.innerHTML = '<div class="empty">Aucune classe.</div>'; return; }
  let cid = S.ui.sel.pcls; if (!all.some(c => c.id === cid)) cid = all[0].id; S.ui.sel.pcls = cid; const c = S.classes[cid];
  body.innerHTML = `<div class="panel"><header><label class="f" style="flex-direction:row;align-items:center;gap:8px">Classe <select class="in" id="pc" style="width:auto">${optList(all.map(x => [x.id, `${levelById(x.level).roman} · ${x.nom}`]), cid)}</select></label><span class="spacer"></span>
    <button class="btn sm" data-act="copy">Appliquer ce programme à tout le pôle</button><button class="btn sm primary" data-act="save">${ic('check')}Enregistrer</button></header>
    <div class="tw"><table class="t"><thead><tr><th class="c">Au programme</th><th>Code</th><th>Matière</th><th class="c">Coef.</th><th>Enseignant</th></tr></thead><tbody>${S.subjects.map(s => { const a = c.subjects.find(x => x.m === s.code); return `<tr data-m="${s.code}"><td class="c"><input type="checkbox" class="pm" ${a ? 'checked' : ''} aria-label="${esc(s.nom)}"></td><td class="mono">${s.code}</td><td><b>${esc(s.abbr)}</b> · ${esc(s.nom)}</td><td class="c"><input class="in pcoef num" type="number" min="0" max="10" step="0.5" value="${a ? a.coef : 2}" style="width:70px"></td><td><select class="in pprof">${teacherOpts(a?.prof)}</select></td></tr>`; }).join('')}</tbody></table></div></div>`;
  $('#pc', body).onchange = ev => { S.ui.sel.pcls = ev.target.value; render(); };
  const collect = () => $$('tr[data-m]', body).filter(tr => $('.pm', tr).checked).map(tr => ({ m: tr.dataset.m, coef: +$('.pcoef', tr).value || 0, prof: $('.pprof', tr).value }));
  $('[data-act=save]', body).onclick = async () => { c.subjects = collect(); await saveClass(c); audit('Programme', `${c.nom} : ${c.subjects.length} matières`); toast('Programme enregistré.', 'ok'); };
  $('[data-act=copy]', body).onclick = async () => { const same = Object.values(S.classes).filter(x => x.level === c.level && x.pole === c.pole && x.id !== c.id); if (!(await confirmBox('Appliquer au pôle', `Copier la liste des matières et les coefficients de ${esc(c.nom)} vers ${same.map(x => esc(x.nom)).join(', ') || 'aucune autre classe'} ? Les enseignants déjà attribués sont conservés.`))) return; const src = collect(); c.subjects = src; await saveClass(c); for (const x of same) { x.subjects = src.map(s => ({ ...s, prof: x.subjects.find(y => y.m === s.m)?.prof || '' })); await saveClass(x); } audit('Programme', `Programme de ${c.nom} appliqué à ${same.length} classe(s)`); toast('Programme appliqué.', 'ok'); };
}
function tabVue(body) {
  const lvIds = levelsInScope();
  body.innerHTML = lvIds.map(lv => { const cls = classesOf(lv); const subs = S.subjects.filter(s => cls.some(c => c.subjects.some(x => x.m === s.code)));
    return `<div class="panel"><header><h3>${levelById(lv).nom}</h3><span class="small muted">enseignant et coefficient par classe</span></header><div class="tw"><table class="t"><thead><tr><th>Matière</th>${cls.map(c => `<th class="c mono">${esc(c.nom)}</th>`).join('')}</tr></thead><tbody>${subs.map(s => `<tr><td><b>${esc(s.abbr)}</b></td>${cls.map(c => { const a = c.subjects.find(x => x.m === s.code); return `<td class="c small">${a ? `${a.prof ? esc(teacherById(a.prof)?.nom || '?') : '<span style="color:var(--warn)">à pourvoir</span>'}<br><span class="muted">coef. ${a.coef}</span>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div>`; }).join('');
}
function tabEnseignants(body) {
  const load = {}; Object.values(S.classes).forEach(c => c.subjects.forEach(s => { if (s.prof) { (load[s.prof] = load[s.prof] || []).push(`${subjByCode(s.m).abbr} ${c.nom}`); } }));
  body.innerHTML = `<div class="panel"><header><h3>${S.teachers.length} enseignant(s)</h3><button class="btn sm" data-act="tpl">${ic('download')}Modèle</button><button class="btn sm" data-act="imp">${ic('upload')}Importer</button><button class="btn sm primary" data-act="add">${ic('plus')}Ajouter</button></header>
    <div class="tw"><table class="t"><thead><tr><th>Enseignant</th><th>Téléphone</th><th>Classes et matières</th><th></th></tr></thead><tbody>${S.teachers.slice().sort((a, b) => a.nom.localeCompare(b.nom)).map(t => `<tr><td><b>${esc(teacherName(t.id))}</b></td><td class="mono small">${esc(t.tel || '')}</td><td class="small">${esc((load[t.id] || []).join(', ')) || '<span class="muted">aucune attribution</span>'}</td><td class="r"><button class="btn sm ghost" data-ed="${t.id}">${ic('edit')}</button></td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Aucun enseignant enregistré. Ajoutez-les ou importez un fichier (Civilité, Nom, Prénoms, Téléphone).</div></td></tr>'}</tbody></table></div></div>`;
  const form = t => { const isNew = !t; t = t || { id: uid('p'), civ: 'M.', nom: '', prenom: '', tel: '' };
    openModal({ title: isNew ? 'Nouvel enseignant' : teacherName(t.id), body: `<div class="fgrid"><label class="f">Civilité<select class="in" id="t-civ">${optList([['M.', 'M.'], ['Mme', 'Mme'], ['Mlle', 'Mlle'], ['Abbé', 'Abbé'], ['Sr', 'Sœur'], ['Fr', 'Frère'], ['Dr', 'Dr']], t.civ)}</select></label><label class="f">Nom<input class="in" id="t-nom" value="${esc(t.nom)}"></label><label class="f">Prénoms<input class="in" id="t-pre" value="${esc(t.prenom)}"></label><label class="f">Téléphone<input class="in" id="t-tel" value="${esc(t.tel || '')}"></label></div>`,
      actions: [...(isNew ? [] : [{ label: 'Supprimer', cls: 'danger', onClick: async close => { if (load[t.id]?.length && !(await confirmBox('Enseignant attribué', `${esc(teacherName(t.id))} est attribué à ${load[t.id].length} classe(s). Les attributions seront vidées.`, 'Supprimer', true))) return false; S.teachers = S.teachers.filter(x => x.id !== t.id); for (const c of Object.values(S.classes)) { let ch = false; c.subjects.forEach(s => { if (s.prof === t.id) { s.prof = ''; ch = true; } }); if (c.titulaire === t.id) { c.titulaire = ''; ch = true; } if (ch) await saveClass(c); } await saveTeachers(); close(); render(); } }]),
        { label: 'Annuler' }, { label: 'Enregistrer', cls: 'primary', onClick: async (close, m) => { t.civ = $('#t-civ', m).value; t.nom = upperName($('#t-nom', m).value); t.prenom = capName($('#t-pre', m).value); t.tel = $('#t-tel', m).value.trim(); if (!t.nom) { toast('Nom obligatoire.', 'bad'); return false; } if (isNew) S.teachers.push(t); await saveTeachers(); audit('Enseignants', (isNew ? 'Ajout ' : 'Modification ') + teacherName(t.id)); close(); render(); } }] }); };
  $('[data-act=add]', body).onclick = () => form(null);
  $$('[data-ed]', body).forEach(b => b.onclick = () => form(teacherById(b.dataset.ed)));
  $('[data-act=tpl]', body).onclick = () => xlsxSave('modele-enseignants.xlsx', [{ name: 'Enseignants', rows: [['Civilité', 'Nom', 'Prénoms', 'Téléphone'], ['M.', 'NOM', 'Prénom', '6XXXXXXXX']], cols: [10, 22, 24, 14] }]);
  $('[data-act=imp]', body).onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv,.ods'; inp.onchange = async () => { try { const { rows } = await readSheet(inp.files[0]); let n = 0; rows.forEach(r => { const nom = upperName(pickCol(r, ['nom', 'noms'])); if (!nom) return; const prenom = capName(pickCol(r, ['prenom', 'prenoms'])); if (S.teachers.some(t => t.nom === nom && norm(t.prenom) === norm(prenom))) return; S.teachers.push({ id: uid('p'), civ: pickCol(r, ['civilite', 'civ', 'titre']) || 'M.', nom, prenom, tel: pickCol(r, ['telephone', 'tel', 'contact']) }); n++; }); await saveTeachers(); audit('Enseignants', `Import de ${n} enseignant(s)`); toast(`${n} enseignant(s) ajouté(s).`, 'ok'); render(); } catch (e) { toast(e.message, 'bad'); } }; inp.click(); };
}
function tabCatalogue(body) {
  const used = new Set(Object.values(S.classes).flatMap(c => c.subjects.map(s => s.m)));
  body.innerHTML = `<div class="callout">Le code à deux chiffres entre dans chaque code-barres. Ne le modifiez pas en cours d’année pour une matière déjà évaluée.</div>
  <div class="panel"><header><h3>${S.subjects.length} matières</h3><button class="btn sm" data-act="add">${ic('plus')}Ajouter</button><button class="btn sm primary" data-act="save">${ic('check')}Enregistrer</button></header>
  <div class="tw"><table class="t"><thead><tr><th>Code</th><th>Abréviation</th><th>Intitulé</th><th>Utilisation</th><th></th></tr></thead><tbody>${S.subjects.map((s, i) => `<tr data-i="${i}"><td><input class="in mono sc" value="${esc(s.code)}" maxlength="2" style="width:60px"></td><td><input class="in sa" value="${esc(s.abbr)}" style="width:110px"></td><td><input class="in sn" value="${esc(s.nom)}"></td><td class="small">${used.has(s.code) ? '<span class="pill ok plain">au programme</span>' : '<span class="muted">non utilisée</span>'}</td><td class="r">${used.has(s.code) ? '' : `<button class="btn sm ghost" data-del="${i}" aria-label="Supprimer">${ic('trash')}</button>`}</td></tr>`).join('')}</tbody></table></div></div>`;
  $('[data-act=add]', body).onclick = () => { const codes = S.subjects.map(s => +s.code); let n = 1; while (codes.includes(n)) n++; S.subjects.push({ code: pad(n, 2), abbr: 'NOUV', nom: 'Nouvelle matière' }); render(); };
  $$('[data-del]', body).forEach(b => b.onclick = async () => { S.subjects.splice(+b.dataset.del, 1); await saveSubjects(); render(); });
  $('[data-act=save]', body).onclick = async () => {
    const next = $$('tr[data-i]', body).map(tr => ({ code: pad(($('.sc', tr).value || '').replace(/\D/g, ''), 2), abbr: $('.sa', tr).value.trim().toUpperCase(), nom: $('.sn', tr).value.trim() }));
    const dup = next.map(s => s.code).filter((c, i, a) => a.indexOf(c) !== i);
    if (dup.length || next.some(s => s.code === '00' || !s.abbr)) { toast('Codes en double, nuls ou abréviation vide : corrigez avant d’enregistrer.', 'bad'); return; }
    S.subjects = next.sort((a, b) => a.code.localeCompare(b.code)); await saveSubjects(); audit('Catalogue', 'Catalogue des matières modifié'); toast('Catalogue enregistré.', 'ok'); render(); };
}

/* ---------- Salles ---------- */
V.salles = el => {
  const cap = S.rooms.reduce((a, r) => a + (+r.capacite || 0), 0);
  const upcoming = Object.values(S.evals).filter(e => e.placement && e.date >= addDays(todayISO(), -1)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 30);
  el.innerHTML = pageHead('Salles de composition', 'Les salles servent à répartir les élèves et à numéroter les tables. Elles sont communes aux trois préfectures ; l’application signale une salle réservée deux fois sur le même créneau.',
    `<button class="btn" data-act="imp">${ic('upload')}Importer</button><button class="btn primary" data-act="add">${ic('plus')}Ajouter une salle</button>`) + `
    <div class="grid g4">${kpi(S.rooms.length, 'Salles')}${kpi(cap.toLocaleString('fr-FR'), 'Places au total')}${LEVELS.map(l => { const n = classesOf(l.id).reduce((a, c) => a + studentsOf(c).length, 0); return kpi(n, `Élèves de ${l.nom}`, n > cap ? '<span style="color:var(--bad)">capacité insuffisante pour une épreuve commune</span>' : `${cap ? Math.round(n * 100 / cap) : 0} % de la capacité`); }).join('')}</div>
    <div class="grid g2"><div class="tw"><table class="t"><thead><tr><th>Salle</th><th>Bâtiment</th><th class="r">Capacité</th><th></th></tr></thead><tbody>${S.rooms.map(r => `<tr><td><b>${esc(r.nom)}</b></td><td>${esc(r.batiment || '')}</td><td class="r num">${r.capacite}</td><td class="r"><button class="btn sm ghost" data-ed="${r.id}">${ic('edit')}</button></td></tr>`).join('') || '<tr><td colspan="4"><div class="empty">Aucune salle. Ajoutez les salles de composition avec leur nombre de places.</div></td></tr>'}</tbody></table></div>
    <div class="panel"><header><h3>Occupation à venir</h3></header>${upcoming.length ? `<div class="timeline">${upcoming.map(e => `<div class="it"><span class="d">${fmtDate(e.date, 'dm')}<br>${e.start}–${e.end}</span><span><b>${esc(subjByCode(e.subj).abbr)}</b> ${levelById(e.level).roman} · <span class="small">${e.placement.rooms.map(r => esc(r.nom)).join(', ')}</span></span></div>`).join('')}</div>` : '<p class="muted small">Aucune salle réservée.</p>'}</div></div>`;
  const form = r => { const isNew = !r; r = r || { id: uid('r'), nom: '', capacite: 40, batiment: '' };
    openModal({ title: isNew ? 'Nouvelle salle' : r.nom, body: `<div class="fgrid"><label class="f">Nom<input class="in" id="r-n" value="${esc(r.nom)}" placeholder="Salle B4"></label><label class="f">Capacité (places assises)<input class="in num" type="number" min="1" id="r-c" value="${r.capacite}"></label><label class="f">Bâtiment<input class="in" id="r-b" value="${esc(r.batiment || '')}"></label></div>`,
      actions: [...(isNew ? [] : [{ label: 'Supprimer', cls: 'danger', onClick: async close => { S.rooms = S.rooms.filter(x => x.id !== r.id); await saveRooms(); close(); render(); } }]), { label: 'Annuler' }, { label: 'Enregistrer', cls: 'primary', onClick: async (close, m) => { r.nom = $('#r-n', m).value.trim(); r.capacite = +$('#r-c', m).value || 0; r.batiment = $('#r-b', m).value.trim(); if (!r.nom || !r.capacite) { toast('Nom et capacité obligatoires.', 'bad'); return false; } if (isNew) S.rooms.push(r); S.rooms.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true })); await saveRooms(); audit('Salles', (isNew ? 'Ajout ' : 'Modification ') + r.nom); close(); render(); } }] }); };
  $('[data-act=add]', el).onclick = () => form(null);
  $$('[data-ed]', el).forEach(b => b.onclick = () => form(roomById(b.dataset.ed)));
  $('[data-act=imp]', el).onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv,.ods'; inp.onchange = async () => { try { const { rows } = await readSheet(inp.files[0]); let n = 0; rows.forEach(x => { const nom = pickCol(x, ['salle', 'nom']); const cap = +pickCol(x, ['capacite', 'places']); if (!nom || !cap || S.rooms.some(r => norm(r.nom) === norm(nom))) return; S.rooms.push({ id: uid('r'), nom, capacite: cap, batiment: pickCol(x, ['batiment', 'bloc']) }); n++; }); await saveRooms(); toast(`${n} salle(s) ajoutée(s).`, 'ok'); render(); } catch (e) { toast(e.message, 'bad'); } }; inp.click(); };
};
