/* Capa de datos en la nube del D360°: Firebase Auth (Google) + Firestore, base nombrada «d360».
   Colecciones:
     sesiones/{id}      → solo consultores autorizados (ver firestore.d360.rules)
     compartidos/{token} → lectura por enlace (el token es el secreto); solo los consultores escriben
     en_vivo/{token}     → reunión en vivo
     …/pizarra/{id}     → comentarios de la pizarra compartida (al final de este archivo) */
const C = window.D360_NUBE;
const B = 'https://www.gstatic.com/firebasejs/' + (C.sdk || '10.14.1') + '/';
const [{ initializeApp }, A, F] = await Promise.all([
  import(B + 'firebase-app.js'),
  import(B + 'firebase-auth.js'),
  import(B + 'firebase-firestore.js')
]);

const app = initializeApp({ apiKey: C.apiKey, authDomain: C.authDomain, projectId: C.projectId, appId: C.appId });
let db = null, auth = null, usuario = null;

const aviso = (estado, err) => window.dispatchEvent(new CustomEvent('nube:estado', { detail: { estado, codigo: err && (err.code || err.message) } }));

/** persistente = consultor (guarda en el equipo para trabajar sin conexión); cliente = solo memoria */
export function iniciar({ persistente }) {
  db = F.initializeFirestore(app, {
    localCache: persistente ? F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) : F.memoryLocalCache()
  }, C.databaseId);
  if (persistente) auth = A.getAuth(app);
}

// ── sesión del consultor ──
export function alCambiarUsuario(cb) {
  return A.onAuthStateChanged(auth, (u) => {
    usuario = u;
    cb(u ? { uid: u.uid, email: u.email, nombre: u.displayName || u.email, foto: u.photoURL || null } : null);
  });
}
export async function ingresar() {
  const p = new A.GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  try { await A.signInWithPopup(auth, p); }
  catch (e) {
    if (e.code === 'auth/popup-blocked') return A.signInWithRedirect(auth, p);
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    throw e;
  }
}
/** Si el ingreso se hizo por redirección, devuelve el código de error (o null si fue bien o no hubo ingreso). */
export async function resultadoRedireccion() {
  try { await A.getRedirectResult(auth); return null; } catch (e) { return e.code || e.message; }
}
export async function salir() {
  await vaciarYa();
  await A.signOut(auth);
  // no dejar datos de clientes en el equipo después de cerrar sesión
  try { await F.terminate(db); await F.clearIndexedDbPersistence(db); } catch (e) { /* ya cerrado */ }
}

// ── sesiones ──
const col = () => F.collection(db, 'sesiones');
export function escucharSesiones(cb, err) {
  return F.onSnapshot(F.query(col(), F.orderBy('actualizadoEn', 'desc'), F.limit(200)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), err);
}
export function crear(perfil) {
  const ref = F.doc(col());
  F.setDoc(ref, {
    perfil, respuestas: {}, notas: {}, estado: 'en_curso', avance: 0, hechas: 0, total: 0, puntaje: null, nivel: null,
    version: 'd360v3', compartido: null,
    creadoPor: { uid: usuario && usuario.uid, email: usuario && usuario.email, nombre: usuario && (usuario.displayName || usuario.email) },
    creadoEn: F.serverTimestamp(), actualizadoEn: F.serverTimestamp(), actualizadoPor: usuario && usuario.email
  }).then(() => aviso('guardado'), (e) => aviso('error', e));
  return ref.id;
}
export async function leer(id) {
  const s = await F.getDoc(F.doc(db, 'sesiones', id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// guardado automático: junta los cambios de ~0,7 s en una sola escritura
let pend = null, tmr = null;
export function guardar(en) {
  const r = en.res();
  pend = { sid: en.sid, datos: { respuestas: { ...en.a }, notas: { ...en.n }, revisiones: [...(en.rv || [])], avance: r.avance, hechas: r.hechas, total: r.total, puntaje: r.puntaje, nivel: r.nivel, estado: r.completa ? 'completa' : 'en_curso' } };
  clearTimeout(tmr); tmr = setTimeout(vaciar, 700);
  aviso('guardando');
}
async function vaciar() {
  if (!pend) return;
  const { sid, datos } = pend; pend = null;
  aviso('guardando');
  const t = setTimeout(() => aviso('pendiente'), 4500); // sin respuesta del servidor: probablemente sin conexión
  try {
    await F.updateDoc(F.doc(db, 'sesiones', sid), { ...datos, actualizadoEn: F.serverTimestamp(), actualizadoPor: usuario && usuario.email });
    clearTimeout(t); if (!pend) aviso('guardado');
  } catch (e) { clearTimeout(t); aviso('error', e); }
}
export async function vaciarYa() { clearTimeout(tmr); await vaciar(); }

// ── enlace para el cliente ──
function nuevoToken() {
  const b = new Uint8Array(24); crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function compartir(sid, pub, token) {
  const tk = token || nuevoToken();
  await F.setDoc(F.doc(db, 'compartidos', tk), { ...pub, publicadoEn: F.serverTimestamp(), version: 'd360v3' });
  await F.updateDoc(F.doc(db, 'sesiones', sid), { compartido: { token: tk, en: F.serverTimestamp() } });
  return tk;
}
export async function revocar(sid, token) {
  await F.deleteDoc(F.doc(db, 'compartidos', token));
  await F.updateDoc(F.doc(db, 'sesiones', sid), { compartido: F.deleteField() });
}
export async function leerCompartido(token) {
  const s = await F.getDoc(F.doc(db, 'compartidos', token));
  return s.exists() ? s.data() : null;
}

// ── reunión en vivo: el cliente sigue la pregunta del consultor y propone respuestas ──
// en_vivo/{token}: lo escribe el consultor (pregunta actual, respuestas, notas); el cliente solo puede escribir
// «propuestas» y «clienteVisto» (ver firestore.d360.rules). El token es el secreto y vence a las pocas horas.
const vivoRef = (tk) => F.doc(db, 'en_vivo', tk);
export async function vivoCrear(sid, datos, horas = 12) {
  const tk = nuevoToken(), vence = Date.now() + horas * 3600e3;
  await F.setDoc(vivoRef(tk), { ...datos, propuestas: {}, activo: true, creadoEn: F.serverTimestamp(), actualizadoEn: F.serverTimestamp(), venceEn: F.Timestamp.fromMillis(vence) });
  await F.updateDoc(F.doc(db, 'sesiones', sid), { vivo: { token: tk, venceEn: vence } });
  return { token: tk, venceEn: vence };
}
let vPend = null, vTmr = null;
export function vivoEmpujar(tk, parcial) {
  vPend = { tk, parcial: { ...(vPend && vPend.tk === tk ? vPend.parcial : {}), ...parcial } };
  clearTimeout(vTmr); vTmr = setTimeout(vivoVaciar, 250);
}
async function vivoVaciar() {
  if (!vPend) return;
  const { tk, parcial } = vPend; vPend = null;
  try { await F.updateDoc(vivoRef(tk), { ...parcial, actualizadoEn: F.serverTimestamp() }); } catch (e) { /* enlace cerrado o sin conexión */ }
}
export function vivoEscuchar(tk, cb, err) {
  return F.onSnapshot(vivoRef(tk), (s) => cb(s.exists() ? s.data() : null), err);
}
export async function vivoProponer(tk, qid, v) {
  await F.updateDoc(vivoRef(tk), new F.FieldPath('propuestas', qid), v, 'clienteVisto', F.serverTimestamp());
}
export async function vivoLatido(tk) {
  try { await F.updateDoc(vivoRef(tk), 'clienteVisto', F.serverTimestamp()); } catch (e) { /* enlace cerrado */ }
}
export async function vivoCerrar(sid, tk) {
  await F.deleteDoc(vivoRef(tk));
  if (sid) await F.updateDoc(F.doc(db, 'sesiones', sid), { vivo: F.deleteField() });
}

// ── pizarra compartida: comentarios con autor e imágenes, por pregunta o generales ──
// sesiones/{sid}/pizarra/{id}    → registro permanente (solo consultores)
// en_vivo/{token}/pizarra/{id}   → durante la reunión: los integrantes agregan y todos ven
// compartidos/{token}/pizarra/{id} → copia publicada: el cliente la ve en sus resultados
// Un comentario no se edita: se crea y, el consultor, lo puede borrar. Ver firestore.d360.rules.
const rutaSes = (sid) => ['sesiones', sid, 'pizarra'];
const rutaVivo = (tk) => ['en_vivo', tk, 'pizarra'];
const rutaComp = (tk) => ['compartidos', tk, 'pizarra'];
const consulta = (ruta) => F.query(F.collection(db, ...ruta), F.orderBy('creadoEn', 'asc'));
const aEntrada = (d) => {
  const x = d.data({ serverTimestamps: 'estimate' });
  return { ...x, id: d.id, creadoEn: x.creadoEn && x.creadoEn.toMillis ? x.creadoEn.toMillis() : (x.creadoEn || Date.now()) };
};
const cuerpoPz = (e, ts) => {
  const d = { autor: e.autor, rol: e.rol, qid: e.qid, texto: e.texto || '', creadoEn: ts };
  if (e.email) d.email = e.email;
  if (e.cargo) d.cargo = e.cargo;
  if (e.foto) d.foto = e.foto;
  if (e.imgs && e.imgs.length) d.imgs = e.imgs;
  if (e.adjuntos && e.adjuntos.length) d.adjuntos = e.adjuntos.map((a) => ({ n: a.n, t: a.t || '', z: a.z, p: a.p }));
  return d;
};
const escucharPz = (ruta, cb, err) => F.onSnapshot(consulta(ruta), (s) => cb(s.docs.map(aEntrada)), err);
const leerPz = async (ruta) => (await F.getDocs(consulta(ruta))).docs.map(aEntrada);
// Documentos adjuntos: su contenido vive en pizarra/{id}/partes/{adjunto}_{parte}
const raizPz = { ses: (k) => ['sesiones', k], vivo: (k) => ['en_vivo', k], comp: (k) => ['compartidos', k] };
const rutaParte = (amb, k, eid, pid) => [...raizPz[amb](k), 'pizarra', eid, 'partes', pid];
const idsPartes = (e) => (e.adjuntos || []).flatMap((a, i) => Array.from({ length: Math.min(+a.p || 0, 10) }, (_, k) => i + '_' + k));
const borrarPartes = async (amb, k, e) => { for (const pid of idsPartes(e)) await F.deleteDoc(F.doc(db, ...rutaParte(amb, k, e.id, pid))); };
const borrarTodoPz = async (ruta) => {
  const amb = ruta[0] === 'sesiones' ? 'ses' : ruta[0] === 'en_vivo' ? 'vivo' : 'comp';
  const s = await F.getDocs(F.collection(db, ...ruta));
  for (const d of s.docs) { await borrarPartes(amb, ruta[1], { id: d.id, ...d.data() }); await F.deleteDoc(d.ref); }
};
export async function pzSubirParte(amb, k, eid, pid, datos) { await F.setDoc(F.doc(db, ...rutaParte(amb, k, eid, pid)), { d: datos }); }
export async function pzLeerParte(amb, k, eid, pid) {
  const s = await F.getDoc(F.doc(db, ...rutaParte(amb, k, eid, pid)));
  if (!s.exists()) throw new Error('parte faltante');
  return s.data().d;
}
/** Copia el contenido de los adjuntos de un comentario de un lugar a otro: de = [amb, clave], a = [amb, clave]. */
export async function pzCopiarPartes(de, a, e) {
  for (const pid of idsPartes(e)) await pzSubirParte(a[0], a[1], e.id, pid, await pzLeerParte(de[0], de[1], e.id, pid));
}

export const pzEscuchar = (sid, cb, err) => escucharPz(rutaSes(sid), cb, err);
export const pzLeer = (sid) => leerPz(rutaSes(sid));
/** Consultor: guarda en la sesión y, si hay reunión en vivo, también en la pizarra en vivo (misma hora del servidor). */
export async function pzGuardar(sid, e, vivoTk) {
  const b = F.writeBatch(db), ts = F.serverTimestamp();
  b.set(F.doc(db, ...rutaSes(sid), e.id), cuerpoPz(e, ts));
  if (vivoTk) b.set(F.doc(db, ...rutaVivo(vivoTk), e.id), cuerpoPz(e, ts));
  await b.commit();
}
/** Consultor: copia a la sesión un comentario que hizo un cliente en vivo, conservando su hora. */
export async function pzEspejar(sid, e) { await F.setDoc(F.doc(db, ...rutaSes(sid), e.id), cuerpoPz(e, F.Timestamp.fromMillis(e.creadoEn))); }
export async function pzBorrar(sid, e, vivoTk) {
  const b = F.writeBatch(db);
  b.delete(F.doc(db, ...rutaSes(sid), e.id));
  if (vivoTk) b.delete(F.doc(db, ...rutaVivo(vivoTk), e.id));
  for (const pid of idsPartes(e)) { b.delete(F.doc(db, ...rutaParte('ses', sid, e.id, pid))); if (vivoTk) b.delete(F.doc(db, ...rutaParte('vivo', vivoTk, e.id, pid))); }
  await b.commit();
}
// en vivo
export const pzVivoEscuchar = (tk, cb, err) => escucharPz(rutaVivo(tk), cb, err);
export const pzVivoLeer = (tk) => leerPz(rutaVivo(tk));
export async function pzVivoGuardar(tk, e) { await F.setDoc(F.doc(db, ...rutaVivo(tk), e.id), cuerpoPz(e, F.serverTimestamp())); }
export const pzVivoLimpiar = (tk) => borrarTodoPz(rutaVivo(tk));
// resultados publicados (los comentarios son inmutables: solo se suben los nuevos y se quitan los borrados)
export const pzLeerCompartido = (tk) => leerPz(rutaComp(tk));
export async function pzPublicar(tk, entradas, sid) {
  const publicadas = await leerPz(rutaComp(tk)), ya = new Set(publicadas.map((x) => x.id)), ids = new Set(entradas.map((x) => x.id));
  for (const e of entradas) if (!ya.has(e.id)) {
    if (e.adjuntos && e.adjuntos.length) await pzCopiarPartes(['ses', sid], ['comp', tk], e); // el contenido va antes que el comentario
    await F.setDoc(F.doc(db, ...rutaComp(tk), e.id), cuerpoPz(e, F.Timestamp.fromMillis(e.creadoEn)));
  }
  for (const x of publicadas) if (!ids.has(x.id)) { await borrarPartes('comp', tk, x); await F.deleteDoc(F.doc(db, ...rutaComp(tk), x.id)); }
}
export const pzBorrarCompartido = (tk) => borrarTodoPz(rutaComp(tk));
