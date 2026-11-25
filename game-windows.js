/* Shared native fullscreen with an in-page fallback for the four classic games. */
(function(){
  'use strict';
  const ids=['arcadeModal','pilotModal','prismModal','driftModal'];
  let owner=null,busy=false,lastExit=-10000;
  const native=()=>document.fullscreenElement||document.webkitFullscreenElement;
  function layout(){
    if(!owner)return;
    const shell=owner.querySelector('.game-shell');
    if(shell.classList.contains('drift-shell')){window.dispatchEvent(new Event('resize'));return;}
    const canvas=shell.querySelector('canvas'),toolbar=shell.querySelector('.game-toolbar');
    let occupied=toolbar.getBoundingClientRect().height;
    for(const c of shell.querySelectorAll('.control-pad,.mobile-enter'))if(getComputedStyle(c).display!=='none'&&!c.hidden){const style=getComputedStyle(c);occupied+=c.getBoundingClientRect().height+(parseFloat(style.marginTop)||0)+(parseFloat(style.marginBottom)||0);}
    const width=Math.min(shell.clientWidth||innerWidth,Math.max(80,(shell.clientHeight||innerHeight)-occupied-4)*820/520);
    canvas.style.width=width+'px';canvas.style.height=(width*520/820)+'px';
  }
  function sync(){for(const id of ids){const m=document.getElementById(id),on=m===owner&&(m.classList.contains('game-expanded')||native()===m);const b=m.querySelector('[data-game-fullscreen]');b.setAttribute('aria-pressed',String(on));b.textContent=on?'⛶ REDUZIR':'⛶ TELA CHEIA';}requestAnimationFrame(layout);}
  async function exit(){
    const previous=owner;owner=null;
    if(previous){previous.classList.remove('game-expanded');const c=previous.querySelector('canvas');c.style.removeProperty('width');c.style.removeProperty('height');}
    if(previous&&native()===previous){try{await(document.exitFullscreen?.()||document.webkitExitFullscreen?.());}catch(e){}}
    try{screen.orientation?.unlock?.()}catch(e){}lastExit=performance.now();sync();window.dispatchEvent(new Event('resize'));
  }
  async function toggle(id){
    const m=document.getElementById(id);if(!m||m.style.display==='none'||busy)return;
    if(owner===m){await exit();return;}
    if(owner)await exit();owner=m;busy=true;
    try{const request=m.requestFullscreen||m.webkitRequestFullscreen;if(!request)throw Error('fallback');await request.call(m);}
    catch(e){if(owner===m)m.classList.add('game-expanded');}
    finally{try{if(native())await screen.orientation?.lock?.('landscape')}catch(e){}busy=false;if(m.style.display==='none')await exit();else sync();}
  }
  for(const id of ids){
    const m=document.getElementById(id),bar=m.querySelector('.drift-top-actions')||m.querySelector('.game-toolbar');
    const b=document.createElement('button');b.type='button';b.dataset.gameFullscreen=id;b.setAttribute('aria-pressed','false');b.title='Tela cheia · F';b.textContent='⛶ TELA CHEIA';b.onclick=()=>toggle(id);
    bar.insertBefore(b,bar.lastElementChild);
    new MutationObserver(()=>{if(owner===m&&m.style.display==='none')exit();}).observe(m,{attributes:true,attributeFilter:['style']});
  }
  for(const name of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(name,()=>{if(owner&&!native()&&!owner.classList.contains('game-expanded')){const old=owner;owner=null;lastExit=performance.now();old.querySelector('canvas').style.removeProperty('width');old.querySelector('canvas').style.removeProperty('height');}sync();});
  window.addEventListener('resize',()=>{if(owner&&!owner.classList.contains('drift-shell')&&owner.id!=='driftModal')layout();});
  new MutationObserver(()=>{if(owner)requestAnimationFrame(layout)}).observe(document.body,{attributes:true,attributeFilter:['data-touch']});
  window.addEventListener('keydown',e=>{
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
    const id=ids.find(id=>document.getElementById(id).style.display!=='none');if(!id)return;
    if(e.code==='KeyF'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();toggle(id);}
    if(e.key==='Escape'&&(owner||performance.now()-lastExit<300)){e.preventDefault();e.stopImmediatePropagation();if(owner)exit();}
  },true);
  window.GameWindows={toggle,exit,get active(){return owner?.id||null}};
})();
