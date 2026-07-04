(function () {
  function toast(msg) {
    var t = document.getElementById('m-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'm-toast';
      t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--n-900);color:#fff;padding:9px 16px;border-radius:10px;font-size:.85rem;z-index:300;opacity:0;transition:opacity .2s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.opacity = '0'; }, 1400);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (!el || !navigator.clipboard) return;
    var v = el.getAttribute('data-copy');
    navigator.clipboard.writeText(v).then(function () {
      var label = (window.I18N ? window.I18N.t('ui.copied') : 'Copiado');
      toast(label + ' · ' + (v.length > 80 ? v.slice(0, 80) + '…' : v));
    });
  });
})();
