/* guia.js — Guía previa a la sesión: una página con enlace propio (?guia=1) que le muestra al cliente, antes de la reunión,
   de qué se va a hablar, qué se le preguntará en cada tema, quién de su organización conviene que participe y qué conviene
   tener a mano. Se arma sola desde el cuestionario (D, Q), así nunca queda desactualizada.
   · Es pública y no lleva datos de ninguna empresa ni usa Firebase: cualquiera con el enlace ve lo mismo.
   · NO muestra las opciones de respuesta (para que se responda lo que ocurre y no «la respuesta ideal») ni las preguntas de
     profundización, que aparecen solo si una respuesta sale baja.
   · El consultor obtiene el enlace desde «Guía previa para el cliente» en el menú: solo el enlace, para enviarlo por WhatsApp,
     correo u otro medio. */

const GUIA_V = '1.0';
// Por dimensión: de qué trata en palabras llanas y quién de la organización conviene que esté. Es una propuesta de AlignData.
const GUIA_DIM = {
  gobernanza: { tema: 'Quién lidera la protección de datos en la organización (DPO, roles y comité de privacidad) y qué políticas la respaldan.', quien: 'Gerencia general o dirección, y quien sea (o haría de) responsable de privacidad o legal.' },
  registro: { tema: 'Qué datos se tratan, para qué, quién accede a ellos y por cuánto tiempo se conservan: el mapeo y el registro de los tratamientos, y lo que se informa públicamente.', quien: 'Quien conoce los procesos y los sistemas (operaciones, TI) y legal.' },
  seguridad: { tema: 'Las medidas técnicas y organizativas que protegen los datos (cifrado, accesos y respaldos) y cómo se actuaría ante un incidente.', quien: 'TI o seguridad de la información, y quien administra los sistemas.' },
  cumplimiento: { tema: 'Cómo se aplica la Ley 21.719 artículo por artículo: con qué fundamento legal se usan los datos, qué se informa a las personas, cómo se retira el consentimiento y qué resguardos hay para datos sensibles, de niños, de biometría y de deudas comerciales.', quien: 'Legal o cumplimiento, marketing o comercial, recursos humanos y quien administra el sitio web y los formularios.' },
  riesgo: { tema: 'Cómo se evalúan los riesgos (evaluación de impacto y mapa de riesgos), qué se sabe de las sanciones y si existe un programa de cumplimiento.', quien: 'Gerencia y legal o cumplimiento.' },
  arcop: { tema: 'Cómo atiende la organización las solicitudes de las personas sobre sus datos: acceso, rectificación, supresión, oposición, portabilidad y bloqueo, con sus plazos y su evidencia.', quien: 'Atención al cliente, legal y TI (para ubicar y entregar los datos).' },
  terceros: { tema: 'Los proveedores y socios que acceden a datos, qué contratos y subprocesadores tienen y si algún dato sale del país.', quien: 'Compras o contratos, TI, legal y las áreas que usan herramientas externas.' },
  cultura: { tema: 'Si las personas que trabajan con datos saben qué pueden y qué no pueden hacer con ellos: capacitación y mejora continua.', quien: 'Recursos humanos, jefaturas y quien capacita al personal.' }
};

function guiaEnlace() { return location.origin + location.pathname + '?guia=1'; }

// Mensaje corto para acompañar el enlace (WhatsApp u otro medio)
function guiaMensaje() { return 'Hola, para que nuestra reunión del D360° Privacy Assessment sea más ágil, revise esta guía con los temas que veremos y lo que conviene tener a mano: ' + guiaEnlace(); }

function guiaHtml() {
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
<ol class="gp-q">${qs.map((q) => `<li>${esc(q.q)}</li>`).join('')}</ol>
<h4>Puede ir preparando</h4>
<ul class="gp-ev">${qs.map((q) => `<li>${esc(q.ev)}</li>`).join('')}</ul>
<p class="gp-nota">${p ? `Si alguna respuesta muestra que hay mucho por mejorar, es posible que hagamos ${p === 1 ? 'una pregunta adicional' : p + ' preguntas adicionales'} para entender mejor la situación.` : ''} Base legal: ${typeof refLey === 'function' ? refLey(d.a) : esc(d.a)}</p>
</section>`;
  }).join('');
  const resumen = D.map((d, i) => `<tr><th scope="row">${i + 1}. ${esc(d.n)}</th><td>${esc((GUIA_DIM[d.id] || {}).quien || '')}</td></tr>`).join('');
  return `<div class="gp">
<header class="gp-cab">
<p class="gp-sup">AlignData · D360° Privacy Assessment</p>
<h1>Guía previa a la sesión</h1>
<p class="gp-lead">Léala antes de la reunión: así la conversación será más ágil y aprovecharemos mejor el tiempo. Le muestra de qué vamos a hablar, qué le preguntaremos y qué conviene tener a mano.</p>
</header>
<section class="gp-bl" aria-labelledby="gp-que"><h2 id="gp-que">Qué vamos a hacer</h2>
<ol class="gp-pasos"><li><strong>Conversamos juntos, tema por tema.</strong> Son ${D.length} temas y ${total} preguntas sobre cómo se tratan hoy los datos personales en su organización.</li>
<li><strong>Usted responde con lo que realmente ocurre.</strong> No hay respuestas buenas ni malas, y no se evalúa a personas: es una fotografía de hoy para armar un plan.</li>
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

// Pantalla pública de la guía (?guia=1)
function guiaPrevia() {
  document.body.classList.add('cliente', 'guia');
  document.title = 'Guía previa a la sesión — D360° Privacy Assessment';
  const c = document.getElementById('gp-c'); if (!c) return;
  c.innerHTML = guiaHtml();
  if (typeof ss === 'function') ss('sg');
  if (window.lucide) lucide.createIcons();
  window.scrollTo(0, 0);
}

// Diálogo del consultor: el enlace, para copiarlo o enviarlo por WhatsApp
function guiaDlg() {
  const d = document.getElementById('dlg-guia'); if (!d) return;
  document.getElementById('gg-url').value = guiaEnlace();
  document.getElementById('gg-wa').href = 'https://wa.me/?text=' + encodeURIComponent(guiaMensaje());
  document.getElementById('gg-abrir').href = guiaEnlace();
  document.getElementById('gg-ok').textContent = '';
  if (!d.open) d.showModal();
  if (window.lucide) lucide.createIcons();
}
function guiaCopiar() {
  const e = document.getElementById('gg-url'), ok = document.getElementById('gg-ok'); if (!e) return;
  const fin = (t) => { if (ok) { ok.textContent = t; setTimeout(() => { ok.textContent = ''; }, 2200); } };
  try { navigator.clipboard.writeText(e.value).then(() => fin('Enlace copiado'), () => { e.select(); fin('Seleccionado: use Ctrl+C'); }); } catch (x) { e.select(); fin('Seleccionado: use Ctrl+C'); }
}

if (typeof location !== 'undefined' && typeof document !== 'undefined' && /(^|[?&])guia=/.test(location.search)) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', guiaPrevia); else guiaPrevia();
}
