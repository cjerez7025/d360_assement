/* Pizarra compartida del D360°.
   El consultor y los integrantes del cliente escriben comentarios (y adjuntan imágenes) que ven todos, con el nombre de
   quien los escribió. Hay un hilo por pregunta y una pizarra general. Los comentarios no se editan; el consultor puede
   borrarlos. Lo que se escribe queda en la sesión y se publica con los resultados.
   Las funciones puras (validar, agrupar, dibujar un comentario) están en app.js; los datos, en nube.js / nube-prueba.js
   (pz*). Aquí vive la pantalla: montar el hilo en una pregunta, el diálogo de la pizarra general, la ampliación de
   imágenes y la identificación de los clientes. Usa esc, pzValidar, pzTarjeta, pzHtml, pzCuando de app.js. */
(function () {
  const $ = (id) => document.getElementById(id);
  const ahora = () => Date.now();
  const LS = 'd360persona';

  const PZS = window.PZ = {
    entries: [], N: null, rol: null, sid: null, tk: null, vivoTk: null,
    vistas: [], borr: {}, ids: new Set(), espejando: new Set(), off: null, offVivo: null, foco: null, persona: null
  };

  const guardado = () => { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } };
  PZS.persona = guardado();

  // ───────── datos ─────────
  function contadores() {
    const n = PZS.entries.length;
    document.querySelectorAll('.pz-cnt').forEach((e) => { e.textContent = n ? String(n) : ''; e.hidden = !n; });
  }
  function fijar(lista) {
    PZS.entries = lista; PZS.ids = new Set(lista.map((x) => x.id));
    PZS.vistas = PZS.vistas.filter((v) => document.body.contains(v.el));
    PZS.vistas.forEach((v) => v.pintar());
    contadores();
  }
  PZS.parar = function () {
    if (PZS.off) { PZS.off(); PZS.off = null; }
    if (PZS.offVivo) { PZS.offVivo(); PZS.offVivo = null; }
    PZS.rol = null; PZS.sid = null; PZS.tk = null; PZS.vivoTk = null; fijar([]);
  };
  /** Consultor: abre la pizarra permanente de una sesión. */
  PZS.abrirSesion = async function (N, sid) {
    PZS.parar(); PZS.N = N; PZS.rol = 'consultor'; PZS.sid = sid;
    try { fijar(await N.pzLeer(sid)); } catch (e) { fijar([]); }
    PZS.off = N.pzEscuchar(sid, fijar, () => {});
  };
  /** Consultor: durante la reunión en vivo, copia a la sesión lo que escriben los clientes (conservando autor y hora). */
  PZS.vivo = function (tk) {
    if (PZS.offVivo) { PZS.offVivo(); PZS.offVivo = null; }
    PZS.vivoTk = tk || null;
    if (!tk || !PZS.N || PZS.rol !== 'consultor') return;
    PZS.offVivo = PZS.N.pzVivoEscuchar(tk, (lista) => lista.forEach(espejar), () => {});
  };
  function espejar(e) {
    if (e.rol !== 'cliente' || PZS.ids.has(e.id) || PZS.espejando.has(e.id) || !PZS.sid) return Promise.resolve();
    PZS.espejando.add(e.id);
    // el contenido de los documentos se copia antes que el comentario (así nunca queda un comentario sin su archivo)
    const partes = e.adjuntos && e.adjuntos.length && PZS.vivoTk ? PZS.N.pzCopiarPartes(['vivo', PZS.vivoTk], ['ses', PZS.sid], e) : Promise.resolve();
    return partes.then(() => PZS.N.pzEspejar(PZS.sid, e)).catch(() => PZS.espejando.delete(e.id));
  }
  /** Antes de cerrar la reunión: asegura que todo lo que escribieron los clientes quedó en la sesión. */
  PZS.sincronizarVivo = async function () {
    if (!PZS.vivoTk || !PZS.N) return;
    const lista = await PZS.N.pzVivoLeer(PZS.vivoTk);
    await Promise.all(lista.map(espejar));
  };
  /** Cliente en la reunión en vivo. */
  PZS.cliente = function (N, tk) {
    PZS.parar(); PZS.N = N; PZS.rol = 'cliente'; PZS.tk = tk;
    PZS.off = N.pzVivoEscuchar(tk, fijar, () => {});
  };
  /** Cliente en sus resultados: solo lectura. */
  PZS.lectura = function (lista, ctk, N) { PZS.parar(); PZS.N = N || PZS.N; PZS.rol = 'lectura'; PZS.ctk = ctk || null; fijar(lista || []); };
  PZS.ultimo = () => PZS.entries.reduce((m, e) => Math.max(m, e.creadoEn || 0), 0);

  function autor() {
    if (PZS.rol === 'consultor') {
      const u = (window.pzUsuario && window.pzUsuario()) || {};
      return { autor: String(u.nombre || u.email || 'Consultor').slice(0, 60), rol: 'consultor', email: u.email, foto: avFoto(u.foto) || undefined };
    }
    const p = PZS.persona || {};
    return { autor: String(p.n || '').slice(0, 60), rol: 'cliente', cargo: p.c ? String(p.c).slice(0, 60) : undefined };
  }
  function nuevoId() {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', b = crypto.getRandomValues(new Uint8Array(20));
    return Array.from(b, (x) => A[x % 62]).join('');
  }
  // ───────── documentos adjuntos: se parten en trozos y se suben antes del comentario ─────────
  const ACEPTA = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.csv,.txt,.rtf,.zip';
  const leerBase64 = (f) => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => ko(r.error); r.readAsDataURL(f); });
  function destinosPartes() {
    if (PZS.rol === 'consultor') return [['ses', PZS.sid]].concat(PZS.vivoTk && typeof en !== 'undefined' && en.viv ? [['vivo', PZS.vivoTk]] : []);
    return [['vivo', PZS.tk]];
  }
  async function subirPartes(c, docs, progreso) {
    const dest = destinosPartes(), total = docs.reduce((t, d) => t + d.partes.length, 0) * dest.length;
    let hechas = 0; progreso(0, total);
    for (let i = 0; i < docs.length; i++) for (let k = 0; k < docs[i].partes.length; k++) for (const [amb, clave] of dest) {
      await PZS.N.pzSubirParte(amb, clave, c.id, i + '_' + k, docs[i].partes[k]); progreso(++hechas, total);
    }
  }
  const leerParte = (e, pid) => {
    const [amb, clave] = PZS.rol === 'consultor' ? ['ses', PZS.sid] : PZS.rol === 'cliente' ? ['vivo', PZS.tk] : ['comp', PZS.ctk];
    return PZS.N.pzLeerParte(amb, clave, e.id, pid);
  };
  async function descargar(btn) {
    const e = PZS.entries.find((x) => x.id === btn.dataset.e), a = e && (e.adjuntos || [])[+btn.dataset.i], li = btn.closest('li');
    if (!a || !pzAdjOk(a)) return;
    const quitar = () => { const m = li && li.querySelector('.pz-fe'); if (m) m.remove(); };
    quitar(); btn.disabled = true; btn.classList.add('pz-cargando');
    try {
      let b64 = ''; for (let k = 0; k < a.p; k++) b64 += await leerParte(e, btn.dataset.i + '_' + k);
      const crudo = await (await fetch('data:application/octet-stream;base64,' + b64)).blob();
      if (crudo.size !== a.z) throw new Error('tamaño distinto');
      const url = URL.createObjectURL(new Blob([crudo], { type: PZ_EXT[pzExt(a.n)] || 'application/octet-stream' }));
      const l = document.createElement('a'); l.href = url; l.download = pzNombreSeguro(a.n); document.body.appendChild(l); l.click(); l.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (x) {
      if (li) li.insertAdjacentHTML('beforeend', '<p class="pz-fe" role="alert">No se pudo descargar el documento' + (x && x.message === 'parte faltante' ? ' (todavía se está guardando o fue retirado)' : '') + '. Intente de nuevo en unos segundos.</p>');
    } finally { btn.disabled = false; btn.classList.remove('pz-cargando'); }
  }

  function enviar(e) {
    if (PZS.rol === 'consultor') return PZS.N.pzGuardar(PZS.sid, e, PZS.vivoTk && typeof en !== 'undefined' && en.viv ? PZS.vivoTk : null);
    if (PZS.rol === 'cliente') return PZS.N.pzVivoGuardar(PZS.tk, e);
    return Promise.reject(new Error('solo lectura'));
  }

  // ───────── imágenes: se reducen en el navegador (JPEG ≤ ~200 KB) para guardarlas junto al comentario ─────────
  async function comprimir(file) {
    if (!/^image\//.test(file.type)) throw new Error('formato');
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('formato')); i.src = url; });
      let lado = 1400, calidad = 0.78;
      for (let k = 0; k < 9; k++) {
        const f = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth * f)); c.height = Math.max(1, Math.round(img.naturalHeight * f));
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        const d = c.toDataURL('image/jpeg', calidad);
        if (d.length <= 200000) return d;
        if (calidad > 0.5) calidad -= 0.1; else lado = Math.round(lado * 0.8);
      }
      throw new Error('grande');
    } finally { URL.revokeObjectURL(url); }
  }

  // ───────── hilo en pantalla ─────────
  let seq = 0;
  /** Guarda dónde estaba el cursor antes de que la pantalla se redibuje (para no interrumpir a quien escribe). */
  window.pzAntes = function () {
    const a = document.activeElement;
    PZS.foco = a && a.classList && a.classList.contains('pz-x') ? { clave: a.dataset.clave, ini: a.selectionStart, fin: a.selectionEnd } : null;
  };
  window.pzMontar = function (slot, qid, op) {
    op = op || {};
    const el = typeof slot === 'string' ? $(slot) : slot; if (!el) return;
    const n = ++seq, clave = op.clave || qid, lectura = PZS.rol === 'lectura' || !PZS.rol;
    const borr = PZS.borr[clave] = PZS.borr[clave] || { texto: '', imgs: [], docs: [] }; borr.docs = borr.docs || [];
    el.innerHTML = `<section class="pz${op.todas ? ' pz-dlg' : ''}" aria-labelledby="pzt${n}">
<div class="pz-top"><h3 id="pzt${n}"><i data-lucide="messages-square"></i> ${op.todas ? 'Pizarra de la reunión' : 'Pizarra de esta pregunta'}</h3><span class="pz-sub">Lo que se escribe aquí lo ven todos los participantes</span></div>
<div class="pz-l" id="pzl${n}" aria-live="polite" aria-label="Comentarios"></div>
${lectura ? '' : `<form class="pz-f" id="pzf${n}" novalidate>
<label class="sr-only" for="pzx${n}">Escriba un comentario para todos los participantes</label>
<textarea class="pz-x" id="pzx${n}" data-clave="${esc(clave)}" rows="2" maxlength="2000" placeholder="${op.todas ? 'Comentario general de la reunión…' : 'Escriba un comentario, una duda o un acuerdo…'}"></textarea>
<div class="pz-prev" id="pzp${n}"></div>
<p class="pz-err" id="pze${n}" role="alert" hidden></p>
<div class="pz-acc"><span class="pz-como" id="pzo${n}"></span>
<button type="button" class="pz-b pz-adj" id="pza${n}"><i data-lucide="paperclip"></i> Adjuntar</button><input type="file" accept="${ACEPTA}" multiple hidden id="pzi${n}">
<button type="submit" class="pz-b pz-send" id="pzs${n}"><i data-lucide="send"></i> Publicar</button></div>
<div class="pz-prog" id="pzg${n}" role="status" hidden><progress max="100" value="0"></progress><span></span></div>
<p class="pz-ayuda">Ctrl + Enter publica. Puede <strong>pegar con Ctrl + V</strong> (captura de pantalla o archivo copiado), arrastrar o adjuntar: imágenes y documentos PDF, Word, Excel, PowerPoint, CSV o ZIP (hasta 3 de cada uno; documentos de hasta 5 MB).</p></form>`}
</section>`;
    const lista = $('pzl' + n);
    const vista = {
      el, qid, clave, n,
      pintar() {
        const antes = lista.scrollHeight - lista.clientHeight - lista.scrollTop < 48, prev = lista.querySelectorAll('[data-e]').length;
        const es = op.todas ? PZS.entries : PZS.entries.filter((e) => e.qid === qid), borrar = PZS.rol === 'consultor';
        lista.innerHTML = !es.length ? `<p class="pz-vacio">${op.todas ? 'Todavía no hay comentarios en la reunión.' : 'Todavía no hay comentarios en esta pregunta.'}${lectura ? '' : ' Sea el primero en escribir.'}</p>`
          : op.todas ? pzHtml(es, { borrar }) : `<ol class="pz-ol">${es.map((e) => pzTarjeta(e, { borrar })).join('')}</ol>`;
        lucide.createIcons();
        if (!op.todas && (antes || es.length > prev)) lista.scrollTop = lista.scrollHeight;
      }
    };
    PZS.vistas = PZS.vistas.filter((v) => document.body.contains(v.el)); PZS.vistas.push(vista); vista.pintar();
    if (lectura) { lucide.createIcons(); return; }
    // ── formulario ──
    const f = $('pzf' + n), ta = $('pzx' + n), err = $('pze' + n), prev = $('pzp' + n), file = $('pzi' + n), como = $('pzo' + n), prog = $('pzg' + n), enviarBtn = $('pzs' + n);
    const mostrarError = (t) => { err.textContent = t || ''; err.hidden = !t; };
    const quien = () => { const a = autor(); como.innerHTML = a.autor ? 'Comentando como <strong>' + esc(a.autor) + '</strong>' + (PZS.rol === 'cliente' ? ' · <button type="button" class="pz-cambiar">cambiar</button>' : '') : ''; };
    const pintarPrev = () => {
      prev.innerHTML = borr.imgs.map((s, i) => `<span class="pz-pv"><img src="${s}" alt="Imagen ${i + 1} para adjuntar"><button type="button" class="pz-quitar" data-i="${i}" aria-label="Quitar la imagen ${i + 1}">×</button></span>`).join('')
        + borr.docs.map((d, i) => `<span class="pz-fp"><i data-lucide="${PZ_ICONO[pzExt(d.nombre)] || 'file'}"></i><span class="pz-fn">${esc(d.nombre)}</span><small>${pzTam(d.z)}</small><button type="button" class="pz-quitar-doc" data-i="${i}" aria-label="Quitar el documento ${esc(d.nombre)}">×</button></span>`).join('');
      $('pza' + n).disabled = borr.imgs.length >= 3 && borr.docs.length >= PZ_ADJ.maxArchivos;
      lucide.createIcons();
    };
    vista.quien = quien; // para refrescar «Comentando como…» cuando el cliente termina de escribir su nombre
    ta.value = borr.texto; pintarPrev(); quien();
    ta.addEventListener('input', () => { borr.texto = ta.value; mostrarError(''); });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); f.requestSubmit(); } });
    prev.addEventListener('click', (e) => { const b = e.target.closest('.pz-quitar'), d = e.target.closest('.pz-quitar-doc'); if (b) { borr.imgs.splice(+b.dataset.i, 1); pintarPrev(); } else if (d) { borr.docs.splice(+d.dataset.i, 1); pintarPrev(); } });
    como.addEventListener('click', (e) => { if (e.target.closest('.pz-cambiar')) PZS.pedirPersona(true).then(quien); });
    const agregarImagenes = async (imgs) => {
      const libres = 3 - borr.imgs.length;
      if (libres <= 0) return mostrarError('Máximo 3 imágenes por comentario.');
      if (imgs.length > libres) mostrarError('Solo caben ' + libres + ' imagen' + (libres === 1 ? '' : 'es') + ' más; se agregaron las primeras.');
      for (const a of imgs.slice(0, libres)) {
        try { borr.imgs.push(await comprimir(a)); }
        catch (x) { mostrarError(x.message === 'grande' ? 'La imagen es demasiado grande incluso reducida.' : 'No se pudo leer «' + a.name + '». Use JPG, PNG o WebP.'); }
      }
    };
    const agregarDocumentos = async (docs) => {
      for (const a of docs) {
        if (borr.docs.length >= PZ_ADJ.maxArchivos) { mostrarError('Máximo ' + PZ_ADJ.maxArchivos + ' documentos por comentario.'); break; }
        if (a.size > PZ_ADJ.max) { mostrarError('«' + a.name + '» pesa ' + pzTam(a.size) + ': el máximo es 5 MB por documento.'); continue; }
        if (!a.size) { mostrarError('«' + a.name + '» está vacío.'); continue; }
        const motivo = pzTipoAdj(a.name, new Uint8Array(await a.slice(0, 8).arrayBuffer()));
        if (motivo) { mostrarError(motivo); continue; }
        try {
          const b64 = await leerBase64(a), partes = [];
          for (let i = 0; i < b64.length; i += PZ_ADJ.trozo) partes.push(b64.slice(i, i + PZ_ADJ.trozo));
          if (partes.length !== pzPartes(a.size)) throw new Error('partes');
          borr.docs.push({ nombre: pzNombreSeguro(a.name), t: PZ_EXT[pzExt(a.name)], z: a.size, partes });
        } catch (x) { mostrarError('No se pudo leer «' + a.name + '».'); }
      }
    };
    // acepta archivos de cualquier origen (selector, arrastre o pegado): imágenes → comprimidas; documentos → en partes
    const agregar = async (archivos) => {
      mostrarError(''); const todos = [...archivos], imgs = todos.filter((a) => /^image\//.test(a.type)), docs = todos.filter((a) => !/^image\//.test(a.type));
      if (!todos.length) return;
      $('pza' + n).disabled = true; ta.setAttribute('aria-busy', 'true');
      await agregarImagenes(imgs); await agregarDocumentos(docs);
      ta.removeAttribute('aria-busy'); pintarPrev();
    };
    vista.agregarArchivos = agregar;
    $('pza' + n).addEventListener('click', () => file.click());
    file.addEventListener('change', () => { agregar(file.files); file.value = ''; });
    ['dragover', 'dragenter'].forEach((t) => f.addEventListener(t, (e) => { if ([...(e.dataTransfer ? e.dataTransfer.types : [])].includes('Files')) { e.preventDefault(); f.classList.add('pz-arrastre'); } }));
    ['dragleave', 'drop'].forEach((t) => f.addEventListener(t, () => f.classList.remove('pz-arrastre')));
    f.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); agregar(e.dataTransfer.files); } });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (f.dataset.ocupado) return;
      const a = autor();
      if (PZS.rol === 'cliente' && !a.autor) { await PZS.pedirPersona(true); quien(); return; }
      const docs = [...borr.docs];
      const c = { id: nuevoId(), ...a, qid: op.todas ? 'general' : qid, texto: ta.value.trim(), imgs: [...borr.imgs], creadoEn: ahora() };
      if (docs.length) c.adjuntos = docs.map((d) => ({ n: d.nombre, t: d.t, z: d.z, p: d.partes.length }));
      if (!c.cargo) delete c.cargo; if (!c.email) delete c.email; if (!c.foto) delete c.foto;
      const motivo = pzValidar(c); if (motivo) return mostrarError(motivo);
      mostrarError('');
      const limpiar = () => { borr.texto = ''; borr.imgs = []; borr.docs = []; ta.value = ''; pintarPrev(); ta.focus(); };
      const restaurar = (x) => {
        borr.texto = c.texto; borr.imgs = c.imgs; borr.docs = docs; if (document.body.contains(ta)) { ta.value = c.texto; pintarPrev(); }
        mostrarError('No se pudo publicar el comentario (' + (x && (x.code || x.message) || 'error') + '). Su texto y sus archivos se conservaron: intente de nuevo.');
      };
      // los documentos se suben primero (con barra de avance); el comentario aparece cuando están completos
      if (docs.length) {
        f.dataset.ocupado = '1'; enviarBtn.disabled = true; $('pza' + n).disabled = true; prog.hidden = false;
        try { await subirPartes(c, docs, (h, t) => { const p = t ? Math.round(h / t * 100) : 100; prog.querySelector('progress').value = p; prog.querySelector('span').textContent = 'Subiendo documentos… ' + p + '%'; }); }
        catch (x) { restaurar(x); prog.hidden = true; delete f.dataset.ocupado; enviarBtn.disabled = false; pintarPrev(); return; }
        prog.hidden = true; delete f.dataset.ocupado; enviarBtn.disabled = false;
      }
      limpiar();
      // no se espera la confirmación del servidor: el comentario aparece al instante y, si fallara, se avisa
      Promise.resolve().then(() => enviar(c)).catch(restaurar);
    });
    if (PZS.foco && PZS.foco.clave === clave) { ta.focus({ preventScroll: true }); try { ta.setSelectionRange(PZS.foco.ini, PZS.foco.fin); } catch (e) { /* sin selección */ } PZS.foco = null; }
    lucide.createIcons();
  };

  // ───────── pizarra general (diálogo) ─────────
  window.pzDlg = function () {
    const d = $('dlg-pz'); if (!d) return;
    window.pzAntes();
    window.pzMontar('pz-dlg-slot', 'general', { todas: true, clave: 'dlg' });
    if (!d.open) d.showModal();
  };
  $('dlg-pz') && $('dlg-pz').addEventListener('click', (e) => { if (e.target === $('dlg-pz')) $('dlg-pz').close(); });
  /** Botón «Pizarra» con contador (para pantallas que se redibujan, como la del cliente). */
  PZS.boton = () => `<button type="button" class="lb-btn" onclick="pzDlg()"><i data-lucide="messages-square"></i> Pizarra <span class="pz-cnt"${PZS.entries.length ? '' : ' hidden'}>${PZS.entries.length || ''}</span></button>`;

  // ───────── imágenes ampliadas y borrado ─────────
  document.addEventListener('click', (e) => {
    const th = e.target.closest && e.target.closest('.pz-th');
    if (th) {
      const c = PZS.entries.find((x) => x.id === th.dataset.e), im = c ? (c.imgs || []).filter((s) => PZ_IMG.test(s)) : [];
      const d = $('dlg-img'); if (!c || !im[+th.dataset.i] || !d) return;
      $('dlg-img-i').src = im[+th.dataset.i]; $('dlg-img-i').alt = 'Imagen adjunta por ' + c.autor;
      $('dlg-img-t').textContent = 'Imagen de ' + c.autor + ' · ' + pzCuando(c.creadoEn);
      d.showModal(); return;
    }
    const fb = e.target.closest && e.target.closest('.pz-file');
    if (fb) { descargar(fb); return; }
    const del = e.target.closest && e.target.closest('.pz-del');
    if (del) {
      if (del.dataset.c !== '1') { del.dataset.c = '1'; del.classList.add('pz-conf'); del.querySelector('span').textContent = 'Confirmar'; setTimeout(() => { del.dataset.c = ''; del.classList.remove('pz-conf'); const s = del.querySelector('span'); if (s) s.textContent = 'Eliminar'; }, 4000); return; }
      del.disabled = true;
      const ent = PZS.entries.find((x) => x.id === del.dataset.e); if (!ent) { del.disabled = false; return; }
      PZS.N.pzBorrar(PZS.sid, ent, PZS.vivoTk && typeof en !== 'undefined' && en.viv ? PZS.vivoTk : null).catch(() => { del.disabled = false; });
      return;
    }
    if (e.target === $('dlg-img')) $('dlg-img').close();
  });
  // Pegar (Ctrl+V) un archivo o una captura de pantalla funciona en cualquier parte de la pantalla: va a la pizarra visible
  function vistaActiva() {
    const abierto = document.querySelector('dialog[open]');
    PZS.vistas = PZS.vistas.filter((v) => document.body.contains(v.el));
    const cand = PZS.vistas.filter((v) => v.agregarArchivos && v.el.offsetParent !== null);
    if (abierto) return abierto.id === 'dlg-pz' ? cand.find((v) => abierto.contains(v.el)) : null;
    return cand.find((v) => !v.el.closest('dialog')) || null;
  }
  document.addEventListener('paste', (e) => {
    const fs = [...(e.clipboardData ? e.clipboardData.files : [])]; if (!fs.length) return;
    const t = e.target;
    if (t && (/^(INPUT|SELECT)$/.test(t.tagName) || (t.tagName === 'TEXTAREA' && !t.classList.contains('pz-x')) || t.isContentEditable)) return;
    const v = vistaActiva(); if (!v) return;
    e.preventDefault(); v.agregarArchivos(fs);
  });
  setInterval(() => document.querySelectorAll('time.pz-hora').forEach((t) => { const ms = +t.dataset.t; if (ms) t.textContent = pzCuando(ms); }), 60000);

  // ───────── identificación de los integrantes del cliente (sin cuenta: escriben su nombre) ─────────
  // al salir de la reunión, el nombre se quita de este dispositivo (puede ser un equipo compartido)
  PZS.olvidar = function () { PZS.persona = null; try { localStorage.removeItem(LS); } catch (e) { /* sin almacenamiento */ } };
  PZS.pedirPersona = function (forzar) {
    return new Promise((ok) => {
      const d = $('dlg-nombre');
      if (!d || (PZS.persona && PZS.persona.n && !forzar)) return ok(PZS.persona);
      const f = $('nom-f'), n = $('nom-n'), c = $('nom-c'), er = $('nom-e'), x = $('nom-x'), ahora = $('nom-c2'), sal = $('nom-s');
      n.value = (PZS.persona && PZS.persona.n) || ''; c.value = (PZS.persona && PZS.persona.c) || ''; er.hidden = true;
      // siempre hay salida: cerrar (×, «Ahora no» o Esc) deja las cosas como estaban; sin nombre, los avisos de la pantalla piden escribirlo cuando haga falta
      let cerrado = false;
      const cerrar = () => { if (cerrado) return; cerrado = true; if (d.open) d.close(); ok(PZS.persona); };
      d.oncancel = (e) => { e.preventDefault(); cerrar(); };
      d.onclose = cerrar;
      x.onclick = cerrar; ahora.onclick = cerrar;
      // en la reunión en vivo, quien aún no ha dado su nombre también puede salir de la reunión
      const enVivo = window.vivoInvitado === true && typeof window.salir === 'function' && !(PZS.persona && PZS.persona.n);
      sal.hidden = !enVivo; ahora.hidden = enVivo;
      sal.onclick = () => { cerrado = true; if (d.open) d.close(); ok(PZS.persona); window.salir(); };
      f.onsubmit = (e) => {
        e.preventDefault();
        const nombre = n.value.trim().replace(/\s+/g, ' ');
        if (nombre.length < 2) { er.hidden = false; n.focus(); return; }
        PZS.persona = { n: nombre.slice(0, 60), c: c.value.trim().slice(0, 60) };
        try { localStorage.setItem(LS, JSON.stringify(PZS.persona)); } catch (x2) { /* sin almacenamiento: vale para esta visita */ }
        cerrado = true; d.close(); PZS.vistas.forEach((v) => v.quien && v.quien()); if (window.pzPersonaCambio) window.pzPersonaCambio(PZS.persona); ok(PZS.persona);
      };
      if (!d.open) d.showModal();
      n.focus();
    });
  };
})();
