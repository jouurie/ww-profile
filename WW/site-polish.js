/* Shared heading anatomy; content-specific views retain their own controls. */
(function(){'use strict';
  var descriptions={"brothers":["같은 얼굴의 25세 쌍둥이가 운전·장부와","바깥 대응·안쪽 단속을 나눠 맡습니다."],"truck":["로즈 형제의 집이자 일터, 은신처인","검은 18륜 피터빌트입니다."],"world":["1996~1999년, 종이 지도책·무전·로그북을 쓰고","현금으로 모텔을 이용하던 미국입니다."],"npc":["브로커와 모텔 지배인, 트럭커 등","도로에서 마주치는 10명을 소개합니다."],"openings":["이야기를 시작할 시점과","상황을 고릅니다."],"guide":["진행 방식과 설정,","명령어와 상태창 사용법을 설명합니다."],"radio":["도로 위에서 함께 듣는 12곡입니다."]};
  function mount(){
    document.querySelectorAll('main>.panel:not(#intro)').forEach(function(panel){
      var title=panel.querySelector('h2');if(!title)return;
      var head=title.closest('.section-head,.ww-npc-heading-row,.ww-openings-heading');
      if(!head){head=document.createElement('header');title.before(head);head.append(title);}
      head.classList.add('ww-section-head');
      head.querySelectorAll('.eyebrow').forEach(function(label){label.remove();});
      title.classList.add('ww-section-title');
      var desc=head.querySelector('.head-desc');
      if(!desc){desc=document.createElement('p');desc.className='head-desc';head.append(desc);}
      var parts=descriptions[panel.id];if(!parts)return;
      desc.replaceChildren();parts.forEach(function(text,index){if(index)desc.append(document.createTextNode(' '));var phrase=document.createElement('span');phrase.className='ww-desc-phrase';phrase.textContent=text;desc.append(phrase);});
    });
  }
  var sharedTip;
  function polishTooltip(element){
    if(!element.matches||!element.matches('main [title],.ww-site-header [title]')||element.tagName==='IFRAME')return;
    var text=element.getAttribute('title');if(!text)return;
    element.removeAttribute('title');
    if(element.querySelector('.ww-key-action'))return;
    if(!element.getAttribute('aria-label')||element.dataset.wwTooltipLabel==='owned'){element.setAttribute('aria-label',text);element.dataset.wwTooltipLabel='owned';}
    element.dataset.wwTooltip=text;element.classList.add('ww-tooltip-host');
  }
  function placeTooltip(event){
    var host=event.target.closest&&event.target.closest('.ww-tooltip-host');if(!host){sharedTip.classList.remove('is-visible');return;}
    sharedTip.textContent=host.dataset.wwTooltip;
    var box=host.getBoundingClientRect(),width=sharedTip.getBoundingClientRect().width,height=sharedTip.getBoundingClientRect().height;
    sharedTip.style.left=Math.max(width/2+12,Math.min(document.documentElement.clientWidth-width/2-12,box.left+box.width/2))+'px';
    sharedTip.style.top=(box.bottom+height+12>innerHeight?Math.max(8,box.top-height-8):box.bottom+8)+'px';
    sharedTip.classList.add('is-visible');
  }
  function hideTooltip(event){
    if(event.relatedTarget&&event.relatedTarget.closest&&event.relatedTarget.closest('.ww-tooltip-host')===event.target.closest('.ww-tooltip-host'))return;
    sharedTip.classList.remove('is-visible');
  }
  function tooltips(){
    sharedTip=document.createElement('span');sharedTip.className='ww-html-tooltip';sharedTip.setAttribute('aria-hidden','true');document.body.append(sharedTip);
    document.addEventListener('pointerover',placeTooltip);document.addEventListener('focusin',placeTooltip);
    document.addEventListener('pointerout',hideTooltip);document.addEventListener('focusout',hideTooltip);
    document.querySelectorAll('main [title],.ww-site-header [title]').forEach(polishTooltip);
    new MutationObserver(function(records){records.forEach(function(record){if(record.type==='attributes')polishTooltip(record.target);else record.addedNodes.forEach(function(node){if(node.nodeType!==1)return;polishTooltip(node);node.querySelectorAll('[title]').forEach(polishTooltip);});});}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['title']});
  }
  /* Informational tags respond to a touch without gaining action semantics. */
  var pressedTrait;
  function releaseTrait(){if(pressedTrait){pressedTrait.removeAttribute('data-ww-trait-pressed');pressedTrait=null;}}
  document.addEventListener('pointerdown',function(event){
    if(event.pointerType==='mouse')return;
    releaseTrait();
    var trait=event.target.closest&&event.target.closest('#brothers .ww-profile-c .ww-profile-traits>li,#intro .kw-chip,#npc .ww-npc-traits>.ww-npc-trait');
    if(trait){pressedTrait=trait;trait.setAttribute('data-ww-trait-pressed','');}
  },{passive:true});
  ['pointerup','pointercancel','scroll'].forEach(function(type){document.addEventListener(type,releaseTrait,{passive:true,capture:true});});
  document.addEventListener('pointerout',function(event){if(pressedTrait&&event.pointerType!=='mouse'&&!pressedTrait.contains(event.relatedTarget))releaseTrait();},{passive:true});
  window.addEventListener('blur',releaseTrait);
  /* Match photo-rail controls to actual thumbnail borders, excluding rail scrollbars. */
  function photoRailArrows(){
    var rails=new Set(),pending=0;
    function measure(){
      pending=0;
      rails.forEach(function(rail){
        if(!rail.isConnected){rails.delete(rail);resize.unobserve(rail);return;}
        var shell=rail.parentElement,items=Array.from(rail.children).filter(function(item){return item.matches('.wwtruck-thumbnail,.ww-npc-thumb')&&item.getClientRects().length;});
        if(!items.length||!shell.getClientRects().length)return;
        var boxes=items.map(function(item){return item.getBoundingClientRect();}),top=Math.min.apply(null,boxes.map(function(box){return box.top;})),bottom=Math.max.apply(null,boxes.map(function(box){return box.bottom;}));
        var values={'--ww-photo-arrow-height':(bottom-top)+'px','--ww-photo-arrow-top':(top-shell.getBoundingClientRect().top)+'px'};
        Object.keys(values).forEach(function(key){if(shell.style.getPropertyValue(key)!==values[key])shell.style.setProperty(key,values[key]);});
      });
    }
    function schedule(){if(!pending)pending=requestAnimationFrame(measure);}
    var resize=new ResizeObserver(schedule);
    function scan(){document.querySelectorAll('#truck .wwtruck-thumbnail-strip,#npc .ww-npc-film').forEach(function(rail){if(rails.has(rail))return;rails.add(rail);resize.observe(rail);Array.from(rail.children).forEach(function(item){resize.observe(item);});});schedule();}
    new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',schedule,{passive:true});document.addEventListener('load',schedule,true);
    window.addEventListener('hashchange',schedule);if(document.fonts)document.fonts.ready.then(schedule);
    scan();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',photoRailArrows,{once:true});else photoRailArrows();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mount();tooltips();},{once:true});else{mount();tooltips();}
})();
