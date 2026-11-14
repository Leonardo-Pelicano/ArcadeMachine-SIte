// External test pilot only. Runtime game contains no automatic player steering.
const assert = require("assert/strict");
require("../drift-data");
require("../drift-physics");
for (let trackIndex = 0; trackIndex < 8; trackIndex++) {
  const r = new DriftPhysics.Race({ trackIndex, seed: 12 });
  r.cars = r.cars.slice(0, 1);
  let worst = 0;
  for (let i = 0; i < 30000 && r.phase !== "finished"; i++) {
    const c = r.player,
      cur = r.track.curvature(c.s),
      look = Math.max(
        ...[0, 15, 30, 50].map((x) => Math.abs(r.track.curvature(c.s + x))),
      ),
      v = Math.max(c.speed, 10),
      desired = Math.atan2(-c.lane * r.track.width * 1.2, v),
      body = c.heading + c.slipAngle,
      road =
        (cur * c.speed * Math.cos(c.heading)) /
        Math.max(0.65, 1 + cur * c.lane * r.track.width),
      wanted = (desired - body) * 3 - road;
    const wheel = Math.atan(
      (wanted * (c.car.shape === "formula" ? 3.05 : 2.65)) / v,
    );
    r.setSteer(
      Math.max(-1, Math.min(1, wheel / (0.36 / (1 + c.speed * 0.055)))),
    );
    const target = Math.min(39, Math.sqrt(24 / Math.max(0.001, look)));
    r.input.throttle = c.speed < target ? 1 : 0;
    r.input.brake = c.speed > target + 3;
    r.step(0.025);
    worst = Math.max(worst, Math.abs(c.lane));
    assert(Number.isFinite(c.heading));
  }
  assert.equal(r.phase, "finished", "track " + trackIndex);
  console.log(
    "PASS circuit",
    trackIndex + 1,
    "3 laps",
    Math.round(r.elapsed) + "s",
    "maxLane",
    worst.toFixed(2),
  );
}
