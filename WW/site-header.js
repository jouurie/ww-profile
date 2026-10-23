/* One shared, persistent navigation surface for arrival and reading pages. */
(function(){'use strict';
  var source=document.currentScript.src;
  var siteRoot=new URL('../',source);
  var home=new URL('WW/',siteRoot);
  var detail=new URL('preview-argon/',siteRoot);
  var current=document.querySelector('body>.masthead');if(!current)return;
  var previousNav=document.querySelector('body>.chapter-nav');
  var host=document.createElement('div');host.className='ww-site-header';
  var items=[['intro','소개'],['brothers','형제'],['truck','더 비스트'],['world','도로와 생활'],['npc','NPC'],['openings','도입부'],['guide','플레이 가이드'],['radio','플레이리스트']];
  host.innerHTML='<header class="masthead"><a class="brand" aria-label="와이어트, 웨이드 첫 화면"><span class="brand-mark" aria-hidden="true"><span class="brand-row"><span class="twin-w">WYATT</span><em>&amp;</em></span><span class="brand-row"><span class="twin-w">WADE</span></span><strong>RHODES</strong></span><span class="brand-name">와이어트,<br>웨이드</span></a><details class="characters"><summary><span>다른 캐릭터</span><b aria-hidden="true">＋</b></summary><div class="character-menu" id="character-menu"></div></details></header><nav class="chapter-nav" aria-label="로즈 소개 메뉴"></nav>';
  host.querySelector('.brand').href=home.href;
  var nav=host.querySelector('nav');items.forEach(function(item,index){var a=document.createElement('a');a.href=detail.href+'#'+item[0];var number=document.createElement('small');number.textContent=String(index+1).padStart(2,'0');a.append(number,document.createTextNode(item[1]));nav.append(a);});
  var menu=host.querySelector('.character-menu');
  [['와이어트, 웨이드',detail.href+'#intro','현재 소개'],['이결','https://jouurie.github.io/ig-profile/','소개 바로가기 ↗']].forEach(function(item){var a=document.createElement('a');a.href=item[1];a.append(document.createTextNode(item[0]));var small=document.createElement('small');small.textContent=item[2];a.append(small);menu.append(a);});
  current.replaceWith(host);if(previousNav)previousNav.remove();
  var characters=host.querySelector('.characters');document.addEventListener('click',function(e){if(!characters.contains(e.target))characters.open=false;});characters.addEventListener('keydown',function(e){if(e.key==='Escape'){characters.open=false;characters.querySelector('summary').focus();}});
  function size(){document.documentElement.style.setProperty('--site-header-height',host.getBoundingClientRect().height+'px');}size();if(window.ResizeObserver)new ResizeObserver(size).observe(host);
})();
