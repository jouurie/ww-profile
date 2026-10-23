/* Independent truck gallery; all artwork is newly generated and resolved beside this script. */
(function (global) {
  'use strict';
  var active = null;
  var scriptURL = document.currentScript && document.currentScript.src || document.baseURI;
  var assetBase = new URL('assets/truck-details/', scriptURL).href;
  var categories = [
    { id: 'exterior', label: '외관' }, { id: 'interior', label: '실내' }, { id: 'structure', label: '구조·취침' }
  ];
  var initial = [
    {
      "id": "exterior-overview",
      "title": "외관 전체",
      "group": "exterior",
      "spec": "전체 외관 · Peterbilt 379 계열 커스텀 슬리퍼 트랙터",
      "file": "exterior-overview.png",
      "width": 1536,
      "height": 1024,
      "thumb": "exterior-overview-thumb.png"
    },
    {
      "id": "exterior-front",
      "title": "정면",
      "group": "exterior",
      "spec": "정면 · 긴 보닛과 전면 그릴",
      "file": "exterior-front.png",
      "width": 1536,
      "height": 1024,
      "thumb": "exterior-front-thumb.png"
    },
    {
      "id": "exterior-side",
      "title": "측면·슬리퍼 외관",
      "group": "exterior",
      "spec": "캡 뒤 슬리퍼 외관 · 창·출입부·하부 연료 탱크",
      "file": "exterior-side.png",
      "width": 1536,
      "height": 1024,
      "thumb": "exterior-side-thumb.png"
    },
    {
      "id": "exterior-rear",
      "title": "후면",
      "group": "exterior",
      "spec": "후면 · 슬리퍼 뒤와 탠덤 후륜",
      "file": "exterior-rear.png",
      "width": 1536,
      "height": 1024,
      "thumb": "exterior-rear-thumb.png"
    },
    {
      "id": "exhaust-stacks",
      "title": "배기 스택",
      "group": "exterior",
      "spec": "캡 양쪽의 배기 스택",
      "file": "exhaust-stacks.png",
      "width": 1536,
      "height": 1024,
      "thumb": "exhaust-stacks-thumb.png"
    },
    {
      "id": "tandem-axles",
      "title": "탠덤 후륜",
      "group": "exterior",
      "spec": "뒤쪽의 두 후륜 축",
      "file": "tandem-axles.png",
      "width": 1536,
      "height": 1024,
      "thumb": "tandem-axles-thumb.png"
    },
    {
      "id": "fuel-tank",
      "title": "연료 탱크",
      "group": "exterior",
      "spec": "캡 아래 원통형 연료 탱크",
      "file": "fuel-tank.png",
      "width": 1536,
      "height": 1024,
      "thumb": "fuel-tank-thumb.png"
    },
    {
      "id": "side-steps",
      "title": "사이드 스텝",
      "group": "exterior",
      "spec": "캡 옆 승하차 발판",
      "file": "side-steps.png",
      "width": 1536,
      "height": 1024,
      "thumb": "side-steps-thumb.png"
    },
    {
      "id": "roof-horns",
      "title": "에어 혼·루프 마커",
      "group": "exterior",
      "spec": "루프 위 에어 혼과 마커등",
      "file": "roof-horns.png",
      "width": 1536,
      "height": 1024,
      "thumb": "roof-horns-thumb.png"
    },
    {
      "id": "interior-front",
      "title": "앞좌석 전체",
      "group": "interior",
      "spec": "운전석·조수석 · 사이 통로 약 55~60cm",
      "file": "interior-front.png",
      "width": 1536,
      "height": 1024,
      "thumb": "interior-front-thumb.png"
    },
    {
      "id": "interior-sleeper",
      "title": "슬리퍼 전체",
      "group": "interior",
      "spec": "차량 뒤쪽을 본 슬리퍼 캡",
      "file": "interior-sleeper.png",
      "width": 1536,
      "height": 1024,
      "thumb": "interior-sleeper-thumb.png"
    },
    {
      "id": "transverse-bed",
      "title": "가로 침대",
      "group": "interior",
      "spec": "좌우 약 200cm · 앞뒤 약 110~120cm",
      "file": "transverse-bed.png",
      "width": 1536,
      "height": 1024,
      "thumb": "transverse-bed-thumb.png"
    },
    {
      "id": "upper-storage",
      "title": "상부 수납함",
      "group": "interior",
      "spec": "침대 위쪽 상부 수납",
      "file": "upper-storage.png",
      "width": 1536,
      "height": 1024,
      "thumb": "upper-storage-thumb.png"
    },
    {
      "id": "curtain",
      "title": "커튼",
      "group": "interior",
      "spec": "앞좌석과 슬리퍼 사이의 커튼",
      "file": "curtain.png",
      "width": 1536,
      "height": 1024,
      "thumb": "curtain-thumb.png"
    },
    {
      "id": "fridge-cooler",
      "title": "냉장고·쿨러",
      "group": "interior",
      "spec": "침대 하부의 냉장고와 쿨러",
      "file": "fridge-cooler.png",
      "width": 1536,
      "height": 1024,
      "thumb": "fridge-cooler-thumb.png"
    },
    {
      "id": "personal-storage",
      "title": "개인 수납",
      "group": "interior",
      "spec": "슬리퍼의 개인 수납",
      "file": "personal-storage.png",
      "width": 1536,
      "height": 1024,
      "thumb": "personal-storage-thumb.png"
    },
    {
      "id": "dashboard",
      "title": "대시보드",
      "group": "interior",
      "spec": "앞좌석 대시보드",
      "file": "dashboard.png",
      "width": 1536,
      "height": 1024,
      "thumb": "dashboard-thumb.png"
    },
    {
      "id": "cb-radio",
      "title": "CB 라디오",
      "group": "interior",
      "spec": "차량 무전기와 마이크",
      "file": "cb-radio.png",
      "width": 1536,
      "height": 1024,
      "thumb": "cb-radio-thumb.png"
    },
    {
      "id": "sleeper-foyer",
      "title": "슬리퍼 전실",
      "group": "interior",
      "spec": "커튼 뒤와 침대 앞 · 약 60~70cm",
      "file": "sleeper-foyer.png",
      "width": 1536,
      "height": 1024,
      "thumb": "sleeper-foyer-thumb.png"
    },
    {
      "id": "boot-storage",
      "title": "부츠 수납",
      "group": "interior",
      "spec": "침대 하부 부츠 수납",
      "file": "boot-storage.png",
      "width": 1536,
      "height": 1024,
      "thumb": "boot-storage-thumb.png"
    },
    {
      "id": "lower-drawers",
      "title": "하부 수납함",
      "group": "interior",
      "spec": "침대 하부 서랍",
      "file": "lower-drawers.png",
      "width": 1536,
      "height": 1024,
      "thumb": "lower-drawers-thumb.png"
    },
    {
      "id": "tool-storage",
      "title": "공구 수납",
      "group": "interior",
      "spec": "침대 하부 공구 수납",
      "file": "tool-storage.png",
      "width": 1536,
      "height": 1024,
      "thumb": "tool-storage-thumb.png"
    },
    {
      "id": "floor-lockbox",
      "title": "바닥 잠금함",
      "group": "interior",
      "spec": "슬리퍼 바닥 잠금함",
      "file": "floor-lockbox.png",
      "width": 1536,
      "height": 1024,
      "thumb": "floor-lockbox-thumb.png"
    },
    {
      "id": "ledger-receipts",
      "title": "장부·영수증",
      "group": "interior",
      "spec": "조수석이나 침대 옆에 두는 기록",
      "file": "ledger-receipts.png",
      "width": 1536,
      "height": 1024,
      "thumb": "ledger-receipts-thumb.png"
    },
    {
      "id": "floor-plan",
      "title": "위에서 본 구조",
      "group": "structure",
      "spec": "가로 침대 약 200 × 110~120cm · 슬리퍼 전실 약 60~70cm",
      "file": "floor-plan.png",
      "width": 1536,
      "height": 1024,
      "thumb": "floor-plan-thumb.png"
    },
    {
      "id": "sleep-one",
      "title": "1인 취침",
      "group": "structure",
      "spec": "침대 전체 사용 · 여유 있음",
      "file": "sleep-one.png",
      "width": 1536,
      "height": 1024,
      "thumb": "sleep-one-thumb.png"
    },
    {
      "id": "sleep-two",
      "title": "2인 취침",
      "group": "structure",
      "spec": "1인당 약 55~60cm · 매우 비좁지만 가능",
      "file": "sleep-two.png",
      "width": 1536,
      "height": 1024,
      "thumb": "sleep-two-thumb.png"
    },
    {
      "id": "sleep-three",
      "title": "3인 나란히 불가",
      "group": "structure",
      "spec": "1인당 약 37~40cm · 정상 취침 불가",
      "file": "sleep-three.png",
      "thumb": "sleep-three-thumb.png",
      "width": 1536,
      "height": 1024
    },
    {
      "id": "sleep-floor-option",
      "title": "대안 · 바닥 매트",
      "group": "structure",
      "spec": "침대 2인 + 임시 바닥 매트 1인",
      "file": "sleep-floor-option.png",
      "width": 1536,
      "height": 1024,
      "thumb": "sleep-floor-option-thumb.png"
    },
    {
      "id": "sleep-seat-option",
      "title": "대안 · 빈 조수석",
      "group": "structure",
      "spec": "침대 2인 + 빈 조수석 1인",
      "file": "sleep-seat-option.png",
      "width": 1536,
      "height": 1024,
      "thumb": "sleep-seat-option-thumb.png"
    }
  ];
  var extra = {
    'exterior-overview': ['검은 18륜 피터빌트로, 로즈 형제의 집이자 일터이며 은신처입니다.'],
    'interior-front': ['앞좌석 사이 낡은 콘솔·차량 무전기'],
    'interior-sleeper': ['담요 · 작은 냉장고 · 바닥 잠금함'],
    'sleep-three': ['3명이 나란히 누워 정상적으로 취침할 수는 없습니다. 한 명은 침대 앞 가장자리로 밀려납니다.'],
    'curtain': ['커튼을 닫으면 침대 쪽이 가려집니다.', '문을 열면 주유소 불빛과 직원의 시선이 들어옵니다.'],
    'ledger-receipts': ['장부와 영수증은 조수석이나 침대 옆에 보관합니다.', '정차지에서 쓸 이름을 서류에 고쳐 적습니다.'],
    'floor-plan': ['좌: 운전석 / 우: 조수석', '앞좌석 사이 통로 약 55~60cm']
  };
  var planLabels = [
    ['차량 앞', 50, 4], ['운전석', 33, 24], ['조수석', 66, 24],
    ['커튼', 50, 38], ['전실', 50, 49], ['가로 침대', 51, 76], ['차량 뒤', 50, 96]
  ];
  function node(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function valid(items) {
    var seen = new Set();
    return (Array.isArray(items) ? items : []).filter(function (item) {
      if (!item || !/^[a-z0-9-]+$/.test(item.id || '') || seen.has(item.id)) return false;
      if (!/^[a-z0-9-]+\.png$/.test(item.file || '') || !categories.some(function (group) { return group.id === item.group; })) return false;
      seen.add(item.id);
      return typeof item.title === 'string' && typeof item.spec === 'string';
    });
  }
  function sleepingDiagram(item, thumb) {
    var diagram = node('div', 'wwtruck-sleep-diagram' + (thumb ? ' is-thumbnail' : ''));
    diagram.dataset.sleepDiagram = item.id;
    if (thumb) diagram.setAttribute('aria-hidden', 'true');
    else { diagram.setAttribute('role', 'img'); diagram.setAttribute('aria-label', item.title + ' 배치: ' + item.spec); }
    var background = node('img', 'wwtruck-sleep-background');
    background.src = new URL('sleep-empty.png', assetBase).href;
    background.alt = ''; background.width = 1536; background.height = 1024;
    background.loading = thumb ? 'lazy' : 'eager'; background.decoding = 'async'; background.draggable = false;
    diagram.append(background);
    var positions = item.id === 'sleep-one' ? [[51, 77]] : [[51, 69], [51, 84]];
    if (item.id === 'sleep-three') positions.push([51, 56]);
    if (item.id === 'sleep-floor-option') positions.push([50, 49]);
    if (item.id === 'sleep-seat-option') positions.push([65, 27]);
    positions.forEach(function (position, index) {
      var slot = node('span', 'wwtruck-sleep-slot', '자리 ' + (index + 1));
      slot.dataset.occupant = String(index + 1);
      slot.style.setProperty('--slot-left', position[0] + '%');
      slot.style.setProperty('--slot-top', position[1] + '%');
      if (index === 2 && item.id === 'sleep-three') slot.classList.add('is-outside');
      if (index === 2 && item.id !== 'sleep-three') slot.classList.add('is-alternative');
      diagram.append(slot);
    });
    return diagram;
  }
  function picture(item, thumb) {
    if (/^sleep-/.test(item.id)) return sleepingDiagram(item, thumb);
    var image = node('img', thumb ? 'wwtruck-thumbnail-image' : 'wwtruck-gallery-image');
    var file = thumb && /^[a-z0-9-]+\.png$/.test(item.thumb || '') ? item.thumb : item.file;
    var imageURL = new URL(file, assetBase);
    if (/^sleep-/.test(item.id)) imageURL.searchParams.set('v', '20261023-outline');
    image.src = imageURL.href; image.alt = thumb ? '' : item.title;
    image.width = item.width || 1536; image.height = item.height || 1024;
    image.loading = thumb ? 'lazy' : 'eager'; image.decoding = 'async'; image.draggable = false;
    return image;
  }
  function mount(root, data) {
    destroy();
    if (!root || typeof root.replaceChildren !== 'function') return api;
    var session = { root: root, original: Array.from(root.childNodes), alive: true, listeners: [],
      oldLabel: root.getAttribute('aria-labelledby'), ownClass: !root.classList.contains('wwtruck'),
      selected: 'exterior-overview', group: 'exterior', items: [], request: 0, abort: null };
    active = session;
    function on(target, event, handler) {
      target.addEventListener(event, handler);
      session.listeners.push(function () { target.removeEventListener(event, handler); });
    }
    var shell = session.shell = node('div', 'wwtruck-shell');
    var heading = node('h2', 'wwtruck-heading', '더 비스트');
    heading.id = 'wwtruck-title';
    var stage = node('div', 'wwtruck-gallery-stage');
    var viewer = node('figure', 'wwtruck-viewer');
    viewer.id = 'wwtruck-viewer'; viewer.setAttribute('aria-label', '선택한 트럭 이미지');
    var visual = node('div', 'wwtruck-visual');
    var large = null;
    var overlays = node('div', 'wwtruck-plan-labels');
    overlays.hidden = true;
    planLabels.forEach(function (label) {
      var element = node('span', '', label[0]);
      element.style.left = label[1] + '%'; element.style.top = label[2] + '%';
      overlays.append(element);
    });
    viewer.append(visual, overlays);
    var captions = node('div', 'wwtruck-captions');
    stage.append(viewer, captions);
    var categoryBar = node('div', 'wwtruck-categories');
    categoryBar.setAttribute('role', 'tablist'); categoryBar.setAttribute('aria-label', '트럭 이미지 분류');
    var groups = node('div', 'wwtruck-group-panels');
    var categoryButtons = [], groupPanels = new Map(), thumbnailButtons = new Map(), captionPanels = new Map();
    categories.forEach(function (group) {
      var button = node('button', 'wwtruck-category', group.label);
      button.type = 'button'; button.id = 'wwtruck-category-' + group.id;
      button.dataset.truckGroup = group.id; button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', 'wwtruck-group-' + group.id);
      var panel = node('div', 'wwtruck-group-panel');
      panel.id = 'wwtruck-group-' + group.id; panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      var strip = node('div', 'wwtruck-thumbnail-strip');
      panel.append(strip); groups.append(panel); groupPanels.set(group.id, { panel: panel, strip: strip });
      categoryButtons.push(button); categoryBar.append(button);
    });
    var note = node('p', 'wwtruck-concept-note', '참고용 콘셉트 · 제조사 공식 설계도나 실측·축척 도면이 아닙니다.');
    var status = node('p', 'wwtruck-gallery-status', '');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    shell.append(heading, stage, categoryBar, groups, note, status);
    root.classList.add('wwtruck'); root.setAttribute('aria-labelledby', heading.id); root.replaceChildren(shell);
    function select(id, focus) {
      var item = session.items.find(function (entry) { return entry.id === id; });
      if (!item || !session.alive) return;
      session.selected = id; session.group = item.group;
      if (!large || large.dataset.imageId !== id || large.src !== new URL(item.file, assetBase).href) {
        large = picture(item, false); large.dataset.imageId = id; visual.replaceChildren(large);
      }
      overlays.hidden = id !== 'floor-plan';
      thumbnailButtons.forEach(function (button, key) {
        button.setAttribute('aria-pressed', String(key === id));
        button.tabIndex = key === id ? 0 : -1;
      });
      captionPanels.forEach(function (panel, key) {
        panel.dataset.active = String(key === id); panel.inert = key !== id;
        panel.setAttribute('aria-hidden', String(key !== id));
      });
      categoryButtons.forEach(function (button) {
        var selected = button.dataset.truckGroup === session.group;
        button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      });
      groupPanels.forEach(function (value, key) {
        var selected = key === session.group;
        value.panel.dataset.active = String(selected); value.panel.inert = !selected;
        value.panel.setAttribute('aria-hidden', String(!selected));
      });
      if (focus) thumbnailButtons.get(id)?.focus({ preventScroll: true });
    }
    function render(items) {
      if (!session.alive) return;
      session.items = valid(items);
      if (!session.items.length) return;
      captions.replaceChildren(); captionPanels.clear(); thumbnailButtons.clear();
      groupPanels.forEach(function (value) { value.strip.replaceChildren(); });
      session.items.forEach(function (item) {
        var button = node('button', 'wwtruck-thumbnail');
        button.type = 'button'; button.dataset.truckImage = item.id; button.setAttribute('aria-controls', 'wwtruck-viewer');
        button.append(picture(item, true), node('span', 'wwtruck-thumbnail-title', item.title));
        groupPanels.get(item.group).strip.append(button); thumbnailButtons.set(item.id, button);
        var caption = node('section', 'wwtruck-caption');
        caption.append(node('h3', '', item.title), node('p', 'wwtruck-spec', item.spec));
        (extra[item.id] || []).forEach(function (text) { caption.append(node('p', 'wwtruck-detail', text)); });
        captions.append(caption); captionPanels.set(item.id, caption);
      });
      categoryButtons.forEach(function (button) {
        button.hidden = !session.items.some(function (item) { return item.group === button.dataset.truckGroup; });
      });
      if (!session.items.some(function (item) { return item.id === session.selected; })) session.selected = session.items[0].id;
      select(session.selected, false);
      global.WWMotion?.refresh(root);
    }
    on(groups, 'click', function (event) {
      var button = event.target.closest('[data-truck-image]');
      if (button && groups.contains(button)) select(button.dataset.truckImage, false);
    });
    on(groups, 'keydown', function (event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      var items = session.items.filter(function (item) { return item.group === session.group; });
      var index = items.findIndex(function (item) { return item.id === session.selected; });
      index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 :
        (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
      if (items[index]) select(items[index].id, true);
    });
    on(categoryBar, 'click', function (event) {
      var button = event.target.closest('[data-truck-group]');
      if (!button || !categoryBar.contains(button)) return;
      var item = session.items.find(function (entry) { return entry.group === button.dataset.truckGroup; });
      if (item) select(item.id, false);
    });
    on(categoryBar, 'keydown', function (event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      var buttons = categoryButtons.filter(function (button) { return !button.hidden; });
      var index = buttons.findIndex(function (button) { return button.dataset.truckGroup === session.group; });
      index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      var button = buttons[index];
      var item = session.items.find(function (entry) { return entry.group === button.dataset.truckGroup; });
      if (item) { select(item.id, false); button.focus({ preventScroll: true }); }
    });
    session.render = render; session.status = status;
    render(initial); refresh();
    return api;
  }
  function refresh() {
    var session = active;
    if (!session || typeof global.fetch !== 'function') return Promise.resolve(api);
    var token = ++session.request;
    session.abort?.abort(); session.abort = typeof AbortController === 'function' ? new AbortController() : null;
    return global.fetch(new URL('gallery.json', assetBase).href, { cache: 'no-store', signal: session.abort?.signal }).then(function (response) {
      if (!response.ok) throw Error('catalog');
      return response.json();
    }).then(function (catalog) {
      if (session.alive && token === session.request) session.render(catalog.items);
      return api;
    }).catch(function (error) {
      if (session.alive && token === session.request && error.name !== 'AbortError') session.status.textContent = '';
      return api;
    });
  }
  function destroy() {
    var session = active;
    if (!session) return api;
    active = null; session.alive = false; session.request++; session.abort?.abort();
    session.listeners.splice(0).forEach(function (remove) { remove(); });
    if (session.shell.parentNode === session.root) session.root.replaceChildren.apply(session.root, session.original);
    if (session.ownClass) session.root.classList.remove('wwtruck');
    if (session.root.getAttribute('aria-labelledby') === 'wwtruck-title') {
      if (session.oldLabel === null) session.root.removeAttribute('aria-labelledby');
      else session.root.setAttribute('aria-labelledby', session.oldLabel);
    }
    global.WWMotion?.refresh(session.root);
    return api;
  }
  var api = Object.freeze({ mount: mount, refresh: refresh, destroy: destroy });
  global.WWTruckUI = api;
})(window);
