const assert=require('node:assert/strict');require('../drift-data');require('../drift-dynamics');require('../drift-physics');
for(let carIndex=0;carIndex<DriftData.cars.length;carIndex++)for(const speed of[15,35,55])for(const mode of['keyboard','pointer'])for(const side of[-1,1])for(const hold of[1,3,6,12,20,30])for(const drift of[false,true]){
 const r=new DriftPhysics.Race({seed:5,carIndex});r.track={...r.track,width:10,curvature:()=>0};r.features=[];r.cars=[r.player];r.phase='racing';r.elapsed=5;
 Object.assign(r.player,{lane:side*1.2,heading:side*.3,speed});r.input.throttle=1;r.input.drift=drift;
 const steer=v=>mode==='keyboard'?r.setSteer(v):r.setTarget(v);steer(side);r.step(1/60);assert(r.events.some(e=>e.type==='wall'),'real wall contact occurs');
 for(let i=0;i<hold;i++)r.step(1/60);steer(0);r.input.drift=false;
 for(let i=0;i<150;i++)r.step(1/60);
 assert(Math.abs(r.player.heading)<1e-5,`residual trajectory after ${mode} / side ${side} / hold ${hold} / drift ${drift}: ${r.player.heading}`);
 const lane=r.player.lane;for(let i=0;i<240;i++)r.step(1/60);assert(Math.abs(r.player.lane-lane)<.0001,`continued lateral motion: ${mode}/${side}/${hold}/${drift} delta ${r.player.lane-lane}`);
}
console.log('PASS actual steering into wall, held input after contact, then release: both sides, keyboard/touch, six hold durations and with/without drift. No residual angle or continued lateral motion.');
