/* Native buttons keep click, touch, Enter and Space activation in one path. */
(function(global){
  'use strict';
  const ready=new WeakSet();
  function mount(root=document){
    root.querySelectorAll('#intro button[data-intro-card]').forEach(button=>{
      if(ready.has(button))return;
      ready.add(button);
      const front=button.querySelector('.tp-card-front'),back=button.querySelector('.tp-card-back');
      if(!front||!back)return;
      const name=button.dataset.introCard==='wyatt'?'와이어트 로즈':'웨이드 로즈';
      button.addEventListener('click',()=>{
        const flipped=button.getAttribute('aria-pressed')!=='true';
        button.setAttribute('aria-pressed',String(flipped));
        front.setAttribute('aria-hidden',String(flipped));front.inert=flipped;
        back.setAttribute('aria-hidden',String(!flipped));back.inert=!flipped;
        button.setAttribute('aria-label',flipped?name+' 대표 한마디: '+back.textContent.trim()+' 앞면 보기':name+' 대표 한마디 보기');
      });
    });
  }
  global.WWIntroCards={mount};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(),{once:true});else mount();
})(window);
