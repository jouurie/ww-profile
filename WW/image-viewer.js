/* Shared original-image viewer. Replacing an image src requires no viewer changes. */
(function (global) {
  'use strict';
  const scriptURL = document.currentScript?.src || new URL('../WW/image-viewer.js', location.href).href;
  const portraits = new URL('assets/portraits/', scriptURL);
  const functional = 'a,button,label,summary,[role="button"],[role="tab"],[data-no-image-viewer],.ww-image-viewer';
  let dialog, image, opener;
  let previousOverflow = null;
  let mounted = false;
  let scheduled = false;

  function fillPortraits() {
    for (const [key, name] of [['wyatt', '와이어트 로즈'], ['wade', '웨이드 로즈']]) {
      document.querySelectorAll('.brother-dossier.' + key + ' .portrait,.twin-polaroid.' + key + ' .portrait').forEach(frame => {
        if (frame.querySelector('img')) return;
        const photo = document.createElement('img');
        photo.src = key === 'wade' ? 'https://cdn.imgchest.com/files/b54dfa3594ae.png' : new URL(key + '.png', portraits).href;
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
    dialog.innerHTML = '<button type="button" class="wwiv-close" aria-label="이미지 닫기">×</button>';
    image = document.createElement('img');
    image.className = 'wwiv-image';
    image.alt = '';
    dialog.append(image);
    document.body.append(dialog);
    dialog.querySelector('.wwiv-close').addEventListener('click', closeViewer);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
    image.addEventListener('error', closeViewer);
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (event.target === dialog && outside) closeViewer();
    });
    dialog.addEventListener('close', () => { if (!dialog.open) restorePage(); });
  }
  function open(photo) {
    if (!eligible(photo)) return;
    createViewer();
    if (dialog.open) return;
    opener = photo;
    dialog.setAttribute('aria-label', (photo.alt || '이미지') + ' 확대 보기');
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
