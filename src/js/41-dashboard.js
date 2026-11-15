/* =====================================================================
   Tableau de bord (préfecture) et vue de coordination
   ===================================================================== */
V.tableau = el => {
  const lvIds = levelsInScope(); const T = curTrim(), Sit = curSit();
  const cls = lvIds.flatMap(classesOf); const nSt = cls.reduce((a, c) => a + studentsOf(c).length, 0);
  const nF = cls.reduce((a, c) => a + studentsOf(c).filter(s => s.sexe === 'F').length, 0);
  const evs = Object.values(S.evals).filter(e => lvIds.includes(e.level));
  const evSit = evs.filter(e => e.sit === Sit);
  let copies = 0, done = 0; evSit.forEach(e => { const p = progressOf(e); copies += p.total; done += p.done; });
  const lifted = evSit.filter(e => e.anon?.lifted).length;
  const alerts = S.ui.level === 'all' ? conflictsOf(null) : conflictsOf(S.ui.level);
  const pref = S.ui.level !== 'all' ? S.settings.prefets?.[S.ui.level] : S.settings.coordo;
  el.innerHTML = pageHead(S.ui.level === 'all' ? 'Coordination du second cycle' : esc(levelById(S.ui.level).pref), `${pref ? esc(pref) + ' · ' : ''}année scolaire ${esc(S.settings.annee)}. Le tableau suit la situation choisie en haut de l’écran.`,
    `<button class="btn" data-go="eleves">${ic('upload')}Importer des élèves</button><button class="btn" data-go="planning">${ic('cal')}Planifier</button><button class="btn primary" data-go="editions">${ic('print')}Centre d’impression</button>`) + `
    <div class="grid g4">
      ${kpi(cls.length, 'Classes', lvIds.length > 1 ? 'trois préfectures' : POLES_SUMMARY(cls))}
      ${kpi(nSt.toLocaleString('fr-FR'), 'Élèves inscrits', nSt ? `${nF} filles · ${nSt - nF} garçons` : 'listes à importer')}
      ${kpi(`${evSit.length}`, `Épreuves de la situation ${Sit}`, `${evSit.filter(e => e.placement).length} avec codes-barres`)}
      ${kpi(copies ? Math.round(done * 100 / copies) + ' %' : '—', 'Copies notées', copies ? `${done.toLocaleString('fr-FR')} sur ${copies.toLocaleString('fr-FR')}` : 'aucune copie attendue')}
      ${kpi(`${lifted} / ${evSit.length}`, 'Anonymats levés', 'pour la situation en cours')}
      ${kpi(alerts.length, 'Points d’attention', alerts.filter(a => a.sev === 'bad').length + ' bloquant(s)')}
    </div>
    ${S.ui.level === 'all' ? coordCards() : ''}
    <div class="panel"><header><h3>Matrice de suivi · situation ${Sit}</h3><div class="legend"><span><i style="background:var(--surface-2)"></i>non planifiée</span><span><i style="background:var(--info-soft)"></i>planifiée</span><span><i style="background:var(--accent-soft)"></i>codes générés</span><span><i style="background:var(--warn-soft)"></i>saisie (%)</span><span><i style="background:var(--ok-soft)"></i>moyenne après levée</span></div></header>
      <div style="overflow-x:auto">${lvIds.map(lv => matrixHTML(lv, T, Sit)).join('')}</div></div>
    <div class="grid g2">
      <div class="panel"><header><h3>Prochaines épreuves</h3><button class="btn sm" data-go="planning">Planning complet</button></header>${upcomingHTML(evs)}</div>
      <div class="panel"><header><h3>Points d’attention</h3><span class="pill ${alerts.length ? 'warn' : 'ok'}">${alerts.length ? alerts.length + ' à traiter' : 'rien à signaler'}</span></header>${alertsHTML(alerts)}</div>
    </div>
    <div class="grid g2">
      <div class="panel"><header><h3>Saisie en cours</h3><button class="btn sm" data-go="saisie">${ic('scan')}Saisir</button></header>${saisieHTML(evs)}</div>
      <div class="panel"><header><h3>Moyennes par classe · situation ${Sit}</h3></header>${classMeansChart(lvIds, Sit)}</div>
    </div>`;
  $$('[data-go]', el).forEach(b => b.onclick = () => go(b.dataset.go));
  $$('[data-cell]', el).forEach(td => td.onclick = () => { const [cid, m, eid] = td.dataset.cell.split('|'); if (eid) openEvalDetail(eid); else { const c = S.classes[cid]; openEvalForm(null, { level: c.level, subj: m, sit: Sit, classes: classesOf(c.level).filter(x => x.subjects.some(s => s.m === m)).map(x => x.id) }); } });
  $$('[data-eval]', el).forEach(b => b.onclick = () => openEvalDetail(b.dataset.eval));
};
function POLES_SUMMARY(cls) { const g = cls.filter(c => c.pole === 'EG_GROUPE').length; return `${g} en groupe, ${cls.length - g} en solo`; }
function coordCards() {
  return `<div class="grid g3">${LEVELS.map(l => { const evs = evalsOf(l.id).filter(e => e.sit === curSit()); let t = 0, d = 0; evs.forEach(e => { const p = progressOf(e); t += p.total; d += p.done; }); const pct = t ? Math.round(d * 100 / t) : 0;
    return `<div class="panel"><header><h3>${l.pref}</h3><button class="btn sm" data-lvjump="${l.id}">Ouvrir</button></header><div class="stack small"><div class="row between"><span>Épreuves de la situation ${curSit()}</span><b>${evs.length}</b></div><div class="row between"><span>Codes générés</span><b>${evs.filter(e => e.placement).length}</b></div><div class="row between"><span>Copies notées</span><b>${d} / ${t}</b></div>${progressBar(pct, pct === 100 ? 'ok' : '')}<div class="row between"><span>Anonymats levés</span><b>${evs.filter(e => e.anon?.lifted).length}</b></div></div></div>`; }).join('')}</div>`;
}
document.addEventListener('click', ev => { const b = ev.target.closest('[data-lvjump]'); if (b) { S.ui.level = b.dataset.lvjump; lsSet('level', S.ui.level); render(); } });
function matrixHTML(lv, T, Sit) {
  const cls = classesOf(lv); if (!cls.length) return `<p class="muted">Aucune classe en ${levelById(lv).nom}.</p>`;
  const subs = S.subjects.filter(s => cls.some(c => c.subjects.some(x => x.m === s.code)));
  return `<table class="mx" style="margin-bottom:10px"><thead><tr><th class="cl">${levelById(lv).roman}</th>${subs.map(s => `<th title="${esc(s.nom)}">${esc(s.abbr)}</th>`).join('')}</tr></thead><tbody>${cls.map(c => `<tr><th class="cl">${esc(c.nom)}</th>${subs.map(s => {
    if (!c.subjects.some(x => x.m === s.code)) return '<td class="na"></td>';
    const st = cellState(c.id, s.code, T, Sit);
    const lab = st.s === 0 ? '·' : st.s === 1 ? `${fmtDate(st.e.date, 'short').slice(0, 5)}<small>planifiée</small>` : st.s === 2 ? `${fmtDate(st.e.date, 'short').slice(0, 5)}<small>codes</small>` : st.s === 3 ? `${st.pct} %<small>saisie</small>` : `${st.mean === null ? '—' : fmtNote(st.mean)}<small>moy.</small>`;
    return `<td class="s${st.s}" data-cell="${c.id}|${s.code}|${st.e ? st.e.id : ''}" title="${esc(c.nom)} · ${esc(s.nom)}">${lab}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
}
function upcomingHTML(evs) {
  const up = evs.filter(e => e.date >= todayISO()).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 8);
  if (!up.length) return '<div class="empty small">Aucune épreuve à venir. Programmez la prochaine situation depuis le planning.</div>';
  return `<div class="timeline">${up.map(e => `<div class="it"><span class="d">${fmtDate(e.date, 'dm')}<br>${e.start}–${e.end}</span><span class="row between" style="align-items:flex-start"><span><b>${esc(subjByCode(e.subj).nom)}</b> · ${levelById(e.level).roman} · T${e.trim} S${e.sit}<br><span class="small muted">${esc(evalClassNames(e))}</span></span><span class="row">${statusPill(e.status)}<button class="btn sm" data-eval="${e.id}">Ouvrir</button></span></span></div>`).join('')}</div>`;
}
function alertsHTML(alerts) {
  if (!alerts.length) return '<div class="empty small">Aucun chevauchement, aucune salle en double, aucune saisie en retard.</div>';
  return `<div class="stack" style="gap:6px;max-height:330px;overflow:auto">${alerts.slice(0, 40).map(a => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span class="pill ${a.sev}" style="flex:none">${a.sev === 'bad' ? 'bloquant' : a.sev === 'warn' ? 'à vérifier' : 'info'}</span><span class="small" style="flex:1">${esc(a.msg)}</span>${a.e ? `<button class="btn sm ghost" data-eval="${a.e.id}">Voir</button>` : ''}</div>`).join('')}</div>`;
}
function saisieHTML(evs) {
  const cur = evs.filter(e => e.placement && !e.anon?.lifted && ['composee', 'saisie', 'preparee'].includes(e.status) && e.date <= todayISO()).sort((a, b) => a.date.localeCompare(b.date));
  if (!cur.length) return '<div class="empty small">Aucune épreuve composée en attente de notes.</div>';
  return `<div class="stack">${cur.map(e => { const p = progressOf(e); return `<div class="stack" style="gap:5px"><div class="row between"><span><b>${esc(subjByCode(e.subj).nom)}</b> · ${levelById(e.level).roman} · ${fmtDate(e.date, 'dm')}</span><span class="small num">${p.done} / ${p.total}${p.arb ? ` · <span style="color:var(--warn)">${p.arb} arbitrage(s)</span>` : ''}</span></div>${progressBar(p.pct, p.pct === 100 ? 'ok' : '')}<div class="row small muted">Échéance ${fmtDate(e.deadline, 'short')}${e.deadline < todayISO() && p.missing ? ' · <b style="color:var(--bad)">en retard</b>' : ''}<span class="spacer"></span><button class="btn sm" data-eval="${e.id}">Détails</button></div></div>`; }).join('')}</div>`;
}
function classMeansChart(lvIds, Sit) {
  const data = [];
  lvIds.forEach(lv => classesOf(lv).forEach(c => { const vals = []; Object.values(S.evals).filter(e => e.sit === Sit && e.anon?.lifted && e.classes.includes(c.id)).forEach(e => (resultsByClass(e)[c.id] || []).forEach(r => { if (r.note !== null) vals.push(r.note); })); const st = statsOf(vals); if (st.n) data.push({ l: c.nom, v: st.mean }); }));
  if (!data.length) return '<div class="empty small">Les moyennes apparaissent après la levée d’anonymat des épreuves de la situation.</div>';
  return barChartSvg(data, { max: 20, ref: +S.settings.seuilReussite || 10, h: 200 }) + '<p class="tiny muted">Moyenne de toutes les notes désanonymisées de la classe pour la situation, toutes matières confondues, sans coefficient.</p>';
}
