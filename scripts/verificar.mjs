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
    const fondoPantalla = mezcla(T[n + '-soft'], T.bg, 0.7); // fondo de TODA la pantalla según el nivel
    for (const [fg, que] of [['muted', 'texto atenuado'], ['text-2', 'texto'], ['text', 'texto'], ['brand-ink', 'texto de marca']]) { const r = cr(T[fg], fondoPantalla); ok(r >= 4.5, `${nombre}: ${que} sobre el fondo de pantalla tintado ${n} tiene contraste ${r.toFixed(2)} y debe ser ≥ 4.5`); }
    const tinte = mezcla(T[n + '-soft'], T.surface, 0.45); // fondo de la tarjeta de sesión según su nivel
    for (const [fg, que] of [['muted', 'texto atenuado'], ['text-2', 'texto'], ['text', 'texto'], ['brand-ink', 'porcentaje de avance'], [n + '-ink', 'puntaje']]) { const r = cr(T[fg], tinte); ok(r >= 4.5, `${nombre}: ${que} sobre la tarjeta tintada ${n} tiene contraste ${r.toFixed(2)} y debe ser ≥ 4.5`); }
  }
}
for (const f of ['navy-soft', 'navy']) for (const t of ['on-navy', 'on-navy-2', 'on-navy-3', 'navy-brand']) { const r = cr(claro[t], claro[f]); ok(r >= 4.5, `navy: ${t} sobre ${f} tiene contraste ${r.toFixed(2)}`); }
for (const h of ['h0', 'h1', 'h2', 'h3', 'h4']) { const r = cr(claro[h], claro['navy-soft']); ok(r >= 3, `navy: marca ${h} tiene contraste ${r.toFixed(2)} sobre el hero`); }
for (const h of ['h0', 'h1', 'h2', 'h3', 'h4']) for (const f of ['on-navy', 'on-navy-2', 'on-navy-3']) { const fondo = mezcla(claro[h], claro.navy, 0.26); const r = cr(claro[f], fondo); ok(r >= 4.5, `panel de resultados ${h}: ${f} sobre el fondo tintado tiene contraste ${r.toFixed(2)}`); }
ok(/@property --hc/.test(css) && [0, 1, 2, 3, 4].every((n) => new RegExp('\\.rh\\.n' + n + '\\{--hc:var\\(--h' + n + '\\)\\}').test(css)), 'el panel de resultados debe tener un color por cada nivel (n0 a n4) y una transición');
ok([0, 1, 2, 3, 4].every((n) => new RegExp('\\.nv' + n + '\\{').test(css)) && /\.nvx\{/.test(css), 'las tarjetas de sesión deben tener un color por nivel y uno neutro');
ok(/body\.nv0,body\.nv1,body\.nv2,body\.nv3,body\.nv4\{background-color:color-mix/.test(css) && /function pintarNivel\(/.test(code) && /classList\.add\('nv'\+n\)/.test(code), 'toda la pantalla debe tomar el color del nivel');
ok(/id="nvbar"/.test(fs.readFileSync(file.replace(/app\.js$/, 'index.html'), 'utf8')) && /function barraNivel\(/.test(code) && /IntersectionObserver/.test(code) && /\.nvbar\{position:fixed/.test(css), 'debe haber una barra flotante con el nivel cuando el panel sale de la pantalla');
ok(/id="nvb-d"/.test(fs.readFileSync(file.replace(/app\.js$/, 'index.html'), 'utf8')) && /getElementById\('nvb-d'\)\.textContent=dm/.test(code), 'la barra flotante debe mostrar el nombre de la dimensión actual');
ok(/body\{background:#fff!important/.test(impresion), 'al imprimir el fondo debe ser blanco aunque la pantalla esté tintada');
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
  ok(Object.keys(pub).sort().join() === 'notas,perfil,respuestas', 'lo publicado solo tiene perfil, respuestas y notas');
  ok(Object.keys(pub.perfil).sort().join() === 'nombre,sector,tamaño', 'el perfil publicado no incluye email ni contacto');
  ok(!('GOB-01b' in pub.respuestas) && pub.respuestas['GOB-01'] === 3, 'no se publican respuestas de preguntas que ya no aplican');
  ok(JSON.stringify(pub).includes('nota privada') && pub.notas['GOB-01'] === 'nota privada', 'las notas de la reunión se publican: el cliente las ve');
  ok(!JSON.stringify(pub).includes('ana@acme.cl') && !JSON.stringify(pub).includes('Ana Pérez'), 'lo publicado no debe contener el email ni el contacto del cliente');
  const eN = new E2(); eN.a = { 'GOB-01': 3 }; eN.n = { 'GOB-01': ' ', 'GOB-01b': 'no aplica', 'GOB-02': 'x'.repeat(3000) };
  ok(!('GOB-01' in eN.pub().notas) && !('GOB-01b' in eN.pub().notas) && eN.pub().notas['GOB-02'].length === 2000, 'las notas vacías o de preguntas que no aplican no se publican y se limitan a 2000 caracteres');
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
  ok((reglas.match(/if true/g) || []).length === 3 && /allow get: if true/.test(reglas) && /match \/pizarra\/\{eid\} \{\s+allow get, list: if true;/.test(reglas) && /match \/partes\/\{pid\} \{\s+allow get: if true;\s+allow list: if false;/.test(reglas), 'las únicas lecturas públicas son get de un resultado compartido, su pizarra publicada y el contenido de sus documentos (todo bajo el mismo token)');
  ok(/match \/sesiones\/\{id\}\s*\{\s*allow read, write: if esConsultor\(\);/.test(reglas), 'las sesiones solo las ven los consultores');
  ok(/email_verified == true/.test(reglas) && /request\.auth\.token\.email in \[/.test(reglas), 'los consultores se validan por correo verificado en una lista');
  ok(/hasOnly\(\['perfil', 'respuestas', 'notas', 'consultor', 'publicadoEn', 'version'\]\)/.test(reglas) && /token\.size\(\) == 32/.test(reglas), 'lo compartido solo admite esos campos (incluye quién lo preparó) y un token de 32 caracteres');
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
  ok(/N\.compartir\(act\.id, \{ \.\.\.en\.pub\(\), consultor: yoConsultor\(\) \}/.test(ses), 'solo se publica lo que devuelve en.pub() más quién lo preparó (nombre y foto)');
  ok(/\^\[A-Za-z0-9_-\]\{32\}\$/.test(ses) && /new Uint8Array\(24\)/.test(nub), 'el token debe ser de 24 bytes al azar (32 caracteres) y validarse al abrir el enlace');
  ok(/clearIndexedDbPersistence/.test(nub), 'al cerrar sesión se borra la copia local de los datos');
  ok(/memoryLocalCache/.test(nub), 'el cliente no debe guardar datos en su equipo');
  const html10 = leer('public/index.html');
  ok(/name="referrer" content="no-referrer"/.test(html10) && /noindex/.test(html10), 'los enlaces con token no deben filtrarse por Referer ni indexarse');
}

seccion('11. Reunión en vivo (el cliente propone, el consultor confirma)');
{
  const raiz2 = path.resolve(path.dirname(file), '..');
  const leer2 = (f) => fs.readFileSync(path.join(raiz2, f), 'utf8').replace(/\r\n/g, '\n');
  const e = new E2(); e.a = { 'GOB-01': 3, 'GOB-01b': 2 }; e.n = { 'GOB-01': 'nota visible', 'GOB-01b': 'no aplica', 'GOB-02': '  ' };
  const st = sandbox.vivoEstado(e, 'GOB-02', 'pregunta');
  ok(st.qid === 'GOB-02' && st.fase === 'pregunta' && st.respuestas['GOB-01'] === 3 && !('GOB-01b' in st.respuestas), 'el estado en vivo lleva la pregunta actual y solo las respuestas de preguntas que aplican');
  ok(st.notas['GOB-01'] === 'nota visible' && !('GOB-01b' in st.notas) && !('GOB-02' in st.notas) && st.total === e.ga().length, 'el estado en vivo lleva las notas que aplican y no las vacías');
  ok(Object.keys(st).sort().join() === 'fase,notas,qid,respuestas,total', 'el estado en vivo no incluye puntajes, niveles ni datos de contacto');
  ok(sandbox.vivoEstado(e, null, 'resultados').qid === null && sandbox.vivoEstado(e, null).fase === 'pausa', 'sin pregunta actual el cliente ve «pausa» o «resultados»');
  const rv = leer2('firestore.d360.rules'), vj = leer2('public/vivo.js'), nb = leer2('public/nube.js'), nbp = leer2('public/nube-prueba.js'), ss2 = leer2('public/sesiones.js');
  ok(/match \/en_vivo\/\{token\}/.test(rv) && /allow list: if false;[\s\S]*allow create: if esConsultor\(\)/.test(rv.slice(rv.indexOf('en_vivo'))), 'en_vivo: no se puede listar y solo el consultor crea');
  ok(/allow delete: if esConsultor\(\);/.test(rv.slice(rv.indexOf('en_vivo'))), 'en_vivo: solo el consultor cierra (borra) la reunión');
  ok(/affectedKeys\(\);\s+return cambios\.hasOnly\(\['propuestas', 'clienteVisto'\]\)/.test(rv), 'el cliente solo puede escribir sus propuestas y la marca de conexión');
  ok(/values\(\)\.hasOnly\(\[0, 1, 2, 3\]\)/.test(rv) && /propuestas\.size\(\) <= 80/.test(rv) && /clienteVisto == request\.time/.test(rv), 'las propuestas deben ser valores 0 a 3, acotadas, y la marca de conexión debe ser la hora del servidor');
  ok(/venceEn > request\.time/.test(rv) && /d\.activo == true/.test(rv), 'el enlace en vivo debe estar activo y vigente');
  ok((rv.match(/if true/g) || []).length === 3, 'solo hay tres reglas abiertas: leer un resultado compartido, su pizarra publicada y los documentos de esa pizarra');
  ok(/new F\.FieldPath\('propuestas', qid\)/.test(nb) && /vivoCerrar/.test(nb) && /vivoCerrar/.test(nbp) && /storage/.test(nbp), 'el módulo de nube y el de prueba deben tener la reunión en vivo (el de prueba sincroniza entre pestañas)');
  ok(!/\.sc\(|\.ml\(|pintarNivel|puntaje/.test(vj.replace(/\/\*[\s\S]*?\*\//, '')), 'la vista en vivo del cliente no muestra niveles ni puntajes');
  ok(/vivoCliente\(N, P\.get\('v'\)\)/.test(ss2), 'el enlace ?v= debe abrir la vista del cliente en vivo');
  ok(/id="sv"/.test(leer2('public/index.html')) && /src="vivo\.js"/.test(leer2('public/index.html')), 'falta la pantalla o el script de la vista en vivo');
}

seccion('12. Referencias a la ley (popup con el texto oficial, enlace a la BCN y salto a la letra)');
{
  const raiz4 = path.resolve(path.dirname(file), '..');
  const leer4 = (f) => fs.readFileSync(path.join(raiz4, f), 'utf8').replace(/\r\n/g, '\n');
  const wl = {};
  vm.runInNewContext(leer4('public/ley-texto.js'), { window: wl });
  const L = wl.LEY;
  ok(L && L.v === '2026-12-01' && L.n === 141599 && L.n21 === 1209272, 'ley-texto.js debe declarar la versión 2026-12-01 de la Ley 19.628 (idNorma 141599) y la Ley 21.719 (1209272)');
  ok(Array.isArray(L.o) && L.o.length === Object.keys(L.a).length && L.o.every((k) => L.a[k]), 'el orden del articulado (o) debe coincidir con los artículos');
  ok(Object.values(L.a).every((a) => Number.isInteger(a.id) && a.t.length > 3 && a.p.length > 0 && a.p.every((p) => p.length > 0 && !/Biblioteca del Congreso|p[áa]gina \d+ de/.test(p))), 'cada artículo debe tener identificador de la BCN, título y texto limpio (sin encabezados de página)');
  ok(Object.values(L.a).every((a) => !/^Art[ií]culo/i.test(a.p[0])), 'el texto de cada artículo no debe repetir su cabecera');
  // el texto debe ser el oficial: algunos datos ya verificados contra la ley
  const T = (k) => L.a[k].p.join(' ');
  ok(L.a['4'].t === 'Derechos del titular de datos' && /treinta días corridos/.test(T('11')) && /podrá designar un delegado/.test(T('50')), 'el texto de los arts. 4, 11 y 50 no coincide con la ley (6 derechos, 30 días corridos, delegado voluntario)');
  ok(['5.000', '10.000', '20.000'].every((n) => T('35').includes(n + ' unidades tributarias mensuales')), 'el art. 35 debe traer las multas de 5.000, 10.000 y 20.000 UTM');
  ok(L.a['14 ter'].p.filter((p) => /^[a-l]\) /.test(p)).length === 12, 'el art. 14 ter debe traer sus 12 letras (a a l)');

  // detección de citas
  const tk = (t) => sandbox.leyTokens(t).join('|');
  const ls = (t) => sandbox.citasLey(t)[0].items.map((i) => i.a + ':' + i.l.join('')).join(' ');
  ok(tk('Arts. 3 a), 12 y 13') === '3|12|13' && ls('Arts. 3 a), 12 y 13') === '3:a 12: 13:', 'cita con letra y lista: «Arts. 3 a), 12 y 13»');
  ok(tk('Arts. 15 ter, 34-39 y 48-51') === '15 ter|34-39|48-51' && tk('Arts. 14 quáter a 14 sexies') === '14 quáter-14 sexies' && tk('Arts. 16 a 16 sexies') === '16-16 sexies', 'rangos con guion y entre artículos con sufijo');
  ok(tk('Arts. 4 a 11') === '4-11' && tk('Arts. 13 a) y 17 a 19') === '13|17-19' && tk('Arts. 34 a 39') === '34-39', 'los rangos «4 a 11» deben quedar como un solo rango');
  ok(ls('Art. 14 quinquies b) a d)') === '14 quinquies:bcd', 'una cita con rango de letras «b) a d)» debe resaltar b, c y d');
  ok(tk('Buena práctica; sustenta arts. 14 ter, 15 ter y 49') === '14 ter|15 ter|49' && ls('Arts. 27 y 28; 14 ter h)') === '27: 28: 14 ter:h', 'citas con punto y coma y con sufijo latino');
  ok(tk('sin ninguna referencia a la ley, solo el año 2026 y 30 días') === '' && tk('la Ley 21.719 exige') === '', 'un texto sin «art.» no debe generar citas');
  ok(/ data-a="14 ter" data-l="a" /.test(sandbox.refLey('(art. 14 ter a) obliga')) && sandbox.refLey('Arts. 4 a 11').match(/<button/g).length === 2, 'refLey debe generar un botón por artículo');

  // todas las citas reales de la aplicación: cada artículo y cada letra deben existir en el texto oficial, y refLey no debe alterar el texto
  const fuentes = [];
  for (const q of Q) { fuentes.push([q.id + ' ar', q.ar]); fuentes.push([q.id + ' cx', q.cx]); }
  for (const x of CL) fuentes.push([x.ob + ' ar', x.ar]);
  for (const d of D) fuentes.push([d.n + ' (dimensión)', d.a]);
  let nCitas = 0;
  const sinEtq = (h) => h.replace(/<button[^>]*>/g, '').replace(/<\/button>/g, '');
  for (const [donde, texto] of fuentes) {
    for (const cita of sandbox.citasLey(texto)) {
      cita.items.forEach((it, i) => {
        nCitas++;
        ok(L.a[it.a], donde + ': el art. ' + it.a + ' no existe en el texto oficial');
        if (it.rango) ok(L.o.indexOf(cita.items[i - 1].a) >= 0 && L.o.indexOf(cita.items[i - 1].a) <= L.o.indexOf(it.a), donde + ': rango de artículos inválido ' + cita.items[i - 1].a + ' a ' + it.a);
        for (const l of it.l) ok(L.a[it.a] && L.a[it.a].p.some((p) => p.startsWith(l + ') ')), donde + ': el art. ' + it.a + ' no tiene la letra ' + l + ')');
      });
    }
    ok(sinEtq(sandbox.refLey(texto)) === texto, donde + ': refLey alteró el texto');
    ok(!/<button[^>]*>[^<]*<button/.test(sandbox.refLey(texto)), donde + ': botones anidados');
  }
  ok(nCitas > 100, 'se esperaban más de 100 citas a artículos en las preguntas (hay ' + nCitas + ')');
  // toda pregunta cuya referencia nombra un artículo debe tener al menos un botón en «por qué se pregunta esto»
  for (const q of Q) ok(/<button[^>]*class="ref"/.test(sandbox.refLey(q.ar)), q.id + ': su referencia legal «' + q.ar + '» no genera ningún botón');

  // interfaz: diálogo, carga diferida, enlace directo a la BCN y accesibilidad
  const ih = leer4('public/index.html'), lj = leer4('public/ley.js'), aj = leer4('public/app.js'), vj2 = leer4('public/vivo.js'), cs = leer4('public/styles.css');
  ok(/<dialog[^>]*id="dlg-ley"[^>]*aria-labelledby="ley-t"/.test(ih) && /src="ley\.js"/.test(ih), 'falta el diálogo de la ley o su script en index.html');
  ok(!/ley-texto\.js/.test(ih) && /ley-texto\.js/.test(lj), 'el texto de la ley (150 KB) debe cargarse solo al abrir el popup, no con la página');
  ok(/idNorma=\$\{LEY\.n\}&idVersion=\$\{LEY\.v\}&idParte=\$\{a\.id\}/.test(lj), 'el enlace a la BCN debe llevar idNorma, idVersion e idParte (abre el artículo directo)');
  ok((lj.match(/target="_blank"/g) || []).length === (lj.match(/rel="noopener noreferrer"/g) || []).length, 'todo enlace externo debe llevar rel="noopener noreferrer"');
  ok(/showModal\(\)/.test(lj) && !/\beval\(|document\.write\(/.test(lj), 'el diálogo debe ser modal y no usar eval/document.write');
  ok(/refLey\(q\.ar,leyRel\(q\)\)[\s\S]*refLey\(q\.cx,leyRel\(q\)\)/.test(aj) && /refLey\(q\.ar, leyRel\(q\)\)[\s\S]*refLey\(q\.cx, leyRel\(q\)\)/.test(vj2), 'la referencia y la explicación legal deben ser clicables en el panel del consultor y en el del cliente');
  ok(/@media print\{\.ref\{[^}]*text-decoration:none/.test(cs), 'en el PDF las referencias deben verse como texto normal');
  ok(!/<button[^>]*class="ref"/.test(leer4('public/app.js').split('function refLey')[0].replace(/'<button type="button" class="ref"/g, '')), 'no debe haber botones .ref escritos a mano');
}

seccion('13. ISO/IEC 25010: usabilidad (navegación, operabilidad) y adaptabilidad (multidispositivo)');
{
  const raiz5 = path.resolve(path.dirname(file), '..');
  const leer5 = (f) => fs.readFileSync(path.join(raiz5, f), 'utf8').replace(/\r\n/g, '\n');
  const ih = leer5('public/index.html'), cs = leer5('public/styles.css'), aj = leer5('public/app.js');
  // ── Adaptabilidad ──
  const vp = (ih.match(/<meta name="viewport" content="([^"]*)"/) || [])[1] || '';
  ok(/width=device-width/.test(vp) && /initial-scale=1/.test(vp), 'falta el viewport responsivo');
  ok(!/maximum-scale|user-scalable\s*=\s*(no|0)/i.test(vp), 'el viewport no debe impedir el zoom del usuario (WCAG 1.4.4)');
  ok(/viewport-fit=cover/.test(vp) && /env\(safe-area-inset-left/.test(cs) && /env\(safe-area-inset-bottom/.test(cs), 'debe respetar las áreas seguras (muesca, barra de gestos)');
  const mq = [...cs.matchAll(/@media\s*([^{]+)\{/g)].map((m) => m[1].replace(/\s+/g, ' ').trim());
  const tiene = (re) => mq.some((q) => re.test(q));
  ok(tiene(/max-width:\s*380px/) && tiene(/max-width:\s*640px/), 'faltan los puntos de quiebre de teléfono (380 y 640 px)');
  ok(tiene(/min-width:\s*641px\) and \(max-width:\s*1024px/), 'falta el punto de quiebre de tableta (641–1024 px)');
  ok(tiene(/max-height:\s*500px\) and \(orientation:\s*landscape/), 'falta la regla para teléfono en horizontal (poca altura)');
  ok(tiene(/prefers-reduced-motion/) && tiene(/prefers-color-scheme:\s*dark/) && tiene(/forced-colors/) && tiene(/^print/), 'faltan preferencias del usuario: movimiento reducido, tema oscuro, alto contraste forzado o impresión');
  ok(/min-height:100dvh/.test(cs), 'la altura mínima debe usar dvh (barra de direcciones del móvil)');
  ok(/button,a,label\.opt,input,select,summary,\[role=tab\]\{touch-action:manipulation\}/.test(cs), 'los controles táctiles deben usar touch-action: manipulation');
  ok(/\.tb\{flex-wrap:wrap;overflow-x:visible\}/.test(cs), 'en el teléfono todas las pestañas de resultados deben verse (sin scroll horizontal oculto)');
  ok(!/(^|[^-])width:\s*\d{4,}px/.test(cs.replace(/@media[^{]+\{/g, '')), 'no deben quedar anchos fijos de 1000 px o más');
  // ── Usabilidad: tamaño de los objetivos táctiles (≥ 44 px) ──
  const alto = (clase) => {
    let mejor = 0;
    for (const m of cs.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!new RegExp('(^|[\\s,])' + clase.replace('.', '\\.') + '(?![\\w-])').test(m[1])) continue;
      for (const d of m[2].matchAll(/(?:^|;)\s*(?:min-)?height:\s*(\d+)px/g)) mejor = Math.max(mejor, +d[1]);
    }
    return mejor;
  };
  for (const cl of ['.opt-i', '.pb-x', '.lb-btn', '.btn-go', '.bq', '.be', '.bc', '.tbtn', '.dlg-x', '.ley-chip', '.theme-btn']) ok(alto(cl) >= 44, 'el control ' + cl + ' mide menos de 44 px de alto (' + alto(cl) + ' px)');
  // ── Usabilidad: navegación ──
  ok(/<nav class="qn" aria-label="Navegación entre preguntas">/.test(aj) && /\.qn\{display:block;position:sticky;bottom:0/.test(cs), 'la barra Atrás/Siguiente debe quedar fija al pie (sticky) y ser una región <nav>');
  ok(/\.qn:has\(#bnx:disabled\) \.qn-h\{display:block\}/.test(cs) && /Elija una respuesta para continuar/.test(aj), 'si «Siguiente» está desactivado debe decir por qué');
  ok(/<nav class="pp-act" aria-label="Herramientas de la sesión">/.test(ih), 'los accesos del panel (índice, sesiones, en vivo) deben ser una región <nav>');
  ok(/html\{scroll-padding-top:\d+px;scroll-padding-bottom:\d+px\}/.test(cs), 'la cabecera y la barra fijas no deben tapar el elemento enfocado (scroll-padding)');
  ok(/lang="es"/.test(ih) && /class="skip" href="#main"/.test(ih) && /<main[^>]*id="main"/.test(ih), 'faltan el idioma, el enlace «Saltar al contenido» o el <main>');
  for (const id of ['s0', 'sd', 'se', 's1', 's2', 'sv', 's3']) {
    const i = ih.indexOf('id="' + id + '" class="screen'), j = ih.indexOf('class="screen', i + 10);
    ok(i > 0 && /<h1[ >]/.test(ih.slice(i, j > 0 ? j : undefined)), 'la pantalla ' + id + ' debe tener un <h1> (estructura de encabezados)');
  }
  ok(/prev\.closest&&prev\.closest\('\.screen'\)[\s\S]*h\.focus\(\{preventScroll:true\}\)/.test(aj), 'al cambiar de pantalla el foco debe pasar al encabezado de la nueva (no perderse)');
  ok(!/tabindex="[1-9]/.test(ih + aj), 'no debe haber tabindex positivo (rompe el orden de tabulación)');
  ok(/@keyframes/.test(cs) && /\.sr-only\{/.test(cs) && /:focus-visible/.test(cs), 'faltan estilos de foco visible o de texto solo para lector de pantalla');
}

seccion('14. Pizarra compartida (comentarios con autor e imágenes)');
{
  const raiz6 = path.resolve(path.dirname(file), '..');
  const leer6 = (f) => fs.readFileSync(path.join(raiz6, f), 'utf8').replace(/\r\n/g, '\n');
  const sb = sandbox;
  const img = 'data:image/jpeg;base64,' + 'A'.repeat(200);
  const base = { id: 'abcdefghijKLMNOPQR12', autor: 'Marcela Soto', rol: 'cliente', qid: 'GOB-01', texto: 'Hola', imgs: [], creadoEn: 1700000000000 };
  // validación de un comentario
  ok(sb.pzValidar(base) === '' && sb.pzValidar({ ...base, texto: '', imgs: [img] }) === '', 'un comentario con texto, o solo con imagen, es válido');
  ok(sb.pzValidar({ ...base, texto: '  ' }) !== '' && sb.pzValidar({ ...base, autor: '' }) !== '', 'un comentario vacío o sin autor no es válido');
  ok(sb.pzValidar({ ...base, texto: 'x'.repeat(2001) }) !== '' && sb.pzValidar({ ...base, texto: 'x'.repeat(2000) }) === '', 'el texto admite hasta 2000 caracteres');
  ok(sb.pzValidar({ ...base, imgs: [img, img, img, img] }) !== '' && sb.pzValidar({ ...base, imgs: [img, img, img] }) === '', 'hasta 3 imágenes por comentario');
  ok(sb.pzValidar({ ...base, imgs: ['javascript:alert(1)'] }) !== '' && sb.pzValidar({ ...base, imgs: ['data:image/svg+xml;base64,AAAA'] }) !== '' && sb.pzValidar({ ...base, imgs: ['data:image/jpeg;base64,' + 'A'.repeat(240000)] }) !== '', 'solo se aceptan JPEG en data URL y de hasta 240.000 caracteres');
  // dibujo: todo lo que escribe una persona debe ir escapado
  const mal = { ...base, id: 'a"b', autor: '<img src=x onerror=alert(1)>', cargo: '<b>Jefe</b>', texto: '<script>alert(1)</script> & "comillas"', imgs: [img, 'javascript:alert(1)', 'data:text/html;base64,AAAA'] };
  const html = sb.pzTarjeta(mal, { borrar: true });
  ok(!/<script|<img src=x|<b>Jefe/.test(html) && /&lt;script&gt;/.test(html) && /&lt;img src=x onerror/.test(html), 'el texto, el autor y el cargo de un comentario se escapan (sin HTML ni scripts)');
  ok((html.match(/<img src="/g) || []).length === 1 && !/javascript:|text\/html/.test(html), 'solo se dibujan las imágenes JPEG válidas; una URL javascript: o text/html se descarta');
  ok(/data-e="a&quot;b"/.test(html) && !/data-e="a"b"/.test(html), 'el id del comentario no puede romper el atributo HTML');
  ok(/pz-del/.test(html) && !/pz-del/.test(sb.pzTarjeta(base)), 'el botón Eliminar solo aparece cuando se pide (consultor)');
  ok(/Consultor/.test(sb.pzTarjeta({ ...base, rol: 'consultor' })) && /Cliente/.test(html), 'cada comentario muestra si lo escribió el consultor o el cliente');
  ok(sb.pzIniciales('Marcela Soto') === 'MS' && sb.pzIniciales('Ana') === 'A' && sb.pzIniciales('') === '?', 'iniciales del avatar');
  ok(sb.pzCuando(Date.now()) === 'ahora' && /hace 5 min/.test(sb.pzCuando(Date.now() - 5 * 60000)) && /hace 3 h/.test(sb.pzCuando(Date.now() - 3 * 3600000)), 'tiempo relativo');
  // agrupar por pregunta en el orden del cuestionario
  const g = sb.pzAgrupar([{ ...base, qid: Q[5].id }, { ...base, qid: 'general' }, { ...base, qid: Q[1].id }, { ...base, qid: Q[5].id }]);
  ok(g.map((x) => x.qid).join() === ['general', Q[1].id, Q[5].id].join() && g[2].items.length === 2, 'la pizarra general va primero y luego cada pregunta en el orden del cuestionario');
  ok(/Pizarra general/.test(sb.pzHtml([{ ...base, qid: 'general' }])) && sb.pzHtml([]) === '', 'pzHtml agrupa y no dibuja nada si no hay comentarios');

  // reglas de seguridad (la prueba de comportamiento está en scripts/probar-reglas.mjs)
  const rv = leer6('firestore.d360.rules');
  ok(/match \/sesiones\/\{id\} \{[\s\S]*?match \/pizarra\/\{eid\} \{\s+allow read, write: if esConsultor\(\);/.test(rv), 'sesiones/{id}/pizarra: solo consultores');
  ok(/match \/en_vivo\/\{token\} \{[\s\S]*?match \/pizarra\/\{eid\} \{[\s\S]*?allow update: if false;[\s\S]*?allow delete: if esConsultor\(\);/.test(rv), 'en_vivo/{token}/pizarra: los comentarios no se editan y solo el consultor borra');
  ok(/rol == 'consultor'\s+&& request\.resource\.data\.email == request\.auth\.token\.email/.test(rv) && /rol == 'cliente'\s+&& !\('email' in request\.resource\.data\)\s+&& enlaceVigente\(\)/.test(rv), 'un cliente solo puede comentar como cliente (sin email) y con el enlace vigente; el consultor, con su propio correo');
  ok(/d\.texto\.size\(\) <= 2000/.test(rv) && /l\.size\(\) <= 3/.test(rv) && /s\.size\(\) <= 240000/.test(rv) && /d\.autor\.size\(\) <= 60/.test(rv) && /esIdPz/.test(rv), 'las reglas limitan texto, imágenes, nombre e id');
  ok(/match \/compartidos\/\{token\} \{[\s\S]*?match \/pizarra\/\{eid\} \{\s+allow get, list: if true;\s+allow create, update, delete: if esConsultor\(\) && esIdPz\(eid\);/.test(rv), 'compartidos/{token}/pizarra: lectura por enlace y escritura solo del consultor');
  ok(fs.existsSync(path.join(raiz6, 'scripts/probar-reglas.mjs')), 'falta scripts/probar-reglas.mjs (prueba de comportamiento de las reglas)');

  // la capa de nube real y la de prueba deben tener las mismas funciones de pizarra
  const exp = (t) => [...t.matchAll(/export (?:async function |const )(pz\w+)/g)].map((m) => m[1]).sort().join();
  const nb = leer6('public/nube.js'), nbp = leer6('public/nube-prueba.js');
  ok(exp(nb) === exp(nbp) && exp(nb).split(',').length >= 11, 'nube.js y nube-prueba.js deben exportar las mismas funciones pz* (hoy: ' + exp(nb) + ' / ' + exp(nbp) + ')');
  ok(/F\.writeBatch/.test(nb) && /F\.serverTimestamp\(\)/.test(nb.slice(nb.indexOf('pzGuardar'))), 'el comentario del consultor se escribe en la sesión y en la reunión en vivo en una sola operación, con la hora del servidor');

  // pantalla e integración
  const ih = leer6('public/index.html'), pj = leer6('public/pizarra.js'), ss3 = leer6('public/sesiones.js'), vj3 = leer6('public/vivo.js'), aj3 = leer6('public/app.js');
  ok(/id="dlg-pz"/.test(ih) && /id="dlg-img"/.test(ih) && /id="dlg-nombre"/.test(ih) && /id="bpz"/.test(ih), 'faltan los diálogos o el botón de la pizarra en index.html');
  ok(ih.indexOf('src="pizarra.js"') > ih.indexOf('src="app.js"') && ih.indexOf('src="pizarra.js"') < ih.indexOf('src="sesiones.js"'), 'pizarra.js debe cargarse después de app.js y antes de sesiones.js');
  ok(/pzMontar\('pz-slot',q\.id\)/.test(aj3) && /pzMontar\('pz-slot', q\.id\)/.test(vj3) && /id="pz-slot"/.test(aj3) && /id="pz-slot"/.test(vj3), 'la pregunta del consultor y la del cliente deben montar la pizarra');
  ok(/typeof en !== 'undefined' && en\.viv/.test(pj) && !/window\.en\b/.test(pj), '`en` no es propiedad de window: debe usarse typeof en');
  ok(/d\.length <= 200000/.test(pj) && /image\/jpeg/.test(pj), 'las imágenes se reducen a JPEG de hasta 200.000 caracteres antes de enviarse');
  ok(/PZ\.sincronizarVivo\(\)[\s\S]{0,80}pzVivoLimpiar[\s\S]{0,80}vivoCerrar/.test(ss3), 'al terminar la reunión se copia a la sesión lo que escribieron los clientes antes de borrar la pizarra en vivo');
  ok(/pzPublicar\(tk, PZ\.entries, act\.id\)/.test(ss3) && /pzBorrarCompartido/.test(ss3) && /pzLeerCompartido\(tk\)/.test(ss3), 'publicar sube la pizarra, revocar la retira y el cliente la lee en sus resultados');
  ok(/PZ\.cliente\(N, tk\);/.test(vj3) && /PZ\.pedirPersona\(\)\.then\(barra\)/.test(vj3) && /onsubmit|f\.onsubmit/.test(pj) && /oncancel/.test(pj), 'el cliente debe escribir su nombre antes de comentar');
  ok(!/innerHTML\s*=[^;]*\be\.(texto|autor|cargo)\b/.test(pj), 'pizarra.js no debe insertar texto de un comentario sin escapar');
  ok(/@media print\{[^}]*\.pz-slot/.test(leer6('public/styles.css')), 'en el PDF no deben salir el formulario ni los botones de la pizarra');
}

seccion('15. Usuario conectado en la barra superior (foto de Google, nombre y rol)');
{
  const raiz7 = path.resolve(path.dirname(file), '..');
  const leer7 = (f) => fs.readFileSync(path.join(raiz7, f), 'utf8').replace(/\r\n/g, '\n');
  const sb = sandbox, G = 'https://lh3.googleusercontent.com/a/ACg8ocKexample=s96-c';
  ok(sb.avFoto(G) === G && sb.avFoto('https://lh3.googleusercontent.com/a-/AOh14Gx') !== '', 'se acepta una foto https de googleusercontent.com');
  ok(['http://lh3.googleusercontent.com/a', 'https://evil.example.com/p.png', 'https://googleusercontent.com.evil.example/a', 'https://googleusercontent.com/a', 'javascript:alert(1)', 'data:image/png;base64,AAAA', 'https://lh3.googleusercontent.com/a"onerror="x', "https://lh3.googleusercontent.com/a'b", 'https://lh3.googleusercontent.com/a b', 'https://lh3.googleusercontent.com/' + 'a'.repeat(400), '', null, 5].every((f) => sb.avFoto(f) === ''), 'se rechazan fotos http, de otros dominios, con comillas o espacios, demasiado largas o que no son texto');
  const h = sb.personaHtml({ nombre: '<img src=x onerror=alert(1)> Ana', foto: G, rol: 'Consultor', sub: 'a@b.cl' });
  ok(!/<img src=x/.test(h) && /&lt;img src=x/.test(h) && /referrerpolicy="no-referrer"/.test(h) && h.includes(G), 'el nombre se escapa y la foto se pide sin enviar la dirección de esta página');
  ok(!/<img /.test(sb.personaHtml({ nombre: 'Ana Pérez', foto: 'https://evil.example.com/p.png' })) && /<b>AP<\/b>/.test(sb.personaHtml({ nombre: 'Ana Pérez' })), 'sin foto válida se muestran las iniciales');
  ok(/<em>Conduce<\/em> Carlos/.test(sb.personaHtml({ nombre: 'Carlos', etq: 'Conduce' })), 'la persona puede llevar una etiqueta («Conduce», «Preparado por»)');
  const ih = leer7('public/index.html'), cs = leer7('public/styles.css'), ss4 = leer7('public/sesiones.js'), vj4 = leer7('public/vivo.js'), rv = leer7('firestore.d360.rules'), nb = leer7('public/nube.js'), pj = leer7('public/pizarra.js');
  ok(/id="uchip"[^>]*role="group"/.test(ih) && /id="upers"/.test(ih) && /id="uout"/.test(ih), 'la barra superior debe tener el bloque de usuario (uchip, upers, uout)');
  ok(!/\.cliente \.uchip/.test(cs) && !/\.uemail/.test(cs), 'la barra del usuario no debe ocultarse para el cliente ni dejar el correo oculto en pantallas medianas');
  ok(/\.upn\{position:absolute;width:1px/.test(cs), 'en el teléfono se ve la foto y el nombre queda para lectores de pantalla');
  ok(/photoURL/.test(nb), 'nube.js debe entregar la foto de la cuenta de Google');
  ok(/usuarioBarra\(\{ yo: \{ nombre: user\.nombre \|\| user\.email, foto: user\.foto, rol: 'Consultor'/.test(ss4) && /usuarioBarra\(null\)/.test(ss4), 'el consultor ve su foto, nombre, rol y correo en la barra');
  ok(/consultor: yoConsultor\(\)/.test(ss4) && /avFoto\(user\.foto\)/.test(ss4), 'la reunión en vivo y los resultados publicados llevan el nombre y la foto de quien los conduce');
  ok(/conduce = d\.consultor/.test(vj4) && /usuarioBarra\(\{ con:/.test(vj4) && /etq: 'Conduce'/.test(vj4) && /pzPersonaCambio = barra/.test(vj4), 'el cliente ve en la barra quién conduce la reunión y su propio nombre');
  ok(/etq: 'Preparado por'/.test(ss4), 'en los resultados el cliente ve quién los preparó');
  ok(/function fotoOk\(f\)[\s\S]{0,200}googleusercontent/.test(rv) && /function consultorOk/.test(rv) && /d\.rol == 'consultor' && fotoOk\(d\.foto\)/.test(rv), 'las reglas solo admiten fotos de googleusercontent.com y solo en comentarios del consultor');
  ok(/foto: avFoto\(u\.foto\) \|\| undefined/.test(pj), 'los comentarios del consultor llevan su foto (validada)');
  ok(/@media print\{\.uchip\{display:none!important\}\}/.test(cs), 'en el PDF no sale la barra de usuario');
}

seccion('16. Metodología: la explicación coincide con el cálculo real');
{
  const raiz8 = path.resolve(path.dirname(file), '..');
  const leer8 = (f) => fs.readFileSync(path.join(raiz8, f), 'utf8').replace(/\r\n/g, '\n');
  const sb = sandbox;
  const armar = (perfil, f) => { const e = new E2(); e.p = perfil; Q.filter((q) => !q.iS).forEach((q, i) => { e.a[q.id] = f(q, i); }); return e; };
  const e1 = armar({ sector: 'salud', 'tamaño': 'micro' }, (q, i) => (i * 7 + 1) % 4);
  // 1) las cifras de la tabla son las del motor
  const m = sb.metDatos(e1), sc = e1.sc();
  ok(m.filas.length === D.length && m.filas.every((f) => f.pt === sc.d[f.d.id]), 'la tabla de metodología usa los puntajes reales de cada dimensión');
  ok(m.filas.every((f) => f.mx === 0 || Math.round(f.sm / f.mx * 100) === f.pt), 'puntaje de la dimensión = Σ(valor×peso) ÷ Σ(3×peso) × 100 (redondeado)');
  ok(Math.abs(m.filas.reduce((t2, f) => t2 + f.ap, 0) - sc.g) <= 0.5, 'los aportes de las dimensiones suman el puntaje global (±0,5 por el redondeo): ' + m.filas.reduce((t2, f) => t2 + f.ap, 0).toFixed(2) + ' vs ' + sc.g);
  const e0 = new E2(); const m0 = sb.metDatos(e0);
  ok(m0.sc.g === 0 && m0.filas.every((f) => f.rs === 0 && f.pt === 0 && f.ap === 0), 'sin respuestas todo vale 0 (una dimensión sin respuestas cuenta como 0%)');
  // 2) el rubro y el tamaño NO cambian el resultado (si algún día cambian, hay que actualizar la sección 6 de metHtml y esta prueba)
  const e2 = armar({ sector: 'finanzas', 'tamaño': 'grande' }, (q, i) => (i * 7 + 1) % 4);
  const huella = (e) => JSON.stringify([e.sc(), e.res(), e.fl(), e.cl2(), e.pl().map((p) => [p.d.id, p.s, p.rk]), e.ga().map((q) => q.id)]);
  ok(huella(e1) === huella(e2), 'con las mismas respuestas, el puntaje, el nivel, las banderas, el semáforo, el plan y las preguntas son idénticos para cualquier rubro y tamaño');
  const gid = sb.document.getElementById; sb.document.getElementById = () => ({ ...el(), options: [] }); // lbl() lee las opciones del <select>
  const html = sb.metHtml(e1);
  sb.document.getElementById = gid;
  ok(/no modifican el puntaje ni el nivel/.test(html) && /ley 20\.416|Ley 20\.416/.test(html) && /la actividad que desarrolla/.test(html) && /artículo sexto transitorio/.test(html), 'la metodología dice que el rubro y el tamaño no cambian el puntaje, y explica por qué sí importan para la ley (art. 14 septies y sexto transitorio)');
  ok(/class="ref"[^>]*data-a="14 septies"/.test(html), 'la mención al art. 14 septies abre el texto de la ley');
  // 3) lo que el texto afirma coincide con los datos y el motor
  const ws = Q.map((q) => q.w);
  ok(Math.min(...ws) === 0.8 && Math.max(...ws) === 1.3 && /de 0,8 a 1,3/.test(html), 'los pesos de las preguntas van de 0,8 a 1,3 (como dice el texto)');
  ok([[20, 0], [21, 1], [40, 1], [41, 2], [60, 2], [61, 3], [80, 3], [81, 4], [100, 4]].every(([p, n]) => e0.ml(p).n === n) && /0 a 20/.test(html) && /21 a 40/.test(html) && /41 a 60/.test(html) && /61 a 80/.test(html) && /81 a 100/.test(html), 'los rangos de los niveles del texto son los del motor');
  const codigo = leer8('public/app.js');
  ok(/if\(s>=80\)continue;let rk='MEDIO',rc='rme';if\(s<=30\)\{rk='CRÍTICO'/.test(codigo) && /else if\(s<=55\)\{rk='ALTO'/.test(codigo) && /hasta 30%/.test(html) && /hasta 55%/.test(html) && /por debajo de 80%/.test(html), 'los umbrales del plan de acción del texto (80, 30 y 55) son los del motor');
  ok(new Set(CL.map((c2) => c2.tV)).size === 1 && new Set(CL.map((c2) => c2.tY)).size === 1 && new RegExp(CL[0].tV + ' o más es <em>Cumple').test(html) && new RegExp(CL[0].tY + ' o más es <em>Parcial').test(html), 'los umbrales del semáforo del texto son los de las obligaciones');
  ok(Q.filter((q) => q.cd).every((q) => q.cd.lt === 2) && /menor a 2/.test(html), 'el umbral de las preguntas de profundización del texto es el de los datos');
  ok(new RegExp(Q.filter((q) => !q.iS).length + ' preguntas base').test(html) && new RegExp('más ' + Q.filter((q) => q.iS).length + ' de profundización').test(html), 'el texto cuenta bien las preguntas base y de profundización');
  ok(/Σ \(valor × peso\)/.test(html) && /Σ \(puntaje de la dimensión × peso de la dimensión\)/.test(html), 'las dos fórmulas aparecen en el texto');
  // 4) pantalla
  const ih = leer8('public/index.html'), cs = leer8('public/styles.css');
  ok(/\['t7','calculator','Método',''\]/.test(codigo) && /id=\\"t7\\" role=\\"tabpanel\\"/.test(codigo.replace(/"/g, '\\"').replace(/\\\\"/g, '\\"')) || /id="t7"/.test(codigo), 'la pestaña «Método» está en los resultados');
  ok(/id="dlg-met"/.test(ih) && /id="bmet"/.test(ih) && /function metDlg\(\)/.test(codigo), 'el consultor puede abrir la metodología desde la pregunta («Cómo se calcula»)');
  ok(/@media print\{#t7,#bmet\{display:none!important\}\}/.test(cs), 'la metodología no sale en el PDF (no cambia su paginación)');
}

seccion('17. Documentos adjuntos (PDF, Word, Excel…) y pegado');
{
  const raiz9 = path.resolve(path.dirname(file), '..');
  const leer9 = (f) => fs.readFileSync(path.join(raiz9, f), 'utf8').replace(/\r\n/g, '\n');
  const sb = sandbox;
  const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31], PK = [0x50, 0x4b, 0x03, 0x04], OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1], EXE = [0x4d, 0x5a, 0x90, 0x00], TXT = [0x48, 0x6f, 0x6c, 0x61];
  // tipo y contenido deben corresponderse
  ok(sb.pzTipoAdj('Politica.pdf', PDF) === '' && sb.pzTipoAdj('INFORME.PDF', PDF) === '', 'un PDF con firma %PDF se acepta (también en mayúsculas)');
  ok(['a.docx', 'b.xlsx', 'c.pptx', 'd.odt', 'e.ods', 'f.odp', 'g.zip'].every((n) => sb.pzTipoAdj(n, PK) === '') && ['a.doc', 'b.xls', 'c.ppt'].every((n) => sb.pzTipoAdj(n, OLE) === ''), 'Word, Excel y PowerPoint (nuevos y antiguos), OpenOffice y ZIP se aceptan con su firma');
  ok(sb.pzTipoAdj('datos.csv', TXT) === '' && sb.pzTipoAdj('nota.txt', TXT) === '' && sb.pzTipoAdj('a.rtf', [0x7b, 0x5c, 0x72, 0x74, 0x66]) === '', 'CSV, texto y RTF se aceptan');
  ok(['virus.exe', 'macro.xlsm', 'macro.docm', 'pagina.html', 'grafico.svg', 'script.js', 'accesos.lnk', 'instalar.msi', 'run.bat', 'sin_extension', 'informe.pdf.exe', 'x.PDF.vbs'].every((n) => sb.pzTipoAdj(n, PDF) !== ''), 'se rechazan ejecutables, archivos con macros, HTML, SVG, scripts y nombres sin extensión permitida');
  ok(sb.pzTipoAdj('falso.pdf', EXE) !== '' && sb.pzTipoAdj('falso.docx', EXE) !== '' && sb.pzTipoAdj('falso.csv', EXE) !== '' && sb.pzTipoAdj('falso.txt', [0x7f, 0x45, 0x4c, 0x46]) !== '', 'un ejecutable (MZ, ELF) disfrazado con extensión permitida se rechaza');
  ok(sb.pzTipoAdj('falso.pdf', PK) !== '' && sb.pzTipoAdj('falso.docx', PDF) !== '' && sb.pzTipoAdj('falso.xls', PK) !== '' && sb.pzTipoAdj('falso.csv', PK) !== '', 'si el contenido no corresponde a la extensión se rechaza');
  // nombres y tamaños
  ok(sb.pzNombreSeguro('../../etc/pass:wd?.pdf') === 'etc pass wd .pdf' || !/[\/\\:?]/.test(sb.pzNombreSeguro('../../etc/pass:wd?.pdf')), 'el nombre de descarga no lleva rutas ni caracteres peligrosos');
  ok(sb.pzNombreSeguro('a'.repeat(300) + '.pdf').length <= 120 && sb.pzNombreSeguro('a'.repeat(300) + '.pdf').endsWith('.pdf') && sb.pzNombreSeguro('') === 'archivo', 'el nombre se acorta a 120 conservando la extensión');
  ok(sb.pzTam(500) === '500 B' && sb.pzTam(2048) === '2 KB' && sb.pzTam(1572864) === '1,5 MB', 'tamaños legibles');
  ok(sb.pzPartes(1) === 1 && sb.pzPartes(5242880) === 10 && sb.pzPartes(525000) === 1 && sb.pzPartes(525001) === 2, 'un archivo de 5 MB cabe en 10 partes de 700.000 caracteres (base64)');
  // validación del comentario
  const base = { id: 'abcdefghijKLMNOPQR12', autor: 'Ana', rol: 'cliente', qid: 'general', texto: '', creadoEn: 1 };
  const adj = { n: 'Inventario.xlsx', t: 'x', z: 120000, p: 1 };
  ok(sb.pzValidar({ ...base, adjuntos: [adj] }) === '' && sb.pzValidar({ ...base, adjuntos: [adj, adj, adj] }) === '' && sb.pzValidar({ ...base, adjuntos: [adj, adj, adj, adj] }) !== '', 'un comentario puede tener solo documentos, hasta 3');
  ok(sb.pzValidar({ ...base, adjuntos: [{ ...adj, z: 5242881, p: 10 }] }) !== '' && sb.pzValidar({ ...base, adjuntos: [{ ...adj, n: 'x.exe' }] }) !== '' && sb.pzValidar({ ...base, adjuntos: [{ ...adj, p: 3 }] }) !== '' && sb.pzValidar({ ...base, adjuntos: [{ ...adj, z: 0 }] }) !== '', 'se rechazan documentos de más de 5 MB, de tipo no permitido, con un número de partes que no corresponde o vacíos');
  // dibujo
  const h = sb.pzTarjeta({ ...base, id: 'a"b', adjuntos: [{ ...adj, n: '<img src=x onerror=alert(1)>.pdf' }, { n: 'malo.exe', z: 10, p: 1 }, adj] });
  ok(!/<img src=x/.test(h) && (h.match(/class="pz-file"/g) || []).length === 2 && /data-i="2"/.test(h) && /XLSX · 117 KB/.test(h), 'los documentos se dibujan escapados, solo los válidos, con su posición original, tipo y tamaño');
  ok(/title="Archivo enviado por un participante del cliente/.test(h) && !/title="Archivo enviado/.test(sb.pzTarjeta({ ...base, rol: 'consultor', adjuntos: [adj] })), 'los archivos de un cliente llevan el aviso de abrirlos con precaución');

  // reglas, datos y pantalla
  const rv = leer9('firestore.d360.rules'), nb = leer9('public/nube.js'), nbp = leer9('public/nube-prueba.js'), pj = leer9('public/pizarra.js'), cs = leer9('public/styles.css');
  ok(/function adjuntoPz\(a\)[\s\S]*?pdf\|doc\|docx\|xls\|xlsx\|ppt\|pptx\|odt\|ods\|odp\|csv\|txt\|rtf\|zip/.test(rv) && !/xlsm|docm|exe|html|svg/.test(rv.slice(rv.indexOf('function adjuntoPz'), rv.indexOf('function partePz'))), 'las reglas solo permiten las extensiones de la lista segura (sin macros, ejecutables, HTML ni SVG)');
  ok(/a\.z <= 5242880/.test(rv) && /a\.p <= 10/.test(rv) && /d\.d\.size\(\) <= 700000/.test(rv) && (rv.match(/\^\[0-2\]_\[0-9\]\$/g) || []).length >= 2, 'las reglas limitan el tamaño (5 MB), las partes (10 de 700.000) y su índice');
  const exp = (x) => [...x.matchAll(/export (?:async function |const )(pz\w+)/g)].map((m) => m[1]).sort().join();
  ok(exp(nb) === exp(nbp) && /pzSubirParte/.test(exp(nb)) && /pzLeerParte/.test(exp(nb)) && /pzCopiarPartes/.test(exp(nb)), 'nube.js y nube-prueba.js tienen las mismas funciones, incluidas las de partes de archivo');
  ok(/await subirPartes\(c, docs[\s\S]*?limpiar\(\);[\s\S]*?enviar\(c\)/.test(pj), 'el contenido de los documentos se sube completo antes de crear el comentario');
  ok(/await PZS\.N\.pzSubirParte\(amb, clave, c\.id/.test(pj) && /pzCopiarPartes\(\['vivo', PZS\.vivoTk\], \['ses', PZS\.sid\], e\)[\s\S]{0,80}pzEspejar/.test(pj), 'lo que sube un cliente se copia a la sesión (contenido primero, luego el comentario)');
  ok(/document\.addEventListener\('paste'/.test(pj) && /e\.clipboardData \? e\.clipboardData\.files/.test(pj) && /v\.agregarArchivos\(fs\)/.test(pj), 'se puede pegar (Ctrl+V) un archivo o una captura en cualquier parte de la pantalla');
  ok(/PZ_EXT\[pzExt\(a\.n\)\] \|\| 'application\/octet-stream'/.test(pj) && !/text\/html/.test(pj), 'al descargar, el tipo sale de la extensión permitida y nunca de lo que declara el archivo');
  ok(/pzBorrar\(PZS\.sid, ent,/.test(pj) && /idsPartes\(e\)/.test(nb) && /quitarPartes\(p, 'ses', sid, e\)/.test(nbp), 'borrar un comentario borra también el contenido de sus documentos');
  ok(/@media print\{\.pz-file\{/.test(cs), 'los documentos adjuntos no rompen el PDF');
}

console.log('\n' + (fallos ? '✗ ' + fallos + ' problema(s)' : '✓ Todas las verificaciones pasaron'));
process.exit(fallos ? 1 : 0);
