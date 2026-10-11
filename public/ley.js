/* Popup con el texto oficial de la ley.
   Cada referencia «art. 14 ter a)» que genera refLey() (app.js) es un botón .ref: al pulsarlo se abre este diálogo con
   el texto literal del artículo, la letra citada resaltada, atajos a los demás artículos de la pregunta y a cada letra,
   y enlaces directos a la BCN. El texto (ley-texto.js, ~150 KB) se descarga solo la primera vez que se abre. */
(function () {
  const $ = (id) => document.getElementById(id);
  const BCN = 'https://www.bcn.cl/leychile/navegar';
  let cargando = null, ctx = null, copiado = null;

  function cargar() {
    if (window.LEY) return Promise.resolve();
    if (!cargando) {
      cargando = new Promise((ok, ko) => {
        const s = document.createElement('script');
        s.src = 'ley-texto.js';
        s.onload = ok;
        s.onerror = () => { cargando = null; ko(new Error('ley-texto.js')); };
        document.head.appendChild(s);
      });
    }
    return cargando;
  }

  const urlArt = (a) => `${BCN}?idNorma=${LEY.n}&idVersion=${LEY.v}&idParte=${a.id}`;
  const urlLey = () => `${BCN}?idNorma=${LEY.n21}`;
  const att = (u) => u.replace(/&/g, '&amp;'); // para usar la URL dentro de un atributo href
  const letraDe = (p) => { const m = /^([a-z])\) /.exec(p); return m ? m[1] : null; };

  // «49,50,4-11» → ['49','50','4','5','6','7','8','8 bis','8 ter','9','10','11'], en el orden de la ley y sin repetir
  function claves(tokens) {
    const sal = [];
    for (const t of tokens) {
      const r = /^(.+)-(.+)$/.exec(t);
      if (r) { const i = LEY.o.indexOf(r[1]), j = LEY.o.indexOf(r[2]); if (i >= 0 && j >= i) sal.push(...LEY.o.slice(i, j + 1)); }
      else if (LEY.a[t]) sal.push(t);
    }
    return [...new Set(sal)];
  }

  const movimientoReducido = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function irA(i) {
    const caja = $('ley-txt'), p = document.getElementById('lp' + i);
    if (!p) return;
    caja.scrollTo({ top: Math.max(0, p.offsetTop - caja.clientHeight / 3), behavior: movimientoReducido() ? 'auto' : 'smooth' });
    p.classList.remove('ley-flash'); void p.offsetWidth; p.classList.add('ley-flash');
  }

  function mostrar(k, letras) {
    const art = LEY.a[k];
    ctx.k = k; ctx.letras = letras;
    $('ley-t').textContent = 'Artículo ' + k;
    $('ley-sub').textContent = art.t;

    document.querySelectorAll('#ley-rel .ley-chip').forEach((b) => b.setAttribute('aria-current', b.dataset.k === k ? 'true' : 'false'));

    // un párrafo por letra o inciso; solo se destaca la primera aparición de cada letra citada
    const citados = new Set();
    for (const l of letras) { const i = art.p.findIndex((p) => letraDe(p) === l); if (i >= 0) citados.add(i); }
    const letrasArt = [];
    $('ley-txt').innerHTML = art.p.map((p, i) => {
      const l = letraDe(p), cita = citados.has(i);
      if (l && !letrasArt.some((x) => x.l === l)) letrasArt.push({ l, i });
      const cuerpo = l ? '<strong class="ley-l">' + l + ')</strong> ' + esc(p.slice(3)) : esc(p);
      return `<p class="ley-p${cita ? ' ley-cita' : ''}" id="lp${i}">${cita ? '<span class="ley-tag">Citado</span>' : ''}${cuerpo}</p>`;
    }).join('');

    // atajo a cada letra, solo en artículos largos
    const ir = $('ley-ir');
    ir.hidden = letrasArt.length < 4;
    ir.innerHTML = letrasArt.length < 4 ? '' : '<span class="ley-rel-l">Ir a la letra:</span>' + letrasArt.map((x) => `<button type="button" class="ley-chip ley-chip-l" data-i="${x.i}" aria-label="Ir a la letra ${x.l}">${x.l})</button>`).join('');

    const cita = 'Art. ' + k + (letras.length ? ', letra' + (letras.length > 1 ? 's ' + letras.map((l) => l + ')').join(', ') : ' ' + letras[0] + ')') : '') + ', Ley 19.628 (texto sustituido por la Ley 21.719)';
    ctx.cita = cita + ' — ' + urlArt(art);
    const aviso = Date.now() < Date.UTC(2026, 11, 1) ? '<p class="ley-nota"><i data-lucide="info"></i> La Ley 21.719 entra en vigencia el 1 de diciembre de 2026: hasta entonces la BCN mostrará un aviso de «versión no vigente» al abrir el artículo. Es normal.</p>' : '';
    $('ley-pie').innerHTML = `<div class="ley-links"><a class="ley-a p" href="${att(urlArt(art))}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i> Ver este artículo en la BCN</a><a class="ley-a" href="${att(urlLey())}" target="_blank" rel="noopener noreferrer"><i data-lucide="scroll-text"></i> Ley 21.719 completa</a><button type="button" class="ley-a" id="ley-cp"><i data-lucide="copy"></i> <span>Copiar cita</span></button></div>${aviso}<p class="ley-nota">Texto oficial de la Biblioteca del Congreso Nacional. Los artículos citados («14 ter», «49»…) son los de la Ley 19.628 tal como la sustituye la Ley 21.719.</p>`;
    lucide.createIcons();

    const primera = [...citados].sort((a, b) => a - b)[0];
    if (primera !== undefined) setTimeout(() => irA(primera), 60); else $('ley-txt').scrollTop = 0;
  }

  function abrir(b) {
    const dlg = $('dlg-ley');
    const a = b.dataset.a, letras = (b.dataset.l || '').split('').filter(Boolean), rel = (b.dataset.r || '').split(',').filter(Boolean);
    $('ley-t').textContent = 'Artículo ' + a; $('ley-sub').textContent = '';
    $('ley-rel').innerHTML = ''; $('ley-ir').hidden = true; $('ley-pie').innerHTML = '';
    $('ley-txt').innerHTML = '<p class="ley-p" role="status">Cargando el texto de la ley…</p>';
    if (!dlg.open) dlg.showModal();
    cargar().then(() => {
      const lista = claves(rel);
      if (!LEY.a[a]) throw new Error('artículo sin texto: ' + a);
      if (!lista.includes(a)) lista.unshift(a);
      ctx = { lista };
      $('ley-rel').innerHTML = lista.length < 2 ? '' : '<span class="ley-rel-l">Artículos relacionados:</span>' + lista.map((k) => `<button type="button" class="ley-chip" data-k="${k}" aria-label="Ver el artículo ${k}">Art. ${k}</button>`).join('');
      mostrar(a, letras);
    }).catch(() => {
      $('ley-txt').innerHTML = '<p class="ley-p" role="alert">No se pudo cargar el texto de la ley. Revise su conexión o ábralo directamente en la BCN.</p>';
      $('ley-pie').innerHTML = `<div class="ley-links"><a class="ley-a p" href="${BCN}?idNorma=141599&amp;idVersion=2026-12-01" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i> Abrir la ley en la BCN</a></div>`;
      lucide.createIcons();
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('button.ref, #dlg-ley .ley-chip, #ley-cp');
    if (!t) { if (e.target === $('dlg-ley')) $('dlg-ley').close(); return; }
    if (t.matches('button.ref')) return abrir(t);
    if (t.id === 'ley-cp') {
      const fin = () => { const s = t.querySelector('span'); s.textContent = 'Copiado'; clearTimeout(copiado); copiado = setTimeout(() => { s.textContent = 'Copiar cita'; }, 1800); };
      try { navigator.clipboard.writeText(ctx.cita).then(fin, () => {}); } catch (_) { /* sin portapapeles: el enlace de la BCN sigue disponible */ }
      return;
    }
    if (t.dataset.k) return mostrar(t.dataset.k, []);
    if (t.dataset.i !== undefined) irA(t.dataset.i);
  });
})();
