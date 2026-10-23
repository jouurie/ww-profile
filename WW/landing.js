/* Initialize the existing arrival scene once, alongside the detailed views. */
(function (global) {
  'use strict';
  var root = document.getElementById('home');
  if (!root || root.dataset.homeReady) return;
  root.dataset.homeReady = 'true';
  var stage = root.querySelector('.ww-home-hero');
  var data = global.WW;
  if (stage && data?.platforms) {
    var wrap = document.createElement('div');
    wrap.className = 'ww-start';
    wrap.innerHTML = '<button type="button" class="ww-start-trigger" aria-expanded="false" aria-controls="ww-start-platforms">시작하기</button><nav class="ww-start-platforms" id="ww-start-platforms" aria-label="플레이 플랫폼" hidden></nav>';
    var trigger = wrap.querySelector('button'), links = wrap.querySelector('nav');
    ['elyn', 'nody'].forEach(function (key) {
      var anchor = document.createElement('a');
      anchor.href = data.platforms[key]; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      anchor.textContent = key === 'elyn' ? '엘린 ↗' : '노디 ↗'; links.append(anchor);
    });
    function toggle(open) { trigger.setAttribute('aria-expanded', String(open)); links.hidden = !open; }
    trigger.addEventListener('click', function () { toggle(links.hidden); });
    document.addEventListener('click', function (event) { if (!wrap.contains(event.target)) toggle(false); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !links.hidden) { toggle(false); trigger.focus({ preventScroll: true }); }
    });
    global.addEventListener('hashchange', function () { toggle(false); });
    global.addEventListener('popstate', function () { toggle(false); });
    stage.append(wrap);
  }
  global.WWMotion?.mount(root);
})(window);
