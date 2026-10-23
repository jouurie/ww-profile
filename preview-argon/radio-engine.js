/* Playback-only extraction of the supplied Tistory RieYouTube wrapper. */
(() => {
  'use strict';
  const tracks=Object.freeze([
  {
    "name": "와이어트, 웨이드 | DMX - Ruff Ryders’ Anthem",
    "url": "https://www.youtube.com/watch?v=3xpI7VZVw6g"
  },
  {
    "name": "와이어트, 웨이드 | Fun Lovin’ Criminals - Scooby Snacks",
    "url": "https://www.youtube.com/watch?v=tQMDud01WPo"
  },
  {
    "name": "와이어트, 웨이드 | N.O.R.E. - SuperThug",
    "url": "https://www.youtube.com/watch?v=DBFakPDWJKw"
  },
  {
    "name": "와이어트, 웨이드 | Republica - Ready to Go",
    "url": "https://www.youtube.com/watch?v=5aLfCslnRr4"
  },
  {
    "name": "와이어트, 웨이드 | JAY-Z - Money, Cash, Hoes",
    "url": "https://www.youtube.com/watch?v=aG-O6jHe-8M"
  },
  {
    "name": "와이어트, 웨이드 | The Cardigans - My Favourite Game",
    "url": "https://www.youtube.com/watch?v=EvIG8Gl6038"
  },
  {
    "name": "와이어트, 웨이드 | Mase - Feel So Good",
    "url": "https://www.youtube.com/watch?v=vdDuFUgAeH0"
  },
  {
    "name": "와이어트, 웨이드 | Third Eye Blind - Semi-Charmed Life",
    "url": "https://www.youtube.com/watch?v=beINamVRGy4"
  },
  {
    "name": "와이어트, 웨이드 | Metallica - Fuel",
    "url": "https://www.youtube.com/watch?v=azCq5qQodU8"
  },
  {
    "name": "와이어트, 웨이드 | Lo Fidelity Allstars - Battleflag",
    "url": "https://www.youtube.com/watch?v=o2BNpK01eww"
  },
  {
    "name": "와이어트, 웨이드 | Fastball - The Way",
    "url": "https://www.youtube.com/watch?v=3ZolDgbV6qI"
  },
  {
    "name": "와이어트, 웨이드 | Busta Rhymes - Put Your Hands Where My Eyes Could See",
    "url": "https://www.youtube.com/watch?v=Kh6rsAeVSNs"
  }
].map(track=>Object.freeze(track)));
  const youtube=window.RieYouTube?.sdk&&window.RieYouTube?.create?window.RieYouTube:(() => {
    let promise;
    function videoId(url){
      const parsed=new URL(url),id=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v');
      if(!['youtu.be','youtube.com','www.youtube.com'].includes(parsed.hostname)||!/^[-\w]{11}$/.test(id||''))throw Error('유튜브 곡 주소를 확인해 주세요.');
      return id;
    }
    function sdk(){
      if(window.YT?.Player)return Promise.resolve();
      if(!promise)promise=new Promise((resolve,reject)=>{
        const previous=window.onYouTubeIframeAPIReady;
        const timer=setTimeout(()=>{promise=null;reject(Error('YouTube 연결이 늦습니다. 재생 버튼을 다시 눌러 주세요.'));},15000);
        window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);try{previous?.();}finally{resolve();}};
        const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
        script.onerror=()=>{clearTimeout(timer);promise=null;reject(Error('YouTube를 불러오지 못했습니다.'));};document.head.append(script);
      });
      return promise;
    }
    function create(host,url,hooks){
      let dead=false,timer,current=url;
      const player=new window.YT.Player(host,{
        width:200,height:200,videoId:videoId(url),
        playerVars:{playsinline:1,autoplay:0,controls:1,origin:window.location.origin},
        events:{
          onReady:()=>{if(dead)return;hooks.ready();timer=setInterval(()=>{if(!dead)hooks.progress(player.getCurrentTime()*1000,player.getDuration()*1000);},500);},
          onStateChange:event=>{if(dead)return;if(event.data===1)hooks.play();else if(event.data===2||event.data===5)hooks.pause();else if(event.data===0)hooks.finish();},
          onError:event=>{if(dead)return;hooks.pause();hooks.error(event.data);},
          onAutoplayBlocked:()=>{if(!dead){hooks.pause();hooks.blocked();}}
        }
      });
      const frame=player.getIframe?.();if(frame){frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.referrerPolicy='strict-origin-when-cross-origin';}
      return {
        play(){if(!dead)player.playVideo();},pause(){if(!dead&&player.pauseVideo)player.pauseVideo();},
        setVolume(value){if(!dead)player.setVolume(value);},
        seekTo(ms){if(!dead)player.seekTo(ms/1000,true);},
        getDuration(callback){callback(dead?0:player.getDuration()*1000);},
        load(next,options){if(dead)return;current=next;if(options.auto_play)player.loadVideoById(videoId(next));else player.cueVideoById(videoId(next));options.callback?.();},
        destroy(){if(dead)return;dead=true;clearInterval(timer);player.destroy();}
      };
    }
    return {sdk,create};
  })();

  let host=null,slot=null,listener=null,widget=null,connecting=null;
  let generation=0,request=0,loadedIndex=-1,wantsPlay=false,pendingSeek=null,loadTimer=null;
  let state={index:0,playing:false,current:0,duration:0,volume:70,error:null,ready:false};
  let lastVolume=70;
  const snapshot=()=>({...state,muted:state.volume===0,tracks});
  function publish(){const value=snapshot();try{listener?.(value);}catch{/* A UI observer cannot interrupt playback cleanup. */}window.dispatchEvent(new CustomEvent('ww-radio-state',{detail:value}));return value;}
  function setError(message){clearTimeout(loadTimer);state.error=message;state.playing=false;wantsPlay=false;publish();}
  function apply(){
    if(!widget||!state.ready)return;
    const token=generation,selection=request;
    const finish=()=>{
      if(token!==generation||!widget)return;
      if(selection!==request){state.ready=true;apply();return;}
      state.ready=true;widget.setVolume(state.volume);
      if(pendingSeek!==null){widget.seekTo(pendingSeek*1000);pendingSeek=null;}
      widget.getDuration(ms=>{if(token===generation&&selection===request){state.duration=Math.max(0,Number(ms)||0)/1000;publish();}});
    };
    try{
      if(loadedIndex!==state.index){
        state.ready=false;loadedIndex=state.index;const playAtLoad=wantsPlay;
        widget.load(tracks[state.index].url,{auto_play:playAtLoad,callback:()=>{finish();if(token===generation&&selection===request&&widget&&wantsPlay!==playAtLoad){if(wantsPlay)widget.play();else widget.pause();}}});
      }else{finish();if(wantsPlay)widget.play();else widget.pause();}
    }catch(error){state.ready=!!widget;setError(error.message||'재생 명령을 처리하지 못했습니다.');}
  }
  function connect(){
    if(!host){setError('먼저 재생기 위치를 연결해 주세요.');return;}
    if(widget){apply();return;}
    if(connecting)return;
    const token=generation;
    const operation=youtube.sdk().then(()=>{
      if(token!==generation||!host)return;
      slot=document.createElement('div');host.append(slot);loadedIndex=state.index;
      clearTimeout(loadTimer);loadTimer=setTimeout(()=>{if(token===generation&&!state.ready){generation++;const stale=widget;widget=null;loadedIndex=-1;try{stale?.destroy();}catch{}slot?.remove();slot=null;setError('곡 응답이 늦습니다. 재생 버튼으로 다시 시도해 주세요.');}},20000);
      const live=()=>token===generation;
      widget=youtube.create(slot,tracks[state.index].url,{
        ready:()=>{if(!live())return;clearTimeout(loadTimer);state.ready=true;apply();publish();},
        play:()=>{if(!live())return;if(!wantsPlay){widget?.pause();return;}state.playing=true;state.error=null;publish();},
        pause:()=>{if(live()){state.playing=false;publish();}},
        progress:(position,total)=>{if(!live()||loadedIndex!==state.index)return;state.current=Math.max(0,Number(position)||0)/1000;state.duration=Math.max(0,Number(total)||0)/1000;publish();},
        finish:()=>{if(!live())return;state.playing=false;if(wantsPlay)select((state.index+1)%tracks.length,true);else publish();},
        error:code=>{if(live())setError('YouTube 재생 오류 ('+code+'). 다른 곡을 선택해 주세요.');},
        blocked:()=>{if(live())setError('재생 버튼을 다시 눌러 주세요.');}
      });
    }).catch(error=>{if(token===generation)setError(error.message||'YouTube를 연결하지 못했습니다.');}).finally(()=>{if(connecting===operation)connecting=null;});
    connecting=operation;
  }
  function init(element,onState){
    destroy();
    host=typeof element==='string'?document.getElementById(element):element;
    if(!host||typeof host.append!=='function')throw TypeError('재생기를 담을 요소가 필요합니다.');
    listener=typeof onState==='function'?onState:null;
    state={index:0,playing:false,current:0,duration:0,volume:70,error:null,ready:false};
    lastVolume=state.volume;
    return publish();
  }
  function select(index,autoPlay=false){
    const value=Number(index);if(!Number.isInteger(value)||value<0||value>=tracks.length)return snapshot();
    if(value===state.index){wantsPlay=!!autoPlay;state.error=null;if(widget&&state.ready)apply();else if(wantsPlay)connect();return publish();}
    request++;state.index=value;state.current=0;state.duration=0;state.playing=false;state.error=null;pendingSeek=null;wantsPlay=!!autoPlay;
    publish();if(widget&&state.ready)apply();else if(wantsPlay)connect();
    return snapshot();
  }
  function play(){wantsPlay=true;state.error=null;publish();connect();return snapshot();}
  function pause(){wantsPlay=false;try{widget?.pause();}catch{}state.playing=false;return publish();}
  function toggle(){return wantsPlay?pause():play();}
  function prev(){return select((state.index-1+tracks.length)%tracks.length,true);}
  function next(){return select((state.index+1)%tracks.length,true);}
  function seek(seconds){
    const value=Number(seconds);if(!Number.isFinite(value))return snapshot();
    const target=Math.min(state.duration||Infinity,Math.max(0,value));state.current=target;
    if(widget&&state.ready)widget.seekTo(target*1000);else pendingSeek=target;
    return publish();
  }
  function volume(value){
    const level=Number(value);if(!Number.isFinite(level))return snapshot();
    state.volume=Math.max(0,Math.min(100,level));if(state.volume>0)lastVolume=state.volume;if(widget&&state.ready)widget.setVolume(state.volume);return publish();
  }
  function mute(){return volume(state.volume===0?lastVolume:0);}
  function destroy(){
    generation++;request++;clearTimeout(loadTimer);loadTimer=null;connecting=null;wantsPlay=false;pendingSeek=null;loadedIndex=-1;
    const current=widget;widget=null;
    try{current?.pause();}catch{}try{current?.destroy();}catch{}
    slot?.remove();slot=null;host=null;state.ready=false;state.playing=false;state.current=0;state.duration=0;state.error=null;
    const value=publish();listener=null;return value;
  }
  window.WWRadioEngine=Object.freeze({init,select,play,pause,toggle,prev,next,seek,volume,mute,destroy,get state(){return snapshot();}});
})();
