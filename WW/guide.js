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
    return esc(name).replace(/(?:Gemini )?3\.7 Flash|(?:Gemini )?3\.8 Flash|(?:Gemini )?4 Argon|(?:Claude )?Opus(?: \d+(?:\.\d+)*)?|GPT[ -]5\.6 Sol/g, match=>'<span class="wg-model-highlight">'+match+'</span>');
  }
  function settingPath(text){return '<ol class="wg-setting-path" aria-label="설정 위치">'+text.split(' → ').map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol>';}
  function modelSettings(item){
    const common=item.sections[0];
    const metrics='<section class="wg-model-support-section"><h4>'+esc(common.heading)+'</h4><table class="wg-model-support-table"><tbody>'+common.units.slice(0,3).map(modelUnit).join('')+'</tbody></table>'+body(common.units.slice(3).join(''))+'</section>';
    const perModel='<section class="wg-model-support-section"><h4>모델별 추론값</h4><table class="wg-model-support-table"><tbody>'+data.models.map(card=>modelUnit(card.name+': '+card.value)).join('')+'</tbody></table></section>';
    const support=item.sections.filter(part=>part.heading==='추론 조절'||part.heading==='참고').map(part=>part.heading==='참고'?{...part,heading:'설정 참고',units:part.units.filter(raw=>/^([^:\n]{1,28}):\s*(.+)$/.test(raw.trim().replace(/^· /,'').split('\n')[0]))}:part);
    return metrics+perModel+support.map(modelSupport).join('')+'<p class="wg-note">모델별 추론값이 공통 기본값보다 우선합니다.</p>';
  }
  function modelCards(models){return '<section class="wg-model-section"><h4>모델별 특징</h4><div class="wg-model-grid">'+models.map(card=>'<article class="wg-model-card"><header><h4>'+modelTitle(card.name)+'</h4></header>'+['feature','caution'].map(kind=>{const notes=card.notes.filter(note=>note.kind===kind);return notes.length?'<section class="wg-model-'+kind+'"><h5>'+(kind==='feature'?'특징':'주의')+'</h5>'+notes.map(note=>'<p>'+((/^(?:Claude )?Opus$/.test(card.name)&&/^(?:Claude )?Opus \d/.test(note.text))?note.text.replace(/^((?:Claude )?Opus \d+(?:\.\d+)*):\s*/,(_,label)=>(/^(?:Claude )?Opus (?:4\.6|5\.5)$/.test(label)?modelTitle(label):esc(label))+': '):links(note.text))+'</p>').join('')+'</section>':'';}).join('')+'</article>').join('')+'</div></section>';}
  function modelBody(item){
    const operation=item.sections.find(part=>part.heading==='운용');
    const cards=modelCards(data.models);
    const reference=item.sections.find(part=>part.heading==='참고');
    const notes=reference?reference.units.filter(raw=>!/^([^:\n]{1,28}):\s*(.+)$/.test(raw.trim().replace(/^· /,'').split('\n')[0])).join('\n'):'';
    return (operation?modelSupport(operation):'')+cards+(notes?'<aside class="wg-model-defaults wg-support-notes"><h4>참고</h4>'+body(notes)+'</aside>':'')+'<p>공통 기본값과 모델별 추론 조절: <a class="wg-resource-link" href="#guide-5">추천 설정값</a></p>';
  }
  function modelSupport(part){
    const defaults=[];
    const units=part.units.map(raw=>part.heading==='추론 조절'?raw.split('\n').filter(line=>{if(/^↳ (?:기본 |설명이 길어지면)/.test(line)){defaults.push(line);return false;}return true;}).join('\n'):raw);
    return '<section class="wg-model-support-section'+(part.heading==='운용'?' wg-model-operation':'')+'"><h4>'+esc(part.heading)+'</h4><table class="wg-model-support-table"><tbody>'+units.map(modelUnit).join('')+'</tbody></table>'+(defaults.length?'<aside class="wg-model-defaults wg-support-notes"><h5>기본값</h5>'+body(defaults.join('\n'))+'</aside>':'')+'</section>';
  }
  function settingLabel(text){
    const groups={'자동으로 요약하기':['자동으로','요약하기'],'원문 줄바꿈 그대로':['원문 줄바꿈','그대로'],'내 캐릭터 대신 하기 (사칭)':['내 캐릭터','대신 하기','(사칭)'],'적극적인 사칭 플레이':['적극적인','사칭 플레이']};
    return (groups[text]||text.split(' ')).map(part=>'<span class="wg-label-part">'+esc(part)+'</span>').join(' ');
  }
  function highlightModelNames(text){return links(text).replace(/(?:Gemini )?3\.8 Flash|(?:Gemini )?4 Argon|(?:Claude )?Opus|GPT[ -]5\.6 Sol/g,match=>'<span class="wg-model-highlight">'+match+'</span>');}
  function modelUnit(raw){
    const rows=raw.split('\n'),first=rows.shift().replace(/^· /,'');
    const pair=first.match(/^([^:]{1,28}):\s*(.+)$/);
    const emphasize=text=>{
      const [main,...extra]=text.split(' / 별도 선택: ');
      const choices=main.split(' ↔ ').map(part=>'<span class="wg-model-choice">'+highlightModelNames(part)+'</span>').join('<span class="wg-model-separator"> ↔ </span>');
      return '<div class="wg-model-choices">'+choices+'</div>'+extra.map(part=>'<div class="wg-model-extra"><span>별도 선택:</span> '+highlightModelNames(part)+'</div>').join('');
    };
    const notes=rows.some(row=>row.trim())?'<div class="wg-support-notes">'+body(rows.join('\n'))+'</div>':'';
    return pair?'<tr><th scope="row">'+settingLabel(pair[1])+'</th><td><div class="wg-support-value">'+emphasize(pair[2])+'</div>'+notes+'</td></tr>':'<tr><td colspan="2"><div class="wg-support-statement">'+links(first)+'</div>'+notes+'</td></tr>';
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
  function budgetPanel(lines){return '<section class="wg-setting-box"><h4>로어북 예산</h4><ul class="wg-setting-list">'+lines.filter(line=>line.trim()).map(line=>'<li>'+(line.includes('권장 예산')?'<strong>권장 예산:</strong> <a class="wg-resource-link" href="#guide-5">추천 설정값</a>':links(line.replace(/^[▸·] /,'')))+'</li>').join('')+'</ul></section>';}
  function handoffBody(platform){
    const uses=["대화가 길어져 맥락이 흐려졌을 때","새 채팅방에서 이어가고 싶을 때"];
    return '<div class="wg-pieces"><section class="wg-section"><h4>사용 시점</h4><div class="wg-units">'+uses.map(text=>'<div class="wg-unit"><p>'+text+'</p></div>').join('')+'</div></section><section class="wg-section"><h4>RP 인계 방법 + 가이드</h4><p><a class="wg-resource-link" href="https://rentry.co/rp-handoff-note'+(platform==='nody'?'-nody':'')+'" target="_blank" rel="noreferrer">지침 보기 ↗</a></p></section></div>';
  }
  function itemBody(item){
    if(item.index===4)return handoffBody('elyn');
    if(item.index===3)return budgetPanel(item.text.split('\n'));
    if(item.index===0){
      const labels=['진행 방식','사건 발생','다음 행동'];
      return '<table class="wg-progress-table"><tbody>'+item.text.split('\n').filter(line=>line.trim()).map((line,index)=>'<tr><th scope="row">'+labels[index]+'</th><td>'+links(line.replace(/^▸\s*/,''))+'</td></tr>').join('')+'</tbody></table>';
    }
    if(item.index===2)return '<ol class="wg-play-list">'+item.text.split('\n').filter(line=>line.trim()).map(line=>'<li>'+links(line.replace(/^▸\s*/,''))+'</li>').join('')+'</ol>';
    if(item.index===5)return '<div class="wg-pieces">'+settingPath('출력 탭')+'<div class="wg-setting-cards">'+item.sections.map((part,index)=>section(part,item,index)).join('')+'</div>'+modelSettings(data.items[6])+'</div>';
    if(item.index===6)return modelBody(item);
    if(item.index===9)return commandsBody(item);
    if(item.index===10)return statusPreview()+'<div class="wg-status-notes"><div data-status-notes-platform="elyn" hidden>'+elynStatusNotes(item)+'</div><div data-status-notes-platform="nody" hidden>'+nodyStatusNotes()+'</div></div>';
    if(item.index===7)return '<div class="wg-pieces">'+item.sections.map(part=>{
      if(!part.heading){const [path,...intro]=part.body.trim().split('\n');return settingPath(path)+'<div class="wg-setting-intro">'+body(intro.join('\n').trim())+body("기본 프롬프트는 유저 행동을 일부 묘사할 수 있는 약사칭 기준이므로, 사칭 플레이를 원할 때는 플랫폼 토글 대신 선택 항목인 ‘대필 가이던스’를 추가하세요.")+'</div>';}
      const payload=part.body.trim().replace(/\n+\(선택 사항\)\s*$/,'');
      return '<div class="wg-prompt-block'+(part.heading==='소설식 진행 · 유저 대필'?' is-optional':'')+'"><h4>'+esc(part.heading)+(part.heading==='소설식 진행 · 유저 대필'?' (선택 사항)':'')+'</h4>'+copyPanel(body(payload),payload,'영어 본문 전체 복사')+'</div>';
    }).join('')+'</div>';
    if(item.index===8){
      const offset=item.text.indexOf('Use only supplied evidence.');
      return offset<0?pieces(item):'<div class="wg-pieces">'+settingPath(item.text.slice(0,offset).trim())+'<div class="wg-prompt-block"><h4>추가 요약 지침</h4>'+copyPanel(body(item.text.slice(offset)),item.text.slice(offset).trim(),'요약 지침 전체 복사')+'</div></div>';
    }
    return item.index===11?pieces(item).replaceAll('복원 지침','복원 안내'):pieces(item);
  }
  function nodyBody(item){
    const active=({3:"budget",5:"recommended",6:"models",7:"output",8:"memory"})[item.index];
    const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
    const panel=make("div","wg-pieces");
    const paragraphs=(host,text)=>{host.innerHTML+=body(text);};
    const card=(title,text)=>{const node=make("section","wg-section");node.append(make("h4","",title));if(text)paragraphs(node,text);return node;};
    const settingsList=(host,items)=>{host.innerHTML+=items.map(raw=>unit(raw)).join('');};
    const settingsPath=text=>{const node=make("div");node.innerHTML=settingPath(text);return node.firstElementChild;};
    const disclosureLink=(label,id)=>{const link=make("a","wg-resource-link",label);link.href="#guide-"+({"guide-output":7,"guide-recommended":5,"guide-memory":8,"guide-models":6})[id];return link;};
    const tableBlock=block=>{const [heading,...rows]=block.split("\n");if(heading==='모델별 특징'){const cards=[];rows.filter(Boolean).forEach(row=>{if(row.startsWith('↳ ')){cards.at(-1).notes.push({kind:'feature',text:row.slice(2)});return;}const index=row.indexOf(': '),name=row.slice(0,index),text=row.slice(index+2);const notes=name==='DeepSeek Flash'?[{kind:'feature',text:text.split(' 상태창')[0]},{kind:'caution',text:'상태창'+text.split(' 상태창')[1]}]:[{kind:/^(2\.5 Pro|3\.1 Pro)$/.test(name)?'caution':'feature',text}];cards.push({name,notes});});const wrapper=make('div');wrapper.innerHTML=modelCards(cards);return wrapper.firstElementChild;}const node=make("section","wg-model-support-section"+(heading==='운용'?' wg-model-operation':''));node.innerHTML="<h4>"+esc(heading)+"</h4><table class=\"wg-model-support-table\"><tbody>"+rows.filter(Boolean).map(modelUnit).join("")+"</tbody></table>";return node;};
    const copyBlock=(title,content)=>{const node=make("div","wg-prompt-block"+(title.startsWith("(선택)")?" is-optional":""));node.innerHTML="<h4>"+esc(title)+"</h4>"+copyPanel(body(content),content,title+" 전체 복사");return node;};
  function renderNody(section) {
    const appendTableLink=(section,label,link)=>{const row=document.createElement('tr'),key=document.createElement('th'),value=document.createElement('td');key.scope='row';key.textContent=label;value.append(link);row.append(key,value);section.querySelector('tbody').append(row);};

    if (section === 'recovery') { panel.append(card('안내', '등록된 안내가 없습니다.')); return; }
    if (active === 'budget') {
      panel.innerHTML=budgetPanel(["로어북은 키워드가 나올 때만 꺼내 쓰는 설정입니다.","로어북 예산은 한 번의 답변에 가져올 수 있는 로어북 내용의 글자수 한도이며, 캐시 금액이 아닙니다.","내용이 예산 한도로 잘리지 않도록 최대로 설정하는 것을 권장합니다. 예산을 늘리면 더 많은 설정을 담는 대신 매 턴 캐시 사용량도 늘 수 있습니다.","권장 예산: 추천 설정값"]);
    } else if (active === 'recommended') {
      panel.append(settingsPath('채팅방 설정 → 대화'));
      const options = make('div', 'wg-setting-cards');
      options.append(tableBlock("사칭 방지 플레이\n내 캐릭터 대신 하기 (사칭): 살짝"),tableBlock("사칭 플레이 (/이어서, *이어서* 위주)\n내 캐릭터 대신 하기 (사칭): 적극")); panel.append(options);
      panel.append(tableBlock("답변\n출력량: 길게\n최대 출력량: 6,000토큰\n응답 품질: 높음\n로어북 예산: 50,000자\n출력 속도: 즉시"));
      panel.append(make('p', 'guide-note', "응답 품질은 답변 전에 점검하는 항목 수입니다. 노디 안내 기준 낮음은 3개, 보통은 4개, 높음은 5개이며, 모델 자체의 추론 예산과 같은 수치로 볼 수는 없습니다. 설정과 앞선 대화를 더 챙기도록 모델 공통으로 높음을 권장합니다. 모델별 최적값이나 최저비용을 검증한 값은 아니며, 답변이 느려지고 캐시 사용량이 늘 수 있습니다. 높음도 상태창과 기억의 정확성을 보장하지는 않습니다."));
      panel.append(tableBlock("추천 답변 문체\n지문 표기: 안 씀\n인칭: 3인칭\n시제: 과거"));
      panel.append(tableBlock("문체\n문체: 노디 기본\n지문 별표 쓰기: 끔"));
      const guidance = tableBlock("출력 가이던스\n역할극 유지: 적용\n관계 진행: 적용\n분량 · 리듬: 선택 적용"); appendTableLink(guidance,'입력 위치',disclosureLink('가이던스 내용과 입력 위치', 'guide-output')); panel.append(guidance);
      panel.append(tableBlock("AI 연기 방식\n사칭 방지 플레이: 살짝\n사칭 플레이: 적극\n이야기 전개: 차분하게 또는 적극적으로\n캐릭터 태도: 중립 또는 거칠게"));
      panel.append(tableBlock("기타\n상태창 표시: 켬"));
      panel.append(settingsPath('채팅방 설정 → 기억'));
      panel.append(tableBlock("대화 기억 범위\n최근 대화: 5턴"));
      const memorySettings=tableBlock("장기기억 설정\n요약 주기: 5턴\n요약 글자수: 6,000자\n자동으로 요약하기: 켬"); panel.append(memorySettings);
      appendTableLink(memorySettings,'요약 방식',disclosureLink('기억 지침', 'guide-memory'));
      panel.append(make('p', 'wg-note', '1턴은 내 말과 캐릭터 답변 한 쌍입니다. 최근 대화는 원문으로 기억할 범위이고, 요약 주기는 장기기억을 갱신할 간격입니다. 원문 비용을 줄이려면 최근 대화부터 조절하세요.'));
      panel.append(make('p', 'wg-note', '요약 주기를 줄이면 요약 횟수가 늘어납니다. 총비용은 답변 사용량과 실제 캐시 차감, 요약 요금의 포함 여부를 함께 확인하세요. DeepSeek Flash로 각 20턴을 시험했을 때는 별도 추가 요약 차감이 확인되지 않았습니다. 위 5턴 주기는 기억을 자주 갱신하기 위한 권장값이며, 최저비용 설정으로 검증된 값은 아닙니다.'));
    } else if (active === 'models') {
      const model = make('div', 'wg-model-support'); model.id = 'wg-model-support';
      ["운용\n가성비: Gemini 3.7 Flash / Gemini 3.8 Flash ↔ GLM 5.3\n일반: Gemini 3.7 Flash / Gemini 3.8 Flash ↔ Gemini 4 Argon / Gemini 2.5 Pro / Gemini 3.1 Pro / 별도 선택: GPT-6.1 Sol (용도: SFW)\n고가: Claude Opus 5.5 ↔ Gemini 4 Argon / 별도 선택: GPT-5.6 Sol · GPT-6.1 Sol (용도: SFW)\nNSFW: Gemini 3.7 Flash / Gemini 3.8 Flash / Gemini 4 Argon / Gemini 2.5 Pro / Gemini 3.1 Pro ↔ GLM 5.3 / Claude Opus 5.5","모델별 특징\nGemini 3.7 Flash / Gemini 3.8 Flash: 대사가 자연스럽고 진행이 능동적입니다. 3.7 Flash는 다소 긍정적이고, 3.8 Flash는 다소 부정적인 경향이 있습니다.\nGemini 3 Flash: 비용이 낮은 선택지입니다. 3.7 Flash · 3.8 Flash의 전개가 한쪽으로 치우칠 때 사용하세요.\nGLM 5.3: Opus와 비슷한 감정선을 더 가볍게 이어 갑니다.\nDeepSeek Flash: 저렴한 축이라 긴 대화의 비용 부담이 적습니다. 상태창 출력이 잘 되지 않습니다.\nKimi 3: 차분하고 정돈된 문장을 씁니다. 답변이 길고 느린 편이라 실제 비용이 커질 수 있습니다.\nGemini 2.5 Pro: 캐릭터 해석은 안정적이며 소유욕 · 집착이 강해질 수 있습니다.\nGemini 3.1 Pro: NSFW로 빠르게 기울고 상황을 야릇하게 몰아가는 경향이 있습니다.\nGemini 4 Argon: 생생한 인물별 상호작용과 풍부한 동작 · 감각 묘사에 강합니다.\nClaude Opus: Claude Opus 4.6: 순애 · 감정선 복원에 강합니다.\n↳ Claude Opus 4.7: 지침을 충실히 따르며, 4.6보다 적극적으로 전개하는 편입니다.\n↳ Claude Opus 4.8: 정돈된 문장과 자연스러운 장면 확장에 강합니다.\n↳ Claude Opus 5: 캐릭터성과 관계를 유지하며 능동적으로 진행합니다.\n↳ Claude Opus 5.5: 능동적인 진행과 4.6에 가까운 감정선이 장점입니다.\nGPT-5.6 Sol: 밀도 있는 서술과 능동적인 진행이 특징입니다. 여러 인물의 대화 · 복잡한 관계에 강합니다.\n↳ 용도: SFW\nGPT-6.1 Sol: 능동적인 진행과 여러 인물의 티키타카 · 관계 전개에 강합니다.\n↳ 용도: SFW","참고\n최소 2개 모델을 번갈아 사용해 말투, 전개의 치우침을 줄이세요.\n표현과 전개가 반복되면 → 모델을 교체하세요."].forEach(block => model.append(tableBlock(block))); panel.append(model);
    } else if (active === 'output') {
      panel.append(settingsPath('채팅방 설정 → 대화 → 출력 가이던스'));
      const instructions = make('div', 'wg-setting-intro');
      paragraphs(instructions, "진행을 안정시키려면 아래 기본 가이던스 2개를 추가하세요. 분량과 리듬도 조절하려면 선택 가이던스를 함께 추가하세요.\n각 제목은 '규칙 이름'에, 그 아래 영어 본문은 '내용' 칸에 입력하세요.\n분량·리듬은 더 긴 답변과 일정한 문단 구성을 원할 때만 추가하는 선택 가이던스입니다."); panel.append(instructions);
      var codes = make('div', 'wg-pieces');
      codes.append(copyBlock('역할극 유지', "This is fictional roleplay; I know you are an AI. Express the characters' relationships and emotions through their dialogue, actions, and viewpoint within the story.", '1'));
      codes.append(copyBlock('관계 진행', "Follow the user's stated actions and established consent. Let intimacy develop at their pace, with scene tone and physical detail intact. Add no unmentioned relationship prerequisites.", '2'));
      codes.append(copyBlock('(선택) 분량 · 리듬', "Before status: 2,200+ Korean prose chars, 10–14 paragraphs, usually 3–6 sentences. Exclude dialogue/UI/comments. Follow live action and thought; avoid repeated explanation. End on a playable beat."));
      panel.append(codes);
    } else if (active === 'memory') {
      panel.append(settingsPath('채팅방 설정 → 기억 → 장기기억 설정'));
      panel.append(copyBlock('요약 방식', "Create a concise Korean memory, at most 300 Korean characters. Keep the central stated emotional/relationship change and only 1-2 events or unresolved stakes that matter next; include actions only if essential. For user feelings, use the user's statements; slight relief is not trust. Do not invent motives or swap actors/knowledge holders. Preserve important uncertainty and scope. Include an event only when its actor and action are supported; omit unclear links rather than guess. Replace superseded facts and carry forward unresolved essentials. Merge repeats; omit dialogue, minor details and known background. Quote only wording essential to meaning. Use the latest confirmed time and place.\nFor Rhodes, retain route/time, body condition, drugs/injury/fatigue, custody/surveillance/danger and distinct Wyatt/Wade acts only when consequential.\nFill this template in Korean; output only these three lines:\n[시간: ... | 장소: ...]\n감정: ...\n사건: ..."));
      panel.append(make('p', 'wg-note', '요약 방식 입력란에 붙여 넣으세요. 다음 요약부터 적용되며, 구간별 요약이 장기기억에 덧붙습니다. 확정 사실은 별도 목록으로 쌓입니다.'));
      panel.append(make('p', 'wg-note', '요약 글자수는 매번 채우는 목표량이 아닙니다. 1,000자·3,000자 설정 시험에서는 한도를 넘자 오래된 구간이 빠지고 최근 구간이 원문 그대로 남았습니다. 지침의 분량과 형식도 항상 지켜지지는 않으므로, 중요한 약속·기한·조건은 확정 사실이나 노트에도 남겨두세요.'));
    }
  }
    renderNody("settings");return panel.outerHTML;
  }
  function nodyRecoveryBody(item){
    if(item.index===4)return handoffBody('nody');
    return itemBody(item).replace('https://rentry.co/rp-status-recovery-rhodes','https://rentry.co/rp-status-recovery-rhodes-nody');
  }
  function entry(item){
    const platformOnly=['start','recovery'].some(id=>data.groups.find(group=>group.id===id).items.includes(item));
    const html=itemBody(item);
    return '<section class="wg-item" id="'+item.id+'" data-source-index="'+item.index+'" hidden><header class="wg-entry-head"><h3>'+esc(clean(item.title).replace('복원 지침','복원 안내'))+badge(item)+'</h3></header>'+(platformOnly?'<div data-category-platform="elyn">'+html+'</div><div data-category-platform="nody" hidden>'+(data.groups.find(group=>group.id==='start').items.includes(item)?nodyBody(item):nodyRecoveryBody(item))+'</div>':html)+'</section>';
  }
  const mount=document.createElement('div');mount.className='ww-guide';mount.id='ww-guide-module';
  const platformTabs='<div class="wg-platform-slot"><nav class="wg-category-platforms wg-local-tabs" role="tablist" aria-label="설정 플랫폼">'+['elyn','nody'].map((platform,index)=>'<button type="button" role="tab" data-wg-category-platform="'+platform+'" aria-controls="wg-control-panel" aria-selected="false" tabindex="'+(index===0?'0':'-1')+'">'+platform.toUpperCase()+'</button>').join('')+'</nav></div>';
  const directory=groups.map(group=>'<section class="wg-directory-group"><h3 class="wg-directory-heading" id="wg-directory-'+group.id+'">'+esc(group.title)+'</h3><div class="wg-item-selector" id="wg-selector-'+group.id+'" data-wg-selector="'+group.id+'" role="tablist" aria-labelledby="wg-directory-'+group.id+'">'+group.items.map(item=>'<button type="button" role="tab" id="wg-item-tab-'+item.index+'" aria-controls="'+item.id+'" data-wg-item="'+item.index+'" data-item-group="'+group.id+'">'+(item.index===11?'<span>상태창 · 대사<span class="wg-directory-wrap"> 복원 안내</span></span>':esc(clean(item.title)))+badge(item)+'</button>').join('')+'</div></section>').join('');
  mount.innerHTML='<nav class="wg-directory" aria-label="가이드 전체 항목">'+directory+'</nav><div class="wg-control-panel" id="wg-control-panel"><div class="wg-content" id="wg-content">'+data.items.map(entry).join('')+'</div></div>'+platformTabs;
  root.querySelectorAll('.guide-layout,#guide-index,#guide-details,#guide-mosaic,#guide-info,#ww-guide-module').forEach(element=>element.remove());
  root.append(mount);root.classList.add('ww-guide-ready');
  mount.querySelectorAll('#guide-5 [data-category-platform]>.wg-pieces').forEach(panel=>{
    let group=null,unit=null;
    for(const child of [...panel.children]){
      if(child.matches('.wg-model-support-section')){
        if(!group){group=document.createElement('div');group.className='wg-settings-table-grid';child.before(group);}
        unit=document.createElement('div');unit.className='wg-settings-table-unit';group.append(unit);unit.append(child);
      }else if(group&&child.matches('p')){unit.append(child);}
      else{group=null;unit=null;}
    }
  });
  const mobileTables=matchMedia('(max-width:650px)');
  mount.querySelectorAll('.wg-model-support-section,.wg-status-fields,.wg-model-section').forEach(section=>{
    const table=section.querySelector('table'),grid=section.querySelector('.wg-model-grid'),heading=section.querySelector(':scope>h4');
    if(!heading||(!grid&&(!table||table.rows.length<3)))return;
    const details=document.createElement('details'),summary=document.createElement('summary');
    details.className='wg-table-disclosure';summary.textContent=heading.textContent;heading.remove();
    details.open=true;summary.tabIndex=mobileTables.matches?0:-1;
    summary.addEventListener('click',event=>{if(!mobileTables.matches)event.preventDefault();});
    details.append(summary,...section.childNodes);section.append(details);
  });
  mobileTables.addEventListener('change',()=>mount.querySelectorAll('.wg-table-disclosure').forEach(details=>{details.querySelector('summary').tabIndex=mobileTables.matches?0:-1;}));

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
  function alignBookmarkHeading(item){
    const expected=location.hash,panel=mount.querySelector('#'+item.id);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(location.hash!==expected||!panel||panel.hidden)return;
      const heading=panel.querySelector(':scope>.wg-entry-head>h3'),host=mount.querySelector('#wg-control-panel');
      if(!heading)return;
      host.style.minHeight='';
      const header=document.querySelector('.ww-site-header');
      const offset=Math.max(0,header?.getBoundingClientRect().bottom||0)+16;
      host.style.minHeight=Math.ceil(heading.getBoundingClientRect().top-host.getBoundingClientRect().top+innerHeight-offset)+'px';
      heading.tabIndex=-1;heading.focus({preventScroll:true});
      window.scrollTo({top:Math.max(0,heading.getBoundingClientRect().top+scrollY-offset),behavior:'instant'});
    }));
  }
  function synchronize(){
    const itemRoute=location.hash.match(/^#guide-(\d+)$/);
    if(itemRoute){const item=data.items[Number(itemRoute[1])];if(item){const group=data.groups.find(group=>group.items.includes(item));display(group.id,item.index);alignBookmarkHeading(item);}return;}
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
