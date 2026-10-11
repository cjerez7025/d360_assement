// Prueba el COMPORTAMIENTO de firestore.d360.rules con la API de pruebas de reglas de Firebase (no publica nada).
// Uso: node scripts/probar-reglas.mjs        (necesita haber hecho `firebase login`; usa la sesión de la CLI)
//
// Limitación: la API no permite expresar fechas dentro de los datos, así que en la COPIA que se prueba se reemplazan las
// dos comparaciones de hora (`creadoEn == request.time` y `venceEn > request.time`) por `true`. Todo lo demás
// (roles, correo del consultor, forma del comentario, tamaños, ids, lectura, borrado) se prueba tal cual está en el archivo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROYECTO = 'aligndata-arcop';
const reglas = fs.readFileSync(new URL('../firestore.d360.rules', import.meta.url), 'utf8');
const copia = reglas
  .replace('request.resource.data.creadoEn == request.time', 'true')
  .replace('p.venceEn > request.time', 'true');
if (copia === reglas) { console.error('No se encontraron las comparaciones de hora a sustituir: revise este script.'); process.exit(2); }

// ── token de la sesión de la CLI de Firebase ──
async function token() {
  const f = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const t = JSON.parse(fs.readFileSync(f, 'utf8')).tokens || {};
  if (t.access_token && t.expires_at > Date.now() + 60000) return t.access_token;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh_token,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com', client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi' })
  });
  const j = await r.json(); if (!j.access_token) throw new Error('No se pudo renovar la sesión de la CLI: ' + JSON.stringify(j).slice(0, 120));
  return j.access_token;
}

// ── casos ──
const TK = 'A'.repeat(32), SID = 'sesionDePrueba01', ID = 'abcdefghijKLMNOPQR12', CT = 'T'.repeat(32);
const BASE = '/databases/(default)/documents';
const consultor = { uid: 'c1', token: { email: 'carlos.jerez@aligndata.cl', email_verified: true } };
const otro = { uid: 'x1', token: { email: 'alguien@gmail.com', email_verified: true } };
const noVerificado = { uid: 'c2', token: { email: 'carlos.jerez@aligndata.cl', email_verified: false } };
const jpg = 'data:image/jpeg;base64,' + 'A'.repeat(1000);
const cli = (extra = {}) => ({ autor: 'Marcela Soto', rol: 'cliente', cargo: 'Gerente de TI', qid: 'GOB-01', texto: 'Hola', creadoEn: '2026-10-11T12:00:00Z', ...extra });
const con = (extra = {}) => ({ autor: 'Carlos Jerez', rol: 'consultor', email: 'carlos.jerez@aligndata.cl', qid: 'general', texto: 'Nota', creadoEn: '2026-10-11T12:00:00Z', ...extra });
const sinCampo = (o, k) => { const c = { ...o }; delete c[k]; return c; };
const vigente = { function: 'get', args: [{ anyValue: {} }], result: { value: { data: { activo: true, venceEn: '2099-01-01T00:00:00Z' } } } };
const vencido = { function: 'get', args: [{ anyValue: {} }], result: { value: { data: { activo: false, venceEn: '2000-01-01T00:00:00Z' } } } };
const sinPadre = { function: 'get', args: [{ anyValue: {} }], result: { undefined: {} } };

const casos = [];
const c = (nombre, esperado, metodo, ruta, { auth, data, existente, mock } = {}) => casos.push({
  nombre, esperado, caso: {
    expectation: esperado,
    request: { method: metodo, path: BASE + ruta, ...(auth ? { auth } : {}), ...(data ? { resource: { data } } : {}), time: '2026-10-11T12:00:00Z' },
    ...(existente ? { resource: { data: existente } } : {}),
    ...(mock ? { functionMocks: [mock] } : {})
  }
});
const VIVO = `/en_vivo/${TK}/pizarra/${ID}`, SES = `/sesiones/${SID}/pizarra/${ID}`, COM = `/compartidos/${CT}/pizarra/${ID}`;

// pizarra en vivo · cliente (sin cuenta)
c('cliente: comentario válido con enlace vigente', 'ALLOW', 'create', VIVO, { data: cli(), mock: vigente });
c('cliente: comentario con 3 imágenes', 'ALLOW', 'create', VIVO, { data: cli({ imgs: [jpg, jpg, jpg] }), mock: vigente });
c('cliente: solo imagen, sin texto', 'ALLOW', 'create', VIVO, { data: cli({ texto: '', imgs: [jpg] }), mock: vigente });
c('cliente: sin cargo (opcional)', 'ALLOW', 'create', VIVO, { data: sinCampo(cli(), 'cargo'), mock: vigente });
c('cliente: enlace vencido o cerrado', 'DENY', 'create', VIVO, { data: cli(), mock: vencido });
c('cliente: enlace que no existe', 'DENY', 'create', VIVO, { data: cli(), mock: sinPadre });
c('cliente: se hace pasar por consultor', 'DENY', 'create', VIVO, { data: cli({ rol: 'consultor' }), mock: vigente });
c('cliente: manda un email (campo de consultor)', 'DENY', 'create', VIVO, { data: cli({ email: 'carlos.jerez@aligndata.cl' }), mock: vigente });
c('cliente: campo extra no permitido', 'DENY', 'create', VIVO, { data: cli({ admin: true }), mock: vigente });
c('cliente: sin nombre de autor', 'DENY', 'create', VIVO, { data: cli({ autor: '' }), mock: vigente });
c('cliente: nombre de 61 caracteres', 'DENY', 'create', VIVO, { data: cli({ autor: 'N'.repeat(61) }), mock: vigente });
c('cliente: texto de 2001 caracteres', 'DENY', 'create', VIVO, { data: cli({ texto: 'x'.repeat(2001) }), mock: vigente });
c('cliente: texto de 2000 caracteres', 'ALLOW', 'create', VIVO, { data: cli({ texto: 'x'.repeat(2000) }), mock: vigente });
c('cliente: 4 imágenes', 'DENY', 'create', VIVO, { data: cli({ imgs: [jpg, jpg, jpg, jpg] }), mock: vigente });
c('cliente: imagen de 240.001 caracteres', 'DENY', 'create', VIVO, { data: cli({ imgs: ['A'.repeat(240001)] }), mock: vigente });
c('cliente: imagen de 240.000 caracteres', 'ALLOW', 'create', VIVO, { data: cli({ imgs: ['A'.repeat(240000)] }), mock: vigente });
c('cliente: imágenes que no son texto', 'DENY', 'create', VIVO, { data: cli({ imgs: [123] }), mock: vigente });
c('cliente: ni texto ni imagen', 'DENY', 'create', VIVO, { data: cli({ texto: '' }), mock: vigente });
c('cliente: id de comentario inválido', 'DENY', 'create', `/en_vivo/${TK}/pizarra/corto`, { data: cli(), mock: vigente });
c('cliente: no puede editar un comentario', 'DENY', 'update', VIVO, { data: cli({ texto: 'otro' }), existente: cli(), mock: vigente });
c('cliente: no puede borrar un comentario', 'DENY', 'delete', VIVO, { existente: cli(), mock: vigente });
c('cliente: lee un comentario con enlace vigente', 'ALLOW', 'get', VIVO, { existente: cli(), mock: vigente });
c('cliente: lista los comentarios con enlace vigente', 'ALLOW', 'list', VIVO, { mock: vigente });
c('cliente: no lee con enlace vencido', 'DENY', 'get', VIVO, { existente: cli(), mock: vencido });
c('cliente: no lista con enlace vencido', 'DENY', 'list', VIVO, { mock: vencido });
// pizarra en vivo · consultor
c('consultor: comentario con su propio correo', 'ALLOW', 'create', VIVO, { auth: consultor, data: con(), mock: vencido });
c('consultor: comentario con el correo de otra persona', 'DENY', 'create', VIVO, { auth: consultor, data: con({ email: 'jerezcarlos70@gmail.com' }), mock: vigente });
c('consultor: sin el campo email', 'DENY', 'create', VIVO, { auth: consultor, data: sinCampo(con(), 'email'), mock: vigente });
c('consultor: como cliente estando autenticado y enlace vigente', 'ALLOW', 'create', VIVO, { auth: consultor, data: cli(), mock: vigente });
c('cuenta no autorizada: se hace pasar por consultor', 'DENY', 'create', VIVO, { auth: otro, data: con({ email: 'alguien@gmail.com' }), mock: vigente });
c('cuenta con correo sin verificar', 'DENY', 'create', VIVO, { auth: noVerificado, data: con(), mock: vencido });
c('consultor: borra un comentario', 'ALLOW', 'delete', VIVO, { auth: consultor, existente: cli(), mock: vencido });
c('cuenta no autorizada: no borra', 'DENY', 'delete', VIVO, { auth: otro, existente: cli(), mock: vigente });
c('consultor: no edita (los comentarios son inmutables)', 'DENY', 'update', VIVO, { auth: consultor, data: con({ texto: 'cambio' }), existente: con(), mock: vigente });
c('consultor: lee aunque el enlace haya vencido', 'ALLOW', 'get', VIVO, { auth: consultor, existente: cli(), mock: vencido });
// registro permanente de la sesión
c('sesión: el consultor lee', 'ALLOW', 'get', SES, { auth: consultor, existente: cli() });
c('sesión: el consultor copia un comentario de cliente', 'ALLOW', 'create', SES, { auth: consultor, data: cli() });
c('sesión: sin cuenta no lee', 'DENY', 'get', SES, { existente: cli() });
c('sesión: cuenta no autorizada no lee', 'DENY', 'get', SES, { auth: otro, existente: cli() });
c('sesión: sin cuenta no escribe', 'DENY', 'create', SES, { data: cli() });
c('sesión: sin cuenta no lista', 'DENY', 'list', SES);
// pizarra publicada
c('publicada: cualquiera con el enlace lee', 'ALLOW', 'get', COM, { existente: cli() });
c('publicada: cualquiera con el enlace lista', 'ALLOW', 'list', COM);
c('publicada: sin cuenta no escribe', 'DENY', 'create', COM, { data: cli() });
c('publicada: cuenta no autorizada no escribe', 'DENY', 'create', COM, { auth: otro, data: cli() });
c('publicada: el consultor publica', 'ALLOW', 'create', COM, { auth: consultor, data: cli() });
c('publicada: el consultor retira', 'ALLOW', 'delete', COM, { auth: consultor, existente: cli() });
c('publicada: id inválido', 'DENY', 'create', `/compartidos/${CT}/pizarra/x`, { auth: consultor, data: cli() });
// lo que ya existía no debe cambiar
c('resultado compartido: get público', 'ALLOW', 'get', `/compartidos/${CT}`, { existente: { perfil: {} } });
c('resultado compartido: no se puede listar', 'DENY', 'list', `/compartidos/${CT}`);
c('sesiones: sin cuenta no lee', 'DENY', 'get', `/sesiones/${SID}`, { existente: {} });
c('subcolección desconocida: denegada', 'DENY', 'get', `/sesiones/${SID}/otra/${ID}`, { auth: consultor, existente: {} });
c('colección desconocida: denegada', 'DENY', 'get', '/cualquiera/x', { auth: consultor, existente: {} });
// pizarra: no se puede leer la de otro enlace sin que exista el padre
c('en vivo: sin cuenta no lista sin enlace vigente', 'DENY', 'list', VIVO, { mock: sinPadre });

const r = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROYECTO}:test`, {
  method: 'POST', headers: { authorization: 'Bearer ' + await token(), 'content-type': 'application/json' },
  body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: copia }] }, testSuite: { testCases: casos.map((x) => x.caso) } })
});
const j = await r.json();
if (!r.ok) { console.error('Error de la API de reglas:', JSON.stringify(j).slice(0, 600)); process.exit(2); }
if (j.issues && j.issues.length) { console.error('Las reglas no compilan:', JSON.stringify(j.issues).slice(0, 800)); process.exit(1); }
let mal = 0;
(j.testResults || []).forEach((t, i) => {
  const ok = t.state === 'SUCCESS';
  if (!ok) { mal++; console.log('  ✗ ' + casos[i].nombre + ' (esperado ' + casos[i].esperado + ')' + (t.debugMessages ? ' · ' + t.debugMessages.join(' | ').slice(0, 200) : '')); }
});
console.log((mal ? '✗ ' + mal + ' de ' : '✓ ') + casos.length + ' casos' + (mal ? ' fallaron' : ' de reglas pasaron'));
process.exitCode = mal ? 1 : 0;
