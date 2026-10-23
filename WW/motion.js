/* WW opt-in motion. Content stays visible when this file is absent or fails. */
(function (global) {
  'use strict';
  var selector = '[data-motion]';
  var modes = new Set(['reveal', 'float', 'neon', 'parallax', 'tilt', 'reels', 'route', 'curtain']);
  var records = new Map();
  var scope = null;
  var frame = 0;
  var observer = null;
  var mutations = null;
  var disposers = [];
  var reduced = null;
  var fine = null;
  var lastTime = 0;
  var pointer = { x: 0, y: 0, active: false };

  function listen(target, name, handler, options) {
    target.addEventListener(name, handler, options);
    disposers.push(function () { target.removeEventListener(name, handler, options); });
  }
  function mediaListen(query, handler) {
    if (query.addEventListener) listen(query, 'change', handler);
    else {
      query.addListener(handler);
      disposers.push(function () { query.removeListener(handler); });
    }
  }
  function css(record, key, value) {
    if (!record.styles.has(key)) {
      record.styles.set(key, [record.el.style.getPropertyValue(key), record.el.style.getPropertyPriority(key)]);
    }
    record.el.style.setProperty(key, value);
  }
  function addClass(record, name) {
    if (!record.el.classList.contains(name)) {
      record.classes.add(name);
      record.el.classList.add(name);
    }
  }
  function toggleClass(record, name, on) {
    if (on) addClass(record, name);
    else if (record.classes.delete(name)) record.el.classList.remove(name);
  }
  function allowed(record) {
    return !document.hidden && !reduced.matches && record.visible && record.el.isConnected;
  }
  function expanded(record) {
    if (record.el.hasAttribute('aria-expanded')) return record.el.getAttribute('aria-expanded') === 'true';
    if (record.el.tagName === 'DETAILS') return record.el.open;
    var id = record.el.id;
    if (!id) return record.el.getAttribute('data-open') === 'true';
    var controls = scope.querySelectorAll('[aria-controls][aria-expanded]');
    for (var i = 0; i < controls.length; i++) {
      if (controls[i].getAttribute('aria-controls').split(/\s+/).indexOf(id) !== -1) {
        return controls[i].getAttribute('aria-expanded') === 'true';
      }
    }
    return record.el.getAttribute('data-open') === 'true';
  }
  function reveal(record) {
    if (record.revealed || !record.visible || !record.el.isConnected) return;
    record.revealed = true;
    if (reduced.matches || document.hidden || !record.el.animate) return;
    // Each fragment is a complete element; never split or animate individual words.
    var delay = Math.min(record.order % 10 * 65, 520);
    var animation = record.el.animate([
      { opacity: 0.45, translate: '0 14px' },
      { opacity: 1, translate: '0 0' }
    ], { duration: 620, delay: delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'none' });
    record.animations.add(animation);
    animation.onfinish = animation.oncancel = function () { record.animations.delete(animation); };
  }
  function sync(record) {
    var active = allowed(record);
    toggleClass(record, 'ww-motion-sleep', !active);
    if (record.types.has('curtain')) toggleClass(record, 'ww-curtain-open', expanded(record));
    if (record.types.has('reveal')) reveal(record);
    if (!active) {
      record.animations.forEach(function (animation) { animation.cancel(); });
      css(record, '--ww-float-x', '0px');
      css(record, '--ww-float-y', '0px');
      css(record, '--ww-float-r', '0deg');
      css(record, '--ww-neon-level', '1');
    }
    if (!active || !fine.matches) resetPointer(record);
  }
  function resetPointer(record) {
    record.x = record.y = record.tx = record.ty = 0; record.pointerDirty = false;
    css(record, '--ww-pointer-x', '0px');
    css(record, '--ww-pointer-y', '0px');
    css(record, '--ww-tilt-axis-x', '0');
    css(record, '--ww-tilt-axis-y', '1');
    css(record, '--ww-tilt-angle', '0deg');
  }
  function disposeRecord(record) {
    if (observer) observer.unobserve(record.el);
    record.animations.forEach(function (animation) { animation.cancel(); });
    record.classes.forEach(function (name) { record.el.classList.remove(name); });
    record.styles.forEach(function (old, name) {
      if (old[0]) record.el.style.setProperty(name, old[0], old[1]);
      else record.el.style.removeProperty(name);
    });
    records.delete(record.el);
  }
  function prune() {
    records.forEach(function (record) {
      if (!record.el.isConnected || !record.el.matches(selector) || (scope !== document && !scope.contains(record.el))) disposeRecord(record);
    });
  }
  function needsFrame(record) {
    return allowed(record) && (record.types.has('float') || record.types.has('neon') ||
      (fine.matches && (record.types.has('parallax') || record.types.has('tilt')) &&
       (record.pointerDirty || Math.abs(record.tx - record.x) + Math.abs(record.ty - record.y) > 0.001)));
  }
  function requestFrame() {
    if (frame || !scope || document.hidden || reduced.matches) return;
    if (Array.from(records.values()).some(needsFrame)) frame = global.requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    var ease = 1 - Math.exp(-Math.min(time - (lastTime || time - 16), 50) / 85);
    lastTime = time;
    records.forEach(function (record) {
      if (!allowed(record)) return;
      var seconds = time / 1000 + record.phase;
      if (record.types.has('float')) {
        css(record, '--ww-float-x', (Math.sin(seconds * 0.48) * 2.4).toFixed(2) + 'px');
        css(record, '--ww-float-y', (Math.cos(seconds * 0.71) * 3.2).toFixed(2) + 'px');
        css(record, '--ww-float-r', (Math.sin(seconds * 0.48) * 0.65).toFixed(3) + 'deg');
      }
      if (record.types.has('neon') && time >= record.neonNext) {
        // Irregular, small luminance dips on decorative emitters only; never black out.
        var dip = !record.neonDip;
        record.neonDip = dip;
        css(record, '--ww-neon-level', dip ? '0.93' : '1');
        record.neonNext = time + (dip ? 45 + Math.random() * 35 : 3700 + Math.random() * 6200);
      }
      if (fine.matches && (record.types.has('parallax') || record.types.has('tilt'))) {
        record.pointerDirty = false;
        var box = record.el.getBoundingClientRect();
        var inside = pointer.active && pointer.x >= box.left && pointer.x <= box.right &&
          pointer.y >= box.top && pointer.y <= box.bottom;
        record.tx = inside && box.width ? (pointer.x - box.left) / box.width * 2 - 1 : 0;
        record.ty = inside && box.height ? (pointer.y - box.top) / box.height * 2 - 1 : 0;
        record.x += (record.tx - record.x) * ease;
        record.y += (record.ty - record.y) * ease;
        if (record.types.has('parallax')) {
          css(record, '--ww-pointer-x', (record.x * 5).toFixed(2) + 'px');
          css(record, '--ww-pointer-y', (record.y * 4).toFixed(2) + 'px');
        }
        if (record.types.has('tilt')) {
          css(record, '--ww-tilt-axis-x', (-record.y).toFixed(4));
          css(record, '--ww-tilt-axis-y', (record.x || 0.0001).toFixed(4));
          css(record, '--ww-tilt-angle', (Math.hypot(record.x, record.y) * 1.6).toFixed(3) + 'deg');
        }
      }
    });
    requestFrame();
  }
  function updateAll() {
    prune();
    records.forEach(sync);
    requestFrame();
  }
  function refresh(panel) {
    if (!scope) return api;
    prune();
    var target = panel || scope;
    if (!target.querySelectorAll || (scope !== document && target !== scope && !scope.contains(target))) return api;
    var nodes = Array.from(target.querySelectorAll(selector));
    if (target.matches && target.matches(selector)) nodes.unshift(target);
    nodes.forEach(function (el, index) {
      var types = new Set((el.getAttribute('data-motion') || '').split(/\s+/).filter(function (name) { return modes.has(name); }));
      if (records.has(el)) {
        var old = records.get(el);
        if (Array.from(old.types).join(' ') === Array.from(types).join(' ')) return;
        disposeRecord(old);
      }
      if (!types.size) return;
      var record = { el: el, types: types, order: index, phase: index * 0.97,
        visible: !observer, revealed: false, x: 0, y: 0, tx: 0, ty: 0,
        pointerDirty: false, neonNext: performance.now() + 2300 + Math.random() * 5000, neonDip: false,
        styles: new Map(), classes: new Set(), animations: new Set() };
      records.set(el, record);
      addClass(record, 'ww-motion-ready');
      sync(record);
      if (observer) observer.observe(el);
    });
    updateAll();
    return api;
  }
  function destroy() {
    if (frame) global.cancelAnimationFrame(frame);
    frame = 0;
    if (observer) observer.disconnect();
    if (mutations) mutations.disconnect();
    observer = mutations = null;
    disposers.splice(0).forEach(function (dispose) { dispose(); });
    records.forEach(disposeRecord);
    scope = null;
    reduced = fine = null;
    pointer.active = false;
    lastTime = 0;
    return api;
  }
  function mount(root) {
    destroy();
    scope = root || document;
    if (!scope.querySelectorAll) { scope = null; return api; }
    reduced = global.matchMedia('(prefers-reduced-motion: reduce)');
    fine = global.matchMedia('(hover: hover) and (pointer: fine)');
    if (global.IntersectionObserver) observer = new global.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var record = records.get(entry.target);
        if (record) { record.visible = entry.isIntersecting; sync(record); }
      });
      requestFrame();
    }, { threshold: 0.01 });
    if (global.MutationObserver) {
      mutations = new global.MutationObserver(function (changes) {
        if (changes.some(function (change) { return change.type === 'childList'; })) prune();
        updateAll();
      });
      mutations.observe(scope, { subtree: true, childList: true, attributes: true,
        attributeFilter: ['aria-expanded', 'data-open', 'data-playing', 'open', 'hidden'] });
    }
    listen(document, 'visibilitychange', function () {
      if (document.hidden && frame) { global.cancelAnimationFrame(frame); frame = 0; }
      lastTime = 0;
      updateAll();
    });
    mediaListen(reduced, function () {
      if (frame) { global.cancelAnimationFrame(frame); frame = 0; }
      updateAll();
    });
    mediaListen(fine, updateAll);
    listen(document, 'pointermove', function (event) {
      if (!fine.matches || event.pointerType === 'touch') return;
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true;
      records.forEach(function (record) { record.pointerDirty = true; });
      requestFrame();
    }, { passive: true });
    listen(document, 'pointerleave', function () { pointer.active = false; records.forEach(function (record) { record.pointerDirty = true; }); requestFrame(); }, { passive: true });
    listen(global, 'blur', function () { pointer.active = false; records.forEach(function (record) { record.pointerDirty = true; }); requestFrame(); });
    return refresh(scope);
  }
  var api = { mount: mount, refresh: refresh, destroy: destroy };
  global.WWMotion = api;
})(window);