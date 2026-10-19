/* porque.js — Icono «¿por qué?» junto a cada nivel de riesgo.
   Pulsarlo abre un recuadro que explica, con los números de esta sesión, por qué una dimensión es de riesgo crítico, alto o medio,
   por qué la empresa está en un nivel de madurez, por qué una respuesta es una alerta crítica y por qué una obligación del
   semáforo aparece como Cumple, Parcial o No cumple. No calcula nada nuevo: solo muestra las reglas que ya usa el modelo.
   Los botones los genera pqBtn() desde sr() (app.js); el contenido se arma al pulsar, con las respuestas del momento. */

const PQ_V = '1.0';
// Riesgo de una dimensión según su puntaje (las mismas reglas de pl() y de la pestaña Brechas): hasta 30 crítico, hasta 55 alto, hasta 79 medio
const PQ_TRAMOS = [{ h: 30, n: 'Crítico', d: '30% o menos' }, { h: 55, n: 'Alto', d: 'de 31% a 55%' }, { h: 79, n: 'Medio', d: 'de 56% a 79%' }];
const PQ_OBJ = 80;
const PQ_MAX = 3; // mejor respuesta posible

function pqTramoDim(s) { return PQ_TRAMOS.find((t) => s <= t.h) || null; }

function pqEsc(x) { return typeof esc === 'function' ? esc(x) : String(x); }

function pqBtn(tipo, k, etq) {
  const lb = etq || '¿Por qué?';
  return `<button type="button" class="pq-i" data-pq="${pqEsc(tipo)}" data-k="${pqEsc(k)}" aria-haspopup="dialog" aria-label="${pqEsc(lb)}" title="${pqEsc(lb)}"><i data-lucide="circle-help"></i></button>`;
}

function pqRespuesta(q, v) {
  const o = (q.op || []).find((x) => x.v === v);
  return `${o ? '«' + pqEsc(o.l) + '» ' : ''}(${v} de ${PQ_MAX})`;
}

// preguntas que más bajan el puntaje de una dimensión: las respondidas con menos de 3, las de más peso primero
function pqPesan(dimId, tope) {
  return en.ga().filter((q) => q.dm === dimId && en.a[q.id] !== undefined && en.a[q.id] < PQ_MAX)
    .sort((a, b) => (PQ_MAX - en.a[b.id]) * (b.w || 1) - (PQ_MAX - en.a[a.id]) * (a.w || 1) || (a.id < b.id ? -1 : 1)).slice(0, tope || 3);
}

function pqListaPreg(qs) {
  return qs.length ? `<ul class="pq-q">${qs.map((q) => `<li><strong>${pqEsc(q.id)}</strong> ${pqEsc(q.q)}<span>Respuesta: ${pqRespuesta(q, en.a[q.id])}</span></li>`).join('')}</ul>` : '';
}

function pqDim(id) {
  const d = D.find((x) => x.id === id); if (!d) return null;
  const sc = en.sc(), s = sc.d[id], t = pqTramoDim(s);
  if (!t) return { t: '¿Por qué esta dimensión no es una brecha?', h: `<p class="pq-lead"><strong>${pqEsc(d.n)}</strong> tiene un puntaje de <strong>${s}%</strong>, que alcanza el objetivo de ${PQ_OBJ}%. Solo se marcan como brecha las dimensiones por debajo de ese objetivo.</p>` };
  const sig = t.h + 1 >= PQ_OBJ - 1 ? PQ_OBJ : t.h + 1;
  const falt = en.ga().filter((q) => q.dm === id && en.a[q.id] === undefined).length;
  const esc2 = PQ_TRAMOS.map((x) => `<li${x === t ? ' class="pq-ahora" aria-current="true"' : ''}><strong>${x.n}</strong> ${x.d}${x === t ? ' <em>← esta dimensión</em>' : ''}</li>`).join('');
  return {
    t: `¿Por qué «Riesgo ${t.n.toLowerCase()}»?`,
    h: `<p class="pq-lead"><strong>${pqEsc(d.n)}</strong> tiene un puntaje de <strong>${s}%</strong> y el objetivo es ${PQ_OBJ}%. El riesgo de cada dimensión depende solo de su puntaje:</p>
<ol class="pq-esc">${esc2}<li><strong>80% o más</strong> cumple el objetivo: no es una brecha</li></ol>
<p>Para salir de «${t.n.toLowerCase()}» debe llegar al menos a <strong>${sig}%</strong>.</p>
${pqPesan(id, 3).length ? `<h4>Lo que más bajó este puntaje</h4>${pqListaPreg(pqPesan(id, 3))}<p class="pq-nota">Son las respuestas con menos de ${PQ_MAX} puntos, ordenadas por cuánto pesan en la dimensión. Mejorarlas es lo que más sube el puntaje.</p>` : ''}
${falt ? `<p class="pq-nota">Faltan ${falt} pregunta${falt === 1 ? '' : 's'} de esta dimensión por responder: el puntaje usa solo las respondidas.</p>` : ''}`
  };
}

function pqNivel() {
  const sc = en.sc(), mt = en.ml(sc.g), bandas = [[0, 20, 0], [21, 40, 1], [41, 60, 2], [61, 80, 3], [81, 100, 4]].map(([a, b, n]) => ({ a, b, n, m: en.ml(b) }));
  const sig = mt.n < 4 ? bandas[mt.n + 1] : null;
  const filas = bandas.map((x) => `<li${x.n === mt.n ? ' class="pq-ahora" aria-current="true"' : ''}><strong>Nivel ${x.n} · ${pqEsc(x.m.nm)}</strong> ${x.a}% a ${x.b}% · riesgo ${pqEsc(x.m.ri)}${x.n === mt.n ? ' <em>← su empresa</em>' : ''}</li>`).join('');
  return {
    t: `¿Por qué Nivel ${mt.n} — ${mt.nm}?`,
    h: `<p class="pq-lead">Su puntaje global es <strong>${sc.g}%</strong>, que corresponde al <strong>nivel ${mt.n} (${pqEsc(mt.nm)})</strong>. El riesgo que acompaña a cada nivel es la lectura de la escala del Assessment D360° de AlignData: a menor madurez, mayor exposición ante la Ley 21.719.</p>
<ol class="pq-esc">${filas}</ol>
<p>La meta de referencia es el <strong>nivel 3</strong> (Gestionado, desde 61%).${sig ? ` Para pasar al nivel ${sig.n} necesita llegar a <strong>${sig.a}%</strong>.` : ' Ya está en el nivel más alto.'}</p>
${sc.g !== sc.gb ? `<p class="pq-nota">El puntaje global pondera cada dimensión por su importancia y ajusta por el rubro y el tamaño de la empresa. Sin esos ajustes sería ${sc.gb}%.</p>` : ''}`
  };
}

function pqAlerta(id) {
  const q = Q.find((x) => x.id === id), v = q ? en.a[id] : undefined; if (!q || v === undefined) return null;
  const buenas = (q.op || []).filter((o) => !(q.fl || []).includes(o.v)).map((o) => `«${pqEsc(o.l)}»`);
  return {
    t: '¿Por qué es una alerta crítica?',
    h: `<p class="pq-lead">A la pregunta <strong>${pqEsc(q.id)}</strong> («${pqEsc(q.q)}») la respuesta fue <strong>${pqRespuesta(q, v)}</strong>.</p>
<p>AlignData marca esta respuesta como alerta crítica porque representa un riesgo significativo ante la Ley 21.719. <strong>Por qué importa:</strong> ${pqEsc(q.cx)}</p>
<p class="pq-nota">Base legal: ${pqEsc(q.ar)}. Una alerta no cambia el puntaje: es una señal para atender primero.${buenas.length ? ' Deja de ser alerta si la respuesta pasa a ' + buenas.join(', ') + '.' : ''}</p>`
  };
}

function pqSem(i) {
  const c = en.cl2()[+i]; if (!c) return null;
  const qs = c.qs.map((id) => Q.find((q) => q.id === id)).filter(Boolean);
  const resp = qs.filter((q) => en.a[q.id] !== undefined);
  return {
    t: `¿Por qué «${c.lb}»?`,
    h: `<p class="pq-lead"><strong>${pqEsc(c.ob)}</strong> (${pqEsc(c.ar)}) ${resp.length ? `tiene un promedio de <strong>${fnum(c.avg)} de ${PQ_MAX}</strong> en sus preguntas.` : 'aún no tiene preguntas respondidas.'}</p>
<ol class="pq-esc"><li${c.st === 'green' ? ' class="pq-ahora"' : ''}><strong>Cumple</strong> promedio de ${fnum(c.tV)} o más</li><li${c.st === 'yellow' ? ' class="pq-ahora"' : ''}><strong>Parcial</strong> promedio de ${fnum(c.tY)} a menos de ${fnum(c.tV)}</li><li${c.st === 'red' ? ' class="pq-ahora"' : ''}><strong>No cumple</strong> promedio menor de ${fnum(c.tY)}</li></ol>
${pqListaPreg(resp)}${resp.length < qs.length ? `<p class="pq-nota">Sin responder: ${qs.filter((q) => en.a[q.id] === undefined).map((q) => pqEsc(q.id)).join(', ')}.</p>` : ''}`
  };
}

function pqContenido(tipo, k) {
  return tipo === 'dim' ? pqDim(k) : tipo === 'nivel' ? pqNivel() : tipo === 'alerta' ? pqAlerta(k) : tipo === 'sem' ? pqSem(k) : null;
}

function pqAbrir(b) {
  const dlg = document.getElementById('dlg-pq'), x = pqContenido(b.dataset.pq, b.dataset.k);
  if (!dlg || !x) return;
  document.getElementById('pq-t').textContent = x.t;
  document.getElementById('pq-c').innerHTML = x.h;
  if (!dlg.open) dlg.showModal();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('.pq-i');
  if (b) { e.preventDefault(); pqAbrir(b); return; }
  const dlg = document.getElementById('dlg-pq');
  if (dlg && e.target === dlg) dlg.close();
});
