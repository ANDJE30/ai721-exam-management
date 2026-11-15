/* =====================================================================
   Éditions PDF (jsPDF + AutoTable) — toujours un seul fichier par export
   ===================================================================== */
const C_ACCENT = [29, 59, 139], C_GOLD = [184, 134, 11], C_INK = [18, 26, 46], C_MUTED = [100, 110, 130], C_LINE = [196, 203, 217], C_SOFT = [234, 238, 246];
const pt = s => String(s ?? '').replace(/[  ]/g, ' ').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[ ]/g, ' ');

function pdfNew(orient = 'p') {
  if (!window.jspdf) throw new Error('La bibliothèque PDF n’est pas chargée. Vérifiez la connexion puis rechargez la page.');
  const doc = new window.jspdf.jsPDF({ orientation: orient, unit: 'mm', format: 'a4', compress: true });
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK);
  doc.__ctx = { used: false, confidential: false };
  doc.setProperties({ title: 'AI721_ASTRA_LUZ_2.0', creator: 'AI721_ASTRA_LUZ_2.0', author: S.settings.etab });
  return doc;
}
const pw = doc => doc.internal.pageSize.getWidth();
const ph = doc => doc.internal.pageSize.getHeight();
function newSection(doc, orient) { if (doc.__ctx.used) doc.addPage('a4', orient || (pw(doc) > ph(doc) ? 'l' : 'p')); doc.__ctx.used = true; doc.__ctx.sectionStart = doc.internal.getNumberOfPages(); }

/* Barres vectorielles Code 128 (jeu C) */
const _bcCache = new Map();
function bcBits(code) {
  if (_bcCache.has(code)) return _bcCache.get(code);
  const o = {}; window.JsBarcode(o, code, { format: 'CODE128C', displayValue: false });
  const bits = (o.encodings || []).map(x => x.data).join('');
  _bcCache.set(code, bits); return bits;
}
function drawBarcode(doc, code, x, y, opt = {}) {
  const bits = bcBits(code); const mw = opt.module || 0.3; const h = opt.h || 9;
  const w = bits.length * mw;
  const x0 = opt.center ? x - w / 2 : x;
  doc.setFillColor(0, 0, 0);
  let i = 0;
  while (i < bits.length) { if (bits[i] === '1') { let j = i; while (j < bits.length && bits[j] === '1') j++; doc.rect(x0 + i * mw, y, (j - i) * mw, h, 'F'); i = j; } else i++; }
  if (opt.text !== false) { doc.setFont('courier', 'bold'); doc.setFontSize(opt.fs || 7.5); doc.setTextColor(0, 0, 0); doc.text(fmtCode(code), x0 + w / 2, y + h + (opt.fs || 7.5) * 0.36 + 0.4, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C_INK); }
  return w;
}

/* En-tête « établissement » (modèle habituel du collège) : tableau encadré établissement | logo | année */
function logoFit(doc, x, y, w, h) {
  const st = S.settings; if (!st.logo) return;
  try { const p = doc.getImageProperties(st.logo); const r = Math.min(w / p.width, h / p.height); const iw = p.width * r, ih = p.height * r; doc.addImage(st.logo, st.logo.includes('image/jpeg') ? 'JPEG' : 'PNG', x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); } catch (e) { drawMonogram(doc, x + w / 2, y + h / 2); }
}
function pdfHeaderEtab(doc, title, sub) {
  const W = pw(doc), st = S.settings, x0 = 12, w = W - 24, top = 9, h1 = 23, h2 = 12, h3 = 5.5;
  const a1 = w * .36, a2 = w * .28, b1 = w * .27, b2 = w * .46;
  const lvl = doc.__ctx.level || ''; const lvId = LEVELS.find(l => l.pref === lvl)?.id;
  doc.setTextColor(...C_INK);
  doc.setFont('times', 'bold'); doc.setFontSize(10.5);
  const el = doc.splitTextToSize(pt(st.etab).toUpperCase(), a1 - 6); let y = top + h1 / 2 - (el.length * 4.3 + 5) / 2 + 3.6;
  el.forEach(l => { doc.text(l, x0 + a1 / 2, y, { align: 'center' }); y += 4.3; });
  doc.setFont('helvetica', 'italic'); doc.setFontSize(6.3); doc.setTextColor(...C_MUTED);
  doc.splitTextToSize(pt(st.tutelle), a1 - 6).slice(0, 2).forEach(l => { doc.text(l, x0 + a1 / 2, y + .6, { align: 'center' }); y += 2.7; });
  logoFit(doc, x0 + a1 + 2, top + 1.5, a2 - 4, h1 - 3);
  doc.setTextColor(...C_INK); doc.setFont('times', 'bold'); doc.setFontSize(10.5);
  doc.text('ANNÉE SCOLAIRE', x0 + a1 + a2 + (w - a1 - a2) / 2, top + h1 / 2 - 1, { align: 'center' });
  doc.setFontSize(12); doc.text(pt(st.annee), x0 + a1 + a2 + (w - a1 - a2) / 2, top + h1 / 2 + 5, { align: 'center' });
  const r2 = top + h1;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.text(lvl ? 'Préfecture :' : 'Service :', x0 + 2, r2 + 4.2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(doc.splitTextToSize(pt(lvl ? lvl.replace('Préfecture de ', '') : st.departement), b1 - 4)[0], x0 + 2, r2 + 9.2);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...C_MUTED); doc.text('SECRÉTARIAT DES ÉVALUATIONS · SECOND CYCLE', x0 + b1 + b2 / 2, r2 + 3.4, { align: 'center' });
  doc.setTextColor(...C_INK); doc.setFont('helvetica', 'bold'); let tf = 11; doc.setFontSize(tf);
  let tl = doc.splitTextToSize(pt(title), b2 - 4); if (tl.length > 1) { tf = 9; doc.setFontSize(tf); tl = doc.splitTextToSize(pt(title), b2 - 4); }
  tl.slice(0, 2).forEach((l, i) => doc.text(l, x0 + b1 + b2 / 2, r2 + (tl.length > 1 ? 6.8 + i * 3.8 : 8.4), { align: 'center' }));
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.text('Date d’édition :', x0 + b1 + b2 + 2, r2 + 4.2);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(new Date().toLocaleDateString('fr-FR'), x0 + b1 + b2 + 2, r2 + 9.2);
  const r3 = r2 + h2; doc.setFillColor(242, 242, 242); doc.rect(x0, r3, w, h3, 'F');
  const resp = lvId && st.prefets?.[lvId] ? `Préfet des études : ${st.prefets[lvId]}` : `Coordonnateur : ${st.coordo}`;
  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(8); doc.text(pt(resp), x0 + w - 2, r3 + 3.8, { align: 'right' });
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(.2);
  doc.line(x0, r2, x0 + w, r2); doc.line(x0, r3, x0 + w, r3);
  doc.line(x0 + a1, top, x0 + a1, r2); doc.line(x0 + a1 + a2, top, x0 + a1 + a2, r2);
  doc.line(x0 + b1, r2, x0 + b1, r3); doc.line(x0 + b1 + b2, r2, x0 + b1 + b2, r3);
  doc.setLineWidth(.8); doc.rect(x0, top, w, h1 + h2 + h3);
  y = r3 + h3 + 5.5;
  if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C_MUTED); doc.splitTextToSize(pt(sub), W - 30).forEach(l => { doc.text(l, W / 2, y, { align: 'center' }); y += 4; }); }
  doc.setTextColor(...C_INK); doc.setFont('helvetica', 'normal');
  return y + 1;
}
/* En-tête officiel bilingue */
function pdfHeader(doc, title, sub) {
  if (S.settings.pdfStyle !== 'officiel') return pdfHeaderEtab(doc, title, sub);
  const W = pw(doc); const st = S.settings; const top = 9;
  const colW = (W - 24 - 30) / 2;
  const lines = (txt) => String(txt || '').split('\n').filter(Boolean);
  const drawCol = (arr, cx) => { let y = top + 2; arr.forEach((l, i) => { const bold = i === 0 || i === arr.length - 1; doc.setFont('helvetica', bold ? 'bold' : (i === 1 ? 'italic' : 'normal')); doc.setFontSize(i === 0 ? 8 : 7); const wrapped = doc.splitTextToSize(pt(l), colW); wrapped.forEach(wl => { doc.text(wl, cx, y, { align: 'center' }); y += 3.1; }); if (i < arr.length - 1) { doc.setFontSize(5); doc.text('* * *', cx, y - 0.6, { align: 'center' }); y += 1.6; } }); return y; };
  doc.setTextColor(...C_INK);
  const y1 = drawCol(lines(st.enteteFR), 12 + colW / 2);
  const y2 = drawCol(lines(st.enteteEN), W - 12 - colW / 2);
  const lx = W / 2 - 12, ly = top;
  if (st.logo) { try { doc.addImage(st.logo, st.logo.includes('image/jpeg') ? 'JPEG' : 'PNG', lx, ly, 24, 24); } catch (e) { drawMonogram(doc, W / 2, ly + 12); } }
  else drawMonogram(doc, W / 2, ly + 12);
  let y = Math.max(y1, y2, ly + 26) + 1.5;
  doc.setDrawColor(...C_ACCENT); doc.setLineWidth(0.6); doc.line(12, y, W - 12, y);
  doc.setDrawColor(...C_GOLD); doc.setLineWidth(0.25); doc.line(12, y + 0.9, W - 12, y + 0.9);
  y += 6.5;
  if (title) { doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...C_ACCENT); doc.text(pt(title), W / 2, y, { align: 'center' }); y += 5.2; }
  if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C_MUTED); doc.splitTextToSize(pt(sub), W - 30).forEach(l => { doc.text(l, W / 2, y, { align: 'center' }); y += 4; }); }
  doc.setTextColor(...C_INK);
  return y + 1.5;
}
function drawMonogram(doc, cx, cy) {
  doc.setDrawColor(...C_ACCENT); doc.setLineWidth(0.5); doc.circle(cx, cy, 11.5); doc.setLineWidth(0.2); doc.circle(cx, cy, 10.3);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C_ACCENT);
  const sig = pt(S.settings.sigle || 'LOGO').split(' ');
  sig.forEach((w, i) => doc.text(w, cx, cy - (sig.length - 1) * 1.6 + i * 3.4 + 1, { align: 'center' }));
  doc.setTextColor(...C_INK); doc.setFont('helvetica', 'normal');
}
function runningHeader(doc, txt) {
  const W = pw(doc); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C_MUTED);
  doc.text(pt(`${S.settings.etab} · ${txt}`), 12, 10); doc.text(pt(`Année scolaire ${S.settings.annee}`), W - 12, 10, { align: 'right' });
  doc.setDrawColor(...C_LINE); doc.setLineWidth(0.2); doc.line(12, 12, W - 12, 12); doc.setTextColor(...C_INK);
}
function pdfFooters(doc, label) {
  const n = doc.internal.getNumberOfPages(); const now = new Date().toLocaleString('fr-FR');
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); const W = pw(doc), H = ph(doc);
    if (S.settings.pdfStyle !== 'officiel') {
      doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3); doc.setLineDashPattern([2.2, 1.4], 0); doc.line(12, H - 12, W - 12, H - 12); doc.setLineDashPattern([], 0);
      doc.setTextColor(...C_INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); const t1 = 'Page ', t2 = ` ${i} `, t3 = 'sur', t4 = ` ${n}`;
      const wt = doc.getTextWidth(t1) + doc.getTextWidth(t3); doc.setFont('helvetica', 'normal'); const wn = doc.getTextWidth(t2) + doc.getTextWidth(t4); let xx = W / 2 - (wt + wn) / 2;
      doc.setFont('helvetica', 'bold'); doc.text(t1, xx, H - 7.5); xx += doc.getTextWidth(t1); doc.setFont('helvetica', 'normal'); doc.text(t2, xx, H - 7.5); xx += doc.getTextWidth(t2); doc.setFont('helvetica', 'bold'); doc.text(t3, xx, H - 7.5); xx += doc.getTextWidth(t3); doc.setFont('helvetica', 'normal'); doc.text(t4, xx, H - 7.5);
      doc.setFontSize(6.5); doc.setTextColor(...C_MUTED); doc.text(pt(`${APP.name} · ${label || ''} · ${now}`), 12, H - 4.5);
    } else {
    doc.setDrawColor(...C_LINE); doc.setLineWidth(0.2); doc.line(12, H - 11, W - 12, H - 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C_MUTED);
    doc.text(pt(`${APP.name} · ${label || ''} · édité le ${now}`), 12, H - 7);
    doc.text(`Page ${i} / ${n}`, W - 12, H - 7, { align: 'right' }); }
    if (doc.__ctx.confidential) { doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C_GOLD); doc.text('CONFIDENTIEL', W - 12, H - 7.5, { align: 'right' }); }
  }
  doc.setTextColor(...C_INK);
}
function metaGrid(doc, y, pairs, cols = 3) {
  const W = pw(doc); const x0 = 12, w = (W - 24) / cols; const rowH = 9.2;
  const rows = Math.ceil(pairs.length / cols);
  doc.setFillColor(...C_SOFT); doc.setDrawColor(...C_LINE); doc.setLineWidth(0.15); doc.roundedRect(x0, y, W - 24, rows * rowH + 1.5, 1.5, 1.5, 'FD');
  pairs.forEach(([k, v], i) => { const cx = x0 + 3 + (i % cols) * w, cy = y + 4 + Math.floor(i / cols) * rowH; doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(...C_MUTED); doc.text(pt(k).toUpperCase(), cx, cy); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C_INK); doc.text(doc.splitTextToSize(pt(v || '—'), w - 5)[0], cx, cy + 4.2); });
  doc.setFont('helvetica', 'normal');
  return y + rows * rowH + 5;
}
function signatures(doc, y, labels) {
  const W = pw(doc), H = ph(doc); if (y > H - 40) { doc.addPage(); runningHeader(doc, 'Signatures'); y = 22; }
  const w = (W - 24) / labels.length; doc.setFontSize(8.5);
  labels.forEach((l, i) => { const cx = 12 + i * w + w / 2; doc.setFont('helvetica', 'bold'); doc.text(pt(l), cx, y + 4, { align: 'center' }); doc.setFont('helvetica', 'normal'); doc.setDrawColor(...C_LINE); doc.line(cx - w / 2 + 8, y + 22, cx + w / 2 - 8, y + 22); });
  return y + 28;
}
const tableBase = (doc) => ({
  theme: 'grid', rowPageBreak: 'avoid', styles: { font: 'helvetica', fontSize: 8.4, cellPadding: 1.5, lineColor: C_LINE, lineWidth: 0.12, textColor: C_INK, valign: 'middle', overflow: 'linebreak' },
  headStyles: { fillColor: C_ACCENT, textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
  alternateRowStyles: { fillColor: [247, 248, 252] }, margin: { left: 12, right: 12, top: 17, bottom: 16 }
});
function autoT(doc, opts, runLabel) {
  const start = doc.internal.getNumberOfPages();
  doc.autoTable({ ...tableBase(doc), ...opts, didDrawPage: d => { if (doc.internal.getCurrentPageInfo().pageNumber > start) runningHeader(doc, runLabel); if (opts.didDrawPage) opts.didDrawPage(d); } });
  return doc.lastAutoTable.finalY;
}
const teacherOf = (cid, subj) => teacherName(S.classes[cid]?.subjects.find(s => s.m === subj)?.prof);
const evalMeta = (e, cls) => [
  ['Niveau', levelById(e.level).nom], ['Classe(s)', cls ? cls.nom : evalClassNames(e)], ['Matière', subjByCode(e.subj).nom],
  ['Trimestre / situation', `Trimestre ${e.trim} · Situation ${e.sit}`], ['Date', fmtDate(e.date)], ['Créneau', `${fmtTime(e.start)} – ${fmtTime(e.end)} (${duree(e.start, e.end)})`]
];
const sortEvals = evs => evs.slice().sort((a, b) => (a.date + a.start + a.level).localeCompare(b.date + b.start + b.level) || subjByCode(a.subj).nom.localeCompare(subjByCode(b.subj).nom));
function needPlacement(evs) { const miss = evs.filter(e => !e.placement); if (miss.length) throw new Error(`Codes non générés pour : ${miss.map(e => evalShort(e) + ' ' + levelById(e.level).roman).join(', ')}. Générez d’abord la répartition.`); }

/* 1. Listes de classe avec codes-barres (toutes les classes du niveau, même matière, même date) */
function addListesClasse(doc, evs) {
  needPlacement(evs);
  for (const e of sortEvals(evs)) {
    for (const cid of e.classes.slice().sort((a, b) => (S.classes[a]?.rang || 0) - (S.classes[b]?.rang || 0))) {
      const cls = S.classes[cid]; if (!cls) continue;
      const rows = e.placement.list.filter(x => x[1] === cid).map(x => { const fs = findStudent(x[0]); return { st: fs?.st, name: fs ? fullName(fs.st) : x[3], table: x[2], code: codeOf(e, cid, x[2]), room: roomOfTable(e, x[2])?.nom || '' }; }).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      newSection(doc, 'p');
      doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, 'LISTE DE CLASSE · ÉPREUVE ANONYME', `${cls.nom} · ${subjByCode(e.subj).nom} · Trimestre ${e.trim}, situation ${e.sit}`);
      y = metaGrid(doc, y, [...evalMeta(e, cls), ['Enseignant', teacherOf(cid, e.subj)], ['Effectif', String(rows.length)], ['Préfet des études', S.settings.prefets?.[e.level] || '']]);
      autoT(doc, {
        startY: y, head: [['N°', 'Matricule', 'Noms et prénoms', 'S', 'Salle', 'Table', 'Code-barres', 'Émargement']],
        body: rows.map((r, i) => [i + 1, r.st?.mat || '', r.name, r.st?.sexe || '', r.room, pad(r.table, 3), '', '']),
        columnStyles: { 0: { halign: 'center', cellWidth: 8 }, 1: { cellWidth: 19, fontSize: 7.5 }, 2: { cellWidth: 52 }, 3: { halign: 'center', cellWidth: 6 }, 4: { cellWidth: 16, fontSize: 7.5 }, 5: { halign: 'center', cellWidth: 11, font: 'courier', fontStyle: 'bold' }, 6: { cellWidth: 44, minCellHeight: 14.5 }, 7: { cellWidth: 30 } },
        didDrawCell: d => { if (d.section === 'body' && d.column.index === 6) { const r = rows[d.row.index]; if (!r) return; drawBarcode(doc, r.code, d.cell.x + d.cell.width / 2, d.cell.y + 1.6, { center: true, h: 8.4, module: 0.31, fs: 6.8 }); } }
      }, `${cls.nom} · ${subjByCode(e.subj).abbr} · T${e.trim}S${e.sit}`);
      signatures(doc, doc.lastAutoTable.finalY + 6, ['Le Secrétariat des évaluations', 'Le Préfet des études']);
    }
  }
}
/* 2. Listes d'émargement par salle + procès-verbal de salle */
function addEmargement(doc, evs) {
  needPlacement(evs);
  for (const e of sortEvals(evs)) {
    for (const r of e.placement.rooms) {
      const rows = e.placement.list.filter(x => x[2] >= r.from && x[2] <= r.to).sort((a, b) => a[2] - b[2]);
      newSection(doc, 'p');
      doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, `LISTE D’ÉMARGEMENT · ${pt(r.nom).toUpperCase()}`, `${levelById(e.level).nom} · ${subjByCode(e.subj).nom} · T${e.trim} S${e.sit} · tables ${pad(r.from, 3)} à ${pad(r.to, 3)}`);
      y = metaGrid(doc, y, [...evalMeta(e), ['Salle', r.nom], ['Tables', `${pad(r.from, 3)} – ${pad(r.to, 3)} (${rows.length} places)`], ['Surveillants', (r.surv || []).map(teacherName).join(' ; ') || 'À désigner']]);
      autoT(doc, {
        startY: y, head: [['Table', 'Code-barres', 'Noms et prénoms', 'Classe', 'Sign. entrée', 'Feuilles', 'Sign. remise']],
        body: rows.map(x => [pad(x[2], 3), '', (findStudent(x[0]) ? fullName(findStudent(x[0]).st) : x[3]), S.classes[x[1]]?.nom || '', '', '', '']),
        columnStyles: { 0: { halign: 'center', cellWidth: 11, font: 'courier', fontStyle: 'bold' }, 1: { cellWidth: 42, minCellHeight: 13.5 }, 2: { cellWidth: 52 }, 3: { cellWidth: 14, halign: 'center' }, 4: { cellWidth: 25 }, 5: { cellWidth: 14 }, 6: { cellWidth: 28 } },
        didDrawCell: d => { if (d.section === 'body' && d.column.index === 1) { const x = rows[d.row.index]; if (!x) return; drawBarcode(doc, codeOf(e, x[1], x[2]), d.cell.x + d.cell.width / 2, d.cell.y + 1.5, { center: true, h: 7.8, module: 0.3, fs: 6.5 }); } }
      }, `Émargement ${r.nom} · ${subjByCode(e.subj).abbr}`);
      let yy = doc.lastAutoTable.finalY + 5; if (yy > ph(doc) - 62) { doc.addPage(); runningHeader(doc, `PV ${r.nom}`); yy = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C_ACCENT); doc.text('PROCÈS-VERBAL DE SALLE', 12, yy); doc.setTextColor(...C_INK);
      autoT(doc, { startY: yy + 2, head: [['Inscrits', 'Présents', 'Absents', 'Copies remises', 'Heure de début', 'Heure de fin']], body: [[String(rows.length), '', '', '', fmtTime(e.start), fmtTime(e.end)]], bodyStyles: { minCellHeight: 9, halign: 'center' } }, 'PV');
      let y3 = doc.lastAutoTable.finalY + 4; doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.text('Incidents / observations :', 12, y3); doc.setDrawColor(...C_LINE); for (let k = 1; k <= 3; k++) doc.line(12, y3 + k * 6, pw(doc) - 12, y3 + k * 6);
      signatures(doc, y3 + 21, ['Surveillant 1', 'Surveillant 2', 'Chef de centre']);
    }
  }
}
/* 3. Planches d'étiquettes adhésives */
const LABEL_FORMATS = {
  '3x8': { l: 'A4 · 3 × 8 étiquettes (70 × 37 mm)', cols: 3, rows: 8, w: 70, h: 37.125, mt: 0, ml: 0, gx: 0, gy: 0 },
  '3x7': { l: 'A4 · 3 × 7 étiquettes (70 × 42,4 mm)', cols: 3, rows: 7, w: 70, h: 42.4, mt: 0, ml: 0, gx: 0, gy: 0 },
  '2x8': { l: 'A4 · 2 × 8 étiquettes (99,1 × 33,9 mm)', cols: 2, rows: 8, w: 99.1, h: 33.9, mt: 13, ml: 4.65, gx: 2.5, gy: 0 },
  '3x10': { l: 'A4 · 3 × 10 étiquettes (63,5 × 25,4 mm)', cols: 3, rows: 10, w: 63.5, h: 25.4, mt: 21.5, ml: 7.2, gx: 2.5, gy: 0 }
};
function addEtiquettes(doc, evs, type = 'paire', fmtKey = '3x8', cut = true) {
  needPlacement(evs);
  const F = LABEL_FORMATS[fmtKey] || LABEL_FORMATS['3x8'];
  const items = [];
  for (const e of sortEvals(evs)) for (const x of e.placement.list.slice().sort((a, b) => a[2] - b[2])) {
    const fs = findStudent(x[0]); const name = fs ? fullName(fs.st) : x[3]; const code = codeOf(e, x[1], x[2]); const room = roomOfTable(e, x[2])?.nom || '';
    const base = { e, code, name, cls: S.classes[x[1]]?.nom || '', room, table: x[2] };
    if (type === 'paire' || type === 'nominative') items.push({ ...base, kind: 'nom' });
    if (type === 'paire' || type === 'anonyme') items.push({ ...base, kind: 'anon' });
  }
  const per = F.cols * F.rows;
  for (let p = 0; p * per < items.length; p++) {
    newSection(doc, 'p');
    items.slice(p * per, p * per + per).forEach((it, k) => {
      const c = k % F.cols, r = Math.floor(k / F.cols);
      const x = F.ml + c * (F.w + F.gx), y = F.mt + r * (F.h + F.gy);
      if (cut) { doc.setDrawColor(220, 224, 232); doc.setLineWidth(0.1); doc.rect(x + 0.5, y + 0.5, F.w - 1, F.h - 1); }
      const cx = x + F.w / 2; const small = F.h < 30;
      const mod = Math.min(0.33, (F.w - 10) / 101);
      doc.setTextColor(...C_INK);
      if (it.kind === 'nom') {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(small ? 7 : 8); doc.text(doc.splitTextToSize(pt(it.name), F.w - 6)[0], cx, y + (small ? 4 : 5.2), { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(small ? 6 : 6.8); doc.text(pt(`${it.cls} · ${it.room} · Table ${pad(it.table, 3)}`), cx, y + (small ? 7 : 8.8), { align: 'center' });
        drawBarcode(doc, it.code, cx, y + (small ? 8.2 : 10.5), { center: true, h: small ? 9 : Math.min(13, F.h - 21), module: mod, fs: small ? 6 : 7 });
        doc.setFontSize(small ? 5.5 : 6.2); doc.setTextColor(...C_MUTED); doc.text(pt(`${subjByCode(it.e.subj).abbr} · T${it.e.trim} S${it.e.sit} · ${fmtDate(it.e.date, 'short')} · EN-TÊTE`), cx, y + F.h - 2.2, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(small ? 7 : 8); doc.setTextColor(...C_ACCENT); doc.text(pt(`${subjByCode(it.e.subj).abbr} · ${levelById(it.e.level).nom} · T${it.e.trim} S${it.e.sit}`), cx, y + (small ? 4 : 5.2), { align: 'center' });
        doc.setTextColor(...C_INK);
        drawBarcode(doc, it.code, cx, y + (small ? 6 : 8), { center: true, h: small ? 11 : Math.min(15, F.h - 18), module: mod, fs: small ? 6.5 : 7.5 });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(small ? 5.5 : 6.2); doc.setTextColor(...C_MUTED); doc.text(pt(`Copie anonyme · ${fmtDate(it.e.date, 'short')}`), cx, y + F.h - 2.2, { align: 'center' });
      }
      doc.setTextColor(...C_INK);
    });
  }
  doc.__ctx.noFooter = true;
}
/* 4. Bordereaux de notation anonymes, par salle et par lot */
function addBordereaux(doc, evs, lot) {
  needPlacement(evs); lot = +lot || +S.settings.tailleLot || 25;
  for (const e of sortEvals(evs)) {
    const all = e.placement.list.slice().sort((a, b) => a[2] - b[2]);
    const lots = []; for (let i = 0; i < all.length; i += lot) lots.push(all.slice(i, i + lot));
    lots.forEach((rows, li) => {
      newSection(doc, 'p');
      doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, 'BORDEREAU DE NOTATION ANONYME', `${levelById(e.level).nom} · ${subjByCode(e.subj).nom} · T${e.trim} S${e.sit} · lot ${li + 1} sur ${lots.length}`);
      y = metaGrid(doc, y, [['Matière', subjByCode(e.subj).nom], ['Niveau', levelById(e.level).nom], ['Trimestre / situation', `T${e.trim} · S${e.sit}`], ['Date de l’épreuve', fmtDate(e.date, 'short')], ['Tables', `${pad(rows[0][2], 3)} – ${pad(rows[rows.length - 1][2], 3)}`], ['Barème', `Note sur ${e.bareme || 20}`]]);
      const head = e.double ? [['N°', 'Code-barres', 'Note 1re corr.', 'Note 2e corr.', 'Observations']] : [['N°', 'Code-barres', 'Note', 'Observations']];
      autoT(doc, {
        startY: y, head, body: rows.map((x, i) => e.double ? [i + 1, '', '', '', ''] : [i + 1, '', '', '']),
        columnStyles: e.double ? { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 52, minCellHeight: 13 }, 2: { cellWidth: 26 }, 3: { cellWidth: 26 }, 4: {} } : { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 56, minCellHeight: 13 }, 2: { cellWidth: 30 }, 3: {} },
        didDrawCell: d => { if (d.section === 'body' && d.column.index === 1) { const x = rows[d.row.index]; if (!x) return; drawBarcode(doc, codeOf(e, x[1], x[2]), d.cell.x + d.cell.width / 2, d.cell.y + 1.4, { center: true, h: 7.6, module: 0.3, fs: 6.5 }); } }
      }, `Bordereau ${subjByCode(e.subj).abbr} · lot ${li + 1}`);
      signatures(doc, doc.lastAutoTable.finalY + 6, ['Correcteur (nom et signature)', 'Date de remise', 'Reçu par le Secrétariat']);
    });
  }
}
/* 5. Table de correspondance (sous pli scellé) */
function addCorrespondance(doc, evs) {
  needPlacement(evs); doc.__ctx.confidential = true;
  for (const e of sortEvals(evs)) {
    newSection(doc, 'p');
    doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, 'TABLE DE CORRESPONDANCE CODE ↔ ÉLÈVE'.replace('↔', '/'), `À conserver sous pli scellé jusqu’à la levée d’anonymat · ${levelById(e.level).nom} · ${subjByCode(e.subj).nom} · T${e.trim} S${e.sit}`);
    y = metaGrid(doc, y, evalMeta(e));
    const rows = e.placement.list.slice().sort((a, b) => a[2] - b[2]);
    autoT(doc, { startY: y, head: [['Table', 'Code', 'Salle', 'Classe', 'Matricule', 'Noms et prénoms']], body: rows.map(x => { const fs = findStudent(x[0]); return [pad(x[2], 3), fmtCode(codeOf(e, x[1], x[2])), roomOfTable(e, x[2])?.nom || '', S.classes[x[1]]?.nom || '', fs?.st.mat || '', fs ? fullName(fs.st) : x[3]]; }), columnStyles: { 0: { halign: 'center', cellWidth: 12, font: 'courier' }, 1: { font: 'courier', cellWidth: 38 }, 2: { cellWidth: 20 }, 3: { cellWidth: 16 }, 4: { cellWidth: 22 } } }, `Correspondance ${subjByCode(e.subj).abbr}`);
    signatures(doc, doc.lastAutoTable.finalY + 6, ['Scellé par (Secrétariat)', 'Ouvert par (Coordination)', 'Témoin']);
  }
}
/* 6. Relevés de notes désanonymisés */
function addReleves(doc, evs) {
  const ok = evs.filter(e => e.anon?.lifted);
  if (!ok.length) throw new Error('Aucune des épreuves choisies n’a été désanonymisée.');
  for (const e of sortEvals(ok)) {
    const res = resultsByClass(e);
    for (const cid of e.classes.slice().sort((a, b) => (S.classes[a]?.rang || 0) - (S.classes[b]?.rang || 0))) {
      const cls = S.classes[cid]; if (!cls) continue;
      const rows = withRanks(res[cid] || []); const st = statsOf(rows.map(r => r.note));
      const sj = cls.subjects.find(s => s.m === e.subj);
      newSection(doc, 'p');
      doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, `RELEVÉ DE NOTES · ${cls.nom}`, `${subjByCode(e.subj).nom} · Trimestre ${e.trim}, situation ${e.sit} · épreuve du ${fmtDate(e.date)}`);
      y = metaGrid(doc, y, [['Classe', cls.nom], ['Matière', subjByCode(e.subj).nom], ['Coefficient', String(sj?.coef ?? '—')], ['Enseignant', teacherOf(cid, e.subj)], ['Effectif', String(rows.length)], ['Anonymat levé le', fmtDT(e.anon.at)]]);
      autoT(doc, {
        startY: y, head: [['N°', 'Matricule', 'Noms et prénoms', 'S', 'Note / 20', 'Rang', 'Appréciation']],
        body: rows.map((r, i) => [i + 1, r.mat, r.name, r.sexe, r.note === null ? (r.st === 'ABS' ? 'ABS' : r.st === 'DISP' ? 'DISP' : r.st === 'FRAUDE' ? 'FRAUDE' : '—') : fmtNote(r.note), r.rang ? (r.rang === 1 ? '1er' : r.rang + 'e') : '', appreciation(r.note)]),
        columnStyles: { 0: { halign: 'center', cellWidth: 9 }, 1: { cellWidth: 22 }, 2: { cellWidth: 66 }, 3: { halign: 'center', cellWidth: 7 }, 4: { halign: 'center', cellWidth: 19, fontStyle: 'bold' }, 5: { halign: 'center', cellWidth: 13 }, 6: {} },
        didParseCell: d => { if (d.section === 'body' && d.column.index === 4) { const r = rows[d.row.index]; if (r && r.note !== null && r.note < (+S.settings.seuilReussite || 10)) d.cell.styles.textColor = [179, 38, 30]; } }
      }, `Relevé ${cls.nom} · ${subjByCode(e.subj).abbr}`);
      let y2 = doc.lastAutoTable.finalY + 5; if (y2 > ph(doc) - 70) { doc.addPage(); runningHeader(doc, `Statistiques ${cls.nom}`); y2 = 20; }
      const abs = rows.filter(r => r.st === 'ABS').length;
      autoT(doc, { startY: y2, head: [['Présents', 'Absents', 'Moyenne', 'Note mini', 'Note maxi', 'Écart-type', `Notes >= ${S.settings.seuilReussite}`, 'Taux de réussite']], body: [[st.n, abs, fmtNote(st.mean), fmtNote(st.min), fmtNote(st.max), fmtNote(st.sd), st.pass, st.rate === null ? '—' : fmtNote(st.rate) + ' %']], bodyStyles: { halign: 'center', fontStyle: 'bold' }, headStyles: { fillColor: C_GOLD, textColor: 255, fontSize: 7.5, halign: 'center' } }, 'Statistiques');
      autoT(doc, { startY: doc.lastAutoTable.finalY + 2, head: [BIN_LABELS], body: [st.bins.map(String)], bodyStyles: { halign: 'center' }, headStyles: { fillColor: [70, 80, 106], textColor: 255, fontSize: 7.5, halign: 'center' } }, 'Répartition');
      signatures(doc, doc.lastAutoTable.finalY + 6, ['L’Enseignant', 'Le Préfet des études', 'Le Coordonnateur']);
    }
  }
}
/* 7. Planning des évaluations */
function addPlanning(doc, levelIds, filt = {}) {
  for (const lv of levelIds) {
    let evs = sortEvals(evalsOf(lv).filter(e => (!filt.trim || e.trim === +filt.trim) && (!filt.sit || e.sit === +filt.sit) && (!filt.from || e.date >= filt.from) && (!filt.to || e.date <= filt.to)));
    newSection(doc, 'l');
    doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, `PLANNING DES ÉVALUATIONS · ${levelById(lv).pref.toUpperCase()}`, [filt.trim ? `Trimestre ${filt.trim}` : '', filt.sit ? `Situation ${filt.sit}` : '', filt.from ? `du ${fmtDate(filt.from, 'short')}` : '', filt.to ? `au ${fmtDate(filt.to, 'short')}` : ''].filter(Boolean).join(' · ') || 'Toutes les évaluations enregistrées');
    if (!evs.length) { doc.setFontSize(10); doc.text('Aucune évaluation planifiée pour ces critères.', 12, y + 6); continue; }
    autoT(doc, { startY: y, head: [['Date', 'Créneau', 'Durée', 'T / S', 'Matière', 'Classes', 'Effectif', 'Salles', 'Statut']], body: evs.map(e => [fmtDate(e.date, 'dm'), `${fmtTime(e.start)} – ${fmtTime(e.end)}`, duree(e.start, e.end), `T${e.trim} S${e.sit}`, subjByCode(e.subj).nom, evalClassNames(e), String(candidatesOf(e).length), (e.placement?.rooms || []).map(r => r.nom).join(', ') || '—', STATUS[e.status]?.l || '']), columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 28 }, 2: { cellWidth: 15 }, 3: { cellWidth: 14, halign: 'center' }, 4: { cellWidth: 40 }, 6: { cellWidth: 16, halign: 'center' }, 8: { cellWidth: 26 } } }, `Planning ${levelById(lv).nom}`);
    signatures(doc, doc.lastAutoTable.finalY + 6, ['Le Préfet des études', 'Le Coordonnateur', 'Visa du Censeur']);
  }
}
/* 8. Rapport statistique */
function addStats(doc, evs) {
  const ok = sortEvals(evs.filter(e => e.anon?.lifted));
  if (!ok.length) throw new Error('Les statistiques nominatives exigent des épreuves désanonymisées.');
  for (const e of ok) {
    const res = resultsByClass(e);
    newSection(doc, 'p');
    doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, 'RAPPORT STATISTIQUE D’ÉPREUVE', `${levelById(e.level).nom} · ${subjByCode(e.subj).nom} · T${e.trim} S${e.sit} · ${fmtDate(e.date)}`);
    const rowsAll = Object.values(res).flat(); const g = statsOf(rowsAll.map(r => r.note));
    y = metaGrid(doc, y, [['Présents', String(g.n)], ['Moyenne du niveau', fmtNote(g.mean)], ['Taux de réussite', g.rate === null ? '—' : fmtNote(g.rate) + ' %'], ['Note mini / maxi', `${fmtNote(g.min)} / ${fmtNote(g.max)}`], ['Écart-type', fmtNote(g.sd)], ['Médiane', fmtNote(g.med)]]);
    const per = e.classes.map(cid => { const r = res[cid] || []; return { cls: S.classes[cid], st: statsOf(r.map(x => x.note)), abs: r.filter(x => x.st === 'ABS').length, eff: r.length }; }).filter(x => x.cls).sort((a, b) => a.cls.rang - b.cls.rang);
    autoT(doc, { startY: y, head: [['Classe', 'Enseignant', 'Eff.', 'Prés.', 'Abs.', 'Moy.', 'Mini', 'Maxi', 'É.-type', 'Réussite']], body: per.map(p => [p.cls.nom, teacherOf(p.cls.id, e.subj), p.eff, p.st.n, p.abs, fmtNote(p.st.mean), fmtNote(p.st.min), fmtNote(p.st.max), fmtNote(p.st.sd), p.st.rate === null ? '—' : fmtNote(p.st.rate) + ' %']), columnStyles: { 0: { fontStyle: 'bold', cellWidth: 16 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center', fontStyle: 'bold' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' }, 9: { halign: 'center' } } }, 'Statistiques');
    let yy = doc.lastAutoTable.finalY + 8; if (yy > ph(doc) - 90) { doc.addPage(); runningHeader(doc, 'Graphiques'); yy = 20; }
    yy = pdfBarChart(doc, 12, yy, pw(doc) - 24, 52, per.map(p => ({ l: p.cls.nom, v: p.st.mean })), 'Moyenne par classe (sur 20)', 20, +S.settings.seuilReussite || 10);
    yy = pdfBarChart(doc, 12, yy + 6, pw(doc) - 24, 46, BIN_LABELS.map((l, i) => ({ l, v: g.bins[i] })), 'Répartition des notes du niveau (nombre d’élèves)', null, null);
    const top = rowsAll.filter(r => r.note !== null).sort((a, b) => b.note - a.note).slice(0, 10);
    if (top.length) { let y3 = yy + 4; if (y3 > ph(doc) - 60) { doc.addPage(); runningHeader(doc, 'Palmarès'); y3 = 20; } autoT(doc, { startY: y3, head: [['Rang', 'Noms et prénoms', 'Classe', 'Note / 20']], body: top.map((r, i) => [i + 1, r.name, S.classes[r.cid]?.nom || '', fmtNote(r.note)]), headStyles: { fillColor: C_GOLD, textColor: 255 }, columnStyles: { 0: { halign: 'center', cellWidth: 14 }, 3: { halign: 'center', fontStyle: 'bold', cellWidth: 24 } } }, 'Palmarès'); }
  }
}
function pdfBarChart(doc, x, y, w, h, data, title, maxV, ref) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C_INK); doc.text(pt(title), x, y); y += 3;
  const max = maxV || Math.ceil(Math.max(1, ...data.map(d => d.v || 0)) * 1.15); const ch = h - 10; const n = data.length; const bw = Math.min(16, (w - 10) / n * 0.62); const step = (w - 10) / n;
  doc.setDrawColor(...C_LINE); doc.setLineWidth(0.15);
  for (let k = 0; k <= 4; k++) { const yy = y + ch - ch * k / 4; doc.line(x + 8, yy, x + w, yy); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C_MUTED); doc.text(String(Math.round(max * k / 4 * 10) / 10).replace('.', ','), x + 6.5, yy + 1, { align: 'right' }); }
  data.forEach((d, i) => { const v = d.v || 0; const bh = ch * v / max; const bx = x + 8 + i * step + (step - bw) / 2; doc.setFillColor(...C_ACCENT); if (bh > 0) doc.rect(bx, y + ch - bh, bw, bh, 'F'); doc.setFontSize(6.5); doc.setTextColor(...C_INK); if (d.v !== null && d.v !== undefined) doc.text(maxV ? fmtNote(d.v) : String(d.v), bx + bw / 2, y + ch - bh - 1, { align: 'center' }); doc.setTextColor(...C_MUTED); doc.text(pt(d.l), bx + bw / 2, y + ch + 3.5, { align: 'center' }); });
  if (ref) { const yy = y + ch - ch * ref / max; doc.setDrawColor(...C_GOLD); doc.setLineWidth(0.4); doc.setLineDashPattern([1.5, 1], 0); doc.line(x + 8, yy, x + w, yy); doc.setLineDashPattern([], 0); doc.setFontSize(6.5); doc.setTextColor(...C_GOLD); doc.text(`seuil ${ref}`, x + w, yy - 1, { align: 'right' }); }
  doc.setTextColor(...C_INK); return y + h;
}
/* 9. Procès-verbal de levée d'anonymat */
function addPV(doc, e) {
  newSection(doc, 'p'); const pr = progressOf(e);
  doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, 'PROCÈS-VERBAL DE LEVÉE D’ANONYMAT', `${levelById(e.level).nom} · ${subjByCode(e.subj).nom} · Trimestre ${e.trim}, situation ${e.sit}`);
  y = metaGrid(doc, y, [...evalMeta(e), ['Copies attendues', String(pr.total)], ['Copies notées', String(pr.done - pr.abs)], ['Absents', String(pr.abs)]]);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  const txt = `Le ${fmtDate(new Date(e.anon?.at || Date.now()).toISOString().slice(0, 10))}, l’anonymat des copies de l’épreuve de ${subjByCode(e.subj).nom} (${levelById(e.level).nom}, trimestre ${e.trim}, situation ${e.sit}) composée le ${fmtDate(e.date)} a été levé par ${e.anon?.by || '…'} au moyen de l’application ${APP.name}. ${pr.total} copies étaient attendues ; ${pr.done - pr.abs} ont été notées et ${pr.abs} élève(s) ont été déclaré(s) absent(s). Les notes saisies sous code ont été rattachées aux élèves à partir de la table de correspondance générée le ${fmtDT(e.placement?.at)}. Aucune note n’a été modifiée après la levée d’anonymat sans mention au journal d’audit.`;
  doc.splitTextToSize(pt(txt), pw(doc) - 24).forEach(l => { doc.text(l, 12, y); y += 5; });
  signatures(doc, y + 8, ['Le Secrétariat des évaluations', 'Le Préfet des études', 'Le Coordonnateur']);
}
/* 10. Fiche de suivi d'un élève */
function addFicheEleve(doc, sid) {
  const fs = findStudent(sid); if (!fs) throw new Error('Élève introuvable.');
  newSection(doc, 'p');
  doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, 'FICHE DE SUIVI DES ÉVALUATIONS', `${fullName(fs.st)} · ${fs.cls.nom} · année scolaire ${S.settings.annee}`);
  y = metaGrid(doc, y, [['Noms et prénoms', fullName(fs.st)], ['Matricule', fs.st.mat], ['Classe', fs.cls.nom], ['Sexe', fs.st.sexe], ['Date de naissance', fs.st.dn ? fmtDate(fs.st.dn, 'short') : ''], ['Statut', fs.st.statut || '']]);
  const evs = sortEvals(Object.values(S.evals).filter(e => e.anon?.lifted && e.placement?.list.some(x => x[0] === sid)));
  const body = evs.map(e => { const x = e.placement.list.find(z => z[0] === sid); const m = e.marks?.[markKey(x[2])]; const f = finalMark(m, e); const res = resultsByClass(e)[fs.cls.id] || []; const st = statsOf(res.map(r => r.note)); return [fmtDate(e.date, 'short'), `T${e.trim} S${e.sit}`, subjByCode(e.subj).nom, f === null ? (m?.st || '—') : fmtNote(f), fmtNote(st.mean), appreciation(f)]; });
  autoT(doc, { startY: y, head: [['Date', 'T / S', 'Matière', 'Note / 20', 'Moy. classe', 'Appréciation']], body: body.length ? body : [['', '', 'Aucune note désanonymisée pour le moment', '', '', '']], columnStyles: { 3: { halign: 'center', fontStyle: 'bold' }, 4: { halign: 'center' } } }, `Fiche ${fullName(fs.st)}`);
}
/* Dossier complet d'une journée (un seul fichier) */
function addDossierJournee(doc, evs, opts) {
  const sorted = sortEvals(evs);
  newSection(doc, 'p');
  doc.__ctx.level = (typeof e !== 'undefined' && e && e.level) ? levelById(e.level).pref : ((typeof lv !== 'undefined' && levelById(lv)) ? levelById(lv).pref : ''); let y = pdfHeader(doc, 'DOSSIER DES ÉPREUVES DU JOUR', `${fmtDate(sorted[0].date)} · ${[...new Set(sorted.map(e => levelById(e.level).nom))].join(', ')}`);
  autoT(doc, { startY: y, head: [['Créneau', 'Niveau', 'Matière', 'T / S', 'Classes', 'Salles', 'Effectif']], body: sorted.map(e => [`${fmtTime(e.start)} – ${fmtTime(e.end)}`, levelById(e.level).nom, subjByCode(e.subj).nom, `T${e.trim} S${e.sit}`, evalClassNames(e), (e.placement?.rooms || []).map(r => r.nom).join(', ') || 'non réparti', String(e.placement?.list.length || candidatesOf(e).length)]) }, 'Sommaire du jour');
  let y2 = doc.lastAutoTable.finalY + 6; doc.setFontSize(8.5); doc.setTextColor(...C_MUTED);
  const parts = ['Contenu : sommaire', opts.emarg && 'listes d’émargement par salle', opts.listes && 'listes de classe avec codes-barres', opts.bord && 'bordereaux de notation anonymes', opts.corr && 'tables de correspondance (confidentiel)'].filter(Boolean).join(' ; ');
  doc.text(doc.splitTextToSize(pt(parts + '.'), pw(doc) - 24), 12, y2); doc.setTextColor(...C_INK);
  if (opts.emarg) addEmargement(doc, sorted);
  if (opts.listes) addListesClasse(doc, sorted);
  if (opts.bord) addBordereaux(doc, sorted);
  if (opts.corr) addCorrespondance(doc, sorted);
}

/* ---------- Enregistrement des fichiers ---------- */
async function saveBlob(filename, blob) {
  if (S.caps.downloads) {
    try { await S.caps.downloads.save({ filename, data: blob }); toast(`Fichier enregistré : ${filename}`, 'ok'); return true; }
    catch (e) { if (e && e.code === 'declined') { toast('Enregistrement annulé.'); return false; } if (e && (e.code === 'rejected_extension' || e.code === 'too_large')) { toast(`Enregistrement refusé (${e.code}).`, 'bad'); return false; } }
  }
  try {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 20000);
    toast(`Fichier généré : ${filename}`, 'ok'); return true;
  } catch (e) { toast('Le navigateur a bloqué le téléchargement.', 'bad'); return false; }
}
async function runPdf(filename, label, build, orient = 'p') {
  await withBusy('Génération du PDF…', async () => {
    await ensurePdfLibs();
    const doc = pdfNew(orient); build(doc);
    if (!doc.__ctx.noFooter) pdfFooters(doc, label);
    const pages = doc.internal.getNumberOfPages();
    const blob = doc.output('blob');
    await saveBlob(filename, blob);
    audit('Édition PDF', `${label} (${pages} p.) : ${filename}`);
  });
}
const fileSafe = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
