// DMXAiStudio — ajustes de la guía que el head-script (tokens CSS) no cubre:
//  (1) recolorea los swatches de MARCA hardcodeados (§Átomos usan `style="background:#..."`);
//  (2) reescala los specimens de espaciado/radios cuando las perillas cambian densidad/radios
//      (su markup es estático — 4px…96px, 6/10/16 — y no seguiría a las vars solo).
// Neutrales/estado/superficies quedan del template (la derivación no los cambia).
(function () {
  try {
    var p = window.__DS || {};
    var T = p.tokens || {};
    if (!T['--brand-500']) return;
    var MAP = {
      '#EEF2FE': T['--brand-50'], '#D6E0FD': T['--brand-100'], '#ADC0FB': T['--brand-200'],
      '#7E99F6': T['--brand-300'], '#4F6FEE': T['--brand-400'], '#2348E0': T['--brand-500'],
      '#1B39B8': T['--brand-600'], '#162E93': T['--brand-700'], '#142772': T['--brand-800'], '#0E1B4D': T['--brand-900'],
    };
    var keys = Object.keys(MAP).filter(function (k) { return MAP[k]; });
    function sweep() {
      // (1) recoloreo de swatches de marca (atributos style)
      document.querySelectorAll('[style]').forEach(function (el) {
        var s = el.getAttribute('style');
        if (!s) return;
        var out = s;
        keys.forEach(function (k) { out = out.replace(new RegExp(k, 'ig'), MAP[k]); });
        if (out !== s) el.setAttribute('style', out);
      });
      // (1b) hex de marca como TEXTO (muestras de código, labels): TreeWalker sobre text-nodes.
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      var texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.forEach(function (n) {
        var t = n.nodeValue, out = t;
        keys.forEach(function (k) { out = out.replace(new RegExp(k, 'ig'), MAP[k]); });
        if (out !== t) n.nodeValue = out;
      });
      // (2) specimen de espaciado ← --s1..9 (solo presentes si densidad ≠ Cómoda)
      var sp = document.querySelectorAll('.spacing-scale .sp');
      sp.forEach(function (el, i) {
        var v = T['--s' + (i + 1)];
        if (!v) return;
        var bar = el.querySelector('.bar'); if (bar) bar.style.height = v;
        var code = el.querySelector('.v code'); if (code) code.textContent = v;
      });
      // (2) specimen de radios ← --r-sm/md/lg (solo presentes si radios ≠ Suaves)
      var radMap = { sm: T['--r-sm'], md: T['--r-md'], lg: T['--r-lg'] };
      document.querySelectorAll('.radius-demo span').forEach(function (el) {
        var label = ((el.childNodes[0] && el.childNodes[0].textContent) || '').trim();
        var v = radMap[label];
        if (!v) return;
        el.style.setProperty('--r', v);
        var code = el.querySelector('code'); if (code) code.textContent = v.replace('px', '');
      });
      // (3) descarga del artefacto: los links de la guía deben servir el design-tokens.json DERIVADO
      // (marca/perillas/reconciliación), no el estático del template — para no contradecir el panel.
      if (p.designTokens) {
        try {
          var url = URL.createObjectURL(new Blob([JSON.stringify(p.designTokens, null, 2)], { type: 'application/json' }));
          document.querySelectorAll('a[href="design-tokens.json"][download]').forEach(function (a) {
            a.setAttribute('href', url);
            a.setAttribute('download', 'design-tokens.json');
          });
        } catch (e) {}
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sweep);
    else sweep();
  } catch (e) {}
})();
