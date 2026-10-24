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

  // Animate only the document body below the persistent navigation and above the footer.
  var pageTurnSequence = 0;
  var pageTurnAnimation = null;
  var pageTurnOrder = ['home', 'intro', 'brothers', 'truck', 'world', 'npc', 'openings', 'guide', 'radio'];
  function clearPageTurn() {
    var html = document.documentElement;
    html.classList.remove('ww-page-turn');
    delete html.dataset.wwPageDirection;
    ['--ww-page-old-y', '--ww-page-top', '--ww-page-bottom'].forEach(function (name) { html.style.removeProperty(name); });
  }
  function cancelPageTurn() {
    pageTurnSequence++;
    if (pageTurnAnimation) pageTurnAnimation.skipTransition();
    pageTurnAnimation = null;
    clearPageTurn();
  }
  function renderNavigation(update, previous, next) {
    cancelPageTurn();
    var main = document.getElementById('main');
    var from = pageTurnOrder.indexOf(previous && previous.view);
    var to = pageTurnOrder.indexOf(next.view);
    if (!main || !document.startViewTransition || from < 0 || to < 0 || from === to || next.key.indexOf('guide-') === 0) {
      update();
      return;
    }
    var sequence = pageTurnSequence;
    var html = document.documentElement;
    var oldTop = main.getBoundingClientRect().top;
    var header = document.querySelector('.ww-site-header');
    var footer = document.querySelector('body > footer');
    html.dataset.wwPageDirection = to > from ? 'next' : 'previous';
    html.style.setProperty('--ww-page-top', Math.max(0, header ? header.getBoundingClientRect().bottom : 0) + 'px');
    html.style.setProperty('--ww-page-bottom', footer && getComputedStyle(footer).position === 'fixed' ? Math.max(0, innerHeight - footer.getBoundingClientRect().top) + 'px' : '0px');
    html.classList.add('ww-page-turn');
    try {
      var transition = document.startViewTransition(function () {
        if (sequence !== pageTurnSequence) return;
        update();
        // Finish the established section-to-top navigation inside the snapshot swap.
        global.scrollTo({ top: 0, behavior: 'instant' });
        html.style.setProperty('--ww-page-old-y', oldTop - main.getBoundingClientRect().top + 'px');
      });
      pageTurnAnimation = transition;
      transition.ready.catch(function () {});
      function finish() {
        if (sequence !== pageTurnSequence) return;
        pageTurnAnimation = null;
        clearPageTurn();
      }
      transition.finished.then(finish, finish);
    } catch (_) {
      clearPageTurn();
      update();
    }
  }
  // Native history/hash navigation keeps the existing router and cancels stale snapshots.
  global.addEventListener('popstate', cancelPageTurn, true);
  global.addEventListener('hashchange', function (event) { if (event.isTrusted) cancelPageTurn(); }, true);
  global.addEventListener('pagehide', cancelPageTurn);
  function navigate(href, replace) {
    var target = new URL(href, location.href), state = resolve(target.href);
    if (!state || !/^https?:$/.test(location.protocol)) return false;
    target = canonical(target, state);
    if (target.href === location.href) return true;
    var previous = location.href;
    var previousView = resolve(previous);
    history[replace ? 'replaceState' : 'pushState'](history.state, '', target.href);
    // Keep section and guide listeners together in their established order.
    renderNavigation(function () {
      global.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: previous, newURL: target.href }));
    }, previousView, state);
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
    var scrollTop = event.target.closest && event.target.closest('[data-scroll-top]');
    if (scrollTop) {
      event.preventDefault();
      global.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      return;
    }
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
