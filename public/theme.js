/* Selector de tema claro/oscuro. Sin elección guardada se sigue el tema del sistema. */
(function () {
  var KEY = 'd360theme', root = document.documentElement, btn = document.getElementById('theme-btn');
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function efectivo() {
    var a = root.getAttribute('data-theme');
    if (a === 'dark' || a === 'light') return a;
    return mq && mq.matches ? 'dark' : 'light';
  }
  function pintar() {
    var e = efectivo();
    if (!btn) return;
    btn.setAttribute('data-eff', e);
    btn.setAttribute('aria-label', e === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  }
  function avisar() { document.dispatchEvent(new Event('d360theme')); }

  if (btn) btn.addEventListener('click', function () {
    var n = efectivo() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n);
    try { localStorage.setItem(KEY, n); } catch (e) {}
    pintar(); avisar();
  });
  if (mq) {
    var cambio = function () { if (!root.getAttribute('data-theme')) { pintar(); avisar(); } };
    if (mq.addEventListener) mq.addEventListener('change', cambio); else if (mq.addListener) mq.addListener(cambio);
  }
  pintar();
})();
