/* tablero.js — Backlog y tablero kanban del plan de adecuación.
   El backlog sale de la hoja de ruta (una tarea por brecha); el tablero lo avanza el consultor y el cliente solo lo ve.
   · Con el D360° Inicia el cliente ve el plan como un backlog ordenado por etapas.
   · El tablero con seguimiento (estados, responsable, fecha y evidencia) se activa con D360° Acompaña o Implementa.
   · Completar una tarea registra el avance, pero NO cambia la respuesta de la pregunta ni el puntaje: eso ocurre al guardar
     una revisión (el diagnóstico es declarativo y hay que confirmar que la medida realmente quedó implementada). */

const TAR_V = '1.0';
const TAR_E = { backlog: 'Backlog', por_hacer: 'Por hacer', en_curso: 'En curso', revision: 'En revisión', hecha: 'Hecho' };
const TAR_ORD = ['backlog', 'por_hacer', 'en_curso', 'revision', 'hecha'];
const TAR_MAX = 120;
const TAR_NIVEL = 3; // Acompaña (3) e Implementa (4)
const tarId = () => { const a = new Uint8Array(10); if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a); else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); };
const tarTxt = (x) => String(x == null ? '' : x).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// Normaliza lo que viene de la base de datos o de un enlace publicado: nunca se confía en su forma.
function tarLimpio(x) {
  if (!Array.isArray(x)) return [];
  const vistos = new Set(), out = [];
  for (const r of x.slice(0, TAR_MAX)) {
    if (!r || typeof r !== 'object') continue;
    const id = String(r.id || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 12), t = tarTxt(r.t).slice(0, 120);
    if (!id || !t || vistos.has(id)) continue;
    vistos.add(id);
    const ev = r.ev && typeof r.ev === 'object' ? r.ev : {};
    out.push({
      id, t, e: TAR_E[r.e] ? r.e : 'backlog', ola: [1, 2, 3, 4].includes(+r.ola) ? +r.ola : 4,
      qid: typeof r.qid === 'string' && Q.some((q) => q.id === r.qid) ? r.qid : '',
      r: tarTxt(r.r).slice(0, 60), v: Number.isFinite(+r.v) && +r.v > 0 ? +r.v : 0, h: Number.isFinite(+r.h) && +r.h > 0 ? +r.h : 0,
      n: tarTxt(r.n).slice(0, 300), ev: { n: tarTxt(ev.n).slice(0, 80), u: SRV_URL.test(String(ev.u || '')) ? String(ev.u) : '' }, c: Number.isFinite(+r.c) ? +r.c : 0
    });
  }
  return out;
}
// Lo que ve el cliente: sin notas ni evidencia (son del trabajo interno)
function tarPublico(l) { return (l || []).map((t) => ({ id: t.id, t: t.t, e: t.e, ola: t.ola, qid: t.qid, r: t.r, v: t.v, h: t.h })); }
function tarActivo(e) { return srvNivel(e.srv) >= TAR_NIVEL; }
// Una tarea por brecha de la hoja de ruta que todavía no tenga tarea (nunca pisa ni duplica las existentes)
function tarDesdeRuta(e) {
  const ya = new Set((e.tar || []).map((t) => t.qid).filter(Boolean)), nuevas = [];
  for (const i of ruta(e).items) {
    if (ya.has(i.q.id)) continue;
    const meta = (i.q.op.find((o) => o.v === 3) || {}).l || '';
    nuevas.push({ id: tarId(), t: tarTxt(i.q.id + ' · ' + meta).slice(0, 120), e: 'backlog', ola: i.ola, qid: i.q.id, r: '', v: 0, h: 0, n: '', ev: { n: '', u: '' }, c: Date.now() });
  }
  return nuevas.slice(0, Math.max(0, TAR_MAX - (e.tar || []).length));
}
function tarVencida(t, ahora) { return !!(t.v && t.e !== 'hecha' && t.v < new Date(ahora == null ? Date.now() : ahora).setHours(0, 0, 0, 0)); }
// Resumen del avance; «confirmable» = puntos que subirían al confirmar en una revisión las tareas hechas
function tarResumen(e) {
  const l = e.tar || [], por = Object.fromEntries(TAR_ORD.map((k) => [k, 0])), olas = { 1: [0, 0], 2: [0, 0], 3: [0, 0], 4: [0, 0] };
  let conf = 0, ganancia = {};
  try { for (const i of ruta(e).items) ganancia[i.q.id] = i.gain; } catch (x) { ganancia = {}; }
  for (const t of l) { por[t.e]++; olas[t.ola][1]++; if (t.e === 'hecha') { olas[t.ola][0]++; if (t.qid && ganancia[t.qid]) conf += ganancia[t.qid]; } }
  return { total: l.length, por, olas, hechas: por.hecha, pct: l.length ? Math.round(por.hecha / l.length * 100) : 0, vencidas: l.filter((t) => tarVencida(t)).length, confirmable: conf };
}
function tarEstado(e, id, est) {
  const t = (e.tar || []).find((x) => x.id === id);
  if (!t || !TAR_E[est] || e.ro) return false;
  t.e = est; t.h = est === 'hecha' ? Date.now() : 0; e.sv(); return true;
}

// ── pantalla ──
const kbF = (ms) => fchd(new Date(ms));
const kbC = (ms) => { const d = new Date(ms); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
const kbFil = { q: '', o: 0, r: '', v: false, a: 'ola' }; // filtros y agrupación de esta pantalla (no se guardan)
const kbCerr = {}; // etapas plegadas en el tablero
const kbSolo = (t) => (t.qid && t.t.startsWith(t.qid + ' · ') ? t.t.slice(t.qid.length + 3) : t.t); // el código ya se ve aparte, como la clave en Jira
// Título de la tarjeta: una tarea generada desde la hoja de ruta («GOB-01 · Designado formalmente») sola no se entiende, así que se muestra la pregunta
// y la meta queda debajo; si el consultor cambió el título, se respeta el suyo.
function kbTit(t) {
  const q = t.qid ? Q.find((x) => x.id === t.qid) : null, meta = q ? (q.op.find((o) => o.v === 3) || {}).l || '' : '';
  return q && t.t === tarTxt(q.id + ' · ' + meta).slice(0, 120) ? { t: tarTxt(q.q), sub: meta } : { t: kbSolo(t), sub: '' };
}
function kbIni(n) { return (tarTxt(n).split(' ').filter(Boolean).slice(0, 2).map((w) => Array.from(w)[0]).join('') || '?').toUpperCase(); }
function kbHue(n) { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
const kbFiltrando = () => !!(kbFil.q || kbFil.o || kbFil.r || kbFil.v);

function tarFiltrar(l) {
  const q = tarTxt(kbFil.q).toLowerCase();
  return l.filter((t) => {
    if (kbFil.o && t.ola !== kbFil.o) return false;
    if (kbFil.r === '__') { if (t.r) return false; } else if (kbFil.r && t.r !== kbFil.r) return false;
    if (kbFil.v && !tarVencida(t)) return false;
    if (q) {
      const pq = t.qid ? Q.find((x) => x.id === t.qid) : null, dm = pq ? (D.find((x) => x.id === pq.dm) || {}).n || '' : '';
      if (!(t.t + ' ' + t.qid + ' ' + t.r + ' ' + dm + ' ' + (pq ? pq.q : '')).toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function kbTarjeta(t, rol, mov) {
  const q = t.qid ? Q.find((x) => x.id === t.qid) : null, ven = tarVencida(t), i = TAR_ORD.indexOf(t.e), edit = rol === 'auditor', ti = kbTit(t);
  const op = TAR_ORD.map((k) => `<option value="${k}"${k === t.e ? ' selected' : ''}>${TAR_E[k]}</option>`).join('');
  const av = t.r ? `<span class="kb-av" style="--h:${kbHue(t.r)}" title="Responsable: ${esc(t.r)}" aria-label="Responsable: ${esc(t.r)}">${esc(kbIni(t.r))}</span>` : '<span class="kb-av kb-av-0" title="Sin responsable" aria-label="Sin responsable"><i data-lucide="user"></i></span>';
  const ev = t.ev && t.ev.u ? `<a href="${esc(t.ev.u)}" target="_blank" rel="noopener noreferrer" class="kb-ev" title="Evidencia: ${esc(t.ev.n || 'enlace')}" aria-label="Evidencia: ${esc(t.ev.n || 'enlace')}"><i data-lucide="paperclip"></i></a>` : t.ev && t.ev.n ? `<span class="kb-ev" title="Evidencia: ${esc(t.ev.n)}"><i data-lucide="paperclip"></i></span>` : '';
  const acc = edit && mov ? `<div class="kb-acc"><button type="button" class="kb-mb" onclick="tarSig('${esc(t.id)}',-1)" aria-label="Mover «${esc(ti.t)}» a ${i > 0 ? TAR_E[TAR_ORD[i - 1]] : 'la columna anterior'}"${i === 0 ? ' disabled' : ''}><i data-lucide="chevron-left"></i></button><button type="button" class="kb-mb" onclick="tarSig('${esc(t.id)}',1)" aria-label="Mover «${esc(ti.t)}» a ${i < TAR_ORD.length - 1 ? TAR_E[TAR_ORD[i + 1]] : 'la columna siguiente'}"${i === TAR_ORD.length - 1 ? ' disabled' : ''}><i data-lucide="chevron-right"></i></button></div>
<label class="kb-mv"><span class="sr-only">Estado de «${esc(ti.t)}»</span><select aria-label="Estado de la tarea ${esc(ti.t)}" onchange="tarMover('${esc(t.id)}',this.value)">${op}</select></label>` : '';
  return `<article class="kb-t kb-ola${t.ola}${ven ? ' kb-ven' : ''}${t.e === 'hecha' ? ' kb-hecha' : ''}" data-id="${esc(t.id)}"${edit ? ' data-edit="1"' : ''}${mov ? ' draggable="true"' : ''}>
${edit ? `<button type="button" class="kb-tit" onclick="tarEditar('${esc(t.id)}')" aria-label="Editar la tarea: ${esc(ti.t)}">${esc(ti.t)}</button>` : `<p class="kb-tit">${esc(ti.t)}</p>`}${ti.sub ? `<p class="kb-sub">Meta: ${esc(ti.sub)}</p>` : ''}
<div class="kb-pie"><span class="kb-key"${q ? ` title="${esc(tarTxt(q.q))}"` : ''}>${esc(t.qid || 'Propia')}</span>${t.v ? `<span class="kb-fe${ven ? ' kb-rojo' : ''}" title="Fecha compromiso: ${kbF(t.v)}${ven ? ' (vencida)' : ''}"><i data-lucide="${ven ? 'alarm-clock' : 'calendar'}"></i>${kbC(t.v)}</span>` : ''}${t.h ? `<span class="kb-fe kb-verde" title="Completada el ${kbF(t.h)}"><i data-lucide="circle-check"></i>${kbC(t.h)}</span>` : ''}${ev}${av}</div>
${acc}</article>`;
}

function kbBarra(e) {
  const rs = [...new Set((e.tar || []).map((t) => t.r).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const chip = (o, n) => `<button type="button" class="kb-chip" aria-pressed="${kbFil.o === o}" onclick="tarFiltro('o',${o})">${n}</button>`;
  return `<div class="kb-tools"><label class="kb-bus"><i data-lucide="search"></i><span class="sr-only">Buscar tarea</span><input type="search" id="kb-q" placeholder="Buscar tarea…" value="${esc(kbFil.q)}" oninput="tarFiltro('q',this.value)" autocomplete="off"></label>
<div class="kb-chips" role="group" aria-label="Filtrar por etapa">${chip(0, 'Todas')}${[1, 2, 3, 4].map((o) => chip(o, 'Etapa ' + o)).join('')}</div>
<label class="kb-sel"><span>Responsable</span><select onchange="tarFiltro('r',this.value)"><option value="">Todos</option><option value="__"${kbFil.r === '__' ? ' selected' : ''}>Sin asignar</option>${rs.map((r) => `<option value="${esc(r)}"${kbFil.r === r ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
<label class="kb-chk"><input type="checkbox"${kbFil.v ? ' checked' : ''} onchange="tarFiltro('v',this.checked)"> Solo vencidas</label>
<div class="kb-chips kb-vista" role="group" aria-label="Agrupar el tablero"><button type="button" class="kb-chip" aria-pressed="${kbFil.a === 'ola'}" onclick="tarFiltro('a','ola')">Por etapa</button><button type="button" class="kb-chip" aria-pressed="${kbFil.a === 'plano'}" onclick="tarFiltro('a','plano')">Sin agrupar</button></div></div>`;
}

// El tablero: una columna por estado y una fila (carril) por etapa, como un tablero de Jira con carriles
function tarZona(e, rol) {
  const todas = e.tar || [], l = tarFiltrar(todas), mov = rol === 'auditor';
  const cuenta = kbFiltrando() ? `<p class="kb-cuenta" role="status">Mostrando ${l.length} de ${todas.length} tareas · <button type="button" class="kb-lnk" onclick="tarLimpiar()">Quitar filtros</button></p>` : '';
  if (!l.length) return `${cuenta}<p class="kb-vacio kb-vacio-g">Ninguna tarea coincide con los filtros.</p>`;
  const heads = `<div class="kb-heads" aria-hidden="true">${TAR_ORD.map((k) => `<div class="kb-hd kb-hd-${k}">${k === 'hecha' ? '<i data-lucide="check"></i>' : ''}${TAR_E[k]} <span>${l.filter((t) => t.e === k).length}</span></div>`).join('')}</div>`;
  const fila = (ts, o) => `<div class="kb-row">${TAR_ORD.map((k) => { const c = ts.filter((t) => t.e === k); return `<section class="kb-col kb-col-${k}" data-e="${k}"${o ? ` data-o="${o}"` : ''} aria-label="${TAR_E[k]}${o ? ', etapa ' + o : ''}: ${c.length} ${c.length === 1 ? 'tarea' : 'tareas'}"><h5 class="kb-ch">${TAR_E[k]} <span>${c.length}</span></h5>${c.map((t) => kbTarjeta(t, rol, mov)).join('')}${mov && k === 'backlog' && o ? `<button type="button" class="kb-add" onclick="tarNueva(${o})"><i data-lucide="plus"></i>Crear tarea</button>` : ''}</section>`; }).join('')}</div>`;
  let cuerpo;
  if (kbFil.a === 'plano') cuerpo = fila(l, 0);
  else {
    cuerpo = [1, 2, 3, 4].map((o) => {
      const ts = l.filter((t) => t.ola === o); if (!ts.length) return '';
      const all = todas.filter((t) => t.ola === o), hechas = all.filter((t) => t.e === 'hecha').length, cerr = !!kbCerr[o];
      return `<div class="kb-lane${cerr ? ' kb-cerr' : ''}"><h4 class="kb-lt"><button type="button" class="kb-lh" aria-expanded="${!cerr}" onclick="tarLane(${o})"><i data-lucide="chevron-down"></i><span class="kb-ln kb-ola${o}">Etapa ${o}</span><span class="kb-lnom">${esc(OLAS[o - 1].t)}</span><em>${esc(OLAS[o - 1].p)}</em></button><span class="kb-lp">${hechas} de ${all.length} hechas<i class="kb-lbar" aria-hidden="true"><b style="width:${all.length ? Math.round(hechas / all.length * 100) : 0}%"></b></i></span></h4>${cerr ? '' : fila(ts, o)}</div>`;
    }).join('');
  }
  return `${cuenta}<div class="kb-tablero" role="group" aria-label="Tablero de tareas"><div class="kb-grid">${heads}${cuerpo}</div></div>`;
}

function tarHtml(e, rol) {
  const l = e.tar || [], act = tarActivo(e), r = tarResumen(e);
  const cab = `<h3><div class="ic lv3"><i data-lucide="kanban"></i></div>Tablero del plan</h3>`;
  const nuevas = rol === 'auditor' ? tarDesdeRuta(e).length : 0;
  const bar = rol === 'auditor' ? `<div class="kb-bar"><button type="button" class="be be-p" onclick="tarGenerar()"${nuevas ? '' : ' disabled'}><i data-lucide="list-plus"></i>${l.length ? 'Agregar al backlog las brechas nuevas' : 'Crear el backlog desde la hoja de ruta'}${nuevas ? ' (' + nuevas + ')' : ''}</button><button type="button" class="be" onclick="tarNueva()"><i data-lucide="plus"></i>Agregar tarea</button></div>` : '';
  if (!l.length) {
    return `<div class="rs">${cab}<p class="lead">${rol === 'auditor' ? 'Aún no hay tareas. Cree el backlog desde la hoja de ruta: una tarea por brecha, ordenadas por etapa.' : 'Su consultor aún no publicó el plan de trabajo como tareas. Mientras tanto, la hoja de ruta muestra qué hacer y en qué orden.'}</p>${bar}</div>`;
  }
  const seg = TAR_ORD.filter((k) => r.por[k]).map((k) => `<i class="kb-seg kb-seg-${k}" style="width:${(r.por[k] / r.total * 100).toFixed(2)}%" title="${TAR_E[k]}: ${r.por[k]}"></i>`).join('');
  const resumen = `<div class="kb-res" role="status"><div><strong>${r.hechas} de ${r.total}</strong> tareas hechas (${r.pct}%)</div><div class="kb-seg-b" role="img" aria-label="Avance ${r.pct}%: ${TAR_ORD.map((k) => TAR_E[k] + ' ' + r.por[k]).join(', ')}">${seg}</div><div class="kb-leyenda">${TAR_ORD.map((k) => `<span class="kb-n kb-n-${k}"><i class="kb-pt kb-seg-${k}"></i>${TAR_E[k]} <b>${r.por[k]}</b></span>`).join('')}</div>${r.vencidas ? `<div class="kb-rojo"><i data-lucide="alarm-clock"></i> ${r.vencidas} ${r.vencidas === 1 ? 'tarea vencida' : 'tareas vencidas'}</div>` : ''}${r.confirmable > 0.05 && rol === 'auditor' ? `<div class="kb-verde"><i data-lucide="circle-check"></i> Las tareas hechas podrían sumar <strong>+${fnum(r.confirmable)} pts</strong>, pero el puntaje solo cambia al guardar una revisión.</div>` : ''}</div>`;
  if (!act) {
    const porOla = [1, 2, 3, 4].map((o) => ({ o, ts: l.filter((t) => t.ola === o) })).filter((x) => x.ts.length);
    return `<div class="rs">${cab}<p class="lead">El plan de adecuación como <strong>backlog</strong>, ordenado por etapas. El tablero con seguimiento (estados, responsables, fechas y evidencia) se activa con <strong>D360° Acompaña</strong> o <strong>D360° Implementa</strong>.</p>${rol === 'auditor' ? '<p class="srv-ay"><button type="button" class="be" onclick="srvDlg()"><i data-lucide="handshake"></i>Registrar el servicio contratado</button></p>' : ''}${bar}${porOla.map((g) => `<section class="kb-ola-g"><h4>Etapa ${g.o} · ${esc(OLAS[g.o - 1].t)} <span>${g.ts.length}</span></h4><div class="kb-lista">${g.ts.map((t) => kbTarjeta(t, rol, false)).join('')}</div></section>`).join('')}<p class="met-n">Completar una tarea no cambia el puntaje: el diagnóstico se actualiza al guardar una revisión.</p></div>`;
  }
  const mov = rol === 'auditor';
  return `<div class="rs">${cab}<p class="lead">${mov ? 'Arrastre las tarjetas entre columnas, use las flechas de cada una o pulse su título para asignar responsable, fecha y evidencia.' : 'El avance del plan de adecuación, actualizado por su consultor.'}</p>${bar}${resumen}${kbBarra(e)}<div id="kb-zona">${tarZona(e, rol)}</div><p class="met-n">Completar una tarea registra el avance, pero no cambia la respuesta de la pregunta ni el puntaje: eso ocurre al guardar una revisión en «Evolución».</p></div>`;
}
function tarRefrescar() {
  const p = document.getElementById('t11'); if (p && typeof modo !== 'undefined') p.innerHTML = tarHtml(en, modo);
  const t = document.querySelector('#tab-t11 .t'); let c = document.querySelector('#tab-t11 .tcnt');
  const n = (en.tar || []).length;
  if (t && !c && n) { c = document.createElement('span'); c.className = 'tcnt'; t.appendChild(c); }
  if (c) { if (n) c.textContent = n; else c.remove(); }
  if (window.lucide) lucide.createIcons();
  if (window.sbActualizar) window.sbActualizar();
}
// solo el tablero (sin tocar la barra de filtros, para no perder el foco al escribir en la búsqueda)
function tarZonaRefrescar() {
  const z = document.getElementById('kb-zona'); if (!z || typeof modo === 'undefined') return;
  z.innerHTML = tarZona(en, modo);
  if (window.lucide) lucide.createIcons();
}
function tarFiltro(k, v) { if (!(k in kbFil)) return; kbFil[k] = k === 'o' ? +v || 0 : k === 'v' ? !!v : String(v == null ? '' : v); if (k === 'q') tarZonaRefrescar(); else tarRefrescar(); }
function tarLimpiar() { kbFil.q = ''; kbFil.o = 0; kbFil.r = ''; kbFil.v = false; tarRefrescar(); }
function tarLane(o) { kbCerr[o] = !kbCerr[o]; tarZonaRefrescar(); }

// ── acciones del consultor ──
function tarGenerar() { if (en.ro) return; const n = tarDesdeRuta(en); if (!n.length) return; en.tar = (en.tar || []).concat(n); en.sv(); tarRefrescar(); }
function tarMover(id, est) { if (tarEstado(en, id, est)) tarRefrescar(); }
// flechas de la tarjeta: a la columna anterior (-1) o a la siguiente (1)
function tarSig(id, dir) { const t = (en.tar || []).find((x) => x.id === id); if (!t) return; const k = TAR_ORD[TAR_ORD.indexOf(t.e) + (dir < 0 ? -1 : 1)]; if (k) tarMover(id, k); }
let tarEdit = null;
function tarNueva(ola) { tarEdit = { id: '', t: '', e: 'backlog', ola: [1, 2, 3, 4].includes(+ola) ? +ola : 3, qid: '', r: '', v: 0, h: 0, n: '', ev: { n: '', u: '' }, c: Date.now() }; tarRender(); const d = document.getElementById('dlg-tarea'); if (d && !d.open) d.showModal(); }
function tarEditar(id) { const t = (en.tar || []).find((x) => x.id === id); if (!t) return; tarEdit = JSON.parse(JSON.stringify(t)); tarRender(); const d = document.getElementById('dlg-tarea'); if (d && !d.open) d.showModal(); }
const kbDia = (ms) => { if (!ms) return ''; const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function tarRender() {
  const s = document.getElementById('tarea-slot'), t = tarEdit; if (!s || !t) return;
  const act = tarActivo(en), propia = !t.qid;
  s.innerHTML = `<form id="tarea-f" onsubmit="tarGuardar();return false">
${t.qid ? `<p class="srv-ay">Tarea del plan: <strong>${esc(t.qid)}</strong>. ${esc(tarTxt((Q.find((x) => x.id === t.qid) || {}).q))}</p>` : ''}
<div class="fg"><label for="tar-t">Título</label><input id="tar-t" maxlength="120" autocomplete="off" value="${esc(t.t)}" required></div>
<div class="srv-fila"><div class="fg"><label for="tar-e">Estado</label><select id="tar-e"${act ? '' : ' disabled'}>${TAR_ORD.map((k) => `<option value="${k}"${t.e === k ? ' selected' : ''}>${TAR_E[k]}</option>`).join('')}</select></div>
<div class="fg"><label for="tar-o">Etapa</label><select id="tar-o">${[1, 2, 3, 4].map((o) => `<option value="${o}"${t.ola === o ? ' selected' : ''}>${o} · ${esc(OLAS[o - 1].t)}</option>`).join('')}</select></div></div>
<div class="srv-fila"><div class="fg"><label for="tar-r">Responsable <span class="opc">(opcional)</span></label><input id="tar-r" maxlength="60" autocomplete="off" value="${esc(t.r)}"></div>
<div class="fg"><label for="tar-v">Fecha compromiso <span class="opc">(opcional)</span></label><input id="tar-v" type="date" value="${kbDia(t.v)}"></div></div>
<div class="fg"><label for="tar-en">Evidencia (referencia) <span class="opc">(opcional)</span></label><input id="tar-en" maxlength="80" autocomplete="off" value="${esc(t.ev.n)}"></div>
<div class="fg"><label for="tar-eu">Enlace a la evidencia <span class="opc">(opcional, https)</span></label><input id="tar-eu" type="url" maxlength="300" autocomplete="off" placeholder="https://drive.google.com/…" value="${esc(t.ev.u)}"></div>
<div class="fg"><label for="tar-n">Nota interna <span class="opc">(no la ve el cliente)</span></label><textarea id="tar-n" maxlength="300" rows="3">${esc(t.n)}</textarea></div>
${act ? '' : '<p class="srv-ay">El estado se puede cambiar cuando el servicio contratado sea D360° Acompaña o Implementa.</p>'}
<div id="tar-er" class="dlg-warn" role="alert" hidden></div>
<div class="dlg-act"><button type="submit" class="be be-p"><i data-lucide="save"></i>Guardar</button><button type="button" class="be" onclick="document.getElementById('dlg-tarea').close()">Cerrar</button>${t.id ? '<button type="button" class="be be-del" onclick="tarEliminar()"><i data-lucide="trash-2"></i>Eliminar tarea</button>' : ''}</div></form>`;
  if (window.lucide) lucide.createIcons();
}
function tarGuardar() {
  if (!tarEdit || en.ro) return;
  const v = (i) => document.getElementById(i), er = v('tar-er'), t = tarTxt(v('tar-t').value);
  const u = v('tar-eu').value.trim();
  if (!t) { er.textContent = 'Escriba un título.'; er.hidden = false; v('tar-t').focus(); return; }
  if (u && !SRV_URL.test(u)) { er.textContent = 'El enlace debe empezar con https:// y no tener espacios.'; er.hidden = false; v('tar-eu').focus(); return; }
  const est = tarActivo(en) ? v('tar-e').value : tarEdit.e, dv = v('tar-v').value ? new Date(v('tar-v').value + 'T12:00:00').getTime() : 0;
  const nueva = tarLimpio([{ ...tarEdit, id: tarEdit.id || tarId(), t, e: est, ola: +v('tar-o').value, r: v('tar-r').value, v: Number.isFinite(dv) ? dv : 0, h: est === 'hecha' ? (tarEdit.e === 'hecha' && tarEdit.h ? tarEdit.h : Date.now()) : 0, n: v('tar-n').value, ev: { n: v('tar-en').value, u } }])[0];
  if (!nueva) return;
  const l = en.tar || [], i = l.findIndex((x) => x.id === nueva.id);
  if (i >= 0) l[i] = nueva; else if (l.length < TAR_MAX) l.push(nueva); else { er.textContent = 'Se llegó al máximo de ' + TAR_MAX + ' tareas.'; er.hidden = false; return; }
  en.tar = l; en.sv(); document.getElementById('dlg-tarea').close(); tarEdit = null; tarRefrescar();
}
function tarEliminar() {
  if (!tarEdit || !tarEdit.id || en.ro) return;
  if (typeof confirm === 'function' && !confirm('¿Eliminar esta tarea? No se puede deshacer.')) return;
  en.tar = (en.tar || []).filter((x) => x.id !== tarEdit.id); en.sv(); document.getElementById('dlg-tarea').close(); tarEdit = null; tarRefrescar();
}
// arrastrar y soltar entre columnas (además de las flechas y el selector, que son la forma accesible).
// Cada etapa es un carril: una tarjeta solo se suelta en las columnas de su propia etapa (o en cualquiera si el tablero está sin agrupar).
if (typeof document !== 'undefined' && document.addEventListener) {
  let arrastrando = null, carril = '';
  document.addEventListener('dragstart', (ev) => { const t = ev.target.closest && ev.target.closest('.kb-t[draggable="true"]'); if (!t) return; arrastrando = t.dataset.id; const c = t.closest('.kb-col'); carril = c && c.dataset.o ? c.dataset.o : ''; ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', arrastrando); } catch (x) { /* navegador sin datos de arrastre */ } t.classList.add('kb-arr'); });
  document.addEventListener('dragend', () => { arrastrando = null; carril = ''; document.querySelectorAll('.kb-arr,.kb-sobre').forEach((x) => x.classList.remove('kb-arr', 'kb-sobre')); });
  const destino = (ev) => { const c = arrastrando && ev.target.closest && ev.target.closest('.kb-col'); return c && (!c.dataset.o || !carril || c.dataset.o === carril) ? c : null; };
  document.addEventListener('dragover', (ev) => { const c = destino(ev); if (!c) return; ev.preventDefault(); document.querySelectorAll('.kb-sobre').forEach((x) => x !== c && x.classList.remove('kb-sobre')); c.classList.add('kb-sobre'); });
  document.addEventListener('drop', (ev) => { const c = destino(ev); if (!c) return; ev.preventDefault(); const id = arrastrando, t = (en.tar || []).find((x) => x.id === id); arrastrando = null; if (t && t.e !== c.dataset.e) tarMover(id, c.dataset.e); else document.querySelectorAll('.kb-sobre').forEach((x) => x.classList.remove('kb-sobre')); });
  // pulsar la tarjeta (no sus botones) la abre para editarla
  document.addEventListener('click', (ev) => { const c = ev.target.closest && ev.target.closest('.kb-t[data-edit]'); if (c && !ev.target.closest('button,select,a,label')) tarEditar(c.dataset.id); });
}
