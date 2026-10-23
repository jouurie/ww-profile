/* Shared heading anatomy; content-specific views retain their own controls. */
(function(){'use strict';
  function mount(){
    document.querySelectorAll('main>.panel:not(#intro)').forEach(function(panel){
      var title=panel.querySelector('h2');if(!title)return;
      var head=title.closest('.section-head,.ww-npc-heading-row,.ww-openings-heading');
      if(!head){head=document.createElement('header');title.before(head);head.append(title);}
      head.classList.add('ww-section-head');
      head.querySelectorAll('.eyebrow').forEach(function(label){label.remove();});
      title.classList.add('ww-section-title');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
