/* Vista del cliente en la reunión en vivo (?v=<token>).
   El cliente abre el enlace en su propio dispositivo mientras sigue la videollamada: ve la misma pregunta que el
   consultor (con sus ejemplos) y puede PROPONER una respuesta; el consultor la ve en su
   pantalla y decide cuál queda registrada. No muestra puntajes ni niveles.
   Usa las variables de app.js (Q, D, E2, esc, exo, glosaArt, sufArt, temaQ, refLey, leyRel, ss, tgl, modo). */
(function () {
  const $ = (id) => document.getElementById(id);

  window.vivoCliente = function (N, tk) {
    modo = 'invitado';
    document.body.classList.add('cliente', 'invitado');
    const fin = (t, p) => {
      $('se-t').textContent = t; $('se-p').textContent = p || ''; $('se-a').innerHTML = '';
      ss('se');
    };
    if (!/^[A-Za-z0-9_-]{32}$/.test(tk)) return fin('Enlace no disponible', 'Este enlace no es válido. Pida a su consultor de AlignData que le envíe uno nuevo.');

    N.iniciar({ persistente: false });
    PZ.cliente(N, tk); // la pizarra empieza a cargar ya; el nombre se pide antes de comentar
    let actual = null, ultimaClave = null, hb = null, apagar = null, conduce = null;
    // este dispositivo se identifica ante el consultor con un código al azar de esta visita (no se guarda en el equipo)
    const pid = Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
    const latir = () => { N.vivoLatido(tk); if (N.vivoPresente && PZ.persona && PZ.persona.n) N.vivoPresente(tk, pid, PZ.persona); };
    // barra superior: quién conduce la reunión y quién es usted
    const barra = () => usuarioBarra({ con: conduce ? { nombre: conduce.nombre, foto: conduce.foto, etq: 'Conduce', rol: 'Consultor AlignData' } : null, yo: PZ.persona && PZ.persona.n ? { nombre: PZ.persona.n, rol: 'Cliente', sub: PZ.persona.c } : null, salir: false });
    // línea visible con quién es usted (en el celular los nombres de la barra superior no caben)
    const quien = () => { const e = $('vh-quien'); if (!e) return; const p = PZ.persona; e.innerHTML = p && p.n ? '<i data-lucide="user-check"></i> Participa como <strong>' + esc(p.n) + '</strong>' + (p.c ? ' · ' + esc(p.c) : '') + ' <button type="button" class="vh-cambiar" onclick="vivoCambiarNombre()">Cambiar</button>' : '<i data-lucide="user"></i> <button type="button" class="vh-cambiar" onclick="vivoCambiarNombre()">Escriba su nombre para participar</button>'; lucide.createIcons(); };
    window.vivoCambiarNombre = () => PZ.pedirPersona(true).then(() => { barra(); quien(); latir(); });
    window.pzPersonaCambio = () => { barra(); quien(); latir(); }; PZ.pedirPersona().then(() => { barra(); quien(); latir(); });
    ss('sv'); $('sv-h').innerHTML = '<p class="vh-n" role="status">Conectando con su consultor…</p>';

    const cerrar = (t, p) => { if (hb) clearInterval(hb); if (apagar) { apagar(); apagar = null; } fin(t, p); };

    function espera(d) {
      const resultados = d.fase === 'resultados';
      return `<div class="qc vespera" role="status"><i data-lucide="${resultados ? 'bar-chart-3' : 'hourglass'}"></i><h2 class="qt">${resultados ? 'Su consultor está revisando los resultados' : 'Su consultor está preparando la siguiente pregunta'}</h2><p class="qs">${resultados ? 'Cuando terminen, recibirá un enlace para verlos.' : 'Esta pantalla se actualiza sola: no necesita hacer nada.'}</p></div>`;
    }

    function pregunta(d, q) {
      const dm = D.find((x) => x.id === q.dm), conf = (d.respuestas || {})[q.id], mia = (d.propuestas || {})[q.id], gl = glosaArt(q.ar);
      const opciones = q.op.map((o, i) => {
        const x = exo(q, o.v), cf = conf === o.v, sel = mia === o.v;
        return `<div class="optw${i > 1 ? ' up' : ''}" style="--i:${i}"><label class="opt${sel || cf ? ' sel' : ''}${cf ? ' conf' : ''}"><input type="radio" name="o" value="${o.v}"${sel ? ' checked' : ''} onchange="vivoProp(${o.v})"><span class="rd" aria-hidden="true"></span><span><span class="ol">${o.l}${cf ? ' <span class="tag tag-conf">Respuesta registrada</span>' : sel ? ' <span class="tag tag-prop">Su propuesta</span>' : ''}</span><span class="od">${o.d}</span></span></label>${x ? `<button type="button" class="opt-i" aria-expanded="false" aria-haspopup="true" aria-label="Ver ejemplo de la respuesta: ${esc(o.l)}" onclick="ejo(this)"><i data-lucide="lightbulb"></i><span>Ejemplo</span></button><div class="ejb" role="group" aria-label="Ejemplo de esta respuesta" hidden>${x}</div>` : ''}</div>`;
      }).join('');
      return `<div class="qc" role="group" aria-labelledby="qtt"><div class="qh"><div class="qdt"><i data-lucide="${dm.ic}"></i> ${esc(temaQ(q) || dm.n)} · ${refLey(q.ar, leyRel(q))}</div>${gl ? `<button type="button" class="art-i" id="b-artn" aria-expanded="false" aria-controls="artn" onclick="tgl('artn')">¿Qué significa ${sufArt(q.ar).map((x) => '«' + x + '»').join(' y ')}?</button>` : ''}</div>${gl ? `<div class="lp" id="artn">${gl}</div>` : ''}<h2 class="qt" id="qtt">${q.q}</h2><p class="qs">${q.s}</p><div class="lbr"><button type="button" class="lb-btn" id="b-lpp" aria-expanded="false" aria-controls="lpp" onclick="tgl('lpp')"><i data-lucide="info"></i> ¿Por qué se pregunta esto?</button></div><div class="lp" id="lpp"><div class="ab">${refLey(q.ar, leyRel(q))}</div><br>${refLey(q.cx, leyRel(q))}</div><p class="ej-hint"><i data-lucide="lightbulb"></i> Cada respuesta tiene un ejemplo: pulse «Ejemplo» para ver qué situación describe.</p><div class="opts" role="radiogroup" aria-labelledby="qtt">${opciones}</div><div class="pz-slot" id="pz-slot"></div><p class="vh-hint">${conf !== undefined ? 'Su consultor ya registró una respuesta para esta pregunta.' : 'Marque la opción que le parece más adecuada: su consultor la verá en su pantalla y la confirmará.'}</p></div>`;
    }

    function pintar(d) {
      if (!d) return cerrar('La reunión en vivo terminó', 'Su consultor cerró la sesión o el enlace venció. Si necesita seguir participando, pídale un enlace nuevo.');
      const e = new E2(); e.a = { ...(d.respuestas || {}) };
      const lst = e.ga(), total = lst.length, hechas = lst.filter((q) => e.a[q.id] !== undefined).length;
      const q = d.qid ? Q.find((x) => x.id === d.qid) : null, idx = q ? lst.findIndex((x) => x.id === q.id) : -1;
      actual = q ? q.id : null;
      conduce = d.consultor && d.consultor.nombre ? d.consultor : null; barra();
      $('sv-h').innerHTML = `<div class="pp nvx vh"><div class="pr"><span class="lb"><i data-lucide="video"></i> Reunión en vivo · ${esc((d.perfil && d.perfil.nombre) || '')}</span><span class="pc">${idx >= 0 ? 'Pregunta ' + (idx + 1) + ' de ' + total : hechas + ' de ' + total + ' respondidas'}</span></div><div class="pbt" role="progressbar" aria-label="Avance de la reunión" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${total ? Math.round(hechas / total * 100) : 0}"><div class="pbf dm" style="width:${total ? Math.round(hechas / total * 100) : 0}%"></div></div><p class="vh-n"><span class="pn-dot" aria-hidden="true"></span> Conectado con su consultor</p><div class="pp-act vh-act">${PZ.boton()}</div></div><div class="vh-quien" id="vh-quien"></div>`;
      const clave = JSON.stringify([d.qid, d.fase, q ? (d.respuestas || {})[q.id] : null, q ? (d.propuestas || {})[q.id] : null]);
      if (clave !== ultimaClave) {
        ultimaClave = clave;
        const foco = document.activeElement && document.activeElement.matches && document.activeElement.matches('#sv-q input[type=radio]') ? document.activeElement.value : null;
        pzAntes();
        $('sv-q').innerHTML = q ? pregunta(d, q) : espera(d);
        if (q) pzMontar('pz-slot', q.id);
        if (foco !== null) { const r = document.querySelector('#sv-q input[value="' + foco + '"]'); if (r) r.focus(); }
      }
      quien(); lucide.createIcons();
    }

    window.vivoProp = async (v) => {
      if (!actual) return;
      try { await N.vivoProponer(tk, actual, v); }
      catch (e) { $('sv-q').insertAdjacentHTML('afterbegin', '<p class="dlg-warn" role="alert">No se pudo enviar su propuesta. Revise su conexión e intente de nuevo.</p>'); }
    };

    apagar = N.vivoEscuchar(tk, pintar, () => cerrar('No se pudo conectar', 'El enlace no es válido, venció o no hay conexión. Pida a su consultor un enlace nuevo.'));
    latir();
    hb = setInterval(latir, 25000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) latir(); });
  };
})();
