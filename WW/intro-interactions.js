/* Keep the physical key's destination discoverable for pointer, keyboard and touch. */
(function (global) {
  'use strict';
  function mount() {
    var key = document.querySelector('#intro .key-tag[href="#truck"]');
    if (!key || key.dataset.introInteraction) return;
    key.dataset.introInteraction = 'ready';
    key.title = '차량 소개 보기';
    key.setAttribute('aria-label', '차량 소개 보기');
    var label = document.createElement('span');
    label.className = 'ww-key-action';
    label.textContent = '차량 소개 보기';
    label.setAttribute('aria-hidden', 'true');
    key.append(label);
  }
  global.WWIntroInteractions = { mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})(window);
