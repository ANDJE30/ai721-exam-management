/* =====================================================================
   Interface : icônes, fenêtres, notifications, composants
   ===================================================================== */
const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4"/><path d="M16 4.8a3 3 0 0 1 0 6"/><path d="M18 14.8c1.7.7 2.7 2.4 3 5.2"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
  door: '<path d="M5 21V4.5C5 3.7 5.7 3 6.5 3h11c.8 0 1.5.7 1.5 1.5V21"/><path d="M3 21h18"/><circle cx="15" cy="12.5" r="1"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  barcode: '<path d="M4 5v14M7 5v14M10 5v14M14 5v14M16 5v14M20 5v14"/>',
  scan: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M7 12h10"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 7.7-1.5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  log: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  star: '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4"/>',
  file: '<path d="M14 3H6.5C5.7 3 5 3.7 5 4.5v15c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V8z"/><path d="M14 3v5h5"/>',
  shuffle: '<path d="M3 7h4c4 0 6 10 10 10h4M3 17h4c1.6 0 2.8-1.6 3.8-3.6M14 7h7M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

function logoHTML(cls = 'logo') {
  if (S.settings.logo) return `<img class="${cls}" src="${esc(S.settings.logo)}" alt="Logo ${esc(S.settings.sigle)}" style="object-fit:contain;border-radius:8px;background:#fff">`;
  return `<svg class="${cls}" viewBox="0 0 48 48" aria-label="Emblème ASTRA LUZ"><circle cx="24" cy="24" r="22" fill="var(--accent)"/><circle cx="24" cy="24" r="18.5" fill="none" stroke="var(--gold)" stroke-width="1"/><path d="m24 9 3.2 9.6H37l-8 5.9 3.1 9.6L24 28.2l-8.1 5.9L19 24.5l-8-5.9h9.8z" fill="var(--gold)"/></svg>`;
}

/* Notifications */
function toast(msg, kind = '') {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.remove(), kind === 'bad' ? 6500 : 3800);
}
async function withBusy(label, fn) {
  const b = document.createElement('div'); b.className = 'busy'; b.innerHTML = `<div><span class="spin"></span>${esc(label)}</div>`; document.body.appendChild(b);
  await sleep(30);
  try { return await fn(); } catch (e) { console.error(e); toast(e.message || String(e), 'bad'); } finally { b.remove(); }
}
/* Fenêtres modales (les boîtes natives sont bloquées dans l'artefact) */
function openModal({ title, body, wide = false, actions = [], onOpen }) {
  const back = document.createElement('div'); back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h3>${esc(title)}</h3><button class="btn ghost sm" data-x aria-label="Fermer">${ic('x')}</button></header><div class="body">${body}</div>${actions.length ? `<footer></footer>` : ''}</div>`;
  const m = back.firstElementChild; const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = ev => { if (ev.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  back.addEventListener('mousedown', ev => { if (ev.target === back) close(); });
  $('[data-x]', m).onclick = close;
  const ft = $('footer', m);
  actions.forEach(a => { const b = document.createElement('button'); b.className = 'btn ' + (a.cls || ''); b.innerHTML = a.label; b.onclick = async () => { if (a.onClick) { const r = await a.onClick(close, m); if (r === false) return; } else close(); }; ft.appendChild(b); });
  document.body.appendChild(back);
  if (onOpen) onOpen(m, close);
  const f = $('input:not([type=hidden]):not([type=checkbox]),select,textarea', $('.body', m)); if (f) setTimeout(() => f.focus(), 30);
  return { close, el: m };
}
function confirmBox(title, msg, okLabel = 'Confirmer', danger = false) {
  return new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    const md = openModal({ title, body: `<p>${msg}</p>`, actions: [{ label: 'Annuler', onClick: c => { fin(false); c(); } }, { label: okLabel, cls: danger ? 'danger' : 'primary', onClick: c => { fin(true); c(); } }] });
    const obs = new MutationObserver(() => { if (!document.body.contains(md.el)) { fin(false); obs.disconnect(); } }); obs.observe(document.body, { childList: true });
  });
}
async function requireCoord(reason) {
  if (S.mode === 'cloud') { if (CLOUD.profile?.role === 'coordination') return true; toast('Action réservée au compte de coordination.', 'bad'); return false; }
  if (S.ui.role === 'coordination' && S.ui.unlocked) return true;
  if (!S.security.pinHash) { S.ui.role = 'coordination'; S.ui.unlocked = true; toast('Aucun code PIN défini : action autorisée. Définissez un PIN dans les paramètres.', ''); renderTop(); return true; }
  return new Promise(res => { let ok = false;
    openModal({ title: 'Code PIN de la coordination', body: `<p class="muted">${esc(reason || 'Cette action est réservée à la coordination.')}</p><label class="f">Code PIN<input class="in mono" id="pin-in" type="password" inputmode="numeric" autocomplete="off"></label><p class="small" id="pin-err" style="color:var(--bad)"></p>`,
      actions: [{ label: 'Annuler', onClick: c => { c(); res(false); } }, { label: 'Valider', cls: 'primary', onClick: async (c, m) => { const v = $('#pin-in', m).value; if (await sha256('astraluz:' + v) === S.security.pinHash) { S.ui.role = 'coordination'; S.ui.unlocked = true; ok = true; c(); renderTop(); audit('Accès coordination', 'Déverrouillage par PIN'); res(true); } else { $('#pin-err', m).textContent = 'Code incorrect.'; return false; } } }],
      onOpen: m => $('#pin-in', m).addEventListener('keydown', ev => { if (ev.key === 'Enter') $('footer .primary', m).click(); }) });
  });
}

/* Codes-barres à l'écran */
function bcSvg(code, opt = {}) {
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    window.JsBarcode(svg, code, { format: 'CODE128C', width: opt.w || 1.6, height: opt.h || 46, displayValue: opt.text !== false, text: fmtCode(code), font: 'monospace', fontSize: opt.fs || 13, margin: opt.m ?? 8, background: '#ffffff', lineColor: '#000000' });
    return svg.outerHTML;
  } catch (e) { return `<span class="mono">${fmtCode(code)}</span>`; }
}

/* Petits graphiques SVG (une série : pas de légende, valeurs au survol) */
function barChartSvg(data, { max = null, ref = null, h = 180, fmt = v => fmtNote(v), unit = '' } = {}) {
  if (!data.length) return '<div class="empty small">Aucune donnée à représenter.</div>';
  const n = data.length; const W = Math.max(320, n * 54 + 40); const top = 18, bottom = 26, left = 32; const ch = h - top - bottom;
  const M = max || Math.max(1, ...data.map(d => d.v || 0));
  const step = (W - left - 8) / n; const bw = Math.min(30, step * 0.62);
  let s = `<svg viewBox="0 0 ${W} ${h}" role="img" style="width:100%;min-width:${Math.min(W, n * 42 + 40)}px;height:auto;max-height:${h + 40}px" preserveAspectRatio="xMinYMin meet">`;
  for (let k = 0; k <= 4; k++) { const y = top + ch - ch * k / 4; s += `<line class="grid-l" x1="${left}" x2="${W - 4}" y1="${y}" y2="${y}"/><text x="${left - 6}" y="${y + 3.5}" text-anchor="end">${String(Math.round(M * k / 4 * 10) / 10).replace('.', ',')}</text>`; }
  data.forEach((d, i) => { const v = d.v || 0; const bh = Math.max(0, ch * v / M); const x = left + i * step + (step - bw) / 2; const y = top + ch - bh;
    const r = Math.min(4, bw / 2, bh);
    s += `<g><title>${esc(d.l)} : ${d.v === null || d.v === undefined ? 'pas de donnée' : esc(fmt(d.v)) + unit}</title>${bh > 0 ? `<path class="bar-m" d="M${x},${top + ch} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${top + ch} Z"/>` : ''}${d.v !== null && d.v !== undefined ? `<text x="${x + bw / 2}" y="${y - 4}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${esc(fmt(d.v))}</text>` : ''}<text x="${x + bw / 2}" y="${h - 8}" text-anchor="middle">${esc(d.l)}</text></g>`; });
  if (ref !== null) { const y = top + ch - ch * ref / M; s += `<line class="ref" x1="${left}" x2="${W - 4}" y1="${y}" y2="${y}"/><text x="${W - 6}" y="${y - 4}" text-anchor="end" style="fill:var(--gold)">seuil ${String(ref).replace('.', ',')}</text>`; }
  return `<div class="chart">${s}</svg></div>`;
}
const kpi = (v, l, s = '') => `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span>${s ? `<span class="s">${s}</span>` : ''}</div>`;
const progressBar = (pct, cls = '') => `<div class="bar ${cls}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
const optList = (arr, sel) => arr.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(l)}</option>`).join('');
const levelOpts = sel => optList(LEVELS.map(l => [l.id, l.nom]), sel);
const subjOpts = (sel, list) => optList((list || S.subjects).map(s => [s.code, `${s.abbr} · ${s.nom}`]), sel);
const teacherOpts = sel => '<option value="">— non attribué —</option>' + optList(S.teachers.slice().sort((a, b) => a.nom.localeCompare(b.nom)).map(t => [t.id, teacherName(t.id)]), sel);
const tsLabel = (t, s) => `Trimestre ${t} · Situation ${s}`;
function sitOpts(sel) { let o = ''; for (let s = 1; s <= 6; s++) o += `<option value="${s}" ${+sel === s ? 'selected' : ''}>Situation ${s} (T${trimOfSit(s)})</option>`; return o; }

/* Lecture de fichiers Excel / CSV */
async function readSheet(file) {
  await ensureXlsx();
  return new Promise((res, rej) => {
    if (!window.XLSX) return rej(new Error('Le module Excel n’est pas chargé.'));
    const fr = new FileReader();
    fr.onload = () => { try { const wb = window.XLSX.read(fr.result, { type: 'array', cellDates: true }); const sh = wb.Sheets[wb.SheetNames[0]]; const rows = window.XLSX.utils.sheet_to_json(sh, { defval: '', raw: false }); res({ rows, sheets: wb.SheetNames, wb }); } catch (e) { rej(new Error('Fichier illisible : ' + e.message)); } };
    fr.onerror = () => rej(new Error('Lecture du fichier impossible.'));
    fr.readAsArrayBuffer(file);
  });
}
const pickCol = (row, names) => { const keys = Object.keys(row); for (const n of names) { const k = keys.find(k => norm(k).replace(/[^a-z0-9]/g, '') === n); if (k !== undefined) return String(row[k] ?? '').trim(); } return ''; };
async function xlsxSave(filename, sheets) {
  try { await ensureXlsx(); } catch (e) { }
  if (!window.XLSX) { toast('Le module Excel n’est pas chargé.', 'bad'); return; }
  const wb = window.XLSX.utils.book_new();
  sheets.forEach(({ name, rows, cols }) => { const ws = window.XLSX.utils.aoa_to_sheet(rows); if (cols) ws['!cols'] = cols.map(w => ({ wch: w })); window.XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31).replace(/[\\/?*\[\]:]/g, '-')); });
  const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return saveBlob(filename, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}
