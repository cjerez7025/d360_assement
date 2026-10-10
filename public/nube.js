/* Capa de datos en la nube del D360°: Firebase Auth (Google) + Firestore, base nombrada «d360».
   Colecciones:
     sesiones/{id}      → solo consultores autorizados (ver firestore.d360.rules)
     compartidos/{token} → lectura por enlace (el token es el secreto); solo los consultores escriben */
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
    cb(u ? { uid: u.uid, email: u.email, nombre: u.displayName || u.email } : null);
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
  pend = { sid: en.sid, datos: { respuestas: { ...en.a }, notas: { ...en.n }, avance: r.avance, hechas: r.hechas, total: r.total, puntaje: r.puntaje, nivel: r.nivel, estado: r.completa ? 'completa' : 'en_curso' } };
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
