// Gabarit AI721 (mise en page habituelle des cahiers des charges et manuels AI721)
const fs = require('fs');
const path = require('path');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, Header, Footer, PageNumber, BorderStyle, ShadingType, TableOfContents, LevelFormat, VerticalAlign, TabStopType, TableLayoutType } = D;

const GREEN = '0B5D4B', GOLD_L = 'E7C77F', GOLD = 'A97A1D', INK = '1F2937', MUTED = '6B7280', LINE = 'CBD5D1', ZEBRA = 'F3F6F5', LABEL = 'F0F9F6', MINT = 'DFF2EC', CREAM = 'FEF6E7';
const FONT = 'Calibri', MONO = 'Consolas';
const PAGE_W = 11906, MARGIN = 1247, CONTENT = PAGE_W - 2 * MARGIN; // 9412 DXA
const DIR = __dirname;

function fr(s) {
  return String(s).replace(/'/g, '’')
    .replace(/ :/g, ' :').replace(/ ;/g, ' ;').replace(/ !/g, ' !').replace(/ \?/g, ' ?')
    .replace(/« /g, '« ').replace(/ »/g, ' »').replace(/ %/g, ' %');
}
// [[code]] : chasse fixe ; **gras** : gras (réservé aux libellés d'encadrés et de tableaux)
function runs(text, o = {}) {
  return String(text).split(/(\[\[.*?\]\]|\*\*.*?\*\*)/g).filter(x => x !== '').map(p => {
    if (p.startsWith('[[')) return new TextRun({ text: p.slice(2, -2), font: MONO, size: (o.size || 21) - 2, color: o.color || GREEN });
    if (p.startsWith('**')) return new TextRun({ text: fr(p.slice(2, -2)), font: FONT, size: o.size || 21, bold: true, color: o.color || INK });
    return new TextRun({ text: fr(p), font: FONT, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color || INK });
  });
}
const SPACING = { line: 268, lineRule: 'auto', after: 100 };
const P = (text, o = {}) => new Paragraph({ children: runs(text, o), alignment: o.align || AlignmentType.JUSTIFIED, spacing: { ...SPACING, before: o.before || 0, after: o.after ?? 100 }, keepNext: o.keepNext });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: fr(t) })], keepNext: true, keepLines: true });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: fr(t) })], keepNext: true, keepLines: true });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: fr(t) })], keepNext: true, keepLines: true });
const UL = items => items.map(t => new Paragraph({ children: runs(t), numbering: { reference: 'puces', level: 0 }, spacing: { line: 260, lineRule: 'auto', after: 60 }, alignment: AlignmentType.LEFT }));
let olCount = 0;
const OL = items => { const ref = 'num' + (olCount++ % 60); return items.map(t => new Paragraph({ children: runs(t), numbering: { reference: ref, level: 0 }, spacing: { line: 260, lineRule: 'auto', after: 70 }, alignment: AlignmentType.LEFT })); };
const PB = () => new Paragraph({ children: [new D.PageBreak()] });
const SP = (h = 100) => new Paragraph({ children: [], spacing: { after: h, line: 240, lineRule: 'auto' } });

const bd = c => ({ style: BorderStyle.SINGLE, size: 4, color: c || LINE });
const borders = c => ({ top: bd(c), bottom: bd(c), left: bd(c), right: bd(c) });
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none };
function cell(text, w, o = {}) {
  const content = Array.isArray(text) ? text : [text];
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders: o.noBorder ? noBorders : borders(o.borderColor), verticalAlign: o.valign || VerticalAlign.CENTER,
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    margins: { top: o.pad ?? 60, bottom: o.pad ?? 60, left: 110, right: 110 }, columnSpan: o.span,
    children: content.map(t => t instanceof Paragraph ? t : new Paragraph({ children: runs(t, { size: o.size || 19, bold: o.bold, color: o.color, italics: o.italics }), alignment: o.align || AlignmentType.LEFT, spacing: { before: 0, after: 0, line: 252, lineRule: 'auto' } }))
  });
}
let tabN = 0, figN = 0;
function caption(kind, text) {
  const n = kind === 'Tableau' ? ++tabN : ++figN;
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200, line: 240, lineRule: 'auto' }, children: [new TextRun({ text: fr(`${kind} ${n} — ${text}`), italics: true, size: 18, color: MUTED, font: FONT })] });
}
function table(head, rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const trs = [];
  if (head) trs.push(new TableRow({ tableHeader: true, cantSplit: true, children: head.map((h, i) => cell(h, widths[i], { fill: GREEN, color: 'FFFFFF', bold: true, size: 19 })) }));
  rows.forEach((r, ri) => trs.push(new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? ZEBRA : undefined, bold: o.firstBold && i === 0, color: o.firstBold && i === 0 ? GREEN : undefined, size: o.size || 19, align: o.aligns?.[i] })) })));
  const out = [new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: trs, layout: TableLayoutType.FIXED, alignment: AlignmentType.CENTER })];
  out.push(o.caption ? caption('Tableau', o.caption) : SP(140));
  return out;
}
function note(text, kind = 'info') {
  const col = kind === 'warn' ? GOLD : GREEN; const fill = kind === 'warn' ? CREAM : 'EAF5F1';
  return [new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT], layout: TableLayoutType.FIXED, rows: [new TableRow({ children: [new TableCell({ width: { size: CONTENT, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill }, borders: { top: bd(fill), bottom: bd(fill), right: bd(fill), left: { style: BorderStyle.SINGLE, size: 24, color: col } }, margins: { top: 100, bottom: 100, left: 180, right: 160 }, children: [new Paragraph({ children: runs(text, { size: 20 }), spacing: { after: 0, line: 260, lineRule: 'auto' } })] })] })] }), SP(140)];
}
function imageDims(file) {
  const buf = fs.readFileSync(file);
  if (file.endsWith('.png')) return { buf, w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'png' };
  const dims = JSON.parse(fs.readFileSync(path.join(path.dirname(file), 'dims.json')))[path.basename(file)];
  return { buf, w: dims[0], h: dims[1], type: 'jpg' };
}
function fig(file, cap, widthPx = 600, maxH = 760) {
  const { buf, w, h, type } = imageDims(path.isAbsolute(file) ? file : path.join(DIR, file));
  let ww = widthPx, hh = Math.round(widthPx * h / w); if (hh > maxH) { hh = maxH; ww = Math.round(maxH * w / h); }
  return [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 80, after: 40, line: 240, lineRule: 'auto' }, children: [new ImageRun({ type, data: buf, transformation: { width: ww, height: hh }, altText: { title: cap, description: cap, name: path.basename(file) } })] }), caption('Figure', cap)];
}

/* Couverture : icône, bandeau vert, bande tricolore, tableau d'identité */
function cover({ label, title, subtitle, meta, icon }) {
  const out = [];
  const ic = fs.readFileSync(icon);
  out.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new ImageRun({ type: 'png', data: ic, transformation: { width: 98, height: 98 }, altText: { title: 'Icône', description: 'Icône de l’application', name: 'icone' } })] }));
  const w3 = [3135, 3135, 3142];
  const band = new TableCell({ columnSpan: 3, width: { size: CONTENT, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: GREEN }, borders: noBorders, margins: { top: 360, bottom: 360, left: 320, right: 320 }, children: [
    new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: fr(label), bold: true, color: GOLD_L, size: 20, font: FONT })] }),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: fr(title), bold: true, color: 'FFFFFF', size: 56, font: FONT })] }),
    new Paragraph({ spacing: { line: 268, lineRule: 'auto', after: 100 }, children: [new TextRun({ text: fr(subtitle), color: MINT, size: 25, font: FONT })] })] });
  const tri = (fill, w) => new TableCell({ width: { size: w, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill }, borders: noBorders, children: [new Paragraph({ spacing: { before: 0, after: 0, line: 240, lineRule: 'auto' }, children: [new TextRun({ text: ' ', size: 4 })] })] });
  out.push(new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: w3, layout: TableLayoutType.FIXED, alignment: AlignmentType.CENTER, rows: [new TableRow({ children: [band] }), new TableRow({ height: { value: 600, rule: 'exact' }, children: [tri('0B8A4D', w3[0]), tri('CE1126', w3[1]), tri('FCD116', w3[2])] })] }));
  out.push(new Paragraph({ spacing: { before: 0, after: 600 }, children: [] }));
  const w2 = [2834, CONTENT - 2834];
  out.push(new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: w2, layout: TableLayoutType.FIXED, rows: meta.map(([k, v]) => new TableRow({ cantSplit: true, children: [cell(k, w2[0], { fill: LABEL, bold: true, color: GREEN, size: 20, pad: 70 }), cell(v, w2[1], { size: 20, pad: 70 })] })) }));
  out.push(PB());
  return out;
}
function tocBlock(range = '1-2') {
  return [new Paragraph({ spacing: { before: 0, after: 100 }, children: [new TextRun({ text: 'Sommaire', bold: true, color: GREEN, size: 34, font: FONT })] }),
    new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: range }), PB()];
}
function signatureBlock(labels) {
  const w = Math.floor(CONTENT / labels.length); const ws = labels.map(() => w);
  return [new Table({ width: { size: w * labels.length, type: WidthType.DXA }, columnWidths: ws, layout: TableLayoutType.FIXED, rows: [
    new TableRow({ children: labels.map((l, i) => cell(l, ws[i], { fill: LABEL, bold: true, align: AlignmentType.CENTER, size: 19, color: GREEN })) }),
    new TableRow({ height: { value: 1500, rule: 'atLeast' }, children: labels.map((l, i) => cell('', ws[i])) })] }), SP(120)];
}
function build({ product, docTitle, children, out }) {
  const running = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [new TextRun({ text: fr(`${product} • ${docTitle}`), size: 16, color: MUTED, font: FONT })] })] });
  const foot = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], size: 16, color: MUTED, font: FONT })] })] });
  const empty = new Header({ children: [new Paragraph({ children: [] })] });
  const numConfigs = [{ reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] }];
  for (let i = 0; i < 60; i++) numConfigs.push({ reference: 'num' + i, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] });
  const doc = new Document({
    creator: 'AI721', title: `${product} · ${docTitle}`, description: docTitle, language: 'fr-FR', features: { updateFields: true },
    styles: {
      default: { document: { run: { font: FONT, size: 21, color: INK, language: { value: 'fr-FR' } }, paragraph: { spacing: SPACING } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: GREEN }, paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 25, bold: true, color: GREEN }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 22, bold: true, color: GOLD }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
        { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 20, color: INK }, paragraph: { spacing: { before: 24, after: 6, line: 246, lineRule: 'auto' }, tabStops: [{ type: TabStopType.RIGHT, position: CONTENT, leader: 'dot' }] } },
        { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 19, color: INK }, paragraph: { spacing: { before: 0, after: 0, line: 246, lineRule: 'auto' }, indent: { left: 283 }, tabStops: [{ type: TabStopType.RIGHT, position: CONTENT, leader: 'dot' }] } }
      ]
    },
    numbering: { config: numConfigs },
    sections: [{ properties: { titlePage: true, page: { size: { width: PAGE_W, height: 16838 }, margin: { top: 1247, bottom: 1134, left: MARGIN, right: MARGIN, header: 720, footer: 720 } } }, headers: { default: running, first: empty }, footers: { default: foot, first: new Footer({ children: [new Paragraph({ children: [] })] }) }, children: children.flat(Infinity) }]
  });
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('écrit', out, b.length); });
}
module.exports = { fr, P, H1, H2, H3, UL, OL, PB, SP, table, note, fig, cover, tocBlock, signatureBlock, build, CONTENT, AlignmentType, caption };
