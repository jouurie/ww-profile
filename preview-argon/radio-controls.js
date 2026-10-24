/* Icon-only transport controls; the existing audio engine owns every action. */
(function (global) {
  'use strict';
  const paths={
    previous:'<path d="M6 5v14"/><path d="m19 5-10 7 10 7Z" fill="currentColor" stroke="none"/>',
    play:'<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
    pause:'<path d="M7 5h4v14H7zm7 0h4v14h-4z" fill="currentColor" stroke="none"/>',
    next:'<path d="M18 5v14"/><path d="m5 5 10 7-10 7Z" fill="currentColor" stroke="none"/>',
    repeat:'<path d="m16 3 4 4-4 4M4 11V9a2 2 0 0 1 2-2h14M8 21l-4-4 4-4m12 0v2a2 2 0 0 1-2 2H4"/>',
    shuffle:'<path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.8 0 3.6-2.4 5.4-5.1M14 8.3C15.4 6.9 16.7 6 18 6h3m-4-4 4 4-4 4"/>',
    volume:'<path d="M11 4 6 8H3v8h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="radio-mute-slash" d="m3 21 18-18"/>'
  };
  function icon(name){
    return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(paths[name]||paths.play)+'</svg>';
  }
  function updatePlay(playing){
    const button=document.querySelector('#radio #radio-play');if(!button)return;
    button.innerHTML=icon(playing?'pause':'play');
    button.title=button.getAttribute('aria-label')||(playing?'일시정지':'재생');
  }
  function updateState(state){
    const radio=document.getElementById('radio');if(!radio||!state)return;
    radio.classList.toggle('radio-is-playing',state.playing);
    const mute=radio.querySelector('.radio-mute');
    if(mute){mute.setAttribute('aria-pressed',String(state.muted));mute.setAttribute('aria-label',state.muted?'음소거 해제':'음소거');mute.title=mute.getAttribute('aria-label');}
    const slider=radio.querySelector('#radio-volume'),readout=radio.querySelector('#radio-vol-val');
    if(slider)slider.value=String(state.volume);
    if(readout)readout.textContent=Math.round(state.volume)+'%';
  }
  const titleEntries=new Map();
  let titleRoot=null,titleObserver=null,titleResize=null,titleIntersection=null,titleFrame=0;
  let titlePageTurning=false;
  function queueTitles(){if(!titlePageTurning&&!titleFrame)titleFrame=requestAnimationFrame(refreshTitles);}
  function pauseTitleMotion(){
    if(titleFrame)cancelAnimationFrame(titleFrame);titleFrame=0;
    titleEntries.forEach(entry=>entry.animation?.pause());
    titleRoot?.classList.add('radio-titles-paused');
  }
  global.addEventListener('ww-page-transition',event=>{
    titlePageTurning=Boolean(event.detail?.active);
    if(titlePageTurning)pauseTitleMotion();else queueTitles();
  });
  function refreshTitles(){
    titleFrame=0;if(!titleRoot)return;
    const unavailable=document.hidden||titleRoot.hidden||titlePageTurning;
    titleRoot.classList.toggle('radio-titles-paused',unavailable);
    if(unavailable){titleEntries.forEach(entry=>entry.animation?.pause());return;}
    const nodes=new Set(titleRoot.querySelectorAll('#radio-current-title,.tc-title'));
    titleEntries.forEach((entry,host)=>{if(!nodes.has(host)){entry.animation?.cancel();titleResize?.unobserve(host);titleIntersection?.unobserve(host);titleEntries.delete(host);}});
    nodes.forEach(host=>{
      let entry=titleEntries.get(host);
      if(entry&&host.firstElementChild!==entry.track&&host.textContent.trim()===entry.first.textContent)host.replaceChildren(entry.track);
      if(!entry||host.firstElementChild!==entry.track){
        entry?.animation?.cancel();
        const text=host.textContent.trim();if(!text)return;
        const track=document.createElement('span'),first=document.createElement('span'),copy=document.createElement('span');
        track.className='radio-title-track';first.textContent=text;copy.textContent=text;copy.className='radio-title-copy';copy.setAttribute('aria-hidden','true');track.append(first,copy);
        host.replaceChildren(track);host.classList.add('radio-title-runner');
        entry={track,first,copy};titleEntries.set(host,entry);titleResize?.observe(host);titleIntersection?.observe(host);
      }
      const overflow=host.id==='radio-current-title'||(host.closest('.track-card')?.getAttribute('aria-current')==='true'&&entry.first.scrollWidth>host.clientWidth+1);
      host.classList.toggle('has-overflow',overflow);
      if(overflow){
        const distance=entry.first.scrollWidth+24;
        const copies=Math.max(1,Math.ceil(host.clientWidth/distance));
        while(entry.track.children.length<copies+1){const copy=entry.first.cloneNode(true);copy.className='radio-title-copy';copy.setAttribute('aria-hidden','true');entry.track.append(copy);}
        while(entry.track.children.length>copies+1)entry.track.lastElementChild.remove();
        if(entry.distance!==distance){entry.animation?.cancel();entry.distance=distance;entry.animation=entry.track.animate([{transform:'translateX(0)'},{transform:'translateX('+-distance+'px)'}],{duration:Math.max(8,distance/28)*1000,iterations:Infinity,easing:'linear'});}
        if(host.id==='radio-current-title')host.tabIndex=0;
      }else{entry.animation?.cancel();entry.animation=null;entry.distance=0;if(host.id==='radio-current-title')host.removeAttribute('tabindex');}
      const button=host.closest('.track-card');
      const fineHover=matchMedia('(hover:hover) and (pointer:fine)').matches;
      const hovered=fineHover&&(host.matches(':hover')||button?.matches(':hover'));
      const keyboardFocus=host.matches(':focus-visible')||button?.matches(':focus-visible');
      const paused=document.hidden||titleRoot.hidden||host.classList.contains('is-offscreen')||hovered||keyboardFocus;
      if(entry.animation){if(paused)entry.animation.pause();else entry.animation.play();}
    });
  }
  function mountTitles(radio){
    if(titleRoot===radio){queueTitles();return;}
    titleObserver?.disconnect();titleResize?.disconnect();titleIntersection?.disconnect();titleEntries.clear();titleRoot=radio;
    titleResize=typeof ResizeObserver==='function'?new ResizeObserver(queueTitles):null;
    titleIntersection=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{entries.forEach(entry=>entry.target.classList.toggle('is-offscreen',!entry.isIntersecting));queueTitles();}):null;
    titleObserver=new MutationObserver(queueTitles);titleObserver.observe(radio,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','aria-current']});
    ['pointerover','pointerout','focusin','focusout'].forEach(type=>radio.addEventListener(type,queueTitles));
    document.fonts?.ready.then(queueTitles);queueTitles();
  }
  function mount(root=document){
    const radio=root.matches?.('#radio')?root:root.querySelector('#radio');if(!radio)return false;
    const controls=radio.querySelector('.deck-controls-bar');if(!controls)return false;
    controls.classList.add('radio-controls-inline');
    [['radio-prev','previous'],['radio-next','next'],['radio-repeat','repeat'],['radio-shuffle','shuffle']].forEach(([id,name])=>{
      const button=radio.querySelector('#'+id);if(!button)return;
      button.innerHTML=icon(name);
      if(!button.title)button.title=button.getAttribute('aria-label')||'';
    });
    const play=radio.querySelector('#radio-play');
    if(play)updatePlay(play.getAttribute('aria-pressed')==='true');
    const module=radio.querySelector('.volume-module');
    const label=module?.querySelector('.vol-label');
    if(label&&!module.dataset.radioVolumeReady){
      const mute=document.createElement('button');mute.type='button';mute.className='vol-label radio-mute';mute.innerHTML=icon('volume');
      label.replaceWith(mute);
      mute.addEventListener('click',()=>global.WWRadioEngine?.mute());
      module.addEventListener('wheel',event=>{
        if(!event.deltaY)return;
        const engine=global.WWRadioEngine;if(!engine)return;
        event.preventDefault();engine.volume(engine.state.volume+(event.deltaY<0?5:-5));
      },{passive:false});
      module.dataset.radioVolumeReady='true';
    }
    updateState(global.WWRadioEngine?.state);
    mountTitles(radio);
    return controls;
  }
  global.addEventListener('ww-radio-state',event=>updateState(event.detail));
  document.addEventListener('visibilitychange',()=>document.getElementById('radio')?.classList.toggle('radio-motion-paused',document.hidden));
  document.addEventListener('visibilitychange',queueTitles);
  global.addEventListener('resize',queueTitles);
  global.WWRadioControls={icon,updatePlay,updateState,mount};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(),{once:true});
  else mount();
})(window);
