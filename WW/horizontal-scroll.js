(function () {
  'use strict';
  if (window.WWHorizontalScroll) return;
  var instances = new Map(), serial = 0, observer, pending = 0, started = false;
  var selectors = '[data-horizontal-scroll],.chapter-nav,.wwtruck-thumbnail-strip,.wwtruck-categories,.wg-groups,.wg-item-selector';
  var excluded = '.ww-hscroll-controls,.ww-npc-film,#contact-list,[data-horizontal-scroll="off"]';
  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function visible(element) {
    return element.isConnected && element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden' && !element.closest('[hidden],[inert]');
  }
  function enqueue() {
    if (!pending) pending = setTimeout(function () {
      pending = 0;
      instances.forEach(function (entry, rail) { if (!rail.isConnected) entry.destroy(); else entry.refresh(); });
    });
  }
  function mount(rail, options) {
    options = options || {};
    if (typeof rail === 'string') rail = document.querySelector(rail);
    if (!rail || rail.closest(excluded)) return null;
    if (instances.has(rail)) return instances.get(rail);
    var originalId = rail.getAttribute('id'), originalTabindex = rail.getAttribute('tabindex');
    var originalDescription = rail.getAttribute('aria-describedby');
    var identity = ++serial, controls = document.createElement('div');
    controls.className = 'ww-hscroll-controls'; controls.hidden = true;
    var left = document.createElement('button'), right = document.createElement('button'), hint = document.createElement('span');
    var label = options.label || rail.getAttribute('aria-label') || '목록';
    if (!rail.id) rail.id = 'ww-horizontal-rail-' + identity;
    controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', label + ' 가로 이동');
    hint.className = 'ww-hscroll-hint'; hint.id = 'ww-horizontal-hint-' + identity; hint.textContent = 'Shift + 휠로 이동';
    [left, right].forEach(function (button, index) {
      button.type = 'button'; button.className = 'ww-hscroll-arrow';
      button.textContent = index ? '→' : '←';
      button.setAttribute('aria-label', label + (index ? ' 오른쪽으로 이동' : ' 왼쪽으로 이동'));
      button.setAttribute('aria-controls', rail.id);
    });
    controls.append(left, hint, right);
    var host = options.controlsHost;
    if (typeof host === 'string') host = document.querySelector(host);
    var header = rail.closest('header'), anchor = header || rail;
    if (host) host.append(controls); else anchor.after(controls);
    var stickyAnchor = header || rail, active = false, frame = 0, destroyed = false;
    function max() { return Math.max(0, rail.scrollWidth - rail.clientWidth); }
    function restoreAttribute(name, value) { if (value === null) rail.removeAttribute(name); else rail.setAttribute(name, value); }
    function refresh() {
      frame = 0;
      if (destroyed) return;
      var style = getComputedStyle(rail);
      var next = visible(rail) && /^(auto|scroll)$/.test(style.overflowX) && rail.clientWidth > 0 && max() > 2;
      controls.hidden = !next;
      controls.style.order = style.order;
      if (active !== next) {
        active = next;
        if (active) {
          if (originalTabindex === null) rail.tabIndex = 0;
          rail.setAttribute('aria-describedby', [originalDescription, hint.id].filter(Boolean).join(' '));
        } else {
          restoreAttribute('tabindex', originalTabindex); restoreAttribute('aria-describedby', originalDescription);
        }
      }
      if (!next) return;
      var position = Math.max(0, rail.scrollLeft);
      left.disabled = position <= 2; right.disabled = position >= max() - 2;
      var sticky = !host && options.sticky !== false && getComputedStyle(stickyAnchor).position === 'sticky';
      controls.classList.toggle('ww-hscroll-sticky', sticky);
      if (sticky) {
        var anchorStyle = getComputedStyle(stickyAnchor);
        controls.style.setProperty('--ww-hscroll-top', ((parseFloat(anchorStyle.top) || 0) + stickyAnchor.getBoundingClientRect().height) + 'px');
        controls.style.setProperty('--ww-hscroll-z', String(Math.max(1, parseInt(anchorStyle.zIndex, 10) || 1)));
      }
    }
    function schedule() { if (!frame) frame = setTimeout(refresh); }
    function distance() {
      var items = Array.from(rail.children).filter(function (item) { return item.getClientRects().length; });
      var first = items[0], second = items[1];
      var step = first && second ? Math.abs(second.getBoundingClientRect().left - first.getBoundingClientRect().left) : 0;
      return step > 0 && step <= rail.clientWidth ? Math.max(step, Math.floor(rail.clientWidth / step) * step) : rail.clientWidth * .85;
    }
    function move(direction) {
      rail.scrollTo({ left: Math.max(0, Math.min(max(), rail.scrollLeft + direction * distance())), behavior: reduced() ? 'instant' : 'smooth' });
      schedule();
    }
    function goLeft() { move(-1); } function goRight() { move(1); }
    function wheel(event) {
      if (!active || !event.shiftKey || event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      var delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= rail.clientWidth;
      event.preventDefault();
      rail.scrollLeft = Math.max(0, Math.min(max(), rail.scrollLeft + delta));
      schedule();
    }
    function key(event) {
      if (event.target !== rail || !active || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); rail.scrollLeft = event.key === 'Home' ? 0 : max(); schedule(); }
    }
    left.addEventListener('click', goLeft); right.addEventListener('click', goRight);
    rail.addEventListener('scroll', schedule, { passive: true });
    rail.addEventListener('wheel', wheel, { passive: false });
    rail.addEventListener('keydown', key);
    var resize = new ResizeObserver(schedule);
    resize.observe(rail); if (rail.parentElement) resize.observe(rail.parentElement); if (header) resize.observe(header);
    var entry = { rail: rail, controls: controls, refresh: refresh, destroy: function () {
      if (destroyed) return; destroyed = true;
      clearTimeout(frame); resize.disconnect();
      rail.removeEventListener('scroll', schedule); rail.removeEventListener('wheel', wheel); rail.removeEventListener('keydown', key);
      left.removeEventListener('click', goLeft); right.removeEventListener('click', goRight);
      restoreAttribute('tabindex', originalTabindex); restoreAttribute('aria-describedby', originalDescription);
      if (originalId === null && rail.id === 'ww-horizontal-rail-' + identity) rail.removeAttribute('id');
      controls.remove(); instances.delete(rail);
    } };
    instances.set(rail, entry); refresh(); return entry;
  }
  function scan(root) {
    root = root || document;
    var candidates = new Set(root.querySelectorAll(selectors));
    if (root.matches && root.matches(selectors)) candidates.add(root);
    // Also include finite horizontal lists introduced by another module.
    root.querySelectorAll('*').forEach(function (element) {
      if (element.childElementCount < 2 || element.closest(excluded) || element.matches('html,body,pre,code,table,iframe')) return;
      if (/^(auto|scroll)$/.test(getComputedStyle(element).overflowX)) candidates.add(element);
    });
    candidates.forEach(function (rail) { mount(rail); }); enqueue();
  }
  function start() {
    if (started) return; started = true; scan(document);
    observer = new MutationObserver(function (records) {
      var meaningful = false;
      records.forEach(function (record) {
        if (record.target.closest && record.target.closest('.ww-hscroll-controls')) return;
        if (record.type === 'childList') record.addedNodes.forEach(function (node) { if (node.nodeType === 1 && !node.matches('.ww-hscroll-controls')) scan(node); });
        meaningful = true;
      });
      if (meaningful) enqueue();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class', 'style', 'data-active', 'aria-selected'] });
    window.addEventListener('resize', enqueue, { passive: true });
    document.addEventListener('load', enqueue, true);
    if (document.fonts) document.fonts.ready.then(enqueue);
  }
  function destroy() {
    if (observer) observer.disconnect(); clearTimeout(pending); pending = 0;
    Array.from(instances.values()).forEach(function (entry) { entry.destroy(); });
    window.removeEventListener('resize', enqueue); document.removeEventListener('load', enqueue, true); started = false;
  }
  window.WWHorizontalScroll = { mount: mount, scan: scan, refresh: enqueue, start: start, destroy: destroy };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
}());
