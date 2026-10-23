(function () {
  'use strict';
  if (window.WWHorizontalScroll) return;
  var instances = new Map(), serial = 0, observer, pending = 0, started = false;
  var selectors = '[data-horizontal-scroll],.chapter-nav,.wwtruck-thumbnail-strip,.wwtruck-categories,.wg-groups,.wg-item-selector';
  var excluded = '#guide,.ww-hscroll-controls,.ww-npc-film,#contact-list,[data-horizontal-scroll="off"]';
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
    if (!rail) return null;
    if (instances.has(rail)) return instances.get(rail);
    if (rail.closest(excluded)) return null;
    var originalId = rail.getAttribute('id'), originalTabindex = rail.getAttribute('tabindex');
    var originalDescription = rail.getAttribute('aria-describedby');
    var identity = ++serial, controls = document.createElement('div');
    controls.className = 'ww-hscroll-controls ww-hscroll-shell ww-rail-navigation';
    var left = document.createElement('button'), right = document.createElement('button');
    var label = options.label || rail.getAttribute('aria-label') || '목록';
    if (!rail.id) rail.id = 'ww-horizontal-rail-' + identity;
    controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', label + ' 가로 이동');
    [left, right].forEach(function (button, index) {
      button.type = 'button'; button.className = 'ww-hscroll-arrow ww-rail-arrow'; button.hidden = true;
      button.textContent = index ? '→' : '←';
      button.setAttribute('aria-label', label + (index ? ' 오른쪽으로 이동' : ' 왼쪽으로 이동'));
      button.setAttribute('aria-controls', rail.id);
    });
    var originalStyle = getComputedStyle(rail), originalRailMarker = rail.getAttribute('data-ww-hscroll-rail');
    controls.style.margin = originalStyle.margin; controls.style.order = originalStyle.order;
    controls.style.flex = originalStyle.flex; controls.style.gridArea = originalStyle.gridArea;
    if (originalStyle.position === 'sticky') {
      controls.style.position = 'sticky'; controls.style.top = originalStyle.top; controls.style.zIndex = originalStyle.zIndex;
    }
    rail.setAttribute('data-ww-hscroll-rail', '');
    rail.before(controls); controls.append(left, rail, right);
    var header = rail.closest('header'), active = false, frame = 0, destroyed = false;
    function max() { return Math.max(0, rail.scrollWidth - rail.clientWidth); }
    function restoreAttribute(name, value) { if (value === null) rail.removeAttribute(name); else rail.setAttribute(name, value); }
    function refresh() {
      frame = 0;
      if (destroyed) return;
      var style = getComputedStyle(rail);
      var shellStyle = getComputedStyle(controls);
      var available = controls.clientWidth - (parseFloat(shellStyle.paddingLeft) || 0) - (parseFloat(shellStyle.paddingRight) || 0);
      var next = visible(rail) && /^(auto|scroll)$/.test(style.overflowX) && rail.clientWidth > 0 && max() > 2 && rail.scrollWidth > available + 2;
      left.hidden = right.hidden = !next;
      controls.classList.toggle('ww-hscroll-active', next);
      if (active !== next) {
        active = next;
        if (active) {
          if (originalTabindex === null) rail.tabIndex = 0;
          restoreAttribute('aria-describedby', originalDescription);
        } else {
          restoreAttribute('tabindex', originalTabindex); restoreAttribute('aria-describedby', originalDescription);
        }
      }
      if (!next) return;
      var position = Math.max(0, rail.scrollLeft);
      left.disabled = position <= 2; right.disabled = position >= max() - 2;
    }
    function schedule() { if (!frame) frame = setTimeout(refresh); }
    function destination(direction) {
      var items = Array.from(rail.children).filter(function (item) { return item.getClientRects().length; });
      if (!items.length) return rail.scrollLeft;
      var origin = items[0].getBoundingClientRect().left;
      var positions = items.map(function (item) { return item.getBoundingClientRect().left - origin; });
      var position = Math.max(0, rail.scrollLeft), target;
      if (direction > 0) target = positions.find(function (value) { return value > position + 2; });
      else target = positions.reverse().find(function (value) { return value < position - 2; });
      return target === undefined ? (direction > 0 ? max() : 0) : Math.max(0, Math.min(max(), target));
    }
    function move(direction) {
      rail.scrollTo({ left: destination(direction), behavior: reduced() ? 'instant' : 'smooth' });
      schedule();
    }
    function goLeft() { move(-1); } function goRight() { move(1); }
    function key(event) {
      if (event.target !== rail || !active || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); rail.scrollLeft = event.key === 'Home' ? 0 : max(); schedule(); }
    }
    left.addEventListener('click', goLeft); right.addEventListener('click', goRight);
    rail.addEventListener('scroll', schedule, { passive: true });
    rail.addEventListener('keydown', key);
    var resize = new ResizeObserver(schedule);
    resize.observe(rail); if (rail.parentElement) resize.observe(rail.parentElement); if (header) resize.observe(header);
    var entry = { rail: rail, controls: controls, refresh: refresh, destroy: function () {
      if (destroyed) return; destroyed = true;
      clearTimeout(frame); resize.disconnect();
      rail.removeEventListener('scroll', schedule); rail.removeEventListener('keydown', key);
      left.removeEventListener('click', goLeft); right.removeEventListener('click', goRight);
      restoreAttribute('tabindex', originalTabindex); restoreAttribute('aria-describedby', originalDescription);
      restoreAttribute('data-ww-hscroll-rail', originalRailMarker);
      if (originalId === null && rail.id === 'ww-horizontal-rail-' + identity) rail.removeAttribute('id');
      if (rail.parentNode === controls && controls.parentNode) controls.before(rail);
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
        if (record.target.matches && record.target.matches('.ww-hscroll-controls,.ww-hscroll-arrow')) return;
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
