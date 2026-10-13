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
function kbTarjeta(t, rol, mov) {
  const q = t.qid ? Q.find((x) => x.id === t.qid) : null, d = q ? D.find((x) => x.id === q.dm) : null, ven = tarVencida(t);
  const op = TAR_ORD.map((k) => `<option value="${k}"${k === t.e ? ' selected' : ''}>${TAR_E[k]}</option>`).join('');
  return `<article class="kb-t kb-ola${t.ola}${ven ? ' kb-ven' : ''}" data-id="${esc(t.id)}"${mov ? ' draggable="true"' : ''}>
<div class="kb-h"><span class="kb-ola">Etapa ${t.ola}</span>${d ? `<span class="kb-dm">${esc(d.n)}</span>` : '<span class="kb-dm">Tarea propia</span>'}</div>
${rol === 'auditor' ? `<button type="button" class="kb-tit" onclick="tarEditar('${esc(t.id)}')" aria-label="Editar la tarea: ${esc(t.t)}">${esc(t.t)}</button>` : `<p class="kb-tit">${esc(t.t)}</p>`}
${q ? `<p class="kb-q">${esc(tarTxt(q.q))}</p>` : ''}
<div class="kb-m">${t.r ? `<span title="Responsable"><i data-lucide="user"></i>${esc(t.r)}</span>` : ''}${t.v ? `<span class="${ven ? 'kb-rojo' : ''}" title="Fecha compromiso"><i data-lucide="calendar"></i>${kbF(t.v)}${ven ? ' · vencida' : ''}</span>` : ''}${t.h ? `<span class="kb-verde" title="Fecha en que se completó"><i data-lucide="circle-check"></i>${kbF(t.h)}</span>` : ''}${t.ev && t.ev.u ? `<a href="${esc(t.ev.u)}" target="_blank" rel="noopener noreferrer" class="kb-ev"><i data-lucide="paperclip"></i>${esc(t.ev.n || 'Evidencia')}</a>` : t.ev && t.ev.n ? `<span title="Evidencia"><i data-lucide="paperclip"></i>${esc(t.ev.n)}</span>` : ''}</div>
${rol === 'auditor' && mov ? `<label class="kb-mv"><span class="sr-only">Mover «${esc(t.t)}» a</span><select aria-label="Estado de la tarea ${esc(t.t)}" onchange="tarMover('${esc(t.id)}',this.value)">${op}</select></label>` : ''}</article>`;
}
function tarHtml(e, rol) {
  const l = e.tar || [], act = tarActivo(e), r = tarResumen(e);
  const cab = `<h3><div class="ic lv3"><i data-lucide="kanban"></i></div>Tablero del plan</h3>`;
  const nuevas = rol === 'auditor' ? tarDesdeRuta(e).length : 0;
  const bar = rol === 'auditor' ? `<div class="kb-bar"><button type="button" class="be be-p" onclick="tarGenerar()"${nuevas ? '' : ' disabled'}><i data-lucide="list-plus"></i>${l.length ? 'Agregar al backlog las brechas nuevas' : 'Crear el backlog desde la hoja de ruta'}${nuevas ? ' (' + nuevas + ')' : ''}</button><button type="button" class="be" onclick="tarNueva()"><i data-lucide="plus"></i>Agregar tarea</button></div>` : '';
  if (!l.length) {
    return `<div class="rs">${cab}<p class="lead">${rol === 'auditor' ? 'Aún no hay tareas. Cree el backlog desde la hoja de ruta: una tarea por brecha, ordenadas por etapa.' : 'Su consultor aún no publicó el plan de trabajo como tareas. Mientras tanto, la hoja de ruta muestra qué hacer y en qué orden.'}</p>${bar}</div>`;
  }
  const resumen = `<div class="kb-res" role="status"><div><strong>${r.hechas} de ${r.total}</strong> tareas hechas (${r.pct}%)<div class="kb-barra" role="img" aria-label="Avance ${r.pct}%"><i style="width:${r.pct}%"></i></div></div><div>${TAR_ORD.map((k) => `<span class="kb-n kb-n-${k}">${TAR_E[k]} <b>${r.por[k]}</b></span>`).join('')}</div>${r.vencidas ? `<div class="kb-rojo"><i data-lucide="alarm-clock"></i> ${r.vencidas} ${r.vencidas === 1 ? 'tarea vencida' : 'tareas vencidas'}</div>` : ''}${r.confirmable > 0.05 && rol === 'auditor' ? `<div class="kb-verde"><i data-lucide="circle-check"></i> Las tareas hechas podrían sumar <strong>+${fnum(r.confirmable)} pts</strong>, pero el puntaje solo cambia al guardar una revisión.</div>` : ''}</div>`;
  if (!act) {
    const porOla = [1, 2, 3, 4].map((o) => ({ o, ts: l.filter((t) => t.ola === o) })).filter((x) => x.ts.length);
    return `<div class="rs">${cab}<p class="lead">El plan de adecuación como <strong>backlog</strong>, ordenado por etapas. El tablero con seguimiento (estados, responsables, fechas y evidencia) se activa con <strong>D360° Acompaña</strong> o <strong>D360° Implementa</strong>.</p>${rol === 'auditor' ? '<p class="srv-ay"><button type="button" class="be" onclick="srvDlg()"><i data-lucide="handshake"></i>Registrar el servicio contratado</button></p>' : ''}${bar}${porOla.map((g) => `<section class="kb-ola-g"><h4>Etapa ${g.o} · ${esc(OLAS[g.o - 1].t)} <span>${g.ts.length}</span></h4><div class="kb-lista">${g.ts.map((t) => kbTarjeta(t, rol, false)).join('')}</div></section>`).join('')}<p class="met-n">Completar una tarea no cambia el puntaje: el diagnóstico se actualiza al guardar una revisión.</p></div>`;
  }
  const mov = rol === 'auditor';
  return `<div class="rs">${cab}<p class="lead">${mov ? 'Arrastre las tareas entre columnas o use el selector de cada una. Pulse el título para asignar responsable, fecha y evidencia.' : 'El avance del plan de adecuación, actualizado por su consultor.'}</p>${bar}${resumen}<div class="kb-tablero" role="group" aria-label="Tablero de tareas">${TAR_ORD.map((k) => { const ts = l.filter((t) => t.e === k); return `<section class="kb-col kb-col-${k}" data-e="${k}" aria-label="${TAR_E[k]}: ${ts.length} tareas"><h4>${TAR_E[k]} <span>${ts.length}</span></h4><div class="kb-cuerpo">${ts.map((t) => kbTarjeta(t, rol, mov)).join('') || '<p class="kb-vacio">Sin tareas</p>'}</div></section>`; }).join('')}</div><p class="met-n">Completar una tarea registra el avance, pero no cambia la respuesta de la pregunta ni el puntaje: eso ocurre al guardar una revisión en «Evolución».</p></div>`;
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

// ── acciones del consultor ──
function tarGenerar() { if (en.ro) return; const n = tarDesdeRuta(en); if (!n.length) return; en.tar = (en.tar || []).concat(n); en.sv(); tarRefrescar(); }
function tarMover(id, est) { if (tarEstado(en, id, est)) tarRefrescar(); }
let tarEdit = null;
function tarNueva() { tarEdit = { id: '', t: '', e: 'backlog', ola: 3, qid: '', r: '', v: 0, h: 0, n: '', ev: { n: '', u: '' }, c: Date.now() }; tarRender(); const d = document.getElementById('dlg-tarea'); if (d && !d.open) d.showModal(); }
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
// arrastrar y soltar entre columnas (además del selector, que es la forma accesible)
if (typeof document !== 'undefined' && document.addEventListener) {
  let arrastrando = null;
  document.addEventListener('dragstart', (ev) => { const t = ev.target.closest && ev.target.closest('.kb-t[draggable="true"]'); if (!t) return; arrastrando = t.dataset.id; ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', arrastrando); } catch (x) { /* navegador sin datos de arrastre */ } t.classList.add('kb-arr'); });
  document.addEventListener('dragend', (ev) => { arrastrando = null; document.querySelectorAll('.kb-arr,.kb-sobre').forEach((x) => x.classList.remove('kb-arr', 'kb-sobre')); });
  document.addEventListener('dragover', (ev) => { const c = ev.target.closest && ev.target.closest('.kb-col'); if (!c || !arrastrando) return; ev.preventDefault(); document.querySelectorAll('.kb-sobre').forEach((x) => x !== c && x.classList.remove('kb-sobre')); c.classList.add('kb-sobre'); });
  document.addEventListener('drop', (ev) => { const c = ev.target.closest && ev.target.closest('.kb-col'); if (!c || !arrastrando) return; ev.preventDefault(); const id = arrastrando; arrastrando = null; tarMover(id, c.dataset.e); });
}
