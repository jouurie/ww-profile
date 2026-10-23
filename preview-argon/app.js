'use strict';

(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const { escapeHTML, renderStructuredText, renderAll } = window.WWRender;

  /* 1. 초기 전체 섹션 렌더링 */
  renderAll(window.WW);

  /* 2. 8개 화면 라우팅 및 가이드 앵글 이동 */
  const showPanel = (id, focus = false) => {
    if (!$('#' + id)?.classList.contains('panel')) id = 'intro';
    $$('.panel').forEach((p) => {
      p.hidden = p.id !== id;
    });
    document.body.classList.toggle('ww-landing', id === 'home');
    const footer = document.querySelector('body > footer');
    if (footer) footer.hidden = false;
    $$('.chapter-nav a').forEach((a) => {
      if (a.hash === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (focus) {
      window.scrollTo({
        top: 0,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      });
    }
    document.title =
      id === 'intro' || id === 'home'
        ? '와이어트, 웨이드'
        : `${$('#' + id + ' h2')?.textContent || '로즈'} · 와이어트, 웨이드`;
  };

  function route() {
    const view = window.WWPageShell?.resolve();
    if (view?.view === 'home') {
      showPanel('home', true);
      return;
    }
    const id = location.hash.slice(1) || 'intro';
    if (id.startsWith('guide-')) {
      showPanel('guide');

    } else {
      showPanel(id, true);
    }
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  route();

  $$('[data-guide]').forEach((a) =>
    a.addEventListener('click', () => {
      const d = document.getElementById(a.dataset.guide);
      if (d) d.open = true;
    })
  );

  /* 3. 가이드 지침 원문 복사 버튼 */
  $$('.copy-line').forEach((b) =>
    b.addEventListener('click', async () => {
      const proseEl = document.getElementById(b.dataset.copy)?.querySelector('.prose');
      const raw = proseEl?.getAttribute('data-raw') || proseEl?.textContent || '';
      try {
        await navigator.clipboard.writeText(raw);
        b.textContent = '복사 완료';
        setTimeout(() => (b.textContent = '원문 복사'), 1800);
      } catch {
        b.textContent = '본문을 선택해 복사해 주세요';
      }
    })
  );

  /* 4. THE BEAST 트럭 구역 전환 및 슬리퍼 캡 커튼 개폐 */
  const truckZones = {
    front: [
      '01 / CAB',
      '앞좌석',
      '운전석과 조수석 사이에 낡은 콘솔과 차량 무전기가 있습니다.'
    ],
    sleeper: [
      '02 / SLEEPER',
      '커튼 뒤 슬리퍼 캡',
      '커튼을 닫으면 침대 쪽이 가려집니다. 문을 열면 주유소 불빛과 직원의 시선이 바로 들어옵니다.'
    ],
    records: [
      '03 / RECORDS',
      '장부와 영수증',
      '조수석이나 침대 옆에 보관합니다. 형제는 정차지에서 쓸 이름을 서류에 고쳐 적습니다.'
    ]
  };

  function setTruck(id) {
    const d = truckZones[id] || truckZones.front;
    if ($('#truck-number')) $('#truck-number').textContent = d[0];
    if ($('#truck-zone')) $('#truck-zone').textContent = d[1];
    if ($('#truck-description')) $('#truck-description').textContent = d[2];
    $$('[data-truck]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.truck === id))
    );
    const curtainBtn = $('#curtain');
    const curtainInside = $('#curtain-inside');
    if (curtainBtn) {
      curtainBtn.hidden = id !== 'sleeper';
      curtainBtn.setAttribute('aria-expanded', 'false');
      curtainBtn.innerHTML = '<span>커튼 열기</span><b>＋</b>';
    }
    if (curtainInside) {
      curtainInside.hidden = true;
    }
  }

  $$('[data-truck]').forEach((b) =>
    b.addEventListener('click', () => setTruck(b.dataset.truck))
  );
  setTruck('front');

  $('#curtain')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.innerHTML = open
      ? '<span>커튼 열기</span><b>＋</b>'
      : '<span>커튼 닫기</span><b>−</b>';
    const inside = $('#curtain-inside');
    if (inside) inside.hidden = open;
  });

  /* 5. NPC 연락처 장부 (Shift+휠, 좌우 화살표, 터치 스와이프, 버튼 전환) */
  const contactListEl = $('#contact-list');
  const contactPageEl = $('#contact-page');
  let selectedNPC = 0;

  if (contactListEl && Array.isArray(WW.npcs)) {
    contactListEl.innerHTML = WW.npcs
      .map(
        (n, i) =>
          `<button type="button" data-npc="${i}" aria-pressed="${i === 0}">` +
            `<span class="contact-number">${String(i + 1).padStart(2, '0')}</span>` +
            `<span><strong>${escapeHTML(n.name)}</strong><small>${escapeHTML(n.english)}</small></span>` +
          `</button>`
      )
      .join('');
  }

  function selectNPC(i, scroll = false) {
    if (!Array.isArray(WW.npcs) || !WW.npcs.length) return;
    i = (i + WW.npcs.length) % WW.npcs.length;
    selectedNPC = i;
    const n = WW.npcs[i];

    $$('[data-npc]').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.npc) === i))
    );
    if ($('#npc-counter')) {
      $('#npc-counter').textContent = `${String(i + 1).padStart(2, '0')} / ${String(WW.npcs.length).padStart(2, '0')}`;
    }

    const initials = n.english
      .split(' ')
      .map((x) => x[0])
      .join('');

    if (contactPageEl) {
      contactPageEl.innerHTML =
        `<div class="portrait" aria-label="${escapeHTML(n.name)} 이미지 자리">${escapeHTML(initials)}</div>` +
        `<div>` +
          `<p class="eyebrow">CONTACT / ${String(i + 1).padStart(2, '0')}</p>` +
          `<h3>${escapeHTML(n.name)}</h3>` +
          `<p class="english">${escapeHTML(n.english)}</p>` +
          `<div class="prose">${renderStructuredText(n.text)}</div>` +
        `</div>` +
        `<p class="contact-page-number"><span>RHODES / CONTACT BOOK</span><span>${String(i + 1).padStart(2, '0')} — ${String(WW.npcs.length).padStart(2, '0')}</span></p>`;
    }

    if (scroll) {
      const target=$('[data-npc="'+i+'"]');if(target&&contactListEl)contactListEl.scrollTo({left:target.offsetLeft-(contactListEl.clientWidth-target.clientWidth)/2,behavior:'smooth'});
    }
  }

  $$('[data-npc]').forEach((b) =>
    b.addEventListener('click', () => selectNPC(Number(b.dataset.npc)))
  );
  selectNPC(0);
  $$('[data-npc-directory]').forEach(button=>button.addEventListener('click',()=>selectNPC(Number(button.dataset.npcDirectory),true)));

  $('#npc-prev')?.addEventListener('click', () => selectNPC(selectedNPC - 1, true));
  $('#npc-next')?.addEventListener('click', () => selectNPC(selectedNPC + 1, true));

  contactListEl?.addEventListener(
    'wheel',
    (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        e.currentTarget.scrollLeft += Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      }
    },
    { passive: false }
  );

  contactListEl?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectNPC(selectedNPC + (e.key === 'ArrowRight' ? 1 : -1), true);
      $(`[data-npc="${selectedNPC}"]`)?.focus({ preventScroll: true });
    }
  });

  let contactTouch = null;
  contactPageEl?.addEventListener(
    'touchstart',
    (e) => {
      contactTouch = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    },
    { passive: true }
  );

  contactPageEl?.addEventListener(
    'touchend',
    (e) => {
      if (!contactTouch) return;
      const dx = e.changedTouches[0].clientX - contactTouch.x;
      const dy = e.changedTouches[0].clientY - contactTouch.y;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 45) {
        selectNPC(selectedNPC + (dx < 0 ? 1 : -1), true);
      }
      contactTouch = null;
    },
    { passive: true }
  );

  /* 6. Connect the supplied video-free deck DOM to the extracted Tistory engine. */
  const engine=window.WWRadioEngine;
  const audioHost=$('#rie-audio-engine-host');
  const clock=value=>{const sec=Math.max(0,Math.floor(Number(value)||0));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');};
  if(engine&&audioHost){
    const tracks=engine.state.tracks;
    $('#track-list').innerHTML=tracks.map((track,index)=>`<button type="button" class="track-card" data-radio-track="${index}" role="listitem"><span class="tc-num">${String(index+1).padStart(2,'0')}</span><span class="tc-info"><span class="tc-title">${escapeHTML(track.name.split(' | ').slice(1).join(' | ')||track.name)}</span></span><span class="tc-badge">SELECT</span></button>`).join('');
    engine.init(audioHost,state=>{
      $('#radio-current-title').textContent=state.tracks[state.index].name.replace(/^와이어트,\s*웨이드\s*\|\s*/,'');
      $('#radio-trk-num').textContent=`TRK ${String(state.index+1).padStart(2,'0')} / ${state.tracks.length}`;
      $('#radio-status-badge').textContent=state.playing?'ON AIR · PLAYING':'STANDBY';
      $('#radio-status-msg').textContent=state.error||(state.playing?'재생 중':'재생 버튼을 눌러 시작하세요.');
      $('#radio-play').setAttribute('aria-pressed',String(state.playing));$('#radio-play').setAttribute('aria-label',state.playing?'일시정지':'재생');
      window.WWRadioControls?.updatePlay(state.playing);
      $('#cassette-window').dataset.playing=String(state.playing);
      $('#radio-elapsed').textContent=clock(state.current);$('#radio-duration').textContent=clock(state.duration);
      $('#radio-seek').value=String(state.duration?state.current/state.duration*100:0);
      $('#radio-seek').disabled=!state.ready||!state.duration;
      $('#radio-vol-val').textContent=Math.round(state.volume)+'%';$('#radio-volume').value=String(state.volume);
      $('#radio-fallback-link').href=state.tracks[state.index].url;
      $$('[data-radio-track]').forEach(button=>{const active=Number(button.dataset.radioTrack)===state.index;button.setAttribute('aria-current',String(active));button.querySelector('.tc-badge').textContent=active?(state.playing?'PLAYING':'SELECTED'):'SELECT';});
    });
    $('#radio-play').addEventListener('click',()=>engine.toggle());
    $('#radio-prev').addEventListener('click',()=>engine.prev());$('#radio-next').addEventListener('click',()=>engine.next());
    $('#radio-seek').addEventListener('input',event=>engine.seek(Number(event.target.value)/100*engine.state.duration));
    $('#radio-volume').addEventListener('input',event=>engine.volume(Number(event.target.value)));
    $$('[data-radio-track]').forEach(button=>button.addEventListener('click',()=>engine.select(Number(button.dataset.radioTrack),true)));
    const filter=()=>{const query=$('#radio-search').value.trim().toLocaleLowerCase();let count=0;$$('[data-radio-track]').forEach(button=>{button.hidden=!tracks[Number(button.dataset.radioTrack)].name.toLocaleLowerCase().includes(query);if(!button.hidden)count++;});$('#radio-count-label').textContent=count+' TRACKS';};
    $('#radio-search').addEventListener('input',filter);$('#radio-search-clear').addEventListener('click',()=>{$('#radio-search').value='';filter();});
    /* These optional supplied controls need a separate product decision/API; keep them honest. */
    $('#radio-repeat').disabled=true;$('#radio-repeat').title='이 미리보기에서는 지원하지 않습니다.';
    $('#radio-shuffle').disabled=true;$('#radio-shuffle').title='이 미리보기에서는 지원하지 않습니다.';
    window.addEventListener('pagehide',()=>engine.destroy(),{once:true});
  }

  /* 7. 캐릭터 드롭다운 닫기 */
  document.addEventListener('click', (e) => {
    const charDetails = $('.characters');
    if (charDetails && !e.target.closest('.characters')) {
      charDetails.open = false;
    }
  });
})();

(()=>{document.querySelector('.characters')?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary').focus();}});document.querySelector('#character-menu')?.addEventListener('click',()=>{document.querySelector('.characters').open=false;});})();
