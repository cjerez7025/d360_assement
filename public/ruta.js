/* ruta.js — Hoja de ruta, evolución en el tiempo, informe ejecutivo y acta de la reunión.
   Se carga después de app.js y usa sus datos y funciones (D, Q, A, CL, E2, en, esc, fnum, refLey, leyRel, pzAgrupar…).
   Las funciones de cálculo son puras (las prueba `npm run verificar`); las de pantalla solo arman HTML. */

// ───────────────────────── Hoja de ruta (etapas por beneficio y esfuerzo) ─────────────────────────
// Esfuerzo estimado de llevar cada pregunta al nivel 3: 1 bajo (días), 2 medio (semanas), 3 alto (meses).
// Es criterio inicial de AlignData, sujeto a revisión: para cambiarlo se edita EF y se actualiza RT_V.
const RT_V = '1.0', RT_ALTO = 1;
const EF = {
  'GOB-01': 1, 'GOB-01b': 1, 'GOB-02': 1, 'GOB-03': 2,
  'LEG-01': 2, 'LEG-01b': 2, 'LEG-02': 1, 'LEG-03': 1, 'LEG-04': 2, 'LEG-05': 2,
  'ARC-01': 1, 'ARC-01b': 1, 'ARC-02': 3, 'ARC-03': 3, 'ARC-04': 1, 'ARC-05': 3, 'ARC-06': 1, 'ARC-07': 2,
  'REG-01': 3, 'REG-01b': 1, 'REG-02': 2, 'REG-03': 2, 'REG-04': 1, 'REG-05': 2,
  'SEG-01': 3, 'SEG-02': 2, 'SEG-02b': 1, 'SEG-03': 2, 'SEG-04': 2, 'SEG-05': 3,
  'TER-01': 2, 'TER-01b': 2, 'TER-02': 2, 'TER-03': 1, 'TER-04': 2,
  'SEN-01': 2, 'SEN-01b': 2, 'SEN-02': 2, 'SEN-03': 3, 'SEN-04': 2, 'SEN-05': 2,
  'RIE-01': 3, 'RIE-01b': 1, 'RIE-02': 1, 'RIE-03': 3,
  'CUL-01': 1, 'CUL-02': 2, 'CUL-03': 2, 'CUL-04': 1
};
const EF_N = { 1: 'Bajo', 2: 'Medio', 3: 'Alto' };
const EF_T = { 1: 'días', 2: 'semanas', 3: 'meses' };
// Cuatro etapas (estilo «debe / debería / podría / después»); los plazos son una propuesta de orden, no una exigencia legal.
const OLAS = [
  { n: 1, t: 'Hacer primero', p: 'Antes de la entrada en vigor (1-dic-2026)', d: 'Alertas críticas y brechas de alto beneficio que se resuelven en días o semanas.' },
  { n: 2, t: 'Planificar', p: 'Primeros 3 meses de vigencia', d: 'Brechas de alto beneficio que toman meses: requieren proyecto, responsable y presupuesto.' },
  { n: 3, t: 'Aprovechar', p: 'Primeros 6 meses de vigencia', d: 'Mejoras rápidas de menor impacto: conviene hacerlas porque cuestan poco.' },
  { n: 4, t: 'Después', p: 'Primeros 12 meses de vigencia', d: 'Mejoras de menor impacto que toman más tiempo: se programan con el resto del programa.' }
];

// Beneficio de una pregunta = puntos de puntaje global que se ganan al llevarla a 3, con los pesos actuales
// (incluidos rubro y tamaño). La suma de todos más el puntaje actual sin redondear da 100 cuando todo está respondido.
function ruta(e) {
  const sc = e.sc(), sw = D.reduce((t, d) => t + d.w * sc.m[d.id], 0), lista = e.ga(), items = [];
  let actual = 0, sinResp = 0;
  for (const d of D) {
    const qd = lista.filter((q) => q.dm === d.id), qs = qd.filter((q) => e.a[q.id] !== undefined);
    sinResp += qd.length - qs.length;
    const pw = qs.reduce((t, q) => t + (q.w || 1), 0);
    if (!pw || !sw) continue;
    const wd = d.w * sc.m[d.id] / sw;
    for (const q of qs) {
      const v = e.a[q.id];
      actual += v * (q.w || 1) / (3 * pw) * 100 * wd;
      if (v >= 3) continue;
      const gain = (3 - v) * (q.w || 1) / (3 * pw) * 100 * wd, fl = !!(q.fl && q.fl.includes(v)), ef = EF[q.id] || 2, alto = gain >= RT_ALTO;
      const ola = fl || (alto && ef < 3) ? 1 : alto ? 2 : ef === 1 ? 3 : 4;
      items.push({ q, dm: d, v, gain, ef, fl, alto, ola });
    }
  }
  items.sort((x, y) => x.ola - y.ola || (y.gain / y.ef) - (x.gain / x.ef) || y.gain - x.gain || (x.q.id < y.q.id ? -1 : 1));
  let acum = actual;
  const olas = OLAS.map((o) => {
    const its = items.filter((i) => i.ola === o.n), g = its.reduce((t, i) => t + i.gain, 0);
    acum += g;
    return { ...o, items: its, gain: g, hasta: Math.min(100, Math.round(acum)) };
  });
  return { items, olas, actual, g: sc.g, sinResp, total: items.reduce((t, i) => t + i.gain, 0) };
}

const rtPaso = (i) => {
  const o = i.q.op, hoy = (o.find((x) => x.v === i.v) || {}).l || '', sig = i.v + 1 < 3 ? (o.find((x) => x.v === i.v + 1) || {}).l : '', meta = (o.find((x) => x.v === 3) || {}).l || '';
  return { hoy, sig, meta };
};
function rtItem(i) {
  const p = rtPaso(i);
  return `<li class="rt-i${i.fl ? ' rt-fl' : ''}"><div class="rt-h"><strong>${esc(i.q.id)}</strong><span>${esc(i.dm.n)}</span>${i.fl ? '<span class="rt-b">Alerta crítica</span>' : ''}</div><div class="rt-q">${i.q.q}</div><dl class="rt-dl"><div><dt>Hoy</dt><dd>${esc(p.hoy)}</dd></div>${p.sig ? `<div><dt>Primer paso</dt><dd>${esc(p.sig)}</dd></div>` : ''}<div><dt>Meta</dt><dd>${esc(p.meta)}</dd></div></dl><div class="rt-c"><span class="rt-g" title="Puntos de puntaje global que se ganan al llevar esta pregunta a 3">+${fnum(i.gain)} pts</span><span class="rt-e rt-e${i.ef}">Esfuerzo ${EF_N[i.ef].toLowerCase()} · ${EF_T[i.ef]}</span><span class="rt-l">${refLey(i.q.ar, leyRel(i.q))}</span></div></li>`;
}
function rutaHtml(e) {
  const r = ruta(e);
  const cab = `<h3><div class="ic lv3"><i data-lucide="route"></i></div>Hoja de ruta</h3>`;
  if (!r.items.length) {
    return `<div class="rs">${cab}<p class="lead">${r.sinResp && !Object.keys(e.a).length ? 'Aún no hay respuestas para construir la hoja de ruta.' : 'No hay brechas pendientes: todas las respuestas están en el nivel 3.'}</p></div>`;
  }
  return `<div class="rs">${cab}
<p class="lead">Ordena las ${r.items.length} brechas por <strong>beneficio</strong> y <strong>esfuerzo</strong>, en cuatro etapas. Si se completan todas, el puntaje pasa de <strong>${r.g}%</strong> a <strong>${Math.min(100, Math.round(r.actual + r.total))}%</strong>.${r.sinResp ? ` Quedan ${r.sinResp} preguntas sin responder, que no se incluyen.` : ''}</p>
<ul class="rt-res">${r.olas.map((o) => `<li class="rt-r rt-r${o.n}"><span class="rt-rn">${o.n}</span><span class="rt-rt">${esc(o.t)}</span><span class="rt-rc">${o.items.length} · +${fnum(o.gain)} pts · ~${o.hasta}%</span></li>`).join('')}</ul>
${r.olas.filter((o) => o.items.length).map((o) => `<section class="rt-o rt-o${o.n}" aria-labelledby="rt-o${o.n}"><h4 id="rt-o${o.n}">Etapa ${o.n} · ${esc(o.t)} <span>${esc(o.p)}</span></h4><p class="rt-d">${esc(o.d)}</p><p class="rt-s">${o.items.length} ${o.items.length === 1 ? 'iniciativa' : 'iniciativas'} · +${fnum(o.gain)} pts · puntaje estimado al terminar la etapa: <strong>~${o.hasta}%</strong></p><ol class="rt-l-o">${o.items.map(rtItem).join('')}</ol></section>`).join('')}
<p class="met-n"><strong>Cómo se arma.</strong> <em>Beneficio</em>: puntos de puntaje global que se ganan al llevar la pregunta a 3, con los pesos de esta sesión (incluidos rubro y tamaño); alto desde ${RT_ALTO} punto. <em>Esfuerzo</em>: estimación de AlignData de lo que toma llegar a la meta (bajo: días, medio: semanas, alto: meses), sujeta a revisión. <strong>Etapa 1</strong>: alertas críticas y brechas de beneficio alto con esfuerzo bajo o medio. <strong>Etapa 2</strong>: beneficio alto con esfuerzo alto. <strong>Etapa 3</strong>: beneficio menor con esfuerzo bajo. <strong>Etapa 4</strong>: el resto. Los plazos son una propuesta de orden, no una exigencia de la ley (versión ${RT_V}).</p></div>`;
}

// ───────────────────────── Evolución en el tiempo (revisiones guardadas) ─────────────────────────
const EVO_TIPOS = ['Diagnóstico inicial', 'Revisión a 3 meses', 'Revisión a 6 meses', 'Revisión a 12 meses'];
function idx04(s) { return s / 25; }
// Cada revisión guarda las respuestas y el perfil de ese día; se recalculan con el modelo vigente para que todas sean comparables.
function evoPuntos(e) {
  const pts = [];
  for (const r of e.rv || []) {
    const x = new E2(); x.p = { ...(r.p || {}) }; x.a = { ...(r.a || {}) };
    const s = x.sc(); pts.push({ id: r.id, e: r.e, f: r.f, g: s.g, n: x.ml(s.g).n, d: s.d, act: false });
  }
  const ult = (e.rv || [])[(e.rv || []).length - 1];
  const igual = ult && JSON.stringify(ult.a) === JSON.stringify(Object.fromEntries(Object.entries(e.a).filter(([k]) => e.ga().some((q) => q.id === k)))) && (ult.p || {}).sector === (e.p || {}).sector && (ult.p || {})['tamaño'] === (e.p || {})['tamaño'];
  if (pts.length && !igual) { const s = e.sc(); pts.push({ id: 'actual', e: 'Actual', f: Date.now(), g: s.g, n: e.ml(s.g).n, d: s.d, act: true }); }
  return pts;
}
function evoEstado(vals) {
  if (vals.length < 2) return 'Pendiente';
  const ini = vals[0], ult = vals[vals.length - 1];
  if (ult >= 75) return 'Meta alcanzada';
  if (ult - ini > 1) return 'En avance';
  if (ini - ult > 1) return 'Retroceso';
  return 'Sin cambio';
}
const evoFecha = (ms) => fchd(new Date(ms));
function evoSvg(pts) {
  const W = 640, H = 230, L = 42, R = 24, T = 26, B = 46, n = pts.length, I = 58, X = (i) => n === 1 ? L + (W - L - R) / 2 : L + I + i * (W - L - R - 2 * I) / (n - 1), Y = (g) => T + (1 - g / 100) * (H - T - B);
  const meta = `<line x1="${L}" x2="${W - R}" y1="${Y(75).toFixed(1)}" y2="${Y(75).toFixed(1)}" class="evo-meta"/><text x="${L + 6}" y="${(Y(75) - 5).toFixed(1)}" text-anchor="start" class="evo-mt">Meta: nivel 3 (75%)</text>`;
  const grid = [0, 25, 50, 100].map((g) => `<line x1="${L}" x2="${W - R}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" class="evo-g"/><text x="${L - 6}" y="${(Y(g) + 4).toFixed(1)}" text-anchor="end" class="evo-t">${g}%</text>`).join('');
  const lin = n > 1 ? `<polyline class="evo-l" fill="none" points="${pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.g).toFixed(1)).join(' ')}"/>` : '';
  const pun = pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.g).toFixed(1)}" r="5" class="evo-p${p.act ? ' evo-pa' : ''}"/><text x="${X(i).toFixed(1)}" y="${(Y(p.g) - 10).toFixed(1)}" text-anchor="middle" class="evo-v">${p.g}%</text><text x="${X(i).toFixed(1)}" y="${H - 22}" text-anchor="middle" class="evo-t">${esc(p.e.length > 20 ? p.e.slice(0, 19) + '…' : p.e)}</text><text x="${X(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" class="evo-t">${p.act ? 'hoy' : evoFecha(p.f)}</text>`).join('');
  return `<svg class="evo-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Puntaje global en cada revisión: ${esc(pts.map((p) => p.e + ' ' + p.g + '%').join('; '))}">${grid}${meta}${lin}${pun}</svg>`;
}
function evoTabla(pts, editable) {
  const fila = (nombre, get) => { const v = pts.map(get); return `<tr><th scope="row">${esc(nombre)}</th>${v.map((x) => `<td>${fnum(idx04(x))}<small>${Math.round(x)}%</small></td>`).join('')}<td>3,0</td><td>${v.length > 1 ? (idx04(v[v.length - 1] - v[0]) > 0 ? '+' : '') + fnum(idx04(v[v.length - 1] - v[0]), 1) : '—'}</td><td><span class="evo-e evo-e${evoEstado(v).replace(/ /g, '')}">${evoEstado(v)}</span></td></tr>`; };
  return `<div class="met-tw"><table class="met-t evo-t"><caption class="sr-only">Seguimiento del índice de 0 a 4 por dimensión en cada revisión</caption><thead><tr><th scope="col">Dimensión</th>${pts.map((p) => `<th scope="col">${esc(p.e)}<br><span class="met-ar">${p.act ? 'hoy' : evoFecha(p.f)}</span>${editable && !p.act ? `<br><button type="button" class="evo-x" onclick="evoBorrar('${esc(p.id)}')" aria-label="Eliminar la revisión ${esc(p.e)}">Eliminar</button>` : ''}</th>`).join('')}<th scope="col">Objetivo</th><th scope="col">Variación</th><th scope="col">Estado</th></tr></thead><tbody>${D.map((d) => fila(d.n, (p) => p.d[d.id])).join('')}</tbody><tfoot>${fila('Puntaje global', (p) => p.g)}</tfoot></table></div>`;
}
function evoForm(e) {
  const hay = (e.rv || []).length, sug = EVO_TIPOS[Math.min(hay, EVO_TIPOS.length - 1)], h = new Date(), f = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
  return `<form class="evo-f" onsubmit="evoGuardar();return false"><div class="fg"><label for="evo-tipo">Qué es esta revisión</label><select id="evo-tipo">${EVO_TIPOS.map((t) => `<option${t === sug ? ' selected' : ''}>${t}</option>`).join('')}<option>Otra</option></select></div><div class="fg"><label for="evo-fecha">Fecha</label><input type="date" id="evo-fecha" value="${f}"></div><button type="submit" class="be be-p"><i data-lucide="save"></i>Guardar esta evaluación como revisión</button></form><p class="evo-ay">Guarda una foto de las respuestas de hoy. Después puede editar las respuestas para reflejar los avances y guardar la siguiente revisión; la hoja de ruta y los resultados siempre usan las respuestas actuales.</p>`;
}
function evoHtml(e) {
  const editable = typeof modo !== 'undefined' && modo === 'auditor' && !e.ro, pts = evoPuntos(e), hay = pts.length > 0;
  const cab = `<h3><div class="ic lv3"><i data-lucide="trending-up"></i></div>Evolución en el tiempo</h3>`;
  const intro = hay ? `<p class="lead">Seguimiento del índice de 0 a 4 en cada revisión, con el objetivo de llegar al nivel 3 (Gestionado). Las revisiones se recalculan con el modelo vigente para que sean comparables.</p>` : `<p class="lead">${editable ? 'Aún no hay revisiones guardadas. Guarde la evaluación de hoy como <strong>diagnóstico inicial</strong> y repita el diagnóstico a los 3, 6 y 12 meses para medir el avance.' : 'Aún no hay revisiones guardadas.'}</p>`;
  return `<div class="rs">${cab}${intro}${editable ? evoForm(e) : ''}${hay ? evoSvg(pts) + evoTabla(pts, editable) : ''}</div>`;
}
function evoGuardar() {
  if (typeof en === 'undefined' || en.ro || !Object.keys(en.a).length) return;
  const t = document.getElementById('evo-tipo'), f = document.getElementById('evo-fecha');
  const v = f && f.value ? new Date(f.value + 'T12:00:00').getTime() : Date.now();
  en.rev(t ? t.value : 'Revisión', isNaN(v) ? Date.now() : v);
  evoRefrescar();
}
function evoBorrar(id) { if (typeof confirm === 'function' && !confirm('¿Eliminar esta revisión? No se puede deshacer.')) return; en.revDel(id); evoRefrescar(); }
function evoRefrescar() {
  const p = document.getElementById('t9'); if (p) p.innerHTML = evoHtml(en);
  const n = (en.rv || []).length, t = document.querySelector('#tab-t9 .t');
  let c = document.querySelector('#tab-t9 .tcnt');
  if (t && !c && n) { c = document.createElement('span'); c.className = 'tcnt'; t.appendChild(c); }
  if (c) { if (n) c.textContent = n; else c.remove(); }
  if (window.lucide) lucide.createIcons();
}

// ───────────────────────── Informe ejecutivo y acta (documentos para imprimir o guardar como PDF) ─────────────────────────
function docAutor() {
  if (typeof modo === 'undefined') return '';
  if (modo === 'auditor' && window.pzUsuario) { const u = window.pzUsuario(); return u ? String(u.nombre || u.email || '') : ''; }
  if (modo === 'cliente' && en.cons) return String(en.cons.nombre || '');
  return '';
}
const docCab = (titulo, e, pie) => {
  const p = e.p || {}, quien = docAutor();
  return `<header class="dc-h"><div class="dc-m"><span class="dc-lg">AlignData</span><span>D360° · Ley 21.719</span></div><h1>${esc(titulo)}</h1><dl class="dc-meta"><div><dt>Empresa</dt><dd>${esc(p.nombre || '—')}</dd></div><div><dt>Rubro</dt><dd>${esc((SEC_N[p.sector]) || (p.sector === 'otro' ? 'Otro' : '—'))}</dd></div><div><dt>Tamaño</dt><dd>${esc(TAM[p['tamaño']] ? TAM[p['tamaño']].n + ' (' + TAM[p['tamaño']].e + ')' : '—')}</dd></div><div><dt>Fecha</dt><dd>${e.pubEn ? fchd(e.pubEn) : fch()}</dd></div>${quien ? `<div><dt>Preparado por</dt><dd>${esc(quien)}</dd></div>` : ''}</dl></header>`;
};
function docInforme(e) {
  const sc = e.sc(), mt = e.ml(sc.g), cl = e.cl2(), fl = e.fl(), r = ruta(e), pts = evoPuntos(e);
  const ord = D.map((d) => ({ d, s: sc.d[d.id] })).sort((a, b) => b.s - a.s), mejor = ord[0], peor = ord[ord.length - 1];
  const n = (st) => cl.filter((c) => c.st === st).length;
  const resumen = Object.keys(e.a).length ? `La organización está en el <strong>nivel ${mt.n} (${esc(mt.nm)})</strong>, con un puntaje de <strong>${sc.g}%</strong> e índice <strong>${fnum(idx04(sc.g))} de 4,0</strong> (riesgo ${esc(mt.ri)}; la meta de referencia es el nivel 3). Su dimensión más fuerte es <em>${esc(mejor.d.n)}</em> (${mejor.s}%) y la más débil, <em>${esc(peor.d.n)}</em> (${peor.s}%). De las ${cl.length} obligaciones evaluadas, ${n('green')} cumplen, ${n('yellow')} cumplen parcialmente y ${n('red')} no cumplen${fl.length ? `; hay <strong>${fl.length} alerta${fl.length === 1 ? '' : 's'} crítica${fl.length === 1 ? '' : 's'}</strong> que conviene atender primero` : '; no hay alertas críticas'}.` : 'Aún no hay respuestas para resumir.';
  const dims = `<table class="dc-t"><thead><tr><th>Dimensión</th><th>Puntaje</th><th>Índice 0–4</th><th>Nivel</th></tr></thead><tbody>${D.map((d) => { const s = sc.d[d.id], l = e.ml(s); return `<tr><th scope="row">${esc(d.n)}</th><td><span class="dc-bar"><i style="width:${s}%;background:${l.c}"></i></span> ${s}%</td><td>${fnum(idx04(s))}</td><td>${esc(l.nm)}</td></tr>`; }).join('')}</tbody><tfoot><tr><th scope="row">Puntaje global</th><td>${sc.g}%</td><td>${fnum(idx04(sc.g))}</td><td>${esc(mt.nm)}</td></tr></tfoot></table>`;
  const alertas = fl.length ? `<h2>Alertas críticas</h2><ul class="dc-l">${fl.map((f) => `<li><strong>${esc(f.id)}</strong> · ${f.q} <em>(${esc(D.find((x) => x.id === f.dm).n)}, ${esc(f.ar)})</em></li>`).join('')}</ul>` : '';
  const olas = r.olas.filter((o) => o.items.length).map((o) => `<div class="dc-o"><h3>Etapa ${o.n} · ${esc(o.t)} <span>${esc(o.p)}</span></h3><p class="dc-s">${o.items.length} ${o.items.length === 1 ? 'iniciativa' : 'iniciativas'} · +${fnum(o.gain)} pts · puntaje estimado al terminar: ~${o.hasta}%</p><ol>${o.items.slice(0, 5).map((i) => `<li><strong>${esc(i.q.id)}</strong> ${i.q.q} <em>— Meta: ${esc(rtPaso(i).meta)}. Esfuerzo ${EF_N[i.ef].toLowerCase()} (${EF_T[i.ef]}), +${fnum(i.gain)} pts.</em></li>`).join('')}</ol>${o.items.length > 5 ? `<p class="dc-s">Y ${o.items.length - 5} más en el detalle de la hoja de ruta.</p>` : ''}</div>`).join('');
  const evo = pts.length > 1 ? `<h2>Evolución</h2>${evoTabla(pts, false).replace('class="met-t evo-t"', 'class="dc-t"')}` : '';
  const sec = SEC[(e.p || {}).sector] || (TAM[(e.p || {})['tamaño']] || {}).lv > 0 ? `<p>El puntaje incluye ${[SEC[(e.p || {}).sector] ? 'la ponderación por exposición sectorial' : '', (TAM[(e.p || {})['tamaño']] || {}).lv > 0 ? 'el ajuste por tamaño' : ''].filter(Boolean).join(' y ')}; sin ajustes sería ${sc.gb}%.</p>` : '';
  return `<article class="dc">${docCab('Informe ejecutivo', e)}<h2>Resumen</h2><p>${resumen}</p><h2>Resultado por dimensión</h2>${dims}${alertas}<h2>Hoja de ruta</h2>${r.items.length ? `<p>${r.items.length} brechas ordenadas por beneficio y esfuerzo. Si se completan todas, el puntaje pasaría de ${r.g}% a ${Math.min(100, Math.round(r.actual + r.total))}%.</p>${olas}` : '<p>No hay brechas pendientes.</p>'}${evo}<h2>Alcance y límites</h2><p>Es un diagnóstico de preparación frente a la Ley 21.719 basado en lo que se declaró en la reunión: no es una auditoría ni una opinión legal. Los pesos, los ajustes por rubro y tamaño, el esfuerzo de cada iniciativa y los plazos de las etapas son criterios de AlignData sujetos a revisión (método ${SEC_V}/${TAM_V}/${RT_V}); el detalle está en la pestaña Método.</p>${sec}<h2>Próximos pasos</h2><ol class="dc-l"><li>Validar la hoja de ruta con la gerencia y asignar un responsable a cada iniciativa de la Etapa 1.</li><li>Atender primero las alertas críticas${fl.length ? '' : ' (no hay alertas críticas en esta evaluación)'}.</li><li>Repetir el diagnóstico a los 3, 6 y 12 meses para medir el avance contra la meta (nivel 3).</li></ol><footer class="dc-p">AlignData · aligndata.cl · Documento generado por el D360° el ${fch()}</footer></article>`;
}
function docActa(e) {
  const sc = e.sc(), mt = e.ml(sc.g), fl = e.fl(), r = ruta(e), pz = (window.PZ && window.PZ.entries) || [], grupos = pzAgrupar(pz), porQ = new Map(grupos.map((g) => [g.qid, g.items]));
  const gente = new Map(); for (const x of pz) { const k = x.autor + '|' + x.rol; if (!gente.has(k)) gente.set(k, { n: x.autor, rol: x.rol, cargo: x.cargo }); }
  const quien = docAutor(); if (quien && ![...gente.values()].some((g) => g.n === quien)) gente.set('doc|consultor', { n: quien, rol: 'consultor' });
  const com = (it) => `<li><strong>${esc(it.autor)}</strong> <span>(${it.rol === 'consultor' ? 'Consultor' : 'Cliente'}, ${+it.creadoEn ? fchd(new Date(+it.creadoEn)) : 's/f'})</span>: ${esc(it.texto)}${(it.adjuntos || []).length ? ` <em>Adjuntos: ${(it.adjuntos || []).map((a) => esc(a.n)).join(', ')}.</em>` : ''}${(it.imgs || []).length ? ` <em>${it.imgs.length} imagen${it.imgs.length === 1 ? '' : 'es'}.</em>` : ''}</li>`;
  const resp = D.map((d) => { const qs = e.ga().filter((q) => q.dm === d.id && e.a[q.id] !== undefined); if (!qs.length) return ''; return `<h3>${esc(d.n)} <span>${sc.d[d.id]}%</span></h3><table class="dc-t"><tbody>${qs.map((q) => { const o = q.op.find((x) => x.v === e.a[q.id]) || {}; return `<tr><th scope="row">${esc(q.id)}</th><td>${q.q}<div class="dc-r">Respuesta: <strong>${e.a[q.id]} · ${esc(o.l || '')}</strong></div>${porQ.has(q.id) ? `<ul class="dc-c">${porQ.get(q.id).map(com).join('')}</ul>` : ''}</td></tr>`; }).join('')}</tbody></table>`; }).join('');
  const gen = porQ.get('general');
  const olas1 = r.olas[0].items.slice(0, 8);
  return `<article class="dc dc-acta">${docCab('Acta de la reunión', e)}<h2>Participantes</h2>${gente.size ? `<ul class="dc-l">${[...gente.values()].map((g) => `<li>${esc(g.n)} — ${g.rol === 'consultor' ? 'Consultor AlignData' : 'Cliente'}${g.cargo ? ', ' + esc(g.cargo) : ''}</li>`).join('')}</ul>` : '<p>No se registraron participantes en la pizarra.</p>'}<h2>Resultado del diagnóstico</h2><p>Nivel ${mt.n} (${esc(mt.nm)}), puntaje ${sc.g}%, índice ${fnum(idx04(sc.g))} de 4,0, riesgo ${esc(mt.ri)}. ${fl.length ? `${fl.length} alerta${fl.length === 1 ? '' : 's'} crítica${fl.length === 1 ? '' : 's'}: ${fl.map((f) => esc(f.id)).join(', ')}.` : 'Sin alertas críticas.'}</p>${gen && gen.length ? `<h2>Comentarios y acuerdos generales</h2><ul class="dc-c">${gen.map(com).join('')}</ul>` : ''}<h2>Respuestas y comentarios por pregunta</h2>${resp || '<p>Aún no hay respuestas.</p>'}${olas1.length ? `<h2>Compromisos propuestos (Etapa 1)</h2><ol class="dc-l">${olas1.map((i) => `<li><strong>${esc(i.q.id)}</strong> ${i.q.q} <em>— Meta: ${esc(rtPaso(i).meta)}</em></li>`).join('')}</ol>` : ''}<div class="dc-fir"><div><span></span>Consultor AlignData</div><div><span></span>Representante de la empresa</div></div><footer class="dc-p">Acta generada por el D360° el ${fch()}. Resume lo declarado en la reunión; no es una auditoría ni una opinión legal.</footer></article>`;
}
function imprimirDoc(t) {
  const d = document.getElementById('doc'); if (!d) return;
  const nom = (en.p && en.p.nombre) || 'Diagnóstico', tt = document.title;
  d.innerHTML = t === 'acta' ? docActa(en) : docInforme(en);
  document.title = (t === 'acta' ? 'Acta D360 - ' : 'Informe ejecutivo D360 - ') + nom + ' - ' + fch();
  document.body.classList.add('imp-doc');
  const r = () => { document.body.classList.remove('imp-doc'); document.title = tt; d.innerHTML = ''; window.removeEventListener('afterprint', r); };
  window.addEventListener('afterprint', r);
  window.print();
}
