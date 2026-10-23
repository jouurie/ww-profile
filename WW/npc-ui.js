/* NPC layout only. Original names, order and unique prose stay in WW.npcs. */
(function (global) {
  'use strict';
  var active = null;
  // Percentages describe a point in the original image; scale is relative to
  // the square thumbnail viewport. Override by English name in WWNPCImages.
  var portraits = {
    'Callum Rusk': { src: 'https://cdn.imgchest.com/files/809ed84b9f6f.png', faceX: 43.5, faceY: 26, scale: 2.8 },
    'Marlene Pike': { src: 'https://cdn.imgchest.com/files/f1d033c2fec8.png', faceX: 51.5, faceY: 23, scale: 2.4 },
    'Rudy Kline': { src: 'https://cdn.imgchest.com/files/062087f8690c.png', faceX: 48.5, faceY: 16, scale: 3.4 },
    'Saul Aguirre': { src: 'https://cdn.imgchest.com/files/a14c965e3ab4.png', faceX: 50.5, faceY: 16, scale: 2.9 },
    'Dottie Mercer': { src: 'https://cdn.imgchest.com/files/3d678d8be9c2.png', faceX: 50, faceY: 29, scale: 2.6 },
    'Bowie Maddox': { src: 'https://cdn.imgchest.com/files/58f1a9c15fa0.png', faceX: 53, faceY: 28, scale: 2.7 },
    'Vince Crowder': { src: 'https://cdn.imgchest.com/files/1961d91de3b3.png', faceX: 53, faceY: 28.5, scale: 2.6 },
    'Lena Vosk': { src: 'https://cdn.imgchest.com/files/2d61691071a8.png', faceX: 47, faceY: 25, scale: 2.9 },
    'Grady Pell': { src: 'https://cdn.imgchest.com/files/af61675a3784.png', faceX: 52, faceY: 31.5, scale: 2.4 },
    'Nate Pell': { src: 'https://cdn.imgchest.com/files/70acdb09c37a.png', faceX: 44.5, faceY: 34.5, scale: 2.6 }
  };
  var appearance = {
    'Callum Rusk': { sentence: '검은 올백머리와 좁은 검은 눈, 마른 중년 남자.', tags: ['검은 올백머리', '좁은 검은 눈', '마른 중년 남자'] },
    'Marlene Pike': { sentence: '짧은 붉은 곱슬머리와 적갈색 눈의 피곤한 미인.', tags: ['짧은 붉은 곱슬머리', '적갈색 눈', '피곤한 미인'] },
    'Rudy Kline': { sentence: '짧게 민 검은 머리와 검은 눈, 큰 체격.', tags: ['짧게 민 검은 머리', '검은 눈', '큰 체격'] },
    'Saul Aguirre': { sentence: '매끈하게 넘긴 검은 머리와 호박색 눈.', tags: ['매끈하게 넘긴 검은 머리', '호박색 눈'] },
    'Dottie Mercer': { sentence: '탈색 금발 보브컷과 붉은기 도는 갈색 눈.', tags: ['탈색 금발 보브컷', '붉은기 도는 갈색 눈'] },
    'Bowie Maddox': { sentence: '헝클어진 검은 머리와 검은 눈, 햇볕에 탄 거구.', tags: ['헝클어진 검은 머리', '검은 눈', '햇볕에 탄 거구'] },
    'Vince Crowder': { sentence: '짙은 갈색 샤기컷과 좁은 푸른 눈. 마른 체격과 잘생긴 얼굴.', tags: ['짙은 갈색 샤기컷', '좁은 푸른 눈', '마른 체격', '잘생긴 얼굴'] },
    'Lena Vosk': { sentence: '잿빛 섞인 짧은 어두운 금발과 헤이즐브라운 눈.', tags: ['잿빛 섞인 짧은 어두운 금발', '헤이즐브라운 눈'] },
    'Grady Pell': { sentence: '은회색 헝클어진 머리와 회색 눈.', tags: ['은회색 헝클어진 머리', '회색 눈'] },
    'Nate Pell': { sentence: '아버지와 닮은 은회색 머리와 회색 눈, 아직 앳된 얼굴.', tags: ['아버지와 닮은 은회색 머리', '회색 눈', '아직 앳된 얼굴'] }
  };
  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function imageFor(npc) {
    var base = portraits[npc.english];
    if (!base) return null;
    var custom = global.WWNPCImages?.[npc.english] || {};
    function coordinate(name) {
      var value = Number(custom[name]);
      return custom[name] !== undefined && Number.isFinite(value) && value >= 0 && value <= 100 ? value : base[name];
    }
    var scale = Number(custom.scale);
    return {
      src: typeof custom.src === 'string' && /^https:\/\/cdn\.imgchest\.com\/files\/[A-Za-z0-9._-]+$/.test(custom.src) ? custom.src : base.src,
      faceX: coordinate('faceX'), faceY: coordinate('faceY'),
      scale: Number.isFinite(scale) && scale > 0 ? scale : base.scale
    };
  }
  function picture(npc, image, thumbnail) {
    var el = node('img', thumbnail ? 'ww-npc-thumb-image' : 'ww-npc-profile-image');
    el.src = image.src; el.alt = npc.name;
    el.width = 832; el.height = 1216;
    el.loading = 'lazy'; el.decoding = 'async'; el.draggable = false;
    if (thumbnail) {
      el.style.setProperty('--ww-npc-face-x', image.faceX + '%');
      el.style.setProperty('--ww-npc-face-y', image.faceY + '%');
      el.style.setProperty('--ww-npc-face-scale', String(image.scale));
    }
    return el;
  }
  function clean(text) {
    return String(text || '').replace(/^\s*(?:#{1,6}\s*|·\s*|🔗\s*)+/u, '').trim();
  }
  function parts(npc) {
    var lines = String(npc.text || '').split(/\r?\n/).map(clean).filter(Boolean);
    var plan = appearance[npc.english];
    var rest = lines.slice(1).join(' ');
    if (!plan || !rest.startsWith(plan.sentence)) return { tags: [], body: lines };
    var body = [lines[0], rest.slice(plan.sentence.length).trim()].filter(Boolean);
    // Nate has no extra non-appearance sentence: keep both supplied first-line facts.
    if (body.length === 1) {
      var split = body[0].indexOf('. ');
      if (split !== -1) body = [body[0].slice(0, split + 1), body[0].slice(split + 2)];
    }
    return { tags: plan.tags, body: body };
  }
  function mount(root) {
    destroy();
    root = root || document.getElementById('npc');
    if (!root || typeof root.replaceChildren !== 'function') return api;
    var npcs = Array.isArray(global.WW?.npcs) ? global.WW.npcs : [];
    var session = { root: root, original: Array.from(root.childNodes),
      oldLabel: root.getAttribute('aria-labelledby'), ownClass: !root.classList.contains('ww-npc'),
      disposers: [], index: 0, alive: true, touch: null };
    active = session;
    function on(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      session.disposers.push(function () { target.removeEventListener(event, handler, options); });
    }
    var shell = session.shell = node('div', 'ww-npc-shell');
    var header = node('div', 'ww-npc-heading-row');
    var title = node('h2', 'ww-npc-heading', '도로에서 만나는 사람들');
    title.id = (root.id || 'npc') + '-ui-title';
    session.label = title.id;
    root.setAttribute('aria-labelledby', title.id);
    header.append(title, node('span', 'ww-npc-edition', 'CONTACTS'));
    var page = node('div', 'ww-npc-page');
    page.id = 'contact-page';
    var navigation = node('nav', 'ww-npc-navigation');
    navigation.setAttribute('aria-label', 'NPC 선택');
    function control(id, label, glyph) {
      var button = node('button', 'ww-npc-arrow', glyph);
      button.type = 'button'; button.id = id;
      button.setAttribute('aria-label', label); button.title = label;
      return button;
    }
    var previous = control('npc-prev', '이전 인물', '←');
    var next = control('npc-next', '다음 인물', '→');
    var film = node('div', 'ww-npc-film');
    film.id = 'contact-list';
    film.setAttribute('role', 'group'); film.setAttribute('aria-label', 'NPC 필름 목록');
    var thumbnails = [];
    npcs.forEach(function (npc, index) {
      var button = node('button', 'ww-npc-thumb');
      button.type = 'button'; button.dataset.npcIndex = String(index);
      button.setAttribute('aria-label', String(index + 1) + '. ' + npc.name);
      var frame = node('span', 'ww-npc-thumb-frame');
      frame.setAttribute('aria-hidden', 'true');
      var image = imageFor(npc);
      if (image) frame.append(picture(npc, image, true));
      button.append(frame, node('span', 'ww-npc-thumb-name', npc.name));
      thumbnails.push(button); film.append(button);
    });
    navigation.append(previous, film, next);
    function syncFilmOverflow() {
      if (!session.alive) return;
      var overflow = film.scrollWidth - film.clientWidth > 1;
      var mode = overflow ? 'auto' : 'hidden';
      if (film.style.overflowX !== mode) film.style.overflowX = mode;
      if (!overflow) film.scrollLeft = 0;
    }
    if (typeof global.ResizeObserver === 'function') {
      var filmObserver = new global.ResizeObserver(syncFilmOverflow);
      filmObserver.observe(film);
      session.disposers.push(function () { filmObserver.disconnect(); });
    } else on(global, 'resize', syncFilmOverflow);
    var footer = node('div', 'ww-npc-footer');
    var counter = node('span', 'ww-npc-counter');
    counter.id = 'npc-counter'; counter.setAttribute('role', 'status'); counter.setAttribute('aria-live', 'polite');
    var hint = node('span', 'ww-npc-hint', '← → 키 · 터치로 선택');
    footer.append(hint);
    shell.append(header, page, navigation, footer);
    root.classList.add('ww-npc'); root.replaceChildren(shell);
    function select(index, scroll, focus) {
      if (!session.alive || !npcs.length) return;
      session.index = (index + npcs.length) % npcs.length;
      var npc = npcs[session.index];
      var content = parts(npc);
      var spread = node('article', 'ww-npc-spread');
      spread.dataset.palette = session.index % 2 ? 'cool' : 'warm';
      var portrait = node('figure', 'ww-npc-polaroid');
      portrait.setAttribute('data-motion', 'tilt');
      var image = imageFor(npc);
      if (image) portrait.append(picture(npc, image, false));
      var copy = node('div', 'ww-npc-copy');
      var korean = node('h3', 'ww-npc-name', npc.name);
      korean.setAttribute('data-motion', 'reveal');
      var english = node('p', 'ww-npc-english', npc.english);
      english.setAttribute('data-motion', 'reveal');
      var tags = node('ul', 'ww-npc-traits');
      tags.setAttribute('aria-label', '외형'); tags.setAttribute('data-motion', 'reveal');
      content.tags.forEach(function (tag) { tags.append(node('li', 'ww-npc-trait', tag)); });
      var details = node('div', 'ww-npc-details');
      content.body.forEach(function (text) {
        var paragraph = node('p', '', text);
        paragraph.setAttribute('data-motion', 'reveal'); details.append(paragraph);
      });
      copy.append(korean, english);
      if (content.tags.length) copy.append(tags);
      copy.append(details); spread.append(portrait, copy); page.replaceChildren(spread);
      thumbnails.forEach(function (button, i) {
        button.setAttribute('aria-pressed', String(i === session.index));
        button.tabIndex = i === session.index ? 0 : -1;
      });
      counter.textContent = String(session.index + 1).padStart(2, '0') + ' / ' + String(npcs.length).padStart(2, '0');
      var selected = thumbnails[session.index];
      if (scroll) {
        var limit = Math.max(0, film.scrollWidth - film.clientWidth);
        // A fitted strip must not move for subpixel rounding or selection changes.
        if (limit <= 1) film.scrollLeft = 0;
        else {
          var left = selected.offsetLeft - film.offsetLeft - (film.clientWidth - selected.clientWidth) / 2;
          left = Math.max(0, Math.min(limit, left));
          var reduce = global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          if (film.scrollTo) film.scrollTo({ left: left, behavior: reduce ? 'instant' : 'smooth' });
          else film.scrollLeft = left;
        }
      }
      if (focus) selected.focus({ preventScroll: true });
      global.WWMotion?.refresh(root);
    }
    on(previous, 'click', function () { select(session.index - 1, true, false); });
    on(next, 'click', function () { select(session.index + 1, true, false); });
    on(film, 'click', function (event) {
      var button = event.target.closest('[data-npc-index]');
      if (button && film.contains(button)) select(Number(button.dataset.npcIndex), false, false);
    });
    on(film, 'keydown', function (event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      var index = event.key === 'Home' ? 0 : event.key === 'End' ? npcs.length - 1 :
        session.index + (event.key === 'ArrowRight' ? 1 : -1);
      select(index, true, true);
    });
    on(page, 'pointerdown', function (event) {
      if (event.pointerType === 'touch') session.touch = { x: event.clientX, y: event.clientY, id: event.pointerId };
    }, { passive: true });
    on(page, 'pointerup', function (event) {
      var start = session.touch; session.touch = null;
      if (!start || start.id !== event.pointerId) return;
      var dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.4) select(session.index + (dx < 0 ? 1 : -1), true, false);
    }, { passive: true });
    on(page, 'pointercancel', function () { session.touch = null; }, { passive: true });
    if (npcs.length) select(0, false, false);
    else { previous.disabled = next.disabled = true; counter.textContent = '00 / 00'; }
    syncFilmOverflow();
    return api;
  }
  function destroy() {
    var session = active;
    if (!session) return api;
    active = null; session.alive = false;
    session.disposers.splice(0).forEach(function (dispose) { dispose(); });
    if (session.shell.parentNode === session.root) session.root.replaceChildren.apply(session.root, session.original);
    if (session.ownClass) session.root.classList.remove('ww-npc');
    if (session.root.getAttribute('aria-labelledby') === session.label) {
      if (session.oldLabel === null) session.root.removeAttribute('aria-labelledby');
      else session.root.setAttribute('aria-labelledby', session.oldLabel);
    }
    global.WWMotion?.refresh(session.root);
    return api;
  }
  var api = Object.freeze({ mount: mount, destroy: destroy });
  global.WWNPCUI = api;
})(window);
