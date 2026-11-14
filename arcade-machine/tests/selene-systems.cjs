const assert = require("node:assert/strict");
require("../rocket-data");
require("../rocket-physics");
const D = SeleneData,
  P = SelenePhysics,
  p = P.fresh();
const f = P.launch(p);
f.countdown = 0;
f.time = 5;
f.y = f.maxY = 3000;
f.generated = 1e9;
f.invuln = 0;
f.vy = 40;
f.input.thrust = true;
f.input.boost = true;
f.motorRequested = true;
assert(
  f.collide({
    id: 1,
    type: "storm",
    kind: "obstacle",
    x: 0,
    y: 3020,
    r: 65,
    vx: 0,
  }),
);
assert(f.disabledFor > 1.6 && f.disabledFor <= 2.2);
assert(!f.engineOn && !f.boostOn);
const fuel = f.fuel,
  aux = f.aux,
  timer = f.disabledFor,
  alt = f.y,
  a = P.Flight.restore(f.save()),
  b = P.Flight.restore(f.save());
a.input.aimAngle = 1.2;
b.input.aimAngle = -1.2;
a.input.freeAim = b.input.freeAim = true;
for (let i = 0; i < 60; i++) {
  a.input.boost = b.input.boost = true;
  a.step(1 / 60);
  b.step(1 / 60);
}
assert.equal(a.fuel, fuel);
assert.equal(a.aux, aux);
assert.equal(a.angle, b.angle, "aim input is ignored during outage");
assert.equal(a.y, b.y);
assert.notEqual(a.y, alt, "gravity/inertia continue during outage");
assert(a.disabledFor < timer);
assert(!a.engineOn && !a.boostOn);
assert(a.input.thrust, "saved motor intent survives forced engine shutdown");
for (let i = 0; i < 100; i++) {
  a.input.boost = true;
  a.step(1 / 60);
}
assert.equal(a.disabledFor, 0);
assert(a.engineOn);
assert(a.aux < aux);
assert(a.rebootGrace > 0);
assert(a.drain().some((e) => e.type === "reboot"));
const nearStorm = {
  id: 2,
  type: "storm",
  kind: "obstacle",
  x: a.x,
  y: a.y,
  r: 65,
  vx: 0,
};
assert(!a.collide(nearStorm), "reboot has a short immunity window");
const shop = P.fresh();
shop.money = 5000;
assert(P.purchase(shop, "engine", 4).ok);
const cash = shop.money;
assert(P.equip(shop, "engine", 1).ok);
assert.equal(shop.levels.engine, 1);
assert.equal(shop.money, cash);
assert.equal(P.ownedLevel(shop, "engine"), 4);
assert(
  !P.purchase(shop, "engine", 3).ok,
  "owned lower tiers cannot be charged again",
);
assert(!P.equip(shop, "engine", 5).ok);
assert(P.equip(shop, "engine", 4).ok);
const restored = P.cleanProfile(JSON.parse(JSON.stringify(shop)));
assert.equal(restored.money, cash);
assert.equal(P.ownedLevel(restored, "engine"), 4);
assert.equal(restored.levels.engine, 4);
P.launch(shop);
assert(!P.equip(shop, "engine", 0).ok);
assert(!P.purchase(shop, "tank", 1).ok);
console.log(
  "PASS lightning outage cuts steering/main/aux, preserves fuel and motor intent across resume, keeps gravity and reboots with grace; owned-model equip is free, persistent and flight-guarded.",
);
