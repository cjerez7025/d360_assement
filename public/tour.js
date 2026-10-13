/* tour.js — Recorridos guiados para cada perfil: el consultor (panel, sesión y resultados) y las personas del cliente
   (invitado a la reunión en vivo y lector de resultados). Un foco resalta cada elemento y una tarjeta lo explica.
   Cada recorrido se muestra solo la primera vez que se entra a esa pantalla y se puede repetir con el botón «Tour»
   (menú lateral del consultor, barra superior del cliente). No usa librerías externas ni guarda más que una marca por recorrido. */
(function () {
  const $ = (id) => document.getElementById(id);
  const V = '1'; // al cambiar el contenido de un recorrido, subir la versión para que vuelva a mostrarse
  const LS = (c) => 'd360tour.' + c;
  const RM = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const usuario = () => (window.pzUsuario ? window.pzUsuario() : null);
  const pantalla = () => { const s = document.querySelector('.screen.active'); return s ? s.id : ''; };
  const modoActual = () => (typeof modo !== 'undefined' ? modo : '');
  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const q = (s) => document.querySelector(s);
  // el menú lateral o, si está oculto (pantallas angostas), el botón que lo abre
  const menu = (s) => { const el = q(s); return visible(el) ? el : q('#sb-burger'); };

  // ── de qué pantalla se trata ──
  function contexto() {
    const m = modoActual(), s = pantalla();
    if (m === 'invitado') return s === 'sv' ? 'invitado' : '';
    if (m === 'cliente') return s === 's3' ? 'cliente' : '';
    if (!usuario()) return '';
    return s === 'sd' ? 'panel' : s === 's2' ? 'sesion' : s === 's3' ? 'resultados' : '';
  }

  // ── los recorridos ──
  const R = {
    panel: { nombre: 'Panel del consultor', pasos: [
      { t: 'Bienvenido al D360°', x: 'Un minuto para conocer el panel. Puede repetir este recorrido cuando quiera con «Tour de esta pantalla» del menú.' },
      { sel: () => menu('#sb'), t: 'Su menú', x: 'Desde aquí va a Sesiones y crea una nueva. Cuando abra una sesión aparecen Preguntas, Resultados, Hoja de ruta, Evolución, la Pizarra y la reunión en vivo.' },
      { sel: () => q('#sb-cb'), t: 'Su cuenta', x: 'Muestra con qué cuenta de Google ingresó. Al pulsarla ve su correo; abajo está «Cerrar sesión».' },
      { sel: () => q('.dh-new'), t: 'Nueva sesión', x: 'Cree la sesión con el nombre de la empresa, su rubro y su tamaño. El rubro y el tamaño ajustan el peso de algunas dimensiones, y el resultado lo explica.' },
      { sel: () => q('.dtools'), t: 'Busque y filtre', x: 'Encuentre una empresa por su nombre o filtre por estado: en curso, completas, compartidas con el cliente o con cambios sin publicar.' },
      { sel: () => q('#dl .sc'), t: 'Cada sesión', x: '«Continuar» retoma donde quedó, «Resultados» abre el informe y «Compartir» publica el enlace privado para el cliente.' },
      { t: 'Listo', x: 'Abra una sesión para ver el siguiente recorrido: aparece solo la primera vez.' }
    ] },
    sesion: { nombre: 'Conducir la reunión', pasos: [
      { sel: () => q('#pp'), t: 'El nivel, en vivo', x: 'Mientras responde, este panel muestra el nivel de madurez y el avance. Cambia de color cuando sube o baja de nivel.' },
      { sel: () => q('#s2 .pp-act'), t: 'Herramientas de la sesión', x: 'El Índice salta a cualquier pregunta; «Invitar al cliente» abre la reunión en vivo; «Cómo se calcula» explica el puntaje; la Pizarra guarda los comentarios.' },
      { sel: () => q('#qa .qh'), t: 'La ley en cada pregunta', x: 'Cada «art. X» abre el texto oficial de la ley. «¿Por qué se pregunta esto?» explica el fundamento de la pregunta.' },
      { sel: () => q('#qa .optw'), t: 'Respuestas con ejemplos', x: 'Cada respuesta tiene un ejemplo concreto: pulse la bombilla para verlo y léalo con el cliente. Con el teclado, 1 a 4 elige y Enter avanza.' },
      { sel: () => q('#qa .qn'), t: 'Avance y guardado', x: 'Todo se guarda solo. Si se cae internet, la sesión se sube sola al reconectar. Puede volver atrás para cambiar una respuesta.' },
      { sel: () => menu('.sb-it[data-id="viv"]'), t: 'Invite al cliente', x: 'Cree el enlace en vivo y envíelo por el chat de la videollamada. El cliente propone respuestas y usted decide cuál queda. Aquí verá quién está conectado.' },
      { sel: () => menu('.sb-it[data-id="res"]'), t: 'Cuando termine', x: 'Resultados muestra el puntaje, las brechas, la hoja de ruta y la evolución. Desde ahí también salen el informe ejecutivo y el acta.' }
    ] },
    resultados: { nombre: 'Resultados', pasos: [
      { sel: () => q('#s3 .rh'), t: 'El resultado', x: 'Puntaje, nivel de 0 a 4, índice y alertas críticas. El aviso de abajo dice si se aplicó el ajuste por rubro y por tamaño, con el puntaje sin ajustes.' },
      { sel: () => q('#s3 .eb'), t: 'Documentos y envío', x: 'Descargue el PDF técnico, el Informe ejecutivo o el Acta de la reunión. «Compartir con el cliente» crea un enlace privado que usted puede actualizar o revocar.' },
      { sel: () => q('#s3 .tb'), t: 'Distintas lecturas', x: 'Perfil, Brechas, Plan, Hoja de ruta, Semáforo, Evolución, Alertas, Pizarra y Método. Cada una responde una pregunta distinta del cliente.' },
      { sel: () => q('#tab-t8'), t: 'Hoja de ruta', x: 'Cada brecha es una iniciativa con su beneficio (puntos de puntaje) y su esfuerzo, ordenadas en cuatro etapas. Es el plan de adecuación.' },
      { sel: () => q('#tab-t9'), t: 'Evolución', x: 'Guarde el diagnóstico inicial y repita el diagnóstico a los 3, 6 y 12 meses para medir el avance contra la meta (nivel 3).' },
      { sel: () => q('#tab-t11'), t: 'Tablero del plan', x: 'Convierta la hoja de ruta en un backlog con un clic y, con D360° Acompaña o Implementa, avance las tareas entre columnas con responsable, fecha y evidencia. El cliente solo las ve.' },
      { sel: () => q('#tab-t10'), t: 'Servicio contratado', x: 'Registre qué paquete contrata el cliente, su estado y el contrato (la referencia al documento del Drive). Registrarlo no activa nada solo: es la decisión que usted deja anotada.' },
      { sel: () => q('#tab-t7'), t: 'Método', x: 'Explica cómo se calculó, con los números de esta sesión. Sirve para responder «¿por qué este puntaje?».' },
      { sel: () => menu('.sb-it[data-id="cmp"]'), t: 'Publicar', x: 'Cuando esté conforme, comparta el enlace de resultados con el cliente. Si corrige una respuesta después, puede actualizar lo publicado.' }
    ] },
    invitado: { nombre: 'Reunión en vivo', pasos: [
      { t: 'Bienvenido a la reunión', x: 'Su consultor de AlignData conduce el diagnóstico. Aquí ve lo mismo que él, en su propio dispositivo, y puede participar.' },
      { sel: () => q('#sv-h .pp'), t: 'Reunión en vivo', x: 'Indica qué pregunta se está tratando y que usted está conectado con su consultor. Avanza cuando él avanza.' },
      { sel: () => q('#vh-quien'), t: 'Su nombre', x: 'Su nombre aparece en lo que usted comente, para que todos sepan quién lo escribió. Puede cambiarlo aquí.' },
      { sel: () => q('#sv-q .qh'), t: 'La pregunta y la ley', x: 'Cada pregunta cita el artículo de la ley que la sustenta. Púlselo para leer el texto oficial.' },
      { sel: () => q('#sv-q .optw'), t: 'Proponga una respuesta', x: 'Elija la que mejor describe a su organización; la bombilla muestra un ejemplo de cada una. Su consultor la ve y decide cuál queda registrada.' },
      { sel: () => q('#pz-slot'), t: 'Pizarra compartida', x: 'Escriba comentarios, pegue imágenes con Ctrl+V o adjunte documentos de hasta 5 MB. Todos ven quién escribió qué.' },
      { t: 'Eso es todo', x: 'Mientras se responde no se muestran puntajes: los recibirá al final con un enlace de resultados. Puede repetir este recorrido con el botón «Tour». Para salir de la reunión, use «Salir».' }
    ] },
    cliente: { nombre: 'Sus resultados', pasos: [
      { sel: () => q('.cbanner'), t: 'Sus resultados', x: 'Preparados por AlignData y en modo lectura. El enlace es privado: compártalo solo con quien corresponda.' },
      { sel: () => q('#s3 .rh'), t: 'Puntaje y nivel', x: 'Su puntaje de 0 a 100 %, el nivel de madurez (0 a 4), el índice y las alertas críticas que conviene atender primero.' },
      { sel: () => q('#s3 .eb'), t: 'Descargue', x: 'El PDF técnico, el Informe ejecutivo y el Acta de la reunión se pueden guardar para compartir en su organización.' },
      { sel: () => q('#s3 .tb'), t: 'Recorra las pestañas', x: 'Brechas, Plan de acción, Semáforo de obligaciones, Alertas y Pizarra con los comentarios de la reunión.' },
      { sel: () => q('#tab-t8'), t: 'Hoja de ruta', x: 'Qué hacer primero, qué planificar y qué dejar para después, con el beneficio y el esfuerzo de cada iniciativa.' },
      { sel: () => q('#tab-t11'), t: 'Tablero del plan', x: 'El plan de adecuación como tareas: ve qué se hará primero y, cuando corresponda, cómo avanza. Lo actualiza su consultor.' },
      { sel: () => q('#tab-t10'), t: 'Su servicio', x: 'Aquí ve qué incluye su servicio actual y qué otros servicios existen. Si quiere avanzar, puede pedírselo a su consultor con un botón.' },
      { sel: () => q('#tab-t7'), t: 'Método', x: 'Explica cómo se calculó su resultado, con los números de su sesión.' }
    ] }
  };

  // ── estado y elementos ──
  let activo = null, el = null, previoFoco = null, seguir = null, ult = '', estable = 0;
  const visto = (c) => { try { return localStorage.getItem(LS(c)) === V; } catch (e) { return false; } };
  const marcar = (c) => { try { localStorage.setItem(LS(c), V); } catch (e) { /* sin almacenamiento: vale para esta visita */ } };

  function crear() {
    const d = document.createElement('div');
    d.className = 'tr'; d.id = 'tr';
    d.innerHTML = '<div class="tr-velo" aria-hidden="true"></div><div class="tr-foco" aria-hidden="true"></div>' +
      '<div class="tr-card" role="dialog" aria-modal="true" aria-labelledby="tr-t" aria-describedby="tr-x" tabindex="-1">' +
      '<p class="tr-paso" id="tr-p" aria-live="polite"></p><h2 class="tr-t" id="tr-t"></h2><p class="tr-x" id="tr-x"></p>' +
      '<div class="tr-pt" id="tr-pt" aria-hidden="true"></div>' +
      '<div class="tr-bt"><button type="button" class="tr-saltar" id="tr-s">Saltar tour</button><span class="tr-bn"><button type="button" class="tr-b" id="tr-a">Atrás</button><button type="button" class="tr-b tr-pri" id="tr-n">Siguiente</button></span></div></div>';
    document.body.appendChild(d);
    $('tr-s').addEventListener('click', () => cerrar());
    $('tr-a').addEventListener('click', () => ir(activo.i - 1, -1));
    $('tr-n').addEventListener('click', () => (activo.i >= activo.pasos.length - 1 ? cerrar() : ir(activo.i + 1, 1)));
    return d;
  }

  const objetivo = (p) => { try { const e = p.sel ? p.sel() : null; return e && visible(e) ? e : null; } catch (e) { return null; } };

  function colocar() {
    if (!activo) return;
    const card = el.querySelector('.tr-card'), foco = el.querySelector('.tr-foco'), p = activo.pasos[activo.i], t = objetivo(p);
    const vw = innerWidth, vh = innerHeight, M = 12;
    el.classList.toggle('tr-sin', !t);
    if (!t) { foco.style.opacity = '0'; card.style.cssText = ''; card.classList.add('tr-centro'); card.classList.remove('tr-hoja'); return; }
    const r = t.getBoundingClientRect(), P = 8;
    foco.style.opacity = '1';
    foco.style.left = (r.left - P) + 'px'; foco.style.top = (r.top - P) + 'px'; foco.style.width = (r.width + 2 * P) + 'px'; foco.style.height = (r.height + 2 * P) + 'px';
    card.classList.remove('tr-centro');
    if (vw < 640) {
      card.classList.add('tr-hoja'); card.style.cssText = '';
      // la hoja ocupa la parte baja: si tapa el elemento, se desplaza la página hasta dejarlo a la vista
      const libre = vh - card.getBoundingClientRect().height - 24;
      if (r.bottom > libre && !activo.ajustado) { activo.ajustado = true; window.scrollBy({ top: Math.max(0, Math.min(r.bottom - libre, r.top - 8)), behavior: 'auto' }); }
      return;
    }
    card.classList.remove('tr-hoja');
    const W = Math.min(360, vw - 2 * M); card.style.width = W + 'px'; card.style.left = '0px'; card.style.top = '0px';
    const H = card.getBoundingClientRect().height;
    const lugar = [['der', vw - r.right - P >= W + 20], ['aba', vh - r.bottom - P >= H + 20], ['arr', r.top - P >= H + 20], ['izq', r.left - P >= W + 20]].find((l) => l[1]);
    let x, y;
    if (!lugar) { x = (vw - W) / 2; y = Math.max(M, vh - H - M); }
    else if (lugar[0] === 'der') { x = r.right + P + 14; y = r.top + r.height / 2 - H / 2; }
    else if (lugar[0] === 'izq') { x = r.left - P - 14 - W; y = r.top + r.height / 2 - H / 2; }
    else if (lugar[0] === 'aba') { x = r.left + r.width / 2 - W / 2; y = r.bottom + P + 14; }
    else { x = r.left + r.width / 2 - W / 2; y = r.top - P - 14 - H; }
    card.style.left = Math.min(Math.max(M, x), vw - W - M) + 'px';
    card.style.top = Math.min(Math.max(M, y), vh - H - M) + 'px';
  }

  function ir(i, dir) {
    const pasos = activo.pasos;
    // salta los pasos cuyo elemento no está en pantalla (el recorrido sigue en la dirección elegida)
    while (i >= 0 && i < pasos.length && pasos[i].sel && !objetivo(pasos[i])) i += dir;
    if (i < 0) i = 0;
    if (i >= pasos.length) return cerrar();
    activo.i = i; activo.ajustado = false;
    const p = pasos[i], n = pasos.length, card = el.querySelector('.tr-card');
    $('tr-p').textContent = 'Paso ' + (i + 1) + ' de ' + n + ' · ' + activo.nombre;
    $('tr-t').textContent = p.t; $('tr-x').textContent = p.x;
    $('tr-pt').innerHTML = pasos.map((_, k) => '<i class="' + (k === i ? 'on' : k < i ? 'ya' : '') + '"></i>').join('');
    $('tr-a').hidden = i === 0;
    $('tr-n').textContent = i === n - 1 ? 'Terminar' : 'Siguiente';
    $('tr-s').hidden = i === n - 1;
    const t = objetivo(p);
    if (t) t.scrollIntoView({ block: 'center', inline: 'nearest', behavior: RM() ? 'auto' : 'smooth' });
    colocar();
    // sigue al elemento mientras termina de desplazarse
    const fin = Date.now() + 600; clearInterval(seguir);
    seguir = setInterval(() => { colocar(); if (Date.now() > fin) clearInterval(seguir); }, 60);
    $('tr-n').focus({ preventScroll: true });
    card.scrollTop = 0;
  }

  function cerrar() {
    if (!activo) return;
    marcar(activo.ctx); clearInterval(seguir);
    el.hidden = true; document.body.classList.remove('tr-on'); activo = null;
    if (previoFoco && previoFoco.focus) { try { previoFoco.focus({ preventScroll: true }); } catch (e) { /* el elemento ya no existe */ } }
  }

  function iniciar(ctx, manual) {
    ctx = ctx || contexto();
    if (!R[ctx] || (activo && !manual)) return false;
    if (activo) cerrar();
    if (!el) el = crear();
    previoFoco = document.activeElement;
    activo = { ctx, nombre: R[ctx].nombre, pasos: R[ctx].pasos, i: 0 };
    el.hidden = false; document.body.classList.add('tr-on');
    ir(0, 1);
    return true;
  }

  // ── teclado: ← → para moverse, Esc para salir, Tab se queda dentro de la tarjeta ──
  document.addEventListener('keydown', (e) => {
    if (!activo) return;
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); $('tr-n').click(); }
    else if (e.key === 'ArrowLeft' && !$('tr-a').hidden) { e.preventDefault(); $('tr-a').click(); }
    else if (e.key === 'Tab') {
      const bs = [...el.querySelectorAll('.tr-card button')].filter((b) => !b.hidden);
      if (!bs.length) return;
      const i = bs.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); bs[bs.length - 1].focus(); }
      else if (!e.shiftKey && i === bs.length - 1) { e.preventDefault(); bs[0].focus(); }
    }
  }, true);
  window.addEventListener('resize', () => colocar());
  window.addEventListener('scroll', () => colocar(), true);

  // ── botón «Tour» de la barra superior (cliente e invitado) y arranque automático la primera vez ──
  function boton() {
    const b = $('tour-btn'); if (!b) return;
    const ctx = contexto(), m = modoActual();
    b.hidden = !(R[ctx] && (m === 'cliente' || m === 'invitado'));
  }
  function vigilar() {
    boton();
    const c = contexto();
    if (c !== ult) { ult = c; estable = 0; if (activo && activo.ctx !== c) cerrar(); return; }
    if (!c || activo || visto(c)) return;
    if (document.querySelector('dialog[open]')) return; // por ejemplo, mientras escribe su nombre
    if (++estable >= 3) { estable = 0; iniciar(c, false); }
  }
  const b = $('tour-btn'); if (b) b.addEventListener('click', () => iniciar(null, true));
  window.tourIniciar = iniciar;
  window.tourContexto = contexto;
  setInterval(vigilar, 700);
})();
