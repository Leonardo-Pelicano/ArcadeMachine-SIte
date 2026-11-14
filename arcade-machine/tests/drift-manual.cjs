const assert = require("node:assert/strict");
require("../drift-data.js");
require("../drift-physics.js");
function race() {
  const r = new DriftPhysics.Race({ seed: 22 });
  r.phase = "racing";
  r.cars = r.cars.slice(0, 1);
  r.player.invulnerable = 999;
  return r;
}
const r = race();
for (let i = 0; i < 60; i++) r.step(1 / 60);
assert.equal(r.player.speed, 0);
r.input.throttle = 1;
for (let i = 0; i < 120; i++) r.step(1 / 60);
assert(r.player.speed > 20);
const speed = r.player.speed;
r.input.throttle = 0;
for (let i = 0; i < 30; i++) r.step(1 / 60);
assert(r.player.speed < speed);
const a = race(),
  b = race();
a.player.speed = b.player.speed = 30;
b.input.brake = true;
for (let i = 0; i < 20; i++) {
  a.step(1 / 60);
  b.step(1 / 60);
}
assert(b.player.speed < a.player.speed - 3);
const c = race();
c.player.s = 700;
c.player.speed = 15;
c.setSteer(0);
let accumulatedRoad = 0;
const start = c.player.heading + c.player.slipAngle;
for (let i = 0; i < 20; i++) {
  const car = c.player,
    curve = c.track.curvature(car.s);
  accumulatedRoad +=
    (curve * car.speed * Math.cos(car.heading)) /
    Math.max(0.65, 1 + curve * car.lane * c.track.width) /
    60;
  c.step(1 / 60);
}
assert(Math.abs(c.player.wheelAngle) < 1e-12);
assert(
  Math.abs(c.player.heading + c.player.slipAngle - start - accumulatedRoad) <
    0.01,
  "world orientation stays straight while road bends",
);
for (const sign of [-1, 1]) {
  const t = race();
  t.player.speed = 30;
  t.setSteer(sign);
  for (let i = 0; i < 20; i++) t.step(1 / 60);
  assert(t.player.wheelAngle * sign > 0);
  assert(t.player.yawRate * sign > 0);
}
const old = r.elapsed;
assert(r.reposition());
assert.equal(r.player.speed, 0);
assert.equal(r.elapsed, old + 2);
console.log(
  "PASS throttle/coasting, braking, manual steering without road follow, left/right yaw and reset penalty.",
);
