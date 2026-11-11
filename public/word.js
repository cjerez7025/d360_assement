/* word.js — Informe ejecutivo y acta en Word (.docx), sin librerías.
   Convierte el mismo HTML que se imprime a PDF (docInforme y docActa, en ruta.js) a un .docx real: arma el XML de Word y lo
   empaqueta en un ZIP sin compresión. El diseño copia la hoja de estilos de impresión de styles.css (clase .dc): Segoe UI, títulos
   verdes con línea, ficha en columnas, tablas con línea inferior y barras de color en el puntaje. Así Word y PDF se ven igual.
   API: window.docxBlob(html) → Blob; window.descargarWord(html, archivo) → baja el archivo. */
(function () {
  const C = { teal: '00705D', ink: '13201E', muted: '556560', line: 'D9E1DF', head: 'EAF0EE', coment: '3A4A47' };
  const FUENTE = 'Segoe UI';
  const W = 10992; // ancho útil: carta con márgenes de 11 mm (igual que @page de la impresión)
  const enc = new TextEncoder();
  const xe = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ── texto en línea: negrita, cursiva, color y tamaño ──
  function piezas(nodos, st, out) {
    nodos.forEach((n) => {
      if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (t) out.push({ ...st, t }); return; }
      if (n.nodeType !== 1) return;
      const g = n.tagName.toLowerCase();
      if (g === 'br') { out.push({ br: true }); return; }
      if (n.classList.contains('dc-bar')) return; // la barra de color se dibuja aparte, en la tabla
      if (g === 'img') { const m = /^data:image\/png;base64,(.+)$/.exec(n.getAttribute('src') || ''); if (m) out.push({ img: IMGS.push({ b64: m[1], w: +n.getAttribute('data-ancho') || 400, h: +n.getAttribute('data-alto') || 300, alt: n.getAttribute('alt') || '' }) - 1 }); return; }
      const s = { ...st };
      if (g === 'strong' || g === 'b') s.b = true;
      if (g === 'em' || g === 'i') s.i = true;
      if (g === 'span' && st.h3) { s.b = false; s.c = C.muted; } // «Etapa 1 · Hacer primero» + el plazo en gris, sin negrita
      piezas([...n.childNodes], s, out);
    });
    return out;
  }
  const IMGS = []; // imágenes del documento en curso: se guardan como archivos del paquete
  const dibujo = (i) => { const im = IMGS[i], cx = Math.round(im.w * 9525), cy = Math.round(im.h * 9525); return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${i + 1}" name="Imagen ${i + 1}" descr="${xe(im.alt)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${i + 1}" name="imagen${i + 1}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${i + 1}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`; };
  const run = (p) => p.img !== undefined ? dibujo(p.img) : p.br ? '<w:r><w:br/></w:r>'
    : `<w:r><w:rPr>${p.b ? '<w:b/>' : p.b === false ? '<w:b w:val="0"/>' : ''}${p.i ? '<w:i/>' : ''}${p.c ? `<w:color w:val="${p.c}"/>` : ''}${p.sp ? `<w:spacing w:val="${p.sp}"/>` : ''}${p.sz ? `<w:sz w:val="${p.sz}"/><w:szCs w:val="${p.sz}"/>` : ''}</w:rPr><w:t xml:space="preserve">${xe(p.caps ? p.t.toUpperCase() : p.t)}</w:t></w:r>`;
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
    const pr = `${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.keepNext ? '<w:keepNext/>' : ''}${o.keepLines ? '<w:keepLines/>' : ''}${o.num ? `<w:numPr><w:ilvl w:val="${o.num[1]}"/><w:numId w:val="${o.num[0]}"/></w:numPr>` : ''}${o.border || ''}${o.tabs || ''}${o.sp ? `<w:spacing ${o.sp}/>` : ''}${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}`;
    return `<w:p>${pr ? `<w:pPr>${pr}</w:pPr>` : ''}${ps.map(run).join('')}</w:p>`;
  }
  // espaciados (twips): párrafo, ítem de lista y celda (el interlineado de impresión es 1,45)
  const SP = { texto: 'w:before="80" w:after="80" w:line="348" w:lineRule="auto"', item: 'w:before="40" w:after="40" w:line="336" w:lineRule="auto"', celda: 'w:before="0" w:after="20" w:line="312" w:lineRule="auto"' };
  const MINI = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p>';

  // ── bloques ──
  const BLOQUES = ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'table', 'div', 'header', 'footer', 'dl', 'article', 'section'];
  function bloques(cont, ctx) {
    let x = '', buf = [];
    const vaciar = () => { if (buf.some((p) => p.br || p.img !== undefined || (p.t && p.t.trim()))) x += par(buf, { sp: ctx.cell ? SP.celda : SP.texto, jc: ctx.jc }); buf = []; };
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
    if (g === 'dl') return '';
    if (g === 'header') return cabecera(n);
    if (g === 'footer') return par(piezas([...n.childNodes], { sz: 17, c: C.muted }, []), { border: `<w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="${C.line}"/></w:pBdr>`, sp: 'w:before="360" w:after="0"' });
    if (g === 'h1') return par(piezas([...n.childNodes], {}, []), { style: 'Title' });
    if (g === 'h2') return par(piezas([...n.childNodes], {}, []), { style: 'Heading1' });
    if (g === 'h3') return par(piezas([...n.childNodes], { h3: true }, []), { style: 'Heading2' });
    if (g === 'p') {
      if (n.classList.contains('dc-img')) return par(piezas([...n.childNodes], {}, []), { jc: 'center', sp: 'w:before="80" w:after="120" w:line="240" w:lineRule="auto"' });
      const nota = n.classList.contains('dc-s');
      return par(piezas([...n.childNodes], nota ? { c: C.muted, sz: 19 } : st, []), { sp: ctx.cell ? SP.celda : SP.texto, jc: ctx.jc, keepNext: (nota && !/^Y \d+ más/.test(n.textContent.trim())) || (!!n.previousElementSibling && n.previousElementSibling.tagName.toLowerCase() === 'h2') });
    }
    if (g === 'ul' || g === 'ol') return lista(n, g, ctx, 0);
    if (g === 'table') return tabla(n, ctx);
    if (g === 'div') {
      if (n.classList.contains('dc-fir')) return firmas(n);
      if (n.classList.contains('dc-et') || n.classList.contains('dc-mt')) return tarjetas(n, n.classList.contains('dc-et') ? 5 : 4);
      if (n.classList.contains('dc-esc')) return escala(n);
      if (n.classList.contains('dc-r')) return bloques(n, { ...ctx, st: { ...st, c: C.coment } });
      return bloques(n, ctx);
    }
    return '';
  }
  function lista(n, g, ctx, nivel) {
    let id = 1;
    if (g === 'ol') { id = ++ctx.n; ctx.nums.push(id); }
    const coment = n.classList.contains('dc-c'), st = coment ? { ...ctx.st, c: C.coment, sz: 19 } : ctx.st;
    let x = '';
    [...n.children].filter((li) => li.tagName.toLowerCase() === 'li').forEach((li) => {
      const ps = [], subs = [];
      li.childNodes.forEach((c) => { if (c.nodeType === 1 && /^(ul|ol)$/i.test(c.tagName)) subs.push(c); else piezas([c], st, ps); });
      x += par(ps, { num: [id, nivel], keepLines: true, sp: ctx.cell ? SP.celda : SP.item });
      subs.forEach((s) => { x += lista(s, s.tagName.toLowerCase(), ctx, Math.min(nivel + 1, 1)); });
    });
    return x;
  }

  // ── tablas y celdas ──
  const borde = (lado, sz = 4) => `<w:${lado} w:val="single" w:sz="${sz}" w:space="0" w:color="${C.line}"/>`;
  const celda = (contenido, ancho, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/>${o.span ? `<w:gridSpan w:val="${o.span}"/>` : ''}${o.bordes ? `<w:tcBorders>${o.bordes}</w:tcBorders>` : ''}${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ''}<w:tcMar><w:top w:w="${o.mt ?? 60}" w:type="dxa"/><w:left w:w="${o.ml ?? 100}" w:type="dxa"/><w:bottom w:w="${o.mb ?? 60}" w:type="dxa"/><w:right w:w="${o.mr ?? 100}" w:type="dxa"/></w:tcMar>${o.va ? `<w:vAlign w:val="${o.va}"/>` : ''}</w:tcPr>${contenido || '<w:p/>'}</w:tc>`;
  const tbl = (cols, filas, ancho = W, ind = 0) => `<w:tbl><w:tblPr><w:tblW w:w="${ancho}" w:type="dxa"/><w:tblInd w:w="${ind}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${cols.map((c) => `<w:gridCol w:w="${c}"/>`).join('')}</w:tblGrid>${filas}</w:tbl>`;

  // brand + título + ficha (empresa, rubro, tamaño, fecha, preparado por): cuatro columnas con una línea arriba y otra abajo
  function cabecera(h) {
    let x = '';
    const m = h.querySelector('.dc-m');
    if (m) {
      const [a, b] = [...m.children].map((s) => s.textContent.trim());
      x += `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="${W}"/></w:tabs><w:spacing w:before="0" w:after="60"/></w:pPr>${run({ t: a || 'AlignData', b: true, c: C.teal, sz: 24 })}<w:r><w:tab/></w:r>${run({ t: b || '', c: C.muted, sz: 18 })}</w:p>`;
    }
    const t = h.querySelector('h1');
    if (t) x += par([{ t: t.textContent.trim() }], { style: 'Title' });
    const items = [...h.querySelectorAll('.dc-meta > div')].map((d) => [((d.querySelector('dt') || {}).textContent || '').trim(), ((d.querySelector('dd') || {}).textContent || '').trim()]);
    if (items.length) {
      const nc = 4, cw = Math.floor(W / nc), cols = Array(nc).fill(cw); cols[nc - 1] += W - cw * nc;
      const filas = [];
      for (let i = 0; i < items.length; i += nc) filas.push(items.slice(i, i + nc));
      const xml = filas.map((f, ri) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${Array.from({ length: nc }, (_, ci) => {
        const it = f[ci], bordes = (ri === 0 ? borde('top', 4) : '') + (ri === filas.length - 1 ? borde('bottom', 4) : '');
        const cont = it ? par([{ t: it[0], caps: true, sz: 17, c: C.muted, sp: 8 }], { sp: 'w:before="0" w:after="20"' }) + par([{ t: it[1], b: true }], { sp: 'w:before="0" w:after="0" w:line="300" w:lineRule="auto"' }) : '';
        return celda(cont, cols[ci], { bordes, mt: 120, mb: 120, ml: 0, mr: 200 });
      }).join('')}</w:tr>`).join('');
      x += tbl(cols, xml) + par([], { sp: 'w:before="0" w:after="60" w:line="40" w:lineRule="exact"' });
    }
    return x;
  }

  // barra de puntaje: tabla de una fila, de 6 pt de alto, con el largo según el puntaje y el color del nivel
  const BARRA = 1400;
  function barra(el) {
    const i = el.querySelector('i'), est = (i && i.getAttribute('style')) || '';
    const pc = Math.max(0, Math.min(100, parseFloat((est.match(/width:\s*([\d.]+)%/) || [])[1]) || 0));
    const col = ((est.match(/background:\s*#([0-9A-Fa-f]{6})/) || [])[1] || C.teal).toUpperCase();
    const lleno = Math.round(BARRA * pc / 100), c0 = (w, fill) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/><w:tcMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tcMar></w:tcPr>${MINI}</w:tc>`;
    const cols = lleno > 0 && lleno < BARRA ? [lleno, BARRA - lleno] : [BARRA];
    const cel = lleno >= BARRA ? c0(BARRA, col) : lleno > 0 ? c0(lleno, col) + c0(BARRA - lleno, C.head) : c0(BARRA, C.head);
    return tbl(cols, `<w:tr><w:trPr><w:trHeight w:val="120" w:hRule="exact"/></w:trPr>${cel}</w:tr>`, BARRA) + MINI;
  }

  const ESTADO = { Cumple: '1A7F37', Parcial: '9A6700', 'No cumple': 'B42318' }, RIESGO = { Crítico: 'B42318', Alto: 'C2410C', Medio: '9A6700' };
  function tabla(t, ctx) {
    const filas = [...t.querySelectorAll('tr')];
    if (!filas.length) return '';
    const ncol = Math.max(...filas.map((f) => f.children.length));
    const hdr = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
    const conBarra = !!t.querySelector('.dc-bar'); // tabla de dimensiones: el puntaje se parte en barra + número
    let w;
    if (conBarra) w = [4000, 1700, 1400, 1700, W - 8800];
    else if (ncol === 4 && hdr[1] === 'Referencia legal') w = [3000, 4000, 1700, W - 8700];
    else if (ncol === 3 && hdr[0] === 'Obligación') w = [5400, 3600, W - 9000];
    else if (ncol === 2) w = [1000, W - 1000];
    else { w = Array(ncol).fill(Math.floor(W / ncol)); w[ncol - 1] += W - w.reduce((a, b) => a + b, 0); }
    const x = filas.map((f) => {
      const parte = f.parentElement.tagName.toLowerCase(), enHead = parte === 'thead';
      const hijos = [...f.children];
      let cs = '', col = 0;
      hijos.forEach((c, i) => {
        const esPuntaje = conBarra && i === 1, bar = c.querySelector('.dc-bar');
        const ancho = esPuntaje ? w[1] + w[2] : w[col], span = esPuntaje ? 2 : 0;
        const bordes = borde('bottom');
        if (enHead) {
          cs += celda(par(piezas([...c.childNodes], { b: true, sz: 17 }, []), { sp: SP.celda }), ancho, { span, bordes, fill: C.head });
        } else if (esPuntaje && bar) {
          const pct = c.textContent.replace(/\s+/g, ' ').trim();
          cs += celda(barra(bar), w[1], { bordes, va: 'center' }) + celda(par([{ t: pct, sz: 19 }], { sp: SP.celda }), w[2], { bordes, va: 'center', ml: 0 });
        } else {
          const base = { sz: 19, ...(c.tagName.toLowerCase() === 'th' ? { b: true } : {}) };
          const tx = c.textContent.trim();
          if (hdr[i] === 'Estado' && ESTADO[tx]) { base.b = true; base.c = ESTADO[tx]; }
          if (hdr[i] === 'Riesgo' && RIESGO[tx]) { base.b = true; base.c = RIESGO[tx]; }
          cs += celda(bloques(c, { ...ctx, cell: true, st: base }), ancho, { span, bordes });
        }
        col += esPuntaje ? 2 : 1;
      });
      return `<w:tr>${enHead ? '<w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' : ncol === 2 ? '' : '<w:trPr><w:cantSplit/></w:trPr>'}${cs}</w:tr>`;
    });
    // tabla de dimensiones: todas las filas «con la siguiente», para que no se parta entre dos páginas
    const xml = (conBarra ? x.map((r, i) => (i < x.length - 1 ? r.replace(/<w:p><w:pPr>/g, '<w:p><w:pPr><w:keepNext/>') : r)) : x).join('');
    return tbl(w, xml) + par([], { sp: 'w:before="0" w:after="40" w:line="60" w:lineRule="exact"' });
  }

  // ── tarjetas (etapas y dimensiones) y escala de niveles: tablas con color, separadas por columnas vacías ──
  const todos = (col, sz = 6) => ['top', 'left', 'bottom', 'right'].map((l) => `<w:${l} w:val="single" w:sz="${sz}" w:space="0" w:color="${col}"/>`).join('');
  const vacia = (ancho) => `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/></w:tcPr>${MINI}</w:tc>`;
  const tarjeta = (c, ancho) => {
    if (!c) return vacia(ancho);
    const ok = c.classList.contains('dc-ok'), m8 = c.classList.contains('dc-m8');
    const sp = 'w:before="0" w:after="40" w:line="264" w:lineRule="auto"', ps = [];
    c.childNodes.forEach((h) => {
      if (h.nodeType !== 1) return;
      const g = h.tagName.toLowerCase(), t = h.textContent.replace(/\s+/g, ' ').trim();
      if (!t) return;
      if (g === 'b') ps.push(par([{ t, b: true, c: C.teal, sz: 18 }], { sp, keepNext: true }));
      else if (g === 'h4') ps.push(par([{ t, b: true, sz: m8 ? 20 : 22 }], { sp, keepNext: true }));
      else if (g === 'small') ps.push(par([{ t, b: true, c: '9A5B00', sz: 18 }], { sp: 'w:before="60" w:after="0" w:line="264" w:lineRule="auto"' }));
      else ps.push(par([{ t, c: '4A5A6A', sz: 17 }], { sp }));
    });
    return celda(ps.join(''), ancho, { bordes: todos(ok ? '2B6E6A' : m8 ? 'D5DEEA' : '8FB1CC'), fill: ok ? '92D050' : 'F8FAFD', mt: 110, mb: 110, ml: 140, mr: 120 });
  };
  function tarjetas(n, ncol) {
    const cards = [...n.children], gap = 140, cw = Math.floor((W - gap * (ncol - 1)) / ncol);
    const cols = []; for (let i = 0; i < ncol; i++) { cols.push(cw); if (i < ncol - 1) cols.push(gap); }
    cols[cols.length - 1] += W - cols.reduce((a, b) => a + b, 0) - 140; // el borde de la primera tarjeta queda al ras del margen
    const filas = []; for (let i = 0; i < cards.length; i += ncol) filas.push(cards.slice(i, i + ncol));
    const xml = filas.map((f, ri) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${Array.from({ length: ncol }, (_, ci) => tarjeta(f[ci], cols[ci * 2]) + (ci < ncol - 1 ? vacia(gap) : '')).join('')}</w:tr>${ri < filas.length - 1 ? `<w:tr><w:trPr><w:trHeight w:val="140" w:hRule="exact"/></w:trPr>${celda(MINI, W - 140, { span: cols.length, mt: 0, mb: 0, ml: 0, mr: 0 })}</w:tr>` : ''}`).join('');
    return tbl(cols, xml, W - 140, 140) + par([], { sp: 'w:before="0" w:after="60" w:line="60" w:lineRule="exact"' });
  }
  const NIVEL_FONDO = ['E3E8F3', 'CDEAE7', '8FD8D2', '3DB8B8', '0B6E75'];
  function escala(n) {
    const it = [...n.children], gap = 120, ncol = it.length || 5, cw = Math.floor((W - gap * (ncol - 1)) / ncol);
    const cols = []; for (let i = 0; i < ncol; i++) { cols.push(cw); if (i < ncol - 1) cols.push(gap); }
    cols[cols.length - 1] += W - cols.reduce((a, b) => a + b, 0) - 160;
    const cel = it.map((s, i) => {
      const num = ((s.querySelector('b') || {}).textContent || String(i)).trim(), nombre = s.textContent.replace(num, '').replace(/\s+/g, ' ').trim(), c = i >= 3 ? 'FFFFFF' : C.ink;
      return celda(par([{ t: num, b: true, sz: 26, c }, { t: '  ' + nombre, sz: 21, c }], { sp: 'w:before="0" w:after="0" w:line="276" w:lineRule="auto"' }), cols[i * 2], { fill: NIVEL_FONDO[i] || NIVEL_FONDO[4], mt: 150, mb: 150, ml: 160, mr: 100, va: 'center' }) + (i < ncol - 1 ? vacia(gap) : '');
    }).join('');
    return par([], { sp: 'w:before="0" w:after="60" w:line="60" w:lineRule="exact"' }) + tbl(cols, `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cel}</w:tr>`, W - 160, 160) + par([], { sp: 'w:before="0" w:after="60" w:line="60" w:lineRule="exact"' });
  }

  // ── firmas del acta ──
  function firmas(n) {
    const nombres = [...n.children].map((d) => d.textContent.trim());
    const lin = `<w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="${C.ink}"/></w:pBdr>`;
    const cel = (txt, ancho) => `<w:tc><w:tcPr><w:tcW w:w="${ancho}" w:type="dxa"/></w:tcPr>${par([{ t: txt, sz: 19 }], { border: lin, sp: 'w:before="920" w:after="0"', jc: 'center' })}</w:tc>`;
    const sep = 600, a = Math.floor((W - sep) / 2);
    return tbl([a, sep, W - sep - a], `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cel(nombres[0] || 'Consultor AlignData', a)}<w:tc><w:tcPr><w:tcW w:w="${sep}" w:type="dxa"/></w:tcPr><w:p/></w:tc>${cel(nombres[1] || 'Representante de la empresa', W - sep - a)}</w:tr>`);
  }

  // ── piezas fijas del paquete .docx ──
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const estilos = () => `${XML}<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FUENTE}" w:hAnsi="${FUENTE}" w:eastAsia="${FUENTE}" w:cs="${FUENTE}"/><w:color w:val="${C.ink}"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-CL" w:eastAsia="es-CL" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="348" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="200" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="3" w:color="${C.teal}"/></w:pBdr><w:spacing w:before="320" w:after="120" w:line="240" w:lineRule="auto"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="${C.teal}"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="80" w:line="276" w:lineRule="auto"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:style></w:styles>`;
  function numeracion(nums) {
    const nivel = (i, fmt, txt, izq, col) => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${txt}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${izq}" w:hanging="${col}"/></w:pPr><w:rPr><w:b w:val="0"/><w:i w:val="0"/><w:color w:val="${C.ink}"/></w:rPr></w:lvl>`;
    return `${XML}<w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${nivel(0, 'bullet', '•', 400, 260)}${nivel(1, 'bullet', '–', 800, 260)}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${nivel(0, 'decimal', '%1.', 400, 300)}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>${nums.map((n) => `<w:num w:numId="${n}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('')}</w:numbering>`;
  }
  // pie: solo «Página X de Y» a la derecha (el texto «AlignData · aligndata.cl…» va al final del documento, como en la impresión)
  const campo = (instr) => { const rp = `<w:rPr><w:color w:val="${C.muted}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`; return `<w:r>${rp}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${rp}<w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r>${rp}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${rp}<w:t>1</w:t></w:r><w:r>${rp}<w:fldChar w:fldCharType="end"/></w:r>`; };
  const pie = () => {
    const rp = `<w:rPr><w:color w:val="${C.muted}"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`, t = (x) => `<w:r>${rp}<w:t xml:space="preserve">${xe(x)}</w:t></w:r>`;
    return `${XML}<w:ftr ${NS}><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="right"/></w:pPr>${t('Página ')}${campo('PAGE')}${t(' de ')}${campo('NUMPAGES')}</w:p></w:ftr>`;
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
    const titulo = [((art.querySelector('h1') || {}).textContent || 'Documento').trim(), ficha.Empresa, ficha.Fecha].filter(Boolean).join(' · ');
    IMGS.length = 0;
    const ctx = { n: 1, nums: [], st: {}, cell: false };
    const cuerpo = bloques(art, ctx);
    const sect = `<w:sectPr><w:footerReference w:type="default" r:id="rId5"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="700" w:right="624" w:bottom="1000" w:left="624" w:header="400" w:footer="440" w:gutter="0"/></w:sectPr>`;
    const archivos = [
      ['[Content_Types].xml', `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`],
      ['_rels/.rels', `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`],
      ['docProps/core.xml', `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(titulo)}</dc:title><dc:creator>AlignData · D360°</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</dcterms:created></cp:coreProperties>`],
      ['word/_rels/document.xml.rels', `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${IMGS.map((_, i) => `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/imagen${i + 1}.png"/>`).join('')}</Relationships>`],
      ['word/document.xml', `${XML}<w:document ${NS}><w:body>${cuerpo}${sect}</w:body></w:document>`],
      ['word/styles.xml', estilos()],
      ['word/numbering.xml', numeracion(ctx.nums)],
      ['word/footer1.xml', pie()]
    ].map(([n, x]) => ({ n, d: enc.encode(x) })).concat(IMGS.map((im, i) => ({ n: `word/media/imagen${i + 1}.png`, d: Uint8Array.from(atob(im.b64), (c) => c.charCodeAt(0)) })));
    return zip(archivos, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };
  window.descargarWord = function (html, archivo) {
    const blob = window.docxBlob(html), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = archivo; a.rel = 'noopener'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  };
})();
