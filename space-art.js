/* Original shared visual identity: Astra fighter, enemy factions and orbital machinery. */
(()=>{'use strict';
function polygon(g,points,fill,stroke){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1.2;g.stroke()}}
function ship(g,x,y,scale=1,t=0,roll=0){g.save();g.translate(x,y);g.rotate(roll);g.scale(scale,scale);g.shadowColor='#a365ff';g.shadowBlur=9;
const flame=13+Math.sin(t*31)*4;polygon(g,[[-5,15],[0,30+flame*.4],[5,15]],'#fc70ca');polygon(g,[[-2,16],[0,27],[2,16]],'#fff3b0');g.shadowBlur=0;
polygon(g,[[-4,-23],[-8,-8],[-13,-4],[-15,4],[-23,12],[-23,19],[-13,19],[-8,14],[8,14],[13,19],[23,19],[23,12],[15,4],[13,-4],[8,-8],[4,-23]],'#b5a0e2','#5b4584');
polygon(g,[[-3,-27],[-6,-10],[-11,-3],[-10,14],[-5,20],[5,20],[10,14],[11,-3],[6,-10],[3,-27]],'#e8e8ff','#8f8cb9');
polygon(g,[[-8,-4],[-15,10],[-20,13],[-20,17],[-12,17],[-7,10]],'#f7f2ff');polygon(g,[[8,-4],[15,10],[20,13],[20,17],[12,17],[7,10]],'#f7f2ff');
g.fillStyle='#7e5beb';g.fillRect(-22,14,9,5);g.fillRect(13,14,9,5);g.fillStyle='#fa77ca';g.fillRect(-21,19,8,3);g.fillRect(13,19,8,3);
polygon(g,[[-4,-10],[4,-10],[5,4],[-5,4]],'#12649a','#6bd6ff');g.fillStyle='#a6faff';g.fillRect(-2,-9,3,6);g.fillStyle='#fff';g.fillRect(-1,-23,2,9);g.fillStyle='#6c5d9f';g.fillRect(-5,11,10,3);g.restore();}
function enemy(g,e,t){const info=window.ShooterDirector?.types[e.kind],color=info?.color||e.color||'#a79af4',k=e.kind;g.save();g.translate(e.x,e.y);g.rotate(Math.sin(t*2+(e.seed||0))*.1);if(k==='phantom')g.globalAlpha=.45+.5*Math.abs(Math.sin(t*3+e.phase));g.shadowBlur=8;g.shadowColor=color;
const forms={scout:[[-18,4],[-8,-10],[8,-10],[18,4],[8,12],[-8,12]],striker:[[-20,-10],[-7,-2],[0,-17],[7,-2],[20,-10],[14,13],[0,7],[-14,13]],armor:[[-18,-8],[0,-15],[18,-8],[15,11],[0,16],[-15,11]],prism:[[0,-20],[17,0],[0,20],[-17,0]],sniper:[[-22,-8],[-5,-5],[0,-22],[5,-5],[22,-8],[13,11],[0,15],[-13,11]],weaver:[[-23,-10],[-11,0],[-21,13],[-9,10],[0,18],[9,10],[21,13],[11,0],[23,-10],[5,-6],[0,-14],[-5,-6]],bomber:[[-18,-14],[18,-14],[23,10],[12,18],[-12,18],[-23,10]],splitter:[[-21,-10],[-4,-5],[0,0],[4,-5],[21,-10],[18,12],[3,9],[0,4],[-3,9],[-18,12]],phantom:[[0,-20],[8,-7],[22,3],[12,15],[0,8],[-12,15],[-22,3],[-8,-7]],carrier:[[-25,-14],[-10,-18],[10,-18],[25,-14],[27,12],[14,19],[-14,19],[-27,12]]};
polygon(g,forms[k]||forms.scout,'#29203e',color);g.shadowBlur=0;
if(k==='prism'){g.strokeStyle=color;g.beginPath();g.moveTo(0,-17);g.lineTo(0,17);g.moveTo(-14,0);g.lineTo(14,0);g.stroke();}
else if(k==='sniper'){g.fillStyle=color;g.fillRect(-2,2,4,23);g.strokeStyle=color;g.beginPath();g.arc(0,-2,7,0,Math.PI*2);g.stroke();}
else if(k==='bomber'){for(let x=-10;x<=10;x+=10){g.fillStyle=color;g.beginPath();g.arc(x,5,4,0,Math.PI*2);g.fill();}}
else if(k==='carrier'){for(const x of [-16,16]){g.fillStyle=color;g.fillRect(x-4,-9,8,18);g.fillStyle='#161026';g.fillRect(x-2,-5,4,4);g.fillRect(x-2,3,4,4);}}
else if(k==='weaver'){g.strokeStyle=color;g.beginPath();for(let x=-12;x<=12;x+=3)x===-12?g.moveTo(x,Math.sin(x*.4+t*4)*4):g.lineTo(x,Math.sin(x*.4+t*4)*4);g.stroke();}
else if(k==='splitter'){g.fillStyle=color;g.fillRect(-14,-1,6,5);g.fillRect(8,-1,6,5);g.strokeStyle='#f3e9ff';g.beginPath();g.moveTo(0,-5);g.lineTo(-3,0);g.lineTo(3,3);g.lineTo(0,8);g.stroke();}
else{g.fillStyle=color;g.fillRect(-10,-1,6,4);g.fillRect(4,-1,6,4);}
if(k==='armor'){g.strokeStyle='#fff0c4';g.beginPath();g.arc(0,0,10,t,t+4.8);g.stroke();}if(k==='phantom'){g.strokeStyle=color+'88';g.beginPath();g.ellipse(0,0,26,13,t*.8,0,Math.PI*2);g.stroke();}g.restore();}
function boss(g,e,t){if(e.stage===2){g.save();g.translate(e.x,e.y);g.rotate(t*1.6);g.strokeStyle='#ff9fdf';g.lineWidth=2;g.shadowColor='#e08aff';g.shadowBlur=17;for(let i=0;i<10;i++){const a=i/10*Math.PI*2;g.beginPath();g.moveTo(Math.cos(a)*52,Math.sin(a)*52);g.lineTo(Math.cos(a+.18)*(85+Math.sin(t*9+i)*12),Math.sin(a+.18)*(85+Math.sin(t*9+i)*12));g.stroke();}g.restore();}const n=e.bossKind||1,palette=['#ef749b','#a793ff','#80e9e2','#f0b785','#da8cff'],c=palette[n-1];g.save();g.translate(e.x,e.y);g.shadowColor=c;g.shadowBlur=18;
if(n===1){polygon(g,[[-77,13],[-62,-23],[-28,-15],[-13,-41],[13,-41],[28,-15],[62,-23],[77,13],[42,31],[0,24],[-42,31]],'#291c45',c);for(const x of [-56,56]){g.fillStyle=c;g.fillRect(x-6,10,12,16)}}
if(n===2){g.save();g.rotate(Math.sin(t)*.16);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.strokeStyle=c;g.lineWidth=6;g.beginPath();g.moveTo(Math.cos(a)*25,Math.sin(a)*25);g.lineTo(Math.cos(a)*54,Math.sin(a)*42);g.lineTo(Math.cos(a+.3)*83,Math.sin(a+.3)*48);g.stroke()}g.restore();}
if(n===3){g.save();g.rotate(t*.35);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;polygon(g,[[Math.cos(a)*38,Math.sin(a)*38],[Math.cos(a+.25)*74,Math.sin(a+.25)*57],[Math.cos(a+.5)*52,Math.sin(a+.5)*52]],'#2a4052',c)}g.restore();}
if(n===4){polygon(g,[[-93,0],[-68,-28],[-24,-19],[0,-45],[24,-19],[68,-28],[93,0],[68,27],[22,22],[0,40],[-22,22],[-68,27]],'#302743',c);for(let x=-70;x<=70;x+=20){g.fillStyle=c;g.fillRect(x,-4,8,8)}}
if(n===5){g.save();g.rotate(-t*.45);g.strokeStyle=c;g.lineWidth=e.stage===2?8:5;for(let i=0;i<3;i++){g.beginPath();g.ellipse(0,0,66+i*8,29+i*9,i*Math.PI/3,0,Math.PI*2);g.stroke()}g.restore();}
g.shadowBlur=4;const grad=g.createRadialGradient(-6,-8,2,0,0,n===5?29:24);grad.addColorStop(0,'#fff4ff');grad.addColorStop(.24,c);grad.addColorStop(1,'#312449');g.fillStyle=grad;g.beginPath();g.arc(0,0,n===5?29:24,0,Math.PI*2);g.fill();g.fillStyle='#15162d';g.fillRect(-14,-4,28,10);g.fillStyle='#fff1fc';g.fillRect(-9,-2,18,4);g.shadowBlur=0;
g.restore();}
function obstacle(g,a,t){g.save();g.translate(a.x,a.y);g.rotate(a.rot);const r=a.r;g.shadowColor=a.type===2?'#76c9ff':'#b49aff';g.shadowBlur=10;
if(a.type===2){polygon(g,[[-r*.7,0],[-r*.3,-r*.85],[r*.55,-r*.65],[r,r*.15],[0,r]],'#414878','#a8dfff');g.strokeStyle='#c5eaff';g.lineWidth=1;g.beginPath();g.moveTo(-r*.3,-r*.85);g.lineTo(0,r);g.lineTo(r*.55,-r*.65);g.moveTo(-r*.7,0);g.lineTo(r,r*.15);g.stroke();}
else{const panel=g.createLinearGradient(-r,0,r,0);panel.addColorStop(0,'#44316c');panel.addColorStop(.5,'#7185ba');panel.addColorStop(1,'#342553');g.fillStyle=panel;g.fillRect(-r,-r*.32,r*.65,r*.64);g.fillRect(r*.35,-r*.32,r*.65,r*.64);g.strokeStyle='#99a8d9';for(let j=-1;j<2;j++){g.beginPath();g.moveTo(-r,-r*.22+j*r*.2);g.lineTo(-r*.35,-r*.22+j*r*.2);g.moveTo(r*.35,-r*.22+j*r*.2);g.lineTo(r,-r*.22+j*r*.2);g.stroke()}polygon(g,[[-r*.25,-r*.4],[r*.25,-r*.4],[r*.3,r*.4],[-r*.3,r*.4]],'#ced6e9','#6cbde1');g.fillStyle='#e8ac85';g.beginPath();g.arc(0,0,r*.16,0,Math.PI*2);g.fill();g.strokeStyle='#a5d4ff';g.beginPath();g.moveTo(0,-r*.4);g.lineTo(0,-r*.7);g.stroke();}
g.restore();}
function racer(g,x,y,scale,color,shape='gt',angle=0,t=0){g.save();g.translate(x,y);g.rotate(angle);g.scale(scale,scale);g.shadowColor=color;g.shadowBlur=7;
const form={gt:[[-2,-35],[-8,-8],[-31,22],[-22,28],[-5,13],[5,13],[22,28],[31,22],[8,-8],[2,-35]],sport:[[0,-35],[-34,23],[-20,30],[0,17],[20,30],[34,23]],formula:[[0,-44],[-6,-10],[-23,-16],[-20,-5],[-7,0],[-22,32],[-8,22],[8,22],[22,32],[7,0],[20,-5],[23,-16],[6,-10]],prototype:[[-3,-38],[-8,16],[0,25],[8,16],[3,-38]]};
if(shape==='muscle'){for(const side of [-1,1]){polygon(g,[[side*12,-29],[side*26,-23],[side*27,25],[side*11,25]],color,'#d7c5ff');}g.fillStyle='#7565a0';g.fillRect(-12,-6,24,20);}
else if(shape==='rally'){for(let i=0;i<3;i++){const a=i/3*Math.PI*2;g.fillStyle=color;g.beginPath();g.ellipse(Math.sin(a)*22,Math.cos(a)*20,12,19,0,0,Math.PI*2);g.fill();}g.fillStyle='#d5c6ee';g.beginPath();g.arc(0,0,14,0,Math.PI*2);g.fill();}
else polygon(g,form[shape]||form.gt,color,'#e4d5ff');
if(shape==='prototype'){g.strokeStyle=color;g.lineWidth=5;g.beginPath();g.ellipse(0,3,29,27,0,0,Math.PI*2);g.stroke();}
g.shadowBlur=0;polygon(g,[[-5,-13],[5,-13],[7,5],[0,9],[-7,5]],'#1a2f52','#8fe5ff');g.fillStyle='#d1baff';g.fillRect(-2,-10,3,8);g.fillStyle='#bc96ff';for(const side of [-1,1])polygon(g,[[side*9,23],[side*16,23],[side*12,35+Math.sin(t*35)*4]],'#c69aff');g.restore();}
window.SpaceArt={ship,enemy,boss,obstacle,racer};})();
