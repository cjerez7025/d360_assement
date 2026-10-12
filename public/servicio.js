/* servicio.js — Servicio contratado: qué paquete tiene el cliente, en qué estado está, con qué contrato y qué hitos se han cumplido.
   El D360° Inicia es el punto de partida (esta aplicación); los demás paquetes se activan según lo que el cliente contrate.
   Quien registra la contratación es siempre el consultor: adjuntar o referenciar un contrato es el respaldo de esa decisión,
   no un interruptor automático. El cliente solo puede PEDIR avanzar («Quiero avanzar»); no activa nada.
   Los paquetes, sus contenidos y los hitos salen del sitio de AlignData y del resumen de condiciones comerciales v1.0 (el contrato prevalece). */

const SRV_V = '1.0';
const SRV_ORD = ['inicia', 'evalua', 'acompana', 'implementa'];
const SRV_P = {
  inicia: {
    n: 'D360° Inicia', tag: 'Evaluación base', nivel: 1,
    incl: ['Diagnóstico por dimensiones y dashboard ejecutivo de madurez', 'Informe ejecutivo y detallado', 'Plan de adecuación a 3 a 12 meses (hoja de ruta)', 'Presentación a la gerencia'],
    hitos: [['anticipo', 'Aceptación formal o contrato firmado, y anticipo confirmado'], ['kickoff', 'Reunión de inicio (kick-off) realizada'], ['dashboard', 'Dashboard de madurez entregado'], ['informe', 'Informe final y presentación a la gerencia entregados']]
  },
  evalua: {
    n: 'D360° Evalúa', tag: 'Análisis profundo', nivel: 2,
    incl: ['Todo lo del D360° Inicia', 'Inventario de sistemas y tratamientos', 'Mapeo de flujos y silos de datos', 'Revisión de contratos con terceros', 'DPIA preliminar y hoja de ruta priorizada con el detalle de sus sistemas'],
    hitos: [['anticipo', 'Aceptación formal o contrato firmado, y anticipo confirmado'], ['inventario', 'Inventario de sistemas, mapeo de flujos y borrador de hallazgos entregados'], ['informe', 'Informe final, hoja de ruta ejecutiva y presentación a la gerencia entregados']]
  },
  combo: {
    n: 'Combo D360° Inicia + Evalúa', tag: 'Un solo inicio y una sola presentación final', nivel: 2,
    incl: ['Todo lo del D360° Inicia y del D360° Evalúa', 'Un solo kick-off y entregables unificados'],
    hitos: [['anticipo', 'Aceptación formal o contrato firmado, y anticipo confirmado'], ['dashboard', 'Dashboard de madurez y puntuación por dimensión entregados'], ['inventario', 'Inventario de sistemas y mapeo de flujos entregados'], ['cierre', 'Presentación final a la gerencia y acta de cierre entregadas']]
  },
  acompana: {
    n: 'D360° Acompaña', tag: 'Ejecución guiada', nivel: 3,
    incl: ['Consultor dedicado que acompaña la implementación por sprints', 'Asesoría legal, técnica y de integraciones', 'PMO y revisión quincenal', 'Alcance según el D360° Evalúa (mínimo 3 meses)'],
    hitos: [['inicio', 'Contrato firmado y primer mes facturado'], ['mes3', 'Mínimo de 3 meses cumplido']]
  },
  implementa: {
    n: 'D360° Implementa', tag: 'Implementación total', nivel: 4,
    incl: ['Implementación técnica en sus sistemas', 'Portal ARCOP y panel del delegado de datos en producción', 'Adecuación completa de contratos', 'Capacitación del equipo', 'Requiere D360° Evalúa aprobado'],
    hitos: [['aceptacion', 'D360° Evalúa aprobado y contrato firmado'], ['hitos', 'Hitos verificables acordados cumplidos'], ['cierre', 'Implementación cerrada y aceptada']]
  }
};
const SRV_E = { propuesta: 'Propuesta enviada', aceptada: 'Aceptada: contrato o aceptación formal', activa: 'Activa', entregada: 'Entregada' };
const SRV_ACT = ['activa', 'entregada'];
const SRV_SOLICITABLES = ['evalua', 'acompana', 'implementa'];
const SRV_URL = /^https:\/\/[^\s"'<>]{4,290}$/;

// Normaliza lo que viene de la base de datos o de un enlace publicado: nunca se confía en su forma.
function srvLimpio(x) {
  if (!x || typeof x !== 'object' || !SRV_P[x.paquete]) return null;
  const est = SRV_E[x.estado] ? x.estado : 'propuesta', hs = {}, vistos = new Set(SRV_P[x.paquete].hitos.map((h) => h[0]));
  for (const [k, v] of Object.entries(x.hitos && typeof x.hitos === 'object' ? x.hitos : {})) if (vistos.has(k) && Number.isFinite(+v) && +v > 0) hs[k] = +v;
  const ref = x.ref && typeof x.ref === 'object' ? x.ref : {};
  return {
    paquete: x.paquete, estado: est,
    ref: { n: String(ref.n || '').slice(0, 80), u: SRV_URL.test(String(ref.u || '')) ? String(ref.u) : '' },
    hitos: hs, por: String(x.por || '').slice(0, 80), en: Number.isFinite(+x.en) ? +x.en : 0
  };
}
// Lo que ve el cliente en el enlace de resultados: solo el paquete y el estado.
function srvPublico(srv) { return srv && SRV_P[srv.paquete] ? { paquete: srv.paquete, estado: SRV_E[srv.estado] ? srv.estado : 'propuesta' } : null; }
const srvActivo = (srv) => !!(srv && SRV_ACT.includes(srv.estado));

// Qué paquetes ya tiene el cliente. El D360° Inicia siempre (es esta evaluación); Acompaña e Implementa suponen un Evalúa aprobado.
function srvIncluidos(srv) {
  const inc = new Set(['inicia']);
  if (!srvActivo(srv)) return inc;
  if (srv.paquete === 'evalua' || srv.paquete === 'combo') inc.add('evalua');
  if (srv.paquete === 'acompana') { inc.add('evalua'); inc.add('acompana'); }
  if (srv.paquete === 'implementa') { inc.add('evalua'); inc.add('implementa'); }
  return inc;
}
// Estado de cada paquete para el cliente: incluido, activo, entregado, aceptado, propuesta, disponible o requiere
function srvEstadoDe(srv, p) {
  if (p === 'inicia') return srv && srv.paquete === 'inicia' && srv.estado === 'entregada' ? 'entregado' : 'incluido';
  const inc = srvIncluidos(srv);
  if (inc.has(p)) return srv && srv.paquete === p && srv.estado === 'entregada' ? 'entregado' : 'activo';
  const propio = srv && (srv.paquete === p || (p === 'evalua' && srv.paquete === 'combo'));
  if (propio && srv.estado === 'aceptada') return 'aceptado';
  if (propio && srv.estado === 'propuesta') return 'propuesta';
  if ((p === 'acompana' || p === 'implementa') && !inc.has('evalua')) return 'requiere';
  return 'disponible';
}
// Nivel que el cliente tiene activo (1 a 4)
function srvNivel(srv) { const inc = srvIncluidos(srv); let n = 1; for (const p of inc) n = Math.max(n, SRV_P[p].nivel); return n; }
const SRV_PILL = { incluido: 'Incluido', entregado: 'Entregado', activo: 'Activo', aceptado: 'Aceptado, por iniciar', propuesta: 'En propuesta', disponible: 'Disponible', requiere: 'Requiere D360° Evalúa' };
function srvEtiqueta(x) { const s = srvLimpio(x); return s ? SRV_P[s.paquete].n + ' · ' + SRV_E[s.estado].split(':')[0] : ''; }

// ── días hábiles (de lunes a viernes; no considera feriados) ──
function diasHabilesDespues(ms, n) { const d = new Date(ms); d.setHours(12, 0, 0, 0); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) k++; } return d.getTime(); }
function diasHabilesEntre(desde, hasta) { const a = new Date(desde), b = new Date(hasta); a.setHours(12, 0, 0, 0); b.setHours(12, 0, 0, 0); let n = 0; while (a < b) { a.setDate(a.getDate() + 1); const w = a.getDay(); if (w !== 0 && w !== 6) n++; } return n; }
// Las condiciones comerciales dan un descuento al Combo si el anticipo del Evalúa se paga dentro de 5 días hábiles de entregado el informe del Inicia
function srvVentana(srv, ahora) {
  if (!srv || srv.paquete !== 'inicia' || !srv.hitos || !srv.hitos.informe) return null;
  ahora = ahora || Date.now();
  const limite = diasHabilesDespues(srv.hitos.informe, 5), vencida = new Date(ahora).setHours(12, 0, 0, 0) > limite;
  return { desde: srv.hitos.informe, limite, vencida, restan: vencida ? 0 : diasHabilesEntre(ahora, limite) };
}

// ── pantalla: pestaña «Servicio» (la ven el cliente y el consultor) ──
const srvF = (ms) => fchd(new Date(ms));
function srvTarjeta(srv, p, rol, enviadas) {
  const P = SRV_P[p], es = srvEstadoDe(srv, p), sol = SRV_SOLICITABLES.includes(p) && es === 'disponible' && rol === 'cliente';
  const ya = enviadas && enviadas.includes(p);
  return `<li class="srv-c srv-${es}"><div class="srv-cab"><h4>${esc(P.n)}</h4><span class="srv-pill srv-pill-${es}">${SRV_PILL[es]}</span></div><p class="srv-tag">${esc(P.tag)}</p><ul class="srv-incl">${P.incl.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${sol ? (ya ? '<p class="srv-ok" role="status"><i data-lucide="circle-check"></i> Solicitud enviada. Su consultor se pondrá en contacto.</p>' : `<button type="button" class="be be-p srv-btn" onclick="srvQuiero('${p}')"><i data-lucide="arrow-right-circle"></i>${p === 'evalua' ? 'Quiero avanzar con este servicio' : 'Quiero conversarlo'}</button>`) : ''}</li>`;
}
function srvPanelHtml(e, rol) {
  const srv = e.srv, inc = srvIncluidos(srv), nv = srvNivel(srv), env = (typeof window !== 'undefined' && window.srvEnviadas) || [];
  const cab = `<h3><div class="ic lv3"><i data-lucide="handshake"></i></div>Su servicio</h3>`;
  const pre = rol === 'cliente'
    ? `<p class="lead">El <strong>D360° Inicia</strong> es el punto de partida: el diagnóstico y el plan de adecuación. Los demás servicios se activan según lo que su organización decida contratar.</p>`
    : `<p class="lead">Lo que ve el cliente en su enlace de resultados. Se actualiza al <strong>actualizar los resultados publicados</strong>.</p><p><button type="button" class="be be-p" onclick="srvDlg()"><i data-lucide="settings-2"></i>Gestionar el servicio contratado</button></p>`;
  const act = srv && SRV_P[srv.paquete] ? `<p class="srv-now" role="status">Servicio registrado: <strong>${esc(SRV_P[srv.paquete].n)}</strong> · ${esc(SRV_E[srv.estado])}. Nivel activo: <strong>${nv} de 4</strong>.</p>` : `<p class="srv-now" role="status">Este diagnóstico corresponde al <strong>D360° Inicia</strong>. Nivel activo: <strong>1 de 4</strong>.</p>`;
  const sols = rol === 'auditor' && window.srvSol && window.srvSol.length ? `<div class="srv-sol"><h4>Solicitudes del cliente</h4><ul>${window.srvSol.map((s) => `<li><strong>${esc(s.nombre)}</strong>${s.cargo ? ' · ' + esc(s.cargo) : ''} pidió avanzar con <strong>${esc((SRV_P[s.paquete] || {}).n || s.paquete)}</strong> el ${srvF(+s.creadoEn)}</li>`).join('')}</ul></div>` : '';
  return `<div class="rs">${cab}${pre}${act}${sols}<ol class="srv-lista">${SRV_ORD.map((p) => srvTarjeta(srv, p, rol, env)).join('')}</ol><p class="met-n">Los contenidos son los de la oferta de AlignData. El detalle, los plazos y las condiciones constan en el contrato. Algunas funciones de los servicios Evalúa, Acompaña e Implementa se entregan fuera de esta aplicación.</p></div>`;
}

// ── consultor: ventana para registrar la contratación ──
const srvDia = (ms) => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function srvHitosHtml(p, hs) {
  if (!SRV_P[p]) return '';
  return `<fieldset class="srv-hitos"><legend>Hitos</legend>${SRV_P[p].hitos.map(([k, t]) => `<div class="srv-hito"><label for="srv-h-${k}"><input type="checkbox" id="srv-h-${k}"${hs[k] ? ' checked' : ''} onchange="srvHito('${k}')"> ${esc(t)}</label><input type="date" id="srv-hd-${k}" aria-label="Fecha: ${esc(t)}" value="${hs[k] ? srvDia(hs[k]) : ''}"${hs[k] ? '' : ' disabled'}></div>`).join('')}</fieldset>`;
}
function srvVentanaHtml(srv) {
  const v = srvVentana(srv);
  if (!v) return '';
  return `<p class="${v.vencida ? 'dlg-warn' : 'dlg-ok'}" role="status"><i data-lucide="${v.vencida ? 'clock' : 'calendar-clock'}"></i>Descuento del Combo: el anticipo del D360° Evalúa debe pagarse hasta el <strong>${srvF(v.limite)}</strong> (5 días hábiles desde la entrega del informe del Inicia; no considera feriados). ${v.vencida ? 'El plazo venció.' : v.restan === 0 ? 'Vence hoy.' : 'Quedan ' + v.restan + ' días hábiles.'}</p>`;
}
function srvRender() {
  const cuerpo = document.getElementById('srv-slot'); if (!cuerpo) return;
  const s = en.srv || { paquete: '', estado: 'propuesta', ref: { n: '', u: '' }, hitos: {} };
  cuerpo.innerHTML = `<form id="srv-f" onsubmit="srvGuardar();return false">
<p class="srv-ay">Registre la decisión del cliente. El contrato queda en su Drive: aquí solo se guarda la referencia. Adjuntar o enlazar un contrato respalda la decisión, pero <strong>no activa nada por sí solo</strong>.</p>
<div class="srv-fila"><div class="fg"><label for="srv-p">Paquete contratado</label><select id="srv-p" onchange="srvCambio()"><option value="">Sin registrar (solo el diagnóstico)</option>${Object.keys(SRV_P).map((k) => `<option value="${k}"${s.paquete === k ? ' selected' : ''}>${esc(SRV_P[k].n)}</option>`).join('')}</select></div>
<div class="fg"><label for="srv-e">Estado</label><select id="srv-e">${Object.keys(SRV_E).map((k) => `<option value="${k}"${s.estado === k ? ' selected' : ''}>${esc(SRV_E[k])}</option>`).join('')}</select></div></div>
<div class="fg"><label for="srv-rn">Contrato o aceptación (referencia)</label><input id="srv-rn" maxlength="80" autocomplete="off" placeholder="Ej: Propuesta 2026-014 aceptada por correo el 20-10" value="${esc(s.ref.n)}"></div>
<div class="fg"><label for="srv-ru">Enlace al documento <span class="opc">(opcional, https)</span></label><input id="srv-ru" type="url" maxlength="300" autocomplete="off" placeholder="https://drive.google.com/…" value="${esc(s.ref.u)}"></div>
<div id="srv-hs">${srvHitosHtml(s.paquete, s.hitos || {})}</div>
<div id="srv-vn">${srvVentanaHtml(en.srv)}</div>
<p class="srv-pub">El cliente verá el paquete y su estado cuando usted <strong>actualice los resultados publicados</strong>.${en.srv && en.srv.por ? ' Último registro: ' + esc(en.srv.por) + (en.srv.en ? ', ' + srvF(en.srv.en) : '') + '.' : ''}</p>
<div id="srv-er" class="dlg-warn" role="alert" hidden></div>
<div class="dlg-act"><button type="submit" class="be be-p"><i data-lucide="save"></i>Guardar</button><button type="button" class="be" onclick="document.getElementById('dlg-srv').close()">Cerrar</button></div></form>`;
  if (window.lucide) lucide.createIcons();
}
function srvCambio() {
  const p = document.getElementById('srv-p').value, hs = (en.srv && en.srv.paquete === p && en.srv.hitos) || {};
  document.getElementById('srv-hs').innerHTML = srvHitosHtml(p, hs);
}
function srvHito(k) {
  const c = document.getElementById('srv-h-' + k), d = document.getElementById('srv-hd-' + k);
  if (!c || !d) return;
  d.disabled = !c.checked; d.value = c.checked ? (d.value || srvDia(Date.now())) : '';
}
function srvGuardar() {
  if (typeof en === 'undefined' || en.ro || !en.sid) return;
  const p = document.getElementById('srv-p').value, er = document.getElementById('srv-er');
  const u = document.getElementById('srv-ru').value.trim();
  if (u && !SRV_URL.test(u)) { er.textContent = 'El enlace debe empezar con https:// y no tener espacios.'; er.hidden = false; document.getElementById('srv-ru').focus(); return; }
  er.hidden = true;
  if (!p) { en.srv = null; en.sv(); srvRender(); return; }
  const hitos = {};
  for (const [k] of SRV_P[p].hitos) { const c = document.getElementById('srv-h-' + k), d = document.getElementById('srv-hd-' + k); if (c && c.checked) { const t = d && d.value ? new Date(d.value + 'T12:00:00').getTime() : Date.now(); if (Number.isFinite(t)) hitos[k] = t; } }
  const us = window.pzUsuario ? window.pzUsuario() : null;
  en.srv = srvLimpio({ paquete: p, estado: document.getElementById('srv-e').value, ref: { n: document.getElementById('srv-rn').value.trim(), u }, hitos, por: us ? (us.nombre || us.email || '') : '', en: Date.now() });
  en.sv(); srvRender();
  const sl = document.getElementById('srv-f'); if (sl) sl.insertAdjacentHTML('afterbegin', '<p class="dlg-ok" role="status"><i data-lucide="circle-check"></i>Guardado.</p>');
  if (window.lucide) lucide.createIcons();
}
function srvDlg() {
  if (typeof en === 'undefined' || !en.sid || en.ro) return;
  const d = document.getElementById('dlg-srv'); if (!d) return;
  srvRender(); if (!d.open) d.showModal();
}

// ── cliente: pedir avanzar (no activa nada: avisa al consultor) ──
window.srvEnviadas = [];
async function srvQuiero(p) {
  if (!SRV_SOLICITABLES.includes(p) || !window.srvCtx) return;
  const c = window.srvCtx();
  if (!c || !c.N || !c.N.solicitar || !c.tk) return;
  if (window.PZ && PZ.pedirPersona) await PZ.pedirPersona();
  const per = (window.PZ && PZ.persona) || {};
  if (!per.n) return;
  try { await c.N.solicitar(c.tk, { paquete: p, nombre: per.n, cargo: per.c || '' }); }
  catch (e) { const l = document.querySelector('#t10 .srv-lista'); if (l) l.insertAdjacentHTML('beforebegin', '<p class="dlg-warn" role="alert">No se pudo enviar la solicitud. Intente de nuevo o escríbanos desde aligndata.cl.</p>'); return; }
  window.srvEnviadas = window.srvEnviadas.concat([p]);
  const t = document.getElementById('t10'); if (t) { t.innerHTML = srvPanelHtml(en, 'cliente'); if (window.lucide) lucide.createIcons(); }
}

// ── consultor: solicitudes que llegaron del cliente, mientras la sesión tiene un enlace publicado ──
window.srvSol = [];
(function () {
  let tk = null, off = null;
  const vigilar = () => {
    const c = window.srvCtx ? window.srvCtx() : null, nuevo = c && c.N && c.N.solicitudesEscuchar && typeof modo !== 'undefined' && modo === 'auditor' ? c.tk || null : null;
    if (nuevo === tk) return;
    if (off) { off(); off = null; }
    tk = nuevo; window.srvSol = [];
    if (tk) off = c.N.solicitudesEscuchar(tk, (l) => { window.srvSol = l; if (window.sbActualizar) window.sbActualizar(); const t = document.getElementById('t10'); if (t && typeof en !== 'undefined' && modo === 'auditor') { t.innerHTML = srvPanelHtml(en, 'auditor'); if (window.lucide) lucide.createIcons(); } });
  };
  if (typeof setInterval === 'function') setInterval(vigilar, 3000);
})();
