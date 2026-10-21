/* Modo de prueba: misma interfaz que nube.js pero guardando todo en el navegador (localStorage), sin Firebase.
   Se usa en localhost con ?mock=1 y, mientras firebase-config.js tenga «prueba: true», en el sitio publicado
   con el botón «Probar sin cuenta». Los datos NO salen de este navegador. */
const K = 'd360mock';
const vacio = () => ({ sesiones: {}, compartidos: {}, vivo: {}, sesion: null, pz: { ses: {}, vivo: {}, comp: {} } });
const leerTodo = () => { try { return { ...vacio(), ...(JSON.parse(localStorage.getItem(K)) || {}) }; } catch (e) { return vacio(); } };
const guardarTodo = (d) => {
  try { localStorage.setItem(K, JSON.stringify(d)); }
  catch (e) { const x = new Error('almacenamiento lleno'); x.code = 'resource-exhausted'; throw x; } // las imágenes de la pizarra ocupan lugar
  oyentes.forEach((f) => f());
};
const aviso = (estado) => window.dispatchEvent(new CustomEvent('nube:estado', { detail: { estado } }));
const oyentes = new Set();
// otra pestaña del mismo navegador escribió: se avisa a quienes escuchan (así se prueba la reunión en vivo con dos pestañas)
window.addEventListener('storage', (e) => { if (e.key === K) oyentes.forEach((f) => f()); });
let cbUsuario = null;
// con ?yo=correo en la guía previa se simula a una persona del cliente (sin ?yo= se actúa como consultor)
const YO = (() => { try { return (new URLSearchParams(location.search).get('yo') || '').trim().toLowerCase(); } catch (e) { return ''; } })();
const USUARIO = YO ? { uid: 'prueba-yo', email: YO, nombre: YO, foto: null } : { uid: 'prueba-1', email: 'modo prueba (este navegador)', nombre: 'Modo de prueba', foto: null };

export function iniciar() {}
// ── guía previa: acceso privado por lista de correos autorizados (misma interfaz que nube.js) ──
export async function guiaMiAcceso(email) {
  if (!YO) return { ok: true, rol: 'consultor', n: '', e: '' };
  const x = (leerTodo().guiaAcceso || {})[String(email).trim().toLowerCase()];
  return x ? { ok: true, rol: 'invitado', n: x.n || '', e: x.e || '' } : { ok: false };
}
export async function guiaSalir() { try { localStorage.removeItem('d360mock_yo'); } catch (e) { /* sin almacenamiento */ } cbUsuario && cbUsuario(null); }
export function guiaAccesoEscuchar(cb) {
  let ultimo = null;
  const emitir = () => { const g = leerTodo().guiaAcceso || {}, lst = Object.entries(g).map(([correo, x]) => ({ correo, ...x })).sort((a, b) => a.n.localeCompare(b.n, 'es')), txt = JSON.stringify(lst); if (txt !== ultimo) { ultimo = txt; cb(lst); } };
  oyentes.add(emitir); emitir();
  return () => oyentes.delete(emitir);
}
export async function guiaAccesoAgregar({ correo, n, e }) { const d = leerTodo(); d.guiaAcceso = { ...(d.guiaAcceso || {}), [String(correo).trim().toLowerCase()]: { n: String(n).trim().slice(0, 80), e: e ? String(e).trim().slice(0, 80) : '', por: USUARIO.email, t: Date.now() } }; guardarTodo(d); }
export async function guiaAccesoQuitar(correo) { const d = leerTodo(); if (d.guiaAcceso) { delete d.guiaAcceso[String(correo).trim().toLowerCase()]; guardarTodo(d); } }
export function alCambiarUsuario(cb) { cbUsuario = cb; setTimeout(() => cb(USUARIO), 0); return () => {}; }
export async function ingresar() { const d = leerTodo(); d.sesion = USUARIO.uid; guardarTodo(d); cbUsuario(USUARIO); }
export async function resultadoRedireccion() { return null; }
export async function salir() { const d = leerTodo(); d.sesion = null; guardarTodo(d); }

export function escucharSesiones(cb) {
  const emitir = () => cb(Object.entries(leerTodo().sesiones).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.actualizadoEn - a.actualizadoEn));
  oyentes.add(emitir); emitir();
  return () => oyentes.delete(emitir);
}
export function crear(perfil) {
  const id = 'mock' + Math.random().toString(36).slice(2, 10);
  const d = leerTodo(), ahora = Date.now();
  d.sesiones[id] = { perfil, respuestas: {}, notas: {}, estado: 'en_curso', avance: 0, hechas: 0, total: 0, puntaje: null, nivel: null, version: 'd360v3', compartido: null, creadoPor: USUARIO, creadoEn: ahora, actualizadoEn: ahora, actualizadoPor: USUARIO.email };
  guardarTodo(d); return id;
}
export async function leer(id) { const s = leerTodo().sesiones[id]; return s ? { id, ...s } : null; }
let tmr = null, pend = null;
export function guardar(en) {
  const r = en.res();
  pend = { sid: en.sid, datos: { respuestas: { ...en.a }, notas: { ...en.n }, revisiones: [...(en.rv || [])], servicio: en.srv || null, tareas: en.tar && en.tar.length ? en.tar : null, avance: r.avance, hechas: r.hechas, total: r.total, puntaje: r.puntaje, nivel: r.nivel, estado: r.completa ? 'completa' : 'en_curso' } };
  aviso('guardando'); clearTimeout(tmr); tmr = setTimeout(vaciar, 500);
}
function vaciar() {
  if (!pend) return; const { sid, datos } = pend; pend = null;
  const d = leerTodo(); if (!d.sesiones[sid]) return;
  Object.assign(d.sesiones[sid], datos, { actualizadoEn: Date.now(), actualizadoPor: USUARIO.email });
  guardarTodo(d); aviso('guardado');
}
export async function vaciarYa() { clearTimeout(tmr); vaciar(); }
export async function compartir(sid, pub, token) {
  const tk = (token && token.length === 32) ? token : Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[b % 64]).join('');
  const d = leerTodo(), ahora = Date.now();
  d.compartidos[tk] = { ...pub, publicadoEn: ahora, version: 'd360v3' };
  d.sesiones[sid].compartido = { token: tk, en: ahora };
  guardarTodo(d); return tk;
}
export async function revocar(sid, token) {
  const d = leerTodo(); delete d.compartidos[token]; if (d.sesiones[sid]) d.sesiones[sid].compartido = null; guardarTodo(d);
}
export async function leerCompartido(token) { return leerTodo().compartidos[token] || null; }

// ── reunión en vivo (simulada) ──
const tokenNuevo = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[b % 64]).join('');
export async function vivoCrear(sid, datos, horas = 12) {
  const tk = tokenNuevo(), vence = Date.now() + horas * 3600e3, d = leerTodo();
  d.vivo[tk] = { ...datos, propuestas: {}, activo: true, creadoEn: Date.now(), actualizadoEn: Date.now(), venceEn: vence };
  if (d.sesiones[sid]) d.sesiones[sid].vivo = { token: tk, venceEn: vence };
  guardarTodo(d); return { token: tk, venceEn: vence };
}
export function vivoEmpujar(tk, parcial) {
  const d = leerTodo(); if (!d.vivo[tk]) return;
  Object.assign(d.vivo[tk], parcial, { actualizadoEn: Date.now() }); guardarTodo(d);
}
export function vivoEscuchar(tk, cb) {
  let ultimo = null;
  const emitir = () => { const doc = leerTodo().vivo[tk] || null, txt = JSON.stringify(doc); if (txt !== ultimo) { ultimo = txt; cb(doc); } };
  oyentes.add(emitir); emitir();
  return () => oyentes.delete(emitir);
}
export async function vivoProponer(tk, qid, v) {
  const d = leerTodo(); if (!d.vivo[tk]) throw new Error('enlace cerrado');
  d.vivo[tk].propuestas = { ...d.vivo[tk].propuestas, [qid]: v }; d.vivo[tk].clienteVisto = Date.now(); guardarTodo(d);
}
export async function vivoLatido(tk) { const d = leerTodo(); if (d.vivo[tk]) { d.vivo[tk].clienteVisto = Date.now(); guardarTodo(d); } }
export async function vivoPresente(tk, pid, persona) { const d = leerTodo(); if (!d.vivo[tk]) return; d.vivo[tk].presentes = { ...(d.vivo[tk].presentes || {}), [pid]: { n: persona.n, c: persona.c || '', t: Date.now() } }; guardarTodo(d); }
export function vivoPresentes(tk, cb) {
  let ultimo = null;
  const emitir = () => { const p = (leerTodo().vivo[tk] || {}).presentes || {}, lst = Object.entries(p).map(([id, x]) => ({ id, ...x })), txt = JSON.stringify(lst); if (txt !== ultimo) { ultimo = txt; cb(lst); } };
  oyentes.add(emitir); emitir();
  return () => oyentes.delete(emitir);
}
export async function vivoPresentesLimpiar(tk) { const d = leerTodo(); if (d.vivo[tk]) { d.vivo[tk].presentes = {}; guardarTodo(d); } }
// Escritura en vivo (misma interfaz que nube.js): el borrador de lo que alguien escribe en la pizarra
export async function pzEscribiendo(tk, pid, dato) { const d = leerTodo(); if (!d.vivo[tk]) return; d.vivo[tk].escribiendo = { ...(d.vivo[tk].escribiendo || {}), [pid]: { a: dato.a, r: dato.r, c: dato.c || '', q: dato.q, x: dato.x, t: Date.now() } }; guardarTodo(d); }
export async function pzEscribiendoQuitar(tk, pid) { const d = leerTodo(); if (d.vivo[tk] && d.vivo[tk].escribiendo) { delete d.vivo[tk].escribiendo[pid]; guardarTodo(d); } }
export function pzEscribiendoEscuchar(tk, cb) {
  let ultimo = null;
  const emitir = () => { const p = (leerTodo().vivo[tk] || {}).escribiendo || {}, lst = Object.entries(p).map(([id, x]) => ({ id, ...x })), txt = JSON.stringify(lst); if (txt !== ultimo) { ultimo = txt; cb(lst); } };
  oyentes.add(emitir); emitir();
  return () => oyentes.delete(emitir);
}
export async function pzEscribiendoLimpiar(tk) { const d = leerTodo(); if (d.vivo[tk]) { d.vivo[tk].escribiendo = {}; guardarTodo(d); } }
export async function vivoCerrar(sid, tk) { const d = leerTodo(); delete d.vivo[tk]; if (d.sesiones[sid]) d.sesiones[sid].vivo = null; guardarTodo(d); }

// ── pizarra compartida (simulada): misma interfaz que nube.js; ses = registro de la sesión, vivo = reunión, comp = publicada ──
const pzD = (d) => { d.pz = d.pz || { ses: {}, vivo: {}, comp: {} }; for (const k of ['ses', 'vivo', 'comp', 'partes']) d.pz[k] = d.pz[k] || {}; return d.pz; };
const kParte = (amb, k, eid, pid) => amb + ':' + k + ':' + eid + ':' + pid;
const idsPartes = (e) => (e.adjuntos || []).flatMap((a, i) => Array.from({ length: Math.min(+a.p || 0, 10) }, (_, k) => i + '_' + k));
const quitarPartes = (p, amb, k, e) => idsPartes(e).forEach((pid) => { delete p.partes[kParte(amb, k, e.id, pid)]; });
export async function pzSubirParte(amb, k, eid, pid, datos) { const d = leerTodo(); pzD(d).partes[kParte(amb, k, eid, pid)] = datos; guardarTodo(d); }
export async function pzLeerParte(amb, k, eid, pid) { const v = pzD(leerTodo()).partes[kParte(amb, k, eid, pid)]; if (v == null) throw new Error('parte faltante'); return v; }
export async function pzCopiarPartes(de, a, e) { for (const pid of idsPartes(e)) await pzSubirParte(a[0], a[1], e.id, pid, await pzLeerParte(de[0], de[1], e.id, pid)); }
const ordenadas = (o) => Object.values(o || {}).sort((a, b) => a.creadoEn - b.creadoEn);
const copia = (e, t) => { const { id, ...r } = e; return { ...r, id, creadoEn: t }; };
function escucharPz(sel, cb) {
  let ultimo = null;
  const emitir = () => { const l = ordenadas(sel(pzD(leerTodo()))), txt = l.map((x) => x.id).join(','); if (txt !== ultimo) { ultimo = txt; cb(l); } };
  oyentes.add(emitir); emitir();
  return () => oyentes.delete(emitir);
}
export const pzEscuchar = (sid, cb) => escucharPz((p) => p.ses[sid], cb);
export async function pzLeer(sid) { return ordenadas(pzD(leerTodo()).ses[sid]); }
export async function pzGuardar(sid, e, vivoTk) {
  const d = leerTodo(), p = pzD(d), t = Date.now();
  (p.ses[sid] = p.ses[sid] || {})[e.id] = copia(e, t);
  if (vivoTk && d.vivo[vivoTk]) (p.vivo[vivoTk] = p.vivo[vivoTk] || {})[e.id] = copia(e, t);
  guardarTodo(d);
}
export async function pzEspejar(sid, e) { const d = leerTodo(), p = pzD(d); (p.ses[sid] = p.ses[sid] || {})[e.id] = copia(e, e.creadoEn); guardarTodo(d); }
export async function pzBorrar(sid, e, vivoTk) {
  const d = leerTodo(), p = pzD(d);
  if (p.ses[sid]) delete p.ses[sid][e.id];
  if (vivoTk && p.vivo[vivoTk]) delete p.vivo[vivoTk][e.id];
  quitarPartes(p, 'ses', sid, e); if (vivoTk) quitarPartes(p, 'vivo', vivoTk, e);
  guardarTodo(d);
}
export const pzVivoEscuchar = (tk, cb) => escucharPz((p) => p.vivo[tk], cb);
export async function pzVivoLeer(tk) { return ordenadas(pzD(leerTodo()).vivo[tk]); }
export async function pzVivoGuardar(tk, e) {
  const d = leerTodo(); if (!d.vivo[tk]) throw new Error('enlace cerrado');
  (pzD(d).vivo[tk] = pzD(d).vivo[tk] || {})[e.id] = copia(e, Date.now()); guardarTodo(d);
}
export async function pzVivoLimpiar(tk) { const d = leerTodo(), p = pzD(d); Object.values(p.vivo[tk] || {}).forEach((e) => quitarPartes(p, 'vivo', tk, e)); delete p.vivo[tk]; guardarTodo(d); }
export async function pzLeerCompartido(tk) { return ordenadas(pzD(leerTodo()).comp[tk]); }
export async function pzPublicar(tk, entradas, sid) {
  const d = leerTodo(), p = pzD(d);
  Object.values(p.comp[tk] || {}).forEach((e) => quitarPartes(p, 'comp', tk, e)); p.comp[tk] = {};
  for (const e of entradas) {
    p.comp[tk][e.id] = copia(e, e.creadoEn);
    idsPartes(e).forEach((pid) => { const v = p.partes[kParte('ses', sid, e.id, pid)]; if (v != null) p.partes[kParte('comp', tk, e.id, pid)] = v; });
  }
  guardarTodo(d);
}
export async function pzBorrarCompartido(tk) { const d = leerTodo(), p = pzD(d); Object.values(p.comp[tk] || {}).forEach((e) => quitarPartes(p, 'comp', tk, e)); delete p.comp[tk]; guardarTodo(d); }

// ── servicio: el cliente pide avanzar (no activa nada) y el consultor recibe la solicitud ──
export async function solicitar(tk, d) {
  const x = leerTodo(); if (!x.compartidos[tk]) throw new Error('enlace cerrado');
  const id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  x.compartidos[tk].solicitudes = { ...(x.compartidos[tk].solicitudes || {}), [id]: { paquete: d.paquete, nombre: d.nombre, cargo: d.cargo || '', creadoEn: Date.now() } };
  guardarTodo(x);
}
export function solicitudesEscuchar(tk, cb) {
  let ultimo = null;
  const emitir = () => { const s = ((leerTodo().compartidos[tk] || {}).solicitudes) || {}, l = Object.entries(s).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.creadoEn - a.creadoEn), t = JSON.stringify(l); if (t !== ultimo) { ultimo = t; cb(l); } };
  oyentes.add(emitir); emitir();
  return () => oyentes.delete(emitir);
}

// ── eliminar una sesión con todo lo que depende de ella ──
export async function eliminarSesion(sid, dd) {
  const d = leerTodo(), p = pzD(d), tkC = dd && dd.compartido && dd.compartido.token, tkV = dd && dd.vivo && dd.vivo.token;
  Object.values(p.ses[sid] || {}).forEach((e) => quitarPartes(p, 'ses', sid, e)); delete p.ses[sid];
  if (tkC) { Object.values(p.comp[tkC] || {}).forEach((e) => quitarPartes(p, 'comp', tkC, e)); delete p.comp[tkC]; delete d.compartidos[tkC]; }
  if (tkV) { Object.values(p.vivo[tkV] || {}).forEach((e) => quitarPartes(p, 'vivo', tkV, e)); delete p.vivo[tkV]; delete d.vivo[tkV]; }
  delete d.sesiones[sid]; guardarTodo(d);
}
// ── el invitado sale de la reunión: se quita su presencia ──
export async function vivoSalir(tk, pid) { const d = leerTodo(); if (d.vivo[tk] && d.vivo[tk].presentes) { delete d.vivo[tk].presentes[pid]; guardarTodo(d); } }
