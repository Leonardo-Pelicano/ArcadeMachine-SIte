const assert = require("node:assert/strict");
require("../rocket-data");
require("../rocket-physics");
const D = SeleneData,
  P = SelenePhysics;
const f = new P.Flight(P.fresh().levels);
f.countdown = 0;
f.generated = 1e9;
for (let i = 0; i < 300; i++) f.step(1 / 60);
assert(f.y - D.launchY > 160 && f.y - D.launchY < 220, "moderate launch pace");
assert(f.vy > 55 && f.vy < 80);
const ascent = Math.round(f.y - D.launchY);
f.y = f.maxY = 12000;
f.vy = 0;
f.fuel = 0;
f.input.thrust = false;
for (let i = 0; i < 120; i++) f.step(1 / 60);
assert(12000 - f.y > 40 && 12000 - f.y < 58);
assert(f.vy < -40 && f.vy > -60);
const fall = Math.round(12000 - f.y);
const pad = new P.Flight(P.fresh().levels);
for (let i = 0; i < 140; i++) pad.step(1 / 60);
assert.equal(pad.y, D.launchY);
assert.equal(pad.vy, 0);
pad.countdown = 0;
pad.time = 3;
pad.input.thrust = false;
for (let i = 0; i < 180 && !pad.ended; i++) pad.step(1 / 60);
assert.equal(pad.y, D.launchY);
assert(pad.ended);
const saved = P.fresh();
saved.day = 5;
saved.money = 150;
saved.levels.engine = 2;
saved.introSeen = true;
const restored = P.cleanProfile(JSON.parse(JSON.stringify(saved)));
assert.equal(restored.day, 5);
assert.equal(restored.money, 150);
assert.equal(restored.levels.engine, 2);
assert.equal(restored.introSeen, true);
console.log(
  "PASS responsive flight: " +
    ascent +
    " units ascent / 5s, " +
    fall +
    " units fall / 2s; countdown on pad, ground support and V12 campaign retained.",
);

const defaultControls = P.fresh();
assert.equal(defaultControls.settings.control, "mouse");
const legacy = {
  ...defaultControls,
  day: 8,
  money: 230,
  settings: { control: "keyboard", voice: false },
};
const migrated = P.cleanProfile(legacy);
assert.equal(migrated.settings.control, "mouse");
assert.equal(migrated.day, 8);
assert.equal(migrated.money, 230);
assert.equal(migrated.settings.voice, false);
migrated.settings.control = "keyboard";
assert.equal(P.cleanProfile(migrated).settings.control, "keyboard");
const orbit = new P.Flight(defaultControls.levels);
orbit.y = orbit.maxY = 12000;
orbit.generated = 1e9;
orbit.countdown = 0;
orbit.input.aimAngle = 2.4;
orbit.input.freeAim = true;
for (let i = 0; i < 180; i++) orbit.step(1 / 60);
assert(
  Math.abs(orbit.angle - 2.4) < 0.2,
  "cursor can direct rocket beyond the old 75-degree limit",
);
orbit.angle = Math.PI - 0.03;
orbit.angularVelocity = 0;
orbit.input.aimAngle = -Math.PI + 0.03;
orbit.step(0.02);
assert(
  orbit.angularVelocity > 0,
  "crossing the angle seam follows the shortest rotation",
);
console.log(
  "PASS default mouse controls, one-time legacy migration, preserved keyboard preference and full-circle shortest-arc aiming.",
);
