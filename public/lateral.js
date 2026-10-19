/* lateral.js — Menú lateral del consultor (panel de vidrio flotante, con versión colapsada solo con íconos).
   No tiene lógica propia: cada opción llama a las funciones que ya existen (dash, nueva, rq, sr, vivoDlg, pzDlg, metDlg, cmp,
   imprimirDoc, pdf, salir). Solo se muestra con una cuenta de consultor y fuera del ingreso, los avisos y la vista del cliente.
   En pantallas angostas se abre como cajón desde el botón de la barra superior. */
(function () {
  const $ = (id) => document.getElementById(id);
  const LS = 'd360sb';
  const body = document.body;
  let montado = false, previo = '', cuentaAbierta = false;

  const usuario = () => (window.pzUsuario ? window.pzUsuario() : null);
  const pantalla = () => { const s = document.querySelector('.screen.active'); return s ? s.id : ''; };
  const hayCliente = () => typeof modo !== 'undefined' && (modo === 'cliente' || modo === 'invitado');
  const visible = () => !!usuario() && !hayCliente() && !['s0', 'se', 'sv', ''].includes(pantalla());
  const enSesion = () => typeof en !== 'undefined' && !!en.sid && !en.ro && typeof modo !== 'undefined' && modo === 'auditor';
  const tabActual = () => { const b = document.querySelector('.tbtn.active'); return b ? b.dataset.t : ''; };
  const respondidas = () => { try { return en.pg().d; } catch (e) { return 0; } };

  // ── acciones (las mismas que ya tiene la aplicación) ──
  const cerrarCajon = () => { body.classList.remove('sb-abierto'); const b = $('sb-burger'); if (b) b.setAttribute('aria-expanded', 'false'); const v = $('sb-vel'); if (v) v.hidden = true; };
  const irPreguntas = () => { const n = en.nx(); if (n) { ss('s2'); rq(n.id); } else edt(); };
  const irIndice = () => { if (pantalla() !== 's2') irPreguntas(); const p = $('idxp'); if (p && p.hidden) tix(); };
  const irRes = (t) => {
    if (!respondidas()) return;
    if (pantalla() !== 's3') sr();
    const b = $('tab-' + t); if (b) b.click();
  };
  const irPdf = () => { irRes('t1'); setTimeout(() => pdf(), 700); };

  const MENU = [
    { sec: 'Menú', items: [
      { id: 'ses', ic: 'layout-list', t: 'Sesiones', fn: () => dash(), act: () => pantalla() === 'sd' },
      { id: 'new', ic: 'file-plus', t: 'Nueva sesión', fn: () => nueva(), act: () => pantalla() === 's1' && !(typeof en !== 'undefined' && en.sid) },
      { id: 'gui', ic: 'book-open-check', t: 'Guía previa para el cliente', fn: () => guiaDlg(), act: () => false }
    ] },
    { sec: 'sesion', si: enSesion, items: [
      { id: 'preg', ic: 'clipboard-list', t: 'Preguntas', fn: irPreguntas, act: () => pantalla() === 's2', badge: () => { try { const p = en.pg(); return p.d + '/' + p.t; } catch (e) { return ''; } } },
      { id: 'idx', ic: 'list-tree', t: 'Índice de preguntas', fn: irIndice, act: () => false },
      { id: 'res', ic: 'bar-chart-3', t: 'Resultados', fn: () => irRes('t1'), act: () => pantalla() === 's3' && !['t8', 't9', 't11'].includes(tabActual()), off: () => !respondidas() },
      { id: 'hoja', ic: 'route', t: 'Hoja de ruta', fn: () => irRes('t8'), act: () => pantalla() === 's3' && tabActual() === 't8', off: () => !respondidas(), badge: () => { try { const n = respondidas() ? ruta(en).items.length : 0; return n || ''; } catch (e) { return ''; } } },
      { id: 'tab', ic: 'kanban', t: 'Tablero', fn: () => irRes('t11'), act: () => pantalla() === 's3' && tabActual() === 't11', off: () => !respondidas(), badge: () => { try { const r = tarResumen(en); return r.total ? r.hechas + '/' + r.total : ''; } catch (e) { return ''; } } },
      { id: 'evo', ic: 'trending-up', t: 'Evolución', fn: () => irRes('t9'), act: () => pantalla() === 's3' && tabActual() === 't9', off: () => !respondidas(), badge: () => ((en.rv || []).length || '') },
      { id: 'pz', ic: 'messages-square', t: 'Pizarra', fn: () => pzDlg(), act: () => false, badge: () => { const c = document.querySelector('#bpz .pz-cnt'); return c && !c.hidden ? c.textContent.trim() : ''; } },
      { id: 'srv', ic: 'handshake', t: 'Servicio contratado', fn: () => srvDlg(), act: () => false, badge: () => { try { return (window.srvSol || []).length || ''; } catch (e) { return ''; } } },
      { id: 'viv', ic: 'video', t: () => (en.viv ? 'Reunión en vivo' : 'Invitar al cliente'), fn: () => vivoDlg(), act: () => false, punto: () => { if (!en.viv) return ''; const t = (($('bviv-t') || {}).textContent || ''); return /conectad/i.test(t) && !/esperando/i.test(t) ? 'on' : 'espera'; } }
    ] },
    { sec: 'Entregables', si: enSesion, items: [
      { id: 'cmp', ic: 'share-2', t: 'Compartir con el cliente', fn: () => cmp(), act: () => false },
      { id: 'inf', ic: 'file-text', t: 'Informe ejecutivo', fn: () => imprimirDoc('informe'), act: () => false, off: () => !respondidas() },
      { id: 'act', ic: 'notebook-text', t: 'Acta de la reunión', fn: () => imprimirDoc('acta'), act: () => false, off: () => !respondidas() },
      { id: 'pdf', ic: 'download', t: 'Informe técnico (PDF)', fn: irPdf, act: () => false, off: () => !respondidas() },
      { id: 'met', ic: 'calculator', t: 'Cómo se calcula', fn: () => metDlg(), act: () => false }
    ] }
  ];
  const texto = (t) => (typeof t === 'function' ? t() : t);

  function montar() {
    const sb = $('sb'); if (!sb || montado) return;
    sb.innerHTML = `<div class="sb-glow" aria-hidden="true"></div>
<div class="sb-top"><span class="sb-marca"><svg width="34" height="34" viewBox="0 0 300 300" aria-hidden="true"><defs><linearGradient id="sb-ring" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#00B894"/></linearGradient><linearGradient id="sb-ad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#22D3EE"/></linearGradient></defs><circle cx="150" cy="150" r="140" fill="#0A1A33"/><circle cx="150" cy="150" r="140" fill="none" stroke="url(#sb-ring)" stroke-width="9"/><text x="150" y="182" text-anchor="middle" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-weight="800" font-size="118" letter-spacing="-4" fill="url(#sb-ad)">AD</text></svg><span class="sb-nombre">Align<b>Data</b> <small>D360°</small></span></span>
<button type="button" class="sb-colapsar" id="sb-col" aria-label="Contraer el menú" aria-pressed="false"><i data-lucide="panel-left-close"></i></button></div>
<hr class="sb-hr">
<div class="sb-cuenta"><button type="button" class="sb-cuenta-b" id="sb-cb" aria-expanded="false" aria-controls="sb-cm"><span id="sb-av"></span><span class="sb-cuenta-t"><strong id="sb-un"></strong><small>Consultor</small></span><i data-lucide="chevron-down" class="sb-chev"></i></button>
<div class="sb-cuenta-m" id="sb-cm" hidden><span id="sb-um"></span></div></div>
<hr class="sb-hr">
<nav class="sb-nav" aria-label="Menú principal">${MENU.map((g, i) => `<div class="sb-grupo" data-g="${i}">${i ? '<hr class="sb-hr">' : ''}<p class="sb-sec" id="sb-sec-${i}">${g.sec === 'sesion' ? 'Sesión' : g.sec}</p><ul aria-labelledby="sb-sec-${i}">${g.items.map((it) => `<li><button type="button" class="sb-it" data-id="${it.id}"><i data-lucide="${it.ic}"></i><span class="sb-t"></span><span class="sb-b" hidden></span><span class="sb-p" hidden></span></button></li>`).join('')}</ul></div>`).join('')}</nav>
<hr class="sb-hr">
<div class="sb-pie"><button type="button" class="sb-it" id="sb-tour" title="Tour de esta pantalla" aria-label="Tour de esta pantalla"><i data-lucide="compass"></i><span class="sb-t">Tour de esta pantalla</span></button><button type="button" class="sb-it" id="sb-tema" title="Cambiar tema" aria-label="Cambiar tema"><i data-lucide="sun-moon"></i><span class="sb-t">Cambiar tema</span></button><button type="button" class="sb-it sb-salir" id="sb-out" title="Cerrar sesión" aria-label="Cerrar sesión"><i data-lucide="log-out"></i><span class="sb-t">Cerrar sesión</span></button></div>`;
    sb.addEventListener('click', (e) => {
      const b = e.target.closest('.sb-it[data-id]'); if (!b || b.disabled) return;
      const it = MENU.flatMap((g) => g.items).find((x) => x.id === b.dataset.id); if (!it) return;
      cerrarCajon(); it.fn(); setTimeout(actualizar, 60);
    });
    $('sb-tour').addEventListener('click', () => { cerrarCajon(); if (window.tourIniciar) setTimeout(() => window.tourIniciar(null, true), 320); });
    $('sb-tema').addEventListener('click', () => { const t = $('theme-btn'); if (t) t.click(); });
    $('sb-out').addEventListener('click', () => { cerrarCajon(); if (window.salir) window.salir(); });
    $('sb-col').addEventListener('click', () => fijarMini(!body.classList.contains('sb-mini')));
    $('sb-cb').addEventListener('click', () => { cuentaAbierta = !cuentaAbierta; $('sb-cm').hidden = !cuentaAbierta; $('sb-cb').setAttribute('aria-expanded', String(cuentaAbierta)); });
    const bu = $('sb-burger'), ve = $('sb-vel');
    if (bu) bu.addEventListener('click', () => { const a = !body.classList.contains('sb-abierto'); body.classList.toggle('sb-abierto', a); bu.setAttribute('aria-expanded', String(a)); if (ve) ve.hidden = !a; if (a) { const p = sb.querySelector('.sb-it'); if (p) p.focus(); } });
    if (ve) ve.addEventListener('click', cerrarCajon);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('sb-abierto')) { cerrarCajon(); if (bu) bu.focus(); } });
    let m = null; try { m = localStorage.getItem(LS); } catch (e) { /* sin almacenamiento */ }
    fijarMini(m === 'mini', true);
    montado = true;
    if (window.lucide) lucide.createIcons();
  }

  function fijarMini(v, sinGuardar) {
    body.classList.toggle('sb-mini', !!v);
    const c = $('sb-col'); if (c) { c.setAttribute('aria-pressed', String(!!v)); c.setAttribute('aria-label', v ? 'Expandir el menú' : 'Contraer el menú'); const i = c.querySelector('[data-lucide],svg'); if (i && window.lucide) { c.innerHTML = '<i data-lucide="' + (v ? 'panel-left-open' : 'panel-left-close') + '"></i>'; lucide.createIcons(); } }
    if (!sinGuardar) { try { localStorage.setItem(LS, v ? 'mini' : 'full'); } catch (e) { /* sin almacenamiento */ } }
  }

  function actualizar() {
    const sb = $('sb'); if (!sb) return;
    const v = visible();
    body.classList.toggle('con-sb', v);
    sb.hidden = !v;
    const bu = $('sb-burger'); if (bu) bu.hidden = !v;
    if (!v) { cerrarCajon(); return; }
    if (!montado) montar();
    const u = usuario() || {}, nom = u.nombre || u.email || 'Consultor';
    const clave = JSON.stringify([nom, u.foto, u.email, pantalla(), tabActual(), enSesion(), respondidas(), (typeof en !== 'undefined' && en.viv) ? 1 : 0, (typeof en !== 'undefined' && (en.rv || []).length), ($('bviv-t') || {}).textContent, (document.querySelector('#bpz .pz-cnt') || {}).textContent, (typeof en !== 'undefined' && en.p && en.p.nombre), (window.srvSol || []).length]);
    if (clave === previo) return;
    previo = clave;
    $('sb-un').textContent = nom; $('sb-um').textContent = u.email || '';
    // dónde está el consultor, en la barra superior
    const emp = (typeof en !== 'undefined' && en.p && en.p.nombre) || '', pa = pantalla();
    const cx = pa === 'sd' ? ['Panel del consultor', 'Sesiones de diagnóstico'] : pa === 's1' ? ['Nueva sesión', 'Datos de la empresa'] : pa === 's2' ? ['Sesión · ' + emp, 'Preguntas'] : pa === 's3' ? ['Sesión · ' + emp, 'Resultados'] : ['', ''];
    if ($('tb-ctx-s')) { $('tb-ctx-s').textContent = cx[0]; $('tb-ctx-t').textContent = cx[1]; }
    $('sb-av').innerHTML = (window.avatarHtml ? avatarHtml(nom, u.foto) : '');
    const ses = enSesion();
    sb.querySelectorAll('.sb-grupo').forEach((g, i) => {
      const grp = MENU[i]; g.hidden = !!(grp.si && !grp.si());
      const sec = $('sb-sec-' + i); if (sec && grp.sec === 'sesion') sec.textContent = 'Sesión · ' + ((typeof en !== 'undefined' && en.p && en.p.nombre) || '');
    });
    MENU.forEach((g) => g.items.forEach((it) => {
      const b = sb.querySelector('.sb-it[data-id="' + it.id + '"]'); if (!b) return;
      if (g.si && !g.si()) return;
      const t = texto(it.t); b.querySelector('.sb-t').textContent = t; b.title = t; b.setAttribute('aria-label', t);
      const act = !!it.act(); b.classList.toggle('on', act); if (act) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      const off = !!(it.off && it.off()); b.disabled = off; b.classList.toggle('off', off);
      const bd = b.querySelector('.sb-b'), pu = b.querySelector('.sb-p'), val = it.badge ? it.badge() : '', pt = it.punto ? it.punto() : '';
      bd.hidden = !val; bd.textContent = val; pu.hidden = !pt; pu.className = 'sb-p' + (pt ? ' ' + pt : ''); pu.title = pt === 'on' ? 'Cliente conectado' : pt ? 'Esperando al cliente' : '';
    }));
    if (window.lucide) lucide.createIcons();
  }

  window.sbActualizar = actualizar;
  setInterval(actualizar, 1500);
  actualizar();
})();
