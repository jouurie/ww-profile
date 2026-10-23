/* Keep the existing home and section URLs inside one document and one header. */
(function (global) {
  'use strict';
  if (global.WWPageShell) return;
  var root = new URL('../', document.currentScript.src);
  var home = new URL('WW/', root);
  var detail = new URL('preview-argon/', root);
  var panels = new Set(['intro', 'brothers', 'truck', 'world', 'npc', 'openings', 'guide', 'radio']);
  function entry(url, base) { return url.pathname === base.pathname || url.pathname === base.pathname + 'index.html'; }
  function resolve(href) {
    var url = new URL(href || location.href, location.href);
    if (url.origin !== home.origin || (!entry(url, home) && !entry(url, detail))) return null;
    var key = url.hash.slice(1);
    if (!key) return { view: entry(url, home) ? 'home' : 'intro', key: key };
    if (key === 'home') return { view: 'home', key: key };
    if (panels.has(key)) return { view: key, key: key };
    if (/^guide-[a-z0-9-]+$/i.test(key)) return { view: 'guide', key: key };
    return null;
  }
  function canonical(url, state) {
    if (state.view !== 'home' && entry(url, home)) {
      var section = new URL(detail.href); section.search = url.search; section.hash = url.hash || '#intro'; return section;
    }
    if (state.view === 'home' && entry(url, detail)) {
      var arrival = new URL(home.href); arrival.search = url.search; return arrival;
    }
    return url;
  }
  function navigate(href, replace) {
    var target = new URL(href, location.href), state = resolve(target.href);
    if (!state || !/^https?:$/.test(location.protocol)) return false;
    target = canonical(target, state);
    if (target.href === location.href) return true;
    var previous = location.href;
    history[replace ? 'replaceState' : 'pushState'](history.state, '', target.href);
    // Existing section and guide listeners keep their established reset behavior.
    global.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: previous, newURL: target.href }));
    return true;
  }
  global.WWPageShell = Object.freeze({ resolve: resolve, navigate: navigate, home: home.href, detail: detail.href });
  var initial = resolve();
  if (initial && /^https?:$/.test(location.protocol)) {
    var normalized = canonical(new URL(location.href), initial);
    if (normalized.href !== location.href) history.replaceState(history.state, '', normalized.href);
  }
  document.body.classList.toggle('ww-landing', initial?.view === 'home');
  var footer = document.querySelector('body > footer');
  if (footer) {
    function sizeFooter() {
      var height = footer.getBoundingClientRect().height;
      if (height > 0) document.documentElement.style.setProperty('--site-footer-height', height + 'px');
    }
    sizeFooter();
    if (global.ResizeObserver) new ResizeObserver(sizeFooter).observe(footer);
    else global.addEventListener('resize', sizeFooter, { passive: true });
  }
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || anchor.target && anchor.target !== '_self') return;
    if (anchor.classList.contains('skip')) {
      var main = document.getElementById('main');
      if (main) { event.preventDefault(); main.scrollIntoView(); main.focus({ preventScroll: true }); }
      return;
    }
    if (navigate(anchor.href)) {
      event.preventDefault();
      var menu = anchor.closest('details'); if (menu) menu.open = false;
    }
  });
})(window);
