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
    volume:'<path d="M11 4 6 8H3v8h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'
  };
  function icon(name){
    return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(paths[name]||paths.play)+'</svg>';
  }
  function updatePlay(playing){
    const button=document.querySelector('#radio #radio-play');if(!button)return;
    button.innerHTML=icon(playing?'pause':'play');
    button.title=button.getAttribute('aria-label')||(playing?'일시정지':'재생');
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
    const label=radio.querySelector('.volume-module .vol-label');
    if(label){label.innerHTML=icon('volume');label.setAttribute('aria-hidden','true');}
    return controls;
  }
  global.WWRadioControls={icon,updatePlay,mount};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(),{once:true});
  else mount();
})(window);
