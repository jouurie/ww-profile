/* Six always-open scene photographs. Source content remains in WW. */
(function (global) {
  'use strict';
  var sceneImages = {"01":"https://cdn.imgchest.com/files/9b65036dea36.png","02":"https://cdn.imgchest.com/files/83c52183f6b5.png","03":"https://cdn.imgchest.com/files/15f834822cc5.png","04":"https://cdn.imgchest.com/files/1a2529d842f4.png","05":"https://cdn.imgchest.com/files/5b1541f2ad05.png","06":"https://cdn.imgchest.com/files/9d1a1aa8a1b4.png"};
  var labels = ['납치 직후', '납치 후 며칠', '납치 후 며칠', '납치 후 일주일', '납치 후 몇 주', '자율 도입부'];

  function openingParts(source, index) {
    var text = String(source).replace(/^[⑴⑵⑶⑷⑸⑹]\s*/u, '');
    var warning = text.match(/^🔞\s*/u);
    if (warning) text = text.slice(warning[0].length);
    var prefix = text.match(/^(납치 직후|납치 후 [^,:，：\n]+|자율 도입부)\s*[,，:：]\s*/u);
    return {
      title: (prefix ? prefix[1] : labels[index]) + (warning ? ' 🔞' : ''),
      body: prefix ? text.slice(prefix[0].length) : text
    };
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Build real text and links without interpreting source text as HTML.
  function prose(className, source) {
    var node = element('div', className);
    var text = String(source || '').replace(/#{4}/g, '').replace(/🔗/gu, '');
    var pattern = /https?:\/\/[^\s<>]+/g;
    var cursor = 0;
    var match;
    while ((match = pattern.exec(text))) {
      node.append(document.createTextNode(text.slice(cursor, match.index)));
      var link = element('a', '', match[0]);
      link.href = match[0];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      node.append(link);
      cursor = pattern.lastIndex;
    }
    node.append(document.createTextNode(text.slice(cursor)));
    return node;
  }

  function mount(root) {
    var scope = root || document;
    var panel = scope.matches && scope.matches('#openings') ? scope : scope.querySelector('#openings');
    var data = global.WW;
    if (!panel || !data || !Array.isArray(data.openings) || data.openings.length !== 6) return false;

    var content = document.createDocumentFragment();
    var heading = element('header', 'ww-openings-heading');
    var title = element('h2', '', '도입부');
    title.id = 'openings-title';
    heading.append(title);
    content.append(heading);

    var grid = element('div', 'ww-openings-grid');
    grid.id = 'opening-list';
    data.openings.forEach(function (source, index) {
      var parts = openingParts(source, index);
      var number = String(index + 1).padStart(2, '0');
      var card = element('article', 'ww-opening-card');
      card.dataset.opening = number;
      card.dataset.motion = 'reveal';
      var header = element('header', 'ww-opening-card-head');
      var count = element('span', 'ww-opening-number', number);
      count.setAttribute('aria-hidden', 'true');
      var name = element('h3', '', parts.title);
      name.id = 'ww-opening-title-' + number;
      card.setAttribute('aria-labelledby', name.id);
      header.append(count, name);
      var photo = element('div', 'ww-opening-photo');
      photo.dataset.motion = 'tilt';
      var image = element('img', '');
      image.src = sceneImages[number];
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = 960;
      image.height = 640;
      photo.append(image);
      var body = prose('ww-openings-prose ww-opening-body', parts.body);
      body.dataset.openingSource = number;
      card.append(header, photo, body);
      grid.append(card);
    });
    content.append(grid);
    panel.classList.add('ww-openings-ui');
    panel.setAttribute('aria-labelledby', 'openings-title');
    panel.replaceChildren(content);
    if (global.WWMotion && typeof global.WWMotion.refresh === 'function') global.WWMotion.refresh(panel);
    return panel;
  }

  global.WWOpeningsUI = { mount: mount };
})(window);
