/* NPC layout only. Original names, order and unique prose stay in WW.npcs. */
(function (global) {
  'use strict';
  var active = null;
  // Percentages describe a point in the original image; scale is relative to
  // the square thumbnail viewport. Override by English name in WWNPCImages.
  var portraits = {
    'Callum Rusk': { src: 'https://cdn.imgchest.com/files/2ba9b50a0728.png', faceX: 43.5, faceY: 26, scale: 2.8 },
    'Marlene Pike': { src: 'https://cdn.imgchest.com/files/736f945051fd.png', faceX: 51.5, faceY: 23, scale: 2.4 },
    'Rudy Kline': { src: 'https://cdn.imgchest.com/files/c2ce5b9643a8.png', faceX: 48.5, faceY: 16, scale: 3.4 },
    'Saul Aguirre': { src: 'https://cdn.imgchest.com/files/fd72b5753381.png', faceX: 50.5, faceY: 16, scale: 2.9 },
    'Dottie Mercer': { src: 'https://cdn.imgchest.com/files/43e2a74b2ba0.png', faceX: 50, faceY: 29, scale: 2.6 },
    'Bowie Maddox': { src: 'https://cdn.imgchest.com/files/31a142f83ba7.png', faceX: 53, faceY: 28, scale: 2.7 },
    'Vince Crowder': { src: 'https://cdn.imgchest.com/files/a9c3284b34b0.png', faceX: 53, faceY: 28.5, scale: 2.6 },
    'Lena Vosk': { src: 'https://cdn.imgchest.com/files/6993d9fe95b9.png', faceX: 47, faceY: 25, scale: 2.9 },
    'Grady Pell': { src: 'https://cdn.imgchest.com/files/0d86415b124e.png', faceX: 52, faceY: 31.5, scale: 2.4 },
    'Nate Pell': { src: 'https://cdn.imgchest.com/files/fae6c871634b.png', faceX: 44.5, faceY: 34.5, scale: 2.6 }
  };
  var appearance = {
    'Callum Rusk': { sentence: '검은 올백머리와 가늘고 검은 눈을 지닌 마른 중년 남자입니다.', tags: ['검은 올백머리', '좁은 검은 눈', '마른 중년 남자'] },
    'Marlene Pike': { sentence: '짧은 붉은 곱슬머리와 적갈색 눈의 피곤해 보이는 미인입니다.', tags: ['짧은 붉은 곱슬머리', '적갈색 눈', '피곤한 미인'] },
    'Rudy Kline': { sentence: '짧게 민 검은 머리와 검은 눈에 큰 체격을 지녔습니다.', tags: ['짧게 민 검은 머리', '검은 눈', '큰 체격'] },
    'Saul Aguirre': { sentence: '매끈하게 넘긴 검은 머리와 호박색 눈을 지녔습니다.', tags: ['매끈하게 넘긴 검은 머리', '호박색 눈'] },
    'Dottie Mercer': { sentence: '탈색 금발 보브컷과 붉은기 도는 갈색 눈을 지녔습니다.', tags: ['탈색 금발 보브컷', '붉은기 도는 갈색 눈'] },
    'Bowie Maddox': { sentence: '헝클어진 검은 머리와 검은 눈에 햇볕에 탄 거구입니다.', tags: ['헝클어진 검은 머리', '검은 눈', '햇볕에 탄 거구'] },
    'Vince Crowder': { sentence: '짙은 갈색 샤기컷과 가늘고 푸른 눈, 마른 체격에 잘생긴 얼굴을 지녔습니다.', tags: ['짙은 갈색 샤기컷', '좁은 푸른 눈', '마른 체격', '잘생긴 얼굴'] },
    'Lena Vosk': { sentence: '잿빛이 섞인 짧고 짙은 금발에 헤이즐브라운 눈을 지녔습니다.', tags: ['잿빛이 섞인 짧고 짙은 금발', '헤이즐브라운 눈'] },
    'Grady Pell': { sentence: '헝클어진 은회색 머리와 회색 눈을 지녔습니다.', tags: ['은회색 헝클어진 머리', '회색 눈'] },
    'Nate Pell': { sentence: '아버지와 닮은 은회색 머리와 회색 눈에 아직 앳된 얼굴을 지녔습니다.', tags: ['아버지와 닮은 은회색 머리', '회색 눈', '아직 앳된 얼굴'] }
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
    el.style.setProperty('--ww-npc-photo-x', image.faceX + '%');
    el.style.setProperty('--ww-npc-photo-y', image.faceY + '%');
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
  var CATALOG = "<div class=\"ww-npc-catalog\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-d0\" aria-label=\"캘럼 러스크 설명 보기\" checked><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s0\" aria-label=\"캘럼 러스크 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s1\" aria-label=\"마를린 파이크 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s2\" aria-label=\"루디 클라인 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s3\" aria-label=\"사울 아기레 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s4\" aria-label=\"도티 머서 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s5\" aria-label=\"보위 매덕스 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s6\" aria-label=\"빈스 크라우더 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s7\" aria-label=\"레나 보스크 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s8\" aria-label=\"그래디 펠 사진 선택\"><input class=\"ww-npc-state\" type=\"radio\" name=\"ww-npc-catalog-r58\" id=\"ww-npc-s9\" aria-label=\"네이트 펠 사진 선택\"><div class=\"ww-npc-heading-row ww-section-head\"><h2 class=\"ww-npc-heading ww-section-title\">도로에서 만나는 사람들</h2><span class=\"ww-npc-edition\">CONTACTS</span><p class=\"head-desc\"><span class=\"ww-desc-phrase\">브로커와 모텔 지배인, 트럭커 등</span> <span class=\"ww-desc-phrase\">도로에서 마주치는 10명을 소개합니다.</span></p></div><div class=\"ww-npc-catalog-controls\" role=\"group\" aria-label=\"NPC 선택\"><span class=\"ww-npc-step ww-npc-step-0\"><label for=\"ww-npc-s9\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s1\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-1\"><label for=\"ww-npc-s0\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s2\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-2\"><label for=\"ww-npc-s1\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s3\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-3\"><label for=\"ww-npc-s2\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s4\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-4\"><label for=\"ww-npc-s3\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s5\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-5\"><label for=\"ww-npc-s4\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s6\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-6\"><label for=\"ww-npc-s5\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s7\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-7\"><label for=\"ww-npc-s6\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s8\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-8\"><label for=\"ww-npc-s7\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s9\" aria-label=\"다음 인물\">→</label></span><span class=\"ww-npc-step ww-npc-step-9\"><label for=\"ww-npc-s8\" aria-label=\"이전 인물\">←</label><label for=\"ww-npc-s0\" aria-label=\"다음 인물\">→</label></span></div><div class=\"ww-npc-catalog-rail\" role=\"group\" aria-label=\"NPC 사진 목록\"><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s0\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/2ba9b50a0728.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:43.5% 26%\"></span><span class=\"ww-npc-thumb-name\">캘럼 러스크</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s1\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/736f945051fd.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:51.5% 23%\"></span><span class=\"ww-npc-thumb-name\">마를린 파이크</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s2\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/c2ce5b9643a8.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:48.5% 16%\"></span><span class=\"ww-npc-thumb-name\">루디 클라인</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s3\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/fd72b5753381.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:50.5% 16%\"></span><span class=\"ww-npc-thumb-name\">사울 아기레</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s4\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/43e2a74b2ba0.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:50% 29%\"></span><span class=\"ww-npc-thumb-name\">도티 머서</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s5\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/31a142f83ba7.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:53% 28%\"></span><span class=\"ww-npc-thumb-name\">보위 매덕스</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s6\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/a9c3284b34b0.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:53% 28.5%\"></span><span class=\"ww-npc-thumb-name\">빈스 크라우더</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s7\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/6993d9fe95b9.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:47% 25%\"></span><span class=\"ww-npc-thumb-name\">레나 보스크</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s8\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/0d86415b124e.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:52% 31.5%\"></span><span class=\"ww-npc-thumb-name\">그래디 펠</span></label><label class=\"ww-npc-catalog-thumb\" for=\"ww-npc-s9\"><span class=\"ww-npc-thumb-frame\"><img src=\"https://cdn.imgchest.com/files/fae6c871634b.png\" alt=\"\" loading=\"lazy\" width=\"832\" height=\"1216\" style=\"object-position:44.5% 34.5%\"></span><span class=\"ww-npc-thumb-name\">네이트 펠</span></label></div><div class=\"ww-npc-catalog-grid\"><article class=\"ww-npc-catalog-card\" data-npc-index=\"0\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/2ba9b50a0728.png\" alt=\"캘럼 러스크\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:43.5%;--ww-npc-photo-y:26%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>불법 화물도 중개하는 야드 브로커입니다.</p><p>말수는 적지만 이미 계산을 끝낸 듯한 인상을 줍니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s0\"><span>캘럼 러스크 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-0\" aria-label=\"캘럼 러스크 원본 확대\"><span>캘럼 러스크 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">캘럼 러스크</h3><p class=\"ww-npc-english\">Callum Rusk</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">검은 올백머리</li><li class=\"ww-npc-trait\">좁은 검은 눈</li><li class=\"ww-npc-trait\">마른 중년 남자</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-0\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-0\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/2ba9b50a0728.png\" alt=\"캘럼 러스크\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>캘럼 러스크</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"1\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/736f945051fd.png\" alt=\"마를린 파이크\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:51.5%;--ww-npc-photo-y:23%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>합법 화물 송장과 뒷거래 일정을 다루는 브로커입니다.</p><p>다이너 공중전화 곁에서 젖은 서류와 식은 커피를 끼고 있습니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s1\"><span>마를린 파이크 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-1\" aria-label=\"마를린 파이크 원본 확대\"><span>마를린 파이크 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">마를린 파이크</h3><p class=\"ww-npc-english\">Marlene Pike</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">짧은 붉은 곱슬머리</li><li class=\"ww-npc-trait\">적갈색 눈</li><li class=\"ww-npc-trait\">피곤한 미인</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-1\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-1\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/736f945051fd.png\" alt=\"마를린 파이크\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>마를린 파이크</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"2\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/c2ce5b9643a8.png\" alt=\"루디 클라인\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:48.5%;--ww-npc-photo-y:16%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>불법 부품도 거래하는 폐차장 주인입니다.</p><p>찌그러진 범퍼를 보고도 농담부터 던집니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s2\"><span>루디 클라인 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-2\" aria-label=\"루디 클라인 원본 확대\"><span>루디 클라인 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">루디 클라인</h3><p class=\"ww-npc-english\">Rudy Kline</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">짧게 민 검은 머리</li><li class=\"ww-npc-trait\">검은 눈</li><li class=\"ww-npc-trait\">큰 체격</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-2\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-2\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/c2ce5b9643a8.png\" alt=\"루디 클라인\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>루디 클라인</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"3\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/fd72b5753381.png\" alt=\"사울 아기레\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:50.5%;--ww-npc-photo-y:16%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>냉장 화물의 합법 운송 서류를 챙기고, 불법 화물을 받을 곳도 관리합니다.</p><p>차가운 하역장 조명 아래에서는 더 조용해집니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s3\"><span>사울 아기레 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-3\" aria-label=\"사울 아기레 원본 확대\"><span>사울 아기레 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">사울 아기레</h3><p class=\"ww-npc-english\">Saul Aguirre</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">매끈하게 넘긴 검은 머리</li><li class=\"ww-npc-trait\">호박색 눈</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-3\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-3\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/fd72b5753381.png\" alt=\"사울 아기레\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>사울 아기레</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"4\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/43e2a74b2ba0.png\" alt=\"도티 머서\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:50%;--ww-npc-photo-y:29%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>모텔과 주유 계정을 이용한 뒷거래에 밝은 여자입니다.</p><p>웃으며 방 열쇠를 건네고 손님의 이름을 오래 기억합니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s4\"><span>도티 머서 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-4\" aria-label=\"도티 머서 원본 확대\"><span>도티 머서 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">도티 머서</h3><p class=\"ww-npc-english\">Dottie Mercer</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">탈색 금발 보브컷</li><li class=\"ww-npc-trait\">붉은기 도는 갈색 눈</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-4\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-4\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/43e2a74b2ba0.png\" alt=\"도티 머서\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>도티 머서</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"5\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/31a142f83ba7.png\" alt=\"보위 매덕스\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:53%;--ww-npc-photo-y:28%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>일반 화물을 주로 운송하는 라이벌 트럭 운전수입니다.</p><p>주유 펌프 앞에서 크게 떠들며 일부러 남의 길을 막습니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s5\"><span>보위 매덕스 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-5\" aria-label=\"보위 매덕스 원본 확대\"><span>보위 매덕스 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">보위 매덕스</h3><p class=\"ww-npc-english\">Bowie Maddox</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">헝클어진 검은 머리</li><li class=\"ww-npc-trait\">검은 눈</li><li class=\"ww-npc-trait\">햇볕에 탄 거구</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-5\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-5\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/31a142f83ba7.png\" alt=\"보위 매덕스\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>보위 매덕스</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"6\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/a9c3284b34b0.png\" alt=\"빈스 크라우더\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:53%;--ww-npc-photo-y:28.5%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>로즈 형제와 같은 불법 운송판에서 일하는 트럭커입니다.</p><p>지친 기색으로 농담을 던집니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s6\"><span>빈스 크라우더 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-6\" aria-label=\"빈스 크라우더 원본 확대\"><span>빈스 크라우더 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">빈스 크라우더</h3><p class=\"ww-npc-english\">Vince Crowder</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">짙은 갈색 샤기컷</li><li class=\"ww-npc-trait\">좁은 푸른 눈</li><li class=\"ww-npc-trait\">마른 체격</li><li class=\"ww-npc-trait\">잘생긴 얼굴</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-6\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-6\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/a9c3284b34b0.png\" alt=\"빈스 크라우더\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>빈스 크라우더</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"7\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/6993d9fe95b9.png\" alt=\"레나 보스크\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:47%;--ww-npc-photo-y:25%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>합법 배차망과 뒷길 소문을 활용하는 라이벌 배차 담당자입니다.</p><p>짧은 말투는 전화로 들을 때 더욱 선명합니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s7\"><span>레나 보스크 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-7\" aria-label=\"레나 보스크 원본 확대\"><span>레나 보스크 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">레나 보스크</h3><p class=\"ww-npc-english\">Lena Vosk</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">잿빛이 섞인 짧고 짙은 금발</li><li class=\"ww-npc-trait\">헤이즐브라운 눈</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-7\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-7\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/6993d9fe95b9.png\" alt=\"레나 보스크\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>레나 보스크</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"8\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/0d86415b124e.png\" alt=\"그래디 펠\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:52%;--ww-npc-photo-y:31.5%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>합법 운송을 주로 하며 뒷거래에도 발을 걸친 독립 운전수입니다.</p><p>낡은 트럭과 낮은 무전 목소리, 백미러에 오래 남는 헤드라이트가 특징입니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s8\"><span>그래디 펠 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-8\" aria-label=\"그래디 펠 원본 확대\"><span>그래디 펠 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">그래디 펠</h3><p class=\"ww-npc-english\">Grady Pell</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">은회색 헝클어진 머리</li><li class=\"ww-npc-trait\">회색 눈</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-8\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-8\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/0d86415b124e.png\" alt=\"그래디 펠\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>그래디 펠</p></div></article><article class=\"ww-npc-catalog-card\" data-npc-index=\"9\"><div class=\"ww-npc-photo\"><img class=\"ww-npc-catalog-image\" src=\"https://cdn.imgchest.com/files/fae6c871634b.png\" alt=\"네이트 펠\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\" style=\"--ww-npc-photo-x:44.5%;--ww-npc-photo-y:34.5%\"><div class=\"ww-npc-overlay\"><div class=\"ww-npc-overlay-copy\"><p>그래디의 19세(성인) 아들입니다.</p><p>합법 운송을 배우며 아버지의 뒷거래도 접하고 있습니다.</p></div></div><label class=\"ww-npc-photo-control ww-npc-pick\" for=\"ww-npc-s9\"><span>네이트 펠 사진 선택</span></label><button class=\"ww-npc-photo-control ww-npc-clear\" type=\"button\" popovertarget=\"ww-npc-zoom-9\" aria-label=\"네이트 펠 원본 확대\"><span>네이트 펠 원본 확대</span></button></div><div class=\"ww-npc-copy\"><h3 class=\"ww-npc-name\">네이트 펠</h3><p class=\"ww-npc-english\">Nate Pell</p><ul class=\"ww-npc-traits\" aria-label=\"외형\"><li class=\"ww-npc-trait\">아버지와 닮은 은회색 머리</li><li class=\"ww-npc-trait\">회색 눈</li><li class=\"ww-npc-trait\">아직 앳된 얼굴</li></ul></div><div class=\"ww-npc-zoom\" id=\"ww-npc-zoom-9\" popover><button type=\"button\" class=\"ww-npc-zoom-close\" popovertarget=\"ww-npc-zoom-9\" popovertargetaction=\"hide\" aria-label=\"이미지 닫기\">×</button><img src=\"https://cdn.imgchest.com/files/fae6c871634b.png\" alt=\"네이트 펠\" width=\"832\" height=\"1216\" loading=\"lazy\" data-image-viewer=\"off\"><p>네이트 펠</p></div></article></div></div>";
  function mount(root) {
    destroy(); root = root || document.getElementById('npc');
    if (!root) return api;
    var npcs = Array.isArray(global.WW?.npcs) ? global.WW.npcs : [];
    var session = { root: root, original: Array.from(root.childNodes), oldLabel: root.getAttribute('aria-labelledby'), ownClass: !root.classList.contains('ww-npc'), disposers: [], alive: true };
    active = session;
    var shell = document.createElement('div'); shell.innerHTML = CATALOG;
    session.shell = shell.firstElementChild;
    root.classList.add('ww-npc'); root.replaceChildren(session.shell);
    session.label = 'npc-catalog-title';
    root.querySelector('.ww-npc-heading').id = session.label;
    root.setAttribute('aria-labelledby', session.label);
    function on(target, event, handler, options) { target.addEventListener(event, handler, options); session.disposers.push(function () { target.removeEventListener(event, handler, options); }); }
    var inputs = Array.from(root.querySelectorAll('.ww-npc-state'));
    function state() { return inputs.find(function (input) { return input.checked; }); }
    var rail = root.querySelector('.ww-npc-catalog-rail');
    var thumbs = Array.from(rail.querySelectorAll('.ww-npc-catalog-thumb'));
    var picker = node('div', 'ww-npc-catalog-picker ww-rail-navigation');
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-label', 'NPC 인물 선택');
    rail.setAttribute('data-horizontal-scroll', 'off');
    rail.id = 'ww-npc-character-rail';
    var arrows = ['이전 인물', '다음 인물'].map(function (label) {
      var button = node('button', 'ww-rail-arrow');
      button.type = 'button'; button.setAttribute('aria-label', label);
      button.setAttribute('aria-controls', rail.id);
      return button;
    });
    root.querySelector('.ww-npc-catalog-controls').replaceWith(picker);
    picker.append(arrows[0], rail, arrows[1]);
    function reflectSelection() {
      var index = Number(state().id.slice(8));
      thumbs.forEach(function (thumb, i) {
        if (i === index) thumb.setAttribute('aria-current', 'true');
        else thumb.removeAttribute('aria-current');
      });
      var thumb = thumbs[index];
      if (thumb && rail.clientWidth) {
        var strip = rail.getBoundingClientRect(), bounds = thumb.getBoundingClientRect();
        if (bounds.left < strip.left) rail.scrollLeft += bounds.left - strip.left;
        else if (bounds.right > strip.right) rail.scrollLeft += bounds.right - strip.right;
      }
    }
    on(root, 'change', function (event) { if (event.target.matches('.ww-npc-state')) reflectSelection(); });
    on(arrows[0], 'click', function () { choose(Number(state().id.slice(8)) - 1, true, false); });
    on(arrows[1], 'click', function () { choose(Number(state().id.slice(8)) + 1, true, false); });
    reflectSelection();
    function choose(index, selected, focus) {
      var input = document.getElementById('ww-npc-' + (selected ? 's' : 'd') + ((index + npcs.length) % npcs.length));
      if (!input) return;
      var y = global.scrollY; input.checked = true;
      if (focus) input.focus({ preventScroll: true });
      reflectSelection();
      global.scrollTo({ top: y, behavior: 'instant' });
    }
    on(root, 'keydown', function (event) {
      if (!event.target.matches('.ww-npc-state') || !['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      var input = event.target, index = Number(input.id.slice(8)), selected = input.id.charAt(7) === 's';
      if (event.key === 'Enter' || event.key === ' ') { if(input.checked && selected) root.querySelector('#ww-npc-zoom-'+index).showPopover(); else choose(index, true, true); }
      else choose(event.key === 'Home' ? 0 : event.key === 'End' ? npcs.length - 1 : index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1), true, true);
    });
    var narrow = global.matchMedia('(max-width:720px)');
    var descriptions = Array.from(root.querySelectorAll('.ww-npc-photo > .ww-npc-overlay'), function (description) {
      var photo = description.parentElement;
      return { description: description, photo: photo, next: description.nextElementSibling, copy: photo.nextElementSibling };
    });
    function placeDescriptions() {
      descriptions.forEach(function (card) {
        if (narrow.matches) card.copy.append(card.description);
        else card.photo.insertBefore(card.description, card.next);
      });
    }
    on(narrow, 'change', placeDescriptions);
    placeDescriptions();
    function bindGestures() {
      var bindDrag = global.WWHorizontalScroll?.bindGalleryDrag;
      if (!session.alive || !bindDrag) return;
      session.disposers.push(bindDrag(rail));
      root.querySelectorAll('.ww-npc-photo').forEach(function (photo, index) {
        session.disposers.push(bindDrag(photo, {
          accept: function () { return Number(state().id.slice(8)) === index; },
          photoControl: '.ww-npc-photo-control',
          step: function (direction) { choose(index + direction, true, false); }
        }));
      });
    }
    if (global.WWHorizontalScroll) bindGestures();
    else on(document, 'DOMContentLoaded', bindGestures);
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
