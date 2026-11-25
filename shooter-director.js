/* Original encounter director. Each faction and boss owns a different weapon grammar. */
(()=>{'use strict';
const C=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const types={
 scout:{name:'BATEDOR',color:'#80f5af',hp:2,speed:190,reload:3000,shape:'bolt'},
 striker:{name:'LANCEIRO',color:'#ff72c4',hp:2,speed:230,reload:3900,shape:'dart'},
 armor:{name:'BASTIÃO',color:'#ffc16b',hp:4,speed:145,reload:4200,shape:'orb'},
 prism:{name:'PRISMA',color:'#5fe5f4',hp:2,speed:185,reload:4300,shape:'diamond'},
 sniper:{name:'OLHO SOLAR',color:'#f7ee70',hp:2,speed:345,reload:5000,shape:'needle'},
 weaver:{name:'TECELÃO',color:'#b49aff',hp:3,speed:160,reload:4100,shape:'wave'},
 bomber:{name:'SEMEADOR',color:'#ff9366',hp:4,speed:80,reload:6500,shape:'mine'},
 splitter:{name:'GÊMEO',color:'#72aaff',hp:3,speed:165,reload:4600,shape:'split'},
 phantom:{name:'ESPECTRO',color:'#ecdcff',hp:3,speed:205,reload:3800,shape:'comet'},
 carrier:{name:'ENXAME',color:'#ef6c85',hp:6,speed:170,reload:5400,shape:'cross'}
};
const bosses=[
 {name:'GUARDIÃO RUBRO · ARTILHARIA',hp:105,color:'#ff7994'},
 {name:'ARANHA DE ÍONS · TEIAS',hp:155,color:'#b69aff'},
 {name:'SENTINELA HEXA · LABIRINTO',hp:210,color:'#6ef3dc'},
 {name:'LEVIATÃ · PORTA-ENXAMES',hp:275,color:'#ffbb76'},
 {name:'ECLIPSE · PULSAR',hp:350,color:'#d493ff'}
];
function voice(key,volume=.13){window.ArcadeAudio.effect(key,volume);}
function initEnemy(e,kind){const t=types[kind]||types.scout;e.kind=kind in types?kind:'scout';e.color=t.color;e.hp=e.maxHp=t.hp+(gameDifficulty.key==='hard'&&level>6?1:0);e.w=kind==='carrier'?40:kind==='bomber'?34:28;e.h=kind==='carrier'?30:25;e.fireAt=arcadeClock+1400+Math.random()*t.reload;e.spawned=0;e.phase=Math.random()*TAU;return e;}
function bolt(x,y,angle,speed,color,shape='bolt',extra={}){if(enemyShots.length>=155)return;enemyShots.push({x,y,vx:Math.cos(angle)*speed,v:Math.sin(angle)*speed,w:shape==='orb'?12:7,h:shape==='orb'?12:16,color,shape,age:0,...extra});}
function aimed(e,count=1,spread=.15,speed=200,color=e.color,shape='bolt',extra={}){const a=Math.atan2(player.y-e.y,player.x-e.x);for(let i=0;i<count;i++)bolt(e.x,e.y+18,a+(i-(count-1)/2)*spread,speed,color,shape,extra);}
function ring(e,count,speed,color,offset=0,gapAngle=null){for(let i=0;i<count;i++){const a=i/count*TAU+offset;if(gapAngle!==null&&Math.abs(Math.atan2(Math.sin(a-gapAngle),Math.cos(a-gapAngle)))<.33)continue;bolt(e.x,e.y,a,speed,color,'orb');}}
function mine(x,y,color,delay=1.7){bolt(x,y,Math.PI/2,26,color,'mine',{arm:delay,harmless:true,ttl:delay});}
function updateEnemies(dt,now){for(const e of enemies){if(!e.alive||e.boss)continue;const t=types[e.kind]||types.scout;
 if(e.kind==='phantom'&&now>=(e.phaseAt||0)){e.phaseAt=now+2400;e.targetX=C(player.x+(Math.random()-.5)*310,65,755);e.targetY=70+Math.random()*100;}
 if(e.lock&&now>=e.lock.fireAt){bolt(e.x,e.y,e.lock.angle,t.speed,t.color,'needle');e.lock=null;voice('shot_sniper',.17);}
 if(now<e.fireAt)continue;e.fireAt=now+(t.reload+Math.random()*1000)*gameDifficulty.enemyRate;
 switch(e.kind){
 case 'striker':aimed(e,3,.13,t.speed,t.color,'dart');break;
 case 'armor':aimed(e,2,.3,t.speed,t.color,'orb');break;
 case 'prism':aimed(e,2,.45,t.speed,t.color,'diamond',{bounces:1});break;
 case 'sniper':e.lock={angle:Math.atan2(player.y-e.y,player.x-e.x),fireAt:now+1100};break;
 case 'weaver':aimed(e,2,.18,t.speed,t.color,'wave',{wave:75,phase:e.phase});break;
 case 'bomber':mine(e.x,C(e.y+85,100,300),t.color);break;
 case 'splitter':aimed(e,1,0,t.speed,t.color,'split',{splitAt:.85});break;
 case 'phantom':aimed(e,2,.25,t.speed,t.color,'comet',{turn:.45});break;
 case 'carrier':aimed(e,4,.16,t.speed,t.color,'cross');if(e.spawned<2&&enemies.filter(x=>x.alive&&!x.boss).length<23){e.spawned++;spawnEnemy(e.x+(e.spawned%2?30:-30),e.y+32);initEnemy(enemies.at(-1),'scout');}break;
 default:aimed(e,1,0,t.speed,t.color);
 }
 if(e.kind!=='sniper')voice('shot_'+e.kind,.09);
 }}
function updateShots(dt){const extra=[];for(const s of enemyShots){s.age=(s.age||0)+dt;
 if(s.wave)s.x+=Math.sin(s.age*8+(s.phase||0))*s.wave*dt;
 if(s.turn){const target=Math.atan2(player.y-s.y,player.x-s.x),a=Math.atan2(s.v,s.vx),delta=Math.atan2(Math.sin(target-a),Math.cos(target-a)),next=a+C(delta,-s.turn*dt,s.turn*dt),speed=Math.hypot(s.v,s.vx);s.vx=Math.cos(next)*speed;s.v=Math.sin(next)*speed;}
 if(s.bounces>0&&(s.x<12||s.x>808)){s.x=C(s.x,12,808);s.vx*=-1;s.bounces--;}
 if(s.splitAt&&s.age>=s.splitAt){s.spent=true;const a=Math.atan2(s.v,s.vx);for(const off of [-.34,.34])extra.push({x:s.x,y:s.y,vx:Math.cos(a+off)*210,v:Math.sin(a+off)*210,w:7,h:16,color:s.color,shape:'dart',age:0});}
 if(s.shape==='mine'&&s.age>=s.ttl){s.spent=true;for(let i=0;i<6;i++){const a=i/6*TAU;extra.push({x:s.x,y:s.y,vx:Math.cos(a)*145,v:Math.sin(a)*145,w:7,h:12,color:s.color,shape:'orb',age:0});}window.GameFX.particles(arcadeParticles,s.x,s.y,s.color,12);}
 }enemyShots=enemyShots.filter(s=>!s.spent);enemyShots.push(...extra.slice(0,Math.max(0,155-enemyShots.length)));}
function beam(b,now,horiz,pos,delay=0,warn=null){if(bossWarnings.length>=8)return;if(!horiz&&b.safeUntil>now&&Math.abs(pos-(82+b.safeLane*164))<65)return;const supernova=b.stage===2;
 const warning=warn??(supernova?(gameDifficulty.key==='easy'?1550:gameDifficulty.key==='hard'?850:1100):(gameDifficulty.key==='easy'?2100:gameDifficulty.key==='hard'?1100:1500));
 bossWarnings.push({horiz,pos:C(pos,40,horiz?480:780),start:now,fireAt:now+delay+warning,endAt:now+delay+warning+920,rise:120,hold:250,fade:550,color:b.color||bosses[(b.bossKind||1)-1].color,fired:false,lastCountdown:-1,volume:.13});}
function lattice(b,now){const pending=bossWarnings.some(w=>!w.horiz&&now<w.endAt);if(!pending||!Number.isInteger(b.safeLane))b.safeLane=C(Math.floor(player.x/164)+(Math.random()<.5?-1:1),0,4);b.safeUntil=now+(gameDifficulty.key==='easy'?3300:2900);for(let i=0;i<5;i++)if(i!==b.safeLane)beam(b,now,false,82+i*164,i%2*130);if(b.stage===2)beam(b,now,true,C(player.y+((Math.random()-.5)*90),110,450),250);}
function queue(b,at,type,extra={}){b.queue??=[];b.queue.push({at,type,...extra});}
function escorts(b,count,kinds){const max=b.stage===2?5:6;for(let i=0;i<count&&enemies.filter(e=>e.alive&&!e.boss).length<max;i++){spawnEnemy(C(b.x+(i-(count-1)/2)*70,45,775),Math.max(60,b.y+30));initEnemy(enemies.at(-1),kinds[i%kinds.length]);enemies.at(-1).fireAt=arcadeClock+1200+i*280;}}
function execute(b,action,now){const n=b.bossKind,c=b.color,supernova=b.stage===2;
 switch(action){
 case 'salvo':for(let k=0;k<3;k++)queue(b,now+k*230,'aim',{count:3,spread:.12,speed:235});break;
 case 'hammer':aimed(b,7,.18,175,c,'orb');queue(b,now+420,'aim',{count:3,spread:.27,speed:205});break;
 case 'web':for(let side of [-1,1])for(let i=0;i<4;i++)bolt(b.x+side*48,b.y+15,Math.PI/2+side*(.1+i*.18),155,c,'wave',{wave:80,phase:i});break;
 case 'nest':for(let i=0;i<3;i++)mine(C(b.x+(i-1)*120,60,760),170+i%2*55,c);beam(b,now,false,C(player.x,45,775),200);break;
 case 'ricochet':for(let i=0;i<6;i++)bolt(b.x,b.y+10,.25+i*.5,210,c,'diamond',{bounces:1});break;
 case 'grid':lattice(b,now);break;
 case 'shutters':for(let i=0;i<3;i++)beam(b,now,true,130+i*120,i*450,1350);aimed(b,5,.22,165,c);break;
 case 'satellites':ring(b,14,145,c,b.moveTimer*.4,Math.atan2(player.y-b.y,player.x-b.x));break;
 case 'squadron':escorts(b,3,['striker','prism','sniper']);for(const side of [-1,1])aimed({...b,x:b.x+side*64},4,.18,180,c,'cross');break;
 case 'broadside':for(const side of [-1,1])for(let i=0;i<7;i++)bolt(C(b.x+side*70,40,780),b.y+18,Math.PI/2+(i-3)*.22,195,c,'dart');beam(b,now,true,280,450);break;
 case 'cluster':for(let i=0;i<4;i++)mine(100+i*200,180+Math.random()*70,c,1.6+i*.15);escorts(b,2,['splitter','bomber']);break;
 case 'spiral':for(let k=0;k<(supernova?5:3);k++)queue(b,now+k*160,'ring',{count:supernova?15:11,offset:b.moveTimer*.65+k*.23,speed:supernova?205:170});break;
 case 'comets':for(let i=0;i<(supernova?6:3);i++)queue(b,now+i*190,'aim',{count:2,spread:.16,speed:supernova?245:205,turn:.55});break;
 case 'hunt':for(let i=0;i<3;i++)beam(b,now,false,C(player.x+(i-1)*110,40,780),i*240);beam(b,now,true,C(player.y,90,460),500);break;
 case 'nova':ring(b,20,185,c,b.moveTimer*.7,Math.atan2(player.y-b.y,player.x-b.x));for(let i=0;i<3;i++)mine(150+i*250,190+Math.random()*80,c,1.5);break;
 case 'eclipse':beam(b,now,false,C(player.x-80,45,775));beam(b,now,false,C(player.x+80,45,775),260);ring(b,14,165,c,b.moveTimer*.4);break;
 }
 voice(supernova?'boss_super':'boss_'+n,supernova ? .18 : .15);b.lastAttack=action;
}
const decks={1:['salvo','hammer','salvo','hammer'],2:['web','nest','ricochet'],3:['grid','satellites','shutters'],4:['squadron','broadside','cluster'],5:['spiral','comets','eclipse','satellites']};
function updateBoss(b,dt,now){const n=b.bossKind||1;b.color=bosses[n-1].color;b.moveTimer+=dt;b.tentaclePhase+=dt;
 if(bossEntering){b.y+=(92-b.y)*Math.min(1,dt*3);if(Math.abs(b.y-92)<2){bossEntering=false;b.y=92;b.attackAt=now+1200;}return;}
 if(n===5&&b.stage===1&&b.hp<=b.maxHp*.45){b.stage=2;b.supernovaAt=now;b.morphUntil=now+650;b.attackAt=now+700;b.deck=[];bossNotice='SUPERNOVA · RUPTURA TOTAL';bossNoticeUntil=now+2800;screenShake=.7;voice('laughFinal',.38);voice('boss_super',.22);window.GameFX.particles(arcadeParticles,b.x,b.y,'#dfadff',50);}
 // The transformation never changes player, input, shots, warnings or wave-ready time.
 if(n===1){b.x=410+Math.sin(b.moveTimer*.8)*260;b.y=90+Math.sin(b.moveTimer*1.1)*15;}
 else if(n===2){b.x=410+Math.sin(b.moveTimer*1.1)*285;b.y=110+Math.sin(b.moveTimer*2.2)*45;}
 else if(n===3){b.x=410+Math.sin(b.moveTimer*.55)*150;b.y=105+Math.cos(b.moveTimer*.8)*25;}
 else if(n===4){b.x=410+Math.sin(b.moveTimer*.45)*290;b.y=100+Math.sin(b.moveTimer*.8)*35;}
 else {if(now>=(b.decisionAt||0)){b.targetX=85+Math.random()*650;b.targetY2=65+Math.random()*(b.stage===2?180:95);b.decisionAt=now+(b.stage===2?400+Math.random()*450:950+Math.random()*650);}const follow=(b.stage===2?3.7:1.8)*gameDifficulty.bossSpeed;b.x+=(b.targetX-b.x)*Math.min(1,dt*follow);b.y+=(b.targetY2-b.y)*Math.min(1,dt*follow);}
 b.x=C(b.x,80,740);b.queue??=[];const due=b.queue.filter(q=>q.at<=now);b.queue=b.queue.filter(q=>q.at>now);for(const q of due){if(q.type==='aim')aimed(b,q.count,q.spread,q.speed,b.color,q.turn?'comet':'dart',{turn:q.turn||0});if(q.type==='ring')ring(b,q.count,q.speed,b.color,q.offset,Math.atan2(player.y-b.y,player.x-b.x));}
 if(now>=b.morphUntil&&now>=b.attackAt){let action;
 if(n===5&&b.stage===2){if(!b.deck?.length){b.deck=['grid','spiral','comets','hunt','nova'];for(let i=b.deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b.deck[i],b.deck[j]]=[b.deck[j],b.deck[i]]}};action=b.deck.shift();if(action===b.lastAttack)action='hunt';}
 else{const deck=decks[n];b.attackIndex=b.attackIndex||0;action=deck[b.attackIndex++%deck.length];}
 execute(b,action,now);const base=n===1?1750:n===2?2200:n===3?2450:n===4?2650:b.stage===2?1050:1950;b.attackAt=now+(base+Math.random()*(b.stage===2?300:450))*gameDifficulty.enemyRate;}
 if(now>=b.laughAt){voice(n===5?'laughFinal':'laugh',.25);b.laughAt=now+10000+Math.random()*3000;}
}
function drawTelegraphs(g,now){g.save();for(const e of enemies){if(!e.alive||!e.lock)continue;const length=650;g.strokeStyle=(e.color||'#fff')+'88';g.setLineDash([5,8]);g.lineWidth=1;g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+Math.cos(e.lock.angle)*length,e.y+Math.sin(e.lock.angle)*length);g.stroke();g.setLineDash([]);g.fillStyle=e.color;g.font='bold 15px monospace';g.textAlign='center';g.fillText('!',e.x,e.y-24);}g.restore();}
function drawShot(g,s){if(s.shape!=='mine'&&s.shape!=='orb'&&s.shape!=='diamond'){window.GameFX.bolt(g,s,s.color||'#ff718d',s.shape==='needle'?29:s.shape==='dart'?23:19);return;}g.save();g.translate(s.x,s.y);g.shadowColor=s.color;g.shadowBlur=12;g.strokeStyle=s.color;g.fillStyle=s.color+'55';g.lineWidth=2;if(s.shape==='mine'){g.rotate(s.age*2);const r=9+Math.sin(s.age*14)*2;g.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU,r2=i%2?r*.55:r;i?g.lineTo(Math.cos(a)*r2,Math.sin(a)*r2):g.moveTo(r2,0);}g.closePath();g.fill();g.stroke();g.rotate(-s.age*2);g.font='bold 12px monospace';g.textAlign='center';g.fillStyle='#fff2ee';g.fillText('!',0,4);}else if(s.shape==='diamond'){g.rotate(s.age*4);g.strokeRect(-5,-5,10,10);g.fillRect(-3,-3,6,6);}else{g.beginPath();g.arc(0,0,5,0,TAU);g.fill();g.stroke();g.fillStyle='#fff4f1';g.beginPath();g.arc(0,0,2,0,TAU);g.fill();}g.restore();}
window.ShooterDirector={types,bosses,initEnemy,updateEnemies,updateShots,updateBoss,drawTelegraphs,drawShot,execute,beam};
})();
