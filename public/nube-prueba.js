/* Modo de prueba: misma interfaz que nube.js pero guardando todo en el navegador (localStorage), sin Firebase.
   Se usa en localhost con ?mock=1 y, mientras firebase-config.js tenga «prueba: true», en el sitio publicado
   con el botón «Probar sin cuenta». Los datos NO salen de este navegador. */
const K = 'd360mock';
const leerTodo = () => { try { return JSON.parse(localStorage.getItem(K)) || { sesiones: {}, compartidos: {}, sesion: null }; } catch (e) { return { sesiones: {}, compartidos: {}, sesion: null }; } };
const guardarTodo = (d) => { localStorage.setItem(K, JSON.stringify(d)); oyentes.forEach((f) => f()); };
const aviso = (estado) => window.dispatchEvent(new CustomEvent('nube:estado', { detail: { estado } }));
const oyentes = new Set();
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
