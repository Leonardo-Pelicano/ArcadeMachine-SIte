/* Original TK–87 finale: seven camera setups, a timeline shared with physics,
   hand-drawn scenery, existing component models and Pelicano's original portrait. */
(function(root){
'use strict';
const A=root.SeleneArt,P=root.SeleneParts,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>{t=clamp(t);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
const shots=[
 {start:0,end:5.5,key:'orbit',title:'01 / A ÚLTIMA SUBIDA',speaker:'CONTROLE P–87',line:'48 quilômetros. Vetor de interceptação confirmado.'},
 {start:5.5,end:12,key:'lab',title:'02 / O ÚLTIMO SINAL',speaker:'DR. PELICANO',line:'Estou vendo você. A Terra inteira está aqui embaixo.'},
 {start:12,end:19,key:'ground',title:'03 / OLHOS NO CÉU',speaker:'DR. PELICANO',line:'Só mais um pouco… não desista agora.'},
 {start:19,end:25,key:'burn',title:'04 / TUDO O QUE RESTA',speaker:'P–87',line:'Auxiliar no limite. Trajetória final.'},
 {start:25,end:30.5,key:'impact',title:'05 / UM PONTO DE LUZ',speaker:'DR. PELICANO',line:'Vamos, meu pequeno foguete…'},
 {start:30.5,end:36,key:'relief',title:'06 / DEPOIS DO SILÊNCIO',speaker:'DR. PELICANO',line:'Você conseguiu. A gente conseguiu.'},
 {start:36,end:42,key:'saved',title:'07 / UM NOVO AMANHECER',speaker:'TRANSMISSÃO RESTABELECIDA',line:'A ameaça se partiu. A Terra continua aqui.'},
];
function sample(age){const i=shots.findIndex(s=>age<s.end);const index=i<0?shots.length-1:i;return {...shots[index],index,progress:clamp((age-shots[index].start)/(shots[index].end-shots[index].start))};}
function line(g,points,color,width=1){g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function gradient(g,w,h,top,bottom){const z=g.createLinearGradient(0,0,0,h);z.addColorStop(0,top);z.addColorStop(1,bottom);g.fillStyle=z;g.fillRect(0,0,w,h);}
function glow(g,x,y,r,color){const z=g.createRadialGradient(x,y,0,x,y,Math.max(1,r));z.addColorStop(0,color);z.addColorStop(1,color.slice(0,7)+'00');g.fillStyle=z;g.fillRect(x-r,y-r,r*2,r*2);}
function stars(g,w,h,t,amount=100){for(let i=0;i<amount;i++){const x=((i*179.37+23)%997)/997*w,y=((i*97.19+7)%701)/701*h;g.fillStyle=i%6?'#d9e5e1':'#a1d9e4';g.save();g.globalAlpha*=.3+.5*(.5+.5*Math.sin(t*.5+i));g.fillRect(x,y,i%9?1:2,i%9?1:2);g.restore();}}
function rocket(g,x,y,size,angle,levels,t,fire=true){P.rocket(g,x,y,size,angle,levels,t,fire,fire,0,false,1);}
function smokeTrail(g,ax,ay,bx,by,t,color='#d5e7e08c',width=4){g.save();g.strokeStyle=color;g.lineWidth=Math.max(.6,width*.65);g.beginPath();g.moveTo(ax,ay);g.quadraticCurveTo(mix(ax,bx,.5)+Math.sin(t)*width,mix(ay,by,.5),bx,by);g.stroke();for(let i=0;i<22;i++){const u=i/22;g.globalAlpha*=1;const x=mix(ax,bx,u)+Math.sin(i*1.3+t)*width*.4,y=mix(ay,by,u);g.beginPath();g.arc(x,y,Math.max(.3,width*(1-u)),0,Math.PI*2);g.fillStyle=color;g.fill();}g.restore();}
function city(g,w,h,t){
 const horizon=h*.75;
 g.fillStyle='#1f3446';g.beginPath();g.moveTo(0,horizon);for(let i=0;i<=18;i++)g.lineTo(i*w/18,horizon-Math.sin(i*1.7)**2*h*.095);g.lineTo(w,h);g.lineTo(0,h);g.fill();
 g.fillStyle='#101f30';g.beginPath();g.moveTo(0,h*.83);for(let i=0;i<=22;i++)g.lineTo(i*w/22,h*.83-Math.sin(i*2.3+1)**2*h*.065);g.lineTo(w,h);g.lineTo(0,h);g.fill();
 for(let i=0;i<24;i++){const x=i*w/23,bh=h*(.035+((i*17)%13)/160),bw=w/29;g.fillStyle=i%3?'#0a1827':'#112338';g.fillRect(x,h*.88-bh,bw,bh+h*.12);for(let k=0;k<3;k++)if((i+k)%3){g.fillStyle='#c09b5e';g.fillRect(x+bw*.22,h*.88-bh+6+k*8,2,2);}}
 g.fillStyle='#091520';g.fillRect(0,h*.94,w,h*.06);
 // Observatory on the ridge: a recognizable place, not a second planet.
 const x=w*.13,y=h*.83,r=Math.min(w,h)*.035;g.fillStyle='#101b29';g.fillRect(x-r,y,r*2,r*1.6);g.beginPath();g.arc(x,y,r,Math.PI,0);g.fill();line(g,[[x+r*.2,y-r*.4],[x+r*1.3,y-r*1.3]],'#182536',r*.34);
}
function ground(g,w,h,t,p,impact=false){
 gradient(g,w,h,'#080f2b',impact?'#59616a':'#373956');stars(g,w,h,t);
 const hit=impact?clamp((p-.4)/.6):0;
 const tx=impact?mix(w*.69,w*.54,ease(p/.4)):mix(w*.79,w*.66,p),ty=impact?mix(h*.23,h*.34,ease(p/.4)):mix(h*.14,h*.22,p);
 if(!impact||p<.43){smokeTrail(g,tx+w*.14,ty-h*.18,tx,ty,t,'#d58e5688',Math.min(w,h)*.014);A.threat(g,tx,ty,Math.min(w,h)*.025,t);}
 const rx=impact?mix(w*.36,w*.54,ease(p/.4)):mix(w*.3,w*.43,p),ry=impact?mix(h*.59,h*.34,ease(p/.4)):mix(h*.69,h*.47,p);
 if(!impact||p<.43){smokeTrail(g,w*.24,h*.88,rx,ry,t,'#e4dac299',Math.min(w,h)*.005);glow(g,rx,ry,Math.min(w,h)*.025,'#fff1ba99');g.fillStyle='#fff1c8';g.beginPath();g.arc(rx,ry,Math.max(1.5,Math.min(w,h)*.004),0,Math.PI*2);g.fill();}
 if(impact&&p>.4){
 const x=w*.54,y=h*.34,a=clamp((p-.4)/.6);
 glow(g,x,y,Math.min(w,h)*(.08+a*.47),'#ffd8a6'+(Math.round((1-a*.65)*220).toString(16).padStart(2,'0')));
 g.save();g.globalAlpha*=Math.max(0,1-a*.8);g.strokeStyle='#ffe8c0';g.lineWidth=2;g.beginPath();g.ellipse(x,y,Math.max(1,a*w*.55),Math.max(1,a*h*.22),-.15,0,Math.PI*2);g.stroke();g.restore();
 for(let i=0;i<34;i++){const theta=i*2.399,d=a*(.1+(i%9)*.017)*w,dx=Math.cos(theta)*d,dy=Math.sin(theta)*d*.4;line(g,[[x+dx*.8,y+dy*.8],[x+dx,y+dy]],i%3?'#e8bf83':'#e5e7ce',Math.max(1,3-a*2));}
 const flash=Math.max(0,1-a*5);if(flash){g.save();g.globalAlpha*=flash*.43;g.fillStyle='#ffe6b8';g.fillRect(0,0,w,h);g.restore();}
 }
 city(g,w,h,t);
}
function laboratory(g,w,h,t,p,relief){
 gradient(g,w,h,'#122737','#304447');
 const x=w*.65,y=h*.4,r=Math.min(w*.28,h*.29);
 g.save();g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.clip();gradient(g,w,h,'#13172f',relief?'#ca9a78':'#3b4055');stars(g,w,h,t,75);
 if(relief){glow(g,x+r*.1,y-r*.2,r*1.2,'#ffe6ac88');for(let i=0;i<8;i++){const sx=x-r*.7+i*r*.2;line(g,[[sx,y-r*.7],[sx+r*.1,y-r*.45]],'#f2d3a080',1);}}
 else{const sx=x-r*.2+p*r*.2,sy=y+r*.3-p*r*.3;smokeTrail(g,x-r*.5,y+r*.8,sx,sy,t,'#e0d6b955',2);glow(g,sx,sy,r*.1,'#ffdea8bb');A.threat(g,x+r*.44-p*r*.13,y-r*.33+p*r*.17,r*.16,t);}
 g.restore();g.strokeStyle='#83a5aa';g.lineWidth=Math.max(3,r*.045);g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();g.strokeStyle='#243e4b';g.lineWidth=Math.max(5,r*.09);g.beginPath();g.arc(x,y,r+7,0,Math.PI*2);g.stroke();
 // Workbench, CRT telemetry and the scientist illuminated by the sky.
 g.fillStyle='#3e4f4e';g.fillRect(0,h*.8,w,h*.2);g.fillStyle='#9b8765';g.fillRect(w*.03,h*.78,w*.58,9);
 const mx=w*.4,my=h*.68,mw=Math.min(w*.27,h*.25),mh=mw*.62;g.fillStyle='#1a2c34';g.fillRect(mx,my,mw,mh);g.strokeStyle='#728b8a';g.lineWidth=3;g.strokeRect(mx,my,mw,mh);g.fillStyle=relief?'#bbe2a4':'#dca67e';g.font='bold '+Math.max(8,mw*.075)+'px monospace';g.fillText(relief?'SINAL: TERRA A SALVO':'TK-87 / SINAL P-87',mx+8,my+mh*.32);line(g,[[mx+8,my+mh*.7],[mx+mw*.2,my+mh*.6],[mx+mw*.35,my+mh*.7],[mx+mw*.45,my+mh*.4],[mx+mw*.55,my+mh*.7],[mx+mw-8,my+mh*.63]],relief?'#b3d8ac':'#d7b37b',1);
 const scale=Math.min(h/430,w/380),px=w*.24,py=h*.86;
 if(!root.SelenePortrait.draw(g,px,py,scale,t)){
 g.fillStyle='#d7dfd1';g.fillRect(px-35*scale,py-140*scale,70*scale,140*scale);g.fillStyle='#d3b18d';g.beginPath();g.arc(px,py-160*scale,27*scale,0,Math.PI*2);g.fill();}
 glow(g,px+30*scale,py-190*scale,130*scale,relief?'#f6dca322':'#90b2dc12');
 g.fillStyle=relief?'#dbd093':'#c66c58';g.beginPath();g.arc(w*.06,h*.16,Math.max(3,h*.007),0,Math.PI*2);g.fill();
}
function orbit(g,w,h,t,p,levels,saved){
 gradient(g,w,h,'#071326','#24344b');stars(g,w,h,t,140);
 const r=Math.min(w,h)*(.36+(saved?p*.04:0));
 A.earth(g,w*.21,h*.77,r,t); // Exactly one Earth in this shot.
 if(saved){
 for(let i=0;i<24;i++){const a=i*2.399,d=Math.min(w,h)*(.07+p*.3)*(.35+(i%7)*.16),x=w*(.64+p*.06)+Math.cos(a)*d,y=h*.3+Math.sin(a)*d*.65;g.save();g.translate(x,y);A.asteroid(g,{r:2+(i%4),id:i,phase:a},t);g.restore();}
 glow(g,w*.8,h*.19,Math.min(w,h)*.17,'#d9c29133');
 }else{
 const tx=mix(w*.8,w*.74,p),ty=mix(h*.23,h*.31,p);A.threat(g,tx,ty,Math.min(w,h)*.09,t);
 const rx=mix(w*.35,w*.58,ease(p)),ry=mix(h*.64,h*.43,ease(p));smokeTrail(g,rx-w*.13,ry+h*.16,rx,ry,t,'#e7d4ac55',4);rocket(g,rx,ry,Math.min(w,h)/900,.7,levels,t,true);
 }
}
function burn(g,w,h,t,p,levels){
 gradient(g,w,h,'#101b31','#334052');
 for(let i=0;i<45;i++){const u=(i*31.7+t*180)%(w+h);const x=u/w*w,y=((i*91)%h);line(g,[[x,y],[x-w*.035,y+h*.025]],'#9cbfc538',1);}
 const x=mix(w*.38,w*.55,ease(p)),y=mix(h*.68,h*.42,ease(p));
 const r=Math.min(w,h)*mix(.16,.23,p);A.threat(g,w*.76,h*.25,r,t);
 smokeTrail(g,x-w*.17,y+h*.22,x,y,t,'#e8d8b077',6);rocket(g,x,y,Math.min(w,h)/390,.68,levels,t,true);
 glow(g,x-20,y+38,Math.min(w,h)*.15,'#dfb07522');
}
function drawScene(g,w,h,shot,age,levels){const p=clamp((age-shot.start)/(shot.end-shot.start));g.save();
 switch(shot.key){case'orbit':orbit(g,w,h,age,p,levels,false);break;case'lab':laboratory(g,w,h,age,p,false);break;case'ground':ground(g,w,h,age,p,false);break;case'burn':burn(g,w,h,age,p,levels);break;case'impact':ground(g,w,h,age,p,true);break;case'relief':laboratory(g,w,h,age,p,true);break;case'saved':orbit(g,w,h,age,p,levels,true);break;}g.restore();}
function wrap(g,value,width){const words=value.split(' '),lines=[];let line='';for(const word of words){if(g.measureText(line+' '+word).width>width&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;}
function draw(g,w,h,age,levels,poster=false){
 const shot=sample(age),bar=Math.max(15,h*.075),sceneH=h-bar*2;
 g.save();g.fillStyle='#050d17';g.fillRect(0,0,w,h);g.beginPath();g.rect(0,bar,w,sceneH);g.clip();g.translate(0,bar);
 if(shot.index>0&&age-shot.start<.55){drawScene(g,w,sceneH,shots[shot.index-1],shot.start,levels);g.save();g.globalAlpha*=ease((age-shot.start)/.55);drawScene(g,w,sceneH,shot,age,levels);g.restore();}
 else drawScene(g,w,sceneH,shot,age,levels);
 const vignette=g.createRadialGradient(w*.5,sceneH*.45,Math.min(w,h)*.17,w*.5,sceneH*.45,Math.max(w,h)*.7);vignette.addColorStop(0,'#02091800');vignette.addColorStop(1,'#02091899');g.fillStyle=vignette;g.fillRect(0,0,w,sceneH);g.restore();
 g.save();g.fillStyle='#050d17';g.fillRect(0,0,w,bar);g.fillRect(0,h-bar,w,bar);
 const size=w<600?14:Math.max(12,Math.min(18,w/55));g.font='bold '+Math.max(10,size*.65)+'px "Space Mono",monospace';g.fillStyle='#afbbb5';g.textAlign='left';g.fillText(poster?'ARQUIVO P–87 / MISSÃO CONCLUÍDA':shot.title,Math.max(12,w*.03),bar*.66);
 g.textAlign='right';g.fillText('PROJETO TAKE DOWN',w-Math.max(12,w*.03),bar*.66);
 const caption=poster?'O céu ainda é nosso.':shot.line;
 g.textAlign='center';g.font='bold '+size+'px "Space Mono",monospace';const lines=wrap(g,caption,w*.82),lh=size*1.5,boxH=lines.length*lh+size*2;
 const y=h-bar-boxH-12;g.fillStyle='#071422da';g.fillRect(w*.06,y,w*.88,boxH);g.fillStyle='#c8a969';g.font='bold '+Math.max(10,size*.65)+'px "Space Mono",monospace';g.fillText(poster?'TERRA A SALVO':shot.speaker,w/2,y+size*.95);g.fillStyle='#f0e7ce';g.font='bold '+size+'px "Space Mono",monospace';lines.forEach((s,i)=>g.fillText(s,w/2,y+size*2.35+i*lh));
 if(shot.key==='saved'){g.fillStyle='#f2dfb6';g.font='900 '+Math.min(66,w*.085)+'px "Barlow Condensed",sans-serif';g.fillText('TERRA A SALVO',w*.54,h*.36);g.font='bold '+Math.max(9,size*.8)+'px "Space Mono",monospace';g.fillText('TK–87 NEUTRALIZADO',w*.54,h*.42);}
 g.fillStyle='#d5b47b';g.fillRect(0,h-2,w*clamp(age/42),2);
 if(age<1){g.fillStyle='#07101b';g.globalAlpha*=1-ease(age);g.fillRect(0,0,w,h);}g.restore();
 return shot;
}
root.SeleneFinale={draw,sample,shots,duration:42};
})(typeof window!=='undefined'?window:globalThis);
