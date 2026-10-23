/* Shared original-image viewer. Replacing an image src requires no viewer changes. */
(function (global) {
  'use strict';
  const scriptURL = document.currentScript?.src || new URL('../WW/image-viewer.js', location.href).href;
  const portraits = new URL('assets/portraits/', scriptURL);
  const functional = 'a,button,label,summary,[role="button"],[role="tab"],[data-no-image-viewer],.ww-image-viewer';
  let dialog, image, stage, sizeButton, caption, dimensions, status, opener;
  let previousOverflow = null;
  let mounted = false;
  let scheduled = false;

  function fillPortraits() {
    for (const [key, name] of [['wyatt', '와이어트 로즈'], ['wade', '웨이드 로즈']]) {
      document.querySelectorAll('.brother-dossier.' + key + ' .portrait,.twin-polaroid.' + key + ' .portrait').forEach(frame => {
        if (frame.querySelector('img')) return;
        const photo = document.createElement('img');
        photo.src = new URL(key + '.png', portraits).href;
        photo.alt = name;
        photo.width = 832; photo.height = 1216;
        photo.className = 'ww-character-portrait ww-character-portrait-' + key;
        photo.decoding = 'async';
        frame.classList.add('ww-portrait-filled');
        frame.setAttribute('aria-label', name + ' 프로필 이미지');
        frame.replaceChildren(photo);
      });
    }
  }
  function eligible(photo) {
    if (photo.dataset.imageViewer === 'off' || photo.closest('[data-no-image-viewer]')) return false;
    if (photo.parentElement?.closest(functional)) return false;
    if (photo.hasAttribute('onclick') || (photo.getAttribute('role') === 'button' && !photo.dataset.wwViewer)) return false;
    return photo.dataset.imageViewer === 'on' ||
      (photo.naturalWidth >= 240 && photo.naturalHeight >= 180);
  }
  function register() {
    fillPortraits();
    document.querySelectorAll('main img').forEach(photo => {
      if (!eligible(photo) || photo.dataset.wwViewer) return;
      photo.dataset.wwViewer = 'ready';
      photo.tabIndex = 0;
      photo.setAttribute('role', 'button');
      photo.setAttribute('aria-haspopup', 'dialog');
      photo.setAttribute('aria-label', (photo.alt || '이미지') + ' 원본 보기');
      photo.classList.add('ww-viewable-image');
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; register(); });
  }
  function nativeSize(enabled) {
    dialog.classList.toggle('wwiv-native', enabled);
    sizeButton.textContent = enabled ? '화면에 맞추기' : '원본 크기';
    sizeButton.setAttribute('aria-label', enabled ? '이미지를 화면에 맞추기' : '이미지를 원본 크기로 보기');
    sizeButton.setAttribute('aria-pressed', String(enabled));
    image.style.width = enabled ? image.naturalWidth + 'px' : '';
    image.style.height = enabled ? image.naturalHeight + 'px' : '';
    stage.scrollTo(0, 0);
  }
  function restorePage() {
    if (!previousOverflow) return;
    const saved = previousOverflow;
    previousOverflow = null;
    document.documentElement.style.overflow = saved.html;
    document.body.style.overflow = saved.body;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }
  function closeViewer() {
    if (!dialog?.open) return;
    dialog.close();
    restorePage();
  }
  function createViewer() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'ww-image-viewer';
    dialog.dataset.horizontalScroll = 'off';
    dialog.setAttribute('aria-labelledby', 'wwiv-caption');
    dialog.innerHTML = '<header class="wwiv-bar"><div class="wwiv-heading"><h2 id="wwiv-caption">이미지 보기</h2><span class="wwiv-dimensions"></span></div><button type="button" class="wwiv-size" aria-pressed="false">원본 크기</button><button type="button" class="wwiv-close" aria-label="이미지 닫기">닫기 ×</button></header><div class="wwiv-stage"><img class="wwiv-image" alt=""><p class="wwiv-status" role="status" hidden>이미지를 불러오지 못했습니다.</p></div>';
    document.body.append(dialog);
    image = dialog.querySelector('.wwiv-image');
    stage = dialog.querySelector('.wwiv-stage');
    stage.tabIndex = 0;
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-label', '확대 이미지');
    sizeButton = dialog.querySelector('.wwiv-size');
    caption = dialog.querySelector('#wwiv-caption');
    dimensions = dialog.querySelector('.wwiv-dimensions');
    status = dialog.querySelector('.wwiv-status');
    sizeButton.addEventListener('click', () => nativeSize(!dialog.classList.contains('wwiv-native')));
    dialog.querySelector('.wwiv-close').addEventListener('click', closeViewer);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
    image.addEventListener('load', () => {
      dimensions.textContent = image.naturalWidth + ' × ' + image.naturalHeight + ' px';
      sizeButton.disabled = false;
      status.hidden = true;
    });
    image.addEventListener('error', () => { status.hidden = false; sizeButton.disabled = true; });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if ((event.target === dialog && outside) || event.target === stage) closeViewer();
    });
    dialog.addEventListener('close', () => { if (!dialog.open) restorePage(); });
  }
  function open(photo) {
    if (!eligible(photo)) return;
    createViewer();
    if (dialog.open) return;
    opener = photo;
    caption.textContent = photo.alt || '이미지 보기';
    dimensions.textContent = '';
    status.hidden = true;
    sizeButton.disabled = true;
    nativeSize(false);
    image.alt = photo.alt || '';
    image.src = photo.dataset.fullSrc || photo.currentSrc || photo.src;
    previousOverflow = { html: document.documentElement.style.overflow, body: document.body.style.overflow };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('.wwiv-close').focus({ preventScroll: true });
  }
  function mount() {
    if (mounted) { schedule(); return; }
    mounted = true;
    register();
    document.addEventListener('load', event => { if (event.target instanceof HTMLImageElement) schedule(); }, true);
    document.addEventListener('click', event => {
      const photo = event.target.closest?.('img.ww-viewable-image');
      if (photo && eligible(photo)) { event.preventDefault(); open(photo); }
    });
    document.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('img.ww-viewable-image')) {
        event.preventDefault(); open(event.target);
      }
    });
    global.addEventListener('hashchange', schedule);
    new MutationObserver(schedule).observe(document.querySelector('main') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
  }
  global.WWImageViewer = { mount, open };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})(window);
