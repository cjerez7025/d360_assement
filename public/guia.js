/* guia.js — Guía previa a la sesión (?guia=1): le muestra al cliente, antes de la reunión, de qué se va a hablar, qué se le
   preguntará en cada tema (con «¿por qué se pregunta esto?» y ejemplos por nivel de respuesta, como en el cuestionario),
   quién de su organización conviene que participe y qué conviene tener a mano. Se arma sola desde el cuestionario (D, Q).
   · Es PRIVADA: se entra con Google y solo ve la guía quien tenga su correo en la lista de personas autorizadas
     (guia_acceso/{correo}, que administra el consultor desde «Guía previa para el cliente»). Los consultores entran siempre.
   · Limitación conocida: el banco de preguntas sigue estando en el código público de la app (app.js); este control decide quién
     ve la guía en pantalla, no oculta el código.
   · Muestra solo las preguntas base; las de profundización aparecen en la reunión si una respuesta sale baja.
   · El consultor administra la lista y obtiene el enlace desde «Guía previa para el cliente» en el menú. */

const GUIA_V = '1.0';
// Por dimensión: de qué trata en palabras llanas y quién de la organización conviene que esté. Es una propuesta de AlignData.
const GUIA_DIM = {
  gobernanza: { tema: 'Quién lidera la protección de datos en la organización (DPO, roles y comité de privacidad) y qué políticas la respaldan.', quien: 'Gerencia general o dirección, y quien sea (o haría de) responsable de privacidad o legal.' },
  registro: { tema: 'Qué datos se tratan, para qué, quién accede a ellos y por cuánto tiempo se conservan: el mapeo y el registro de los tratamientos, y lo que se informa públicamente.', quien: 'Quien conoce los procesos y los sistemas (operaciones, TI) y legal.' },
  seguridad: { tema: 'Las medidas técnicas y organizativas que protegen los datos (cifrado, accesos y respaldos) y cómo se actuaría ante un incidente.', quien: 'TI o seguridad de la información, y quien administra los sistemas.' },
  cumplimiento: { tema: 'Cómo se aplica la Ley 21.719 artículo por artículo: con qué fundamento legal se usan los datos, qué se informa a las personas, cómo se retira el consentimiento y qué resguardos hay para datos sensibles, de niños, de biometría y de deudas comerciales.', quien: 'Legal o cumplimiento, marketing o comercial, recursos humanos y quien administra el sitio web y los formularios.' },
  riesgo: { tema: 'Cómo se evalúan los riesgos (evaluación de impacto y mapa de riesgos), qué se sabe de las sanciones y si existe un programa de cumplimiento.', quien: 'Gerencia y legal o cumplimiento.' },
  arcop: { tema: 'Cómo atiende la organización las solicitudes de las personas sobre sus datos: acceso, rectificación, supresión, oposición, portabilidad y bloqueo, además del derecho a no ser objeto de decisiones tomadas solo por sistemas automatizados (art. 8 bis), con sus plazos y su evidencia.', quien: 'Atención al cliente, legal y TI (para ubicar y entregar los datos).' },
  terceros: { tema: 'Los proveedores y socios que acceden a datos, qué contratos y subprocesadores tienen y si algún dato sale del país.', quien: 'Compras o contratos, TI, legal y las áreas que usan herramientas externas.' },
  cultura: { tema: 'Si las personas que trabajan con datos saben qué pueden y qué no pueden hacer con ellos: capacitación y mejora continua.', quien: 'Recursos humanos, jefaturas y quien capacita al personal.' }
};

function guiaEnlace() { return location.origin + location.pathname + '?guia=1'; }

// Mensaje corto para acompañar el enlace (WhatsApp u otro medio)
function guiaMensaje() { return 'Hola, para que nuestra reunión del D360° Privacy Assessment sea más ágil, revise esta guía con los temas y las preguntas que veremos, y lo que conviene tener a mano (ingrese con su cuenta de Google): ' + guiaEnlace(); }

// Una pregunta con lo mismo que ve el consultor: por qué se pregunta, ejemplos por nivel y qué preparar
function guiaPregunta(q, n) {
  const niv = q.op.map((o) => { const e = (q.ex || []).find((x) => x.v === o.v); return `<li><strong>${esc(o.l)}</strong><span>${esc(o.d)}</span>${e ? `<em>${esc(e.t)}</em>` : ''}</li>`; }).join('');
  return `<article class="gp-pq">
<h5 class="gp-pq-t"><span class="gp-pq-n">${n}</span>${esc(q.q)}</h5>
${q.s ? `<p class="gp-pq-s">${esc(q.s)}</p>` : ''}
<details class="gp-d"><summary>¿Por qué se pregunta esto?</summary><p>${esc(q.cx)}</p><p class="gp-nota">Base legal: ${typeof refLey === 'function' ? refLey(q.ar) : esc(q.ar)}</p></details>
<details class="gp-d"><summary>Ejemplos de cada nivel de respuesta</summary><ol class="gp-niv">${niv}</ol></details>
<p class="gp-ev"><strong>Puede ir preparando:</strong> ${esc(q.ev)}</p>
</article>`;
}

function guiaHtml(usuario) {
  const bases = (d) => Q.filter((q) => q.dm === d.id && !q.iS).sort((a, b) => a.o - b.o), prof = (d) => Q.filter((q) => q.dm === d.id && q.iS).length;
  const total = D.reduce((t, d) => t + bases(d).length, 0);
  const dims = D.map((d, i) => {
    const qs = bases(d), p = prof(d), g = GUIA_DIM[d.id] || { tema: '', quien: '' };
    return `<section class="gp-dim" aria-labelledby="gp-d${i}">
<h3 id="gp-d${i}"><span class="gp-n">${i + 1}</span><i data-lucide="${esc(d.ic)}"></i>${esc(d.n)}</h3>
${d.s ? `<p class="gp-sub">${esc(d.s)}</p>` : ''}
<p class="gp-tema">${esc(g.tema)}</p>
<p class="gp-quien"><i data-lucide="users"></i><span><strong>Conviene que participe:</strong> ${esc(g.quien)}</span></p>
<h4>Lo que conversaremos (${qs.length} ${qs.length === 1 ? 'pregunta' : 'preguntas'})</h4>
${qs.map((q, k) => guiaPregunta(q, k + 1)).join('')}
<p class="gp-nota">${p ? `Si alguna respuesta muestra que hay mucho por mejorar, es posible que hagamos ${p === 1 ? 'una pregunta adicional' : p + ' preguntas adicionales'} para entender mejor la situación.` : ''} Base legal: ${typeof refLey === 'function' ? refLey(d.a) : esc(d.a)}</p>
</section>`;
  }).join('');
  const resumen = D.map((d, i) => `<tr><th scope="row">${i + 1}. ${esc(d.n)}</th><td>${esc((GUIA_DIM[d.id] || {}).quien || '')}</td></tr>`).join('');
  return `<div class="gp">
<header class="gp-cab">
${usuario ? `<p class="gp-quien-sesion">Sesión: <strong>${esc(usuario.email)}</strong> · <button type="button" class="gp-lnk" onclick="guiaSalirSesion()">Salir</button></p>` : ''}
<p class="gp-sup">AlignData · D360° Privacy Assessment</p>
<h1>Guía previa a la sesión</h1>
<p class="gp-lead">Léala antes de la reunión: así la conversación será más ágil y aprovecharemos mejor el tiempo. Le muestra de qué vamos a hablar, qué le preguntaremos y qué conviene tener a mano.</p>
</header>
<section class="gp-bl" aria-labelledby="gp-que"><h2 id="gp-que">Qué vamos a hacer</h2>
<ol class="gp-pasos"><li><strong>Conversamos juntos, tema por tema.</strong> Son ${D.length} temas y ${total} preguntas sobre cómo se tratan hoy los datos personales en su organización.</li>
<li><strong>Usted responde con lo que realmente ocurre.</strong> No hay respuestas buenas ni malas, y no se evalúa a personas: es una fotografía de hoy para armar un plan. Los ejemplos de esta guía muestran cómo se ve cada nivel; no son una respuesta que haya que elegir, y el consultor confirma cada respuesta con la evidencia en el taller.</li>
<li><strong>Al final recibe un resultado.</strong> Un puntaje, las brechas respecto de la Ley 21.719 y una hoja de ruta ordenada por etapas.</li></ol>
<p>La Ley 21.719, que moderniza la protección de datos personales en Chile, entra en vigencia el 1 de diciembre de 2026. Este diagnóstico es una autoevaluación orientativa: no constituye una auditoría ni asesoría legal.</p></section>
<section class="gp-bl" aria-labelledby="gp-como"><h2 id="gp-como">Cómo participan las personas</h2>
<ul><li>Su consultor de AlignData le enviará un enlace para seguir la reunión desde su computador o celular. <strong>No necesita crear una cuenta.</strong></li>
<li>Cada persona escribe su <strong>nombre</strong> (y, si quiere, su cargo) al entrar. Pueden participar varias personas con el mismo enlace.</li>
<li>Todos ven la misma pregunta que se está conversando y pueden comentar o dejar una propuesta de respuesta. La respuesta final la registra el consultor junto con ustedes.</li>
<li><strong>No hace falta enviar nada antes.</strong> Si puede, tenga a mano los documentos que se mencionan en cada tema.</li></ul></section>
<section class="gp-bl" aria-labelledby="gp-quien"><h2 id="gp-quien">Quiénes conviene que participen</h2>
<p>Cada tema se responde mejor con quien conoce el día a día. Si no pueden estar todas las personas en toda la reunión, pueden incorporarse solo en el tema que les corresponde.</p>
<div class="gp-tab"><table><thead><tr><th>Tema</th><th>Conviene que participe</th></tr></thead><tbody>${resumen}</tbody></table></div></section>
<h2 class="gp-h2">Los temas, uno por uno</h2>
${dims}
<footer class="gp-pie"><p>Guía versión ${GUIA_V}, generada a partir del cuestionario vigente del D360°. Las preguntas pueden ajustarse a medida que se afina el modelo.</p><p>Para cualquier duda antes de la sesión, escriba a su consultor de AlignData.</p></footer>
</div>`;
}

// Pantalla de la guía (?guia=1): primero se pide el ingreso con Google y se comprueba que el correo esté autorizado
let guiaN = null;
function guiaPantalla(html) {
  const c = document.getElementById('gp-c'); if (!c) return;
  c.innerHTML = html;
  if (typeof ss === 'function') ss('sg');
  if (window.lucide) lucide.createIcons();
}
const guiaCaja = (t, p, acc) => `<div class="gp"><header class="gp-cab"><p class="gp-sup">AlignData · D360° Privacy Assessment</p><h1>${t}</h1><p class="gp-lead">${p}</p>${acc ? `<p class="gp-acc">${acc}</p>` : ''}</header></div>`;
function guiaLogin() {
  guiaPantalla(guiaCaja('Guía previa a la sesión', 'Esta guía es privada: es para las personas que su consultor de AlignData invitó. Ingrese con la cuenta de Google del correo que le autorizaron.', '<button type="button" class="be be-p" onclick="guiaIngresar()"><i data-lucide="log-in"></i>Ingresar con Google</button>'));
}
function guiaSinAcceso(u) {
  guiaPantalla(guiaCaja('Su cuenta no tiene acceso a esta guía', `La cuenta <strong>${esc(u.email)}</strong> no está en la lista de personas autorizadas. Pida a su consultor de AlignData que agregue ese correo, o ingrese con otra cuenta.`, '<button type="button" class="be be-p" onclick="guiaSalirSesion(true)"><i data-lucide="user-round"></i>Usar otra cuenta</button> <button type="button" class="be" onclick="guiaSalirSesion()">Salir</button>'));
}
window.guiaIngresar = async () => { try { await guiaN.ingresar(); } catch (e) { guiaPantalla(guiaCaja('No se pudo ingresar', 'Intente de nuevo. Si el problema sigue, avise a su consultor de AlignData.', '<button type="button" class="be be-p" onclick="guiaIngresar()">Reintentar</button>')); } };
window.guiaSalirSesion = async (otra) => { try { await guiaN.guiaSalir(); } catch (e) { /* ya estaba cerrada */ } guiaLogin(); if (otra) setTimeout(() => window.guiaIngresar(), 50); };

async function guiaPrevia() {
  document.body.classList.add('cliente', 'guia');
  document.title = 'Guía previa a la sesión — D360° Privacy Assessment';
  guiaPantalla(guiaCaja('Guía previa a la sesión', 'Comprobando su acceso…'));
  const P = new URLSearchParams(location.search), MOCK = P.get('mock') === '1' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  try {
    guiaN = await import(MOCK ? './nube-prueba.js' : './nube.js');
    guiaN.iniciar({ persistente: false, conCuenta: true });
  } catch (e) { guiaPantalla(guiaCaja('No se pudo cargar la guía', 'Revise su conexión e intente de nuevo.', '<button type="button" class="be be-p" onclick="location.reload()">Reintentar</button>')); return; }
  guiaN.alCambiarUsuario(async (u) => {
    if (!u) return guiaLogin();
    guiaPantalla(guiaCaja('Guía previa a la sesión', 'Comprobando su acceso…'));
    let a = { ok: false };
    try { a = await guiaN.guiaMiAcceso(u.email); } catch (e) { a = { ok: false }; }
    if (!a.ok) return guiaSinAcceso(u);
    guiaPantalla(guiaHtml(u)); window.scrollTo(0, 0);
  });
}

// Diálogo del consultor: el enlace (para copiarlo o enviarlo por WhatsApp) y la lista de personas autorizadas a verla
let guiaOffLista = null;
function guiaPintarLista(l) {
  const ul = document.getElementById('gg-lista'); if (!ul) return;
  ul.innerHTML = l.length ? l.map((x) => `<li><span><strong>${esc(x.n)}</strong>${x.e ? ' · ' + esc(x.e) : ''}<small>${esc(x.correo)}</small></span><button type="button" class="gg-q" data-c="${esc(x.correo)}" aria-label="Quitar a ${esc(x.n)}"><i data-lucide="trash-2"></i></button></li>`).join('') : '<li class="gg-vacio">Todavía no hay personas autorizadas: solo los consultores pueden ver la guía.</li>';
  if (window.lucide) lucide.createIcons();
}
function guiaDlg() {
  const d = document.getElementById('dlg-guia'); if (!d) return;
  document.getElementById('gg-url').value = guiaEnlace();
  document.getElementById('gg-wa').href = 'https://wa.me/?text=' + encodeURIComponent(guiaMensaje());
  document.getElementById('gg-abrir').href = guiaEnlace();
  document.getElementById('gg-ok').textContent = ''; document.getElementById('gg-er').hidden = true;
  if (guiaOffLista) { guiaOffLista(); guiaOffLista = null; }
  if (typeof Nube !== 'undefined' && Nube && Nube.guiaAccesoEscuchar) guiaOffLista = Nube.guiaAccesoEscuchar(guiaPintarLista, () => guiaPintarLista([]));
  if (!d.open) d.showModal();
  if (window.lucide) lucide.createIcons();
}
async function guiaAgregar(ev) {
  ev.preventDefault();
  const v = (i) => document.getElementById(i), er = v('gg-er'), correo = v('gg-c').value.trim().toLowerCase(), n = v('gg-n').value.trim(), e = v('gg-e').value.trim();
  const mal = (t) => { er.textContent = t; er.hidden = false; };
  if (!n) return mal('Escriba el nombre de la persona.');
  if (!/^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(correo) || correo.length > 120) return mal('Escriba un correo válido, por ejemplo nombre@empresa.cl.');
  er.hidden = true;
  try { await Nube.guiaAccesoAgregar({ correo, n, e }); v('gg-c').value = ''; v('gg-n').value = ''; v('gg-n').focus(); }
  catch (x) { mal('No se pudo agregar (' + (x.code || x.message || 'error') + '). Intente de nuevo.'); }
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest && ev.target.closest('.gg-q'); if (!b || typeof Nube === 'undefined' || !Nube) return;
  b.disabled = true; Nube.guiaAccesoQuitar(b.dataset.c).catch(() => { b.disabled = false; });
});
function guiaCopiar() {
  const e = document.getElementById('gg-url'), ok = document.getElementById('gg-ok'); if (!e) return;
  const fin = (t) => { if (ok) { ok.textContent = t; setTimeout(() => { ok.textContent = ''; }, 2200); } };
  try { navigator.clipboard.writeText(e.value).then(() => fin('Enlace copiado'), () => { e.select(); fin('Seleccionado: use Ctrl+C'); }); } catch (x) { e.select(); fin('Seleccionado: use Ctrl+C'); }
}

if (typeof location !== 'undefined' && typeof document !== 'undefined' && /(^|[?&])guia=/.test(location.search)) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guiaPrevia); else guiaPrevia();
}
