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
export function iniciar({ persistente, conCuenta }) {
  db = F.initializeFirestore(app, {
    localCache: persistente ? F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) : F.memoryLocalCache()
  }, C.databaseId);
  if (persistente || conCuenta) auth = A.getAuth(app); // conCuenta: el cliente que entra a la guía previa se identifica con Google
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

// ── guía previa: acceso privado por lista de correos autorizados (guia_acceso/{correo}) ──
const claveCorreo = (c) => String(c || '').trim().toLowerCase();
// SHA-256 del correo en minúsculas (64 caracteres hexadecimales): nombre del documento de guia_registro
const hashCorreo = async (c) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(claveCorreo(c)))), (b) => b.toString(16).padStart(2, '0')).join('');
/** ¿Está registrado este correo? Se pregunta antes de enviar el enlace, para no enviar nada a quien no esté en la lista. */
export async function guiaCorreoRegistrado(email) {
  try { return (await F.getDoc(F.doc(db, 'guia_registro', await hashCorreo(email)))).exists(); } catch (e) { return false; }
}
const sincronizados = new Set();
/** Consultor: asegura la marca de «registrado» de cada persona de la lista (también las que se autorizaron antes de existir esta marca). */
export async function guiaAccesoSincronizar(lista) {
  for (const x of lista || []) {
    if (sincronizados.has(x.correo)) continue;
    sincronizados.add(x.correo);
    try { await F.setDoc(F.doc(db, 'guia_registro', await hashCorreo(x.correo)), { t: F.serverTimestamp() }); } catch (e) { sincronizados.delete(x.correo); }
  }
}
/** ¿Esta cuenta puede ver la guía? Una persona autorizada lee su propio documento; un consultor puede listar la colección. */
export async function guiaMiAcceso(email) {
  const correo = claveCorreo(email);
  try { const d = await F.getDoc(F.doc(db, 'guia_acceso', correo)); if (d.exists()) { const x = d.data(); return { ok: true, rol: 'invitado', n: x.n || '', e: x.e || '' }; } }
  catch (e) { return { ok: false }; }
  try { await F.getDocs(F.query(F.collection(db, 'guia_acceso'), F.limit(1))); return { ok: true, rol: 'consultor', n: '', e: '' }; }
  catch (e) { return { ok: false }; }
}
export async function guiaSalir() { await A.signOut(auth); }
// Ingreso sin cuenta Google: Firebase envía un enlace al correo y, al abrirlo, la persona ingresa (el correo queda verificado).
// Requiere habilitar «Vínculo del correo electrónico» en Firebase Authentication → Método de acceso → Correo/contraseña.
const LS_ENLACE = 'd360_correo_enlace';
export async function guiaEnviarEnlace(email) {
  const correo = claveCorreo(email);
  if (!(await guiaCorreoRegistrado(correo))) { const e = new Error('correo no registrado'); e.code = 'guia/no-registrado'; throw e; } // no se envía nada a quien no está en la lista
  await A.sendSignInLinkToEmail(auth, correo, { url: location.origin + location.pathname + '?guia=1', handleCodeInApp: true });
  try { localStorage.setItem(LS_ENLACE, correo); } catch (e) { /* sin almacenamiento: se pedirá el correo al abrir el enlace */ }
}
/** Si la página se abrió desde el enlace del correo, completa el ingreso. null = no venía de un enlace; {pedirCorreo} = hay que escribir el correo (otro equipo); {ok}; {error}. */
export async function guiaCompletarEnlace(correoEscrito) {
  if (!A.isSignInWithEmailLink(auth, location.href)) return null;
  let correo = claveCorreo(correoEscrito);
  if (!correo) { try { correo = localStorage.getItem(LS_ENLACE) || ''; } catch (e) { correo = ''; } }
  if (!correo) return { pedirCorreo: true };
  try {
    await A.signInWithEmailLink(auth, correo, location.href);
    try { localStorage.removeItem(LS_ENLACE); } catch (e) { /* nada */ }
    try { history.replaceState(null, '', location.pathname + '?guia=1'); } catch (e) { /* nada */ }
    return { ok: true };
  } catch (e) { return { error: e.code || e.message }; }
}
export function guiaAccesoEscuchar(cb, err) {
  return F.onSnapshot(F.collection(db, 'guia_acceso'),
    (s) => cb(s.docs.map((d) => { const x = d.data({ serverTimestamps: 'estimate' }); return { correo: d.id, n: x.n || '', e: x.e || '', por: x.por || '', t: x.t && x.t.toMillis ? x.t.toMillis() : 0 }; }).sort((a, b) => a.n.localeCompare(b.n, 'es'))), err || (() => cb([])));
}
export async function guiaAccesoAgregar({ correo, n, e }) {
  await F.setDoc(F.doc(db, 'guia_acceso', claveCorreo(correo)), { n: String(n).trim().slice(0, 80), ...(e && String(e).trim() ? { e: String(e).trim().slice(0, 80) } : {}), por: usuario.email, t: F.serverTimestamp() });
  await F.setDoc(F.doc(db, 'guia_registro', await hashCorreo(correo)), { t: F.serverTimestamp() });
  sincronizados.add(claveCorreo(correo));
}
export async function guiaAccesoQuitar(correo) {
  await F.deleteDoc(F.doc(db, 'guia_acceso', claveCorreo(correo)));
  await F.deleteDoc(F.doc(db, 'guia_registro', await hashCorreo(correo)));
  sincronizados.delete(claveCorreo(correo));
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
    version: 'd360v3', esquema: 2, compartido: null,
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
  pend = { sid: en.sid, datos: { esquema: 2, respuestas: { ...en.a }, notas: { ...en.n }, revisiones: [...(en.rv || [])], servicio: en.srv || null, tareas: en.tar && en.tar.length ? en.tar : null, avance: r.avance, hechas: r.hechas, total: r.total, puntaje: r.puntaje, nivel: r.nivel, estado: r.completa ? 'completa' : 'en_curso' } };
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
  await F.setDoc(F.doc(db, 'compartidos', tk), { ...pub, publicadoEn: F.serverTimestamp(), version: 'd360v4' });
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
// Presencia: cada dispositivo del cliente que entra escribe en en_vivo/{token}/presentes/{pid} su nombre y la hora (cada ~25 s);
// el consultor los lista para saber quién está conectado. Se borran al terminar la reunión.
export async function vivoPresente(tk, pid, persona) {
  try { await F.setDoc(F.doc(db, 'en_vivo', tk, 'presentes', pid), { n: persona.n, ...(persona.c ? { c: persona.c } : {}), t: F.serverTimestamp() }); } catch (e) { /* enlace cerrado */ }
}
export function vivoPresentes(tk, cb) {
  return F.onSnapshot(F.collection(db, 'en_vivo', tk, 'presentes'),
    (s) => cb(s.docs.map((d) => { const x = d.data(); return { id: d.id, n: x.n, c: x.c || '', t: x.t && x.t.toMillis ? x.t.toMillis() : 0 }; })), () => cb([]));
}
export async function vivoPresentesLimpiar(tk) {
  const s = await F.getDocs(F.collection(db, 'en_vivo', tk, 'presentes'));
  await Promise.all(s.docs.map((d) => F.deleteDoc(d.ref)));
}
// Escritura en vivo: el borrador de lo que alguien está escribiendo en la pizarra (un documento por dispositivo) para que los
// demás lo vean antes de que lo publique. Se actualiza mientras escribe y se borra al publicar o al cerrar la reunión.
export async function pzEscribiendo(tk, pid, d) {
  try { await F.setDoc(F.doc(db, 'en_vivo', tk, 'escribiendo', pid), { a: d.a, r: d.r, ...(d.c ? { c: d.c } : {}), q: d.q, x: d.x, t: F.serverTimestamp() }); } catch (e) { /* enlace cerrado */ }
}
export async function pzEscribiendoQuitar(tk, pid) {
  try { await F.deleteDoc(F.doc(db, 'en_vivo', tk, 'escribiendo', pid)); } catch (e) { /* ya no estaba */ }
}
export function pzEscribiendoEscuchar(tk, cb, err) {
  return F.onSnapshot(F.collection(db, 'en_vivo', tk, 'escribiendo'),
    (s) => cb(s.docs.map((d) => { const x = d.data({ serverTimestamps: 'estimate' }); return { id: d.id, a: x.a, r: x.r, c: x.c || '', q: x.q, x: x.x, t: x.t && x.t.toMillis ? x.t.toMillis() : 0 }; })), err || (() => cb([])));
}
export async function pzEscribiendoLimpiar(tk) {
  const s = await F.getDocs(F.collection(db, 'en_vivo', tk, 'escribiendo'));
  await Promise.all(s.docs.map((d) => F.deleteDoc(d.ref)));
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
/** Cambio de códigos de las preguntas: cada comentario de la pizarra de la sesión pasa al código nuevo. Se puede repetir sin riesgo: los ya cambiados llevan «qidAnt». */
export async function pzMigrarIds(sid, mapear) {
  const s = await F.getDocs(F.collection(db, ...rutaSes(sid)));
  for (const d of s.docs) {
    const x = d.data();
    if (x.qidAnt !== undefined || typeof x.qid !== 'string') continue;
    await F.updateDoc(d.ref, { qid: mapear(x.qid) || 'general', qidAnt: x.qid });
  }
}
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

// ── servicio: el cliente pide avanzar (no activa nada) y el consultor recibe la solicitud ──
const idSol = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
export async function solicitar(tk, d) {
  await F.setDoc(F.doc(db, 'compartidos', tk, 'solicitudes', idSol()), { paquete: d.paquete, nombre: d.nombre, ...(d.cargo ? { cargo: d.cargo } : {}), creadoEn: F.serverTimestamp() });
}
export function solicitudesEscuchar(tk, cb) {
  return F.onSnapshot(F.collection(db, 'compartidos', tk, 'solicitudes'),
    (s) => cb(s.docs.map((x) => { const v = x.data(); return { id: x.id, paquete: v.paquete, nombre: v.nombre, cargo: v.cargo || '', creadoEn: v.creadoEn && v.creadoEn.toMillis ? v.creadoEn.toMillis() : 0 }; }).sort((a, b) => b.creadoEn - a.creadoEn)), () => cb([]));
}

// ── eliminar una sesión con todo lo que depende de ella ──
// Firestore no borra las subcolecciones al borrar un documento: se borran una por una y, al final, la sesión.
// Si algo falla a mitad de camino, la sesión sigue existiendo y se puede reintentar (borrar de nuevo no daña nada).
const borrarSolicitudes = async (tk) => { const s = await F.getDocs(F.collection(db, 'compartidos', tk, 'solicitudes')); for (const x of s.docs) await F.deleteDoc(x.ref); };
export async function eliminarSesion(sid, d) {
  const tkC = d && d.compartido && d.compartido.token, tkV = d && d.vivo && d.vivo.token;
  if (tkC) { await borrarTodoPz(rutaComp(tkC)); await borrarSolicitudes(tkC); await F.deleteDoc(F.doc(db, 'compartidos', tkC)); }
  if (tkV) { await borrarTodoPz(rutaVivo(tkV)); await vivoPresentesLimpiar(tkV); await pzEscribiendoLimpiar(tkV); await F.deleteDoc(vivoRef(tkV)); }
  await borrarTodoPz(rutaSes(sid));
  await F.deleteDoc(F.doc(db, 'sesiones', sid));
}
// ── el invitado sale de la reunión: se quita su presencia ──
export async function vivoSalir(tk, pid) { try { await F.deleteDoc(F.doc(db, 'en_vivo', tk, 'presentes', pid)); } catch (e) { /* el enlace ya se cerró */ } }
