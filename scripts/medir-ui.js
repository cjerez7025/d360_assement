/* Medición de adaptabilidad y usabilidad en el navegador (ISO/IEC 25010).
   Uso: abra el sitio, pegue este archivo en la consola y ejecute  medirUI()  en cada pantalla y a cada ancho
   (320, 375, 768, 1024, 1440 px; también en horizontal, p. ej. 812×375). Devuelve:
     scrollW/vw      si la página se desborda horizontalmente (scrollW > vw es un fallo)
     overflowX       elementos que se salen del ancho (ignora la barra de pestañas, que tiene su propio desplazamiento)
     objetivos       cuántos controles interactivos hay a la vista
     menores44       controles de menos de 44×44 px (objetivo táctil mínimo recomendado; excluye citas en línea y opciones)
     sinNombre       controles sin nombre accesible
     fuenteMenor12   textos de menos de 12 px
   Las verificaciones estáticas equivalentes están en scripts/verificar.mjs (sección 13). */
window.medirUI = () => {
  const vw = innerWidth;
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden],dialog:not([open])'); };
  const nm = (e) => (e.id ? '#' + e.id : '') + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(' ').slice(0, 2).join('.');
  const controles = [...document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],summary')].filter(vis);
  const textos = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  return {
    vw,
    scrollW: document.documentElement.scrollWidth,
    pantalla: [...document.querySelectorAll('.screen')].filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.id).join(','),
    overflowX: [...document.querySelectorAll('body *')].filter((e) => vis(e) && e.getBoundingClientRect().right > vw + 1 && !e.closest('.tb')).slice(0, 6).map((e) => e.tagName + nm(e) + ' r=' + Math.round(e.getBoundingClientRect().right)),
    objetivos: controles.length,
    menores44: controles.filter((e) => { const r = e.getBoundingClientRect(); return (r.width < 44 || r.height < 44) && !e.classList.contains('ref') && !e.closest('.opt'); }).map((e) => e.tagName + nm(e) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)),
    sinNombre: controles.filter((e) => !(e.getAttribute('aria-label') || e.textContent.trim() || e.title || (e.labels && e.labels.length) || e.getAttribute('aria-labelledby'))).map((e) => e.outerHTML.slice(0, 70)),
    fuenteMenor12: [...new Set(textos.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => nm(e) + ' ' + getComputedStyle(e).fontSize))].slice(0, 6),
  };
};
