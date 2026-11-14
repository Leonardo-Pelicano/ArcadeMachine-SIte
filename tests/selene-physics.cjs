const assert = require("node:assert/strict");
require("../rocket-data.js");
require("../rocket-physics.js");
const P = SelenePhysics,
  D = SeleneData;
function empty(level = 0) {
  const l = Object.fromEntries(D.upgrades.map((u) => [u.id, level]));
  const f = new P.Flight(l, { seed: 120 });
  f.countdown = 0;
  f.time = 3;
  f.y = f.maxY = 1000;
  f.invuln = 0;
  f.generated = 2000;
  f.objects = [];
  return f;
}
const p = P.fresh();
assert.equal(p.money, 0);
assert(!P.purchase(p, "engine").ok);
p.money = 3000;
const price = D.tierCost("engine", 0, 3);
assert(P.purchase(p, "engine", 3).ok);
assert.equal(p.levels.engine, 3);
assert.equal(p.money, 3000 - price);
assert(!P.owns(p,"engine",2));
assert(!P.equip(p,"engine",2).ok);
assert(P.purchase(p,"engine",2).ok);
assert(P.equip(p,"engine",3).ok);
assert(!P.purchase(p, "engine", 7).ok);
assert(!P.purchase(p, "unknown").ok);
let f = P.launch(p);
assert.equal(p.day, 1);
assert.throws(() => P.launch(p));
assert(!P.purchase(p, "tank").ok);
f.countdown = 0;
const fuel = f.fuel;
f.input.thrust = false;
f.step(0.05);
assert.equal(f.fuel, fuel);
f.input.thrust = true;
f.step(0.05);
assert(f.fuel < fuel);
f.fuel = 0;
f.input.boost = true;
const aux = f.aux;
f.step(0.05);
assert(f.aux < aux);
assert(f.boostOn);
// A frontal plane impact separates the capsule and changes velocity and rotation; it remains as a falling wreck.
const front = empty();
front.vy = 95;
const plane = {
  id: 1,
  kind: "obstacle",
  type: "plane",
  x: 0,
  y: front.y + 52,
  r: 38,
  vx: 0,
  phase: 0,
  hit: false,
};
front.objects = [plane];
assert(front.collide(plane));
assert(front.hp < front.stats.health);
assert(front.vy < 40);
assert(Math.abs(front.angularVelocity) > 0.1);
assert.equal(plane.state, "wreck");
assert(!plane.hit);
assert(front.objects.includes(plane));
const hits = front.hits,
  hp = front.hp;
for (let i = 0; i < 8; i++) front.updateObjects(0.05);
assert.equal(front.hits, hits);
assert.equal(front.hp, hp);
assert(front.objects.includes(plane));
assert(plane.rotation !== 0);
assert(plane.y !== 1052);
assert(front.drain().some((e) => e.type === "collision"));
const side = empty();
side.vx = 90;
const rock = {
  id: 2,
  kind: "obstacle",
  type: "asteroid",
  x: side.x + 35,
  y: side.y,
  r: 25,
  vx: 0,
  phase: 0,
  hit: false,
};
assert(side.collide(rock));
assert(side.vx < 50);
assert(side.x < 0);
assert.equal(rock.state, "wreck");
const slow = empty(),
  fast = empty();
slow.vy = 20;
fast.vy = 150;
for (const s of [slow, fast])
  s.collide({
    id: 4,
    kind: "obstacle",
    type: "plane",
    x: 0,
    y: 1052,
    r: 38,
    vx: 0,
  });
assert(fast.hp < slow.hp, "damage uses current closing speed");
const weather = empty();
const storm = {
  id: 5,
  kind: "obstacle",
  type: "storm",
  x: 0,
  y: 1020,
  r: 65,
  vx: 0,
};
assert(weather.collide(storm));
assert(!storm.state);
assert(!storm.hit);
assert(weather.hp < weather.stats.health);
assert(weather.events.some((e) => e.type === "lightning"));
const balloon = empty();
const b = {
  id: 6,
  kind: "obstacle",
  type: "balloon",
  x: 0,
  y: 1035,
  r: 30,
  vx: 0,
};
balloon.objects = [b];
assert(balloon.collide(b));
assert.equal(b.state, "popped");
balloon.updateObjects(0.05);
assert(balloon.objects.includes(b));
for (let i = 0; i < 35; i++) balloon.updateObjects(0.05);
assert(!balloon.objects.includes(b), "popped balloon fades after animation");
const shielded = empty(6),
  shield = shielded.shield;
shielded.damage(20);
assert(shielded.shield < shield);
assert.equal(shielded.hp, shielded.stats.health);
const doomed = empty();
doomed.damage(999);
assert(doomed.crashing > 0);
assert(!doomed.ended);
const falling = P.Flight.restore(doomed.save());
for (let i = 0; i < 45; i++) falling.step(0.05);
assert(falling.ended);
assert(!falling.win);
const pickup = empty();
const cash = {
  id: 8,
  kind: "pickup",
  type: "cash",
  x: pickup.x,
  y: pickup.y,
  r: 18,
  vx: 0,
};
pickup.objects = [cash];
pickup.updateObjects(0.05);
assert.equal(pickup.coins, 1);
assert(cash.hit && cash.collected > 0);
const money = pickup.cash;
pickup.updateObjects(0.05);
assert.equal(pickup.cash, money);
assert(pickup.objects.includes(cash));
pickup.hp = 1;
pickup.collect({ type: "repair" });
assert(pickup.hp <= pickup.stats.health);
pickup.collect({ type: "fuel" });
assert(pickup.fuel <= pickup.stats.fuel);
// Persistence includes wreck position/rotation and exact random generator state.
const roundTrip = P.Flight.restore(front.save());
assert.equal(roundTrip.objects[0].state, "wreck");
assert.equal(roundTrip.angularVelocity, front.angularVelocity);
assert.equal(roundTrip.rngState, front.rngState);
front.input = { ...roundTrip.input };
front.step(0.025);
roundTrip.step(0.025);
assert.equal(front.y, roundTrip.y);
assert.equal(front.rngState, roundTrip.rngState);
p.pending = f.save();
const reload = P.cleanProfile(JSON.parse(JSON.stringify(p)));
assert.equal(reload.day, 1);
assert(reload.pending);
f.finish(false, "TEST");
assert(P.settle(p, f).ok);
const bank = p.money;
assert(!P.settle(p, f).ok);
assert.equal(p.money, bank);
assert.equal(p.pending, null);
assert(p.contracts.includes("first"));
console.log(
  "PASS Selene direct-tier purchases, fuel/boost, frontal and side physical contacts, speed-dependent damage, persistent tumbling wrecks, lightning clouds, balloon fade, shields, crash sequence, pickup animation, deterministic checkpoints and single payout.",
);

const facingTest=empty();facingTest.vx=180;const leftPlane={id:31,kind:'obstacle',type:'plane',x:35,y:1000,r:38,vx:-40,phase:0};facingTest.objects=[leftPlane];assert(facingTest.collide(leftPlane));assert.equal(leftPlane.facing,-1);leftPlane.vx=50;facingTest.updateObjects(.05);assert.equal(leftPlane.facing,-1,'tumbling wreck keeps original front even after velocity reversal');console.log('PASS wreck silhouette does not mirror when collision reverses velocity.');
