// Verifica la integridad de los datos y el motor del D360° (npm run verificar). Uso: node scripts/verificar.mjs [ruta a app.js]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const file = process.argv[2] || 'public/app.js';
const code = fs.readFileSync(file, 'utf8');
const codigoRuta = ['ruta.js', 'servicio.js'].map((f) => fs.readFileSync(path.join(path.dirname(file), f), 'utf8')).join('\n'); // hoja de ruta, evolución, servicio y documentos (se cargan después de app.js)

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
vm.runInContext(code + '\n' + codigoRuta + '\n;globalThis.__t={SRV_P,SRV_E,SRV_ORD,SRV_V,SRV_SOLICITABLES,SRV_URL,SRV_ACT,EF,EF_N,EF_T,OLAS,RT_V,RT_ALTO,EVO_TIPOS,D,Q,A,CL,E2,en,SEC,SEC_F,SEC_DIM,SEC_N,SEC_J,SEC_K,SEC_V,SEC_B,SEC_BN,TAM,TAM_K,TAM_V,TAM_DIM};', sandbox);
const { SRV_P, SRV_E, SRV_ORD, SRV_V, SRV_SOLICITABLES, SRV_URL, SRV_ACT, EF, EF_N, EF_T, OLAS, RT_V, RT_ALTO, EVO_TIPOS, D, Q, A, CL, E2, en, SEC, SEC_F, SEC_DIM, SEC_N, SEC_J, SEC_K, SEC_V, SEC_B, SEC_BN, TAM, TAM_K, TAM_V, TAM_DIM } = sandbox.__t;

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
  ok(typeof e1.nota === 'undefined', 'el motor ya no escribe «notas de la reunión»: los comentarios van en la pizarra');

  // lo que ve el cliente: solo perfil mínimo y respuestas visibles; nunca contacto
  const e2 = new E2();
  e2.sp({ nombre: 'Acme SpA', sector: 'salud', 'tamaño': '11-50', email: 'ana@acme.cl', contacto: 'Ana Pérez' });
  e2.a = { 'GOB-01': 3, 'GOB-01b': 2, 'GOB-02': 2 };
  e2.n = { 'GOB-01': 'nota antigua' }; // las notas antiguas ya no se publican
  const pub = e2.pub();
  ok(Object.keys(pub).sort().join() === 'perfil,respuestas', 'lo publicado solo tiene perfil y respuestas (los comentarios van en la pizarra)');
  ok(Object.keys(pub.perfil).sort().join() === 'nombre,sector,tamaño', 'el perfil publicado no incluye email ni contacto');
  ok(!('GOB-01b' in pub.respuestas) && pub.respuestas['GOB-01'] === 3, 'no se publican respuestas de preguntas que ya no aplican');
  ok(!JSON.stringify(pub).includes('nota antigua'), 'las notas antiguas no se publican (se pasan a la pizarra al abrir la sesión)');
  ok(!JSON.stringify(pub).includes('ana@acme.cl') && !JSON.stringify(pub).includes('Ana Pérez'), 'lo publicado no debe contener el email ni el contacto del cliente');
  const e3 = new E2().cargar(pub);
  ok(JSON.stringify(e3.sc()) === JSON.stringify(e2.sc()), 'el cliente debe ver el mismo puntaje que el consultor');
  const e4 = new E2().cargar({ perfil: e2.p, respuestas: e2.a, notas: e2.n });
  ok(e4.n['GOB-01'] === 'nota antigua' && e4.p.contacto === 'Ana Pérez', 'cargar una sesión conserva las notas antiguas (para pasarlas a la pizarra) y el perfil');
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
  ok(/hasOnly\(\['perfil', 'respuestas', 'notas', 'revisiones', 'servicio', 'consultor', 'publicadoEn', 'version'\]\)/.test(reglas) && /token\.size\(\) == 32/.test(reglas), 'lo compartido solo admite esos campos (incluye quién lo preparó) y un token de 32 caracteres');
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
  const e = new E2(); e.a = { 'GOB-01': 3, 'GOB-01b': 2 }; e.n = { 'GOB-01': 'nota antigua' };
  const st = sandbox.vivoEstado(e, 'GOB-02', 'pregunta');
  ok(st.qid === 'GOB-02' && st.fase === 'pregunta' && st.respuestas['GOB-01'] === 3 && !('GOB-01b' in st.respuestas), 'el estado en vivo lleva la pregunta actual y solo las respuestas de preguntas que aplican');
  ok(!('notas' in st) && !JSON.stringify(st).includes('nota antigua') && st.total === e.ga().length, 'el estado en vivo ya no lleva notas: lo que se escribe va en la pizarra');
  ok(Object.keys(st).sort().join() === 'fase,qid,respuestas,total', 'el estado en vivo no incluye puntajes, niveles ni datos de contacto');
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
  ok(/PZ\.sincronizarVivo\(\)[\s\S]{0,80}pzVivoLimpiar[\s\S]{0,200}vivoCerrar/.test(ss3), 'al terminar la reunión se copia a la sesión lo que escribieron los clientes antes de borrar la pizarra en vivo');
  ok(/pzPublicar\(tk, PZ\.entries, act\.id\)/.test(ss3) && /pzBorrarCompartido/.test(ss3) && /pzLeerCompartido\(tk\)/.test(ss3), 'publicar sube la pizarra, revocar la retira y el cliente la lee en sus resultados');
  ok(/PZ\.cliente\(N, tk\);/.test(vj3) && /PZ\.pedirPersona\(\)\.then\(\(\) => \{ barra\(\); quien\(\); latir\(\); \}\)/.test(vj3) && /onsubmit|f\.onsubmit/.test(pj) && /oncancel/.test(pj), 'el cliente debe escribir su nombre antes de comentar');
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
  ok(/conduce = d\.consultor/.test(vj4) && /usuarioBarra\(\{ con:/.test(vj4) && /etq: 'Conduce'/.test(vj4) && /pzPersonaCambio = \(\) => \{ barra\(\); quien\(\)/.test(vj4), 'el cliente ve en la barra quién conduce la reunión y su propio nombre');
  ok(/etq: 'Preparado por'/.test(ss4), 'en los resultados el cliente ve quién los preparó');
  ok(/function fotoOk\(f\)[\s\S]{0,200}googleusercontent/.test(rv) && /function consultorOk/.test(rv) && /d\.rol == 'consultor' && fotoOk\(d\.foto\)/.test(rv), 'las reglas solo admiten fotos de googleusercontent.com y solo en comentarios del consultor');
  ok(/foto: avFoto\(u\.foto\) \|\| undefined/.test(pj), 'los comentarios del consultor llevan su foto (validada)');
  ok(/@media print\{\.uchip\{display:none!important\}\}/.test(cs), 'en el PDF no sale la barra de usuario');
}

seccion('16. Metodología y ponderación sectorial: la explicación coincide con el cálculo real');
{
  const raiz8 = path.resolve(path.dirname(file), '..');
  const leer8 = (f) => fs.readFileSync(path.join(raiz8, f), 'utf8').replace(/\r\n/g, '\n');
  const sb = sandbox;
  const armar = (perfil, f) => { const e = new E2(); e.p = perfil; Q.filter((q) => !q.iS).forEach((q, i) => { e.a[q.id] = f(q, i); }); return e; };
  const mixto = (q, i) => (i * 7 + 1) % 4;
  const ih = leer8('public/index.html'), codigo = leer8('public/app.js'), cs = leer8('public/styles.css');

  // ── 1) integridad de la tabla de rubros ──
  const sel = ih.match(/id="f2"[\s\S]*?<\/select>/)[0];
  const opciones = [...sel.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)/g)].map((m) => [m[1], m[2].trim()]).filter(([v]) => v && v !== 'otro');
  ok(opciones.length === Object.keys(SEC).length && opciones.every(([v, n]) => SEC[v] && SEC_N[v] === n) && Object.keys(SEC).every((k) => opciones.some(([v]) => v === k)), 'cada rubro del formulario (menos «Otro») tiene su fila en la tabla de exposición, con el mismo nombre');
  ok(Object.values(SEC).every((n) => SEC_F.every((f) => [0, 1, 2].includes(n[f.id])) && Object.keys(n).length === SEC_F.length), 'cada rubro tiene un nivel 0, 1 o 2 en cada uno de los factores');
  ok(D.every((d) => (SEC_DIM[d.id] || []).length > 0 && SEC_DIM[d.id].every((f) => SEC_F.some((x) => x.id === f))), 'cada dimensión está vinculada a al menos un factor válido');
  ok(Object.keys(SEC).every((k) => SEC_F.every((f) => (SEC[k][f.id] > 0) === !!(SEC_J[k] && SEC_J[k][f.id]))), 'cada nivel medio o alto de un rubro tiene su justificación escrita (y no hay justificaciones de niveles bajos)');
  ok(SEC_F.every((f) => /^Arts?\. /.test(f.ar) && f.n && f.d), 'cada factor indica su base legal');
  ok(SEC_K > 0 && SEC_K <= 0.3 && /^\d+\.\d+$/.test(SEC_V), 'el ajuste máximo es de hasta +30% y la metodología tiene versión');
  // los artículos citados existen en el texto oficial
  const wl = {}; vm.runInNewContext(leer8('public/ley-texto.js'), { window: wl });
  ok(SEC_F.every((f) => sb.citasLey(f.ar).every((c) => c.items.every((it) => wl.LEY.a[it.a]))), 'los artículos de cada factor existen en el texto oficial de la ley');

  // ── 2) el ajuste: acotado y sin efecto para «Otro» o sin rubro ──
  const mult = (r) => sb.secMult(r);
  ok(Object.keys(SEC).every((k) => D.every((d) => { const x = mult(k)[d.id]; return x >= 1 && x <= 1 + SEC_K + 1e-9; })), 'el ajuste de cada dimensión va de 1,00 a 1,25 para todos los rubros');
  ok(['otro', '', undefined, 'inexistente'].every((r) => D.every((d) => mult(r)[d.id] === 1)), '«Otro», sin rubro o un rubro desconocido no llevan ajuste (todo × 1,00)');
  ok(Math.abs(mult('fintech').terceros - 1.25) < 1e-9 && Math.abs(mult('salud').sensibles - 1.1875) < 1e-9 && Math.abs(mult('alimentos').gobernanza - 1.125) < 1e-9 && mult('alimentos').seguridad === 1.0625, 'ejemplos calculados a mano: fintech·terceros 1,25; salud·sensibles 1,1875; alimentos·gobernanza 1,125 y seguridad 1,0625');

  // ── 3) el puntaje coincide con una recomputación independiente de la fórmula ──
  const indep = (e) => {
    const lista = e.ga(); let num = 0, den = 0, numB = 0, denB = 0; const ms = mult((e.p || {}).sector), mt = sb.tamMult((e.p || {})['tamaño']), m = {}; for (const d of D) m[d.id] = ms[d.id] * mt[d.id];
    for (const d of D) {
      const qs = lista.filter((q) => q.dm === d.id && e.a[q.id] !== undefined);
      const pt = Math.round(qs.reduce((t2, q) => t2 + e.a[q.id] * (q.w || 1), 0) / (qs.reduce((t2, q) => t2 + 3 * (q.w || 1), 0) || 1) * 100) * (qs.length ? 1 : 0);
      num += pt * d.w * m[d.id]; den += 100 * d.w * m[d.id]; numB += pt * d.w; denB += 100 * d.w;
    }
    return [Math.round(num / den * 100), Math.round(numB / denB * 100)];
  };
  const sectores = [...Object.keys(SEC), 'otro', ''];
  ok(sectores.every((r) => { const e = armar({ sector: r }, mixto), [g, gb] = indep(e), x = e.sc(); return x.g === g && x.gb === gb; }), 'el puntaje global y el puntaje sin ajuste del motor coinciden con la fórmula recalculada de forma independiente, para todos los rubros');
  ok(armar({ sector: 'otro' }, mixto).sc().g === armar({ sector: 'otro' }, mixto).sc().gb && armar({}, mixto).sc().g === armar({}, mixto).sc().gb, 'sin ajuste, el puntaje oficial es igual al base');
  ok(sectores.every((r) => armar({ sector: r }, () => 3).sc().g === 100 && armar({ sector: r }, () => 0).sc().g === 0), 'todo en 3 vale 100 y todo en 0 vale 0 en cualquier rubro');
  // el efecto va en la dirección que dice el texto: una brecha donde el rubro está más expuesto resta más
  const debilEn = (dim) => (q) => (q.dm === dim ? 0 : 3);
  ok(armar({ sector: 'fintech' }, debilEn('terceros')).sc().g < armar({ sector: 'otro' }, debilEn('terceros')).sc().g && armar({ sector: 'fintech' }, debilEn('sensibles')).sc().g > armar({ sector: 'otro' }, debilEn('sensibles')).sc().g, 'en fintech, una brecha en terceros (muy expuesta) baja el puntaje y una en datos sensibles (la menos expuesta) lo sube respecto de sin ajuste');
  // lo que NO cambia con el rubro
  const e1 = armar({ sector: 'salud', 'tamaño': 'micro' }, mixto), e2 = armar({ sector: 'fintech', 'tamaño': 'grande' }, mixto);
  const sinGlobal = (e) => JSON.stringify([e.sc().d, e.fl(), e.cl2(), e.pl().map((p) => [p.d.id, p.s, p.rk]), e.ga().map((q) => q.id)]);
  ok(sinGlobal(e1) === sinGlobal(e2), 'con las mismas respuestas, el puntaje de cada dimensión, las banderas, el semáforo, el plan y las preguntas son idénticos para cualquier rubro (el rubro solo cambia el peso en el puntaje global)');
  ok(/secMult\(p\.sector\)/.test(codigo) && /tamMult\(p\['tamaño'\]\)/.test(codigo), 'el motor usa el rubro y el tamaño');

  // ── 4) las cifras de la tabla son las del motor ──
  const m = sb.metDatos(e1), sc = e1.sc();
  ok(m.filas.length === D.length && m.filas.every((f) => f.pt === sc.d[f.d.id] && Math.abs(f.w - f.d.w * mult('salud')[f.d.id]) < 1e-9), 'la tabla usa los puntajes de cada dimensión y los pesos aplicados reales');
  ok(m.filas.every((f) => f.mx === 0 || Math.round(f.sm / f.mx * 100) === f.pt), 'puntaje de la dimensión = Σ(valor×peso) ÷ Σ(3×peso) × 100 (redondeado)');
  ok(Math.abs(m.filas.reduce((t2, f) => t2 + f.ap, 0) - sc.g) <= 0.5, 'los aportes de las dimensiones suman el puntaje global (±0,5 por el redondeo): ' + m.filas.reduce((t2, f) => t2 + f.ap, 0).toFixed(2) + ' vs ' + sc.g);
  const e0 = new E2(); const m0 = sb.metDatos(e0);
  ok(m0.sc.g === 0 && m0.filas.every((f) => f.rs === 0 && f.pt === 0 && f.ap === 0), 'sin respuestas todo vale 0 (una dimensión sin respuestas cuenta como 0%)');

  // ── 5) lo que dice el texto coincide con los datos y el motor ──
  const gid = sb.document.getElementById; sb.document.getElementById = () => ({ ...el(), options: [] });
  const html = sb.metHtml(e1), htmlOtro = sb.metHtml(armar({ sector: 'otro' }, mixto)), htmlVacio = sb.metHtml(e0);
  sb.document.getElementById = gid;
  ok(new RegExp('versión ' + SEC_V.replace('.', '\\.')).test(html) && /ponderación por exposición sectorial/.test(html) && /No cambia ninguna respuesta ni el puntaje de cada dimensión/.test(html), 'el texto presenta la ponderación sectorial con su versión y aclara qué no cambia');
  ok(new RegExp('Su sesión: ' + SEC_N.salud.replace(/[/]/g, '\\/')).test(html) && /sin ajustes: \d+%/.test(html) && new RegExp('solo con el ajuste sectorial: ' + sc.gs + '%').test(html) && new RegExp('sin ajustes: ' + sc.gb + '%').test(html), 'la sesión muestra el puntaje sin ajustes y con el ajuste sectorial (los reales)');
  ok(/El rubro «Otro» no lleva ajuste sectorial/.test(htmlOtro) && /no tiene rubro con ajuste sectorial/.test(htmlVacio), 'para «Otro» o sin rubro el texto dice que no hay ajuste sectorial');
  ok(Object.keys(SEC).every((k) => html.includes(SEC_N[k])) && SEC_F.every((f) => html.includes(f.n)), 'el texto muestra la tabla completa de rubros y factores');
  ok(/data-a="14 septies"/.test(html) && /data-a="8 bis"/.test(html) && /data-a="16 quáter"/.test(html), 'los artículos citados abren el texto de la ley');
  ok(/artículo sexto transitorio/.test(html) && !/todavía no entra en el cálculo/.test(html) && /sujetos a revisión/.test(html), 'el texto aclara el alcance: los niveles están sujetos a revisión y ya no dice que el tamaño no entra');
  const ws = Q.map((q) => q.w);
  ok(Math.min(...ws) === 0.8 && Math.max(...ws) === 1.3 && /de 0,8 a 1,3/.test(html), 'los pesos de las preguntas van de 0,8 a 1,3 (como dice el texto)');
  ok([[20, 0], [21, 1], [40, 1], [41, 2], [60, 2], [61, 3], [80, 3], [81, 4], [100, 4]].every(([p, n]) => e0.ml(p).n === n) && /0 a 20/.test(html) && /21 a 40/.test(html) && /41 a 60/.test(html) && /61 a 80/.test(html) && /81 a 100/.test(html), 'los rangos de los niveles del texto son los del motor');
  ok(/if\(s>=80\)continue;let rk='MEDIO',rc='rme';if\(s<=30\)\{rk='CRÍTICO'/.test(codigo) && /else if\(s<=55\)\{rk='ALTO'/.test(codigo) && /hasta 30%/.test(html) && /hasta 55%/.test(html) && /por debajo de 80%/.test(html), 'los umbrales del plan de acción del texto (80, 30 y 55) son los del motor');
  ok(new Set(CL.map((c2) => c2.tV)).size === 1 && new Set(CL.map((c2) => c2.tY)).size === 1 && new RegExp(CL[0].tV + ' o más es <em>Cumple').test(html) && new RegExp(CL[0].tY + ' o más es <em>Parcial').test(html), 'los umbrales del semáforo del texto son los de las obligaciones');
  ok(Q.filter((q) => q.cd).every((q) => q.cd.lt === 2) && /menor a 2/.test(html), 'el umbral de las preguntas de profundización del texto es el de los datos');
  ok(new RegExp(Q.filter((q) => !q.iS).length + ' preguntas base').test(html) && new RegExp('más ' + Q.filter((q) => q.iS).length + ' de profundización').test(html), 'el texto cuenta bien las preguntas base y de profundización');
  ok(/Σ \(valor × peso\)/.test(html) && /Σ \(puntaje de la dimensión × peso aplicado\)/.test(html) && /Peso aplicado = peso base de la dimensión × ajuste sectorial × ajuste por tamaño/.test(html) && /Ajuste de la dimensión = 1 \+ 0,25/.test(html), 'las fórmulas del texto (dimensión, global y ajuste) coinciden con las del motor');
  // ── 6) pantalla ──
  const nota = sb.secNota(e1);
  ok(/Incluye la ponderación sectorial de «Salud \/ Clínicas» \(v1\.0\)/.test(nota) && new RegExp('Sin ajuste: ' + e1.sc().gb + '%').test(nota) && sb.secNota(armar({ sector: 'otro' }, mixto)) === '' && sb.secNota(e0) === '', 'el encabezado de resultados avisa del ajuste y muestra el puntaje sin ajuste (nada si no hay ajuste)');
  ok(/\$\{secNota\(en\)\}/.test(codigo), 'la nota del ajuste está en el encabezado de los resultados');
  ok(/\['t7','calculator','Método',''\]/.test(codigo) && /id="t7"/.test(codigo), 'la pestaña «Método» está en los resultados');
  ok(/id="dlg-met"/.test(ih) && /id="bmet"/.test(ih) && /function metDlg\(\)/.test(codigo), 'el consultor puede abrir la metodología desde la pregunta («Cómo se calcula»)');
  ok(/@media print\{#t7,#t8,#t9,#bmet\{display:none!important\}\}/.test(cs), 'la metodología no sale en el PDF (no cambia su paginación)');
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

seccion('18. La pizarra reemplaza a las notas de la reunión');
{
  const raiz10 = path.resolve(path.dirname(file), '..');
  const leer10 = (f) => fs.readFileSync(path.join(raiz10, f), 'utf8').replace(/\r\n/g, '\n');
  const aj = leer10('public/app.js'), vj = leer10('public/vivo.js'), ss5 = leer10('public/sesiones.js'), sb = sandbox;
  ok(!/class="notas"|id="nota"|en\.nota\(/.test(aj) && !/\bnota\b.*vnota|vnota/.test(vj), 'la pregunta del consultor y la del cliente ya no tienen cuadro ni bloque de «notas»');
  ok(/<div class="pz-slot" id="pz-slot"><\/div><nav class="qn"/.test(aj), 'la pizarra es el único lugar para anotar en cada pregunta');
  ok(!/notas/.test(ss5.slice(ss5.indexOf('function dlgRender'), ss5.indexOf('window.pub'))) && /y la pizarra con los comentarios y archivos de la reunión/.test(ss5), 'los textos del diálogo de compartir ya no hablan de notas');
  ok(/\['t6','messages-square','Pizarra'/.test(aj) && /Notas anteriores/.test(aj), 'en los resultados la pestaña se llama «Pizarra» y las notas antiguas salen aparte, bajo «Notas anteriores»');
  // id fijo y válido para las reglas (20 letras o números)
  const id1 = sb.pzIdNota('sesion1', 'GOB-01'), id2 = sb.pzIdNota('sesion1', 'GOB-01b'), id3 = sb.pzIdNota('sesion2', 'GOB-01');
  ok(/^[A-Za-z0-9]{20}$/.test(id1) && id1 === sb.pzIdNota('sesion1', 'GOB-01') && id1 !== id2 && id1 !== id3, 'el id de una nota migrada es de 20 letras/números, siempre el mismo para la misma sesión y pregunta, y distinto entre preguntas y sesiones');
  const todas = new Set(); for (const q of Q) todas.add(sb.pzIdNota('mockabc123', q.id)); ok(todas.size === Q.length, 'ninguna pregunta repite el id de nota');
  // la migración: usa el id fijo, conserva autor y fecha, y solo después borra las notas antiguas
  const mig = ss5.slice(ss5.indexOf('async function migrarNotas'), ss5.indexOf('window.abrirSes'));
  ok(/pzIdNota\(sid, qid\)/.test(mig) && /rol: 'consultor'/.test(mig) && /creadoEn: ms\(d\.actualizadoEn\)/.test(mig) && /cr\.nombre \|\| cr\.email/.test(mig), 'la migración conserva el autor original y la fecha de la sesión');
  ok(mig.indexOf('await N.pzEspejar(sid, e)') > 0 && mig.indexOf('await N.pzEspejar(sid, e)') < mig.indexOf('en.n = {}; en.sv()'), 'las notas antiguas solo se borran después de haberlas copiado a la pizarra (si falla, siguen en la sesión)');
  ok(/await PZ\.abrirSesion\(N, id\); await migrarNotas\(d, id\)/.test(ss5), 'las notas se migran al abrir la sesión (para trabajar, ver resultados o compartir)');
  ok(/\.slice\(0, 2000\)/.test(mig), 'una nota migrada respeta el máximo de 2000 caracteres de la pizarra');
}

seccion('19. Rubros de AlignData, tamaño de la empresa y escala de madurez única');
{
  const raiz11 = path.resolve(path.dirname(file), '..');
  const leer11 = (f) => fs.readFileSync(path.join(raiz11, f), 'utf8').replace(/\r\n/g, '\n');
  const sb = sandbox, codigo = leer11('public/app.js'), ih = leer11('public/index.html');
  const armar = (perfil, f) => { const e = new E2(); e.p = perfil; Q.filter((q) => !q.iS).forEach((q, i) => { e.a[q.id] = f(q, i); }); return e; };
  const mixto = (q, i) => (i * 7 + 1) % 4;
  const suma = (k) => SEC_F.reduce((t2, f) => t2 + SEC[k][f.id], 0);
  const por = (b) => Object.keys(SEC).filter((k) => SEC_B[k] === b);

  // ── clasificación de exposición de AlignData ──
  ok(['salud', 'fintech', 'rrhh'].every((k) => SEC_B[k] === 'alta') && ['educacion', 'retail', 'tecnologia', 'publico'].every((k) => SEC_B[k] === 'media'), 'salud, finanzas/seguros y RR.HH. son de exposición alta; educación, retail, tecnología y sector público/ONG de media-alta (clasificación de AlignData)');
  ok(Object.keys(SEC).every((k) => SEC_B[k] && SEC_BN[SEC_B[k]]) && Object.keys(SEC_B).length === Object.keys(SEC).length, 'cada rubro tiene su banda de exposición');
  ok(Math.min(...por('alta').map(suma)) > Math.max(...por('media').map(suma)) && Math.min(...por('media').map(suma)) > Math.max(...por('ext').map(suma)), 'los niveles por factor respetan la banda: todo rubro de exposición alta suma más que uno de media-alta, y este más que uno por clasificar');
  ok(['rrhh', 'publico'].every((k) => SEC[k] && SEC_N[k] && new RegExp('value="' + k + '"').test(ih)), 'RR.HH. / Reclutamiento y Sector público / ONG están en el formulario y en la tabla');

  // ── tamaño ──
  const sel3 = ih.match(/id="f3"[\s\S]*?<\/select>/)[0];
  const rangos = [...sel3.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
  ok(rangos.length === Object.keys(TAM).length && rangos.every((r) => TAM[r]), 'cada rango de empleados del formulario tiene su categoría de tamaño');
  ok(TAM['1-10'].lv === 0 && TAM['11-50'].lv === 1 && TAM['51-200'].lv === 2 && TAM['201+'].lv === 3 && TAM_K > 0 && TAM_K <= 0.2 && /^\d+\.\d+$/.test(TAM_V), 'micro, pequeña, mediana y grande tienen niveles 0 a 3; el ajuste máximo es de hasta +20% y tiene versión');
  ok(Object.keys(TAM_DIM).every((id) => D.some((d) => d.id === id)) && Object.keys(TAM_DIM).sort().join() === 'gobernanza,registro,seguridad', 'el tamaño pesa en gobernanza, registro y seguridad (deberes de los arts. 14 ter, 14 quinquies y 50)');
  const wl2 = {}; vm.runInNewContext(leer11('public/ley-texto.js'), { window: wl2 });
  ok(Object.values(TAM_DIM).every((x) => sb.citasLey(x.ar).every((c) => c.items.every((it) => wl2.LEY.a[it.a]))) && wl2.LEY.a['14 septies'].p.join(' ').includes('20.416'), 'los artículos del ajuste por tamaño existen en la ley, y el art. 14 septies cita la ley 20.416');
  const tm = (t2) => sb.tamMult(t2);
  ok(D.every((d) => tm('1-10')[d.id] === 1 && tm('')[d.id] === 1 && tm('xx')[d.id] === 1 && tm(undefined)[d.id] === 1), 'micro, sin tamaño o un valor desconocido no llevan ajuste (× 1,00)');
  ok(Math.abs(tm('201+').seguridad - 1.15) < 1e-9 && Math.abs(tm('51-200').gobernanza - 1.1) < 1e-9 && Math.abs(tm('11-50').registro - 1.05) < 1e-9 && tm('201+').arcop === 1 && tm('201+').terceros === 1, 'ejemplos a mano: grande·seguridad 1,15; mediana·gobernanza 1,10; pequeña·registro 1,05; las demás dimensiones no cambian');
  // sentido del ajuste: una brecha en seguridad resta más en una empresa grande que en una micro
  const debil = (dim) => (q) => (q.dm === dim ? 0 : 3);
  ok(armar({ 'tamaño': '201+' }, debil('seguridad')).sc().g < armar({ 'tamaño': '1-10' }, debil('seguridad')).sc().g && armar({ 'tamaño': '201+' }, debil('arcop')).sc().g > armar({ 'tamaño': '1-10' }, debil('arcop')).sc().g, 'una brecha en seguridad baja más el puntaje de una empresa grande que el de una micro, y una brecha en derechos (sin ajuste por tamaño) lo baja menos');
  const tamanos = ['1-10', '11-50', '51-200', '201+', ''];
  ok(sectores19().every(([r, z]) => armar({ sector: r, 'tamaño': z }, () => 3).sc().g === 100 && armar({ sector: r, 'tamaño': z }, () => 0).sc().g === 0), 'todo en 3 vale 100 y todo en 0 vale 0 con cualquier rubro y tamaño');
  function sectores19() { const o = []; for (const r of [...Object.keys(SEC), 'otro', '']) for (const z of tamanos) o.push([r, z]); return o; }
  // los dos ajustes se componen y se pueden separar
  ok(sectores19().every(([r, z]) => { const x = armar({ sector: r, 'tamaño': z }, mixto).sc(); return D.every((d) => Math.abs(x.m[d.id] - x.ms[d.id] * x.mt[d.id]) < 1e-12) && Math.abs(x.gs - armar({ sector: r }, mixto).sc().g) <= 0; }), 'el ajuste total es rubro × tamaño y «solo con el ajuste sectorial» es el mismo puntaje que sin tamaño');
  ok(sectores19().every(([r, z]) => D.every((d) => { const x = armar({ sector: r, 'tamaño': z }, mixto).sc().m[d.id]; return x >= 1 && x <= (1 + SEC_K) * (1 + TAM_K) + 1e-9; })), 'el ajuste de una dimensión no pasa de × 1,25 × 1,15');
  const sg = (e) => JSON.stringify([e.sc().d, e.fl(), e.cl2(), e.pl().map((p) => [p.d.id, p.s, p.rk]), e.ga().map((q) => q.id)]);
  ok(sg(armar({ sector: 'rrhh', 'tamaño': '1-10' }, mixto)) === sg(armar({ sector: 'otro', 'tamaño': '201+' }, mixto)), 'con las mismas respuestas, el puntaje de cada dimensión, las banderas, el semáforo, el plan y las preguntas no dependen del rubro ni del tamaño');
  // la pantalla
  const gid = sb.document.getElementById; sb.document.getElementById = () => ({ ...el(), options: [] });
  const e5 = armar({ sector: 'salud', 'tamaño': '51-200' }, mixto), h5 = sb.metHtml(e5), h5m = sb.metHtml(armar({ sector: 'salud', 'tamaño': '1-10' }, mixto)), h5v = sb.metHtml(new E2());
  sb.document.getElementById = gid;
  const x5 = e5.sc();
  ok(/7\. El tamaño de la empresa/.test(h5) && new RegExp('versión ' + TAM_V.replace('.', '\\.')).test(h5) && /ley N° 20\.416/.test(h5) && /Ajuste por tamaño = 1 \+ 0,15/.test(h5) && /data-a="50"/.test(h5), 'el método explica el ajuste por tamaño con su versión, la ley 20.416 y la fórmula');
  ok(new RegExp('Su sesión: empresa mediana').test(h5) && new RegExp('con ambos ajustes \\(el oficial\\): ' + x5.g + '%').test(h5) && new RegExp('con ajuste sectorial: ' + x5.gs + '%').test(h5), 'la sesión muestra los puntajes con rubro y con ambos ajustes (los reales)');
  ok(/El tamaño declarado \(micro\) no lleva ajuste/.test(h5m) && /no tiene tamaño declarado/.test(h5v), 'micro o sin tamaño: el texto dice que no hay ajuste');
  ok(/aproxima con el número de empleados/.test(h5) && /las ventas anuales/.test(h5), 'el texto aclara que el tamaño se aproxima con empleados y la ley usa ventas');
  ok(Object.keys(TAM).every((k) => h5.includes(TAM[k].e)) && /Peso aplicado/.test(h5) && /Ajuste por tamaño<\/th>/.test(h5), 'la tabla de cálculo tiene la columna de ajuste por tamaño y el método lista todas las categorías');
  const filas = sb.metDatos(e5).filas;
  ok(filas.every((f) => Math.abs(f.w - f.d.w * f.ms * f.mt) < 1e-9 && f.m === x5.m[f.d.id]), 'la tabla usa el peso base × ajuste sectorial × ajuste por tamaño reales');
  ok(Math.abs(filas.reduce((t2, f) => t2 + f.ap, 0) - x5.g) <= 0.5, 'los aportes siguen sumando el puntaje global con los dos ajustes');
  const n5 = sb.secNota(e5);
  ok(/Incluye la ponderación sectorial de «Salud \/ Clínicas» \(v1\.0\) y el ajuste por tamaño \(v1\.0\)/.test(n5) && new RegExp('Sin ajuste: ' + x5.gb + '%').test(n5) && /Incluye el ajuste por tamaño \(v1\.0\)\./.test(sb.secNota(armar({ sector: 'otro', 'tamaño': '201+' }, mixto))) && sb.secNota(armar({ sector: 'otro', 'tamaño': '1-10' }, mixto)) === '', 'el encabezado avisa de los ajustes que aplican (rubro, tamaño o ambos) y no dice nada si no hay ninguno');
  ok(!/'1-10'/.test(codigo.slice(codigo.indexOf('class E2'), codigo.indexOf('class E2') + 4500)), 'el motor no tiene rangos de empleados escritos a mano: usa la tabla TAM');

  // ── escala de madurez única: la del Assessment y el Informe Ejecutivo (0 a 4, meta nivel 3) ──
  const e0 = new E2();
  ok([[0, 'Inexistente', 'crítico'], [30, 'Reactivo', 'alto'], [50, 'Parcial', 'medio'], [70, 'Gestionado', 'bajo'], [90, 'Optimizado', 'mínimo']].every(([p, nm, ri], i) => { const l = e0.ml(p); return l.n === i && l.nm === nm && l.ri === ri; }), 'los niveles son Inexistente, Reactivo, Parcial, Gestionado y Optimizado (0 a 4), con riesgo crítico, alto, medio, bajo y mínimo');
  ok(!/Sin protección'|'En desarrollo'/.test(codigo.replace(/"id":"[A-Z]+-\d+[a-z]?".*/g, '')), 'los nombres antiguos de los niveles ya no se usan fuera de las preguntas');
  ok(/Índice \$\{fnum\(sc\.g\/25\)\} de 4,0 · riesgo \$\{mt\.ri\} · meta: nivel 3 \(Gestionado\)/.test(codigo), 'los resultados muestran el índice de 0 a 4, el riesgo y la meta (nivel 3)');
  const h6 = h5;
  ok(/misma escala del Assessment y del Informe Ejecutivo/.test(h6) && /puntaje global ÷ 25/.test(h6) && ['Inexistente', 'Reactivo', 'Parcial', 'Gestionado', 'Optimizado'].every((n) => h6.includes(n)) && /riesgo crítico/.test(h6) && /riesgo mínimo/.test(h6), 'el método explica la escala (niveles, riesgo e índice de 0 a 4)');
  ok(new RegExp('en su sesión, ' + (x5.g / 25).toFixed(1).replace('.', ',') + ' de 4,0').test(h6), 'el índice de 0 a 4 de la sesión es el puntaje ÷ 25');
  ok(/Exposición<\/th>/.test(h6) && Object.keys(SEC_BN).every((b) => !por(b).length || h6.includes(SEC_BN[b])) && /clasificación de exposición que usa AlignData/.test(h6) && /régimen propio/.test(h6), 'la tabla de rubros muestra la banda de exposición y aclara su origen y el régimen propio de los órganos públicos');
}

seccion('20. Hoja de ruta por oleadas, evolución en el tiempo, informe ejecutivo y acta');
{
  const raiz12 = path.resolve(path.dirname(file), '..');
  const leer12 = (f) => fs.readFileSync(path.join(raiz12, f), 'utf8').replace(/\r\n/g, '\n');
  const sb = sandbox, codigo = leer12('public/app.js'), ih = leer12('public/index.html'), css = leer12('public/styles.css'), reglas = leer12('firestore.d360.rules');
  const armar = (perfil, f) => { const e = new E2(); e.p = perfil; Q.filter((q) => !q.iS).forEach((q, i) => { e.a[q.id] = f(q, i); }); return e; };
  const mixto = (q, i) => (i * 7 + 1) % 4;
  // responde también las preguntas de profundización que aparezcan
  const completa = (perfil, f) => { const e = armar(perfil, f); for (let k = 0; k < 4; k++) for (const q of e.ga()) if (e.a[q.id] === undefined) e.a[q.id] = f(q, k + 3); return e; };
  const raw = (e) => { const sc = e.sc(), sw = D.reduce((t2, d) => t2 + d.w * sc.m[d.id], 0); let g = 0; for (const d of D) { const qs = e.ga().filter((q) => q.dm === d.id && e.a[q.id] !== undefined), pw = qs.reduce((t2, q) => t2 + (q.w || 1), 0); if (pw) g += qs.reduce((t2, q) => t2 + e.a[q.id] * (q.w || 1), 0) / (3 * pw) * 100 * d.w * sc.m[d.id] / sw; } return g; };

  // ── datos ──
  ok(Q.every((q) => [1, 2, 3].includes(EF[q.id])) && Object.keys(EF).every((k) => Q.some((q) => q.id === k)), 'cada pregunta tiene un esfuerzo (1 bajo, 2 medio, 3 alto) y no hay preguntas inexistentes');
  ok(OLAS.length === 4 && OLAS.every((o, i) => o.n === i + 1 && o.t && o.p && o.d) && /^\d+\.\d+$/.test(RT_V) && RT_ALTO > 0, 'hay cuatro oleadas con nombre, plazo y descripción, y la hoja de ruta tiene versión');
  ok(Object.keys(EF_N).join() === '1,2,3' && Object.keys(EF_T).join() === '1,2,3', 'los esfuerzos tienen nombre y duración');

  // ── el beneficio es el cálculo real del motor ──
  const e1 = completa({ sector: 'salud', 'tamaño': '51-200' }, mixto), r1 = sb.ruta(e1);
  ok(r1.sinResp === 0 && Math.abs(r1.actual - raw(e1)) < 1e-9 && Math.abs(r1.actual + r1.total - 100) < 1e-9, 'con todo respondido, el puntaje actual sin redondear más los beneficios de todas las brechas suma exactamente 100');
  ok(r1.items.length === e1.ga().filter((q) => e1.a[q.id] < 3).length, 'hay una iniciativa por cada pregunta respondida con menos de 3');
  // subir una pregunta (sin preguntas de profundización que dependan de ella) a 3 aumenta el puntaje en su beneficio
  const sinHijos = r1.items.filter((i) => !i.q.cd && !Q.some((x) => x.cd && x.cd.sh === i.q.id)).slice(0, 6);
  ok(sinHijos.length >= 4 && sinHijos.every((i) => { const x = completa({ sector: 'salud', 'tamaño': '51-200' }, mixto); x.a[i.q.id] = 3; return Math.abs(raw(x) - raw(e1) - i.gain) < 1e-9; }), 'el beneficio de cada iniciativa es lo que sube el puntaje al llevar esa pregunta a 3 (verificado recalculando el motor)');
  // los pesos de rubro y tamaño cambian el beneficio en la dirección esperada
  const g = (e, dm) => sb.ruta(e).items.filter((i) => i.dm.id === dm).reduce((t2, i) => t2 + i.gain, 0);
  const flojo = (dim) => (q) => (q.dm === dim ? 0 : 3);
  ok(g(completa({ sector: 'fintech' }, flojo('terceros')), 'terceros') > g(completa({ sector: 'otro' }, flojo('terceros')), 'terceros') && g(completa({ 'tamaño': '201+' }, flojo('seguridad')), 'seguridad') > g(completa({ 'tamaño': '1-10' }, flojo('seguridad')), 'seguridad'), 'una brecha vale más puntos donde el rubro o el tamaño pesan más (terceros en fintech; seguridad en una empresa grande)');

  // ── reglas de las oleadas ──
  const regla = (i) => (i.fl || (i.alto && i.ef < 3) ? 1 : i.alto ? 2 : i.ef === 1 ? 3 : 4);
  ok(r1.items.every((i) => i.ola === regla(i) && i.fl === !!(i.q.fl && i.q.fl.includes(i.v)) && i.alto === (i.gain >= RT_ALTO)), 'cada iniciativa está en la oleada que dicen las reglas (alerta crítica o beneficio alto con esfuerzo bajo o medio: 1; alto con esfuerzo alto: 2; beneficio menor con esfuerzo bajo: 3; el resto: 4)');
  ok(r1.items.every((x, k, a) => k === 0 || a[k - 1].ola <= x.ola) && r1.olas.every((o) => o.items.every((i) => i.ola === o.n)) && r1.olas.reduce((t2, o) => t2 + o.items.length, 0) === r1.items.length, 'las iniciativas quedan ordenadas por oleada y ninguna se repite ni se pierde');
  ok(r1.olas.every((o, i, a) => (i === 0 || o.hasta >= a[i - 1].hasta) && o.hasta <= 100) && r1.olas[3].hasta === 100, 'el puntaje estimado al terminar cada oleada solo sube y termina en 100');
  ok(r1.olas.every((o) => Math.abs(o.gain - o.items.reduce((t2, i) => t2 + i.gain, 0)) < 1e-9), 'el beneficio de cada oleada es la suma de sus iniciativas');
  const rl = sb.ruta(armar({}, () => 3));
  ok(rl.items.length === 0 && sb.rutaHtml(armar({}, () => 3)).includes('No hay brechas pendientes'), 'sin brechas no hay iniciativas y la pantalla lo dice');
  ok(sb.rutaHtml(new E2()).includes('Aún no hay respuestas'), 'sin respuestas la pantalla lo dice');
  // sin las preguntas de profundización contestadas, se avisa
  const eP = armar({}, (q) => (q.id === 'GOB-01' ? 0 : 3)); ok(sb.ruta(eP).sinResp >= 1 && /sin responder/.test(sb.rutaHtml(eP)), 'las preguntas sin responder se avisan y no entran en la hoja de ruta');

  // ── pantalla de la hoja de ruta ──
  const gid = sb.document.getElementById; sb.document.getElementById = () => ({ ...el(), options: [] });
  const hr = sb.rutaHtml(e1);
  sb.document.getElementById = gid;
  ok(r1.olas.filter((o) => o.items.length).every((o) => hr.includes('Ola ' + o.n + ' · ' + o.t)) && new RegExp('de <strong>' + e1.sc().g + '%</strong> a <strong>100%</strong>').test(hr), 'la pantalla muestra cada oleada con iniciativas y el puntaje de hoy y el final');
  ok(r1.items.every((i) => hr.includes(i.q.id) && hr.includes('+' + (i.gain).toFixed(1).replace('.', ',') + ' pts')) && /Primer paso/.test(hr) && /Meta/.test(hr) && /Hoy/.test(hr), 'cada iniciativa muestra su pregunta, su beneficio en puntos, dónde está hoy, el primer paso y la meta');
  ok(/data-a="14 ter"/.test(hr) || /class="ref"/.test(hr), 'las iniciativas citan el artículo de la ley (abre el texto oficial)');
  ok(r1.items.filter((i) => i.fl).length === 0 || /Alerta crítica/.test(hr), 'las alertas críticas se marcan');
  ok(/Esfuerzo (bajo|medio|alto) · (días|semanas|meses)/.test(hr) && /Los plazos son una propuesta de orden, no una exigencia de la ley/.test(hr) && /sujeta a revisión/.test(hr), 'el texto aclara que el esfuerzo es una estimación y los plazos una propuesta');
  ok(/\['t8','route','Hoja de ruta',R8\.items\.length\]/.test(codigo) && /id="t8"/.test(codigo) && /\['t9','trending-up','Evolución'/.test(codigo) && /id="t9"/.test(codigo), 'los resultados tienen las pestañas «Hoja de ruta» y «Evolución»');

  // ── revisiones y evolución ──
  const rev = () => armar({ sector: 'salud', 'tamaño': '11-50' }, () => 1);
  const er = rev(); const v1 = er.rev('Diagnóstico inicial', 1790000000000);
  ok(er.rv.length === 1 && /^r[a-z0-9]{6,}$/.test(v1.id) && v1.e === 'Diagnóstico inicial' && v1.f === 1790000000000 && v1.p.sector === 'salud' && v1.p['tamaño'] === '11-50' && v1.g === er.sc().g && Object.keys(v1.a).length === Object.keys(er.a).length, 'guardar una revisión toma una foto de las respuestas, el perfil, el puntaje y la fecha');
  er.a['GOB-01'] = 3; ok(v1.a['GOB-01'] === 1 && er.rv[0].a['GOB-01'] === 1, 'cambiar las respuestas después no altera la revisión guardada');
  const v0 = er.rev('Revisión anterior', 1780000000000);
  ok(er.rv[0].id === v0.id && er.rv[1].id === v1.id, 'las revisiones quedan ordenadas por fecha');
  ok(er.rev('x'.repeat(100), 1).e.length === 40 && er.rev('  ', 2).e === 'Revisión', 'el nombre de una revisión se limita a 40 caracteres y no queda vacío');
  const er2 = rev(); for (let i = 0; i < 30; i++) er2.rev('r' + i, i + 1); ok(er2.rv.length === 24 && er2.rv[23].e === 'r29', 'se conservan como máximo las últimas 24 revisiones');
  const er3 = rev(); const a3 = er3.rev('A', 5), b3 = er3.rev('B', 6); er3.revDel(a3.id); ok(er3.rv.length === 1 && er3.rv[0].id === b3.id, 'se puede eliminar una revisión');
  // guardado: la sesión guarda las revisiones y el estado se restaura al cargar
  const ng = leer12('public/nube.js'), np = leer12('public/nube-prueba.js');
  ok(/revisiones: \[\.\.\.\(en\.rv \|\| \[\]\)\]/.test(ng) && /revisiones: \[\.\.\.\(en\.rv \|\| \[\]\)\]/.test(np), 'el guardado automático incluye las revisiones (en la nube y en el modo de prueba)');
  const er4 = new E2(); er4.cargar({ perfil: { sector: 'salud' }, respuestas: er.pub().respuestas, revisiones: [{ id: 'ra', e: 'A', f: 5, a: { 'GOB-01': 1 }, p: {} }, { id: 5, e: 'mala' }, null, { id: 'rb', e: 'B', f: 'x', a: {} }, { id: 'rc', e: 'C', f: 7, a: 'no' }] });
  ok(er4.rv.length === 1 && er4.rv[0].id === 'ra', 'al cargar, se descartan las revisiones mal formadas');
  new E2().cargar({}); const er5 = new E2(); er5.rv = [v1]; er5.rs(); ok(er5.rv.length === 0 && new E2().rv.length === 0, 'un motor nuevo o reiniciado no trae revisiones');
  // lo publicado para el cliente
  const eC = rev(); eC.rev('Diagnóstico inicial', 1790000000000);
  const pb = eC.pub(); ok(Object.keys(pb).sort().join() === 'perfil,respuestas,revisiones' && pb.revisiones.length === 1 && Object.keys(pb.revisiones[0]).sort().join() === 'a,e,f,g,id,n,p', 'lo publicado lleva las revisiones (solo respuestas, perfil, nombre, fecha y puntaje)');
  ok(Object.keys(rev().pub()).sort().join() === 'perfil,respuestas', 'sin revisiones, lo publicado no cambia');
  ok(JSON.stringify(pb).length < 20000 && /'revisiones', 'servicio', 'consultor'/.test(reglas) && /revisiones\.size\(\) <= 24/.test(reglas), 'las revisiones publicadas son pequeñas y las reglas las permiten (hasta 24)');
  const eCl = new E2(); eCl.cargar(JSON.parse(JSON.stringify(pb))); ok(eCl.rv.length === 1 && eCl.rv[0].e === 'Diagnóstico inicial', 'el cliente carga las revisiones publicadas');

  // evolución: puntos recalculados con el modelo vigente
  const ee = armar({ sector: 'salud', 'tamaño': '11-50' }, () => 1); ee.rev('Diagnóstico inicial', 1790000000000);
  ee.rv[0].g = 0; // un puntaje guardado antiguo no se usa: se recalcula
  let pts = sb.evoPuntos(ee);
  ok(pts.length === 1 && pts[0].g === armar({ sector: 'salud', 'tamaño': '11-50' }, () => 1).sc().g && pts[0].act === false, 'las revisiones se recalculan con el modelo vigente (no se usa el puntaje guardado)');
  ee.a['SEG-01'] = 3; pts = sb.evoPuntos(ee);
  ok(pts.length === 2 && pts[1].act && pts[1].e === 'Actual' && pts[1].g > pts[0].g, 'si las respuestas cambiaron, se agrega el punto «Actual»');
  ee.rev('Revisión a 3 meses', 1795000000000); pts = sb.evoPuntos(ee);
  ok(pts.length === 2 && pts.every((p) => !p.act), 'si las respuestas coinciden con la última revisión, no se duplica el punto actual');
  ok(sb.evoPuntos(armar({}, mixto)).length === 0, 'sin revisiones no hay evolución');
  const dp = sb.evoPuntos(ee); ok(dp.every((p) => D.every((d) => p.d[d.id] >= 0 && p.d[d.id] <= 100) && p.n >= 0 && p.n <= 4), 'cada punto trae el puntaje de las ocho dimensiones y su nivel');
  ok(sb.evoEstado([50]) === 'Pendiente' && sb.evoEstado([]) === 'Pendiente' && sb.evoEstado([40, 80]) === 'Meta alcanzada' && sb.evoEstado([75, 75]) === 'Meta alcanzada' && sb.evoEstado([30, 50]) === 'En avance' && sb.evoEstado([50, 30]) === 'Retroceso' && sb.evoEstado([50, 50.5]) === 'Sin cambio', 'el estado: pendiente con una sola revisión, meta alcanzada desde 75%, en avance, retroceso o sin cambio');
  ok(Math.abs(sb.idx04(60) - 2.4) < 1e-9 && sb.idx04(75) === 3, 'el índice de 0 a 4 es el puntaje ÷ 25 (la meta, 75%, es 3,0)');

  // pantalla de la evolución
  vm.runInContext("modo='auditor'", sandbox);
  const gid2 = sb.document.getElementById; sb.document.getElementById = () => ({ ...el(), options: [] });
  const ha = sb.evoHtml(ee), hv = sb.evoHtml(armar({}, mixto));
  vm.runInContext("modo='cliente'", sandbox);
  const hc = sb.evoHtml(ee), hcv = sb.evoHtml(armar({}, mixto));
  vm.runInContext("modo='auditor'", sandbox); const eRo = armar({}, mixto); eRo.ro = true; const hro = sb.evoHtml(eRo);
  sb.document.getElementById = gid2;
  ok(/Guardar esta evaluación como revisión/.test(ha) && /evoGuardar\(\)/.test(ha) && /<option selected>Revisión a 6 meses<\/option>/.test(ha) && /Aún no hay revisiones guardadas\. Guarde la evaluación de hoy como <strong>diagnóstico inicial<\/strong>/.test(hv) && /<option selected>Diagnóstico inicial<\/option>/.test(hv), 'el consultor ve el formulario para guardar una revisión, con el nombre sugerido según las que ya hay');
  ok(!/evo-f/.test(hc) && !/evoBorrar/.test(hc) && /Aún no hay revisiones guardadas\./.test(hcv) && !/evo-f/.test(hro), 'el cliente (o una sesión de solo lectura) no puede guardar ni eliminar revisiones');
  ok(/<svg class="evo-svg"/.test(ha) && /Meta: nivel 3 \(75%\)/.test(ha) && ee.rv.every((r) => ha.includes(r.e)) && /Objetivo/.test(ha) && /Variación/.test(ha) && /Estado/.test(ha) && D.every((d) => ha.includes(d.n)) && /Puntaje global/.test(ha), 'la evolución muestra el gráfico, la tabla por dimensión con objetivo, variación y estado, y el puntaje global');
  ok(/evoBorrar\('/.test(ha) && /Eliminar/.test(ha) && /evo-svg/.test(hc) && ee.rv.every((r) => hc.includes(r.e)), 'el consultor puede eliminar revisiones y el cliente ve la evolución publicada');
  ok(/aria-label="Puntaje global en cada revisión:/.test(ha) && /<caption class="sr-only">Seguimiento/.test(ha), 'el gráfico y la tabla son accesibles (descripción y título para lectores de pantalla)');
  const inyec = armar({ nombre: '<img src=x onerror=1>' }, mixto); inyec.rev('<script>x</script>', 1); sb.document.getElementById = () => ({ ...el(), options: [] });
  const hi = sb.evoHtml(inyec); sb.document.getElementById = gid2;
  ok(!/<script>x/.test(hi) && /&lt;script&gt;/.test(hi), 'el nombre de una revisión se escapa (no ejecuta HTML)');

  // ── documentos: informe ejecutivo y acta ──
  const eD = completa({ nombre: 'Clínica <b>Sur</b> SpA', sector: 'salud', 'tamaño': '51-200' }, mixto); eD.rev('Diagnóstico inicial', 1790000000000); eD.a['SEG-01'] = 3;
  const di = sb.docInforme(eD), sc = eD.sc();
  ok(/<h1>Informe ejecutivo<\/h1>/.test(di) && !/<b>Sur<\/b>/.test(di) && /Clínica &lt;b&gt;Sur&lt;\/b&gt; SpA/.test(di) && /Salud \/ Clínicas/.test(di) && /Mediana/.test(di), 'el informe lleva empresa, rubro y tamaño, con el nombre escapado');
  ok(new RegExp('nivel ' + eD.ml(sc.g).n + ' \\(' + eD.ml(sc.g).nm + '\\)').test(di) && new RegExp('<strong>' + sc.g + '%</strong>').test(di) && new RegExp('índice <strong>' + (sc.g / 25).toFixed(1).replace('.', ',') + ' de 4,0').test(di), 'el resumen dice el nivel, el puntaje y el índice reales');
  ok(D.every((d) => di.includes(d.n)) && /Resultado por dimensión/.test(di) && /Puntaje global/.test(di), 'el informe muestra las ocho dimensiones');
  ok(eD.cl2().length > 0 && new RegExp('De las ' + eD.cl2().length + ' obligaciones evaluadas, ' + eD.cl2().filter((c2) => c2.st === 'green').length + ' cumplen, ' + eD.cl2().filter((c2) => c2.st === 'yellow').length + ' cumplen parcialmente y ' + eD.cl2().filter((c2) => c2.st === 'red').length + ' no cumplen').test(di), 'el resumen cuenta bien las obligaciones que cumplen, parcial y no cumplen');
  const rD = sb.ruta(eD); ok(rD.olas.filter((o) => o.items.length).every((o) => di.includes('Ola ' + o.n + ' · ' + o.t)) && new RegExp(rD.items.length + ' brechas ordenadas').test(di) && rD.olas.every((o) => o.items.length <= 5 || di.includes('Y ' + (o.items.length - 5) + ' más')), 'el informe resume la hoja de ruta por oleadas (hasta 5 iniciativas por oleada)');
  ok(/<h2>Evolución<\/h2>/.test(di) && /class="dc-t"/.test(di) && /Diagnóstico inicial/.test(di), 'con revisiones guardadas, el informe incluye la evolución');
  ok(!/<h2>Evolución<\/h2>/.test(sb.docInforme(armar({}, mixto))), 'sin revisiones, el informe no tiene evolución');
  ok(/no es una auditoría ni una opinión legal/.test(di) && /sujetos a revisión/.test(di) && /Próximos pasos/.test(di) && /Incluye|incluye la ponderación por exposición sectorial y el ajuste por tamaño/.test(di) && new RegExp('sin ajustes sería ' + sc.gb + '%').test(di), 'el informe aclara su alcance, los ajustes de rubro y tamaño y el puntaje sin ajustes');
  ok(/Aún no hay respuestas para resumir/.test(sb.docInforme(new E2())), 'sin respuestas el informe lo dice');
  const alerta = armar({}, (q) => (q.fl && q.fl.length ? q.fl[0] : 3)); ok(/<h2>Alertas críticas<\/h2>/.test(sb.docInforme(alerta)) && !/<h2>Alertas críticas<\/h2>/.test(sb.docInforme(armar({}, () => 3))), 'las alertas críticas salen en el informe solo si las hay');
  // acta
  sb.window.PZ = { entries: [
    { id: 'a'.repeat(20), autor: 'Marcela Soto', rol: 'cliente', cargo: 'Gerente de TI', qid: 'GOB-01', texto: 'Lo ve TI <i>hoy</i>', creadoEn: 1790000000000, adjuntos: [{ n: 'politica.pdf', z: 10, p: 1 }], imgs: ['data:image/jpeg;base64,AAAAAAAAAAAAAAAAAAAAAAAA'] },
    { id: 'b'.repeat(20), autor: 'Carlos Jerez', rol: 'consultor', qid: 'general', texto: 'Acordamos revisar en 3 meses', creadoEn: 1790000100000 }] };
  const da = sb.docActa(eD);
  ok(/<h1>Acta de la reunión<\/h1>/.test(da) && /Marcela Soto — Cliente, Gerente de TI/.test(da) && /Carlos Jerez — Consultor AlignData/.test(da), 'el acta lista a los participantes de la pizarra con su rol y cargo');
  ok(/Lo ve TI &lt;i&gt;hoy&lt;\/i&gt;/.test(da) && !/<i>hoy<\/i>/.test(da) && /Adjuntos: politica\.pdf/.test(da) && /1 imagen\./.test(da), 'el acta incluye los comentarios por pregunta (escapados) con sus adjuntos e imágenes');
  ok(/Comentarios y acuerdos generales/.test(da) && /Acordamos revisar en 3 meses/.test(da), 'el acta incluye los comentarios generales como acuerdos');
  ok(eD.ga().filter((q) => eD.a[q.id] !== undefined).every((q) => da.includes(q.id) && da.includes('Respuesta: <strong>' + eD.a[q.id] + ' · ')), 'el acta lista cada respuesta elegida con su texto');
  ok(/Compromisos propuestos \(Ola 1\)/.test(da) && /Consultor AlignData<\/div><div><span><\/span>Representante de la empresa/.test(da) && /no es una auditoría ni una opinión legal/.test(da), 'el acta tiene compromisos de la Ola 1, líneas de firma y aclaración de alcance');
  sb.window.PZ = { entries: [] }; ok(/No se registraron participantes/.test(sb.docActa(eD)) && !/Comentarios y acuerdos generales/.test(sb.docActa(eD)), 'sin pizarra, el acta lo dice y no inventa participantes');
  delete sb.window.PZ;
  // imprimir
  const gid3 = sb.document.getElementById, bd = sb.document.body, clases = new Set(), dc = { innerHTML: '' };
  sb.document.getElementById = (i) => (i === 'doc' ? dc : el()); sb.document.body = { classList: { add: (c2) => clases.add(c2), remove: (c2) => clases.delete(c2) } };
  sb.imprimirDoc('informe');
  ok(clases.has('imp-doc') && /Informe ejecutivo D360 - Clínica|Informe ejecutivo D360 - /.test(sb.__impreso) && dc.innerHTML.includes('Informe ejecutivo'), 'imprimir el informe lo arma, marca la página para imprimir solo el documento y pone el título al archivo');
  sb.__eventos.afterprint && sb.__eventos.afterprint(); ok(!clases.has('imp-doc') && dc.innerHTML === '' && /Diagnóstico|D360/.test(sb.document.title), 'al terminar de imprimir se restaura la pantalla y el título');
  sb.imprimirDoc('acta'); ok(/Acta D360 - /.test(sb.__impreso) && dc.innerHTML.includes('Acta de la reunión'), 'imprimir el acta pone su propio título');
  sb.__eventos.afterprint && sb.__eventos.afterprint();
  sb.document.getElementById = gid3; sb.document.body = bd;
  // pantalla y estilos
  ok(/imprimirDoc\(\\'informe\\'\)/.test(codigo) && /imprimirDoc\(\\'acta\\'\)/.test(codigo) && /modo==='cliente'\|\|modo==='auditor'/.test(codigo), 'los resultados tienen los botones «Informe ejecutivo» y «Acta de la reunión»');
  ok(/<script src="app\.js"><\/script>\s*<script src="ruta\.js"><\/script>/.test(ih) && /<div id="doc" aria-hidden="true"><\/div>\s*<script src="theme\.js">/.test(ih), 'ruta.js se carga después de app.js y el contenedor de documentos es hijo directo de <body>');
  ok(/body\.imp-doc>\*\{display:none!important\}/.test(css) && /body\.imp-doc>#doc\{display:block!important\}/.test(css) && /#doc\{display:none\}/.test(css), 'al imprimir un documento solo se ve el documento; en pantalla está oculto');
  ok(/\.dc-fir/.test(css) && /\.dc h2/.test(css), 'el documento tiene sus estilos de impresión');
}

seccion('21. Novena dimensión: Cultura y Formación');
{
  const raiz13 = path.resolve(path.dirname(file), '..');
  const leer13 = (f) => fs.readFileSync(path.join(raiz13, f), 'utf8').replace(/\r\n/g, '\n');
  const ih = leer13('public/index.html'), sb = sandbox;
  const cul = Q.filter((q) => q.dm === 'cultura');
  ok(D.length === 9 && D[8].id === 'cultura' && D[8].n === 'Cultura y Formación' && D[8].ic === 'graduation-cap' && D.every((d) => d.w >= 1 && d.w <= 1.2), 'hay nueve dimensiones y la novena es Cultura y Formación, con peso dentro del rango del modelo');
  ok(cul.map((q) => q.id).sort().join() === 'CUL-01,CUL-02,CUL-03,CUL-04,GOB-03' && cul.every((q) => !q.iS) && cul.length === 5, 'Cultura tiene 5 preguntas base: la capacitación (GOB-03, que conserva su código para no perder respuestas guardadas) y 4 nuevas');
  ok(Q.length === 49 && Q.filter((q) => !q.iS).length === 41 && Q.filter((q) => q.iS).length === 8, 'quedan 49 preguntas (45 + 4 nuevas): 41 base y las 8 de profundización de antes');
  ok(cul.every((q) => q.op.length === 4 && q.ex.length === 4 && q.ev && q.cx && q.s && q.ar && q.w >= 0.8 && q.w <= 1.3 && Array.isArray(q.fl)), 'cada pregunta de Cultura tiene cuatro respuestas, cuatro ejemplos, cómo comprobarlo, contexto legal y peso válido');
  ok(cul.every((q) => /Art/.test(q.ar) && (q.id === 'GOB-03' || /buena práctica|14 sexies/.test(q.ar))) && cul.every((q) => /no exige|voluntari|exige/.test(q.cx)), 'las preguntas nuevas dicen si la ley lo exige o es buena práctica (el modelo de prevención es voluntario)');
  ok(cul.every((q) => !q.fl.length) && Q.find((q) => q.id === 'GOB-03').dm === 'cultura', 'ninguna pregunta de Cultura genera alerta crítica (la ley no exige capacitar)');
  ok(Array.isArray(A.cultura.ac) && A.cultura.ac.length >= 4 && A.cultura.ac.every((a) => a.t && a.p && a.r) && A.cultura.e && !A.gobernanza.ac.some((a) => /capacitación periódica/.test(a.t)) && A.gobernanza.ac.length >= 4, 'Cultura tiene su plan de acción y la acción de capacitación salió de Gobernanza');
  ok(CL.some((c2) => c2.qs.includes('CUL-01') && c2.qs.includes('CUL-02') && c2.qs.includes('GOB-03')) && CL.some((c2) => c2.qs.includes('CUL-03') && c2.qs.includes('CUL-04') && /voluntario/.test(c2.ob)), 'las preguntas de Cultura alimentan el semáforo de obligaciones (el modelo de prevención se marca como voluntario)');
  ok(SEC_DIM.cultura && SEC_DIM.cultura.length > 0 && EF['CUL-01'] && EF['CUL-04'], 'Cultura entra en la ponderación sectorial y en la hoja de ruta');
  // el puntaje
  const arm = (f) => { const e = new E2(); e.p = {}; Q.filter((q) => !q.iS).forEach((q, i) => { e.a[q.id] = f(q, i); }); return e; };
  ok(arm(() => 3).sc().g === 100 && arm(() => 0).sc().g === 0 && arm((q) => (q.dm === 'cultura' ? 0 : 3)).sc().g < 100 && arm((q) => (q.dm === 'cultura' ? 0 : 3)).sc().d.cultura === 0, 'todo en 3 vale 100; sin Cultura el puntaje baja y la dimensión vale 0');
  const antes = new E2(); antes.cargar({ perfil: {}, respuestas: Object.fromEntries(Q.filter((q) => !q.iS && q.dm !== 'cultura').map((q) => [q.id, 3]).concat([['GOB-03', 3]])) });
  ok(antes.a['GOB-03'] === 3 && antes.sc().d.cultura === 100 && antes.sc().d.gobernanza === 100 && antes.nx().dm === 'cultura' && antes.pg().d < antes.pg().t, 'una sesión guardada conserva su respuesta de capacitación (ahora en Cultura) y queda pendiente lo nuevo');
  ok(new RegExp('en ' + D.length + ' dimensiones').test(ih) && /<strong>9<\/strong> dimensiones/.test(ih) && !/\b8 dimensiones/.test(ih), 'la portada dice nueve dimensiones');
  ok(/\$\{D\.length\} dimensione/.test(leer13('public/app.js')) && !/las 8 dimensiones/.test(leer13('public/app.js')), 'el texto de resultados cuenta las dimensiones en vez de decir 8');
}

seccion('22. Presencia: quién está conectado en la reunión en vivo');
{
  const raiz14 = path.resolve(path.dirname(file), '..');
  const leer14 = (f) => fs.readFileSync(path.join(raiz14, f), 'utf8').replace(/\r\n/g, '\n');
  const vj = leer14('public/vivo.js'), sj = leer14('public/sesiones.js'), ng = leer14('public/nube.js'), np = leer14('public/nube-prueba.js'), rg = leer14('firestore.d360.rules'), cs = leer14('public/styles.css'), pj = leer14('public/pizarra.js');
  // cliente
  ok(/id="vh-quien"/.test(vj) && /Participa como <strong>/.test(vj) && /vivoCambiarNombre/.test(vj), 'el cliente ve en su pantalla una línea «Participa como <su nombre>» con la opción de cambiarlo (en el celular el nombre de la barra superior no cabe)');
  ok(/Escriba su nombre para participar/.test(vj), 'si aún no escribió su nombre, la línea se lo pide');
  ok(/quien\(\); lucide\.createIcons\(\)/.test(vj) && /esc\(p\.n\)/.test(vj) && /esc\(p\.c\)/.test(vj), 'la línea se actualiza con cada cambio de pregunta y el nombre y el cargo se escapan');
  ok(/const pid = Array\.from\(crypto\.getRandomValues\(new Uint8Array\(20\)\)/.test(vj) && !/localStorage\.setItem\([^)]*pid/.test(vj), 'cada dispositivo usa un código al azar de 20 letras o números que no se guarda en el equipo');
  ok(/const latir = \(\) => \{ if \(salio\) return; N\.vivoLatido\(tk\); if \(N\.vivoPresente && PZ\.persona && PZ\.persona\.n\) N\.vivoPresente\(tk, pid, PZ\.persona\); \}/.test(vj) && /hb = setInterval\(latir, 25000\)/.test(vj) && /visibilitychange', \(\) => \{ if \(!document\.hidden\) latir\(\)/.test(vj), 'el dispositivo avisa su nombre al entrar, cada 25 segundos y al volver a la pestaña');
  ok(/vivoCambiarNombre = \(\) => PZ\.pedirPersona\(true\)\.then\(\(\) => \{ barra\(\); quien\(\); latir\(\); \}\)/.test(vj), 'al cambiar el nombre, se actualiza la pantalla y se avisa al consultor');
  // datos
  const exp = (src) => ['vivoPresente', 'vivoPresentes', 'vivoPresentesLimpiar'].every((f) => new RegExp('export (async )?function ' + f + '\\b').test(src));
  ok(exp(ng) && exp(np), 'la capa de datos (nube y modo de prueba) tiene las tres funciones de presencia');
  ok(/collection\(db, 'en_vivo', tk, 'presentes'\)/.test(ng) && /\{ n: persona\.n, \.\.\.\(persona\.c \? \{ c: persona\.c \} : \{\}\), t: F\.serverTimestamp\(\) \}/.test(ng), 'en la nube cada presencia guarda solo nombre, cargo y la hora del servidor');
  // consultor
  ok(/presentes\.filter\(\(p\) => p\.n && Date\.now\(\) - \(\+p\.t \|\| 0\) < 70000\)/.test(sj) && /new Map\(.*p\.n\.toLowerCase\(\) \+ '\|' \+ \(p\.c \|\| ''\)\.toLowerCase\(\)/.test(sj), 'el consultor considera conectado a quien avisó en los últimos 70 segundos (el aviso es cada 25) y cuenta una sola vez a la misma persona aunque recargue o use dos dispositivos');
  ok(/pr\.length === 1 \? 'Conectado: ' \+ pr\[0\]\.n\.split\(' '\)\[0\]/.test(sj) && /pr\.length \+ ' conectados'/.test(sj) && /'Cliente conectado'/.test(sj) && /'En vivo · esperando al cliente'/.test(sj), 'el botón dice «Conectado: <nombre>», «N conectados», «Cliente conectado» (sin nombre aún) o «esperando al cliente»');
  ok(/class="dv-pres"/.test(sj) && /esc\(p\.n\)/.test(sj) && /Hay ' \+ pr\.length \+ ' personas conectadas/.test(sj), 'el diálogo lista a las personas conectadas, con el nombre escapado');
  ok(/N\.vivoPresentes\(en\.viv\.token/.test(sj) && /vivoPresentesLimpiar\(en\.viv\.token\)/.test(sj) && /if \(presOff\) \{ presOff\(\); presOff = null; \} presentes = \[\];\s*PZ\.vivo\(null\)/.test(sj), 'el consultor escucha las presencias mientras dura la reunión y las borra al terminarla');
  // reglas
  ok(/match \/presentes\/\{pid\}/.test(rg) && /allow get, list: if esConsultor\(\);/.test(rg.slice(rg.indexOf('match /presentes/'))) && /request\.resource\.data\.t == request\.time/.test(rg) && /hasOnly\(\['n', 'c', 't'\]\)/.test(rg), 'las reglas permiten a un cliente escribir solo su presencia (nombre, cargo y hora del servidor) y solo el consultor las lee');
  ok(/function enlaceVigente\(\)/.test(rg) && rg.indexOf('function enlaceVigente()') < rg.indexOf('match /presentes/') && (rg.match(/function enlaceVigente\(\)/g) || []).length === 1, 'enlaceVigente está definida una sola vez, a nivel de en_vivo, y la usan la pizarra y las presencias');
  // error del nombre: el atributo hidden debe ocultar siempre
  ok(/\[hidden\]\{display:none!important\}/.test(cs) && /er\.hidden = true/.test(pj), 'un elemento con hidden nunca se muestra (el aviso «Escriba su nombre» aparecía antes de escribir)');
}

seccion('23. Menú lateral del consultor');
{
  const raiz15 = path.resolve(path.dirname(file), '..');
  const leer15 = (f) => fs.readFileSync(path.join(raiz15, f), 'utf8').replace(/\r\n/g, '\n');
  const lj = leer15('public/lateral.js'), ih = leer15('public/index.html'), cs = leer15('public/styles.css'), aj = leer15('public/app.js');
  const todo = ['app.js', 'ruta.js', 'pizarra.js', 'sesiones.js', 'vivo.js'].map((f) => leer15('public/' + f)).join('\n');
  // estructura
  ok(/<aside class="lat-menu" id="sb" aria-label="Menú del consultor" hidden><\/aside>/.test(ih) && /<div class="sb-vel" id="sb-vel" hidden><\/div>/.test(ih) && /<button type="button" class="sb-burger" id="sb-burger" aria-label="Abrir el menú" aria-expanded="false" aria-controls="sb" hidden>/.test(ih), 'la página tiene el menú lateral, su fondo y el botón que lo abre en pantallas angostas, ocultos hasta que haya una cuenta de consultor');
  ok(/<script src="sesiones\.js"><\/script>[\s\S]*<script src="lateral\.js"><\/script>\s*<script src="tour\.js"><\/script>\s*<\/body>/.test(ih), 'lateral.js se carga al final, después de la lógica que usa');
  ok(/if\(window\.sbActualizar\)setTimeout\(window\.sbActualizar,0\);/.test(aj), 'cada cambio de pantalla actualiza el menú');
  // cada opción llama a una función que existe
  const llamadas = ['dash', 'nueva', 'edt', 'tix', 'rq', 'sr', 'ss', 'pzDlg', 'vivoDlg', 'metDlg', 'cmp', 'imprimirDoc', 'pdf', 'salir'];
  ok(llamadas.every((f) => new RegExp('(function ' + f + '[(]|window[.]' + f + ' =)').test(todo)), 'todas las funciones que llama el menú existen (' + llamadas.join(', ') + ')');
  ok(llamadas.every((f) => lj.includes(f + '(') || (f === 'salir' && lj.includes('window.salir'))), 'el menú usa cada una de esas funciones: no tiene lógica propia');
  // quién lo ve
  ok(/const visible = \(\) => !!usuario\(\) && !hayCliente\(\) && !\['s0', 'se', 'sv', ''\]\.includes\(pantalla\(\)\)/.test(lj) && /modo === 'cliente' \|\| modo === 'invitado'/.test(lj) && /window\.pzUsuario/.test(lj), 'solo se muestra con una cuenta de consultor, y no en el ingreso, los avisos ni la vista del cliente');
  ok(/const enSesion = \(\) => typeof en !== 'undefined' && !!en\.sid && !en\.ro && typeof modo !== 'undefined' && modo === 'auditor'/.test(lj), 'las opciones de la sesión solo aparecen con una sesión abierta y editable');
  // contenido
  const ids = [...lj.matchAll(/\{ id: '(\w+)', ic: '([\w-]+)', t: /g)].map((m) => m[1]);
  ok(['ses', 'new', 'preg', 'idx', 'res', 'hoja', 'evo', 'pz', 'viv', 'cmp', 'inf', 'act', 'pdf', 'met'].every((i) => ids.includes(i)) && new Set(ids).size === ids.length, 'el menú tiene Sesiones, Nueva sesión, Preguntas, Índice, Resultados, Hoja de ruta, Evolución, Pizarra, Reunión en vivo, Compartir, Informe ejecutivo, Acta, PDF y Cómo se calcula, sin repetir');
  ok(/id="sb-tema"|id="sb-tema"/.test(lj) && /Cerrar sesión/.test(lj) && /sb-cuenta/.test(lj) && /Consultor/.test(lj) && /avatarHtml\(nom, u\.foto\)/.test(lj), 'tiene la cuenta (foto, nombre y correo), el cambio de tema y cerrar sesión');
  ok(/off: \(\) => !respondidas\(\)/.test(lj) && /b\.disabled = off/.test(lj), 'Resultados, Hoja de ruta, Evolución y los documentos se desactivan mientras no haya respuestas');
  ok(/badge: \(\) => \{ try \{ const p = en\.pg\(\); return p\.d \+ '\/' \+ p\.t;/.test(lj) && /ruta\(en\)\.items\.length/.test(lj) && /\(en\.rv \|\| \[\]\)\.length/.test(lj) && /#bpz \.pz-cnt/.test(lj) && /punto: \(\) =>/.test(lj), 'las insignias muestran el avance, las iniciativas, las revisiones, los comentarios de la pizarra y si el cliente está conectado');
  // accesibilidad
  ok(/<nav class="sb-nav" aria-label="Menú principal">/.test(lj) && /aria-labelledby="sb-sec-\$\{i\}"/.test(lj) && /setAttribute\('aria-current', 'page'\)/.test(lj) && /b\.title = t; b\.setAttribute\('aria-label', t\)/.test(lj), 'es una navegación con nombre, cada grupo tiene su título, la opción actual se marca con aria-current y cada botón tiene nombre aunque solo se vean íconos');
  ok(/aria-expanded/.test(lj) && /aria-pressed/.test(lj) && /e\.key === 'Escape'/.test(lj) && /bu\.focus\(\)/.test(lj), 'los botones del menú informan su estado y Escape cierra el cajón devolviendo el foco');
  ok(/try \{ m = localStorage\.getItem\(LS\); \} catch/.test(lj) && /try \{ localStorage\.setItem\(LS, v \? 'mini' : 'full'\); \} catch/.test(lj), 'recordar si el menú está contraído no falla sin almacenamiento');
  // estilos
  ok(/\.lat-menu\{position:fixed;[^}]*backdrop-filter:blur\(22px\) saturate\(160%\)/.test(cs) && /\.sb-hr\{[^}]*linear-gradient\(90deg,transparent/.test(cs) && /\.sb-glow\{/.test(cs), 'el menú es un panel de vidrio flotante con franja de luz y líneas divisorias que se desvanecen');
  ok(/@media\(min-width:1100px\)\{\s*body\.con-sb\{padding-left:calc\(var\(--sb-w\) \+ 28px\)/.test(cs) && /@media\(max-width:1099px\)\{\s*\.lat-menu\{transform:translateX\(/.test(cs), 'en escritorio el contenido deja lugar al menú; en pantallas angostas es un cajón');
  ok(/@media\(min-width:1100px\)\{\s*body\.sb-mini \.lat-menu\{width:var\(--sb-mini\)/.test(cs) && !/@media\(max-width:1099px\)[^@]*sb-mini[^@]*display:revert/.test(cs), 'la versión de solo íconos existe solo en escritorio: el cajón siempre muestra los nombres');
  ok(/\.sb-it:focus-visible[^{]*\{outline/.test(cs) && /prefers-reduced-motion:reduce\)\{\.lat-menu,body\.con-sb\{transition:none\}/.test(cs) && /@media print\{\.lat-menu,\.sb-vel,\.sb-burger\{display:none!important\}body\.con-sb\{padding-left:0!important\}\}/.test(cs), 'el foco es visible, respeta «reducir movimiento» y el menú no sale en el PDF');
}

seccion('24. Tour guiado para el consultor y para el cliente');
{
  const raiz16 = path.resolve(path.dirname(file), '..');
  const leer16 = (f) => fs.readFileSync(path.join(raiz16, f), 'utf8').replace(/\r\n/g, '\n');
  const tj = leer16('public/tour.js'), ih = leer16('public/index.html'), cs = leer16('public/styles.css'), lj = leer16('public/lateral.js');
  const fuentes = ['app.js', 'ruta.js', 'servicio.js', 'pizarra.js', 'sesiones.js', 'vivo.js', 'lateral.js'].map((f) => leer16('public/' + f)).join('\n') + ih;
  // los recorridos: se cargan en un contexto aparte para revisar su contenido real
  const m = tj.match(/const R = \{([\s\S]*?)\n  \};\n\n  \/\/ ── estado y elementos/);
  ok(!!m, 'el archivo define los recorridos');
  const R = vm.runInNewContext('(function(){ const menu = () => null, q = () => null; return {' + m[1] + '\n }; })()');
  const nombres = Object.keys(R);
  ok(['panel', 'sesion', 'resultados', 'invitado', 'cliente'].every((k) => nombres.includes(k)) && nombres.length === 5, 'hay cinco recorridos: panel, sesión y resultados del consultor, y reunión en vivo y resultados del cliente');
  ok(nombres.every((k) => R[k].nombre && R[k].pasos.length >= 6 && R[k].pasos.length <= 8 && R[k].pasos.every((p) => p.t && p.x && p.t.length <= 40 && p.x.length >= 40 && p.x.length <= 260)), 'cada recorrido tiene entre 6 y 8 pasos, con un título corto y una explicación breve');
  ok(nombres.every((k) => R[k].pasos.filter((p) => !p.sel).length <= 2), 'solo la bienvenida y el cierre pueden no apuntar a un elemento');
  // los elementos a los que apuntan existen en la aplicación
  const sels = [...tj.matchAll(/q\('([^']+)'\)|menu\('([^']+)'\)/g)].map((x) => x[1] || x[2]);
  const existe = (s) => s.split(/[\s>]+/).every((p) => {
    const id = p.match(/#([\w-]+)/), cl = [...p.matchAll(/\.([\w-]+)/g)].map((x) => x[1]), at = p.match(/data-id="(\w+)"/);
    return (!id || fuentes.includes(id[1])) && cl.every((c2) => fuentes.includes(c2)) && (!at || lj.includes("id: '" + at[1] + "'"));
  });
  ok(sels.length >= 20 && sels.every(existe), 'todos los elementos que resalta el tour existen en la aplicación (' + sels.length + ' selectores)');
  // lo que dicen coincide con la aplicación
  const todoTxt = JSON.stringify(R);
  ok(/1 a 4 elige y Enter avanza/.test(todoTxt) && /hasta 5 MB/.test(todoTxt) && /Ctrl\+V/.test(todoTxt), 'el tour menciona los atajos y límites reales (teclas 1 a 4, Enter, Ctrl+V y 5 MB)');
  ok(/no se muestran puntajes/.test(JSON.stringify(R.invitado)), 'el tour del invitado aclara que no verá puntajes durante la reunión (como ocurre en la aplicación)');
  ok(/3, 6 y 12 meses/.test(JSON.stringify(R.resultados)) && /cuatro oleadas/.test(JSON.stringify(R.resultados)), 'el tour de resultados explica la evolución (3, 6 y 12 meses) y las cuatro oleadas de la hoja de ruta');
  // quién ve cuál
  ok(/if \(m === 'invitado'\) return s === 'sv' \? 'invitado' : ''/.test(tj) && /if \(m === 'cliente'\) return s === 's3' \? 'cliente' : ''/.test(tj) && /if \(!usuario\(\)\) return ''/.test(tj) && /s === 'sd' \? 'panel' : s === 's2' \? 'sesion' : s === 's3' \? 'resultados' : ''/.test(tj), 'cada pantalla tiene su recorrido: el invitado ve el de la reunión, el lector de resultados el suyo, y el consultor el del panel, la sesión o los resultados');
  // arranque y repetición
  ok(/const visto = \(c\) => \{ try \{ return localStorage\.getItem\(LS\(c\)\) === V; \} catch/.test(tj) && /const marcar = \(c\) => \{ try \{ localStorage\.setItem\(LS\(c\), V\); \} catch/.test(tj), 'recordar que ya lo vio no falla sin almacenamiento');
  ok(/if \(!c \|\| activo \|\| visto\(c\)\) return;/.test(tj) && /document\.querySelector\('dialog\[open\]'\)\) return/.test(tj) && /\+\+estable >= 3/.test(tj), 'se muestra solo la primera vez, no mientras hay un diálogo abierto (por ejemplo, el del nombre) y cuando la pantalla ya está estable');
  ok(/marcar\(activo\.ctx\); clearInterval\(seguir\)/.test(tj), 'terminar o saltar el recorrido lo marca como visto');
  ok(/id="tour-btn"[^>]*hidden/.test(ih) && /b\.hidden = !\(R\[ctx\] && \(m === 'cliente' \|\| m === 'invitado'\)\)/.test(tj), 'el cliente y el invitado tienen un botón «Tour» en la barra superior para repetirlo');
  ok(/id="sb-tour"/.test(lj) && /window\.tourIniciar\(null, true\)/.test(lj), 'el consultor lo repite desde «Tour de esta pantalla» en el menú lateral');
  ok(/window\.tourIniciar = iniciar/.test(tj) && /iniciar\(ctx, manual\)/.test(tj), 'el recorrido se puede iniciar a mano');
  // robustez
  ok(/while \(i >= 0 && i < pasos\.length && pasos\[i\]\.sel && !objetivo\(pasos\[i\]\)\) i \+= dir/.test(tj), 'si un elemento no está en pantalla (por ejemplo, sin sesiones o con el menú oculto), el paso se salta');
  ok(/const menu = \(s\) => \{ const el = q\(s\); return visible\(el\) \? el : q\('#sb-burger'\); \}/.test(tj), 'en pantallas angostas, los pasos del menú apuntan al botón que lo abre');
  // accesibilidad
  ok(/role="dialog" aria-modal="true" aria-labelledby="tr-t" aria-describedby="tr-x"/.test(tj) && /aria-live="polite"/.test(tj) && /aria-hidden="true"/.test(tj), 'la tarjeta es un diálogo con título y descripción, anuncia el paso y oculta el foco decorativo a los lectores de pantalla');
  ok(/e\.key === 'Escape'/.test(tj) && /ArrowRight/.test(tj) && /ArrowLeft/.test(tj) && /e\.key === 'Tab'/.test(tj) && /previoFoco\.focus/.test(tj) && /\$\('tr-n'\)\.focus/.test(tj), 'se usa con el teclado: flechas, Escape, Tab dentro de la tarjeta, foco al abrir y al cerrar');
  ok(/behavior: RM\(\) \? 'auto' : 'smooth'/.test(tj) && /prefers-reduced-motion:reduce\)\{\.tr-foco,\.tr-pt i\{transition:none\}\}/.test(cs), 'respeta «reducir movimiento»');
  ok(/@media print\{\.tr,\.tour-btn\{display:none!important\}\}/.test(cs) && /\.tr\{position:fixed;inset:0;z-index:300\}/.test(cs) && /\.tr-card\.tr-hoja\{/.test(cs), 'no sale en los PDF, queda sobre el menú y en el celular la tarjeta es una hoja inferior');
  ok(!/https?:\/\//.test(tj) && !/import\(/.test(tj), 'no carga nada externo');
}

seccion('25. Menú lateral y barra superior: estilos sin choques con el resto de la aplicación');
{
  const raiz17 = path.resolve(path.dirname(file), '..');
  const leer17 = (f) => fs.readFileSync(path.join(raiz17, f), 'utf8').replace(/\r\n/g, '\n');
  const cs = leer17('public/styles.css'), ih = leer17('public/index.html'), aj = leer17('public/app.js');
  const iM = cs.indexOf('/* ── menú lateral del consultor');
  ok(iM > 0, 'el bloque del menú lateral existe');
  // la clase «sb» ya la usan las acciones del plan: el menú no puede definir reglas para ese nombre
  const antes = cs.slice(0, iM), despues = cs.slice(iM);
  ok(/class="sb"/.test(aj) && /\.sb\{flex:1\}/.test(antes), 'las acciones del plan de acción ya usan la clase «sb»');
  ok(!/(^|[^\w-])\.sb([^\w-]|$)/.test(despues), 'los estilos nuevos (menú, tour, barra superior) no definen reglas para la clase «sb»');
  // ningún nombre de clase del menú o del tour se usa ya en el resto de la aplicación
  const nuevas = [...new Set([...despues.matchAll(/\.((?:sb|tr|lat|tour)-[\w-]+)/g)].map((m) => m[1]))];
  ok(nuevas.length > 30 && nuevas.every((c2) => !new RegExp('\.' + c2.replace(/-/g, '\-') + '(?![\w-])').test(antes)), 'ninguno de los ' + nuevas.length + ' nombres de clase del menú y del tour ya estaba definido en la aplicación');
  ok(/<aside class="lat-menu" id="sb"/.test(ih) && !/<aside class="sb"/.test(ih), 'el menú usa la clase «lat-menu»');
  // el PDF no oculta nada del informe
  const pr = [...despues.matchAll(/@media print\{([^}]*)\}/g)].map((m) => m[1]).join(' ');
  ok(!/(^|[,\s])\.sb[,{\s]/.test(pr), 'las reglas de impresión del menú no ocultan las acciones del plan');
  // barra superior de vidrio
  ok(/\.topbar\{top:calc\(10px \+ env\(safe-area-inset-top,0px\)\);margin:10px 12px 0;[^}]*border-radius:22px;/.test(despues) && /\.topbar[^{]*\{[^}]*backdrop-filter:blur\(22px\) saturate\(160%\)/.test(despues) && /\.topbar::before\{content:"";position:absolute;inset:0;border-radius:inherit;[^}]*z-index:-1/.test(despues), 'la barra superior es un panel de vidrio flotante con franja de luz, igual que el menú lateral');
  ok(/\.topbar::after\{[^}]*background:var\(--nv-h,/.test(despues) && /\.nvbar\{top:calc\(82px/.test(despues), 'el color del nivel se ve como una línea de luz en el borde inferior y la barra flotante del nivel queda debajo');
  ok(/body\.con-sb \.topbar\{margin-left:0\}/.test(despues) && /@media\(max-width:640px\)\{\.topbar\{margin:8px 8px 0/.test(despues), 'la barra superior se alinea con el contenido junto al menú y se ajusta en el celular');
}

seccion('26. Rediseño de vidrio en toda la aplicación');
{
  const raiz18 = path.resolve(path.dirname(file), '..');
  const leer18 = (f) => fs.readFileSync(path.join(raiz18, f), 'utf8').replace(/\r\n/g, '\n');
  const cs = leer18('public/styles.css'), ih = leer18('public/index.html'), lj = leer18('public/lateral.js');
  const i = cs.indexOf('Rediseño: el lenguaje de vidrio'), r = cs.slice(i);
  ok(i > 0, 'el bloque del rediseño existe, al final de los estilos (así sobrescribe lo anterior)');
  // tokens para los tres contextos de tema
  const toks = ['--glass-bg', '--glass-bg-2', '--glass-bd', '--glass-sh', '--fondo-base', '--fondo-a', '--fondo-b', '--fondo-c', '--fondo-luz'];
  const claro = r.slice(0, r.indexOf('@media(prefers-color-scheme:dark)')), osc = r.slice(r.indexOf('@media(prefers-color-scheme:dark)'), r.indexOf(':root[data-theme="dark"]')), forz = r.slice(r.indexOf(':root[data-theme="dark"]'), r.indexOf('body{background-color'));
  ok(toks.every((k) => claro.includes(k + ':')) && toks.every((k) => osc.includes(k + ':')) && toks.every((k) => forz.includes(k + ':')), 'los tokens del vidrio y del fondo están definidos para el tema claro, el oscuro por preferencia del sistema y el oscuro elegido a mano');
  ok(/:root:not\(\[data-theme="light"\]\)/.test(osc), 'el tema oscuro por preferencia del sistema respeta la elección de tema claro');
  ok(/--r:26px;--rm:18px;--rs:12px;/.test(claro), 'las esquinas son más redondeadas, como en el menú');
  // fondo y paneles
  ok(/body\{background-color:var\(--fondo-base\);background-attachment:fixed;\s*background-image:radial-gradient\([^;]*linear-gradient\(118deg/.test(r), 'el fondo es una malla de degradados con una franja de luz, igual que el menú');
  ok(/body\.nv0,body\.nv1,body\.nv2,body\.nv3,body\.nv4\{background-color:color-mix\(in srgb,var\(--nv-soft\) 26%,var\(--fondo-base\)\)\}/.test(r), 'el color del nivel tiñe el fondo solo un poco');
  ok(/\.ob-card,\.qc,\.rs,\.tb,\.idxp,dialog\.dlg\{background:var\(--glass-bg\);border:1px solid var\(--glass-bd\);box-shadow:var\(--glass-sh\);-webkit-backdrop-filter:var\(--glass-blur\);backdrop-filter:var\(--glass-blur\)\}/.test(r), 'los paneles grandes (tarjetas, preguntas, secciones de resultados, pestañas, diálogos) son de vidrio');
  ok(/\.pp,\.sc\{background:color-mix\(in srgb,var\(--nv-soft\) 40%,var\(--glass-bg\)\)/.test(r) && /\.nvbar\{background:color-mix\(in srgb,var\(--nv-soft\) 62%,var\(--glass-bg\)\)/.test(r), 'el panel de nivel, las sesiones y la barra del nivel son de vidrio teñido con el color del nivel');
  ok(/\.btn-go,\.be-p\{background:var\(--btn-grad\)/.test(r) && /--btn-grad:linear-gradient\(135deg,#27DDB8,#00A98A\)/.test(r) && /\.tbtn\.active\{background:var\(--btn-grad\)/.test(r), 'el botón principal y la pestaña activa usan el degradado verde azulado');
  ok(/dialog\.dlg::backdrop\{background:rgba\(5,10,24,\.5\);-webkit-backdrop-filter:blur\(8px\)/.test(r), 'detrás de un diálogo, la pantalla se desenfoca');
  // el PDF no cambia
  ok(/@media print\{\s*:root\{--glass-bg:#fff;--glass-bg-2:#fff;--glass-bd:#D9E1DF;--glass-sh:none;--glass-blur:none\}\s*body\{background:#fff!important\}/.test(r), 'al imprimir, el vidrio y el fondo se anulan: el PDF sigue en blanco');
  ok(/\.be\.be-p\{background:var\(--btn-grad\);border-color:transparent;color:#04201B/.test(cs.slice(cs.indexOf('Rediseño: el lenguaje de vidrio'))), 'un botón principal (.be.be-p) conserva el degradado: el estilo de vidrio de .be no lo pisa');
  // contraste del texto sobre el botón de degradado: el texto es casi negro sobre verdes claros
  const lum = (h) => { const c = [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  ok(cr('#04201B', '#27DDB8') >= 7 && cr('#04201B', '#00A98A') >= 4.5, 'el texto de los botones con degradado cumple el contraste (' + cr('#04201B', '#27DDB8').toFixed(1) + ':1 y ' + cr('#04201B', '#00A98A').toFixed(1) + ':1)');
  // barra superior: contexto y celular
  ok(/<div class="topbar-ctx" id="tb-ctx" aria-live="polite"><small id="tb-ctx-s"><\/small><strong id="tb-ctx-t"><\/strong><\/div>/.test(ih) && /body\.con-sb \.topbar-ctx\{display:flex\}/.test(r), 'con el menú lateral, la barra superior muestra dónde está el consultor');
  ok(/pa === 'sd' \? \['Panel del consultor', 'Sesiones de diagnóstico'\]/.test(lj) && /pa === 's2' \? \['Sesión · ' \+ emp, 'Preguntas'\]/.test(lj) && /pa === 's3' \? \['Sesión · ' \+ emp, 'Resultados'\]/.test(lj), 'el contexto cambia con la pantalla (panel, nueva sesión, preguntas y resultados)');
  ok(/@media\(max-width:520px\)\{\s*\.topbar\{gap:8px[^}]*\}\s*\.topbar-badge\{display:none\}/.test(r) && /body\.con-sb \.uout\{display:none\}/.test(r), 'en el celular la barra superior muestra solo lo imprescindible');
}

seccion('27. Servicio contratado: paquetes, estados, hitos y solicitudes del cliente');
{
  const raiz19 = path.resolve(path.dirname(file), '..');
  const leer19 = (f) => fs.readFileSync(path.join(raiz19, f), 'utf8').replace(/\r\n/g, '\n');
  const sj = leer19('public/servicio.js'), aj = leer19('public/app.js'), ih = leer19('public/index.html'), ss = leer19('public/sesiones.js'), lj = leer19('public/lateral.js'), ng = leer19('public/nube.js'), np = leer19('public/nube-prueba.js'), rg = leer19('firestore.d360.rules'), cs = leer19('public/styles.css');
  const sb = sandbox;

  // ── catálogo: coincide con la oferta del sitio ──
  ok(SRV_ORD.join() === 'inicia,evalua,acompana,implementa' && Object.keys(SRV_P).sort().join() === 'acompana,combo,evalua,implementa,inicia', 'hay cinco paquetes: Inicia, Evalúa, Combo, Acompaña e Implementa');
  ok(SRV_P.inicia.n === 'D360° Inicia' && SRV_P.evalua.n === 'D360° Evalúa' && SRV_P.acompana.n === 'D360° Acompaña' && SRV_P.implementa.n === 'D360° Implementa' && /Combo D360° Inicia \+ Evalúa/.test(SRV_P.combo.n), 'los nombres son los del sitio');
  ok(Object.values(SRV_P).every((p) => p.n && p.tag && p.nivel >= 1 && p.nivel <= 4 && p.incl.length >= 2 && p.hitos.length >= 2 && p.hitos.every((h) => h.length === 2 && h[1].length > 15)), 'cada paquete tiene su descripción, su nivel y sus hitos');
  ok(SRV_P.inicia.nivel === 1 && SRV_P.evalua.nivel === 2 && SRV_P.combo.nivel === 2 && SRV_P.acompana.nivel === 3 && SRV_P.implementa.nivel === 4, 'los niveles van de 1 (Inicia) a 4 (Implementa); el Combo equivale a Evalúa');
  ok(/Plan de adecuación a 3 a 12 meses/.test(SRV_P.inicia.incl.join(' ')) && /Inventario de sistemas y tratamientos/.test(SRV_P.evalua.incl.join(' ')) && /Revisión de contratos con terceros/.test(SRV_P.evalua.incl.join(' ')) && /Requiere D360° Evalúa aprobado/.test(SRV_P.implementa.incl.join(' ')), 'el Inicia incluye el plan de adecuación (como dice el sitio) y el Evalúa agrega inventario y contratos con terceros; el Implementa requiere un Evalúa aprobado');
  ok(!/\bUF\b|\$\s?\d|CLP/.test(sj), 'la aplicación no muestra precios (viven en el sitio)');
  ok(SRV_SOLICITABLES.join() === 'evalua,acompana,implementa', 'el cliente solo puede pedir Evalúa, Acompaña o Implementa');
  ok(Object.keys(SRV_E).join() === 'propuesta,aceptada,activa,entregada' && SRV_ACT.join() === 'activa,entregada', 'los estados son propuesta, aceptada, activa y entregada; solo activa y entregada cuentan como contratado');

  // ── lo que viene de la base de datos nunca se usa tal cual ──
  const L = sb.srvLimpio;
  ok(L(null) === null && L({}) === null && L({ paquete: 'gratis' }) === null && L('x') === null && L([]) === null, 'un servicio vacío o con un paquete inventado se descarta');
  const bueno = L({ paquete: 'evalua', estado: 'activa', ref: { n: 'x'.repeat(200), u: 'https://drive.google.com/file/d/abc' }, hitos: { anticipo: 1790000000000, inventario: 1790100000000, inexistente: 5, informe: 'no' }, por: 'y'.repeat(200), en: 1790000000000 });
  ok(bueno.paquete === 'evalua' && bueno.estado === 'activa' && bueno.ref.n.length === 80 && bueno.ref.u === 'https://drive.google.com/file/d/abc' && bueno.por.length === 80 && Object.keys(bueno.hitos).sort().join() === 'anticipo,inventario', 'se limitan los largos y solo se conservan los hitos válidos del paquete, con fecha numérica');
  ok(L({ paquete: 'inicia', estado: 'pagado' }).estado === 'propuesta' && L({ paquete: 'inicia' }).estado === 'propuesta', 'un estado desconocido queda como propuesta');
  ok(['javascript:alert(1)', 'http://drive.google.com/x', 'https://a b.cl', 'data:text/html,x', 'https://', "https://x.cl/\"onclick=\"1", 'ftp://x.cl/a'].every((u) => L({ paquete: 'inicia', ref: { u } }).ref.u === ''), 'solo se acepta un enlace https sin espacios ni comillas (nada de javascript:, http: ni data:)');
  ok(L({ paquete: 'inicia', hitos: { anticipo: -5, kickoff: 0, dashboard: NaN } }).hitos && Object.keys(L({ paquete: 'inicia', hitos: { anticipo: -5, kickoff: 0, dashboard: NaN } }).hitos).length === 0, 'una fecha de hito inválida se descarta');
  const pubS = sb.srvPublico(bueno);
  ok(JSON.stringify(pubS) === '{"paquete":"evalua","estado":"activa"}' && sb.srvPublico(null) === null && sb.srvPublico({ paquete: 'x' }) === null, 'al cliente solo viaja el paquete y el estado (nunca el contrato, los hitos ni quién lo registró)');

  // ── qué tiene el cliente en cada caso ──
  const S = (paquete, estado) => ({ paquete, estado, ref: { n: '', u: '' }, hitos: {}, por: '', en: 0 });
  const inc = (x) => [...sb.srvIncluidos(x)].sort().join();
  ok(inc(null) === 'inicia' && inc(S('inicia', 'activa')) === 'inicia' && inc(S('evalua', 'propuesta')) === 'inicia' && inc(S('evalua', 'aceptada')) === 'inicia', 'sin contratar, en propuesta o solo aceptado, el cliente tiene el Inicia (esta evaluación)');
  ok(inc(S('evalua', 'activa')) === 'evalua,inicia' && inc(S('combo', 'activa')) === 'evalua,inicia' && inc(S('evalua', 'entregada')) === 'evalua,inicia', 'con un Evalúa o un Combo activo tiene Inicia y Evalúa');
  ok(inc(S('acompana', 'activa')) === 'acompana,evalua,inicia' && inc(S('implementa', 'activa')) === 'evalua,implementa,inicia', 'Acompaña e Implementa suponen un Evalúa aprobado');
  ok(sb.srvNivel(null) === 1 && sb.srvNivel(S('evalua', 'activa')) === 2 && sb.srvNivel(S('combo', 'activa')) === 2 && sb.srvNivel(S('acompana', 'activa')) === 3 && sb.srvNivel(S('implementa', 'activa')) === 4 && sb.srvNivel(S('implementa', 'propuesta')) === 1, 'el nivel activo va de 1 a 4 y una propuesta no sube el nivel');
  const E = (x, p) => sb.srvEstadoDe(x, p);
  ok(E(null, 'inicia') === 'incluido' && E(null, 'evalua') === 'disponible' && E(null, 'acompana') === 'requiere' && E(null, 'implementa') === 'requiere', 'sin contratar: Inicia incluido, Evalúa disponible, y Acompaña e Implementa requieren Evalúa');
  ok(E(S('evalua', 'propuesta'), 'evalua') === 'propuesta' && E(S('evalua', 'aceptada'), 'evalua') === 'aceptado' && E(S('evalua', 'activa'), 'evalua') === 'activo' && E(S('evalua', 'entregada'), 'evalua') === 'entregado' && E(S('combo', 'propuesta'), 'evalua') === 'propuesta', 'el estado del Evalúa sigue el estado registrado (también con el Combo)');
  ok(E(S('evalua', 'activa'), 'acompana') === 'disponible' && E(S('evalua', 'activa'), 'implementa') === 'disponible' && E(S('acompana', 'activa'), 'acompana') === 'activo', 'con el Evalúa activo, Acompaña e Implementa pasan a estar disponibles');

  // ── días hábiles ──
  const dh = sb.diasHabilesDespues, f = (y, m, d) => new Date(y, m - 1, d, 9).getTime(), dia = (ms) => new Date(ms).getDay();
  ok(new Date(dh(f(2026, 11, 20), 1)).getDate() === 23 && dia(dh(f(2026, 11, 20), 1)) === 1, 'un viernes más un día hábil es el lunes');
  ok(new Date(dh(f(2026, 11, 18), 5)).getDate() === 25 && dia(dh(f(2026, 11, 18), 5)) === 3, 'un miércoles más 5 días hábiles es el miércoles siguiente');
  ok(new Date(dh(f(2026, 11, 21), 1)).getDate() === 23 && new Date(dh(f(2026, 11, 22), 1)).getDate() === 23, 'desde un sábado o un domingo, el primer día hábil es el lunes');
  ok([1, 2, 3, 4, 5, 8, 12].every((n) => { const x = dia(dh(f(2026, 11, 17), n)); return x !== 0 && x !== 6; }), 'el resultado nunca cae en fin de semana');
  const ent = f(2026, 11, 17), V = (srv, ahora) => sb.srvVentana(srv, ahora);
  const sv = { ...S('inicia', 'activa'), hitos: { informe: ent } };
  const v0 = V(sv, f(2026, 11, 18));
  ok(v0 && v0.restan === 4 && !v0.vencida && new Date(v0.limite).getDate() === 24, 'entregado el martes 17, el plazo vence el martes 24 y al día siguiente quedan 4 días hábiles');
  ok(V(sv, f(2026, 11, 24)).restan === 0 && !V(sv, f(2026, 11, 24)).vencida && V(sv, f(2026, 11, 25)).vencida, 'el último día el plazo vence hoy; al día siguiente está vencido');
  ok(V(null, ent) === null && V(S('inicia', 'activa'), ent) === null && V({ ...S('evalua', 'activa'), hitos: { informe: ent } }, ent) === null && V({ ...S('combo', 'activa'), hitos: { informe: ent } }, ent) === null, 'la cuenta regresiva solo existe para un Inicia con el informe entregado');

  // ── el motor ──
  const e1 = new E2(); e1.cargar({ perfil: {}, respuestas: {}, servicio: { paquete: 'evalua', estado: 'aceptada', ref: { n: 'P-14', u: 'javascript:alert(1)' }, hitos: { anticipo: 1790000000000 } } });
  ok(e1.srv && e1.srv.paquete === 'evalua' && e1.srv.ref.u === '' && e1.srv.hitos.anticipo === 1790000000000, 'al cargar una sesión se normaliza el servicio (un enlace peligroso se descarta)');
  ok(Object.keys(e1.pub()).sort().join() === 'perfil,respuestas,servicio' && JSON.stringify(e1.pub().servicio) === '{"paquete":"evalua","estado":"aceptada"}', 'lo publicado lleva solo el paquete y el estado');
  ok(Object.keys(new E2().pub()).sort().join() === 'perfil,respuestas' && new E2().srv === null, 'sin servicio registrado, lo publicado no cambia');
  const e2 = new E2(); e2.srv = bueno; e2.rs(); ok(e2.srv === null, 'reiniciar el motor limpia el servicio');
  const e3 = new E2(); e3.cargar(JSON.parse(JSON.stringify(e1.pub()))); ok(e3.srv && e3.srv.paquete === 'evalua' && e3.srv.estado === 'aceptada', 'el cliente carga el servicio publicado');

  // ── pantalla: pestaña «Servicio» ──
  const gid = sb.document.getElementById; sb.document.getElementById = () => ({ ...el(), options: [] });
  sb.window.srvSol = [{ id: 'a', paquete: 'evalua', nombre: 'Marcela <b>Soto</b>', cargo: 'TI', creadoEn: 1790000000000 }];
  const hc = sb.srvPanelHtml(new E2(), 'cliente'), ha = sb.srvPanelHtml(new E2(), 'auditor');
  const ev = new E2(); ev.srv = S('evalua', 'activa'); const hev = sb.srvPanelHtml(ev, 'cliente'), hea = sb.srvPanelHtml(ev, 'auditor');
  sb.window.srvEnviadas = ['evalua']; const henv = sb.srvPanelHtml(new E2(), 'cliente'); sb.window.srvEnviadas = [];
  sb.document.getElementById = gid;
  ok(/D360° Inicia<\/strong> es el punto de partida/.test(hc) && /Nivel activo: <strong>1 de 4<\/strong>/.test(hc) && SRV_ORD.every((p) => hc.includes(SRV_P[p].n)), 'el cliente ve que el Inicia es el punto de partida, su nivel (1 de 4) y los cuatro servicios');
  ok((hc.match(/srvQuiero\('evalua'\)/g) || []).length === 1 && !/srvQuiero\('acompana'\)/.test(hc) && !/srvQuiero\('implementa'\)/.test(hc) && (hc.match(/Requiere D360° Evalúa/g) || []).length >= 2, 'sin Evalúa, el cliente solo puede pedir Evalúa; Acompaña e Implementa dicen que requieren Evalúa y no tienen botón');
  ok(/srvQuiero\('acompana'\)/.test(hev) && /srvQuiero\('implementa'\)/.test(hev) && !/srvQuiero\('evalua'\)/.test(hev) && /Nivel activo: <strong>2 de 4<\/strong>/.test(hev) && /Servicio registrado: <strong>D360° Evalúa<\/strong> · Activa/.test(hev), 'con el Evalúa activo, el cliente puede pedir Acompaña o Implementa, y ya no Evalúa');
  ok(/Solicitud enviada\. Su consultor se pondrá en contacto/.test(henv) && !/srvQuiero\('evalua'\)/.test(henv), 'después de pedir avanzar, el botón se reemplaza por la confirmación');
  ok(!/srvQuiero/.test(ha) && /srvDlg\(\)/.test(ha) && /Gestionar el servicio contratado/.test(ha) && /actualizar los resultados publicados/.test(ha), 'el consultor ve el botón para gestionar el servicio, sin los botones del cliente, y que el cliente lo ve al actualizar lo publicado');
  ok(/Solicitudes del cliente/.test(ha) && /Marcela &lt;b&gt;Soto&lt;\/b&gt;/.test(ha) && !/<b>Soto<\/b>/.test(ha) && /pidió avanzar con <strong>D360° Evalúa<\/strong>/.test(ha) && !/Solicitudes del cliente/.test(hc), 'el consultor ve las solicitudes del cliente (con el nombre escapado) y el cliente no');
  ok(/Los contenidos son los de la oferta de AlignData\. El detalle, los plazos y las condiciones constan en el contrato/.test(hc), 'el texto aclara que el contrato prevalece');

  // ── pantalla: ventana del consultor ──
  ok(/function srvHitosHtml\(p, hs\)/.test(sj) && sb.srvHitosHtml('combo', { anticipo: 1790000000000 }).split('<input type="checkbox"').length - 1 === SRV_P.combo.hitos.length && /srv-h-anticipo" checked/.test(sb.srvHitosHtml('combo', { anticipo: 1790000000000 })) && sb.srvHitosHtml('', {}) === '', 'el consultor ve un hito por cada tramo del paquete, marcando los cumplidos');
  const vh = sb.srvVentanaHtml({ ...S('inicia', 'activa'), hitos: { informe: Date.now() - 86400000 } });
  ok(/Descuento del Combo/.test(vh) && /5 días hábiles desde la entrega del informe del Inicia/.test(vh) && /no considera feriados/.test(vh) && sb.srvVentanaHtml(S('evalua', 'activa')) === '', 'la ventana del descuento del Combo se muestra solo para el Inicia con el informe entregado, y avisa que no considera feriados');
  const slot = { innerHTML: '' }; sb.document.getElementById = (i) => (i === 'srv-slot' ? slot : el()); const prev = en.srv; en.srv = L({ paquete: 'evalua', estado: 'propuesta', ref: { n: '<img src=x onerror=1>' } });
  sb.srvRender(); en.srv = prev; sb.document.getElementById = gid;
  ok(/no activa nada por sí solo/.test(slot.innerHTML) && !/<img src=x/.test(slot.innerHTML) && /&lt;img src=x/.test(slot.innerHTML) && SRV_ORD.concat(['combo']).every((p) => slot.innerHTML.includes(SRV_P[p].n)) && /type="url"/.test(slot.innerHTML) && /actualice los resultados publicados/.test(slot.innerHTML), 'el formulario aclara que adjuntar un contrato no activa nada, escapa lo que se escribe y ofrece todos los paquetes');
  ok(/El enlace debe empezar con https:\/\//.test(sj) && /en\.sv\(\); srvRender\(\)/.test(sj) && /if \(typeof en === 'undefined' \|\| en\.ro \|\| !en\.sid\) return;/.test(sj) && /por: us \? \(us\.nombre \|\| us\.email \|\| ''\) : ''/.test(sj), 'guardar valida el enlace, queda constancia de quién registró y solo se puede en una sesión propia y editable');

  // ── conexión con el resto ──
  ok(/<dialog class="dlg dlg-srv" id="dlg-srv" aria-labelledby="srv-dlg-t">/.test(ih) && /<script src="ruta\.js"><\/script>\s*<script src="servicio\.js"><\/script>/.test(ih), 'la página tiene el diálogo del servicio y carga servicio.js después de ruta.js');
  ok(/\['t10','handshake','Servicio',''\]/.test(aj) && /id="t10"/.test(aj) && /srvPanelHtml\(en,modo\)/.test(aj) && /modo==='auditor'\|\|modo==='cliente'/.test(aj), 'los resultados tienen la pestaña «Servicio» para el consultor y para el cliente');
  ok(/@media print\{#t10\{display:none!important\}\}/.test(cs), 'la pestaña no sale en el PDF');
  ok(/srvEtiqueta\(s\.servicio\)/.test(ss) && /window\.srvCtx = \(\) => \(\{ N, tk \}\)/.test(ss) && /window\.srvCtx = \(\) => \(\{ N, tk: act && act\.compartido && act\.compartido\.token \}\)/.test(ss), 'cada sesión del panel muestra su servicio y el cliente y el consultor conocen su enlace para las solicitudes');
  ok(/id: 'srv', ic: 'handshake', t: 'Servicio contratado', fn: \(\) => srvDlg\(\)/.test(lj) && /window\.srvSol \|\| \[\]\)\.length/.test(lj), 'el menú lateral tiene «Servicio contratado», con el número de solicitudes pendientes');
  ok(/servicio: en\.srv \|\| null/.test(ng) && /servicio: en\.srv \|\| null/.test(np) && ['solicitar', 'solicitudesEscuchar'].every((fn) => new RegExp('export (async )?function ' + fn + '[(]').test(ng) && new RegExp('export (async )?function ' + fn + '[(]').test(np)), 'el guardado incluye el servicio y la capa de datos (nube y prueba) tiene las solicitudes');
  ok(/function servicioPub\(d\)/.test(rg) && /match \/solicitudes\/\{sid\}/.test(rg) && /paquete in \['evalua', 'acompana', 'implementa'\]/.test(rg) && /allow get, list, delete: if esConsultor\(\);/.test(rg.slice(rg.indexOf('match /solicitudes/'))), 'las reglas permiten publicar solo el paquete y el estado, y que el cliente cree (nunca lea) solicitudes de Evalúa, Acompaña o Implementa');
  ok(/srvLimpio\(d\.servicio\)/.test(aj) && /srvPublico\(this\.srv\)/.test(aj), 'el motor normaliza el servicio al cargar y publica solo lo permitido');
  // los nombres de clase nuevos no chocan con los de antes
  const bloque = cs.slice(cs.indexOf('/* ── servicio contratado ── */')), antes = cs.slice(0, cs.indexOf('/* ── servicio contratado ── */'));
  const nuevas = [...new Set([...bloque.matchAll(/\.(srv-[\w-]+|sc-srv)/g)].map((m) => m[1]))];
  ok(nuevas.length > 15 && nuevas.every((c2) => !new RegExp('\\.' + c2.replace(/-/g, '\\-') + '(?![\\w-])').test(antes)), 'ninguno de los ' + nuevas.length + ' nombres de clase nuevos ya existía');
}

seccion('28. Eliminar sesiones (consultor) y salir de la reunión (invitado)');
{
  const raiz20 = path.resolve(path.dirname(file), '..');
  const leer20 = (f) => fs.readFileSync(path.join(raiz20, f), 'utf8').replace(/\r\n/g, '\n');
  const ss = leer20('public/sesiones.js'), vj = leer20('public/vivo.js'), ng = leer20('public/nube.js'), np = leer20('public/nube-prueba.js'), rg = leer20('firestore.d360.rules'), ih = leer20('public/index.html'), pj = leer20('public/pizarra.js'), cs = leer20('public/styles.css');

  // ── eliminar: lo que ve el consultor ──
  ok(/class=\"be be-del\" onclick=\"elimSes\('\$\{s\.id\}'\)\" aria-label=\"Eliminar la sesión de \$\{esc\(p\.nombre \|\| 'Sin nombre'\)\}\"><i data-lucide=\"trash-2\"><\/i>Eliminar<\/button>/.test(ss), 'cada sesión del panel tiene un botón «Eliminar» con nombre accesible (dice de qué empresa es)');
  ok(/<dialog class="dlg dlg-del" id="dlg-del" aria-labelledby="del-t">/.test(ih), 'la página tiene el diálogo de confirmación');
  ok(/Para confirmar, escriba el nombre de la empresa/.test(ss) && /id="del-go" disabled/.test(ss) && /norm\(\$\('del-n'\)\.value\) !== norm\(/.test(ss), 'para eliminar hay que escribir el nombre de la empresa: el botón sigue desactivado hasta que coincida');
  ok(/normalize\('NFC'\)\.trim\(\)\.replace\(\/\\s\+\/g, ' '\)\.toLowerCase\(\)/.test(ss), 'la comparación ignora mayúsculas, espacios de más y la forma de las tildes');
  ok(/No se puede deshacer\. Si necesita conservar algo, descargue antes el informe ejecutivo, el acta o el PDF/.test(ss) && /El enlace de resultados dejará de funcionar para el cliente/.test(ss) && /La reunión en vivo se cerrará/.test(ss) && /La pizarra, con sus comentarios, imágenes y archivos adjuntos/.test(ss), 'el diálogo dice qué se pierde: respuestas, pizarra y archivos, el enlace del cliente y la reunión en vivo, y que no se puede deshacer');
  ok(/No se pudo terminar de eliminar[\s\S]{0,120}La sesión sigue en la lista: puede reintentar/.test(ss) && /go\.innerHTML = '<i data-lucide="trash-2"><\/i>Reintentar'/.test(ss), 'si falla a mitad de camino, la sesión sigue en la lista y se puede reintentar');
  ok(/if \(act && act\.id === s\.id\) await window\.dash\(\);\s*\/\/[^\n]*\n\s*await N\.eliminarSesion\(s\.id, s\);/.test(ss), 'si la sesión estaba abierta, se cierra antes de borrar (se guarda lo pendiente y se sueltan las escuchas)');
  ok(/\.be-del\{color:var\(--lv0-ink\)\}/.test(cs) && /dialog\.dlg-del\{max-width:560px\}/.test(cs), 'el botón y el diálogo tienen su estilo');

  // ── eliminar: la capa de datos de la nube borra todo lo que depende de la sesión, y la sesión al final ──
  const fn = ng.slice(ng.indexOf('export async function eliminarSesion'), ng.indexOf('// ── el invitado sale'));
  const orden = ['rutaComp(tkC)', 'borrarSolicitudes(tkC)', "'compartidos', tkC", 'rutaVivo(tkV)', 'vivoPresentesLimpiar(tkV)', 'vivoRef(tkV)', 'rutaSes(sid)', "'sesiones', sid"].map((x) => fn.indexOf(x));
  ok(orden.every((x) => x > 0) && orden.every((x, i, a) => i === 0 || x > a[i - 1]), 'en la nube se borran primero la pizarra, las solicitudes y el enlace publicado, luego la reunión en vivo y su pizarra, luego la pizarra de la sesión y, al final, la sesión');
  ok(/const borrarTodoPz = async/.test(ng) && /borrarPartes\(amb, ruta\[1\]/.test(ng), 'los archivos adjuntos (guardados en partes) se borran junto con cada comentario');
  ok(/Si algo falla a mitad de camino, la sesión sigue existiendo y se puede reintentar/.test(ng), 'el diseño permite reintentar tras un fallo');
  ok(/allow get, list, delete: if esConsultor\(\);/.test(rg) && /match \/solicitudes\/\{sid\}/.test(rg), 'las reglas ya permiten al consultor borrar sesiones, pizarras, partes, enlaces, solicitudes y reuniones (no hizo falta cambiarlas)');

  // ── eliminar: prueba real de la versión de prueba (misma interfaz) ──
  {
    const url = (await import('node:url')).pathToFileURL(path.join(raiz20, 'public/nube-prueba.js')).href + '?t=' + Date.now();
    const antes = { w: globalThis.window, ls: globalThis.localStorage, ce: globalThis.CustomEvent }, mem = {};
    globalThis.window = { addEventListener() {}, dispatchEvent() {} }; globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } };
    globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
    try {
      const M = await import(url), TC = 'C'.repeat(32), TV = 'V'.repeat(32), TC2 = 'D'.repeat(32), adj = [{ n: 'a.pdf', z: 10, p: 2 }];
      mem.d360mock = JSON.stringify({
        sesiones: { S1: { perfil: { nombre: 'Uno' }, compartido: { token: TC }, vivo: { token: TV } }, S2: { perfil: { nombre: 'Dos' }, compartido: { token: TC2 } } },
        compartidos: { [TC]: { solicitudes: { a: { nombre: 'M' } } }, [TC2]: { solicitudes: {} } }, vivo: { [TV]: { presentes: { p1: { n: 'A', t: 1 }, p2: { n: 'B', t: 1 } } } }, sesion: null,
        pz: { ses: { S1: { e1: { id: 'e1', adjuntos: adj, creadoEn: 1 } }, S2: { e9: { id: 'e9', adjuntos: adj, creadoEn: 1 } } }, comp: { [TC]: { e1: { id: 'e1', adjuntos: adj, creadoEn: 1 } }, [TC2]: { e9: { id: 'e9', adjuntos: adj, creadoEn: 1 } } }, vivo: { [TV]: { e1: { id: 'e1', adjuntos: adj, creadoEn: 1 } } },
          partes: { 'ses:S1:e1:0_0': 'x', 'ses:S1:e1:0_1': 'x', 'comp:C:e1:0_0': 'x', ['comp:' + TC + ':e1:0_0']: 'x', ['comp:' + TC + ':e1:0_1']: 'x', ['vivo:' + TV + ':e1:0_0']: 'x', ['vivo:' + TV + ':e1:0_1']: 'x', 'ses:S2:e9:0_0': 'otra', 'ses:S2:e9:0_1': 'otra', ['comp:' + TC2 + ':e9:0_0']: 'otra' } }
      });
      await M.eliminarSesion('S1', { compartido: { token: TC }, vivo: { token: TV } });
      const d = JSON.parse(mem.d360mock);
      ok(Object.keys(d.sesiones).join() === 'S2' && !(TC in d.compartidos) && (TC2 in d.compartidos) && !(TV in d.vivo), 'al eliminar una sesión desaparecen ella, su enlace publicado y su reunión en vivo, y las demás sesiones quedan intactas');
      ok(!('S1' in d.pz.ses) && !(TC in d.pz.comp) && !(TV in d.pz.vivo) && ('S2' in d.pz.ses) && (TC2 in d.pz.comp), 'desaparecen sus tres pizarras (sesión, publicada y en vivo) y las de otras sesiones no se tocan');
      ok(Object.keys(d.pz.partes).every((k) => !k.startsWith('ses:S1:') && !k.startsWith('comp:' + TC + ':') && !k.startsWith('vivo:' + TV + ':')) && Object.keys(d.pz.partes).filter((k) => k.includes(':e9:')).length === 3, 'se borran los archivos adjuntos de la sesión eliminada y se conservan los de las demás (3 partes)');
      await M.eliminarSesion('S1', { compartido: { token: TC }, vivo: { token: TV } });
      ok(Object.keys(JSON.parse(mem.d360mock).sesiones).join() === 'S2', 'eliminar de nuevo lo ya eliminado no falla (se puede reintentar)');
      // invitado: salir
      mem.d360mock = JSON.stringify({ sesiones: {}, compartidos: {}, vivo: { [TV]: { presentes: { p1: { n: 'A', t: 1 }, p2: { n: 'B', t: 1 } } } }, sesion: null, pz: { ses: {}, vivo: {}, comp: {}, partes: {} } });
      await M.vivoSalir(TV, 'p1'); await M.vivoSalir('X'.repeat(32), 'p9');
      ok(Object.keys(JSON.parse(mem.d360mock).vivo[TV].presentes).join() === 'p2', 'al salir, el invitado quita solo su presencia (y salir de un enlace inexistente no falla)');
    } finally { globalThis.window = antes.w; globalThis.localStorage = antes.ls; globalThis.CustomEvent = antes.ce; if (antes.w === undefined) delete globalThis.window; if (antes.ls === undefined) delete globalThis.localStorage; if (antes.ce === undefined) delete globalThis.CustomEvent; }
  }

  // ── invitado: salir de la reunión ──
  ok(/salir: true \}\);/.test(vj) && /window\.salir = async \(\) => \{/.test(vj), 'la barra superior del invitado tiene el botón «Salir»');
  ok(/salio = true; if \(hb\) \{ clearInterval\(hb\); hb = null; \} if \(apagar\) \{ apagar\(\); apagar = null; \}/.test(vj) && /const latir = \(\) => \{ if \(salio\) return;/.test(vj), 'al salir se detienen los avisos de presencia y las escuchas, y no se reanudan al volver a la pestaña');
  ok(/N\.vivoSalir\(tk, pid\)/.test(vj) && /PZ\.olvidar\(\)/.test(vj) && /PZS\.olvidar = function \(\) \{ PZS\.persona = null; try \{ localStorage\.removeItem\(LS\); \} catch/.test(pj), 'al salir se quita su presencia y su nombre del dispositivo');
  ok(/fin\('Salió de la reunión', 'Ya no figura como conectado y su nombre se quitó de este dispositivo\. Puede volver a entrar con el mismo enlace mientras la reunión siga abierta\.'\)/.test(vj) && /Volver a entrar/.test(vj), 'muestra un mensaje de despedida y la opción de volver a entrar con el mismo enlace');
  ok(/export async function vivoSalir\(tk, pid\)/.test(ng) && /export async function vivoSalir\(tk, pid\)/.test(np), 'la capa de datos (nube y prueba) tiene vivoSalir');
  ok(/allow delete: if esConsultor\(\) \|\| enlaceVigente\(\);/.test(rg.slice(rg.indexOf('match /presentes/'), rg.indexOf('// Pizarra en vivo'))), 'las reglas dejan al invitado quitar su presencia mientras el enlace esté vigente');
  ok(/Para salir de la reunión, use «Salir»\./.test(leer20('public/tour.js')), 'el tour del invitado dice cómo salir');
}

console.log('\n' + (fallos ? '✗ ' + fallos + ' problema(s)' : '✓ Todas las verificaciones pasaron'));
process.exit(fallos ? 1 : 0);
