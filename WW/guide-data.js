(() => {
  'use strict';
  const definitions=[
    {id:'start',title:'시작 전 설정',sources:[3,5,6,7,8]},
    {id:'play',title:'플레이 방법',sources:[0,1,2]},
    {id:'commands',title:'명령어 · 상태창',sources:[9,10]},
    {id:'recovery',title:'복원 · 이전',sources:[4,11]}
  ];
  function divide(text){
    const starts=[0,...[...text.matchAll(/^▸ /gm)].map(match=>match.index)].filter((value,index,array)=>index===0||value!==array[index-1]);
    return starts.map((start,index)=>{
      const raw=text.slice(start,starts[index+1]??text.length);
      const first=raw.split('\n')[0];
      const marked=first.startsWith('▸ ');
      const body=marked?raw.slice(first.length).replace(/^\n/,''):raw;
      const offsets=[0,...[...body.matchAll(/^· /gm)].map(match=>match.index)].filter((value,i,array)=>i===0||value!==array[i-1]);
      const units=offsets.map((offset,i)=>body.slice(offset,offsets[i+1]??body.length)).filter(Boolean);
      return Object.freeze({raw,heading:marked?first.slice(2):'',body,units:Object.freeze(units)});
    });
  }
  function build(WW){
    const source=WW?.supplement?.slice(0,12);
    if(!source||source.length!==12)throw Error('가이드 원문 12항목이 필요합니다.');
    const items=source.map((entry,index)=>Object.freeze({
      id:'guide-'+index,index,title:entry.title.replace(/^⭐\s*/,''),recommended:entry.title.includes('⭐'),
      text:entry.text,platform:index<3||index===9?'common':'elyn',
      sections:Object.freeze(divide(entry.text))
    }));
    const groups=definitions.map(group=>Object.freeze({...group,items:Object.freeze(group.sources.map(index=>items[index]))}));
    const modelSection=items[6].sections.find(section=>section.heading==='모델별 특징 · 개별 추론');
    const operation=items[6].sections.find(section=>section.heading==='운용')?.body||'';
    const models=(modelSection?.units||[]).map(raw=>{
      const rows=raw.trim().split('\n'),first=rows.shift().replace(/^· /,'');
      const colon=first.indexOf(':');
      const name=colon<0?first:first.slice(0,colon),value=colon<0?'':first.slice(colon+1).trim();
      const notes=rows.filter(line=>line.trim()).flatMap(line=>line.replace(/^↳ /,'').split(/(?<=[.!?])\s+(?=[^\d])/)).map(text=>Object.freeze({text,kind:/계속 사용하면|강해질 수|빠르게 기울|몰아가는 경향/.test(text)?'caution':'feature'}));
      return Object.freeze({name,value,raw,recommended:operation.includes(name),notes:Object.freeze(notes)});
    });
    // Explicit native mappings checked against both status components and NODY COMMANDS.
    const native=Object.freeze({'!이어서':'/이어서','!잠시후':'/잠시후','!사건':'/사건','!장면고조':'/장면고조','!장면완화':'/장면완화','!회복':'/회복','!스킵':'/스킵','!이벤트':'/이벤트','!핀볼':'/핀볼','!라디오':'/라디오','!로그북':'/로그북','!다음날':'/다음날','!다음달':'/다음달'});
    const commandGroups=Object.freeze([
      Object.freeze({title:'이어가기 · 시간',names:Object.freeze(['!이어서','!잠시후','!다음날','!다음달'])}),
      Object.freeze({title:'사건 · 분위기',names:Object.freeze(['!사건','!장면고조','!장면완화','!이벤트'])}),
      Object.freeze({title:'출력 · 장면 전환',names:Object.freeze(['!회복','!스킵'])}),
      Object.freeze({title:'패널 · 게임',names:Object.freeze(['!핀볼','!라디오','!로그북'])})
    ]);
    const commands=items[9].sections.filter(part=>part.heading.startsWith('!')).map(part=>{
      const split=part.heading.indexOf(' | '),elyn=part.heading.slice(0,split);
      return Object.freeze({elyn,nody:native[elyn],description:part.heading.slice(split+3),raw:part.raw,pinball:elyn==='!핀볼'});
    });
    return Object.freeze({items:Object.freeze(items),groups:Object.freeze(groups),models:Object.freeze(models),commands:Object.freeze(commands),commandGroups});
  }
  window.WWGuideData=Object.freeze({build});
})();
