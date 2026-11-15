/* =====================================================================
   Planning des évaluations : liste, calendrier, programmation, import
   ===================================================================== */
V.planning = el => {
  const lvIds = levelsInScope(); const pv = S.ui.sel.pview || 'liste'; const fs = S.ui.sel.psit ?? curSit();
  let evs = Object.values(S.evals).filter(e => lvIds.includes(e.level) && (!fs || e.sit === +fs));
  evs = sortEvals(evs);
  el.innerHTML = pageHead('Planning des évaluations', 'Chaque évaluation fixe le trimestre, la situation, la matière, les classes, la date et le créneau. Les chevauchements de classes et de salles sont contrôlés.',
    `<button class="btn" data-act="tpl">${ic('download')}Modèle</button><button class="btn" data-act="imp">${ic('upload')}Importer</button><button class="btn" data-act="wiz">${ic('cal')}Programmer une situation</button><button class="btn primary" data-act="new">${ic('plus')}Nouvelle évaluation</button>`) + `
    <div class="row"><div class="lvl tabs" style="border:0">${[['liste', 'Liste'], ['cal', 'Calendrier']].map(([k, l]) => `<button data-pv="${k}" class="${pv === k ? 'on' : ''}">${l}</button>`).join('')}</div><span class="spacer"></span>
      <label class="f" style="flex-direction:row;align-items:center;gap:6px">Situation<select class="in" id="psit" style="width:auto"><option value="0" ${!+fs ? 'selected' : ''}>Toutes</option>${sitOpts(fs)}</select></label>
      <button class="btn" data-act="pdf">${ic('print')}Planning PDF</button></div>
    <div id="pl-body"></div>`;
  const body = $('#pl-body', el);
  if (pv === 'cal') body.innerHTML = calendarHTML(evs);
  else if (!evs.length) body.innerHTML = `<div class="panel empty"><h3>Aucune évaluation pour ce filtre</h3><p>Programmez toute une situation en une fois, importez un planning Excel ou créez une évaluation.</p><button class="btn primary" data-act="wiz">${ic('cal')}Programmer la situation ${fs || curSit()}</button></div>`;
  else {
    const byDate = {}; evs.forEach(e => (byDate[e.date] = byDate[e.date] || []).push(e));
    body.innerHTML = Object.entries(byDate).map(([d, list]) => `<div class="stack" style="gap:6px;margin-bottom:14px"><h3 class="cap">${fmtDate(d)}</h3><div class="tw"><table class="t"><thead><tr><th>Créneau</th><th>Durée</th><th>Niveau</th><th>T / S</th><th>Matière</th><th>Classes</th><th class="r">Élèves</th><th>Salles</th><th>Statut</th><th></th></tr></thead><tbody>${list.map(e => `<tr><td class="mono small">${e.start} – ${e.end}</td><td class="small">${duree(e.start, e.end)}</td><td>${levelById(e.level).roman}</td><td class="small">T${e.trim} S${e.sit}</td><td><b>${esc(subjByCode(e.subj).nom)}</b></td><td class="small">${esc(evalClassNames(e))}</td><td class="r num">${e.placement ? e.placement.list.length : candidatesOf(e).length}</td><td class="small">${e.placement ? e.placement.rooms.map(r => esc(r.nom)).join(', ') : '<span class="muted">non réparti</span>'}</td><td>${statusPill(e.status)}</td><td class="r"><button class="btn sm" data-eval="${e.id}">Ouvrir</button></td></tr>`).join('')}</tbody></table></div></div>`).join('');
  }
  $$('[data-pv]', el).forEach(b => b.onclick = () => { S.ui.sel.pview = b.dataset.pv; render(); });
  $('#psit', el).onchange = ev => { S.ui.sel.psit = +ev.target.value; render(); };
  $$('[data-eval]', el).forEach(b => b.onclick = () => openEvalDetail(b.dataset.eval));
  $$('[data-mo]', el).forEach(b => b.onclick = () => { S.ui.sel.month = b.dataset.mo; render(); });
  $$('[data-act]', el).forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === 'new') openEvalForm(null, { sit: fs || curSit() });
    if (a === 'wiz') situationWizard(+fs || curSit());
    if (a === 'imp') importPlanning();
    if (a === 'tpl') xlsxSave('modele-planning.xlsx', [{ name: 'Planning', rows: [['Niveau', 'Situation', 'Matière', 'Classes', 'Date', 'Début', 'Fin'], ['Seconde', 2, 'MATH', 'Toutes', '2026-11-09', '07:30', '09:30'], ['Première', 2, 'FRAN', 'PC1, PC2, PD1', '2026-11-09', '10:00', '12:00']], cols: [12, 10, 12, 26, 12, 8, 8] }]);
    if (a === 'pdf') runPdf(`planning-${fileSafe(scopeLabel())}.pdf`, 'Planning des évaluations', doc => addPlanning(doc, lvIds, { sit: +fs || null }), 'l');
  });
};
function calendarHTML(evs) {
  const ref = S.ui.sel.month || (evs[0]?.date || todayISO()).slice(0, 7);
  const [y, m] = ref.split('-').map(Number); const first = new Date(y, m - 1, 1); const startDow = (first.getDay() + 6) % 7;
  const prev = `${m === 1 ? y - 1 : y}-${pad(m === 1 ? 12 : m - 1, 2)}`, next = `${m === 12 ? y + 1 : y}-${pad(m === 12 ? 1 : m + 1, 2)}`;
  const cells = []; for (let i = 0; i < 42; i++) { const d = new Date(y, m - 1, 1 - startDow + i); cells.push(`${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`); }
  const all = Object.values(S.evals).filter(e => levelsInScope().includes(e.level));
  return `<div class="panel"><header><button class="btn sm" data-mo="${prev}">‹</button><h3 class="cap" style="text-align:center">${first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3><button class="btn sm" data-mo="${next}">›</button></header><div style="overflow-x:auto"><div class="cal" style="min-width:640px">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => `<div class="h">${d}</div>`).join('')}${cells.map(d => { const list = all.filter(e => e.date === d).sort((a, b) => a.start.localeCompare(b.start)); return `<div class="d ${d.slice(0, 7) !== ref ? 'out' : ''} ${d === todayISO() ? 'today' : ''}"><span class="n">${+d.slice(8)}</span>${list.slice(0, 5).map(e => `<span class="ev" data-eval="${e.id}" title="${esc(evalLabel(e))} · ${esc(evalClassNames(e))}">${e.start} ${esc(subjByCode(e.subj).abbr)} ${levelById(e.level).roman}</span>`).join('')}${list.length > 5 ? `<span class="muted">+${list.length - 5}</span>` : ''}</div>`; }).join('')}</div></div></div>`;
}
function openEvalForm(e, preset = {}) {
  const isNew = !e; const lv0 = e?.level || preset.level || (S.ui.level !== 'all' ? S.ui.level : LEVELS[0].id);
  const d = e || { level: lv0, subj: preset.subj || '', sit: preset.sit || curSit(), date: preset.date || todayISO(), start: '07:30', end: '09:30', classes: preset.classes || [], bareme: 20, double: false, consignes: '', deadline: '' };
  const hasMarks = e && Object.keys(e.marks || {}).length > 0;
  const md = openModal({ title: isNew ? 'Nouvelle évaluation' : `Modifier · ${evalLabel(e)}`, wide: true, body: `
    ${hasMarks ? '<div class="callout warn">Des notes sont déjà saisies : la matière, la situation et les classes sont verrouillées.</div>' : ''}
    <div class="fgrid">
      <label class="f">Niveau<select class="in" id="e-lv" ${e ? 'disabled' : ''}>${levelOpts(d.level)}</select></label>
      <label class="f">Situation<select class="in" id="e-sit" ${hasMarks ? 'disabled' : ''}>${sitOpts(d.sit)}</select></label>
      <label class="f">Matière<select class="in" id="e-subj" ${hasMarks ? 'disabled' : ''}></select></label>
      <label class="f">Date<input class="in" type="date" id="e-date" value="${d.date}"></label>
      <label class="f">Début<input class="in" type="time" id="e-start" value="${d.start}"></label>
      <label class="f">Fin<input class="in" type="time" id="e-end" value="${d.end}"></label>
      <label class="f">Barème<select class="in" id="e-bar">${optList([[20, 'Sur 20'], [10, 'Sur 10'], [40, 'Sur 40'], [100, 'Sur 100']], d.bareme)}</select></label>
      <label class="f">Échéance de saisie<input class="in" type="date" id="e-dl" value="${d.deadline || ''}"></label>
    </div>
    <label class="check"><input type="checkbox" id="e-dbl" ${d.double ? 'checked' : ''}> Double correction (deux notes par copie, arbitrage si l’écart atteint ${S.settings.ecartDouble} points)</label>
    <div><div class="row between"><b>Classes concernées</b><span class="row"><button class="btn sm" data-all>Toutes celles qui ont la matière</button><button class="btn sm ghost" data-none>Aucune</button></span></div><div id="e-cls" class="row" style="margin-top:8px"></div></div>
    <label class="f">Consignes pour les surveillants<textarea class="in" id="e-cons" placeholder="Documents autorisés, calculatrice, papier fourni…">${esc(d.consignes || '')}</textarea></label>
    <p class="small muted" id="e-warn"></p>`,
    actions: [{ label: 'Annuler' }, { label: isNew ? 'Créer l’évaluation' : 'Enregistrer', cls: 'primary', onClick: async (close, m) => {
      const lv = $('#e-lv', m).value, subj = $('#e-subj', m).value, sit = +$('#e-sit', m).value;
      const classes = $$('#e-cls input:checked', m).map(i => i.value);
      const date = $('#e-date', m).value, start = $('#e-start', m).value, end = $('#e-end', m).value;
      if (!subj || !classes.length || !date || !start || !end) { toast('Matière, classes, date et créneau sont obligatoires.', 'bad'); return false; }
      if (minutes(end) <= minutes(start)) { toast('L’heure de fin doit suivre l’heure de début.', 'bad'); return false; }
      const probe = { id: e?.id || '_new', date, start, end, classes };
      const clash = Object.values(S.evals).filter(o => o.id !== probe.id && overlap(o, probe) && o.classes.some(c => classes.includes(c)));
      if (clash.length) { toast(`Conflit : ${clash.map(o => evalShort(o) + ' (' + o.start + ')').join(', ')} occupe déjà une de ces classes.`, 'bad'); return false; }
      if (isNew) { const ne = newEval({ level: lv, subj, trim: trimOfSit(sit), sit, date, start, end, classes, bareme: $('#e-bar', m).value, double: $('#e-dbl', m).checked, consignes: $('#e-cons', m).value }); if ($('#e-dl', m).value) ne.deadline = $('#e-dl', m).value; S.evals[ne.id] = ne; await saveEval(ne); audit('Planning', `Création ${evalShort(ne)} ${levelById(lv).roman} le ${date}`, lv); }
      else {
        const changedCls = classes.join() !== e.classes.join();
        if (!hasMarks) { e.subj = subj; e.sit = sit; e.trim = trimOfSit(sit); if (changedCls && e.placement) { e.placement = null; e.status = 'planifiee'; toast('Classes modifiées : la répartition et les codes doivent être regénérés.'); } e.classes = classes; }
        Object.assign(e, { date, start, end, bareme: +$('#e-bar', m).value, double: $('#e-dbl', m).checked, consignes: $('#e-cons', m).value, deadline: $('#e-dl', m).value || addDays(date, +S.settings.delaiSaisie || 7) });
        await saveEval(e); audit('Planning', `Modification ${evalShort(e)} ${levelById(e.level).roman}`, e.level);
      }
      close(); render(); } }] });
  const m = md.el;
  const fillSubj = () => { const lv = $('#e-lv', m).value; const cls = classesOf(lv); const subs = S.subjects.filter(s => cls.some(c => c.subjects.some(x => x.m === s.code))); $('#e-subj', m).innerHTML = '<option value="">— choisir —</option>' + subjOpts(d.subj, subs); };
  const fillCls = (auto) => { const lv = $('#e-lv', m).value; const subj = $('#e-subj', m).value; const cur = auto ? null : new Set($$('#e-cls input:checked', m).map(i => i.value)); $('#e-cls', m).innerHTML = classesOf(lv).map(c => { const has = c.subjects.some(x => x.m === subj); const on = cur ? cur.has(c.id) : (d.classes.length ? d.classes.includes(c.id) : has); return `<label class="check pill ${has ? 'neutral' : 'warn'} plain" style="padding:4px 10px"><input type="checkbox" value="${c.id}" ${on ? 'checked' : ''} ${hasMarks ? 'disabled' : ''}> <span class="mono">${esc(c.nom)}</span> <span class="tiny muted">${studentsOf(c).length}</span></label>`; }).join(''); };
  fillSubj(); fillCls(false);
  $('#e-lv', m).onchange = () => { d.classes = []; fillSubj(); fillCls(true); };
  $('#e-subj', m).onchange = () => { d.classes = []; fillCls(true); const s = $('#e-subj', m).value; const lv = $('#e-lv', m).value; const miss = classesOf(lv).filter(c => !c.subjects.some(x => x.m === s)); $('#e-warn', m).textContent = miss.length && s ? `Classes sans cette matière au programme : ${miss.map(c => c.nom).join(', ')}.` : ''; };
  $('[data-all]', m).onclick = () => { const s = $('#e-subj', m).value; $$('#e-cls input', m).forEach(i => i.checked = S.classes[i.value].subjects.some(x => x.m === s)); };
  $('[data-none]', m).onclick = () => $$('#e-cls input', m).forEach(i => i.checked = false);
}
function openEvalDetail(eid) {
  const e = S.evals[eid]; if (!e) return; const p = progressOf(e);
  openModal({ title: `${evalLabel(e)} · ${levelById(e.level).nom}`, wide: true, body: `
    <div class="row">${statusPill(e.status)}${e.double ? '<span class="pill neutral plain">double correction</span>' : ''}<span class="pill neutral plain">barème /${e.bareme}</span>${e.anon?.lifted ? `<span class="pill ok plain">anonymat levé le ${fmtDT(e.anon.at)}</span>` : '<span class="pill accent plain">copies anonymes</span>'}</div>
    <div class="copy-card"><div><span>Date</span><b style="font-size:14px">${fmtDate(e.date)}</b></div><div><span>Créneau</span><b>${e.start}–${e.end}</b></div><div><span>Durée</span><b>${duree(e.start, e.end)}</b></div><div><span>Élèves</span><b>${e.placement ? p.total : candidatesOf(e).length}</b></div><div><span>Notes saisies</span><b>${p.done}/${p.total}</b></div><div><span>Échéance</span><b style="font-size:14px">${fmtDate(e.deadline, 'short')}</b></div></div>
    <div><b>Classes :</b> ${esc(evalClassNames(e))}</div>
    <div class="tw"><table class="t"><thead><tr><th>Classe</th><th>Enseignant</th><th class="r">Effectif</th></tr></thead><tbody>${e.classes.map(cid => `<tr><td class="mono">${esc(S.classes[cid]?.nom)}</td><td>${esc(teacherOf(cid, e.subj)) || '<span class="muted">non attribué</span>'}</td><td class="r num">${S.classes[cid] ? studentsOf(S.classes[cid]).length : 0}</td></tr>`).join('')}</tbody></table></div>
    ${e.placement ? `<div><b>Salles :</b> ${e.placement.rooms.map(r => `${esc(r.nom)} (tables ${pad(r.from, 3)}–${pad(r.to, 3)})`).join(' · ')}</div>` : '<div class="callout warn">Répartition en salles et codes-barres pas encore générés.</div>'}
    ${e.consignes ? `<div class="callout">${esc(e.consignes)}</div>` : ''}`,
    actions: [
      { label: `${ic('trash')}Supprimer`, cls: 'danger', onClick: async close => { if (Object.keys(e.marks || {}).length && !(await requireCoord('Supprimer une épreuve qui contient des notes.'))) return false; if (!(await confirmBox('Supprimer l’évaluation', `Supprimer définitivement ${esc(evalLabel(e))} (${levelById(e.level).nom}) ?`, 'Supprimer', true))) return false; await S.store.delete('evals/' + e.id); delete S.evals[e.id]; audit('Planning', `Suppression ${evalShort(e)} ${levelById(e.level).roman}`, e.level); close(); render(); } },
      { label: `${ic('edit')}Modifier`, onClick: close => { close(); openEvalForm(e); } },
      { label: `${ic('barcode')}Préparer`, onClick: close => { close(); S.ui.sel.eval = e.id; if (S.ui.level !== 'all' && S.ui.level !== e.level) S.ui.level = e.level; go('epreuves'); } },
      { label: `${ic('scan')}Saisir`, onClick: close => { close(); S.ui.sel.seval = e.id; go('saisie'); } },
      { label: `${ic('unlock')}Résultats`, cls: 'primary', onClick: close => { close(); S.ui.sel.reval = e.id; go('resultats'); } }] });
}
function situationWizard(sit) {
  const lv0 = S.ui.level !== 'all' ? S.ui.level : LEVELS[0].id;
  const slots = [['07:30', '09:30'], ['10:00', '12:00'], ['13:00', '15:00'], ['15:15', '17:15']];
  const md = openModal({ title: 'Programmer une situation complète', wide: true, body: `
    <p class="small muted">Une ligne par matière : l’évaluation est créée pour toutes les classes du niveau qui ont cette matière au programme. Les dates se remplissent automatiquement à partir du premier jour, en sautant samedi et dimanche.</p>
    <div class="fgrid"><label class="f">Niveau<select class="in" id="w-lv">${levelOpts(lv0)}</select></label><label class="f">Situation<select class="in" id="w-sit">${sitOpts(sit)}</select></label><label class="f">Premier jour<input class="in" type="date" id="w-d0" value="${addDays(todayISO(), 7)}"></label><label class="f">Épreuves par jour<select class="in" id="w-n">${optList([[2, '2 (matin)'], [3, '3'], [4, '4']], 3)}</select></label></div>
    <div class="row"><button class="btn sm" data-fill>${ic('refresh')}Remplir les dates</button></div>
    <div class="tw" style="max-height:48vh;overflow:auto"><table class="t" id="w-t"><thead><tr><th class="c">Créer</th><th>Matière</th><th>Classes</th><th>Date</th><th>Début</th><th>Fin</th></tr></thead><tbody></tbody></table></div>`,
    actions: [{ label: 'Annuler' }, { label: 'Créer les évaluations', cls: 'primary', onClick: async (close, m) => {
      const lv = $('#w-lv', m).value, s = +$('#w-sit', m).value; let n = 0, skipped = 0;
      await withBusy('Création…', async () => { for (const tr of $$('#w-t tbody tr', m)) { if (!$('.w-on', tr).checked) continue; const subj = tr.dataset.m; const classes = classesOf(lv).filter(c => c.subjects.some(x => x.m === subj)).map(c => c.id); if (Object.values(S.evals).some(o => o.level === lv && o.subj === subj && o.sit === s)) { skipped++; continue; } const ne = newEval({ level: lv, subj, trim: trimOfSit(s), sit: s, date: $('.w-d', tr).value, start: $('.w-s', tr).value, end: $('.w-e', tr).value, classes }); S.evals[ne.id] = ne; await saveEval(ne); n++; } });
      audit('Planning', `Situation ${s} programmée : ${n} évaluation(s)`, lv); toast(`${n} évaluation(s) créée(s)${skipped ? `, ${skipped} déjà existante(s) ignorée(s)` : ''}.`, 'ok'); close(); render(); } }] });
  const m = md.el;
  const build = () => { const lv = $('#w-lv', m).value; const cls = classesOf(lv); const subs = S.subjects.filter(s => cls.some(c => c.subjects.some(x => x.m === s.code)));
    $('#w-t tbody', m).innerHTML = subs.map(s => `<tr data-m="${s.code}"><td class="c"><input type="checkbox" class="w-on" ${s.code === '12' ? '' : 'checked'}></td><td><b>${esc(s.abbr)}</b> <span class="small muted">${esc(s.nom)}</span></td><td class="small">${cls.filter(c => c.subjects.some(x => x.m === s.code)).map(c => esc(c.nom)).join(', ')}</td><td><input type="date" class="in w-d"></td><td><input type="time" class="in w-s" style="width:105px"></td><td><input type="time" class="in w-e" style="width:105px"></td></tr>`).join(''); fill(); };
  const fill = () => { let d = $('#w-d0', m).value || todayISO(); const per = +$('#w-n', m).value; let k = 0; const skipWE = x => { while ([0, 6].includes(isoToDate(x).getDay())) x = addDays(x, 1); return x; }; d = skipWE(d);
    $$('#w-t tbody tr', m).forEach(tr => { if (!$('.w-on', tr).checked) return; if (k && k % per === 0) d = skipWE(addDays(d, 1)); const sl = slots[k % per]; $('.w-d', tr).value = d; $('.w-s', tr).value = sl[0]; $('.w-e', tr).value = sl[1]; k++; }); };
  $('#w-lv', m).onchange = build; $('[data-fill]', m).onclick = fill; build();
}
function importPlanning() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv,.ods';
  inp.onchange = async () => { try {
    const { rows } = await readSheet(inp.files[0]); let n = 0; const errs = [];
    for (const [i, r] of rows.entries()) {
      const lvTxt = norm(pickCol(r, ['niveau', 'prefecture'])); const lv = LEVELS.find(l => norm(l.nom) === lvTxt || norm(l.id) === lvTxt || norm(l.roman) === lvTxt || (lvTxt.startsWith('2') && l.id === '2nde') || (lvTxt.startsWith('1') && l.id === '1ere') || (lvTxt.startsWith('t') && l.id === 'tle'));
      const sit = +pickCol(r, ['situation', 'sit', 'sequence']); const mt = norm(pickCol(r, ['matiere', 'discipline']));
      const subj = S.subjects.find(s => norm(s.code) === mt || norm(s.abbr) === mt || norm(s.nom) === mt || pad(mt, 2) === s.code);
      let date = pickCol(r, ['date']); const md2 = date.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/); if (md2) date = `${md2[3].length === 2 ? '20' + md2[3] : md2[3]}-${pad(md2[2], 2)}-${pad(md2[1], 2)}`; date = date.slice(0, 10);
      const start = (pickCol(r, ['debut', 'heuredebut', 'de']) || '').replace('h', ':').slice(0, 5), end = (pickCol(r, ['fin', 'heurefin', 'a']) || '').replace('h', ':').slice(0, 5);
      if (!lv || !sit || sit > 6 || !subj || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) { errs.push(`ligne ${i + 2}`); continue; }
      const ct = pickCol(r, ['classes', 'classe']); let classes;
      if (!ct || /tout/i.test(ct)) classes = classesOf(lv.id).filter(c => c.subjects.some(x => x.m === subj.code)).map(c => c.id);
      else classes = ct.split(/[,;\s]+/).map(x => classesOf(lv.id).find(c => norm(c.nom) === norm(x))).filter(Boolean).map(c => c.id);
      if (!classes.length) { errs.push(`ligne ${i + 2} (classes)`); continue; }
      const ne = newEval({ level: lv.id, subj: subj.code, trim: trimOfSit(sit), sit, date, start: start.padStart(5, '0'), end: end.padStart(5, '0'), classes }); S.evals[ne.id] = ne; await saveEval(ne); n++;
    }
    audit('Planning', `Import de ${n} évaluation(s)`); toast(`${n} évaluation(s) importée(s)${errs.length ? ` ; ${errs.length} ligne(s) rejetée(s) : ${errs.slice(0, 5).join(', ')}` : ''}.`, errs.length ? '' : 'ok'); render();
  } catch (e) { toast(e.message, 'bad'); } };
  inp.click();
}
