/* Sesiones guardadas del D360°.
   · Consultor: inicia sesión con Google, ve sus sesiones, conduce la reunión (navega las preguntas y
     registra las respuestas, que se guardan solas) y publica un enlace con los resultados.
   · Cliente: abre el enlace y ve sus resultados en modo lectura.
   Usa las variables de app.js (en, modo, Nube, rq, sr, ss, esc, lbl, fchd). Sin firebase-config.js no hace nada. */
(function () {
  if (!window.D360_NUBE) return;
  const $ = (id) => document.getElementById(id);
  const P = new URLSearchParams(location.search);
  const CFG = window.D360_NUBE;
  const guardado = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  // modo de prueba: solo si firebase-config.js lo permite (prueba: true); los datos quedan en este navegador
  const PRUEBA = !!CFG.prueba && (guardado('d360prueba') === '1' || P.get('prueba') === '1');
  const MOCK = PRUEBA || (P.get('mock') === '1' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'));
  let N = null, user = null, desub = null, lista = [], act = null, confirmaRev = false, vivoOff = null, confirmaVivo = false;
  const ms = (t) => (t && t.toMillis ? t.toMillis() : typeof t === 'number' ? t : null);
  window.pzUsuario = () => user; // autor verificado de los comentarios del consultor
  // quién conduce la reunión o preparó los resultados: lo ve el cliente en la barra superior (nombre y foto de Google)
  const yoConsultor = () => { const c = { nombre: String((user && (user.nombre || user.email)) || 'Consultor').slice(0, 80) }; const f = user && avFoto(user.foto); if (f) c.foto = f; return c; };

  function solo(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active')); $(id).classList.add('active'); }
  function msg(titulo, texto, acciones) {
    $('se-t').textContent = titulo; $('se-p').textContent = texto || '';
    const a = $('se-a'); a.innerHTML = '';
    (acciones || []).forEach(([t, f]) => { const b = document.createElement('button'); b.className = 'be'; b.textContent = t; b.onclick = f; a.appendChild(b); });
    ss('se');
  }
  function rel(t) {
    if (!t) return 'ahora';
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'hace un momento';
    if (m < 60) return 'hace ' + m + ' min';
    const h = Math.round(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : d < 7 ? 'hace ' + d + ' días' : fchd(new Date(t));
  }

  // ── arranque ──
  const gt = $('go-t'); if (gt) gt.textContent = 'Crear sesión e iniciar';
  if (PRUEBA) { $('pbanner').hidden = false; document.body.classList.add('prueba'); }
  if (CFG.prueba && !PRUEBA) { $('btn-prueba').hidden = false; $('hint-prueba').hidden = false; $('btn-prueba').onclick = () => { try { localStorage.setItem('d360prueba', '1'); } catch (e) { /* sin almacenamiento */ } location.reload(); }; }
  solo('se'); $('se-t').textContent = 'Cargando…'; // evita mostrar la portada antigua mientras se decide la vista
  // el consultor conoce el enlace publicado de la sesión abierta (para recibir las solicitudes del cliente)
  window.srvCtx = () => ({ N, tk: act && act.compartido && act.compartido.token });
  async function arrancar() {
    if (P.has('guia') || P.has('glosario')) return; // la guía previa y el glosario se dibujan solos (guia.js, glosario.js), sin sesión ni Firebase
    document.body.classList.add('nube');
    // en localhost se evita el caché de módulos; en producción lo resuelve la cabecera Cache-Control de firebase.json
    const sufijo = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? '?t=' + Date.now() : '';
    try { N = await import((MOCK ? './nube-prueba.js' : './nube.js') + sufijo); }
    catch (e) { msg('No se pudo conectar', 'El servicio de sesiones no está disponible. Revise su conexión e intente de nuevo.', [['Reintentar', () => location.reload()]]); return; }
    if (P.get('v')) return window.vivoCliente(N, P.get('v'));
    const tk = P.get('r');
    if (tk) return cliente(tk);
    modo = 'auditor'; Nube = N; N.iniciar({ persistente: true });
    if (N.resultadoRedireccion) N.resultadoRedireccion().then((cod) => { if (cod) errorIngreso(cod); });
    N.alCambiarUsuario((u) => { user = u; if (u) entrar(); else fuera(); });
  }

  // ── cliente: resultados en modo lectura ──
  async function cliente(tk) {
    modo = 'cliente'; document.body.classList.add('cliente'); N.iniciar({ persistente: false });
    window.srvCtx = () => ({ N, tk }); // para pedir avanzar de servicio desde la pestaña «Servicio»
    const invalido = () => msg('Enlace no disponible', 'Este enlace no existe o fue desactivado por quien lo compartió. Pida a su consultor de AlignData que le envíe uno nuevo.');
    if (!/^[A-Za-z0-9_-]{32}$/.test(tk)) return invalido();
    msg('Cargando sus resultados…', '');
    try {
      const d = await N.leerCompartido(tk);
      if (!d) return invalido();
      en.rs(); en.ro = true; en.cargar(d); en.pubEn = ms(d.publicadoEn);
      en.cons = d.consultor || null;
      if (d.consultor) usuarioBarra({ con: { nombre: d.consultor.nombre, foto: d.consultor.foto, etq: 'Preparado por', rol: 'Consultor AlignData' } });
      let pz = []; try { pz = await N.pzLeerCompartido(tk); } catch (e) { pz = []; } // sin pizarra publicada o sin acceso: se muestran solo los resultados
      PZ.lectura(pz, tk, N);
      sr();
    } catch (e) { invalido(); }
  }

  // ── consultor: acceso ──
  function fuera() {
    usuarioBarra(null); $('saveind').hidden = true; if (desub) { desub(); desub = null; }
    en.rs(); lista = []; PZ.parar(); ss('s0');
  }
  function noAutorizado() {
    msg('Cuenta no autorizada', 'La cuenta ' + (user ? user.email : '') + ' no tiene permiso para conducir sesiones D360°. Pida a AlignData que la autorice o ingrese con otra cuenta.', [['Cerrar sesión', () => window.salir()]]);
  }
  function entrar() {
    usuarioBarra({ yo: { nombre: user.nombre || user.email, foto: user.foto, rol: 'Consultor', sub: user.email }, salir: true });
    if (desub) desub();
    desub = N.escucharSesiones((s) => {
      lista = s;
      if ($('sd').classList.contains('active')) renderDash();
      if ($('dlg').open) dlgRender();
    }, (e) => { if (e && e.code === 'permission-denied') noAutorizado(); else msg('No se pudieron cargar las sesiones', 'Intente de nuevo en unos minutos.', [['Reintentar', () => location.reload()]]); });
    if (!en.sid) window.dash();
  }
  const ERR_LOGIN = {
    'auth/operation-not-allowed': 'El acceso con Google aún no está activado en Firebase (Authentication > Sign-in method).',
    'auth/unauthorized-domain': 'Este sitio no está en los dominios autorizados de Firebase Authentication.',
    'auth/network-request-failed': 'No hay conexión con el servicio de ingreso. Revise su internet.',
    'auth/internal-error': 'Firebase respondió con un error interno. Intente de nuevo en unos minutos.'
  };
  function errorIngreso(codigo) {
    const er = $('lerr'); er.querySelector('span').textContent = (ERR_LOGIN[codigo] || 'No se pudo iniciar sesión.') + ' (' + codigo + ')'; er.classList.add('show');
  }
  $('btn-login').onclick = async () => {
    $('lerr').classList.remove('show');
    try { await N.ingresar(); }
    catch (e) { errorIngreso(e.code || e.message); }
  };
  window.salir = async () => {
    if (PRUEBA) { try { localStorage.removeItem('d360prueba'); } catch (e) { /* nada */ } location.href = location.pathname; return; }
    try { await N.salir(); } finally { location.reload(); }
  };

  // ── consultor: panel de sesiones ──
  const estado = (s) => (s.compartido ? (cambios(s) ? 'cambios' : 'compartida') : s.estado === 'completa' ? 'completa' : 'en_curso');
  function cambios(s) { const c = s.compartido && ms(s.compartido.en), a = ms(s.actualizadoEn); return !!(c && ((a && a > c + 1500) || (act && act.id === s.id && PZ.ultimo() > c + 1500))); }
  const CHIP = { en_curso: ['lvn', 'En curso'], completa: ['lv3', 'Completa'], compartida: ['lv4', 'Compartida con el cliente'], cambios: ['lv2', 'Cambios sin publicar'] };
  const nivelDe = (s) => (s.puntaje != null ? en.ml(s.puntaje).n : 'x');
  function tarjeta(s) {
    const e = estado(s), [k, t] = CHIP[e], p = s.perfil || {}, av = s.avance || 0;
    const niv = s.puntaje != null ? en.ml(s.puntaje).nm : null;
    return `<article class="sc ${k} nv${nivelDe(s)}" data-id="${s.id}"><div class="sc-top"><h3>${esc(p.nombre || 'Sin nombre')}</h3><span class="pill">${t}</span></div>
<p class="sc-meta">${esc(lbl('f2', p.sector))} · ${esc(lbl('f3', p['tamaño']))}${p.contacto ? ' · Contacto: ' + esc(p.contacto) : ''}</p>
${s.servicio && srvEtiqueta(s.servicio) ? '<p class="sc-srv"><i data-lucide="handshake"></i> ' + esc(srvEtiqueta(s.servicio)) + '</p>' : ''}
<div class="mtr" role="img" aria-label="Avance ${av}%"><i style="width:${av}%"></i></div>
<div class="sc-stats"><span>${s.hechas || 0} de ${s.total || '—'} respondidas</span><span>${s.puntaje != null ? '<span class="sc-lv"><b>' + s.puntaje + '%</b> ' + esc(niv) + '</span>' : 'Sin puntaje aún'}</span></div>
<p class="sc-foot">Actualizada ${rel(ms(s.actualizadoEn))}${s.actualizadoPor ? ' por ' + esc(s.actualizadoPor) : ''}</p>
<div class="sc-act"><button class="be be-p" onclick="abrirSes('${s.id}')"><i data-lucide="play"></i>${s.estado === 'completa' ? 'Abrir' : 'Continuar'}</button><button class="be" onclick="resSes('${s.id}')"><i data-lucide="bar-chart-3"></i>Resultados</button><button class="be" onclick="cmpSes('${s.id}')"><i data-lucide="share-2"></i>Compartir</button><button class="be be-del" onclick="elimSes('${s.id}')" aria-label="Eliminar la sesión de ${esc(p.nombre || 'Sin nombre')}"><i data-lucide="trash-2"></i>Eliminar</button></div></article>`;
  }
  let nvPrev = {};
  function renderDash() {
    const q = ($('dq').value || '').toLowerCase().trim(), f = $('df').value;
    const filas = lista.filter((s) => (!q || ((s.perfil && s.perfil.nombre) || '').toLowerCase().includes(q)) && (!f || estado(s) === f));
    $('dl').innerHTML = filas.length ? filas.map(tarjeta).join('')
      : `<div class="sc-vacio"><i data-lucide="folder-open"></i><p>${lista.length ? 'Ninguna sesión coincide con el filtro.' : 'Aún no hay sesiones. Cree la primera para comenzar una reunión con un cliente.'}</p></div>`;
    $('dcount').textContent = lista.length + (lista.length === 1 ? ' sesión' : ' sesiones');
    // si una sesión cambió de nivel desde la última vez, su tarjeta parte con el color anterior y pasa al nuevo con una transición
    const antes = nvPrev; nvPrev = {};
    lista.forEach((s) => { nvPrev[s.id] = nivelDe(s); });
    filas.forEach((s) => {
      const o = antes[s.id], n = nivelDe(s); if (o === undefined || o === n) return;
      const el = $('dl').querySelector('[data-id="' + s.id + '"]'); if (!el) return;
      el.classList.replace('nv' + n, 'nv' + o);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.replace('nv' + o, 'nv' + n)));
    });
    lucide.createIcons();
  }
  window.filtrar = renderDash;
  window.dash = async function () {
    if (N && N.vaciarYa) { try { await N.vaciarYa(); } catch (e) { /* se reintenta al reconectar */ } }
    vivoPush('pausa'); if (vivoOff) { vivoOff(); vivoOff = null; }
    PZ.parar();
    en.rs(); cs = null; act = null; $('saveind').hidden = true; vivoBtn();
    ss('sd'); renderDash();
  };
  // ── eliminar una sesión: se confirma escribiendo el nombre de la empresa ──
  let elim = null;
  const norm = (x) => String(x || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
  function elimRender() {
    const s = elim; if (!s) return;
    const p = s.perfil || {}, nom = p.nombre || 'Sin nombre', n = (s.revisiones || []).length, vivoAct = !!(s.vivo && s.vivo.token && (+s.vivo.venceEn || 0) > Date.now());
    const h = s.hechas || 0, efectos = ['Las respuestas (' + h + (h === 1 ? ' respondida' : ' respondidas') + ') y los resultados.', n ? (n === 1 ? 'La revisión guardada.' : 'Las ' + n + ' revisiones guardadas.') : '', s.servicio ? 'El servicio contratado registrado.' : '', 'La pizarra, con sus comentarios, imágenes y archivos adjuntos.', s.compartido ? '<strong>El enlace de resultados dejará de funcionar para el cliente.</strong>' : '', vivoAct ? '<strong>La reunión en vivo se cerrará.</strong>' : ''].filter(Boolean);
    $('del-slot').innerHTML = `<p>Va a eliminar la sesión de <strong>${esc(nom)}</strong>. Se borrarán de forma definitiva:</p><ul class="del-l">${efectos.map((t) => '<li>' + t + '</li>').join('')}</ul>
<p class="dlg-warn" role="note"><i data-lucide="triangle-alert"></i>No se puede deshacer. Si necesita conservar algo, descargue antes el informe ejecutivo, el acta o el PDF.</p>
<div class="fg"><label for="del-n">Para confirmar, escriba el nombre de la empresa: <strong>${esc(nom)}</strong></label><input id="del-n" autocomplete="off" oninput="elimEscribe()"></div>
<div id="del-er" class="dlg-warn" role="alert" hidden></div>
<div class="dlg-act"><button type="button" class="be dng" id="del-go" disabled onclick="elimHacer()"><i data-lucide="trash-2"></i>Eliminar definitivamente</button><button type="button" class="be" onclick="document.getElementById('dlg-del').close()">Cancelar</button></div>`;
    lucide.createIcons();
  }
  window.elimSes = (id) => { const s = lista.find((x) => x.id === id); if (!s) return; elim = s; elimRender(); const d = $('dlg-del'); if (!d.open) d.showModal(); const i = $('del-n'); if (i) i.focus(); };
  window.elimEscribe = () => { const s = elim; if (!s) return; $('del-go').disabled = norm($('del-n').value) !== norm((s.perfil || {}).nombre || 'Sin nombre'); };
  window.elimHacer = async () => {
    const s = elim; if (!s || !N || !N.eliminarSesion || norm($('del-n').value) !== norm((s.perfil || {}).nombre || 'Sin nombre')) return;
    const go = $('del-go'); go.disabled = true; go.textContent = 'Eliminando…'; $('del-er').hidden = true;
    try {
      if (act && act.id === s.id) await window.dash(); // si estaba abierta, se cierra antes (se guarda lo pendiente y se sueltan las escuchas)
      await N.eliminarSesion(s.id, s);
    } catch (e) {
      $('del-er').textContent = 'No se pudo terminar de eliminar (' + (e.code || e.message) + '). La sesión sigue en la lista: puede reintentar y se retomará donde quedó.'; $('del-er').hidden = false;
      go.disabled = false; go.innerHTML = '<i data-lucide="trash-2"></i>Reintentar'; lucide.createIcons(); return;
    }
    elim = null; $('dlg-del').close();
  };
  window.nueva = function () {
    ['f1', 'f4', 'f5'].forEach((id) => { $(id).value = ''; });
    ['f2', 'f3'].forEach((id) => { $(id).value = ''; });
    ['f1', 'f2', 'f3'].forEach((id) => $(id).setAttribute('aria-invalid', 'false'));
    $('ferr').classList.remove('show'); ss('s1'); $('f1').focus();
  };
  window.go = function () {
    const n = $('f1'), s = $('f2'), z = $('f3'), er = $('ferr'); let malo = null;
    for (const f of [n, s, z]) { const m = !String(f.value || '').trim(); f.setAttribute('aria-invalid', m ? 'true' : 'false'); if (m && !malo) malo = f; }
    if (malo) { er.classList.add('show'); malo.focus(); return; }
    er.classList.remove('show');
    const perfil = { nombre: n.value.trim(), sector: s.value, 'tamaño': z.value, contacto: $('f5').value.trim(), email: $('f4').value.trim() };
    const id = N.crear(perfil);
    en.rs(); en.sp(perfil); en.sid = id; act = { id, compartido: null };
    PZ.abrirSesion(N, id);
    ss('s2'); rq(en.ga()[0].id);
  };
  async function cargar(id) {
    let d = null;
    try { d = await N.leer(id); } catch (e) { d = null; }
    d = d || lista.find((s) => s.id === id);
    if (!d) { msg('No se encontró la sesión', 'Puede que otra persona la haya eliminado.', [['Volver a las sesiones', () => window.dash()]]); throw new Error('sin sesión'); }
    en.rs(); en.cargar(d); en.sid = id; modo = 'auditor'; act = { id, compartido: d.compartido || null };
    en.viv = d.vivo && d.vivo.venceEn > Date.now() ? d.vivo : null;
    await PZ.abrirSesion(N, id); await migrarNotas(d, id); vivoOn();
  }
  // Las antiguas «Notas de la reunión» (un texto por pregunta) pasan a la pizarra de su pregunta, con el mismo autor y la fecha de la sesión.
  // El id es fijo (pzIdNota), así que repetirlo no duplica nada; recién después se borran de la sesión.
  async function migrarNotas(d, sid) {
    const notas = Object.entries(en.n || {}).filter(([, t]) => String(t).trim());
    if (!notas.length || !N.pzEspejar) return;
    const cr = d.creadoPor || {}, autor = String(cr.nombre || cr.email || (user && (user.nombre || user.email)) || 'Consultor').slice(0, 60), email = cr.email || (user && user.email);
    try {
      for (const [qid, texto] of notas) {
        const e = { id: pzIdNota(sid, qid), autor, rol: 'consultor', qid, texto: String(texto).slice(0, 2000), creadoEn: ms(d.actualizadoEn) || Date.now() };
        if (email) e.email = email;
        await N.pzEspejar(sid, e);
      }
      en.n = {}; en.sv();
    } catch (e) { /* sin permiso o sin conexión: las notas siguen en la sesión y se reintenta al abrirla de nuevo */ }
  }
  window.abrirSes = async (id) => { try { await cargar(id); } catch (e) { return; } ss('s2'); const n = en.nx(); if (n) rq(n.id); else sr(); };
  window.resSes = async (id) => { try { await cargar(id); } catch (e) { return; } sr(); };
  window.cmpSes = async (id) => { try { await cargar(id); } catch (e) { return; } window.cmp(); };

  // ── indicador de guardado ──
  function ind(s, codigo) {
    const el = $('saveind'); if (!en.sid) return;
    el.hidden = false; el.dataset.s = s;
    $('saveind-t').textContent = { guardando: 'Guardando…', guardado: 'Guardado', pendiente: 'Sin conexión: se guardará al reconectar', error: 'No se pudo guardar' + (codigo === 'permission-denied' ? ' (sin permiso)' : '') }[s] || '';
  }
  window.addEventListener('nube:estado', (e) => ind(e.detail.estado, e.detail.codigo));
  window.addEventListener('offline', () => { if (en.sid) ind('pendiente'); });
  window.addEventListener('online', () => { if (N && N.vaciarYa) N.vaciarYa(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && N && N.vaciarYa && en.sid) N.vaciarYa(); });
  window.addEventListener('pagehide', () => { if (N && N.vaciarYa && en.sid) N.vaciarYa(); });

  // ── compartir con el cliente ──
  const enlace = (tk) => location.origin + location.pathname + '?r=' + tk + (PRUEBA ? '&prueba=1' : MOCK ? '&mock=1' : '');
  window.cmp = function () { confirmaRev = false; dlgRender(); const d = $('dlg'); if (!d.open) d.showModal(); };
  function dlgRender() {
    const s = lista.find((x) => x.id === act.id), c = (s && s.compartido) || act.compartido, tk = c && c.token;
    const p = en.pub().perfil, r = en.res();
    const parcial = r.completa ? '' : `<p class="dlg-warn"><i data-lucide="triangle-alert"></i>La sesión tiene ${r.hechas} de ${r.total} preguntas respondidas: los resultados serán parciales.</p>`;
    let h;
    if (!tk) {
      h = `<p>Quien reciba el enlace verá los resultados de <strong>${esc(p.nombre)}</strong> en modo lectura: las respuestas y la pizarra con los comentarios y archivos de la reunión. No podrá modificar nada.</p>${parcial}<div class="dlg-act"><button class="be be-p" id="dlg-pub" onclick="pub()"><i data-lucide="link"></i>Publicar y crear enlace</button></div>`;
    } else {
      const url = enlace(tk), cam = s && cambios(s);
      h = `<p>Los resultados de <strong>${esc(p.nombre)}</strong> están publicados${c.en ? ' desde el ' + fchd(new Date(ms(c.en) || Date.now())) : ''}.</p>
<label for="dlg-url" class="dlg-l">Enlace para el cliente</label>
<div class="dlg-url"><input id="dlg-url" readonly value="${esc(url)}" onfocus="this.select()"><button class="be be-p" onclick="cpy()"><i data-lucide="copy"></i>Copiar</button></div><p class="dlg-ok" id="dlg-cp" role="status"></p>
${cam ? `<p class="dlg-warn"><i data-lucide="triangle-alert"></i>Hay respuestas nuevas que el cliente todavía no ve.</p><div class="dlg-act"><button class="be be-p" id="dlg-pub" onclick="pub()"><i data-lucide="refresh-cw"></i>Actualizar resultados publicados</button></div>` : '<p class="dlg-ok"><i data-lucide="circle-check"></i>El cliente ve las respuestas actuales.</p>'}
${parcial}<div class="dlg-act"><a class="be" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i>Ver como cliente</a><button class="be dng" onclick="rev()">${confirmaRev ? 'Confirmar: el enlace dejará de funcionar' : 'Revocar enlace'}</button></div>`;
    }
    $('dlg-body').innerHTML = h; lucide.createIcons();
  }
  window.pub = async function () {
    const b = $('dlg-pub'); if (b) b.disabled = true;
    try {
      await N.vaciarYa();
      const tk = await N.compartir(act.id, { ...en.pub(), consultor: yoConsultor() }, act.compartido && act.compartido.token);
      await N.pzPublicar(tk, PZ.entries, act.id);
      act.compartido = { token: tk, en: Date.now() };
    } catch (e) { $('dlg-body').insertAdjacentHTML('afterbegin', '<p class="dlg-warn" role="alert">No se pudo publicar (' + esc(e.code || e.message) + '). Intente de nuevo.</p>'); if (b) b.disabled = false; return; }
    dlgRender();
  };
  window.rev = async function () {
    if (!confirmaRev) { confirmaRev = true; dlgRender(); return; }
    try { try { await N.pzBorrarCompartido(act.compartido.token); } catch (e) { /* sin pizarra publicada */ } await N.revocar(act.id, act.compartido.token); act.compartido = null; confirmaRev = false; } catch (e) { $('dlg-body').insertAdjacentHTML('afterbegin', '<p class="dlg-warn" role="alert">No se pudo revocar (' + esc(e.code || e.message) + ').</p>'); return; }
    const s = lista.find((x) => x.id === act.id); if (s) s.compartido = null;
    dlgRender();
  };
  window.cpy = async function () {
    const i = $('dlg-url'), ok = $('dlg-cp');
    try { await navigator.clipboard.writeText(i.value); ok.textContent = 'Enlace copiado.'; }
    catch (e) { i.select(); ok.textContent = 'Seleccionado: use Ctrl+C para copiarlo.'; }
  };
  $('dlg').addEventListener('click', (e) => { if (e.target === $('dlg')) $('dlg').close(); }); // clic fuera = cerrar

  // ── reunión en vivo (el cliente sigue la pregunta desde su propio dispositivo y propone respuestas) ──
  const enlaceVivo = (tk) => location.origin + location.pathname + '?v=' + tk + (PRUEBA ? '&prueba=1' : MOCK ? '&mock=1' : '');
  // personas del cliente conectadas ahora (cada dispositivo avisa cada ~25 s)
  let presentes = [], presOff = null;
  // una misma persona que recarga la página (código nuevo) o entra desde dos dispositivos se cuenta una sola vez
  const presentesActivos = () => [...new Map(presentes.filter((p) => p.n && Date.now() - (+p.t || 0) < 70000).map((p) => [p.n.toLowerCase() + '|' + (p.c || '').toLowerCase(), p])).values()].sort((a, b) => a.n.localeCompare(b.n));
  function vivoBtn() {
    const t = $('bviv-t'), b = $('bviv'); if (!t) return;
    const pr = presentesActivos(), conectado = !!(en.viv && (pr.length || (en.clienteVisto && Date.now() - en.clienteVisto < 60000)));
    t.textContent = !en.viv ? 'Invitar al cliente' : pr.length === 1 ? 'Conectado: ' + pr[0].n.split(' ')[0] : pr.length > 1 ? pr.length + ' conectados' : conectado ? 'Cliente conectado' : 'En vivo · esperando al cliente';
    b.classList.toggle('en-vivo', !!en.viv); b.classList.toggle('conectado', conectado);
  }
  setInterval(vivoBtn, 15000);
  function vivoOn() {
    if (vivoOff) { vivoOff(); vivoOff = null; }
    en.prop = {}; en.clienteVisto = null; vivoBtn();
    PZ.vivo(en.viv ? en.viv.token : null);
    if (presOff) { presOff(); presOff = null; } presentes = [];
    if (en.viv && N.vivoPresentes) presOff = N.vivoPresentes(en.viv.token, (l) => { presentes = l; vivoBtn(); if ($('dlg-vivo').open) vivoRender(); });
    if (!en.viv || !N.vivoEscuchar) return;
    vivoOff = N.vivoEscuchar(en.viv.token, (d) => {
      if (!d) { en.viv = null; en.prop = {}; en.clienteVisto = null; }
      else { en.prop = d.propuestas || {}; en.clienteVisto = ms(d.clienteVisto); }
      propUI(); vivoBtn(); if ($('dlg-vivo').open) vivoRender();
    }, () => {});
  }
  function vivoRender() {
    if (!en.viv) {
      $('dv-body').innerHTML = `<p>Invite a su cliente a seguir la reunión desde su propio computador o celular mientras siguen conectados por la videollamada.</p>
<ul class="dv-l"><li>Verá <strong>la misma pregunta</strong> que usted, con sus ejemplos.</li><li>Podrá <strong>escribir comentarios y subir imágenes</strong> en la pizarra, con su nombre; usted y todos los participantes los ven al instante.</li><li>Podrá <strong>proponer una respuesta</strong>: usted la ve en su pantalla y decide cuál queda registrada.</li><li><strong>No</strong> ve el nivel ni los puntajes mientras responde.</li><li>El enlace vence en 12 horas y usted puede cerrarlo cuando quiera.</li></ul>
<div class="dlg-act"><button class="be be-p" id="dv-go" onclick="vivoCrear()"><i data-lucide="link"></i>Crear enlace en vivo</button></div>`;
    } else {
      const url = enlaceVivo(en.viv.token), pr = presentesActivos(), on = !!(pr.length || (en.clienteVisto && Date.now() - en.clienteVisto < 60000)), n = Object.keys(en.prop).length;
      $('dv-body').innerHTML = `<p class="${on ? 'dlg-ok' : 'dlg-warn'}" role="status"><i data-lucide="${on ? 'circle-check' : 'clock'}"></i>${on ? (pr.length > 1 ? 'Hay ' + pr.length + ' personas conectadas.' : 'El cliente está conectado.') : 'Esperando que el cliente abra el enlace.'}${n ? ' Ha propuesto respuesta en ' + n + (n === 1 ? ' pregunta.' : ' preguntas.') : ''}</p>${pr.length ? '<ul class="dv-pres" aria-label="Personas conectadas">' + pr.map((p) => '<li><strong>' + esc(p.n) + '</strong>' + (p.c ? ' · ' + esc(p.c) : '') + '</li>').join('') + '</ul>' : ''}
<label for="dv-url" class="dlg-l">Enlace para el cliente (envíelo por el chat de la videollamada)</label>
<div class="dlg-url"><input id="dv-url" readonly value="${esc(url)}" onfocus="this.select()"><button class="be be-p" onclick="vivoCopiar()"><i data-lucide="copy"></i>Copiar</button></div><p class="dlg-ok" id="dv-cp" role="status"></p>
<p class="dv-n">Vence el ${fchd(new Date(en.viv.venceEn))} a las ${new Date(en.viv.venceEn).toTimeString().slice(0, 5)}. Al terminarla, el enlace deja de funcionar.</p>
<div class="dlg-act"><button class="be dng" onclick="vivoTerminar()">${confirmaVivo ? 'Confirmar: terminar la reunión en vivo' : 'Terminar la reunión en vivo'}</button></div>`;
    }
    lucide.createIcons();
  }
  window.vivoDlg = () => { if (!en.sid) return; confirmaVivo = false; vivoRender(); const d = $('dlg-vivo'); if (!d.open) d.showModal(); };
  window.vivoCrear = async () => {
    const b = $('dv-go'); if (b) b.disabled = true;
    try {
      const enPregunta = !!document.querySelector('#s2.active'), enRes = !!document.querySelector('#s3.active');
      const datos = { perfil: { nombre: String((en.p && en.p.nombre) || '').slice(0, 200) }, consultor: yoConsultor(), ...vivoEstado(en, enPregunta ? curQ : null, enRes ? 'resultados' : enPregunta ? 'pregunta' : 'pausa') };
      en.viv = await N.vivoCrear(en.sid, datos); vivoOn();
    } catch (e) { $('dv-body').insertAdjacentHTML('afterbegin', '<p class="dlg-warn" role="alert">No se pudo crear el enlace (' + esc(e.code || e.message) + '). Intente de nuevo.</p>'); if (b) b.disabled = false; return; }
    vivoRender();
  };
  window.vivoCopiar = async () => { const i = $('dv-url'), ok = $('dv-cp'); try { await navigator.clipboard.writeText(i.value); ok.textContent = 'Enlace copiado.'; } catch (e) { i.select(); ok.textContent = 'Seleccionado: use Ctrl+C para copiarlo.'; } };
  window.vivoTerminar = async () => {
    if (!confirmaVivo) { confirmaVivo = true; vivoRender(); return; }
    try { await PZ.sincronizarVivo(); await N.pzVivoLimpiar(en.viv.token); if (N.vivoPresentesLimpiar) await N.vivoPresentesLimpiar(en.viv.token); if (N.pzEscribiendoLimpiar) await N.pzEscribiendoLimpiar(en.viv.token); await N.vivoCerrar(en.sid, en.viv.token); } catch (e) { $('dv-body').insertAdjacentHTML('afterbegin', '<p class="dlg-warn" role="alert">No se pudo cerrar (' + esc(e.code || e.message) + ').</p>'); return; }
    if (vivoOff) { vivoOff(); vivoOff = null; }
    if (presOff) { presOff(); presOff = null; } presentes = [];
    PZ.vivo(null); en.viv = null; en.prop = {}; en.clienteVisto = null; confirmaVivo = false; propUI(); vivoBtn(); vivoRender();
  };
  $('dlg-vivo').addEventListener('click', (e) => { if (e.target === $('dlg-vivo')) $('dlg-vivo').close(); });

  arrancar();
})();
