// Verifica la integridad de los datos y el motor del D360° (npm run verificar). Uso: node scripts/verificar.mjs [ruta a app.js]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const file = process.argv[2] || 'public/app.js';
const code = fs.readFileSync(file, 'utf8');

// stubs mínimos del navegador
const el = () => ({ textContent: '', innerHTML: '', value: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, setAttribute() {}, getContext: () => ({}) });
const store = {};
const sandbox = {
  console,
  Math, Date, JSON, Object, Array, Set, Promise,
  document: { title: 'D360° Privacy Assessment — AlignData', getElementById: el, querySelectorAll: () => [], addEventListener() {} },
  window: { scrollTo() {}, print() { sandbox.__impreso = sandbox.document.title; }, open() {}, addEventListener(t, f) { sandbox.__eventos[t] = f; }, removeEventListener(t) { delete sandbox.__eventos[t]; } },
  __eventos: {},
  localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  lucide: { createIcons() {} }, Chart: function () {}, alert() {}, confirm: () => false, setTimeout() {},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__t={D,Q,A,CL,E2,en};', sandbox);
const { D, Q, A, CL, E2, en } = sandbox.__t;

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
  ok(Array.isArray(q.ex) && q.op.every((o) => q.ex.some((e) => e.v === o.v)), q.id + ': cada respuesta debe tener su propio ejemplo');
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

seccion('6. Ejemplo asociado a cada respuesta');
const q04 = Q.find((q) => q.id === 'ARC-04');
for (const o of q04.op) {
  const h = sandbox.exo(q04, o.v);
  ok(h.includes(q04.ex.find((e) => e.v === o.v).t) && h.includes('exv-' + o.v), 'ARC-04: la respuesta ' + o.v + ' debe mostrar su propio ejemplo');
  ok(!q04.ex.filter((e) => e.v !== o.v).some((e) => h.includes(e.t)), 'ARC-04: el globo de la respuesta ' + o.v + ' no debe incluir ejemplos de otras respuestas');
}
ok(sandbox.exo(q04, 3).includes('Cómo comprobarlo') && !sandbox.exo(q04, 1).includes('Cómo comprobarlo'), '"Cómo comprobarlo" solo acompaña a la respuesta correcta');
ok(sandbox.exo({ ex: [] }, 1) === '', 'una respuesta sin ejemplo no muestra globo');
ok(typeof sandbox.ejo === 'function' && typeof sandbox.ejc === 'function' && typeof sandbox.tgl === 'function', 'faltan las funciones que abren y cierran los globos y paneles');
ok(sandbox.glosaArt('Arts. 16 ter y 16 sexies').includes('16 ter') && sandbox.glosaArt('Arts. 16 ter y 16 sexies').includes('tercer') && sandbox.glosaArt('Arts. 16 ter y 16 sexies').includes('sexto'), 'la glosa de «16 ter y 16 sexies» debe explicar qué número de artículo es cada uno');
ok(sandbox.glosaArt('Art. 12') === '' && sandbox.glosaArt('Arts. 4 a 11') === '', 'las referencias sin sufijo latino no llevan glosa');
ok(/quáter/.test(sandbox.glosaArt('Arts. 14 quáter a 14 sexies')) && sandbox.sufArt('Arts. 14 quáter a 14 sexies').join() === 'quáter,sexies', 'debe reconocer quáter y sexies');
ok(Q.every((q) => sandbox.temaQ(q)), 'cada pregunta debe tener un tema (la obligación del semáforo que la evalúa) para su etiqueta');
ok(Q.filter((q) => sandbox.glosaArt(q.ar)).length >= 5, 'varias preguntas citan artículos con sufijo latino y deben llevar su explicación');
ok(/class="optw/.test(code) && /onclick="ejo\(this\)"/.test(code), 'cada respuesta debe tener su botón de ejemplo');
ok(/Escape/.test(code) && /closest\('\.ejb'\)/.test(code), 'el globo debe cerrarse con Esc y con un clic fuera');
ok(!/id="exp"|dlg-ej|Ver ejemplos/.test(code) && !/id="dlg-ej"/.test(fs.readFileSync(file.replace(/app\.js$/, 'index.html'), 'utf8')), 'ya no hay botón general ni ventana modal de ejemplos');
ok(/dialog\[open\]/.test(code), 'los atajos del teclado no deben actuar mientras hay una ventana abierta');

seccion('7. Informe en PDF (impresión)');
const css = fs.readFileSync(file.replace(/app\.js$/, 'styles.css'), 'utf8').replace(/\r\n/g, '\n');
const impresion = (css.match(/@media print\{[\s\S]*?\n\}\n/) || [''])[0];
ok(impresion.includes('animation:none!important'), 'al imprimir se deben anular las animaciones (las pestañas animadas salían en blanco)');
ok(/\.tp\{display:block!important;opacity:1!important\}/.test(impresion), 'al imprimir todas las pestañas del resultado deben verse completas');
ok(/print-color-adjust:exact/.test(impresion), 'al imprimir deben conservarse los colores');
ok(/#t4\{break-before:page\}/.test(impresion), 'el semáforo debe empezar en una hoja nueva');
ok(!/\.ph\{/.test(impresion.replace(/\.pc2 \.ph\{[^}]*\}/g, '')), 'la clase .ph es del plan de acción: el encabezado del informe usa .rpt');
ok(/class="po rpt"/.test(code) && /class="po rpt-f"/.test(code), 'faltan el encabezado o el pie del informe');
ok(/onclick="pdf\(\)"/.test(code) && !/onclick="window\.print\(\)"/.test(code), 'el botón debe usar pdf()');
en.sp({ nombre: 'Acme SpA' });
sandbox.pdf();
ok(/^Informe D360 - Acme SpA - \d{2}-\d{2}-\d{4}$/.test(sandbox.__impreso || ''), 'el nombre sugerido del archivo debe ser "Informe D360 - <empresa> - <fecha>" y es: ' + sandbox.__impreso);
ok(typeof sandbox.__eventos.afterprint === 'function', 'debe restaurar el título después de imprimir');
sandbox.__eventos.afterprint();
ok(sandbox.document.title === 'D360° Privacy Assessment — AlignData', 'el título original debe restaurarse tras imprimir');
ok(/^\d{2}-\d{2}-\d{4}$/.test(sandbox.fch()), 'la fecha del informe debe ser dd-mm-aaaa');

seccion('8. Persistencia: la clave de almacenamiento cambió (evita mezclar respuestas de la versión anterior)');
const p = new E2(); p.ans('GOB-01', 3);
ok('d360v3' in store && !('d360v2' in store), 'debe guardarse en d360v3');

seccion('9. Diseño y accesibilidad');
// contraste WCAG calculado sobre los tokens de color de styles.css
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const mezcla = (a, b, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * k + parseInt(b.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, '0')).join('');
const tokens = (txt) => Object.fromEntries([...txt.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*[;}]/g)].map((m) => [m[1], m[2].toUpperCase()]));
const bloqueRaiz = (css.match(/:root\{([\s\S]*?)\n\}/) || [, ''])[1];
const bloqueOscuro = (css.match(/:root\[data-theme="dark"\]\{([\s\S]*?)\n\}/) || [, ''])[1];
ok(bloqueRaiz && bloqueOscuro, 'faltan los tokens del tema claro u oscuro');
const claro = tokens(bloqueRaiz);
const temas = { claro, oscuro: { ...claro, ...tokens(bloqueOscuro) } };
for (const [nombre, T] of Object.entries(temas)) {
  const par = (fg, bg, min, que) => { if (!T[fg] || !T[bg]) { ok(false, nombre + ': falta el token ' + (T[fg] ? bg : fg)); return; } const r = cr(T[fg], T[bg]); ok(r >= min, `${nombre}: ${que} ${fg} sobre ${bg} tiene contraste ${r.toFixed(2)} y debe ser ≥ ${min}`); };
  for (const f of ['bg', 'surface', 'sunk']) for (const t of ['text', 'text-2', 'muted', 'brand-ink']) par(t, f, 4.5, 'texto');
  par('brand-ink', 'brand-soft', 4.5, 'texto'); par('text', 'brand-soft', 4.5, 'texto');
  par('on-brand', 'brand', 4.5, 'botón'); par('on-ink', 'brand-ink', 4.5, 'selección');
  par('field', 'surface', 3, 'borde de campo'); par('field', 'bg', 3, 'borde de campo');
  for (const n of ['lv0', 'lv1', 'lv2', 'lv3', 'lv4', 'lvn']) {
    par(n + '-ink', n + '-soft', 4.5, 'etiqueta de estado'); par(n + '-ink', 'surface', 4.5, 'texto de estado');
    par(n + '-mark', 'surface', 3, 'marca de estado'); par(n + '-mark', 'sunk', 3, 'barra de medidor');
    const tinte = mezcla(T[n + '-soft'], T.surface, 0.45); // fondo de la tarjeta de sesión según su nivel
    for (const [fg, que] of [['muted', 'texto atenuado'], ['text-2', 'texto'], ['text', 'texto'], ['brand-ink', 'porcentaje de avance'], [n + '-ink', 'puntaje']]) { const r = cr(T[fg], tinte); ok(r >= 4.5, `${nombre}: ${que} sobre la tarjeta tintada ${n} tiene contraste ${r.toFixed(2)} y debe ser ≥ 4.5`); }
  }
}
for (const f of ['navy-soft', 'navy']) for (const t of ['on-navy', 'on-navy-2', 'on-navy-3', 'navy-brand']) { const r = cr(claro[t], claro[f]); ok(r >= 4.5, `navy: ${t} sobre ${f} tiene contraste ${r.toFixed(2)}`); }
for (const h of ['h0', 'h1', 'h2', 'h3', 'h4']) { const r = cr(claro[h], claro['navy-soft']); ok(r >= 3, `navy: marca ${h} tiene contraste ${r.toFixed(2)} sobre el hero`); }
for (const h of ['h0', 'h1', 'h2', 'h3', 'h4']) for (const f of ['on-navy', 'on-navy-2', 'on-navy-3']) { const fondo = mezcla(claro[h], claro.navy, 0.26); const r = cr(claro[f], fondo); ok(r >= 4.5, `panel de resultados ${h}: ${f} sobre el fondo tintado tiene contraste ${r.toFixed(2)}`); }
ok(/@property --hc/.test(css) && [0, 1, 2, 3, 4].every((n) => new RegExp('\\.rh\\.n' + n + '\\{--hc:var\\(--h' + n + '\\)\\}').test(css)), 'el panel de resultados debe tener un color por cada nivel (n0 a n4) y una transición');
ok([0, 1, 2, 3, 4].every((n) => new RegExp('\\.nv' + n + '\\{').test(css)) && /\.nvx\{/.test(css), 'las tarjetas de sesión deben tener un color por nivel y uno neutro');
ok(/function nivelVivo\(\)/.test(code) && /nivelVivo\(\);/.test(code) && /id="pnv-t"/.test(fs.readFileSync(file.replace(/app\.js$/, 'index.html'), 'utf8')), 'el panel de progreso debe mostrar y actualizar el nivel actual mientras se responde');
ok(/\.pp\{background:color-mix\(in srgb,var\(--nv-soft\)/.test(css) && /@keyframes nivelPulso/.test(css), 'el panel de progreso debe cambiar de color con el nivel y destacar el cambio');
ok(/class="rh n\$\{lvIni\}"/.test(code) && /classList\.add\('n'\+mt\.n\)/.test(code), 'el panel debe cambiar de color cuando cambia el nivel');
const paginaHtml = fs.readFileSync(file.replace(/app\.js$/, 'index.html'), 'utf8');
ok(/prefers-color-scheme:dark/.test(css) && /\[data-theme="dark"\]/.test(css), 'debe existir el tema oscuro (sistema y selector manual)');
ok(/prefers-reduced-motion:reduce/.test(css), 'debe respetar prefers-reduced-motion');
ok(/:focus-visible\{[^}]*outline/.test(css), 'debe haber un foco visible para teclado');
ok(/html:root:root\{[\s\S]*?--surface:#FFFFFF/.test(impresion), 'al imprimir se deben forzar los colores del tema claro');
ok(!/font-variant-numeric/.test((css.match(/\.sr \.sv\{[^}]*\}/) || [''])[0]), 'la cifra principal usa números proporcionales, no tabulares');
ok(/type="radio"/.test(code) && /role="radiogroup"/.test(code), 'las opciones de respuesta deben ser radios nativos (teclado y lector de pantalla)');
ok(/role="tablist"/.test(code) && /role="tab"/.test(code) && /aria-selected/.test(code) && /role="tabpanel"/.test(code), 'las pestañas del resultado deben tener roles ARIA');
ok(/<button type="button" class="lb-btn"/.test(code) && /aria-expanded/.test(code), 'los botones de ayuda deben ser <button> con aria-expanded');
ok(!/\balert\(/.test(code), 'no usar alert(): el error del formulario se muestra en la página');
ok(['f1', 'f2', 'f3', 'f4'].every((id) => new RegExp('<label for="' + id + '"').test(paginaHtml)), 'cada campo del formulario necesita su <label for>');
ok(/<main[^>]*id="main"/.test(paginaHtml) && /class="skip"/.test(paginaHtml), 'falta el contenedor <main> o el enlace "Saltar al contenido"');
ok(!/bootstrap/i.test(paginaHtml), 'Bootstrap no se usa: no cargarlo');
ok(/lucide@\d+\.\d+\.\d+/.test(paginaHtml), 'lucide debe cargarse con versión fija');

seccion('10. Sesiones guardadas (consultor y cliente)');
{
  const lst = new E2().ga(), ult = lst[lst.length - 1];
  const e1 = new E2();
  ok(e1.sig(lst[0].id).id === lst[1].id && e1.ant(lst[0].id) === null && e1.sig(ult.id) === null && e1.ant(lst[1].id).id === lst[0].id, 'la navegación libre debe recorrer las preguntas en orden y terminar en los extremos');
  e1.ans('GOB-01', 0);
  ok(e1.sig('GOB-01').id === 'GOB-01b', 'la pregunta de profundización debe aparecer justo después de la que la dispara');
  e1.nota('GOB-01', '  El cliente dice que TI se encarga  ');
  ok(e1.n['GOB-01'] && e1.n['GOB-01'].includes('TI'), 'las notas de la reunión se guardan por pregunta');
  e1.nota('GOB-01', '   ');
  ok(!('GOB-01' in e1.n), 'una nota vacía se elimina');
  e1.nota('GOB-02', 'x'.repeat(5000));
  ok(e1.n['GOB-02'].length === 2000, 'las notas se limitan a 2000 caracteres');

  // lo que ve el cliente: solo perfil mínimo y respuestas visibles; nunca notas ni contacto
  const e2 = new E2();
  e2.sp({ nombre: 'Acme SpA', sector: 'salud', 'tamaño': '11-50', email: 'ana@acme.cl', contacto: 'Ana Pérez' });
  e2.a = { 'GOB-01': 3, 'GOB-01b': 2, 'GOB-02': 2 };
  e2.n = { 'GOB-01': 'nota privada' };
  const pub = e2.pub();
  ok(Object.keys(pub).sort().join() === 'perfil,respuestas', 'lo publicado solo tiene perfil y respuestas');
  ok(Object.keys(pub.perfil).sort().join() === 'nombre,sector,tamaño', 'el perfil publicado no incluye email ni contacto');
  ok(!('GOB-01b' in pub.respuestas) && pub.respuestas['GOB-01'] === 3, 'no se publican respuestas de preguntas que ya no aplican');
  ok(!JSON.stringify(pub).includes('nota privada') && !JSON.stringify(pub).includes('ana@acme.cl'), 'lo publicado no debe contener notas ni datos de contacto');
  const e3 = new E2().cargar(pub);
  ok(JSON.stringify(e3.sc()) === JSON.stringify(e2.sc()), 'el cliente debe ver el mismo puntaje que el consultor');
  const e4 = new E2().cargar({ perfil: e2.p, respuestas: e2.a, notas: e2.n });
  ok(e4.n['GOB-01'] === 'nota privada' && e4.p.contacto === 'Ana Pérez', 'cargar una sesión restaura notas y perfil');
  ok(e2.pub().respuestas !== e2.a, 'lo publicado es una copia y no la referencia interna');

  // resumen para el panel de sesiones
  const vacio = new E2().res();
  ok(vacio.puntaje === null && vacio.nivel === null && vacio.avance === 0 && vacio.completa === false, 'una sesión sin respuestas no tiene puntaje');
  const lleno = new E2(); for (const q of lst) lleno.a[q.id] = 3;
  const rl = lleno.res();
  ok(rl.completa && rl.puntaje === 100 && rl.avance === 100 && rl.hechas === rl.total, 'una sesión con todo respondido está completa');

  // guardado: con sesión en la nube no se escribe en el equipo; en modo solo lectura no se guarda nada
  delete store['d360v3'];
  vm.runInContext('Nube={guardar(e){globalThis.__guardados=(globalThis.__guardados||0)+1;globalThis.__sid=e.sid}}', sandbox);
  const nube = new E2(); nube.sid = 'abc123'; nube.ans('GOB-01', 3);
  ok(sandbox.__guardados === 1 && sandbox.__sid === 'abc123', 'con una sesión abierta cada respuesta se envía a la nube');
  ok(!('d360v3' in store), 'con una sesión en la nube no se deja una copia de los datos del cliente en el navegador');
  const lec = new E2(); lec.sid = 'abc123'; lec.ro = true; lec.ans('GOB-01', 3);
  ok(sandbox.__guardados === 1 && !('d360v3' in store), 'en modo solo lectura no se guarda nada');
  vm.runInContext('Nube=null', sandbox);
  const local = new E2(); local.ans('GOB-01', 2);
  ok('d360v3' in store, 'sin sesión en la nube se sigue guardando en el navegador (modo local)');

  // texto que viene de personas se escapa antes de mostrarlo
  const mal = vm.runInContext('esc', sandbox)('<img src=x onerror=alert(1)> "a" & \'b\'');
  ok(!/[<>"']/.test(mal) && mal.includes('&amp;'), 'esc() debe neutralizar HTML');
  ok(/esc\(pr\.nombre/.test(code), 'el nombre de la empresa debe escaparse en el informe');

  // archivos de configuración y reglas de seguridad
  const raiz = path.resolve(path.dirname(file), '..');
  const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/\r\n/g, '\n');
  const reglas = leer('firestore.d360.rules'), fbj = JSON.parse(leer('firebase.json'));
  ok(/allow list: if false/.test(reglas), 'los resultados compartidos no deben poder listarse');
  ok((reglas.match(/if true/g) || []).length === 1 && /allow get: if true/.test(reglas), 'la única lectura pública permitida es get de un resultado compartido');
  ok(/match \/sesiones\/\{id\}\s*\{\s*allow read, write: if esConsultor\(\);/.test(reglas), 'las sesiones solo las ven los consultores');
  ok(/email_verified == true/.test(reglas) && /request\.auth\.token\.email in \[/.test(reglas), 'los consultores se validan por correo verificado en una lista');
  ok(/hasOnly\(\['perfil', 'respuestas', 'publicadoEn', 'version'\]\)/.test(reglas) && /token\.size\(\) == 32/.test(reglas), 'lo compartido solo admite esos campos y un token de 32 caracteres');
  ok(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/.test(reglas), 'todo lo demás debe estar denegado');
  ok(Array.isArray(fbj.firestore) && fbj.firestore.length === 1 && fbj.firestore[0].database === 'd360', 'solo debe publicarse la base d360 (nunca la (default) del portal)');
  const cfgTxt = leer('public/firebase-config.js');
  const prueba = /prueba:\s*true/.test(cfgTxt);
  if (prueba) console.log('  ⚠ Modo de prueba ACTIVO en firebase-config.js: el sitio permite usarse sin Google (datos solo en el navegador). Quitarlo antes del lanzamiento.');
  ok(/PRUEBA = !!CFG\.prueba &&/.test(leer('public/sesiones.js')), 'el modo de prueba solo puede activarse si firebase-config.js lo permite');
  ok(!/firebasejs|initializeApp|firestore/.test(leer('public/nube-prueba.js')), 'el modo de prueba no debe conectarse a Firebase');
  ok(fbj.hosting.headers.some((h) => h.source === '**' && h.headers.some((x) => x.key === 'Cache-Control' && x.value === 'no-cache')), 'los scripts deben revalidarse siempre: un sesiones.js nuevo con un nube.js viejo en caché rompe el ingreso');
  ok(/databaseId:\s*'d360'/.test(leer('public/firebase-config.js')), 'la app debe usar la base d360');
  const ses = leer('public/sesiones.js'), nub = leer('public/nube.js');
  ok(/N\.compartir\(act\.id, en\.pub\(\)/.test(ses), 'solo se publica lo que devuelve en.pub()');
  ok(/\^\[A-Za-z0-9_-\]\{32\}\$/.test(ses) && /new Uint8Array\(24\)/.test(nub), 'el token debe ser de 24 bytes al azar (32 caracteres) y validarse al abrir el enlace');
  ok(/clearIndexedDbPersistence/.test(nub), 'al cerrar sesión se borra la copia local de los datos');
  ok(/memoryLocalCache/.test(nub), 'el cliente no debe guardar datos en su equipo');
  const html10 = leer('public/index.html');
  ok(/name="referrer" content="no-referrer"/.test(html10) && /noindex/.test(html10), 'los enlaces con token no deben filtrarse por Referer ni indexarse');
}

console.log('\n' + (fallos ? '✗ ' + fallos + ' problema(s)' : '✓ Todas las verificaciones pasaron'));
process.exit(fallos ? 1 : 0);
