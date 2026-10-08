// Verifica la integridad de los datos y el motor del D360° (npm run verificar). Uso: node scripts/verificar.mjs [ruta a app.js]
import fs from 'node:fs';
import vm from 'node:vm';

const file = process.argv[2] || 'public/app.js';
const code = fs.readFileSync(file, 'utf8');

// stubs mínimos del navegador
const el = () => ({ textContent: '', innerHTML: '', value: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, setAttribute() {}, getContext: () => ({}) });
const store = {};
const sandbox = {
  console,
  Math, Date, JSON, Object, Array, Set, Promise,
  document: { getElementById: el, querySelectorAll: () => [], addEventListener() {} },
  window: { scrollTo() {}, print() {}, open() {} },
  localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  lucide: { createIcons() {} }, Chart: function () {}, alert() {}, confirm: () => false, setTimeout() {},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__t={D,Q,A,CL,E2};', sandbox);
const { D, Q, A, CL, E2 } = sandbox.__t;

let fallos = 0;
const ok = (c, m) => { if (!c) { fallos++; console.log('  ✗ ' + m); } };
const seccion = (t) => console.log('\n' + t);

seccion('1. Integridad de los datos');
const ids = Q.map((q) => q.id);
ok(new Set(ids).size === ids.length, 'IDs de preguntas repetidos');
const dims = new Set(D.map((d) => d.id));
for (const q of Q) {
  ok(dims.has(q.dm), q.id + ': dimensión inexistente ' + q.dm);
  ok(typeof q.q === 'string' && q.q.length > 10, q.id + ': falta el texto de la pregunta');
  ok(q.ar && q.ar.length > 3, q.id + ': falta referencia legal');
  ok(q.cx && q.cx.length > 40, q.id + ': falta explicación legal');
  ok(Array.isArray(q.op) && q.op.length === 4, q.id + ': debe tener 4 opciones');
  ok(q.op.map((o) => o.v).join() === '0,1,2,3', q.id + ': los valores de opción deben ser 0,1,2,3');
  ok(q.op.every((o) => o.l && o.d), q.id + ': opción sin etiqueta o descripción');
  ok((q.fl || []).every((v) => [0, 1, 2, 3].includes(v)), q.id + ': bandera roja con valor inválido');
  ok(q.w > 0, q.id + ': peso inválido');
  if (q.cd) ok(Q.some((p) => p.id === q.cd.sh && p.iS), q.id + ': dispara una pregunta que no existe o no es de profundización');
  // ejemplos de ayuda ("Ver ejemplos")
  ok(Array.isArray(q.ex) && q.ex.length >= 3, q.id + ': debe tener al menos 3 ejemplos');
  const vs = (q.ex || []).map((e) => e.v);
  ok(new Set(vs).size === vs.length, q.id + ': hay dos ejemplos para la misma respuesta');
  ok(vs.some((v) => v <= 1) && vs.includes(3), q.id + ': los ejemplos deben mostrar una respuesta baja y la correcta (3)');
  for (const e of q.ex || []) {
    ok(q.op.some((o) => o.v === e.v), q.id + ': ejemplo asociado a una respuesta que no existe');
    ok(typeof e.t === 'string' && e.t.length > 30 && !/[<>]/.test(e.t), q.id + ': texto de ejemplo inválido');
  }
  ok(typeof q.ev === 'string' && q.ev.length > 20 && !/[<>]/.test(q.ev), q.id + ': falta "cómo comprobarlo"');
}
for (const q of Q.filter((p) => p.iS)) ok(Q.filter((p) => p.cd && p.cd.sh === q.id).length === 1, q.id + ': debe ser disparada por exactamente una pregunta');
for (const d of D) ok(Q.some((q) => q.dm === d.id && !q.iS), d.id + ': la dimensión no tiene preguntas base');
for (const d of D) ok(A[d.id] && A[d.id].ac.length >= 4 && A[d.id].e, d.id + ': plan de acción incompleto');
for (const c of CL) for (const id of c.qs) ok(ids.includes(id), 'Semáforo "' + c.ob + '" referencia ' + id);
const cubiertas = new Set(CL.flatMap((c) => c.qs));
for (const q of Q) ok(cubiertas.has(q.id), q.id + ': ninguna obligación del semáforo la evalúa');
console.log('  ' + Q.length + ' preguntas (' + Q.filter((q) => !q.iS).length + ' base), ' + D.length + ' dimensiones, ' + CL.length + ' obligaciones');

seccion('2. Texto: errores legales conocidos no deben reaparecer');
const textoAll = JSON.stringify({ D, Q, A, CL });
const prohibidos = [
  [/15 días hábiles/, 'plazo de 15 días hábiles'], [/5 derechos/, '"5 derechos"'], [/cinco derechos/i, '"cinco derechos"'],
  [/Art\. 14 ter lit\. e\)/, 'lit. e) del art. 14 ter'], [/antes del 1\/12\/2026/, 'plazo inventado para designar responsable'],
  [/5\.000 a 10\.000 UTM/, 'tramo de multas incorrecto'], [/supervisión independiente/, 'supervisión independiente (no está en el art. 49)'],
  [/Art\. 27 compliance|Art\. 27 Ley/, 'cita errónea del art. 27'], [/registro de actividades de tratamiento \(art/i, 'RAT presentado como obligación legal'],
];
for (const [re, nombre] of prohibidos) ok(!re.test(textoAll), 'aparece ' + nombre);
ok(/30 días corridos/.test(textoAll) && /2 días hábiles/.test(textoAll) && /30 días hábiles/.test(textoAll), 'faltan los plazos correctos');
ok(/situación socioeconómica/.test(textoAll), 'la lista de datos sensibles no incluye la situación socioeconómica');

seccion('3. Motor: puntajes');
function responder(valor) { const e = new E2(); let q, n = 0; while ((q = e.nx()) && n++ < 500) e.ans(q.id, typeof valor === 'function' ? valor(q) : valor); return e; }
const e3 = responder(3), e0 = responder(0);
ok(e3.sc().g === 100, 'todo 3 debe dar 100 y da ' + e3.sc().g);
ok(D.every((d) => e3.sc().d[d.id] === 100), 'todo 3 debe dar 100 en cada dimensión');
ok(e0.sc().g === 0, 'todo 0 debe dar 0 y da ' + e0.sc().g);
ok(e3.ga().length === Q.filter((q) => !q.iS).length, 'con todo 3 no debe aparecer ninguna pregunta de profundización');
ok(e0.ga().length === Q.length, 'con todo 0 deben aparecer todas las preguntas (' + e0.ga().length + ' de ' + Q.length + ')');
const e2 = responder(2);
const esperado = Math.round(2 / 3 * 100);
ok(e2.sc().g >= esperado - 1 && e2.sc().g <= esperado + 1, 'todo 2 debe dar ≈67 y da ' + e2.sc().g);
console.log('  todo 3 → ' + e3.sc().g + ' | todo 2 → ' + e2.sc().g + ' | todo 0 → ' + e0.sc().g);

seccion('4. Motor: preguntas condicionales y banderas');
const e = new E2(); e.ans('GOB-01', 1);
ok(e.ga().some((q) => q.id === 'GOB-01b'), 'GOB-01 < 2 debe mostrar GOB-01b');
const f = new E2(); f.ans('GOB-01', 3);
ok(!f.ga().some((q) => q.id === 'GOB-01b'), 'GOB-01 = 3 no debe mostrar GOB-01b');
ok(e0.fl().length > 10, 'todo 0 debe levantar banderas rojas (' + e0.fl().length + ')');
ok(e3.fl().length === 0, 'todo 3 no debe levantar banderas rojas');
const progreso = e0.pg(); ok(progreso.p === 100, 'progreso con todo respondido debe ser 100%');

seccion('5. Motor: semáforo por obligación');
const c3 = e3.cl2(), c0 = e0.cl2(), cNada = new E2().cl2();
ok(c3.length === CL.length && c3.every((c) => c.st === 'green'), 'todo 3 → todo verde');
ok(c0.every((c) => c.st === 'red'), 'todo 0 → todo rojo');
ok(cNada.every((c) => c.st === 'gray' && c.lb === 'Sin datos'), 'sin respuestas → todo "Sin datos"');
const g = new E2(); g.ans('ARC-04', 3); g.ans('ARC-05', 1);
const sem = Object.fromEntries(g.cl2().map((c) => [c.ob, c.st]));
ok(sem['Bloqueo temporal'] === 'green' && sem['Rectificación y supresión'] === 'red' && sem['Decisiones automatizadas y perfiles'] === 'gray', 'el semáforo debe evaluar cada obligación por separado');
const parcial = new E2(); parcial.ans('ARC-01', 3); parcial.ans('ARC-01b', 2); parcial.ans('ARC-06', 3);
ok(parcial.cl2().find((c) => c.ob.startsWith('Procedimiento de solicitudes')).st === 'yellow', 'promedio 2,67 → parcial');

seccion('6. Botón "Ver ejemplos"');
const html = sandbox.exh(Q.find((q) => q.id === 'ARC-04'));
ok(html.includes('Ejemplos orientativos') && html.includes('Cómo comprobarlo'), 'el panel debe incluir el título y "Cómo comprobarlo"');
ok(html.split('class="exi"').length - 1 === 3, 'el panel de ARC-04 debe mostrar sus 3 ejemplos');
ok(html.includes('Respuesta: ') && html.includes('exv-3'), 'cada ejemplo debe indicar qué respuesta ilustra');
ok(typeof sandbox.tgl === 'function', 'falta la función que abre y cierra los paneles');
ok(/onclick="tgl\('exp','lpp'\)"/.test(code) && /Ver ejemplos/.test(code), 'falta el botón "Ver ejemplos" en la plantilla de la pregunta');
const sinEx = sandbox.exh({ op: [], ex: undefined });
ok(typeof sinEx === 'string', 'una pregunta sin ejemplos no debe romper el panel');

seccion('7. Persistencia: la clave de almacenamiento cambió (evita mezclar respuestas de la versión anterior)');
const p = new E2(); p.ans('GOB-01', 3);
ok('d360v3' in store && !('d360v2' in store), 'debe guardarse en d360v3');

console.log('\n' + (fallos ? '✗ ' + fallos + ' problema(s)' : '✓ Todas las verificaciones pasaron'));
process.exit(fallos ? 1 : 0);
