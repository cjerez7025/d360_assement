/* Sesiones guardadas del D360°.
   · Consultor: inicia sesión con Google, ve sus sesiones, conduce la reunión (navega las preguntas y
     registra las respuestas, que se guardan solas) y publica un enlace con los resultados.
   · Cliente: abre el enlace y ve sus resultados en modo lectura.
   Usa las variables de app.js (en, modo, Nube, rq, sr, ss, esc, lbl, fchd). Sin firebase-config.js no hace nada. */
(function () {
  if (!window.D360_NUBE) return;
  const $ = (id) => document.getElementById(id);
  const P = new URLSearchParams(location.search);
  const MOCK = P.get('mock') === '1' && location.hostname === 'localhost';
  let N = null, user = null, desub = null, lista = [], act = null, confirmaRev = false;
  const ms = (t) => (t && t.toMillis ? t.toMillis() : typeof t === 'number' ? t : null);

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
  solo('se'); $('se-t').textContent = 'Cargando…'; // evita mostrar la portada antigua mientras se decide la vista
  async function arrancar() {
    document.body.classList.add('nube');
    try { N = await import(MOCK ? './dev/nube-mock.js' : './nube.js'); }
    catch (e) { msg('No se pudo conectar', 'El servicio de sesiones no está disponible. Revise su conexión e intente de nuevo.', [['Reintentar', () => location.reload()]]); return; }
    const tk = P.get('r');
    if (tk) return cliente(tk);
    modo = 'auditor'; Nube = N; N.iniciar({ persistente: true });
    N.alCambiarUsuario((u) => { user = u; if (u) entrar(); else fuera(); });
  }

  // ── cliente: resultados en modo lectura ──
  async function cliente(tk) {
    modo = 'cliente'; document.body.classList.add('cliente'); N.iniciar({ persistente: false });
    const invalido = () => msg('Enlace no disponible', 'Este enlace no existe o fue desactivado por quien lo compartió. Pida a su consultor de AlignData que le envíe uno nuevo.');
    if (!/^[A-Za-z0-9_-]{32}$/.test(tk)) return invalido();
    msg('Cargando sus resultados…', '');
    try {
      const d = await N.leerCompartido(tk);
      if (!d) return invalido();
      en.rs(); en.ro = true; en.cargar(d); en.pubEn = ms(d.publicadoEn);
      sr();
    } catch (e) { invalido(); }
  }

  // ── consultor: acceso ──
  function fuera() {
    $('uchip').hidden = true; $('saveind').hidden = true; if (desub) { desub(); desub = null; }
    en.rs(); lista = []; ss('s0');
  }
  function noAutorizado() {
    msg('Cuenta no autorizada', 'La cuenta ' + (user ? user.email : '') + ' no tiene permiso para conducir sesiones D360°. Pida a AlignData que la autorice o ingrese con otra cuenta.', [['Cerrar sesión', () => window.salir()]]);
  }
  function entrar() {
    $('uchip').hidden = false; $('uemail').textContent = user.email;
    if (desub) desub();
    desub = N.escucharSesiones((s) => {
      lista = s;
      if ($('sd').classList.contains('active')) renderDash();
      if ($('dlg').open) dlgRender();
    }, (e) => { if (e && e.code === 'permission-denied') noAutorizado(); else msg('No se pudieron cargar las sesiones', 'Intente de nuevo en unos minutos.', [['Reintentar', () => location.reload()]]); });
    if (!en.sid) window.dash();
  }
  $('btn-login').onclick = async () => {
    const er = $('lerr'); er.classList.remove('show');
    try { await N.ingresar(); }
    catch (e) { er.querySelector('span').textContent = 'No se pudo iniciar sesión (' + (e.code || e.message) + '). Intente de nuevo.'; er.classList.add('show'); }
  };
  window.salir = async () => { try { await N.salir(); } finally { location.reload(); } };

  // ── consultor: panel de sesiones ──
  const estado = (s) => (s.compartido ? (cambios(s) ? 'cambios' : 'compartida') : s.estado === 'completa' ? 'completa' : 'en_curso');
  function cambios(s) { const c = s.compartido && ms(s.compartido.en), a = ms(s.actualizadoEn); return !!(c && a && a > c + 1500); }
  const CHIP = { en_curso: ['lvn', 'En curso'], completa: ['lv3', 'Completa'], compartida: ['lv4', 'Compartida con el cliente'], cambios: ['lv2', 'Cambios sin publicar'] };
  const nivelDe = (s) => (s.puntaje != null ? en.ml(s.puntaje).n : 'x');
  function tarjeta(s) {
    const e = estado(s), [k, t] = CHIP[e], p = s.perfil || {}, av = s.avance || 0;
    const niv = s.puntaje != null ? en.ml(s.puntaje).nm : null;
    return `<article class="sc ${k} nv${nivelDe(s)}" data-id="${s.id}"><div class="sc-top"><h3>${esc(p.nombre || 'Sin nombre')}</h3><span class="pill">${t}</span></div>
<p class="sc-meta">${esc(lbl('f2', p.sector))} · ${esc(lbl('f3', p['tamaño']))}${p.contacto ? ' · Contacto: ' + esc(p.contacto) : ''}</p>
<div class="mtr" role="img" aria-label="Avance ${av}%"><i style="width:${av}%"></i></div>
<div class="sc-stats"><span>${s.hechas || 0} de ${s.total || '—'} respondidas</span><span>${s.puntaje != null ? '<span class="sc-lv"><b>' + s.puntaje + '%</b> ' + esc(niv) + '</span>' : 'Sin puntaje aún'}</span></div>
<p class="sc-foot">Actualizada ${rel(ms(s.actualizadoEn))}${s.actualizadoPor ? ' por ' + esc(s.actualizadoPor) : ''}</p>
<div class="sc-act"><button class="be be-p" onclick="abrirSes('${s.id}')"><i data-lucide="play"></i>${s.estado === 'completa' ? 'Abrir' : 'Continuar'}</button><button class="be" onclick="resSes('${s.id}')"><i data-lucide="bar-chart-3"></i>Resultados</button><button class="be" onclick="cmpSes('${s.id}')"><i data-lucide="share-2"></i>Compartir</button></div></article>`;
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
    en.rs(); cs = null; act = null; $('saveind').hidden = true;
    ss('sd'); renderDash();
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
    ss('s2'); rq(en.ga()[0].id);
  };
  async function cargar(id) {
    let d = null;
    try { d = await N.leer(id); } catch (e) { d = null; }
    d = d || lista.find((s) => s.id === id);
    if (!d) { msg('No se encontró la sesión', 'Puede que otra persona la haya eliminado.', [['Volver a las sesiones', () => window.dash()]]); throw new Error('sin sesión'); }
    en.rs(); en.cargar(d); en.sid = id; modo = 'auditor'; act = { id, compartido: d.compartido || null };
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
  const enlace = (tk) => location.origin + location.pathname + '?r=' + tk + (MOCK ? '&mock=1' : '');
  window.cmp = function () { confirmaRev = false; dlgRender(); const d = $('dlg'); if (!d.open) d.showModal(); };
  function dlgRender() {
    const s = lista.find((x) => x.id === act.id), c = (s && s.compartido) || act.compartido, tk = c && c.token;
    const p = en.pub().perfil, r = en.res();
    const parcial = r.completa ? '' : `<p class="dlg-warn"><i data-lucide="triangle-alert"></i>La sesión tiene ${r.hechas} de ${r.total} preguntas respondidas: los resultados serán parciales.</p>`;
    let h;
    if (!tk) {
      h = `<p>Quien reciba el enlace verá los resultados de <strong>${esc(p.nombre)}</strong> en modo lectura. No verá sus notas de la reunión ni podrá modificar las respuestas.</p>${parcial}<div class="dlg-act"><button class="be be-p" id="dlg-pub" onclick="pub()"><i data-lucide="link"></i>Publicar y crear enlace</button></div>`;
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
      const tk = await N.compartir(act.id, en.pub(), act.compartido && act.compartido.token);
      act.compartido = { token: tk, en: Date.now() };
    } catch (e) { $('dlg-body').insertAdjacentHTML('afterbegin', '<p class="dlg-warn" role="alert">No se pudo publicar (' + esc(e.code || e.message) + '). Intente de nuevo.</p>'); if (b) b.disabled = false; return; }
    dlgRender();
  };
  window.rev = async function () {
    if (!confirmaRev) { confirmaRev = true; dlgRender(); return; }
    try { await N.revocar(act.id, act.compartido.token); act.compartido = null; confirmaRev = false; } catch (e) { $('dlg-body').insertAdjacentHTML('afterbegin', '<p class="dlg-warn" role="alert">No se pudo revocar (' + esc(e.code || e.message) + ').</p>'); return; }
    const s = lista.find((x) => x.id === act.id); if (s) s.compartido = null;
    dlgRender();
  };
  window.cpy = async function () {
    const i = $('dlg-url'), ok = $('dlg-cp');
    try { await navigator.clipboard.writeText(i.value); ok.textContent = 'Enlace copiado.'; }
    catch (e) { i.select(); ok.textContent = 'Seleccionado: use Ctrl+C para copiarlo.'; }
  };
  $('dlg').addEventListener('click', (e) => { if (e.target === $('dlg')) $('dlg').close(); }); // clic fuera = cerrar

  arrancar();
})();
