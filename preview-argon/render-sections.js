'use strict';

window.WWRender = (() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const escapeHTML = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const linkify = (s) =>
    escapeHTML(s).replace(
      /https:\/\/[^\s<>]+/g,
      (u) => `<a href="${u}" target="_blank" rel="noreferrer">링크 ↗</a>`
    );

  function getLabelTone(label) {
    if (label.includes('와이어트')) return 'wyatt';
    if (label.includes('웨이드')) return 'wade';
    if (label.startsWith('!')) return 'cmd';
    return '';
  }

  function inlineLabel(key, value) {
    return '<span class="sq-sub '+getLabelTone(key)+'">'+escapeHTML(key)+'</span> <span class="kv-value">'+linkify(value)+'</span>';
  }
  function formatSubLine(rawLine) {
    const body=rawLine.replace(/^[·↳]\s*/, '').trim();
    const at=body.indexOf(':');
    if(at>0&&at<=22&&!body.startsWith('http'))return '<p class="kv-line">'+inlineLabel(body.slice(0,at).trim(),body.slice(at+1).trim())+'</p>';
    return '<p class="kv-line">'+linkify(body)+'</p>';
  }
  function formatProfileSubLines(lines) {
    const blocks=[];
    for(let i=0;i<lines.length;){
      const match=lines[i].replace(/^[·↳]\s*/, '').trim().match(/^(와이어트|웨이드):\s*(.*)$/);
      if(!match){blocks.push(lines[i].startsWith('<RStatus')?'<pre class="code-box">'+escapeHTML(lines[i])+'</pre>':formatSubLine(lines[i]));i++;continue;}
      const values=[match[2]];let j=i+1;
      while(j<lines.length){const next=lines[j].replace(/^[·↳]\s*/, '').trim().match(/^(와이어트|웨이드):\s*(.*)$/);if(!next||next[1]!==match[1])break;values.push(next[2]);j++;}
      blocks.push(values.length===1?formatSubLine(lines[i]):'<p class="kv-line"><span class="sq-sub '+getLabelTone(match[1])+'">'+escapeHTML(match[1])+'</span> <span class="kv-value">'+values.map(value=>'<span class="kv-value-paragraph">'+linkify(value)+'</span>').join('')+'</span></p>');
      i=j;
    }
    return blocks.join('');
  }
  function renderStructuredText(rawText, mergeProfileLabels=false) {
    const lines=String(rawText||'').split('\n'),blocks=[];
    for(let i=0;i<lines.length;){
      const line=lines[i].trim();if(!line){i++;continue;}
      if(line.startsWith('※')){blocks.push('<aside class="warning-banner-piece">'+linkify(line.replace(/^※\s*/,''))+'</aside>');i++;continue;}
      if(line.startsWith('<RStatus')){blocks.push('<pre class="code-box">'+escapeHTML(line)+'</pre>');i++;continue;}
      if(line.startsWith('▸')){
        const content=line.replace(/^▸\s*/,'');let j=i+1,subs=[];
        while(j<lines.length){const next=lines[j].trim();if(next.startsWith('▸')||next.startsWith('※'))break;if(next)subs.push(next);j++;}
        if(subs.length){
          const entity=/^(와이어트 로즈|웨이드 로즈|더 비스트)\s*\(/.test(content);
          blocks.push('<section class="kv-section'+(entity?' kv-entity':'')+'"><h4 class="kv-heading"><span class="sq-sub '+getLabelTone(content)+'">'+escapeHTML(content)+'</span></h4><div class="kv-section-body">'+(mergeProfileLabels?formatProfileSubLines(subs):subs.map(sub=>sub.startsWith('<RStatus')?'<pre class="code-box">'+escapeHTML(sub)+'</pre>':formatSubLine(sub)).join(''))+'</div></section>');i=j;continue;
        }
        const pair=content.match(/^(.{1,28}?)(?: → | \| |:\s+)([\s\S]+)$/);
        blocks.push('<p class="kv-line">'+(pair&&!content.startsWith('http')?inlineLabel(pair[1],pair[2]):linkify(content))+'</p>');i++;continue;
      }
      blocks.push(formatSubLine(line));i++;
    }
    return '<div class="kv-stack">'+blocks.join('')+'</div>';
  }

  function renderBasicProfile(rawText) {
    return renderStructuredText(rawText,true).replace(/(와이어트 로즈|웨이드 로즈) (\([^<]+\))/g, '$1 <span class="kv-entity-english">$2</span>');
  }

  function makeDetails(items, prefix) {
    return items
      .map(
        (item, i) =>
          `<details id="${prefix}-${i}" ${i === 0 ? 'open' : ''}>` +
            `<summary>${escapeHTML(item.title)}</summary>` +
            `<div class="prose" data-raw="${escapeHTML(item.text)}">${renderStructuredText(item.text)}</div>` +
            (item.title.includes('가이던스') || item.title.includes('요약 지침') || item.title === '상태창'
              ? `<button type="button" class="copy-line" data-copy="${prefix}-${i}">원문 복사</button>`
              : '') +
          `</details>`
      )
      .join('');
  }

  /* 도입부 6개 상시 펼침 카드 렌더링 (details/summary 미사용) */
  function renderOpeningCards(openings) {
    const openingMeta = [
      { code: '01', mark: '⑴', time: '납치 직후', tag: '18+ · 성인', adult: true, loc: 'THE BEAST · SLEEPER CAB' },
      { code: '02', mark: '⑵', time: '검문소 앞 · 납치 후 며칠', tag: '18+ · 성인', adult: true, loc: 'PASSENGER FLOOR · CHECKPOINT' },
      { code: '03', mark: '⑶', time: '납치 후 며칠', tag: '차량 무전 · 위장', adult: false, loc: 'CB RADIO · CAB' },
      { code: '04', mark: '⑷', time: '납치 후 일주일', tag: '모텔에서의 밤', adult: false, loc: 'CASH MOTEL · NIGHT' },
      { code: '05', mark: '⑸', time: '납치 후 몇 주', tag: '노선 변경 · 공범화', adult: false, loc: 'HIGHWAY DETOUR' },
      { code: '06', mark: '⑹', time: '자율 도입부', tag: 'FREE ROUTE', adult: false, loc: 'CUSTOM STARTING POINT' }
    ];

    return openings
      .map((raw, idx) => {
        const meta = openingMeta[idx] || {
          code: String(idx + 1).padStart(2, '0'),
          mark: `(${idx + 1})`,
          time: `도입부 ${idx + 1}`,
          tag: 'SCENE',
          adult: false,
          loc: 'ON THE ROAD'
        };
        const cleanBody = String(raw)
          .replace(/^[⑴⑵⑶⑷⑸⑹]\s*/, '')
          .replace(/^🔞\s*/, '')
          .trim();

        return (
          `<article class="opening-card ${meta.adult ? 'is-adult' : ''}" aria-label="도입부 ${meta.code} ${escapeHTML(meta.time)}">` +
            `<header class="opening-card-head">` +
              `<div class="opening-num-group">` +
                `<span class="opening-num">${meta.code} · ${meta.mark}</span>` +
                `<strong class="opening-time">${escapeHTML(meta.time)}</strong>` +
              `</div>` +
              `<span class="opening-badge">${escapeHTML(meta.tag)}</span>` +
            `</header>` +
            `<div class="opening-body">${linkify(cleanBody)}</div>` +
            `<footer class="opening-foot">` +
              `<span>${escapeHTML(meta.loc)}</span>` +
              `<span>RHODES / SCENE ${meta.code}</span>` +
            `</footer>` +
          `</article>`
        );
      })
      .join('');
  }

  /* 모든 UI/접근성 텍스트에서 '작품' 단어 제거 및 미완성 이미지 슬롯 방어 */
  function sanitizeDOMLabels() {
    const introMoreBtn = $('#intro-more');
    if (introMoreBtn && introMoreBtn.textContent.includes('작품')) {
      introMoreBtn.textContent = '소개';
    }
    const closeDialogBtn = $('.close-dialog');
    if (closeDialogBtn && closeDialogBtn.getAttribute('aria-label')?.includes('작품')) {
      closeDialogBtn.setAttribute('aria-label', '소개 닫기');
    }
    const contentNoteSummary = $('.content-note summary');
    if (contentNoteSummary && contentNoteSummary.textContent.includes('작품')) {
      contentNoteSummary.textContent = '성인 · 강압 요소 안내';
    }
    const contentNoteDetails = $('details.content-note');
    if (contentNoteDetails) {
      contentNoteDetails.open = true;
    }


  }

  function renderAll(WW) {
    if(!WW)return;
    sanitizeDOMLabels();
    const put=(id,html)=>{const element=document.getElementById(id);if(element)element.innerHTML=html;};
    const heading=item=>escapeHTML(item.title.replace(/^⭐\s*/,''));
    const card=(item,id='')=>`<article class="paper-piece guide-source-card" ${id?`id="${id}"`:''}><h3 class="piece-title">${heading(item)}</h3><div class="prose" data-raw="${escapeHTML(item.text)}">${renderStructuredText(item.text)}</div>${/가이던스|요약 지침|^상태창$/.test(item.title)?`<button type="button" class="copy-line" data-copy="${id}">원문 복사</button>`:''}</article>`;
    const rows=(items,prefix)=>Array.from({length:Math.ceil(items.length/2)},(_,row)=>`<div class="mosaic-row-2">${items.slice(row*2,row*2+2).map((item,offset)=>card(item,prefix?`${prefix}-${row*2+offset}`:'')).join('')}</div>`).join('');
    put('character-menu',`<a href="#intro">와이어트, 웨이드<small>현재 소개</small></a><a href="https://jouurie.github.io/ig-profile/">이결<small>소개 바로가기 ↗</small></a>`);
    put('platforms',[['elyn','엘린'],['nody','노디']].map(([id,name])=>`<a href="${escapeHTML(WW.platforms[id])}" target="_blank" rel="noreferrer">${name}에서 보기 ↗</a>`).join(''));
    const introLines=WW.intro.split('\n\n');
    put('intro-story-grid','<div class="intro-whole-body">'+introLines.map(text=>`<p>${linkify(text).replace(/\n/g,'<br>')}</p>`).join('')+'</div>');
    const sourceLine=$('#intro-source-line');if(sourceLine)sourceLine.textContent=WW.intro.split('\n')[0];
    const tw=$('#intro-tw-text');if(tw)tw.textContent=WW.warning;
    const dossiers=[['wyatt','WYATT','와이어트 로즈','형'],['wade','WADE','웨이드 로즈','동생']].map(([tone,english,name,role])=>`<article class="brother-dossier ${tone}"><div class="portrait large" aria-label="${name} 이미지 자리">${english}</div><div class="bd-head"><small>${role}</small><h3>${name}</h3><div class="bd-spec-table"><div><span>AGE</span>25세</div><div><span>HEIGHT</span>174cm</div></div><ul class="ww-profile-traits">${(window.WWProfileTraits?.[tone]||[]).map(tag=>`<li>${escapeHTML(tag)}</li>`).join('')}</ul></div></article>`).join('');
    put('brothers-mosaic',`<div class="mosaic-row-2">${dossiers}</div><article class="paper-piece profile-sheet">`+WW.profile.map((item,i)=>`<section class="profile-section" id="profile-${i}"><h3 class="piece-title">${heading(item)}</h3><div class="prose" data-raw="${escapeHTML(item.text)}">${i===0?renderBasicProfile(item.text):renderStructuredText(item.text,true)}</div></section>`).join('')+'</article>');
    const beast=(WW.supplement||[]).find(item=>item.title==='더 비스트');
    if(beast){const parts=[...beast.text.matchAll(/▸ ([^\n]+)\n([\s\S]*?)(?=\n▸ |$)/g)].map(match=>({title:match[1],text:match[2].trim()}));put('truck-three-zones',parts.filter(item=>['앞좌석','커튼 뒤 슬리퍼 캡','장부와 영수증'].includes(item.title)).map(item=>card(item)).join(''));}
    const worldTitles=['세계관','미국 전역 장거리 화물노선','로즈 형제','트럭 생활','공범화','진행 소재'];
    put('world-mosaic',rows(WW.supplement.filter(item=>worldTitles.includes(item.title)),'world'));
    put('npc-directory-split',[0,5].map(start=>`<section class="dark-piece"><div class="piece-head"><span class="sq-label">CONTACTS ${String(start+1).padStart(2,'0')}—${String(start+5).padStart(2,'0')}</span></div><div class="npc-dir-grid">${WW.npcs.slice(start,start+5).map((npc,i)=>`<button type="button" class="npc-dir-btn" data-npc-directory="${start+i}"><strong>${escapeHTML(npc.name)}</strong><small>${escapeHTML(npc.english)}</small></button>`).join('')}</div></section>`).join(''));
    put('opening-list',renderOpeningCards(WW.openings));
    const warning=$('#content-warning');if(warning)warning.textContent=WW.warning;
    const guides=WW.supplement.slice(0,12);
    put('guide-index',guides.map((item,i)=>`<a href="#guide-${i}" data-guide="guide-${i}">${heading(item)}</a>`).join(''));
    put('guide-mosaic',rows(guides,'guide'));
    put('synopsis-body',WW.intro.split('\n\n').map(text=>`<p>${linkify(text).replace(/\n/g,'<br>')}</p>`).join(''));
  }

  return {
    escapeHTML,
    linkify,
    renderStructuredText,
    renderAll
  };
})();
