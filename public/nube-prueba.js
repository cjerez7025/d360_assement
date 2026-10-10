/* Modo de prueba: misma interfaz que nube.js pero guardando todo en el navegador (localStorage), sin Firebase.
   Se usa en localhost con ?mock=1 y, mientras firebase-config.js tenga «prueba: true», en el sitio publicado
   con el botón «Probar sin cuenta». Los datos NO salen de este navegador. */
const K = 'd360mock';
const vacio = () => ({ sesiones: {}, compartidos: {}, vivo: {}, sesion: null });
const leerTodo = () => { try { return { ...vacio(), ...(JSON.parse(localStorage.getItem(K)) || {}) }; } catch (e) { return vacio(); } };
const guardarTodo = (d) => { localStorage.setItem(K, JSON.stringify(d)); oyentes.forEach((f) => f()); };
const aviso = (estado) => window.dispatchEvent(new CustomEvent('nube:estado', { detail: { estado } }));
const oyentes = new Set();
// otra pestaña del mismo navegador escribió: se avisa a quienes escuchan (así se prueba la reunión en vivo con dos pestañas)
window.addEventListener('storage', (e) => { if (e.key === K) oyentes.forEach((f) => f()); });
let cbUsuario = null;
const USUARIO = { uid: 'prueba-1', email: 'modo prueba (este navegador)', nombre: 'Modo de prueba' };

export function iniciar() {}
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
  pend = { sid: en.sid, datos: { respuestas: { ...en.a }, notas: { ...en.n }, avance: r.avance, hechas: r.hechas, total: r.total, puntaje: r.puntaje, nivel: r.nivel, estado: r.completa ? 'completa' : 'en_curso' } };
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
export async function vivoCerrar(sid, tk) { const d = leerTodo(); delete d.vivo[tk]; if (d.sesiones[sid]) d.sesiones[sid].vivo = null; guardarTodo(d); }
