/* Popup con el texto oficial de la ley.
   Cada referencia «art. 14 ter a)» que genera refLey() (app.js) es un botón .ref: al pulsarlo se abre este diálogo con
   el texto literal del artículo, la letra citada resaltada, atajos a los demás artículos de la pregunta y a cada letra,
   y enlaces directos a la BCN. Las menciones a otros artículos dentro del texto («el artículo 14 bis», «los artículos 14 bis y
   14 quinquies») también son botones que abren ese artículo. El texto (ley-texto.js, ~150 KB) se descarga solo la primera vez
   que se abre. */
(function () {
  const $ = (id) => document.getElementById(id);
  const BCN = 'https://www.bcn.cl/leychile/navegar';
  let cargando = null, ctx = null, copiado = null, ejAbierto = false;

  function script(src) {
    return new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => ko(new Error(src));
      document.head.appendChild(s);
    });
  }

  // El texto es imprescindible; los ejemplos son un complemento: si no cargan, el recuadro funciona igual.
  function cargar() {
    if (window.LEY) return Promise.resolve();
    if (!cargando) {
      cargando = Promise.all([script('ley-texto.js'), script('ley-ejemplos.js').catch(() => {})]).then(() => {}, (e) => { cargando = null; throw e; });
    }
    return cargando;
  }

  // «Explicado con un ejemplo»: en palabras simples + un caso concreto, si el artículo lo tiene.
  function ejemplo(k) {
    const box = $('ley-ej'), x = window.LEY_EJ && window.LEY_EJ[k];
    box.hidden = !x;
    if (!x) { box.innerHTML = ''; return; }
    box.innerHTML = `<details${ejAbierto ? ' open' : ''}><summary><i data-lucide="lightbulb"></i> Explicado con un ejemplo</summary><div class="ley-ej-c"><p><strong>En simple.</strong> ${esc(x.s)}</p><p><strong>Ejemplo.</strong> ${esc(x.e)}</p>${x.n ? `<p><strong>Ojo.</strong> ${esc(x.n)}</p>` : ''}<p class="ley-ej-av">Ejemplo ilustrativo de AlignData; no es asesoría legal.</p></div></details>`;
    box.querySelector('details').addEventListener('toggle', (ev) => { ejAbierto = ev.target.open; });
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

  // Menciones a otros artículos dentro del texto de la ley: «artículo 14 bis», «artículos 14 bis y 14 quinquies», «44 a 46».
  // Solo se enlazan los que existen en ley-texto.js y no son de otra norma («artículo 1º de la ley N° 18.…», «del Código …»).
  const NUM = String.raw`\d+[º°]?(?:\s(?:bis|ter|quáter|quinquies|sexies|septies|octies|nonies|decies))?`;
  const MENCION = new RegExp(String.raw`\b(art[íi]culos?)(\s+)(` + NUM + String.raw`(?:(?:,\s*|\s+(?:y|e|a)\s+)` + NUM + String.raw`)*)`, 'gi');
  const PARTES = new RegExp('(' + NUM + ')', 'i');
  const OTRA_NORMA = /^(?:,?\s*(?:inciso|letra|número|numeral|N°)[^,;.()]{0,30})?\s*(?:y siguientes\s+)?(?:de la|del|de)\s+(?:ley|código|constitución|decreto|d\.?f\.?l|convención)/i;
  const claveDe = (n) => n.replace(/[º°]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

  function enlazar(txt, actual) {
    let sal = '', i = 0, m;
    MENCION.lastIndex = 0;
    while ((m = MENCION.exec(txt))) {
      const fin = m.index + m[0].length, ini = m.index + m[1].length + m[2].length;
      sal += esc(txt.slice(i, ini));
      const otra = OTRA_NORMA.test(txt.slice(fin, fin + 90));
      sal += m[3].split(PARTES).map((x, j) => {
        const k = claveDe(x);
        return j % 2 && !otra && k !== actual && window.LEY && LEY.a[k]
          ? `<button type="button" class="ley-x" data-k="${esc(k)}" aria-label="Ver el artículo ${esc(k)}">${esc(x)}</button>` : esc(x);
      }).join('');
      i = fin;
    }
    return sal + esc(txt.slice(i));
  }
  window.leyEnlazar = enlazar;

  const movimientoReducido = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function irA(i) {
    const caja = $('ley-txt'), p = document.getElementById('lp' + i);
    if (!p) return;
    caja.scrollTo({ top: Math.max(0, p.offsetTop - caja.clientHeight / 3), behavior: movimientoReducido() ? 'auto' : 'smooth' });
    p.classList.remove('ley-flash'); void p.offsetWidth; p.classList.add('ley-flash');
  }

  function chips() {
    $('ley-rel').innerHTML = ctx.lista.length < 2 ? '' : '<span class="ley-rel-l">Artículos relacionados:</span>' + ctx.lista.map((k) => `<button type="button" class="ley-chip" data-k="${k}" aria-label="Ver el artículo ${k}">Art. ${k}</button>`).join('');
  }

  function mostrar(k, letras) {
    const art = LEY.a[k];
    ctx.k = k; ctx.letras = letras;
    if (!ctx.lista.includes(k)) { ctx.lista.push(k); chips(); } // un artículo al que se llegó desde el texto queda en la fila de atajos
    $('ley-t').textContent = 'Artículo ' + k;
    $('ley-sub').textContent = art.t;
    ejemplo(k);

    document.querySelectorAll('#ley-rel .ley-chip').forEach((b) => b.setAttribute('aria-current', b.dataset.k === k ? 'true' : 'false'));

    // un párrafo por letra o inciso; solo se destaca la primera aparición de cada letra citada
    const citados = new Set();
    for (const l of letras) { const i = art.p.findIndex((p) => letraDe(p) === l); if (i >= 0) citados.add(i); }
    const letrasArt = [];
    $('ley-txt').innerHTML = art.p.map((p, i) => {
      const l = letraDe(p), cita = citados.has(i);
      if (l && !letrasArt.some((x) => x.l === l)) letrasArt.push({ l, i });
      const cuerpo = l ? '<strong class="ley-l">' + l + ')</strong> ' + enlazar(p.slice(3), k) : enlazar(p, k);
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
    $('ley-rel').innerHTML = ''; $('ley-ir').hidden = true; $('ley-pie').innerHTML = ''; $('ley-ej').hidden = true;
    $('ley-txt').innerHTML = '<p class="ley-p" role="status">Cargando el texto de la ley…</p>';
    if (!dlg.open) dlg.showModal();
    cargar().then(() => {
      const lista = claves(rel);
      if (!LEY.a[a]) throw new Error('artículo sin texto: ' + a);
      if (!lista.includes(a)) lista.unshift(a);
      ctx = { lista };
      chips();
      mostrar(a, letras);
    }).catch(() => {
      $('ley-txt').innerHTML = '<p class="ley-p" role="alert">No se pudo cargar el texto de la ley. Revise su conexión o ábralo directamente en la BCN.</p>';
      $('ley-pie').innerHTML = `<div class="ley-links"><a class="ley-a p" href="${BCN}?idNorma=141599&amp;idVersion=2026-12-01" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i> Abrir la ley en la BCN</a></div>`;
      lucide.createIcons();
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('button.ref, #dlg-ley .ley-chip, #dlg-ley .ley-x, #ley-cp');
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
