(() => {
  'use strict';
  const root=document.querySelector('#guide');
  if(!root||!window.WWGuideData||!window.WW)return;
  const data=window.WWGuideData.build(window.WW);
  const groups=['play','start','commands','recovery'].map(id=>data.groups.find(group=>group.id===id));
  const moduleBase=new URL('.',document.currentScript?.src||new URL('guide.js',location.href));
  const payloads=new Map();
  let copyIndex=0;
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clean=value=>String(value).replace(/^\s*#{1,6}\s*/gm,'').replace(/\u{1f517}\s*/gu,'').replace(/\u2b50\s*/g,'');
  const links=value=>clean(value).split(/(https?:\/\/[^\s<>]+)/g).map(part=>/^https?:\/\//.test(part)?'<a class="wg-resource-link" href="'+esc(part)+'" target="_blank" rel="noreferrer">지침 보기 ↗</a>':esc(part)).join('');
  const badge=()=>'';
  function body(raw){
    return raw.split('\n').filter(line=>line.trim()).map(line=>{
      const text=clean(line.replace(/^[·↳] /,''));
      if(/^\s*#{1,6}\s+/.test(line))return '<h4>'+links(text)+'</h4>';
      if(text.startsWith('<RStatus'))return copyPanel('<pre class="wg-code"><code>'+esc(text)+'</code></pre>',text,'예시 복사');
      return '<p'+(line.startsWith('↳ ')?' class="wg-note"':'')+'>'+links(text)+'</p>';
    }).join('');
  }
  function unit(raw){
    const rows=raw.split('\n'),first=rows[0].replace(/^· /,'');
    const pair=first.match(/^([^:]{1,28}):\s*(.+)$/);
    if(pair&&clean(pair[1])==='추천')return '<p class="wg-inline-recommendation"><span>'+links(pair[2])+'</span></p>'+body(rows.slice(1).join('\n'));
    if(pair&&!first.startsWith('https://'))return '<p class="wg-keyvalue"><strong class="wg-inline-label">'+esc(clean(pair[1]))+': </strong> <span class="wg-value">'+links(pair[2])+'</span></p>'+body(rows.slice(1).join('\n'));
    return body(raw);
  }
  function section(section,item,index){
    const pair=section.heading.match(/^(.{1,36}?)( → | \| )(.+)$/);
    if(pair&&item.index===1&&pair[3].includes("'!장면완화'"))return '<article class="wg-fragment"><h4>'+esc(pair[1])+'</h4>'+body(pair[3].replace(/^'!장면완화'(?: 사용\. |를 사용하면 )/,''))+'<div class="wg-command-pair"><div class="wg-command-token"><span class="wg-platform-label wg-elyn">엘린</span><code>!장면완화</code></div><div class="wg-command-token"><span class="wg-platform-label wg-nody">노디</span><code>/장면완화</code></div></div></article>';
    if(pair)return '<article class="wg-fragment"><h4>'+esc(pair[1])+'</h4>'+body(pair[3]+'\n'+section.body)+'</article>';
    if(!section.heading){if(section.body.length>600)return '<div class="wg-preface wg-summary-pieces">'+section.body.split(/\n+/).filter(line=>line.trim()).map(line=>'<article class="wg-fragment">'+body(line)+'</article>').join('')+'</div>';return '<div class="wg-preface">'+body(section.body)+'</div>';}
    if(!section.body.trim())return '<article class="wg-fragment wg-short">'+body(section.heading)+'</article>';
    let units=section.units;
    const metrics=item.index===6&&section===item.sections[0];
    if(metrics&&units.length===4)units=[units[0],units[1],units.slice(2).join('')];
    const content=units.length>1?'<div class="wg-units '+(metrics?'wg-metrics':'')+'">'+units.map(raw=>'<div class="wg-unit">'+unit(raw)+'</div>').join('')+'</div>':body(section.body);
    return '<section class="wg-section'+(section.body.includes('<RStatus')?' wg-wide':'')+'"><h4>'+links(section.heading.replace(/:$/,''))+'</h4>'+content+'</section>';
  }

  function pieces(item,parts=item.sections){
    const short=parts.every(part=>!part.body.trim()||part.heading.includes(' → ')||part.heading.includes(' | '));
    return '<div class="wg-pieces'+(short?' wg-short-pieces':'')+'">'+parts.map((part,index)=>section(part,item,index)).join('')+'</div>';
  }
  function copyControl(payload,label='복사'){
    const id='wg-copy-'+(++copyIndex);payloads.set(id,payload);
    return '<div class="wg-copy-control"><button type="button" data-copy-block="'+id+'" aria-label="'+esc(label)+'">COPY</button><span role="status"></span></div>';
  }
  function copyPanel(content,payload,label){
    return '<section class="wg-copy-block"><header class="wg-copy-block-head"><span>본문</span>'+copyControl(payload,label)+'</header><div class="wg-copy-block-body">'+content+'</div></section>';
  }
  function modelTitle(name){
    return esc(name).replace(/3\.8 Flash|4 Argon|Opus|GPT 5\.6 Sol(?: \(SFW\))?/g, match=>'<span class="wg-model-highlight">'+match+'</span>');
  }
  function modelBody(item){
    const common=item.sections[0];
    const metrics='<section class="wg-item-setting"><h4>'+esc(common.heading)+'</h4><div class="wg-start-metrics">'+common.units.slice(0,3).map(raw=>'<article>'+unit(raw)+'</article>').join('')+'</div><div class="wg-start-plan">'+body(common.units.slice(3).join(''))+'</div></section>';
    const cards='<section class="wg-model-section"><h4>모델별 특징 · 개별 추론</h4><div class="wg-model-grid">'+data.models.map(card=>'<article class="wg-model-card"><header><h4>'+modelTitle(card.name)+'</h4>'+'</header><div class="wg-model-setting"><span>권장 추론</span><strong>'+esc(card.value)+'</strong></div>'+['feature','caution'].map(kind=>{const notes=card.notes.filter(note=>note.kind===kind);return notes.length?'<section class="wg-model-'+kind+'"><h5>'+(kind==='feature'?'특징':'주의')+'</h5>'+notes.map(note=>'<p>'+links(note.text)+'</p>').join('')+'</section>':'';}).join('')+'</article>').join('')+'</div></section>';
    const support=item.sections.slice(1).filter(part=>part.heading!=='모델별 특징 · 개별 추론');
    return metrics+cards+'<div class="wg-model-support">'+support.map(modelSupport).join('')+'</div>';
  }
  function modelSupport(part){
    const defaults=[];
    const units=part.units.map(raw=>part.heading==='추론 조절'?raw.split('\n').filter(line=>{if(/^↳ (?:기본 |설명이 길어지면)/.test(line)){defaults.push(line);return false;}return true;}).join('\n'):raw);
    return '<section class="wg-model-support-section"><h4>'+esc(part.heading)+'</h4><table class="wg-model-support-table"><tbody>'+units.map(modelUnit).join('')+'</tbody></table>'+(defaults.length?'<aside class="wg-model-defaults wg-support-notes"><h5>기본값</h5>'+body(defaults.join('\n'))+'</aside>':'')+'</section>';
  }
  function modelUnit(raw){
    const rows=raw.split('\n'),first=rows.shift().replace(/^· /,'');
    const pair=first.match(/^([^:]{1,28}):\s*(.+)$/);
    const emphasize=text=>{
      const [main,...extra]=text.split(' / 별도 선택: ');
      const choices=main.split(' ↔ ').map(part=>'<span class="wg-model-choice">'+links(part)+'</span>').join('<span class="wg-model-separator"> ↔ </span>');
      return '<div class="wg-model-choices">'+choices+'</div>'+extra.map(part=>'<div class="wg-model-extra"><span>별도 선택:</span> <mark>'+links(part)+'</mark></div>').join('');
    };
    const notes=rows.some(row=>row.trim())?'<div class="wg-support-notes">'+body(rows.join('\n'))+'</div>':'';
    return pair?'<tr><th scope="row">'+esc(pair[1])+'</th><td><div class="wg-support-value">'+emphasize(pair[2])+'</div>'+notes+'</td></tr>':'<tr><td colspan="2"><div class="wg-support-statement">'+links(first)+'</div>'+notes+'</td></tr>';
  }
  function commandsBody(item){
    return '<p>플랫폼에 맞는 명령어를 입력하거나 상태창의 명령어 버튼을 사용합니다.</p>'+data.commandGroups.map(group=>'<section class="wg-command-group"><h4>'+esc(group.title)+'</h4><div class="wg-command-rows">'+data.commands.filter(command=>group.names.includes(command.elyn)).map(command=>'<article class="wg-command-row"><div class="wg-command-description">'+esc(command.description)+(command.pinball?'<small>엘린: 상태창 내장 게임 · 노디: 별도 핀볼 패널</small>':'')+'</div><div class="wg-command-pair"><div class="wg-command-token"><span class="wg-platform-label wg-elyn">엘린</span><code>'+esc(command.elyn)+'</code></div><div class="wg-command-token"><span class="wg-platform-label wg-nody">노디</span><code>'+esc(command.nody)+'</code></div></div></article>').join('')+'</div></section>').join('');
  }
  function statusFields(fields){
    return '<table class="wg-status-field-table"><thead><tr><th scope="col">항목</th><th scope="col">의미</th></tr></thead><tbody>'+fields.map(([key,meaning])=>'<tr><th scope="row"><code>'+esc(key)+'</code></th><td>'+links(meaning)+'</td></tr>').join('')+'</tbody></table>';
  }
  function statusGuide(input,settings,meaningTitle,fields,notes=''){
    return '<div class="wg-status-guide"><div class="wg-status-input-stack"><section class="wg-status-card wg-status-input"><h4>입력 형식 · 예시</h4>'+input+'</section><section class="wg-status-card wg-status-settings">'+settings+'</section></div><section class="wg-status-card wg-status-fields"><h4>'+esc(meaningTitle)+'</h4>'+statusFields(fields)+(notes?'<div class="wg-status-field-notes">'+notes+'</div>':'')+'</section></div>';
  }
  function elynStatusNotes(item){
    const format=item.sections[0],settings=item.sections[1],meaning=item.sections[2],example=item.sections[3];
    const rows=meaning.body.split('\n'),fields=rows.filter(line=>line.startsWith('· ')).map(line=>{const colon=line.indexOf(':');return [line.slice(2,colon),line.slice(colon+1).trimStart()];});
    const notes=body(rows.filter(line=>!line.startsWith('· ')).join('\n'));
    const input='<h5>'+esc(format.heading)+'</h5>'+body(format.body)+'<h5>'+esc(example.heading)+'</h5>'+body(example.body);
    return statusGuide(input,'<h4>'+esc(settings.heading)+'</h4>'+body(settings.body),meaning.heading,fields,notes);
  }
  function nodyStatusNotes(){
    const fields=[
      ['n','현재 턴 번호입니다. 숫자를 문자열로 적습니다.'],
      ['duration','동행 단계입니다. 0=첫 동행, 1=며칠째, 2=일주일째, 3=몇 주째, 4=몇 달째, 5=장기 동행으로 구분하며, 값은 문자열입니다.'],
      ['loreKeys','현재 duration, month, weather에 맞춰 함께 갱신하는 문자열입니다.'],
      ['shortGoal','현재 유지 중인 구체적인 목표 대상과 행동입니다.'],
      ['month','현재 계절입니다.'],
      ['time','현재 시간대입니다.'],
      ['weather','현재 날씨입니다.'],
      ['road','현재 도로명과 접근 지점입니다.'],
      ['heading','현재 진행 방향입니다.'],
      ['driverSeat','현재 운전 담당자입니다.'],
      ['motion','주행, 정차 등 현재 운행 상태입니다.'],
      ['truck','트럭과 엔진, 적재물의 현재 조건입니다.'],
      ['pressure','현재 진행을 막거나 손실을 주는 당면 사안입니다.'],
      ['wyattPosition','와이어트의 현재 위치입니다.'],
      ['wyattAction','와이어트의 현재 자세나 행동, 또는 지속되는 결과입니다.'],
      ['wadePosition','웨이드의 현재 위치입니다.'],
      ['wadeAction','웨이드의 현재 자세나 행동, 또는 지속되는 결과입니다.'],
      ['userOutfit','현재 보이는 유저의 복장입니다.'],
      ['userPosition','유저의 현재 위치입니다.'],
      ['userState','현재 보이는 유저의 신체, 복장, 자세 또는 접촉 상태입니다.'],
      ['radioLog','현재 장면에 나온 무전과 라디오, 뉴스의 소식이나 남은 영향입니다.']
    ];
    const values=Object.fromEntries(fields.map(([key])=>[key,key==='n'?'1':key==='duration'?'0':'']));
    const template='```status\n'+JSON.stringify(values,null,2)+'\n```';
    const input='<p>노디는 status 코드블록 안의 JSON을 읽어 상태창으로 표시합니다. 아래는 장면 정보를 넣지 않은 최소 예시입니다. 첫 줄의 <code>```status</code>와 마지막 줄의 <code>```</code>를 포함해 복사하세요.</p>'+copyPanel('<pre class="wg-code"><code>'+esc(template.replace(/\n  /g,'\n'))+'</code></pre>',template,'노디 예시 복사');
    const settings='<h4>값 형식</h4><p>21개 값은 모두 문자열입니다. n과 duration도 따옴표 안에 적습니다. 빈 문자열에는 현재 확인된 값을 넣고, 바뀌지 않은 유효한 상태는 유지합니다.</p><p>loreKeys는 현재 duration, month, weather와 맞춰 갱신합니다.</p>';
    return statusGuide(input,settings,'항목별 의미 · JSON 키',fields);
  }
  function statusPreview(){
    const tabs=['elyn','nody'].map((platform,index)=>'<button type="button" role="tab" id="wg-status-tab-'+platform+'" aria-controls="wg-status-preview-'+platform+'" data-wg-status-platform="'+platform+'" aria-selected="false" tabindex="'+(index===0?'0':'-1')+'">'+platform.toUpperCase()+'</button>').join('');
    return '<div class="wg-status-preview"><nav class="wg-local-tabs" role="tablist" aria-label="상태창 플랫폼">'+tabs+'</nav><div class="wg-status-preview-body"><div class="wg-neutral-platform" data-status-neutral><h4>플랫폼 미선택</h4><p>엘린 또는 노디를 선택하세요.</p></div>'+['elyn','nody'].map(platform=>'<div id="wg-status-preview-'+platform+'" role="tabpanel" aria-labelledby="wg-status-tab-'+platform+'" data-preview-platform="'+platform+'" hidden><iframe class="wg-status-frame" title="'+platform.toUpperCase()+' 상태창 미리보기" src="'+esc(new URL('status-preview/'+platform+'.html?v=20261024-density1',moduleBase).href)+'" data-preview-frame="'+platform+'" scrolling="no" loading="lazy"></iframe></div>').join('')+'</div></div>';
  }
  function itemBody(item){
    if(item.index===0){
      const labels=['진행 방식','사건 발생','다음 행동'];
      return '<table class="wg-progress-table"><tbody>'+item.text.split('\n').filter(line=>line.trim()).map((line,index)=>'<tr><th scope="row">'+labels[index]+'</th><td>'+links(line.replace(/^▸\s*/,''))+'</td></tr>').join('')+'</tbody></table>';
    }
    if(item.index===2)return '<ol class="wg-play-list">'+item.text.split('\n').filter(line=>line.trim()).map(line=>'<li>'+links(line.replace(/^▸\s*/,''))+'</li>').join('')+'</ol>';
    if(item.index===6)return modelBody(item);
    if(item.index===9)return commandsBody(item);
    if(item.index===10)return statusPreview()+'<div class="wg-status-notes"><div data-status-notes-platform="elyn" hidden>'+elynStatusNotes(item)+'</div><div data-status-notes-platform="nody" hidden>'+nodyStatusNotes()+'</div></div>';
    if(item.index===7)return '<div class="wg-pieces">'+item.sections.map(part=>{
      const rendered=section(part,item,0);
      if(!part.heading)return rendered;
      const payload=part.body.trim().replace(/\n+\(선택 사항\)\s*$/,'');
      return '<div class="wg-prompt-block">'+copyPanel(rendered,payload,'영어 본문 전체 복사')+'</div>';
    }).join('')+'</div>';
    if(item.index===8){
      const offset=item.text.indexOf('Use only supplied evidence.');
      return offset<0?pieces(item):body(item.text.slice(0,offset))+'<div class="wg-summary-prompt">'+copyPanel(body(item.text.slice(offset)),item.text.slice(offset).trim(),'요약 지침 전체 복사')+'</div>';
    }
    return pieces(item);
  }
  function entry(item){
    const platformOnly=['start','recovery'].some(id=>data.groups.find(group=>group.id===id).items.includes(item));
    const html=itemBody(item);
    return '<section class="wg-item" id="'+item.id+'" data-source-index="'+item.index+'" hidden><header class="wg-entry-head"><h3>'+esc(clean(item.title))+badge(item)+'</h3></header>'+(platformOnly?'<div data-category-platform="elyn">'+html+'</div><div data-category-platform="nody" hidden><p class="wg-preparing">준비 중</p></div>':html)+'</section>';
  }
  const mount=document.createElement('div');mount.className='ww-guide';mount.id='ww-guide-module';
  const platformTabs='<div class="wg-platform-slot"><nav class="wg-category-platforms wg-local-tabs" role="tablist" aria-label="설정 플랫폼">'+['elyn','nody'].map((platform,index)=>'<button type="button" role="tab" data-wg-category-platform="'+platform+'" aria-controls="wg-control-panel" aria-selected="false" tabindex="'+(index===0?'0':'-1')+'">'+platform.toUpperCase()+'</button>').join('')+'</nav></div>';
  const directory=groups.map(group=>'<section class="wg-directory-group"><h3 class="wg-directory-heading" id="wg-directory-'+group.id+'">'+esc(group.title)+'</h3><div class="wg-item-selector" id="wg-selector-'+group.id+'" data-wg-selector="'+group.id+'" role="tablist" aria-labelledby="wg-directory-'+group.id+'">'+group.items.map(item=>'<button type="button" role="tab" id="wg-item-tab-'+item.index+'" aria-controls="'+item.id+'" data-wg-item="'+item.index+'" data-item-group="'+group.id+'">'+(item.index===11?'<span>상태창 · 대사<span class="wg-directory-wrap"> 복원 지침</span></span>':esc(clean(item.title)))+badge(item)+'</button>').join('')+'</div></section>').join('');
  mount.innerHTML='<nav class="wg-directory" aria-label="가이드 전체 항목">'+directory+'</nav><div class="wg-control-panel" id="wg-control-panel"><div class="wg-content" id="wg-content">'+data.items.map(entry).join('')+'</div></div>'+platformTabs;
  root.querySelectorAll('.guide-layout,#guide-index,#guide-details,#guide-mosaic,#guide-info,#ww-guide-module').forEach(element=>element.remove());
  root.append(mount);root.classList.add('ww-guide-ready');
  const description=root.querySelector('.head-desc')||root.querySelector('.section-head>p:last-child');
  if(description&&!description.classList.contains('eyebrow'))description.textContent='진행 안내와 설정을 확인하세요.';
  let selected='play',statusPlatform=null;
  const chosen={start:5,play:0,commands:9,recovery:4},platforms={start:null,recovery:null};
  function revealSelections(){
    mount.querySelectorAll('.wg-groups,.wg-item-selector').forEach(bar=>{
      if(!bar.clientWidth||bar.scrollWidth<=bar.clientWidth+1)return;
      const active=bar.querySelector('[aria-selected="true"]');if(!active)return;
      const item=active.getBoundingClientRect(),rail=bar.getBoundingClientRect();
      if(item.left<rail.left)bar.scrollLeft+=item.left-rail.left;
      else if(item.right>rail.right)bar.scrollLeft+=item.right-rail.right;
    });
  }
  window.addEventListener('resize',revealSelections);
  function requestPreviewSize(){
    const frame=mount.querySelector('[data-preview-frame="'+statusPlatform+'"]');
    if(frame?.contentWindow)frame.contentWindow.postMessage({type:'ww-status-preview-measure',platform:statusPlatform},new URL(frame.src).origin);
  }
  function display(groupID,itemIndex){
    const group=data.groups.find(group=>group.id===groupID)||data.groups[0];
    const next=group.items.find(item=>item.index===itemIndex)||group.items.find(item=>item.index===chosen[group.id])||group.items[0];
    if(selected!==group.id&&Object.hasOwn(platforms,selected))platforms[selected]=null;
    if(selected==='commands'&&chosen.commands===10&&(group.id!=='commands'||next.index!==10))resetStatus();
    selected=group.id;chosen[selected]=next.index;
    const platformCategory=selected==='start'||selected==='recovery';
    const platformSlot=mount.querySelector('.wg-platform-slot');
    const activePanel=mount.querySelector('.wg-item[data-source-index="'+next.index+'"]');
    activePanel.querySelector('.wg-entry-head').append(platformSlot);
    mount.querySelector('.wg-category-platforms').hidden=!platformCategory;
    mount.querySelector('#wg-control-panel').hidden=false;
    mount.querySelectorAll('[data-wg-category-platform]').forEach((button,index)=>{const active=button.dataset.wgCategoryPlatform===platforms[selected];button.setAttribute('aria-selected',String(active));button.tabIndex=active||(!platforms[selected]&&index===0)?0:-1;});
    mount.querySelectorAll('[data-wg-item]').forEach(button=>{const active=Number(button.dataset.wgItem)===next.index;button.setAttribute('aria-selected',String(active));button.tabIndex=active||(button.dataset.itemGroup!==selected&&button===button.parentElement.firstElementChild)?0:-1;});
    mount.querySelectorAll('.wg-item').forEach(panel=>{
      panel.hidden=Number(panel.dataset.sourceIndex)!==next.index;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','wg-item-tab-'+panel.dataset.sourceIndex);
      if(!panel.hidden&&platformCategory)panel.querySelectorAll('[data-category-platform]').forEach(page=>page.hidden=page.dataset.categoryPlatform!==platforms[selected]);
    });
    revealSelections();if(next.index===10)requestPreviewSize();
  }
  function keepPosition(action){
    const x=window.scrollX,y=window.scrollY,host=mount.querySelector('#wg-control-panel');
    host.style.minHeight='';
    action();
    if(y>Math.max(0,document.documentElement.scrollHeight-window.innerHeight)){
      const end=(document.querySelector('footer')||document.body).getBoundingClientRect().bottom+window.scrollY;
      const deficit=Math.max(0,y+window.innerHeight-end);
      if(deficit)host.style.minHeight=Math.ceil(host.getBoundingClientRect().height+deficit)+'px';
    }
    window.scrollTo({left:x,top:y,behavior:'instant'});
  }
  window.addEventListener('scroll',()=>{if(window.scrollY===0)mount.querySelector('#wg-control-panel').style.minHeight='';},{passive:true});
  function navigate(groupID,itemIndex){
    keepPosition(()=>{display(groupID,itemIndex);const hash=itemIndex===undefined?'#guide-'+selected:'#guide-'+chosen[selected];if(location.hash!==hash)history.pushState({...history.state},'',hash);});
  }
  function synchronize(){
    const itemRoute=location.hash.match(/^#guide-(\d+)$/);
    if(itemRoute){const item=data.items[Number(itemRoute[1])];if(item){const group=data.groups.find(group=>group.items.includes(item));display(group.id,item.index);}return;}
    const route=location.hash.match(/^#guide-(start|play|commands|recovery)(?:-(common|elyn|nody))?$/);
    if(route)display(route[1]);
    else if(location.hash==='#guide')display(selected);
    else resetPlatforms();
  }
  function resetStatus(){
    statusPlatform=null;
    mount.querySelectorAll('[data-wg-status-platform]').forEach((button,index)=>{button.setAttribute('aria-selected','false');button.tabIndex=index===0?0:-1;});
    mount.querySelectorAll('[data-preview-platform],[data-status-notes-platform]').forEach(page=>page.hidden=true);
    mount.querySelector('[data-status-neutral]').hidden=false;
  }
  function resetPlatforms(){
    platforms.start=null;platforms.recovery=null;resetStatus();display(selected);
  }
  function selectStatus(platform){
    keepPosition(()=>{
      statusPlatform=platform;
      mount.querySelectorAll('[data-wg-status-platform]').forEach(button=>{const active=button.dataset.wgStatusPlatform===platform;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
      mount.querySelectorAll('[data-preview-platform]').forEach(page=>page.hidden=page.dataset.previewPlatform!==platform);
      mount.querySelector('[data-status-neutral]').hidden=true;
      mount.querySelectorAll('[data-status-notes-platform]').forEach(notes=>notes.hidden=notes.dataset.statusNotesPlatform!==platform);
      requestPreviewSize();
    });
  }
  mount.querySelectorAll('[data-wg-group]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.wgGroup)));
  mount.querySelectorAll('[data-wg-item]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.itemGroup,Number(button.dataset.wgItem))));
  mount.querySelectorAll('[data-wg-category-platform]').forEach(button=>button.addEventListener('click',()=>keepPosition(()=>{platforms[selected]=button.dataset.wgCategoryPlatform;display(selected);})));
  mount.querySelectorAll('[data-wg-status-platform]').forEach(button=>button.addEventListener('click',()=>selectStatus(button.dataset.wgStatusPlatform)));
  function keyboardTabs(bar,selector,activate){
    bar.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const buttons=[...bar.querySelectorAll(selector)],current=buttons.indexOf(document.activeElement);if(current<0)return;event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(current+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[next].focus({preventScroll:true});activate(buttons[next]);
    });
  }
  mount.querySelectorAll('.wg-item-selector').forEach(bar=>keyboardTabs(bar,'[data-wg-item]',button=>navigate(button.dataset.itemGroup,Number(button.dataset.wgItem))));
  keyboardTabs(mount.querySelector('.wg-category-platforms'),'[data-wg-category-platform]',button=>keepPosition(()=>{platforms[selected]=button.dataset.wgCategoryPlatform;display(selected);}));
  mount.querySelectorAll('.wg-status-preview .wg-local-tabs').forEach(bar=>keyboardTabs(bar,'[data-wg-status-platform]',button=>selectStatus(button.dataset.wgStatusPlatform)));
  mount.querySelectorAll('[data-copy-block]').forEach(button=>button.addEventListener('click',async()=>{
    const status=button.parentElement.querySelector('[role="status"]');
    try{await navigator.clipboard.writeText(payloads.get(button.dataset.copyBlock));status.textContent='복사됨';}
    catch{status.textContent='본문을 선택해 복사해 주세요.';}
  }));
  mount.querySelectorAll('[data-preview-frame]').forEach(frame=>frame.addEventListener('load',requestPreviewSize));
  window.addEventListener('message',event=>{
    if(event.data?.type!=='ww-status-preview-height')return;
    const platform=event.data.platform;if(!['elyn','nody'].includes(platform))return;
    const frame=mount.querySelector('[data-preview-frame="'+platform+'"]');if(!frame||event.source!==frame.contentWindow||event.origin!==new URL(frame.src).origin)return;
    const height=Number(event.data.height);if(Number.isFinite(height)&&height>0&&height<=20000)frame.style.height=Math.ceil(height)+'px';
  });
  window.addEventListener('hashchange',synchronize);window.addEventListener('popstate',synchronize);
  display('play');synchronize();
})();
