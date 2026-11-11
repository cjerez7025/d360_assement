/* ruta.js — Hoja de ruta, evolución en el tiempo, informe ejecutivo y acta de la reunión.
   Se carga después de app.js y usa sus datos y funciones (D, Q, A, CL, E2, en, esc, fnum, refLey, leyRel, pzAgrupar…).
   Las funciones de cálculo son puras (las prueba `npm run verificar`); las de pantalla solo arman HTML. */

// ───────────────────────── Hoja de ruta (etapas por beneficio y esfuerzo) ─────────────────────────
// Esfuerzo estimado de llevar cada pregunta al nivel 3: 1 bajo (días), 2 medio (semanas), 3 alto (meses).
// Es criterio inicial de AlignData, sujeto a revisión: para cambiarlo se edita EF y se actualiza RT_V.
const RT_V = '1.0', RT_ALTO = 1;
const EF = {
  'GOB-05': 1, 'GOB-02': 1, 'CUL-06': 2, 'GOB-04': 2, 'GOB-01': 3,
  'GOB-03': 2, 'GOB-06': 1, 'GOB-07': 2, 'REG-07': 3, 'SEG-06': 2, 'RIE-04': 3, 'RIE-05': 2, 'ARC-08': 1, 'TER-05': 1, 'CUL-05': 2,
  'LEG-01': 2, 'LEG-01b': 2, 'LEG-02': 1, 'LEG-03': 1, 'LEG-04': 2, 'LEG-05': 2,
  'ARC-01': 1, 'ARC-01b': 1, 'ARC-02': 3, 'ARC-03': 3, 'ARC-04': 1, 'ARC-05': 3, 'ARC-06': 1, 'ARC-07': 2,
  'REG-01': 3, 'REG-01b': 1, 'REG-02': 2, 'REG-03': 2, 'REG-04': 2, 'REG-05': 1, 'REG-06': 2,
  'SEG-01': 3, 'SEG-02': 2, 'SEG-02b': 1, 'SEG-03': 2, 'SEG-04': 2, 'SEG-05': 3,
  'TER-01': 2, 'TER-01b': 2, 'TER-02': 2, 'TER-03': 1, 'TER-04': 2, 'TER-06': 2,
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
// ── participantes: los de la pizarra y de la ficha, o la lista que el consultor dejó editada (e.part = { cli: [{n, c}], con: [{n, c}] }) ──
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fchl = (t, sinAnio) => { const d = new Date(t); return d.getDate() + ' de ' + MESES_L[d.getMonth()] + (sinAnio ? '' : ' de ' + d.getFullYear()); };
const lstY = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]);
function partLimpio(x) {
  if (!x || typeof x !== 'object') return null;
  const lim = (l) => (Array.isArray(l) ? l : []).slice(0, 15).map((p) => ({ n: String((p && p.n) || '').trim().slice(0, 80), c: String((p && p.c) || '').trim().slice(0, 80) })).filter((p) => p.n);
  const r = { cli: lim(x.cli), con: lim(x.con) };
  return r.cli.length || r.con.length ? r : null;
}
function partDerivar(e) {
  const pz = (window.PZ && window.PZ.entries) || [], cand = [];
  for (const x of pz) cand.push({ n: String(x.autor || '').trim(), rol: x.rol === 'consultor' ? 'con' : 'cli', c: x.cargo ? String(x.cargo).trim() : '' });
  const quien = docAutor(); if (quien) cand.push({ n: quien, rol: 'con', c: '' });
  const ct = e.p && e.p.contacto ? String(e.p.contacto).trim() : ''; if (ct) cand.push({ n: ct, rol: 'cli', c: '' });
  // misma persona: el nombre más corto está contenido, palabra por palabra, en el más largo («Patricio» y «Patricio Oliva Ramírez»)
  const pal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
  const dentro = (a, b) => a.every((t) => b.includes(t));
  const out = [];
  for (const c of cand) {
    if (!c.n) continue;
    const t = pal(c.n), m = out.find((o) => { const u = pal(o.n); return dentro(t, u) || dentro(u, t); });
    if (!m) { out.push({ ...c }); continue; }
    if (t.length > pal(m.n).length) m.n = c.n; // se queda con el nombre más completo
    if (c.rol === 'con') m.rol = 'con'; // si alguna vez firmó como consultor, es consultor
    if (!m.c && c.c) m.c = c.c;
  }
  const f = (r) => out.filter((o) => o.rol === r).map(({ n, c }) => ({ n, c }));
  return { cli: f('cli'), con: f('con') };
}
const partLista = (e) => partLimpio(e.part) || partDerivar(e);
function docNotas(e) {
  const L = partLista(e), emp = (e.p && e.p.nombre) || 'la empresa', fe = e.fechas || {}, hoy = e.pubEn || Date.now();
  const dia = (t) => new Date(t).toDateString();
  const cuest = fe.ini && fe.fin ? (dia(fe.ini) === dia(fe.fin) ? `cuestionario D360° respondido el ${fchl(fe.ini)}` : `cuestionario D360° respondido entre el ${fchl(fe.ini, new Date(fe.ini).getFullYear() === new Date(fe.fin).getFullYear())} y el ${fchl(fe.fin)}`) : 'cuestionario D360° respondido durante la reunión';
  const hayPz = ((window.PZ && window.PZ.entries) || []).length > 0;
  const fuentes = lstY([cuest, ...(hayPz ? ['comentarios registrados en la pizarra de la reunión'] : []), `acta del ${fchl(hoy)}`]);
  const nom = (l) => lstY(l.map((p) => p.n));
  const gente = [L.cli.length ? `${nom(L.cli)} (${emp})` : '', L.con.length ? `${nom(L.con)} (AlignData)` : ''].filter(Boolean).join('; ');
  return `<p class="dc-n"><strong>Fuentes:</strong> ${esc(fuentes)}.</p>${gente ? `<p class="dc-n"><strong>Participantes:</strong> ${esc(gente)}.</p>` : ''}<p class="dc-n"><strong>Escala:</strong> cada respuesta se califica de 0 a 3 según lo declarado; el índice de 0 a 4 resulta de dividir el puntaje global por 25, y la meta de referencia es el nivel 3 (Gestionado, de 61% a 80%).</p><p class="dc-n"><strong>Marco normativo:</strong> Ley N° 19.628, modificada por la Ley N° 21.719, y Decreto N° 662 de 2026, que reglamenta los modelos de prevención de infracciones.</p>`;
}
// ── gráficos del informe (formato acordado el 11-11-2026): «Cinco etapas hasta el cierre» y «Metodología D360°» ──
const ETAPAS_P = [
  ['Kick-off', 'Acordamos participantes, fechas y documentos.'],
  ['Talleres de assessment', 'Dos sesiones por grupos de dimensiones, con quienes conocen cada tema.'],
  ['Análisis y revisión legal', 'Puntuación por dimensión y revisión de los hallazgos normativos.'],
  ['Entregables', 'Dashboard, informe ejecutivo y plan a 3, 6 y 12 meses.'],
  ['Presentación a la gerencia', 'Resultados y plan de adecuación.']
];
const DIAS_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'], MESES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const etpFecha = (s) => { // «2026-11-12» → «Jueves 12 de Nov»
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); if (!m) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() !== +m[2] - 1 ? '' : DIAS_L[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES_C[d.getMonth()];
};
function etpLimpio(x) { // fechas previstas de las dos últimas etapas: { e: entrega, p: presentación }
  if (!x || typeof x !== 'object') return null;
  const f = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && etpFecha(v) ? String(v) : '');
  const r = { e: f(x.e), p: f(x.p) };
  return r.e || r.p ? r : null;
}
// las tres primeras etapas se dan por hechas cuando el cuestionario está completo; las dos últimas, según los hitos del servicio
function docEtapas(e) {
  const pg = e.pg(), completa = pg.t > 0 && pg.d === pg.t, h = (e.srv && e.srv.hitos) || {}, et = e.etp || {};
  const ok = [completa, completa, completa, !!(h.dashboard || h.informe), !!(h.informe || h.cierre)];
  const fe = ['', '', '', etpFecha(et.e), etpFecha(et.p)];
  return `<h2>Cinco etapas hasta el cierre</h2><div class="dc-et">${ETAPAS_P.map((p, i) => `<div class="dc-e${ok[i] ? ' dc-ok' : ''}"><b>${i + 1}</b><h4>${esc(p[0])}</h4><p>${esc(p[1])}</p>${fe[i] ? `<small>${esc(fe[i])}</small>` : ''}</div>`).join('')}</div>`;
}
const MET_D = { gobernanza: 'Responsables, políticas y apoyo de la gerencia', terceros: 'Proveedores y encargados que tratan datos', seguridad: 'Protección de sistemas y accesos', registro: 'Qué datos tratan, para qué y por cuánto tiempo', riesgo: 'Cómo identifican y priorizan los riesgos', arcop: 'Cómo atienden las solicitudes de las personas', cumplimiento: 'Documentos, avisos y consentimientos', cultura: 'Conocimiento y hábitos del equipo' };
const MET_ORD = ['gobernanza', 'terceros', 'seguridad', 'registro', 'riesgo', 'arcop', 'cumplimiento', 'cultura'];
function docMetodo(e) {
  const dim = MET_ORD.map((id) => D.find((d) => d.id === id)).filter(Boolean);
  const niv = [10, 30, 50, 70, 90].map((s) => e.ml(s).nm); // los mismos nombres de nivel que las tablas del informe
  return `<h2>Metodología D360°: ocho dimensiones, una escala de 0 a 4</h2><div class="dc-mt">${dim.map((d) => `<div class="dc-m8"><h4>${esc(d.n)}</h4><p>${esc(MET_D[d.id] || d.s)}</p></div>`).join('')}</div><div class="dc-esc">${niv.map((n, i) => `<span class="s${i}"><b>${i}</b> ${esc(n)}</span>`).join('')}</div>`;
}
// servicios que AlignData puede ofrecer a continuación: salen del catálogo de paquetes (servicio.js); no se ofrece el que el cliente ya tiene
// Servicios que se ofrecen en el informe ejecutivo (acuerdo del 11-11-2026): D360° Evalúa y el Portal ARCOP. Evalúa sale del catálogo de paquetes
// (servicio.js); el Portal no tiene paquete propio (hoy va dentro de D360° Implementa), así que su texto sale de ese paquete y de la dimensión
// Derechos del titular. Texto provisorio: lo valida Ricardo Carmona.
const SRV_PORTAL = {
  n: 'Portal ARCOP', tag: 'Derechos del titular en producción',
  incl: ['Portal para recibir y responder las solicitudes de las personas: acceso, rectificación, supresión, oposición, portabilidad y bloqueo', 'Plazos, seguimiento y evidencia de cada respuesta', 'Panel del delegado de datos en producción']
};
function docServicios(e) {
  if (typeof SRV_P === 'undefined' || typeof SRV_ACT === 'undefined') return '';
  const tiene = e.srv && SRV_ACT.includes(e.srv.estado) ? SRV_P[e.srv.paquete] : null;
  const lista = [];
  if (SRV_P.evalua && (!tiene || SRV_P.evalua.nivel > tiene.nivel)) lista.push(SRV_P.evalua);
  if (!tiene || tiene.nivel < (SRV_P.implementa || { nivel: 4 }).nivel) lista.push(SRV_PORTAL); // el Portal ya viene en D360° Implementa
  if (!lista.length) return '';
  return `<h2>Servicios que puede entregar AlignData para asegurar el cumplimiento y optimizar tiempos</h2><p>Para cerrar las brechas de este diagnóstico y ganar tiempo antes de la entrada en vigor, AlignData ofrece los siguientes servicios:</p>${lista.map((k) => `<div class="dc-o"><h3>${esc(k.n)} <span>${esc(k.tag)}</span></h3><ul class="dc-l">${k.incl.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}`;
}
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
  return `<article class="dc">${docCab('Informe ejecutivo', e)}<h2>Resumen</h2><p>${resumen}</p>${docNotas(e)}${docEtapas(e)}${docMetodo(e)}<h2>Resultado por dimensión</h2>${dims}${alertas}<h2>Hoja de ruta</h2>${r.items.length ? `<p>${r.items.length} brechas ordenadas por beneficio y esfuerzo. Si se completan todas, el puntaje pasaría de ${r.g}% a ${Math.min(100, Math.round(r.actual + r.total))}%.</p>${olas}` : '<p>No hay brechas pendientes.</p>'}${evo}<h2>Alcance y límites</h2><p>Es un diagnóstico de preparación frente a la Ley 21.719 basado en lo que se declaró en la reunión: no es una auditoría ni una opinión legal. Los pesos, los ajustes por rubro y tamaño, el esfuerzo de cada iniciativa y los plazos de las etapas son criterios de AlignData sujetos a revisión.</p>${sec}<h2>Próximos pasos</h2><ol class="dc-l"><li>Validar la hoja de ruta con la gerencia y asignar un responsable a cada iniciativa de la Etapa 1.</li><li>Atender primero las alertas críticas${fl.length ? '' : ' (no hay alertas críticas en esta evaluación)'}.</li><li>En forma adicional se sugiere repetir el diagnóstico a los 3, 6 y 12 meses para medir el avance contra la meta (nivel 3).</li></ol>${docServicios(e)}<footer class="dc-p">AlignData · aligndata.cl · Documento generado por el D360° el ${fch()}</footer></article>`;
}
function docActa(e) {
  const pgA = e.pg(), completa = pgA.t > 0 && pgA.d === pgA.t;
  const sc = e.sc(), mt = e.ml(sc.g), fl = e.fl(), r = ruta(e), pz = (window.PZ && window.PZ.entries) || [], grupos = pzAgrupar(pz), porQ = new Map(grupos.map((g) => [g.qid, g.items]));
  const PL = partLista(e), gente = [...PL.cli.map((p) => ({ n: p.n, rol: 'cliente', cargo: p.c })), ...PL.con.map((p) => ({ n: p.n, rol: 'consultor', cargo: p.c }))];
  const com = (it) => `<li><strong>${esc(it.autor)}</strong> <span>(${it.rol === 'consultor' ? 'Consultor' : 'Cliente'}, ${+it.creadoEn ? fchd(new Date(+it.creadoEn)) : 's/f'})</span>: ${esc(it.texto)}${(it.adjuntos || []).length ? ` <em>Adjuntos: ${(it.adjuntos || []).map((a) => esc(a.n)).join(', ')}.</em>` : ''}${(it.imgs || []).length ? ` <em>${it.imgs.length} imagen${it.imgs.length === 1 ? '' : 'es'}.</em>` : ''}</li>`;
  const mostrados = new Set();
  const resp = D.map((d) => { const qs = e.ga().filter((q) => q.dm === d.id && (e.a[q.id] !== undefined || porQ.has(q.id))); if (!qs.length) return ''; qs.forEach((q) => mostrados.add(q.id)); return `<h3>${esc(d.n)} <span>${sc.d[d.id]}%</span></h3><table class="dc-t"><tbody>${qs.map((q) => { const o = q.op.find((x) => x.v === e.a[q.id]) || {}; return `<tr><th scope="row">${esc(q.id)}</th><td>${q.q}${e.a[q.id] !== undefined ? `<div class="dc-r">Respuesta: <strong>${e.a[q.id]} · ${esc(o.l || '')}</strong></div>` : '<div class="dc-r">Sin respuesta registrada</div>'}${porQ.has(q.id) ? `<ul class="dc-c">${porQ.get(q.id).map(com).join('')}</ul>` : ''}</td></tr>`; }).join('')}</tbody></table>`; }).join('');
  const gen = porQ.get('general');
  // comentarios de preguntas que no aparecen en la lista de esta sesión (por ejemplo, una pregunta de profundización que no se activó): se muestran con su dimensión
  const otros = grupos.filter((g) => g.qid !== 'general' && !mostrados.has(g.qid)).map((g) => { const q = Q.find((x) => x.id === g.qid), d = q && D.find((x) => x.id === q.dm); return `<li><strong>${esc(g.qid)}</strong>${d ? ` <span>(${esc(d.n)})</span>` : ''}${q ? ` ${q.q}` : ''}<ul class="dc-c">${g.items.map(com).join('')}</ul></li>`; });
  const olas1 = r.olas[0].items.slice(0, 8);
  return `<article class="dc dc-acta">${docCab('Acta de la reunión', e)}<h2>Participantes</h2>${gente.length ? `<ul class="dc-l">${gente.map((g) => `<li>${esc(g.n)} — ${g.rol === 'consultor' ? 'Consultor AlignData' : 'Cliente'}${g.cargo ? ', ' + esc(g.cargo) : ''}</li>`).join('')}</ul>` : '<p>No se registraron participantes en la pizarra.</p>'}<h2>Resultado del diagnóstico</h2><p>${completa ? `Nivel ${mt.n} (${esc(mt.nm)}), puntaje ${sc.g}%, índice ${fnum(idx04(sc.g))} de 4,0, riesgo ${esc(mt.ri)}.` : `El cuestionario está en curso (${pgA.d} de ${pgA.t} preguntas respondidas): el puntaje y el nivel global se calculan al terminarlo.`} ${fl.length ? `${fl.length} alerta${fl.length === 1 ? '' : 's'} crítica${fl.length === 1 ? '' : 's'}: ${fl.map((f) => esc(f.id)).join(', ')}.` : 'Sin alertas críticas.'}</p>${gen && gen.length ? `<h2>Comentarios y acuerdos generales</h2><ul class="dc-c">${gen.map(com).join('')}</ul>` : ''}<h2>Respuestas y comentarios por pregunta</h2>${resp || '<p>Aún no hay respuestas.</p>'}${otros.length ? `<h2>Comentarios sobre otras preguntas</h2><ul class="dc-l">${otros.join('')}</ul>` : ''}${olas1.length ? `<h2>Compromisos propuestos (Etapa 1)</h2><ol class="dc-l">${olas1.map((i) => `<li><strong>${esc(i.q.id)}</strong> ${i.q.q} <em>— Meta: ${esc(rtPaso(i).meta)}</em></li>`).join('')}</ol>` : ''}<div class="dc-fir"><div><span></span>Consultor AlignData</div><div><span></span>Representante de la empresa</div></div><footer class="dc-p">Acta generada por el D360° el ${fch()}. Resume lo declarado en la reunión; no es una auditoría ni una opinión legal.</footer></article>`;
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
function descargarWordDoc(t) {
  const nom = ((en.p && en.p.nombre) || 'Diagnóstico').replace(/[\\/:*?"<>|]/g, ' ').trim();
  window.descargarWord(t === 'acta' ? docActa(en) : docInforme(en), (t === 'acta' ? 'Acta D360 - ' : 'Informe ejecutivo D360 - ') + nom + ' - ' + fch() + '.docx');
}
// Diálogo de descarga: elige PDF o Word y, si lo conduce un consultor, deja ajustar la lista de participantes que sale en ambos documentos
function docDlg(t) {
  const d = document.getElementById('dlg-doc'), sl = document.getElementById('doc-slot'); if (!d || !sl) return;
  const acta = t === 'acta', emp = (en.p && en.p.nombre) || 'la empresa', L = partLista(en);
  const edita = typeof modo !== 'undefined' && modo === 'auditor' && !en.ro;
  document.getElementById('doc-t').innerHTML = `<i data-lucide="${acta ? 'notebook-text' : 'file-text'}"></i> ${acta ? 'Acta de la reunión' : 'Informe ejecutivo'}`;
  const area = (id, l) => `<textarea id="${id}" rows="${Math.max(3, l.length + 1)}" spellcheck="false" ${edita ? '' : 'readonly'}>${esc(l.map((p) => p.n + (p.c ? ', ' + p.c : '')).join('\n'))}</textarea>`;
  sl.innerHTML = `<p class="dd-p">${acta ? 'Resume la reunión: respuestas, comentarios de la pizarra y compromisos propuestos, con espacio para las firmas.' : 'Resumen de resultados, alertas críticas, hoja de ruta y servicios que AlignData puede entregar.'}</p>
<div class="dd-part"><h3>Participantes</h3><p class="dd-n">${edita ? 'Aparecen en el informe y en el acta. Uno por línea: «Nombre, cargo». Revíselos antes de descargar.' : 'Personas que participaron en la reunión.'}</p><label for="dd-cli">Por ${esc(emp)}</label>${area('dd-cli', L.cli)}<label for="dd-con">Por AlignData</label>${area('dd-con', L.con)}</div>
${acta ? '' : `<div class="dd-part"><h3>Fechas previstas</h3><p class="dd-n">${edita ? 'Salen en las etapas «Entregables» y «Presentación a la gerencia». Déjelas vacías para no mostrar fecha.' : 'Fechas previstas de las dos últimas etapas.'}</p><div class="dd-f"><div><label for="dd-ent">Entrega del informe</label><input type="date" id="dd-ent" value="${esc((en.etp || {}).e || '')}" ${edita ? '' : 'readonly'}></div><div><label for="dd-pre">Presentación a la gerencia</label><input type="date" id="dd-pre" value="${esc((en.etp || {}).p || '')}" ${edita ? '' : 'readonly'}></div></div></div>`}
<div class="dd-bt"><button type="button" class="be" id="dd-pdf"><i data-lucide="file-down"></i> Descargar PDF</button><button type="button" class="be dd-w" id="dd-word"><i data-lucide="file-text"></i> Descargar Word</button></div>
<p class="dd-n">El PDF se guarda desde el cuadro de impresión: elija «Guardar como PDF» como destino.</p>`;
  const leer = (id) => document.getElementById(id).value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 15).map((s) => { const i = s.indexOf(','); return i < 0 ? { n: s.slice(0, 80), c: '' } : { n: s.slice(0, i).trim().slice(0, 80), c: s.slice(i + 1).trim().slice(0, 80) }; }).filter((p) => p.n);
  const guardar = () => { // solo si cambió respecto de la lista actual; así, mientras no se edite, la lista sigue al día con la pizarra
    if (!edita) return;
    const nueva = { cli: leer('dd-cli'), con: leer('dd-con') };
    if (JSON.stringify(nueva) === JSON.stringify(partLista(en))) return;
    en.part = partLimpio(nueva); en.sv();
  };
  const guardarFechas = () => {
    const ent = document.getElementById('dd-ent'), pre = document.getElementById('dd-pre');
    if (!edita || !ent || !pre) return;
    const nueva = etpLimpio({ e: ent.value, p: pre.value });
    if (JSON.stringify(nueva) === JSON.stringify(etpLimpio(en.etp))) return;
    en.etp = nueva; en.sv();
  };
  document.getElementById('dd-pdf').onclick = () => { guardar(); guardarFechas(); d.close(); setTimeout(() => imprimirDoc(t), 200); };
  document.getElementById('dd-word').onclick = () => { guardar(); guardarFechas(); descargarWordDoc(t); d.close(); };
  if (window.lucide) lucide.createIcons();
  if (!d.open) d.showModal();
}
