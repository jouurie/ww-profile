/* Shared heading anatomy; content-specific views retain their own controls. */
(function(){'use strict';
  var descriptions={brothers:'같은 얼굴의 25세 쌍둥이가 운전·장부와 바깥 대응·안쪽 단속을 나눠 맡습니다.',truck:'로즈 형제의 집이자 일터, 은신처인 검은 18륜 피터빌트입니다.',world:'1996~1999년, 종이 지도책과 무전·로그북을 쓰고 현금으로 모텔을 이용하던 미국입니다.',npc:'브로커와 모텔 지배인, 트럭커 등 도로에서 마주치는 10명을 소개합니다.',openings:'시작할 시점과 상황을 골라 이야기를 시작해 보세요.',guide:'진행 방식과 설정, 명령어와 상태창 사용법을 확인해 보세요.',radio:'화면 없이 음악만 재생하는 오디오 데크입니다. 자동재생은 꺼져 있습니다.'};
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
      desc.textContent=descriptions[panel.id];
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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mount();tooltips();},{once:true});else{mount();tooltips();}
})();
