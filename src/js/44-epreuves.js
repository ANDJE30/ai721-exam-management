/* =====================================================================
   Épreuves : préparation (salles, codes), saisie anonyme, désanonymat
   ===================================================================== */
function evalPicker(list, selId, id) {
  return `<select class="in" id="${id}" style="max-width:100%">${list.map(e => `<option value="${e.id}" ${e.id === selId ? 'selected' : ''}>${fmtDate(e.date, 'short')} · ${levelById(e.level).roman} · ${esc(subjByCode(e.subj).nom)} · T${e.trim} S${e.sit} · ${STATUS[e.status]?.l}</option>`).join('')}</select>`;
}
function scopeEvals(filterFn) { const lv = levelsInScope(); return sortEvals(Object.values(S.evals).filter(e => lv.includes(e.level) && (!filterFn || filterFn(e)))); }

/* ---------- Préparation et codes-barres ---------- */
V.epreuves = el => {
  const sit = curSit(); const list = scopeEvals(e => e.sit === sit);
  if (!list.length) { el.innerHTML = pageHead('Préparation et codes-barres') + `<div class="panel empty"><h3>Aucune épreuve pour la situation ${sit}</h3><p>Planifiez d’abord les évaluations.</p><button class="btn primary" onclick="go('planning')">${ic('cal')}Aller au planning</button></div>`; return; }
  let e = S.evals[S.ui.sel.eval]; if (!e || !list.includes(e)) e = list.find(x => !x.placement) || list[0]; S.ui.sel.eval = e.id;
  const cand = candidatesOf(e); const busyRooms = new Set(Object.values(S.evals).filter(o => o.id !== e.id && o.placement && overlap(o, e)).flatMap(o => o.placement.rooms.map(r => r.id)));
  const chosen = new Set(e.placement ? e.placement.rooms.map(r => r.id) : S.rooms.filter(r => !busyRooms.has(r.id)).map(r => r.id));
  const locked = Object.keys(e.marks || {}).length > 0;
  el.innerHTML = pageHead('Préparation et codes-barres', 'Répartition des élèves dans les salles, numéros de table et codes-barres d’anonymat. Les éditions sortent en un seul PDF par type.') + `
    <div class="panel"><div class="row"><label class="f" style="flex:1;min-width:260px">Épreuve de la situation ${sit}${evalPicker(list, e.id, 'ep-sel')}</label><button class="btn" data-act="detail">${ic('eye')}Fiche</button><button class="btn" data-act="edit">${ic('edit')}Modifier</button></div>
      <div class="row" style="margin-top:10px">${statusPill(e.status)}<span class="small">${fmtDate(e.date)} · ${e.start}–${e.end} · ${esc(evalClassNames(e))} · <b>${cand.length}</b> élèves</span></div></div>
    <div class="grid g2">
      <div class="panel"><header><h3>1. Répartition en salles</h3>${e.placement ? `<span class="pill ok">générée le ${fmtDT(e.placement.at)}</span>` : '<span class="pill warn">à faire</span>'}</header>
        ${S.rooms.length ? `<div class="stack" style="gap:6px;max-height:240px;overflow:auto">${S.rooms.map(r => `<label class="check" style="justify-content:space-between;width:100%"><span><input type="checkbox" class="rm" value="${r.id}" ${chosen.has(r.id) ? 'checked' : ''} ${locked ? 'disabled' : ''}> ${esc(r.nom)} <span class="tiny muted">${esc(r.batiment || '')}</span></span><span class="small num">${busyRooms.has(r.id) ? '<span class="pill bad plain">occupée</span> ' : ''}${r.capacite} pl.</span></label>`).join('')}</div>
        <div class="fgrid" style="margin-top:10px"><label class="f">Mode de placement<select class="in" id="pm" ${locked ? 'disabled' : ''}>${optList(Object.entries(PLACE_MODES), e.placement?.mode || 'brassage')}</select></label><label class="check" style="align-self:end"><input type="checkbox" id="peq" ${locked ? 'disabled' : ''}> Équilibrer les salles</label></div>
        <p class="small" id="capinfo"></p>
        <div class="row"><button class="btn primary" data-act="place" ${locked ? 'disabled' : ''}>${ic('shuffle')}${e.placement ? 'Regénérer' : 'Générer'} la répartition et les codes</button></div>
        ${locked ? '<p class="small muted">Des notes sont enregistrées : la répartition est figée pour préserver la correspondance des codes.</p>' : ''}` : `<div class="empty small">Aucune salle enregistrée.<button class="btn" onclick="go('salles')">${ic('door')}Créer les salles</button></div>`}
      </div>
      <div class="panel"><header><h3>2. Salles et surveillants</h3>${e.placement ? `<button class="btn sm" data-act="surv">${ic('users')}Désigner automatiquement</button>` : ''}</header>
        ${e.placement ? `<div class="tw"><table class="t"><thead><tr><th>Salle</th><th>Tables</th><th class="r">Élèves</th><th>Surveillants</th></tr></thead><tbody>${e.placement.rooms.map((r, i) => `<tr><td><b>${esc(r.nom)}</b></td><td class="mono small">${pad(r.from, 3)}–${pad(r.to, 3)}</td><td class="r num">${r.to - r.from + 1}</td><td><div class="row" style="flex-wrap:nowrap">${[0, 1].map(k => `<select class="in sv" data-r="${i}" data-k="${k}" style="min-width:130px">${teacherOpts(r.surv?.[k])}</select>`).join('')}</div></td></tr>`).join('')}</tbody></table></div><p class="tiny muted">La désignation automatique écarte les enseignants de la matière évaluée et ceux qui surveillent déjà sur le même créneau.</p>` : '<div class="empty small">Générez d’abord la répartition.</div>'}
      </div></div>
    ${e.placement ? `<div class="panel"><header><h3>3. Éditions de l’épreuve</h3><span class="small muted">chaque bouton produit un seul fichier PDF</span></header><div class="row">
      <button class="btn" data-pdf="listes">${ic('file')}Listes de classe avec codes-barres</button>
      <button class="btn" data-pdf="emarg">${ic('file')}Émargement et PV par salle</button>
      <button class="btn" data-pdf="etiq">${ic('barcode')}Étiquettes adhésives</button>
      <button class="btn" data-pdf="bord">${ic('file')}Bordereaux de notation</button>
      <button class="btn" data-pdf="corr">${ic('lock')}Table de correspondance</button>
      <button class="btn primary" data-pdf="dossier">${ic('print')}Dossier complet</button></div></div>
    <div class="grid g2"><div class="panel"><header><h3>4. Jour de l’épreuve</h3>${statusPill(e.status)}</header><div class="stack">
      <label class="f">Absent : scanner le code ou saisir le numéro de table<input class="in mono" id="abs-in" placeholder="Code-barres ou n° de table puis Entrée" autocomplete="off"></label>
      <div class="small">Absents enregistrés : ${Object.entries(e.marks || {}).filter(([, m]) => m.st === 'ABS').map(([k]) => `<span class="pill bad plain mono">${k}</span>`).join(' ') || '<span class="muted">aucun</span>'}</div>
      <div class="row"><button class="btn" data-act="composee" ${['preparee', 'planifiee'].includes(e.status) ? '' : 'disabled'}>${ic('check')}Marquer l’épreuve comme composée</button></div></div></div>
      <div class="panel"><header><h3>Contrôle d’un code</h3></header><p class="small muted">Scannez une étiquette pour vérifier sa lecture par la douchette avant l’impression en série.</p><input class="in mono scan-input" id="chk-in" placeholder="Scanner ici" autocomplete="off" style="font-size:18px"><div id="chk-out"></div></div></div>
    <div class="panel"><header><h3>Répartition détaillée</h3><input class="in" id="pf" placeholder="Filtrer : nom, classe, salle, table" style="max-width:280px"></header><div id="plist"></div></div>` : ''}`;
  const sel = $('#ep-sel', el); sel.onchange = () => { S.ui.sel.eval = sel.value; render(); };
  const capInfo = () => { const ids = $$('.rm:checked', el).map(i => i.value); const cap = ids.reduce((a, id) => a + (+roomById(id)?.capacite || 0), 0); const ci = $('#capinfo', el); if (ci) ci.innerHTML = `Capacité sélectionnée : <b>${cap}</b> places pour <b>${cand.length}</b> élèves ${cap >= cand.length ? '<span class="pill ok plain">suffisant</span>' : `<span class="pill bad plain">manque ${cand.length - cap}</span>`}`; };
  $$('.rm', el).forEach(i => i.onchange = capInfo); capInfo();
  $$('[data-act]', el).forEach(b => b.onclick = async () => {
    const a = b.dataset.act;
    if (a === 'detail') openEvalDetail(e.id);
    if (a === 'edit') openEvalForm(e);
    if (a === 'place') {
      if (e.placement && !(await confirmBox('Regénérer la répartition', 'Les numéros de table et les codes déjà imprimés deviendront faux. Continuer ?', 'Regénérer', true))) return;
      try { autoPlace(e, $('#pm', el).value, $$('.rm:checked', el).map(i => i.value), { equilibrer: $('#peq', el).checked }); await saveEval(e); audit('Répartition', `${evalShort(e)} ${levelById(e.level).roman} : ${e.placement.list.length} élèves dans ${e.placement.rooms.length} salle(s), mode ${e.placement.mode}`, e.level); toast('Répartition et codes générés.', 'ok'); render(); } catch (err) { toast(err.message, 'bad'); }
    }
    if (a === 'surv') { const ok = autoSurveillants(e); await saveEval(e); toast(ok ? 'Surveillants désignés.' : 'Enseignants disponibles insuffisants : complétez à la main.', ok ? 'ok' : ''); render(); }
    if (a === 'composee') { e.status = 'composee'; await saveEval(e); audit('Épreuve', `${evalShort(e)} ${levelById(e.level).roman} marquée composée`, e.level); render(); }
  });
  $$('.sv', el).forEach(s => s.onchange = async () => { const r = e.placement.rooms[+s.dataset.r]; r.surv = r.surv || []; r.surv[+s.dataset.k] = s.value; r.surv = r.surv.filter((x, i) => x || i === 0); await saveEval(e); toast('Surveillant enregistré.', 'ok'); });
  const base = `${fileSafe(subjByCode(e.subj).abbr)}-${e.level}-t${e.trim}s${e.sit}-${e.date}`;
  $$('[data-pdf]', el).forEach(b => b.onclick = async () => {
    const k = b.dataset.pdf;
    if (k === 'listes') runPdf(`listes-classe-${base}.pdf`, 'Listes de classe', doc => addListesClasse(doc, [e]));
    if (k === 'emarg') runPdf(`emargement-${base}.pdf`, 'Émargement', doc => addEmargement(doc, [e]));
    if (k === 'bord') runPdf(`bordereaux-${base}.pdf`, 'Bordereaux de notation', doc => addBordereaux(doc, [e]));
    if (k === 'corr') { if (await requireCoord('La table de correspondance relie chaque code à un élève.')) runPdf(`correspondance-${base}.pdf`, 'Table de correspondance', doc => addCorrespondance(doc, [e])); }
    if (k === 'etiq') labelDialog([e], base);
    if (k === 'dossier') runPdf(`dossier-${base}.pdf`, 'Dossier de l’épreuve', doc => addDossierJournee(doc, [e], { emarg: true, listes: true, bord: true }));
  });
  const absIn = $('#abs-in', el);
  if (absIn) absIn.addEventListener('keydown', async ev => { if (ev.key !== 'Enter') return; const v = absIn.value.trim(); absIn.value = ''; let t = null; if (scanDigits(v).length === 12) { const L = locateCode(v, e); if (L.e && L.e.id === e.id) t = L.p.TTT; else { toast(L.p.err || 'Ce code n’appartient pas à cette épreuve.', 'bad'); return; } } else t = +v; if (!e.placement.list.some(x => x[2] === t)) { toast('Numéro de table inconnu.', 'bad'); return; } const k = markKey(t); const cur = e.marks?.[k]; const next = cur?.st === 'ABS' ? { st: 'P', n: null, at: Date.now() } : { st: 'ABS', n: null, at: Date.now(), by: S.caps.userName || 'Secrétariat' }; e.marks = e.marks || {}; e.marks[k] = next; await S.store.update('evals/' + e.id, { marks: { [k]: next }, updatedAt: Date.now() }); audit('Absence', `${evalShort(e)} table ${k} ${next.st === 'ABS' ? 'absent' : 'présent'}`, e.level); render(); setTimeout(() => $('#abs-in')?.focus(), 50); });
  const chk = $('#chk-in', el);
  if (chk) chk.addEventListener('keydown', ev => { if (ev.key !== 'Enter') return; const L = locateCode(chk.value, e); chk.value = ''; $('#chk-out', el).innerHTML = L.p.ok ? `<div class="callout ${L.e?.id === e.id ? 'ok' : 'warn'}">Lecture correcte : ${esc(L.p.level?.nom || '')} · ${esc(L.p.cls?.nom || '')} · ${esc(L.p.subject?.abbr || '')} · T${L.p.T} S${L.p.S} · table ${pad(L.p.TTT, 3)}${L.e?.id === e.id ? '' : '<br>Ce code ne correspond pas à l’épreuve affichée.'}</div>` : `<div class="callout bad">${esc(L.p.err)}</div>`; });
  if (e.placement) {
    const draw = () => { const q = norm($('#pf', el).value); const rows = e.placement.list.filter(x => !q || norm(`${x[3]} ${S.classes[x[1]]?.nom} ${roomOfTable(e, x[2])?.nom} ${pad(x[2], 3)}`).includes(q)).sort((a, b) => a[2] - b[2]);
      $('#plist', el).innerHTML = `<div class="tw"><table class="t"><thead><tr><th>Table</th><th>Salle</th><th>Classe</th><th>Élève</th><th>Code-barres</th></tr></thead><tbody>${rows.slice(0, 40).map(x => `<tr><td class="mono"><b>${pad(x[2], 3)}</b></td><td>${esc(roomOfTable(e, x[2])?.nom || '')}</td><td class="mono">${esc(S.classes[x[1]]?.nom || '')}</td><td>${esc(x[3])}</td><td class="bc" style="background:#fff;width:200px">${bcSvg(codeOf(e, x[1], x[2]), { h: 34, w: 1.3, fs: 11, m: 4 })}</td></tr>`).join('')}</tbody></table></div>${rows.length > 40 ? `<p class="small muted">${rows.length - 40} ligne(s) supplémentaire(s) : affinez le filtre ou éditez les listes en PDF.</p>` : ''}`; };
    $('#pf', el).oninput = debounce(draw, 200); draw();
  }
};
function labelDialog(evs, base) {
  openModal({ title: 'Étiquettes adhésives', body: `<div class="fgrid"><label class="f">Contenu<select class="in" id="lb-t">${optList([['paire', 'Paire par élève : en-tête nominatif + copie anonyme'], ['anonyme', 'Copie anonyme seulement'], ['nominative', 'En-tête nominatif seulement']], 'paire')}</select></label><label class="f">Format de planche<select class="in" id="lb-f">${optList(Object.entries(LABEL_FORMATS).map(([k, v]) => [k, v.l]), '3x8')}</select></label></div><label class="check"><input type="checkbox" id="lb-c" checked> Tracer les contours (désactiver pour les planches prédécoupées)</label><p class="small muted">L’étiquette nominative se colle sur la partie détachable de la copie, l’étiquette anonyme sur la copie elle-même. Imprimez à 100 %, sans ajustement à la page.</p>`,
    actions: [{ label: 'Annuler' }, { label: `${ic('print')}Générer le PDF`, cls: 'primary', onClick: (close, m) => { const t = $('#lb-t', m).value, f = $('#lb-f', m).value, c = $('#lb-c', m).checked; close(); runPdf(`etiquettes-${t}-${base}.pdf`, 'Étiquettes', doc => addEtiquettes(doc, evs, t, f, c)); } }] });
}

/* ---------- Saisie anonyme ---------- */
V.saisie = el => {
  const list = scopeEvals(e => e.placement && (!e.anon?.lifted || S.ui.role === 'coordination') && e.status !== 'cloturee');
  if (!list.length) { el.innerHTML = pageHead('Saisie anonyme des notes') + `<div class="panel empty"><h3>Aucune épreuve prête pour la saisie</h3><p>Une épreuve devient saisissable dès que ses codes-barres sont générés.</p></div>`; return; }
  let e = S.evals[S.ui.sel.seval]; if (!e || !list.includes(e)) e = list.find(x => ['composee', 'saisie'].includes(x.status)) || list[list.length - 1]; S.ui.sel.seval = e.id;
  const mode = S.ui.sel.smode || 'scan'; const p = progressOf(e);
  el.innerHTML = pageHead('Saisie anonyme des notes', 'Aucun nom n’apparaît pendant la saisie. La douchette lit le code, la note se tape au clavier, la touche Entrée enregistre et rend la main au lecteur.') + `
    <div class="panel"><div class="row"><label class="f" style="flex:1;min-width:260px">Épreuve${evalPicker(list, e.id, 'sv-sel')}</label><div class="lvl tabs" style="border:0">${[['scan', 'Douchette'], ['grille', 'Bordereau']].map(([k, l]) => `<button data-sm="${k}" class="${mode === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="stack" style="gap:5px;margin-top:10px"><div class="row between small"><span>${statusPill(e.status)} ${e.double ? '<span class="pill neutral plain">double correction</span>' : ''} barème /${e.bareme}</span><span class="num"><b>${p.done}</b> / ${p.total} copies traitées · ${p.abs} absent(s)${p.arb ? ` · <b style="color:var(--warn)">${p.arb} arbitrage(s)</b>` : ''}</span></div>${progressBar(p.pct, p.pct === 100 ? 'ok' : '')}</div>
      ${e.anon?.lifted ? '<div class="callout warn" style="margin-top:10px">Anonymat déjà levé : toute modification est tracée au journal avec son motif.</div>' : ''}</div>
    <div id="sv-body" class="stack"></div>`;
  $('#sv-sel', el).onchange = ev => { S.ui.sel.seval = ev.target.value; render(); };
  $$('[data-sm]', el).forEach(b => b.onclick = () => { S.ui.sel.smode = b.dataset.sm; render(); });
  (mode === 'scan' ? saisieScan : saisieGrille)($('#sv-body', el), e);
};
async function storeMark(e, table, mark, reason) {
  const k = markKey(table); mark.at = Date.now(); mark.by = S.caps.userName || (S.ui.role === 'coordination' ? 'Coordination' : 'Secrétariat');
  if (e.anon?.lifted) { if (!(await requireCoord('Modifier une note après la levée d’anonymat.'))) return false; mark.corr = reason || 'correction'; }
  e.marks = e.marks || {}; const prev = e.marks[k]; e.marks[k] = mark;
  const patch = { marks: { [k]: mark }, updatedAt: Date.now() };
  if (['preparee', 'composee', 'planifiee'].includes(e.status)) { e.status = 'saisie'; patch.status = 'saisie'; }
  await S.store.update('evals/' + e.id, patch);
  if (e.anon?.lifted || (prev && markDone(prev, e))) audit('Note modifiée', `${evalShort(e)} table ${k} : ${prev ? (prev.st !== 'P' ? prev.st : fmtNote(prev.n)) : '—'} → ${mark.st !== 'P' ? mark.st : fmtNote(mark.n)}${reason ? ' · motif : ' + reason : ''}`, e.level);
  return true;
}
function parseMarkInput(v, bar) {
  const t = String(v).trim().toLowerCase(); if (!t) return null;
  if (['a', 'abs', 'absent'].includes(t)) return { st: 'ABS', n: null };
  if (['d', 'disp', 'dispense'].includes(t)) return { st: 'DISP', n: null };
  if (['f', 'fraude'].includes(t)) return { st: 'FRAUDE', n: null };
  const n = Number(t.replace(',', '.')); if (isNaN(n) || n < 0 || n > bar) return { err: `Note invalide : saisir un nombre entre 0 et ${bar}, ou A (absent), D (dispensé), F (fraude).` };
  return { st: 'P', n: Math.round(n * 100) / 100 };
}
function saisieScan(box, e) {
  const recent = S.ui.recent?.[e.id] || [];
  box.innerHTML = `<div class="grid g2"><div class="scan-zone" id="sz">
      <label class="f">1. Code-barres de la copie<input class="in scan-input" id="code-in" inputmode="numeric" autocomplete="off" placeholder="Scanner la copie"></label>
      <div id="copy"></div>
      <div id="mark-zone" hidden><div class="row" style="align-items:flex-end">${e.double ? `<label class="f">Note 1<input class="in mark-input" id="n1" autocomplete="off"></label><label class="f">Note 2<input class="in mark-input" id="n2" autocomplete="off"></label><label class="f" id="n3w" hidden>Arbitrage<input class="in mark-input" id="n3" autocomplete="off"></label>` : `<label class="f">2. Note sur ${e.bareme}<input class="in mark-input" id="n1" autocomplete="off"></label>`}<button class="btn primary" id="save-mark">${ic('check')}Enregistrer <span class="kbd">Entrée</span></button></div>
        <p class="tiny muted">A = absent · D = dispensé · F = fraude · Échap = annuler</p></div>
      <p class="small muted">Astuce : la douchette envoie le code suivi de Entrée. Pas de douchette ? Tapez les 12 chiffres puis Entrée.</p></div>
    <div class="panel"><header><h3>Dernières saisies</h3><span class="small muted">session en cours</span></header><div id="recent">${recent.length ? `<div class="tw"><table class="t"><thead><tr><th>Heure</th><th>Code</th><th class="r">Note</th></tr></thead><tbody>${recent.slice(0, 12).map(r => `<tr><td class="small">${new Date(r.at).toLocaleTimeString('fr-FR')}</td><td class="mono small">${esc(fmtCode(r.code))}</td><td class="r"><b>${esc(r.lab)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty small">Les copies enregistrées s’affichent ici.</div>'}</div></div></div>
    <div class="panel"><header><h3>Copies sans note</h3><span class="small muted">par salle, sans nom</span></header>${missingHTML(e)}</div>`;
  const ci = $('#code-in', box), mz = $('#mark-zone', box), cp = $('#copy', box); let cur = null;
  const reset = () => { cur = null; mz.hidden = true; cp.innerHTML = ''; ci.value = ''; ci.focus(); };
  const flash = ok => { const z = $('#sz', box); z.classList.remove('flash-ok', 'flash-bad'); void z.offsetWidth; z.classList.add(ok ? 'flash-ok' : 'flash-bad'); };
  ci.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter') return; ev.preventDefault();
    const L = locateCode(ci.value, e);
    if (!L.p.ok) { flash(false); cp.innerHTML = `<div class="callout bad">${esc(L.p.err)}</div>`; ci.select(); return; }
    if (!L.e || L.e.id !== e.id) { flash(false); cp.innerHTML = `<div class="callout bad">Cette copie appartient à une autre épreuve${L.e ? ` : ${esc(evalLabel(L.e))} (${levelById(L.e.level).roman})` : ''}. Changez d’épreuve ou mettez la copie de côté.</div>`; ci.select(); return; }
    cur = L; const m = e.marks?.[markKey(L.p.TTT)];
    cp.innerHTML = `<div class="copy-card"><div><span>Matière</span><b>${esc(subjByCode(e.subj).abbr)}</b></div><div><span>Trim. / sit.</span><b>T${e.trim} S${e.sit}</b></div><div><span>Table</span><b>${pad(L.p.TTT, 3)}</b></div><div><span>Salle</span><b style="font-size:14px">${esc(roomOfTable(e, L.p.TTT)?.nom || '')}</b></div><div><span>Note actuelle</span><b>${m ? (m.st !== 'P' ? m.st : (fmtNote(m.n) || '—') + (e.double && m.n2 !== undefined && m.n2 !== null ? ' / ' + fmtNote(m.n2) : '')) : '—'}</b></div></div>`;
    mz.hidden = false; $('#n1', box).value = m && m.st === 'P' && m.n !== null && m.n !== undefined ? String(m.n).replace('.', ',') : (m && m.st !== 'P' ? m.st[0] : '');
    if (e.double) { $('#n2', box).value = m?.n2 ?? ''; $('#n3w', box).hidden = !(m && needsArbitration(m, e)) && !(m && m.n3 !== undefined && m.n3 !== null); $('#n3', box).value = m?.n3 ?? ''; }
    flash(true); $('#n1', box).focus(); $('#n1', box).select();
  });
  const save = async () => {
    if (!cur) return; const bar = +e.bareme || 20;
    const a = parseMarkInput($('#n1', box).value, bar); if (!a) { toast('Saisissez une note.', 'bad'); return; } if (a.err) { toast(a.err, 'bad'); flash(false); return; }
    const mark = { ...a };
    if (e.double && a.st === 'P') { const b = parseMarkInput($('#n2', box).value, bar); if (b && b.err) { toast(b.err, 'bad'); return; } mark.n2 = b && b.st === 'P' ? b.n : null; const c = !$('#n3w', box).hidden ? parseMarkInput($('#n3', box).value, bar) : null; if (c && c.err) { toast(c.err, 'bad'); return; } mark.n3 = c && c.st === 'P' ? c.n : null; }
    let reason = ''; if (e.anon?.lifted) { reason = await askReason(); if (!reason) return; }
    if (!(await storeMark(e, cur.p.TTT, mark, reason))) return;
    S.ui.recent = S.ui.recent || {}; (S.ui.recent[e.id] = S.ui.recent[e.id] || []).unshift({ at: Date.now(), code: cur.p.digits, lab: mark.st !== 'P' ? mark.st : fmtNote(mark.n) + (e.double && mark.n2 !== null && mark.n2 !== undefined ? ' / ' + fmtNote(mark.n2) : '') });
    if (e.double && needsArbitration(mark, e)) toast(`Écart de ${fmtNote(Math.abs(mark.n - mark.n2))} points : cette copie demande une troisième correction.`, '');
    else toast(`Table ${pad(cur.p.TTT, 3)} : ${mark.st !== 'P' ? mark.st : fmtNote(mark.n)} enregistré.`, 'ok');
    const y = window.scrollY; render(); window.scrollTo(0, y); setTimeout(() => $('#code-in')?.focus(), 30);
  };
  $('#save-mark', box).onclick = save;
  $$('.mark-input', box).forEach((inp, i, arr) => inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); const nxt = arr.slice(i + 1).find(x => !x.closest('[hidden]')); if (nxt && e.double && $('#n1', box).value && !/^[adf]/i.test($('#n1', box).value)) nxt.focus(); else save(); } if (ev.key === 'Escape') reset(); }));
  setTimeout(() => ci.focus(), 50);
}
function askReason() {
  return new Promise(res => { let done = false; const md = openModal({ title: 'Motif de la modification', body: '<label class="f">Motif (réclamation, erreur de report…)<input class="in" id="rs-in"></label>', actions: [{ label: 'Annuler', onClick: c => { done = true; c(); res(''); } }, { label: 'Valider', cls: 'primary', onClick: (c, m) => { const v = $('#rs-in', m).value.trim(); if (!v) { toast('Le motif est obligatoire.', 'bad'); return false; } done = true; c(); res(v); } }] }); const obs = new MutationObserver(() => { if (!document.body.contains(md.el)) { obs.disconnect(); if (!done) res(''); } }); obs.observe(document.body, { childList: true }); });
}
function missingHTML(e) {
  const miss = e.placement.list.filter(x => !markDone(e.marks?.[markKey(x[2])], e)).sort((a, b) => a[2] - b[2]);
  if (!miss.length) return '<div class="callout ok">Toutes les copies sont traitées. L’épreuve peut passer au désanonymat.</div>';
  const byRoom = {}; miss.forEach(x => { const r = roomOfTable(e, x[2])?.nom || '?'; (byRoom[r] = byRoom[r] || []).push(x); });
  return `<div class="stack" style="gap:8px">${Object.entries(byRoom).map(([r, xs]) => `<div><b>${esc(r)}</b> <span class="small muted">${xs.length} copie(s)</span><div class="row" style="gap:4px;margin-top:4px">${xs.map(x => `<span class="pill ${needsArbitration(e.marks?.[markKey(x[2])], e) ? 'warn' : 'neutral'} plain mono" title="${esc(fmtCode(codeOf(e, x[1], x[2])))}">${pad(x[2], 3)}</span>`).join('')}</div></div>`).join('')}</div>`;
}
function saisieGrille(box, e) {
  const lot = +S.settings.tailleLot || 25; const all = e.placement.list.slice().sort((a, b) => a[2] - b[2]);
  const nl = Math.ceil(all.length / lot); let li = Math.min(S.ui.sel.lot || 0, nl - 1); const rows = all.slice(li * lot, li * lot + lot);
  box.innerHTML = `<div class="panel"><header><h3>Saisie depuis un bordereau</h3><label class="f" style="flex-direction:row;align-items:center;gap:6px">Lot<select class="in" id="lot" style="width:auto">${Array.from({ length: nl }, (_, i) => `<option value="${i}" ${i === li ? 'selected' : ''}>${i + 1} · tables ${pad(all[i * lot][2], 3)}–${pad(all[Math.min(all.length, (i + 1) * lot) - 1][2], 3)}</option>`).join('')}</select></label><button class="btn primary" id="save-lot">${ic('check')}Enregistrer le lot</button></header>
    <p class="small muted">Recopiez les notes du bordereau papier dans l’ordre des numéros. Tabulation ou Entrée pour passer à la ligne suivante.</p>
    <div class="tw"><table class="t"><thead><tr><th>N°</th><th>Table</th><th>Code</th><th>${e.double ? 'Note 1' : 'Note / ' + e.bareme}</th>${e.double ? '<th>Note 2</th><th>Arbitrage</th>' : ''}<th>Finale / 20</th></tr></thead><tbody>${rows.map((x, i) => { const m = e.marks?.[markKey(x[2])]; const v = k => m && m.st === 'P' && m[k] !== null && m[k] !== undefined ? String(m[k]).replace('.', ',') : (k === 'n' && m && m.st !== 'P' ? m.st[0] : ''); return `<tr data-t="${x[2]}"><td class="muted num">${i + 1}</td><td class="mono"><b>${pad(x[2], 3)}</b></td><td class="mono small">${esc(fmtCode(codeOf(e, x[1], x[2])))}</td><td><input class="in g1 num" value="${esc(v('n'))}" style="width:90px"></td>${e.double ? `<td><input class="in g2 num" value="${esc(v('n2'))}" style="width:90px"></td><td><input class="in g3 num" value="${esc(v('n3'))}" style="width:90px"></td>` : ''}<td class="num"><b>${fmtNote(finalMark(m, e))}</b>${needsArbitration(m, e) ? ' <span class="pill warn plain">arbitrage</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  $('#lot', box).onchange = ev => { S.ui.sel.lot = +ev.target.value; render(); };
  const inputs = $$('input.in', box); inputs.forEach((inp, i) => inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); (inputs[i + 1] || $('#save-lot', box)).focus(); } }));
  $('#save-lot', box).onclick = async () => {
    const bar = +e.bareme || 20; const patch = {}; let errs = 0; let reason = '';
    for (const tr of $$('tr[data-t]', box)) { const t = +tr.dataset.t; const a = parseMarkInput($('.g1', tr).value, bar); if (!a) continue; if (a.err) { errs++; $('.g1', tr).style.borderColor = 'var(--bad)'; continue; } const mk = { ...a }; if (e.double && a.st === 'P') { const b = parseMarkInput($('.g2', tr).value, bar); const c = parseMarkInput($('.g3', tr).value, bar); if ((b && b.err) || (c && c.err)) { errs++; continue; } mk.n2 = b && b.st === 'P' ? b.n : null; mk.n3 = c && c.st === 'P' ? c.n : null; } const old = e.marks?.[markKey(t)]; if (old && old.st === mk.st && old.n === mk.n && (old.n2 ?? null) === (mk.n2 ?? null) && (old.n3 ?? null) === (mk.n3 ?? null)) continue; mk.at = Date.now(); mk.by = S.caps.userName || 'Secrétariat'; patch[markKey(t)] = mk; }
    if (errs) { toast(`${errs} note(s) invalide(s) : corrigez les cases en rouge.`, 'bad'); return; }
    const n = Object.keys(patch).length; if (!n) { toast('Aucun changement à enregistrer.'); return; }
    if (e.anon?.lifted) { if (!(await requireCoord('Modifier des notes après la levée d’anonymat.'))) return; reason = await askReason(); if (!reason) return; Object.values(patch).forEach(m => m.corr = reason); }
    e.marks = { ...(e.marks || {}), ...patch }; const up = { marks: patch, updatedAt: Date.now() }; if (['preparee', 'composee', 'planifiee'].includes(e.status)) { e.status = 'saisie'; up.status = 'saisie'; }
    await withBusy('Enregistrement…', () => S.store.update('evals/' + e.id, up)); audit('Saisie par bordereau', `${evalShort(e)} ${levelById(e.level).roman} lot ${li + 1} : ${n} note(s)${reason ? ' · motif : ' + reason : ''}`, e.level);
    toast(`${n} note(s) enregistrée(s).`, 'ok'); if (li < nl - 1) S.ui.sel.lot = li + 1; render();
  };
}

/* ---------- Désanonymat et résultats ---------- */
V.resultats = el => {
  const list = scopeEvals(e => !!e.placement);
  if (!list.length) { el.innerHTML = pageHead('Désanonymat et résultats') + '<div class="panel empty"><h3>Aucune épreuve avec codes</h3></div>'; return; }
  let e = S.evals[S.ui.sel.reval]; if (!e || !list.includes(e)) e = list.find(x => !x.anon?.lifted && progressOf(x).missing === 0) || list.filter(x => x.anon?.lifted).pop() || list[0]; S.ui.sel.reval = e.id;
  const p = progressOf(e); const lifted = !!e.anon?.lifted;
  el.innerHTML = pageHead('Désanonymat et résultats', 'La levée d’anonymat rattache chaque note à son élève grâce à la table de correspondance. Elle est réservée à la coordination et inscrite au journal.') + `
    <div class="panel"><div class="row"><label class="f" style="flex:1;min-width:260px">Épreuve${evalPicker(list, e.id, 'rs-sel')}</label></div></div>
    ${lifted ? '' : `<div class="panel"><header><h3>Contrôles avant levée</h3></header><div class="stack small">
      <div class="row">${p.missing === 0 ? '<span class="pill ok">conforme</span>' : '<span class="pill bad">incomplet</span>'} Copies traitées : <b>${p.done} / ${p.total}</b>${p.missing ? ` · ${p.missing} sans note` : ''}</div>
      <div class="row">${p.arb === 0 ? '<span class="pill ok">conforme</span>' : '<span class="pill warn">à arbitrer</span>'} Double correction : ${e.double ? `${p.arb} copie(s) en attente de troisième note` : 'non requise'}</div>
      <div class="row"><span class="pill ${S.ui.role === 'coordination' ? 'ok' : 'neutral'}">${S.ui.role === 'coordination' ? 'déverrouillé' : 'PIN requis'}</span> Profil coordination</div>
      <div class="row" style="margin-top:6px"><button class="btn gold" data-act="lift">${ic('unlock')}Lever l’anonymat</button></div></div></div>`}
    <div id="res-body" class="stack"></div>`;
  $('#rs-sel', el).onchange = ev => { S.ui.sel.reval = ev.target.value; render(); };
  const lift = $('[data-act=lift]', el);
  if (lift) lift.onclick = async () => {
    if (!(await requireCoord('Lever l’anonymat d’une épreuve.'))) return;
    const force = p.missing > 0 || p.arb > 0;
    if (!(await confirmBox('Lever l’anonymat', `${esc(evalLabel(e))} · ${levelById(e.level).nom}<br><br>${p.done} copie(s) traitée(s) sur ${p.total}.${force ? `<br><b style="color:var(--bad)">${p.missing} copie(s) sans note finale : elles apparaîtront comme non rendues.</b>` : ''}<br><br>Les noms deviendront visibles pour tous les utilisateurs de la base.`, force ? 'Lever malgré tout' : 'Lever l’anonymat', force))) return;
    e.anon = { lifted: true, at: Date.now(), by: S.caps.userName || 'Coordination', forced: force, missing: p.missing };
    e.status = 'desanonymisee'; await saveEval(e); audit('Levée d’anonymat', `${evalShort(e)} ${levelById(e.level).roman} : ${p.done}/${p.total} copies${force ? ' (forcée)' : ''}`, e.level);
    toast('Anonymat levé.', 'ok'); render();
  };
  const body = $('#res-body', el);
  if (!lifted) { body.innerHTML = `<div class="panel empty"><h3>Résultats masqués</h3><p>Les notes restent liées à des codes tant que l’anonymat n’est pas levé.</p></div>`; return; }
  const res = resultsByClass(e); const cids = e.classes.filter(c => S.classes[c]).sort((a, b) => S.classes[a].rang - S.classes[b].rang);
  let cid = S.ui.sel.rcls; if (!cids.includes(cid)) cid = cids[0]; S.ui.sel.rcls = cid;
  const rows = withRanks(res[cid] || []); const st = statsOf(rows.map(r => r.note)); const g = statsOf(Object.values(res).flat().map(r => r.note));
  body.innerHTML = `<div class="panel"><header><h3>Éditions</h3>${e.status === 'cloturee' ? '<span class="pill ok">clôturée</span>' : ''}</header><div class="row">
      <button class="btn primary" data-x="releves">${ic('print')}Relevés de toutes les classes (1 PDF)</button><button class="btn" data-x="pv">${ic('file')}Procès-verbal</button><button class="btn" data-x="stats">${ic('chart')}Rapport statistique</button><button class="btn" data-x="xlsx">${ic('download')}Excel</button>
      ${e.status !== 'cloturee' ? `<button class="btn" data-x="close">${ic('lock')}Clôturer</button>` : ''}</div></div>
    <div class="grid g4">${kpi(fmtNote(g.mean), 'Moyenne du niveau', `${g.n} copies notées`)}${kpi(g.rate === null ? '—' : fmtNote(g.rate) + ' %', 'Taux de réussite', `notes ≥ ${S.settings.seuilReussite}`)}${kpi(`${fmtNote(g.min)} · ${fmtNote(g.max)}`, 'Note mini · maxi')}${kpi(fmtNote(g.sd), 'Écart-type')}</div>
    <div class="tabs">${cids.map(c => `<button data-c="${c}" class="${c === cid ? 'on' : ''}">${esc(S.classes[c].nom)}</button>`).join('')}</div>
    <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start" id="rs-grid">
      <div class="tw"><table class="t"><thead><tr><th>N°</th><th>Noms et prénoms</th><th>Matricule</th><th class="c">Table</th><th class="r">Note / 20</th><th class="c">Rang</th><th>Appréciation</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td class="muted num">${i + 1}</td><td><b>${esc(r.name)}</b></td><td class="mono small">${esc(r.mat)}</td><td class="c mono small">${pad(r.table, 3)}</td><td class="r num"><b style="color:${r.note !== null && r.note < (+S.settings.seuilReussite || 10) ? 'var(--bad)' : 'inherit'}">${r.note === null ? esc(r.st === 'P' ? 'non rendue' : r.st) : fmtNote(r.note)}</b>${r.mark?.corr ? ' <span class="pill warn plain" title="' + esc(r.mark.corr) + '">corrigée</span>' : ''}</td><td class="c num">${r.rang || ''}</td><td class="small">${appreciation(r.note)}</td></tr>`).join('')}</tbody></table></div>
      <div class="stack"><div class="panel"><header><h3>${esc(S.classes[cid].nom)}</h3><span class="small muted">${esc(teacherOf(cid, e.subj))}</span></header><div class="grid g2" style="grid-template-columns:1fr 1fr">${kpi(fmtNote(st.mean), 'Moyenne')}${kpi(st.rate === null ? '—' : fmtNote(st.rate) + ' %', 'Réussite')}</div></div>
        <div class="panel"><header><h3>Répartition des notes</h3></header>${barChartSvg(BIN_LABELS.map((l, i) => ({ l: l.replace(/[\[\]]/g, '').replace(' ; ', '–'), v: st.bins[i] })), { fmt: v => String(v), h: 170 })}</div></div></div>`;
  if (window.innerWidth < 900) $('#rs-grid', body).style.gridTemplateColumns = 'minmax(0,1fr)';
  $$('[data-c]', body).forEach(b => b.onclick = () => { S.ui.sel.rcls = b.dataset.c; render(); });
  const base = `${fileSafe(subjByCode(e.subj).abbr)}-${e.level}-t${e.trim}s${e.sit}`;
  $$('[data-x]', body).forEach(b => b.onclick = async () => {
    const k = b.dataset.x;
    if (k === 'releves') runPdf(`releves-${base}.pdf`, 'Relevés de notes', doc => addReleves(doc, [e]));
    if (k === 'pv') runPdf(`pv-levee-anonymat-${base}.pdf`, 'PV de levée d’anonymat', doc => addPV(doc, e));
    if (k === 'stats') runPdf(`statistiques-${base}.pdf`, 'Rapport statistique', doc => addStats(doc, [e]));
    if (k === 'xlsx') xlsxSave(`notes-${base}.xlsx`, cids.map(c => ({ name: S.classes[c].nom, rows: [[`${subjByCode(e.subj).nom} · T${e.trim} S${e.sit} · ${fmtDate(e.date, 'short')}`], ['N°', 'Matricule', 'Noms et prénoms', 'Sexe', 'Note /20', 'Rang', 'Appréciation'], ...withRanks(res[c] || []).map((r, i) => [i + 1, r.mat, r.name, r.sexe, r.note === null ? r.st : Math.round(r.note * 100) / 100, r.rang || '', appreciation(r.note)])], cols: [5, 12, 34, 6, 9, 6, 16] })));
    if (k === 'close') { if (!(await requireCoord('Clôturer l’épreuve : plus aucune note ne pourra être modifiée.'))) return; if (await confirmBox('Clôturer l’épreuve', 'Après clôture, les notes sont figées.', 'Clôturer')) { e.status = 'cloturee'; await saveEval(e); audit('Clôture', `${evalShort(e)} ${levelById(e.level).roman}`, e.level); render(); } }
  });
};
