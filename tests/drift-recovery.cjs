const assert=require('node:assert/strict');require('../drift-data');const V=require('../drift-dynamics');require('../drift-physics');
function race(){const r=new DriftPhysics.Race({seed:7});r.track={...r.track,curvature:()=>0};r.phase='racing';r.elapsed=5;r.player.s=150;r.player.speed=40;r.cars.slice(1).forEach((c,i)=>c.s=900+i*60);r.setSteer(0);r.input.throttle=1;return r;}
for(const side of [-1,1]){
 const r=race(),c=r.player;Object.assign(c,{heading:side*.12,slipAngle:side*.38,yawRate:side*1,rearGrip:.3,handbrake:true,driftCharge:1});r.input.drift=false;
 for(let i=0;i<90;i++){r.step(1/60);assert.equal(c.spin,0);assert(Math.abs(c.slipAngle)<=.48);}
 assert(Math.abs(c.yawRate)<.02);assert(Math.abs(c.slipAngle)<.02);assert(c.rearGrip>.99);
 Object.assign(c,{lane:side*1.3,heading:side*.5,slipAngle:side*.4,yawRate:side*2,speed:35});V.wall(r,c);assert.equal(c.yawRate,0);assert.equal(c.slipAngle,0);assert.equal(c.heading,0);assert(c.kickVX*side<0);
 const edge=Math.abs(c.lane);for(let i=0;i<60;i++)r.step(1/60);assert(Math.abs(c.lane)<edge-.02,'car releases from wall without steering');assert(c.yawRate*side<=.02);
}
const r=race();r.setSteer(1);r.input.drift=true;for(let i=0;i<120;i++){r.step(1/60);assert.equal(r.player.spin,0);assert(!r.events.some(e=>e.type==='driftFail'));}
console.log('PASS left/right post-drift recovery has no forced spin or residual yaw; wall impacts clear stored slide and move car away without held steering.');
