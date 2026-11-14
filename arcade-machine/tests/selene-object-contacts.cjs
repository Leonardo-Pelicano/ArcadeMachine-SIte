const assert = require("node:assert/strict");
require("../rocket-data");
require("../rocket-physics");
const D = SeleneData,
  P = SelenePhysics;
function flight() {
  const f = new P.Flight(P.fresh().levels);
  f.y = f.maxY = 1000;
  f.countdown = 0;
  f.time = 4;
  f.invuln = 0;
  f.generated = 1e9;
  return f;
}
const basket = flight();
basket.vy = 30;
const b = {
  id: 1,
  type: "balloon",
  kind: "obstacle",
  x: 0,
  y: 1080,
  r: 30,
  vx: 0,
};
assert(basket.collide(b), "basket is a solid region below the envelope");
assert.equal(b.state, "popped");
const panel = flight();
panel.x = 39;
panel.vy = 40;
const satellite = {
  id: 2,
  type: "satellite",
  kind: "obstacle",
  x: 0,
  y: 1050,
  r: 34,
  vx: 0,
};
assert(panel.collide(satellite), "solar panel participates in collision");
assert.equal(satellite.state, "wreck");
const tilted = flight(),
  angle = 0.8;
tilted.x = 39 * Math.cos(angle);
tilted.y = 1100 - 39 * Math.sin(angle) - 32;
assert(
  tilted.collide({
    id: 3,
    type: "satellite",
    kind: "obstacle",
    x: 0,
    y: 1100,
    r: 34,
    vx: 0,
    rotation: angle,
  }),
);
assert(Number.isFinite(tilted.vx) && Number.isFinite(tilted.vy));
const clear = flight();
clear.x = 90;
assert(
  !clear.collide({
    id: 4,
    type: "balloon",
    kind: "obstacle",
    x: 0,
    y: 1080,
    r: 30,
    vx: 0,
  }),
);
assert.equal(clear.hits, 0);
for (const type of [
  "plane",
  "balloon",
  "bird",
  "storm",
  "satellite",
  "drone",
  "ufo",
]) {
  assert(D.obstacleShapes[type].length > 0);
  for (const p of D.obstacleShapes[type])
    assert(p.length === 4 && p.every(Number.isFinite) && p[2] > 0 && p[3] > 0);
}
console.log(
  "PASS solid balloon basket, satellite panels, rotated wreck regions and clear-space miss; shared model collision dimensions finite.",
);
