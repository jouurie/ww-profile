/* Keep old section links working while the logo always opens the arrival screen. */
(function(){'use strict';
  var section=location.hash.slice(1);
  if(/^(intro|brothers|truck|world|npc|openings|guide(?:-.*)?|radio)$/.test(section)){
    location.replace('../preview-argon/'+location.search+location.hash);return;
  }
  var menu=document.querySelector('.characters');
  document.addEventListener('click',function(event){if(menu&&!menu.contains(event.target))menu.open=false;});
  menu?.addEventListener('keydown',function(event){if(event.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();}});
  var header=document.querySelector('.masthead');
  function sizeHeader(){if(header)document.documentElement.style.setProperty('--header-height',header.getBoundingClientRect().height+'px');}
  sizeHeader();if(globalThis.ResizeObserver&&header)new ResizeObserver(sizeHeader).observe(header);
  globalThis.WWMotion?.mount(document);
})();
