/* CC0 audio, local files, pooled effects and separate music / master switches. */
(function(){'use strict';
const files={menu:'assets/audio/menu.mp3',arcade:'assets/audio/arcade.mp3',pilot:'assets/audio/pilot.mp3',laser:'assets/audio/laser.mp3',explosion:'assets/audio/explosion.mp3',hit:'assets/audio/hit.mp3',electric:'assets/audio/electric.mp3',warp:'assets/audio/warp.mp3',prism:'assets/audio/prism.mp3',laugh:'assets/audio/laugh.mp3',laughFinal:'assets/audio/laugh-final.mp3',bossLaser:'assets/audio/boss-laser.mp3',enemyLaser:'assets/audio/enemy-laser.mp3',gameover:'assets/audio/gameover.mp3'};
for(const key of ['shot_scout', 'shot_striker', 'shot_armor', 'shot_prism', 'shot_sniper', 'shot_weaver', 'shot_bomber', 'shot_splitter', 'shot_phantom', 'shot_carrier', 'boss_1', 'boss_2', 'boss_3', 'boss_4', 'boss_5', 'boss_super'])files[key]='assets/audio/'+key+'.mp3';
const musicNames=new Set(['menu','arcade','pilot','prism']);
const buffers=new Map(),pending=new Map(),voices=new Set(),counts={},lastEffectAt=new Map();
let context=null,master=null,musicBus=null,effectBus=null,current='menu',muted=false,musicEnabled=true,activated=false,musicVoice=null,musicLoading=null,musicSerial=0,lastError='',fallback=location.protocol==='file:',background=null,fallbackTrack=null,fallbackReady=false;
const fallbackEffects=[];
const now=()=>performance.now();
function emit(){window.dispatchEvent(new Event('arcadeaudiochange'));}
function ramp(param,value){if(!param)return;try{param.cancelScheduledValues(context.currentTime);param.setTargetAtTime(value,context.currentTime,.018);}catch(e){param.value=value;}}
function gains(){if(master)ramp(master.gain,muted||document.hidden?0:.8);if(musicBus)ramp(musicBus.gain,musicEnabled ? .30 : 0);if(background){background.muted=muted||!musicEnabled||document.hidden;background.volume=.24;}}
function ensureContext(){
 if(fallback)return null;if(context&&context.state!=='closed')return context;
 const Constructor=window.AudioContext||window.webkitAudioContext;if(!Constructor){fallback=true;return null;}
 try{try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){}try{context=new Constructor({latencyHint:'interactive'});}catch(e){context=new Constructor();}
 master=context.createGain();musicBus=context.createGain();effectBus=context.createGain();master.gain.value=muted?0:.8;musicBus.gain.value=musicEnabled ? .30 : 0;effectBus.gain.value=1;musicBus.connect(master);effectBus.connect(master);master.connect(context.destination);
 context.addEventListener?.('statechange',()=>{gains();if(context.state==='running')startMusic();emit();});return context;
 }catch(e){lastError='Áudio indisponível neste navegador.';context=null;fallback=true;return null;}
}
function playMedia(node){try{const result=node.play();return Promise.resolve(result);}catch(e){return Promise.reject(e);}}
function startFallback(){if(!activated||!current||muted||!musicEnabled||document.hidden)return;
 try{if(!background){background=new Audio();background.preload='metadata';background.loop=true;}
 if(fallbackTrack!==current){background.pause();background.src=files[current];fallbackTrack=current;fallbackReady=false;}
 gains();if(!background.paused&&fallbackReady)return;playMedia(background).then(()=>{fallbackReady=true;lastError='';emit();}).catch(()=>{fallbackReady=false;lastError='Toque em ATIVAR SOM para liberar o áudio.';emit();});
 }catch(e){lastError='Não foi possível iniciar o áudio.';emit();}}
function stopMusicVoice(){const old=musicVoice;musicVoice=null;if(old){try{old.source.stop();}catch(e){}try{old.source.disconnect();}catch(e){}}if(background)background.pause();}
function decode(bytes){return new Promise((resolve,reject)=>{let settled=false;const yes=value=>{if(!settled){settled=true;resolve(value);}},no=error=>{if(!settled){settled=true;reject(error);}};try{const result=context.decodeAudioData(bytes,yes,no);if(result?.then)result.then(yes,no);}catch(e){no(e);}});}
function load(key){
 if(buffers.has(key))return Promise.resolve(buffers.get(key));if(pending.has(key))return pending.get(key);
 const request=fetch(new URL(files[key],document.baseURI).href).then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.arrayBuffer();}).then(decode).then(buffer=>{
 if(musicNames.has(key)){for(const old of buffers.keys())if(musicNames.has(old)&&old!=='menu'&&old!==current)buffers.delete(old);if(key==='menu'||key===current)buffers.set(key,buffer);}else buffers.set(key,buffer);return buffer;
 }).finally(()=>pending.delete(key));pending.set(key,request);return request;
}
function startMusic(){
 if(!activated||!current||!musicEnabled||muted||document.hidden)return;if(fallback){startFallback();return;}
 if(!context||context.state!=='running')return;if(musicVoice?.key===current)return;
 if(musicLoading?.key===current&&musicLoading.serial===musicSerial)return;
 const job={key:current,serial:musicSerial};musicLoading=job;
 load(job.key).then(buffer=>{if(musicLoading===job)musicLoading=null;if(job.serial!==musicSerial||job.key!==current||muted||!musicEnabled||document.hidden||context.state!=='running')return;
 stopMusicVoice();const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(musicBus);musicVoice={source,key:job.key};source.onended=()=>{if(musicVoice?.source===source){musicVoice=null;emit();}};source.start(0);lastError='';emit();
 }).catch(()=>{if(musicLoading===job)musicLoading=null;lastError='Não foi possível carregar a música. Toque no som para tentar novamente.';emit();});
}
function unlock(){
 activated=true;ensureContext();if(fallback){startFallback();emit();return Promise.resolve(fallbackReady);}
 if(!context){emit();return Promise.resolve(false);}
 try{const result=context.state==='running'?Promise.resolve():context.resume();
 // A silent sample and resume are started synchronously inside the gesture for Safari.
 if(context.state!=='running'){const silent=context.createBufferSource();silent.buffer=context.createBuffer(1,1,context.sampleRate||44100);silent.connect(master);silent.onended=()=>silent.disconnect();silent.start(0);}
 startMusic();return Promise.resolve(result).then(()=>{gains();startMusic();emit();return context.state==='running';}).catch(()=>{lastError='Toque em ATIVAR SOM para liberar o áudio.';emit();return false;});
 }catch(e){lastError='Toque em ATIVAR SOM para liberar o áudio.';emit();return Promise.resolve(false);}
}
function prepare(){if(activated)ensureContext();}
function music(name){if(name!==null&&!musicNames.has(name))return;if(current!==name){current=name;musicSerial++;musicLoading=null;stopMusicVoice();}startMusic();emit();}
function stopEffects(){for(const voice of [...voices]){try{voice.source.stop();}catch(e){}try{voice.source.disconnect();voice.gain.disconnect();}catch(e){}voices.delete(voice);}for(const a of fallbackEffects){try{a.pause();a.currentTime=0;}catch(e){}}}
function playEffectBuffer(buffer,volume){if(voices.size>=12){const oldest=voices.values().next().value;try{oldest.source.stop();oldest.source.disconnect();oldest.gain.disconnect();}catch(e){}voices.delete(oldest);}
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain);gain.connect(effectBus);const voice={source,gain};voices.add(voice);source.onended=()=>{voices.delete(voice);try{source.disconnect();gain.disconnect();}catch(e){}};source.start(0);}
function fallbackEffect(name,volume){try{let a=fallbackEffects.find(a=>a.paused||a.ended);if(!a&&fallbackEffects.length<4){a=new Audio();a.preload='metadata';fallbackEffects.push(a);}if(!a){a=fallbackEffects.shift();fallbackEffects.push(a);a.pause();}a.src=files[name];a.volume=volume;playMedia(a).catch(()=>{});}catch(e){}}
function effect(name,volume=.3){if(!files[name]||musicNames.has(name)||muted||document.hidden)return;counts[name]=(counts[name]||0)+1;if(!activated)return;
 volume=Math.max(0,Math.min(1,volume));if(fallback){fallbackEffect(name,volume);return;}if(!context||context.state!=='running')return;
 const at=now();if(at-(lastEffectAt.get(name)||-Infinity)<35)return;lastEffectAt.set(name,at);
 if(buffers.has(name)){playEffectBuffer(buffers.get(name),volume);return;}
 load(name).then(buffer=>{if(!muted&&!document.hidden&&context.state==='running'&&lastEffectAt.get(name)===at&&now()-at<700)playEffectBuffer(buffer,volume);}).catch(()=>{});
}
function setMuted(value){muted=!!value;gains();if(muted){musicSerial++;musicLoading=null;stopMusicVoice();stopEffects();}else startMusic();emit();}
function toggleMusic(){musicEnabled=!musicEnabled;musicSerial++;musicLoading=null;gains();if(!musicEnabled)stopMusicVoice();else startMusic();emit();return musicEnabled;}
function userGesture(event){if(event.type==='keydown'&&(event.metaKey||event.ctrlKey||event.altKey||/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)))return;
 if(event.target?.closest?.('#sound,#driftSound,#seleneSound,#music,#driftMusic,#seleneMusic'))return;
 if(!muted&&(!activated||!context||context.state!=='running'||!musicVoice))unlock();}
for(const type of ['pointerdown','pointerup','touchend','click'])window.addEventListener(type,userGesture,{capture:true,passive:true});window.addEventListener('keydown',userGesture,true);
document.addEventListener('visibilitychange',()=>{gains();if(document.hidden)stopEffects();else if(activated&&!muted)unlock();});
window.addEventListener('pageshow',()=>{if(activated&&!muted)unlock();});
window.ArcadeAudio={prepare,unlock,music,effect,setMuted,toggleMusic,stopEffects,get context(){return context;},get master(){return master;},get state(){return {current,unlocked:fallback?fallbackReady:context?.state==='running',activated,muted,musicEnabled,playing:fallback?!!background&&!background.paused&&!background.muted:!!musicVoice&&context?.state==='running'&&!muted&&musicEnabled&&!document.hidden,counts:{...counts},effectsReady:Object.fromEntries(Object.keys(files).filter(k=>!musicNames.has(k)).map(k=>[k,buffers.has(k)?4:0])),ready:buffers.has(current)||fallbackReady?4:0,activeEffects:voices.size,fallbackElements:fallbackEffects.length+(background?1:0),cachedBuffers:buffers.size,error:lastError};}};
})();
