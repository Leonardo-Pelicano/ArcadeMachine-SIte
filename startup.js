/* Visible startup diagnostics: no telemetry, requests or automatic data sharing. */
(function(){
'use strict';
const version=document.documentElement.dataset.version||'?',issues=[];let ready=false,panel=null,lastAction=null;
function report(){return JSON.stringify({version,ready,url:location.protocol==='file:'?'arquivo local':location.origin+location.pathname,browser:navigator.userAgent,phase:document.body?.dataset.phase,renderer:document.body?.dataset.renderer,lastAction,buttons:['enter','gentle','start','play'].map(id=>{const b=document.getElementById(id);return {id,handler:typeof b?.onclick==='function',disabled:b?.disabled}}),issues},null,2);}
function show(){
 if(!document.body)return;
 if(!panel){panel=document.createElement('aside');panel.id='startupProblem';panel.setAttribute('role','alert');panel.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;z-index:100000;max-width:700px;margin:auto;padding:18px;border:1px solid #d6afef;border-radius:10px;background:#101a30;color:#f4ecff;font:14px/1.5 system-ui;box-shadow:0 10px 50px #0009';
 const title=document.createElement('strong');title.id='startupProblemTitle';panel.append(title);
 const text=document.createElement('p');text.id='startupProblemText';panel.append(text);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
 for(const [label,fn]of[['Recarregar',()=>location.reload()],['Copiar diagnóstico',async()=>{const data=report();try{if(!navigator.clipboard?.writeText)throw Error('clipboard');await navigator.clipboard.writeText(data);text.textContent='Diagnóstico copiado. Cole a mensagem na conversa.';}catch(e){const area=document.createElement('textarea');area.readOnly=true;area.value=data;area.style.cssText='width:100%;height:140px;margin-top:12px';panel.append(area);area.focus();area.select();}}],['Fechar',()=>{panel.remove();panel=null;}]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='cursor:pointer;padding:9px 12px;color:#151a31;background:#cda8f1;border:0;border-radius:4px;font:600 13px system-ui';b.onclick=fn;actions.append(b);}panel.append(actions);document.body.append(panel);}
 panel.querySelector('strong').textContent=ready?(issues.length?'O jogo encontrou um erro.':'Arcade V'+version+' · diagnóstico'):'Não foi possível iniciar o arcade.';
 panel.querySelector('p').textContent=(issues[0]?.message||(ready?'A inicialização terminou. Se algum botão não responde, copie o diagnóstico.':'O JavaScript de inicialização não terminou de carregar.'))+' Use “Copiar diagnóstico” para conferir a falha.';
}
function record(message,file='',line=0){message=String(message);if(issues.length>=8||issues.some(i=>i.message===message&&i.file===file&&i.line===line))return;issues.push({message,file,line});show();}
window.addEventListener('error',e=>{if(e.target?.tagName==='SCRIPT')record('Arquivo JavaScript não carregado: '+e.target.getAttribute('src'),e.target.src);else if(e.message)record(e.message,e.filename,e.lineno);},true);
window.addEventListener('unhandledrejection',e=>{record(e.reason?.message||String(e.reason));});
window.addEventListener('load',()=>{setTimeout(()=>{if(!ready&&!issues.length)record('A inicialização não terminou. Verifique os arquivos JavaScript publicados.');},1500);});
function bindHelp(){const b=document.getElementById('startupHelp');if(b)b.onclick=show;}
window.addEventListener('pointerdown',e=>{if(e.target.closest?.('#startupProblem,#startupHelp')||document.body?.dataset.phase==='game')return;lastAction={target:e.target.id||e.target.tagName};try{lastAction.layers=document.elementsFromPoint(e.clientX,e.clientY).slice(0,5).map(n=>({id:n.id,tag:n.tagName,pointerEvents:getComputedStyle(n).pointerEvents}));}catch(e){}},true);
document.addEventListener('DOMContentLoaded',bindHelp);
window.ArcadeStartup={report,open:show,get ready(){return ready},finish(){const missing=['ArcadeAudio','ArcadeScreen','ArcadePortal','games','PrismGame','DriftGame','SeleneGame','TouchArcade'].filter(name=>!window[name]);if(missing.length){record('Módulos ausentes: '+missing.join(', '));return;}ready=true;bindHelp();const label=document.getElementById('buildVersion');if(label)label.textContent='V'+version;}};
})();
