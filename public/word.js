/* word.js — Informe ejecutivo y acta en Word (.docx), sin librerías.
   Convierte el mismo HTML que se imprime a PDF (docInforme y docActa, en ruta.js) a un .docx real: arma el XML de Word y lo
   empaqueta en un ZIP sin compresión. Así el Word y el PDF dicen siempre lo mismo.
   API: window.docxBlob(html) → Blob; window.descargarWord(html, archivo) → baja el archivo. */
(function () {
  const C = { teal: '0B7A75', ink: '1B2430', muted: '5B6675', line: 'D5DBE3', soft: 'F2F6F8', rojo: 'B42318' };
  const NIV = { Inexistente: C.rojo, Reactivo: C.rojo, Parcial: '9A6700', Gestionado: '1A7F37', Optimizado: '1A7F37' };
  const W = 9360; // ancho útil: carta con márgenes de 2,5 cm
  const enc = new TextEncoder();
  const xe = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ── texto en línea: negrita, cursiva y color ──
  function piezas(nodos, st, out) {
    nodos.forEach((n) => {
      if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (t) out.push({ ...st, t }); return; }
      if (n.nodeType !== 1) return;
      const g = n.tagName.toLowerCase();
      if (g === 'br') { out.push({ br: true }); return; }
      if (n.classList.contains('dc-bar')) return; // barra de color de la tabla: no se pasa a Word
      const s = { ...st };
      if (g === 'strong' || g === 'b') s.b = true;
      if (g === 'em' || g === 'i') s.i = true;
      piezas([...n.childNodes], s, out);
    });
    return out;
  }
  const run = (p) => p.br ? '<w:r><w:br/></w:r>'
    : `<w:r><w:rPr>${p.b ? '<w:b/>' : ''}${p.i ? '<w:i/>' : ''}${p.c ? `<w:color w:val="${p.c}"/>` : ''}${p.sz ? `<w:sz w:val="${p.sz}"/><w:szCs w:val="${p.sz}"/>` : ''}</w:rPr><w:t xml:space="preserve">${xe(p.t)}</w:t></w:r>`;
  function limpiar(ps) { // sin espacios al principio ni al final del párrafo
    ps = ps.slice();
    while (ps.length && ps[0].t !== undefined && !ps[0].t.trim()) ps.shift();
    if (ps.length && ps[0].t !== undefined) ps[0] = { ...ps[0], t: ps[0].t.replace(/^\s+/, '') };
    while (ps.length && ps[ps.length - 1].t !== undefined && !ps[ps.length - 1].t.trim()) ps.pop();
    const l = ps.length - 1;
    if (l >= 0 && ps[l].t !== undefined) ps[l] = { ...ps[l], t: ps[l].t.replace(/\s+$/, '') };
    return ps;
  }
  function par(ps, o = {}) {
    ps = limpiar(ps);
    const pr = `${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.keepNext ? '<w:keepNext/>' : ''}${o.keepLines ? '<w:keepLines/>' : ''}${o.num ? `<w:numPr><w:ilvl w:val="${o.num[1]}"/><w:numId w:val="${o.num[0]}"/></w:numPr>` : ''}${o.border || ''}${o.sp ? `<w:spacing ${o.sp}/>` : ''}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}`;
    return `<w:p>${pr ? `<w:pPr>${pr}</w:pPr>` : ''}${ps.map(run).join('')}</w:p>`;
  }
  const SP = { texto: 'w:after="100" w:line="300" w:lineRule="auto"', item: 'w:after="90" w:line="280" w:lineRule="auto"', celda: 'w:after="40" w:line="260" w:lineRule="auto"' };

  // ── bloques ──
  const BLOQUES = ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'table', 'div', 'header', 'footer', 'dl', 'article', 'section'];
  function bloques(cont, ctx) {
    let x = '', buf = [];
    const vaciar = () => { if (buf.some((p) => p.br || (p.t && p.t.trim()))) x += par(buf, { sp: ctx.cell ? SP.celda : SP.texto, jc: ctx.jc }); buf = []; };
    cont.childNodes.forEach((n) => {
      if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (t.trim() || buf.length) buf.push({ ...ctx.st, t }); return; }
      if (n.nodeType !== 1) return;
      const g = n.tagName.toLowerCase();
      if (BLOQUES.includes(g)) { vaciar(); x += bloque(n, g, ctx); } else piezas([n], ctx.st, buf);
    });
    vaciar();
    return x;
  }
  function bloque(n, g, ctx) {
    const st = ctx.st || {};
    if (g === 'article' || g === 'section') return bloques(n, ctx);
    if (g === 'footer' || g === 'dl') return ''; // el pie va en el pie de página; la ficha, en el encabezado
    if (g === 'header') return cabecera(n, ctx);
    if (g === 'h1') return par(piezas([...n.childNodes], {}, []), { style: 'Title' });
    if (g === 'h2') return par(piezas([...n.childNodes], {}, []), { style: 'Heading1' });
    if (g === 'h3') {
      const sp = n.querySelector('span');
      if (!sp) return par(piezas([...n.childNodes], {}, []), { style: 'Heading2' });
      const c = n.cloneNode(true); c.querySelector('span').remove();
      const txt = sp.textContent.trim(), ps = piezas([...c.childNodes], {}, []);
      if (/^\d+\s?%$/.test(txt)) { ps.push({ t: ' · ' + txt, c: C.muted }); return par(ps, { style: 'Heading2' }); }
      return par(ps, { style: 'Heading2' }) + par([{ t: txt, b: true, c: C.teal }], { keepNext: true, sp: 'w:after="20"' });
    }
    if (g === 'p') {
      const nota = n.classList.contains('dc-s');
      return par(piezas([...n.childNodes], nota ? { c: C.muted, sz: 19 } : st, []), { sp: ctx.cell ? SP.celda : SP.texto, jc: ctx.jc });
    }
    if (g === 'ul' || g === 'ol') return lista(n, g, ctx, 0);
    if (g === 'table') return tabla(n, ctx);
    if (g === 'div') return n.classList.contains('dc-fir') ? firmas(n) : bloques(n, ctx);
    return '';
  }
  function lista(n, g, ctx, nivel) {
    let id = 1;
    if (g === 'ol') { id = ++ctx.n; ctx.nums.push(id); }
    let x = '';
    [...n.children].filter((li) => li.tagName.toLowerCase() === 'li').forEach((li) => {
      const ps = [], subs = [];
      li.childNodes.forEach((c) => { if (c.nodeType === 1 && /^(ul|ol)$/i.test(c.tagName)) subs.push(c); else piezas([c], ctx.st, ps); });
      x += par(ps, { num: [id, nivel], keepLines: true, sp: ctx.cell ? SP.celda : SP.item });
      subs.forEach((s) => { x += lista(s, s.tagName.toLowerCase(), ctx, Math.min(nivel + 1, 1)); });
    });
    return x;
  }

  // ── encabezado del documento (marca, título y ficha) ──
  const bordes = (c, sz = 4) => ['top', 'left', 'bottom', 'right'].map((l) => `<w:${l} w:val="single" w:sz="${sz}" w:space="0" w:color="${c}"/>`).join('');
  const celda = (contenido, ancho, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/>${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ''}<w:tcMar><w:top w:w="70" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar></w:tcPr>${contenido || '<w:p/>'}</w:tc>`;
  const tbl = (cols, filas, o = {}) => `<w:tbl><w:tblPr><w:tblW w:w="${W}" w:type="dxa"/><w:tblBorders>${o.sinBordes ? '' : bordes(C.line)}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${cols.map((c) => `<w:gridCol w:w="${c}"/>`).join('')}</w:tblGrid>${filas}</w:tbl>`;
  function cabecera(h, ctx) {
    let x = '';
    const m = h.querySelector('.dc-m');
    if (m) x += par([{ t: [...m.children].map((s) => s.textContent.trim()).filter(Boolean).join(' · '), b: true, c: C.teal, sz: 20 }], { sp: 'w:after="60"' });
    const t = h.querySelector('h1');
    if (t) x += par([{ t: t.textContent.trim() }], { style: 'Title' });
    const filas = [...h.querySelectorAll('.dc-meta > div')].map((d) => {
      const k = (d.querySelector('dt') || {}).textContent || '', v = (d.querySelector('dd') || {}).textContent || '';
      return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${celda(par([{ t: k.trim(), b: true, c: C.muted, sz: 20 }], { sp: SP.celda }), 2200, { fill: C.soft })}${celda(par([{ t: v.trim(), sz: 21 }], { sp: SP.celda }), W - 2200)}</w:tr>`;
    }).join('');
    if (filas) x += tbl([2200, W - 2200], filas);
    return x;
  }

  // ── tablas ──
  function tabla(t, ctx) {
    const filas = [...t.querySelectorAll('tr')];
    if (!filas.length) return '';
    const ncol = Math.max(...filas.map((f) => f.children.length));
    const hdr = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
    let w = ncol === 4 && hdr[0] === 'Dimensión' ? [4160, 1600, 1700, 1900] : ncol === 2 ? [1100, W - 1100] : Array(ncol).fill(Math.floor(W / ncol));
    w[w.length - 1] += W - w.reduce((a, b) => a + b, 0);
    const largas = ncol === 2; // tablas del acta: filas largas que pueden partirse entre páginas
    const x = filas.map((f) => {
      const parte = f.parentElement.tagName.toLowerCase(), enHead = parte === 'thead', enFoot = parte === 'tfoot';
      const cs = [...f.children].map((c, i) => {
        const txt = c.textContent.trim(), cab = hdr[i] || '';
        if (enHead) return celda(par([{ t: txt, b: true, c: 'FFFFFF', sz: 20 }], { sp: SP.celda, jc: i ? 'center' : 'left' }), w[i], { fill: C.teal });
        const base = { ...(enFoot ? { b: true } : {}) };
        let jc = ncol > 2 && i > 0 ? 'center' : undefined;
        const esCodigo = c.tagName.toLowerCase() === 'th' && /^[A-Z]{3}-\d/.test(txt);
        if (esCodigo || cab === 'Puntaje') base.b = true;
        if (cab === 'Nivel' || (enFoot && i === ncol - 1 && NIV[txt])) { base.b = true; if (NIV[txt]) base.c = NIV[txt]; }
        if (enFoot && i > 0) base.b = true;
        const cx = { ...ctx, cell: true, jc, st: base };
        return celda(bloques(c, cx), w[i], { fill: enFoot ? C.soft : undefined });
      }).join('');
      const pr = (largas ? '' : '<w:cantSplit/>') + (enHead ? '<w:tblHeader/>' : '');
      return `<w:tr>${pr ? `<w:trPr>${pr}</w:trPr>` : ''}${cs}</w:tr>`;
    }).join('');
    return tbl(w, x) + '<w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>';
  }

  // ── firmas del acta ──
  function firmas(n) {
    const nombres = [...n.children].map((d) => d.textContent.trim());
    const linea = '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="1B2430"/></w:pBdr><w:spacing w:before="900" w:after="40"/></w:pPr></w:p>';
    const cel = (txt, ancho) => `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/></w:tcPr>${linea}${par([{ t: txt, c: C.muted, sz: 19 }], { jc: 'center' })}</w:tc>`;
    const vacia = `<w:tc><w:tcPr><w:tcW w:w="500" w:type="dxa"/></w:tcPr><w:p/></w:tc>`;
    const a = Math.floor((W - 500) / 2);
    return '<w:p><w:pPr><w:keepNext/><w:spacing w:before="240"/></w:pPr></w:p>' + tbl([a, 500, W - 500 - a], `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cel(nombres[0] || 'Consultor AlignData', a)}${vacia}${cel(nombres[1] || 'Representante de la empresa', W - 500 - a)}</w:tr>`, { sinBordes: true });
  }

  // ── piezas fijas del paquete .docx ──
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const estilos = () => `${XML}<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:color w:val="${C.ink}"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="es-CL" w:eastAsia="es-CL" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="200"/></w:pPr><w:rPr><w:b/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="${C.teal}"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/><w:szCs w:val="25"/></w:rPr></w:style></w:styles>`;
  function numeracion(nums) {
    const nivel = (i, fmt, txt, izq, col, color) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${txt}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${izq}" w:hanging="${col}"/></w:pPr><w:rPr><w:b/>${color ? `<w:color w:val="${color}"/>` : ''}</w:rPr></w:lvl>`;
    return `${XML}<w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${nivel(0, 'bullet', '•', 540, 300, C.rojo)}${nivel(1, 'bullet', '–', 1000, 300, C.muted)}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${nivel(0, 'decimal', '%1.', 540, 360, C.teal)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>${nums.map((n) => `<w:num w:numId="${n}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('')}</w:numbering>`;
  }
  const cabeza = (txt) => `${XML}<w:hdr ${NS}><w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="${C.line}"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="${W}"/></w:tabs><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="${C.muted}"/><w:sz w:val="17"/></w:rPr><w:t>AlignData · D360°</w:t></w:r><w:r><w:rPr><w:color w:val="${C.muted}"/><w:sz w:val="17"/></w:rPr><w:tab/><w:t xml:space="preserve">${xe(txt)}</w:t></w:r></w:p></w:hdr>`;
  const campo = (instr) => { const rp = `<w:rPr><w:color w:val="${C.muted}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`; return `<w:r>${rp}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${rp}<w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r>${rp}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${rp}<w:t>1</w:t></w:r><w:r>${rp}<w:fldChar w:fldCharType="end"/></w:r>`; };
  const pie = (txt) => {
    const rp = `<w:rPr><w:color w:val="${C.muted}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`, t = (x) => `<w:r>${rp}<w:t xml:space="preserve">${xe(x)}</w:t></w:r>`;
    const pagina = `${t('Página ')}${campo('PAGE')}${t(' de ')}${campo('NUMPAGES')}`;
    // texto corto: en la misma línea que el número de página; texto largo (acta): el número va en una línea aparte, a la derecha
    const cuerpo = txt.length <= 70
      ? `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="${W}"/></w:tabs><w:spacing w:after="0"/></w:pPr>${t(txt)}<w:r>${rp}<w:tab/></w:r>${pagina}</w:p>`
      : `<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${t(txt)}</w:p><w:p><w:pPr><w:spacing w:after="0"/><w:jc w:val="right"/></w:pPr>${pagina}</w:p>`;
    return `${XML}<w:ftr ${NS}>${cuerpo}</w:ftr>`;
  };

  // ── ZIP sin compresión ──
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(archivos, tipo) {
    const trozos = [], central = []; let desde = 0;
    const f = new Date(), hora = (f.getHours() << 11) | (f.getMinutes() << 5) | (f.getSeconds() >> 1), dia = ((f.getFullYear() - 1980) << 9) | ((f.getMonth() + 1) << 5) | f.getDate();
    for (const a of archivos) {
      const nom = enc.encode(a.n), crc = crc32(a.d), tam = a.d.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, hora, true); lh.setUint16(12, dia, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, tam, true); lh.setUint32(22, tam, true); lh.setUint16(26, nom.length, true); lh.setUint16(28, 0, true);
      trozos.push(new Uint8Array(lh.buffer), nom, a.d);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, hora, true); ch.setUint16(14, dia, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, tam, true); ch.setUint32(24, tam, true); ch.setUint16(28, nom.length, true); ch.setUint32(42, desde, true);
      central.push(new Uint8Array(ch.buffer), nom);
      desde += 30 + nom.length + tam;
    }
    const tc = central.reduce((s, b) => s + b.length, 0), fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true); fin.setUint32(12, tc, true); fin.setUint32(16, desde, true);
    return new Blob([...trozos, ...central, new Uint8Array(fin.buffer)], { type: tipo });
  }

  // ── armado del documento ──
  window.docxBlob = function (html) {
    const dom = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html');
    const art = dom.querySelector('article') || dom.body;
    const ficha = {};
    art.querySelectorAll('.dc-meta > div').forEach((d) => { ficha[((d.querySelector('dt') || {}).textContent || '').trim()] = ((d.querySelector('dd') || {}).textContent || '').trim(); });
    const titulo = ((art.querySelector('h1') || {}).textContent || 'Documento').trim();
    const txtCab = [titulo, ficha.Empresa, ficha.Fecha].filter(Boolean).join(' · ');
    const txtPie = ((art.querySelector('footer.dc-p') || {}).textContent || 'AlignData · aligndata.cl').trim();
    const ctx = { n: 1, nums: [], st: {}, cell: false };
    const cuerpo = bloques(art, ctx);
    const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rId4"/><w:footerReference w:type="default" r:id="rId5"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1300" w:right="1440" w:bottom="1200" w:left="1440" w:header="560" w:footer="520" w:gutter="0"/></w:sectPr>`;
    const archivos = [
      ['[Content_Types].xml', `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`],
      ['_rels/.rels', `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`],
      ['docProps/core.xml', `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(txtCab)}</dc:title><dc:creator>AlignData · D360°</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</dcterms:created></cp:coreProperties>`],
      ['word/_rels/document.xml.rels', `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`],
      ['word/document.xml', `${XML}<w:document ${NS}><w:body>${cuerpo}${sect}</w:body></w:document>`],
      ['word/styles.xml', estilos()],
      ['word/numbering.xml', numeracion(ctx.nums)],
      ['word/header1.xml', cabeza(txtCab)],
      ['word/footer1.xml', pie(txtPie)]
    ].map(([n, x]) => ({ n, d: enc.encode(x) }));
    return zip(archivos, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };
  window.descargarWord = function (html, archivo) {
    const blob = window.docxBlob(html), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = archivo; a.rel = 'noopener'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  };
})();
