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

  // Slide the live panels directly; no asynchronous page snapshot is required.
  var pageTurnSequence = 0;
  var pageTurnAnimation = null;
  var pageTurnOrder = ['home', 'intro', 'brothers', 'truck', 'world', 'npc', 'openings', 'guide', 'radio'];
  var pageTurnSupported = typeof document.documentElement.animate === 'function';
  if (pageTurnSupported && /^https?:$/.test(location.protocol)) document.documentElement.classList.add('ww-page-slides');
  function clearPageTurn() {
    var html = document.documentElement;
    var wasTurning = html.classList.contains('ww-page-turn');
    html.classList.remove('ww-page-turn');
    delete html.dataset.wwPageDirection;
    ['--ww-page-top', '--ww-page-bottom'].forEach(function (name) { html.style.removeProperty(name); });
    if (wasTurning) global.dispatchEvent(new CustomEvent('ww-page-transition', { detail: { active: false } }));
  }
  function cancelPageTurn() {
    pageTurnSequence++;
    var cancel = pageTurnAnimation;
    pageTurnAnimation = null;
    if (cancel) cancel();
    else clearPageTurn();
  }
  function renderNavigation(update, previous, next) {
    cancelPageTurn();
    var main = document.getElementById('main');
    var outgoing = main && main.querySelector('.panel:not([hidden])');
    var from = pageTurnOrder.indexOf(previous && previous.view);
    var to = pageTurnOrder.indexOf(next.view);
    if (!outgoing || !pageTurnSupported || from < 0 || to < 0 || from === to || next.key.indexOf('guide-') === 0) {
      update();
      return;
    }
    var sequence = pageTurnSequence;
    var html = document.documentElement;
    html.classList.add('ww-page-turn');
    global.dispatchEvent(new CustomEvent('ww-page-transition', { detail: { active: true } }));
    var oldBox = outgoing.getBoundingClientRect();
    var oldDisplay = getComputedStyle(outgoing).display;
    var header = document.querySelector('.ww-site-header');
    var footer = document.querySelector('body > footer');
    var headerBottom = Math.max(0, header ? header.getBoundingClientRect().bottom : 0);
    var footerGap = footer && getComputedStyle(footer).position === 'fixed' ? Math.max(0, innerHeight - footer.getBoundingClientRect().top) : 0;
    var forward = to > from;
    html.dataset.wwPageDirection = forward ? 'next' : 'previous';
    html.style.setProperty('--ww-page-top', headerBottom + 'px');
    html.style.setProperty('--ww-page-bottom', footerGap + 'px');
    var incoming, effects = [], savedProperties = [], savedInert = outgoing.getAttribute('inert'), done = false;
    function finish() {
      if (done) return;
      done = true;
      effects.forEach(function (effect) { effect.cancel(); });
      outgoing.classList.remove('ww-page-leaving');
      if (incoming) incoming.classList.remove('ww-page-arriving');
      savedProperties.forEach(function (item) {
        if (item.value) outgoing.style.setProperty(item.name, item.value, item.priority);
        else outgoing.style.removeProperty(item.name);
      });
      if (savedInert === null) outgoing.removeAttribute('inert');
      else outgoing.setAttribute('inert', savedInert);
      if (pageTurnAnimation === finish) pageTurnAnimation = null;
      clearPageTurn();
    }
    pageTurnAnimation = finish;
    try {
      update();
      global.scrollTo({ top: 0, behavior: 'instant' });
      incoming = document.getElementById(next.view);
      if (!incoming || incoming.hidden || incoming === outgoing) { finish(); return; }
      var values = {
        '--ww-page-x': oldBox.left + 'px', '--ww-page-y': oldBox.top + 'px',
        '--ww-page-width': oldBox.width + 'px', '--ww-page-height': oldBox.height + 'px',
        '--ww-page-display': oldDisplay
      };
      Object.keys(values).forEach(function (name) {
        savedProperties.push({ name: name, value: outgoing.style.getPropertyValue(name), priority: outgoing.style.getPropertyPriority(name) });
        outgoing.style.setProperty(name, values[name]);
      });
      outgoing.inert = true;
      outgoing.classList.add('ww-page-leaving');
      incoming.classList.add('ww-page-arriving');
      function slide(element, start, end, id) {
        var effect = element.animate([
          { transform: 'translate3d(' + start + '%,0,0)' },
          { transform: 'translate3d(' + end + '%,0,0)' }
        ], { duration: 220, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both' });
        effect.id = id;
        effects.push(effect);
        return effect.finished.catch(function () {});
      }
      Promise.all([
        slide(outgoing, 0, forward ? -100 : 100, 'ww-page-out'),
        slide(incoming, forward ? 100 : -100, 0, 'ww-page-in')
      ]).then(function () { if (sequence === pageTurnSequence) finish(); });
    } catch (_) { finish(); }
  }
  // History and new selections cancel stale slides before restoring the current panel.
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
