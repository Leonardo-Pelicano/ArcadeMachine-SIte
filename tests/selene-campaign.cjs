// Deterministic external pilot for progression checks only.
require("../rocket-data");
require("../rocket-physics");
const D = SeleneData,
  P = SelenePhysics;
function pilot(f) {
  const ahead = f.objects
    .filter(
      (o) =>
        o.kind === "obstacle" &&
        !o.state &&
        o.y > f.y - 20 &&
        o.y < f.y + Math.max(330, f.vy * 2.3),
    )
    .sort((a, b) => a.y - b.y);
  let target = f.x;
  let danger = false;
  for (const o of ahead) {
    const radius = o.type === "storm" ? 90 : o.type === "plane" ? 95 : o.r + 55;
    const predicted =
      f.x + f.vx * Math.max(0, (o.y - f.y) / Math.max(40, f.vy));
    if (Math.abs(predicted - o.x) < radius) {
      target = o.x + (f.x >= o.x ? 1 : -1) * (radius + 75);
      danger = true;
      break;
    }
  }
  if (!danger) {
    const pick = f.objects
      .filter(
        (o) =>
          o.kind === "pickup" &&
          !o.hit &&
          o.y > f.y + 20 &&
          o.y < f.y + 300 &&
          Math.abs(o.x - f.x) < 280,
      )
      .sort((a, b) => a.y - b.y)[0];
    if (pick) target = pick.x;
  }
  target = Math.max(-850, Math.min(850, target));
  f.input.aimAngle = Math.max(
    -0.8,
    Math.min(0.8, (target - f.x) * 0.007 - f.vx * 0.045),
  );
  f.input.boost = f.time > 5 && !danger;
  f.input.thrust = true;
}
const p = P.fresh();
for (let day = 1; day <= 45; day++) {
  for (let i = 0; i < 60; i++) {
    const ids = [
      "engine",
      "tank",
      "efficiency",
      "booster",
      "hull",
      "magnet",
      "stability",
      "shield",
    ]
      .filter((id) => p.levels[id] < 6 && D.cost(id, p.levels[id]) <= p.money)
      .sort((a, b) => p.levels[a] - p.levels[b]);
    if (!ids.length) break;
    P.purchase(p, ids[0]);
  }
  const f = P.launch(p, "normal", {seed:1987+day*7919});
  while (!f.ended) {
    pilot(f);
    f.step(0.025);
  }
  P.settle(p, f);
  console.log(
    day,
    Math.round(f.maxY),
    f.hits,
    f.coins,
    p.money,
    Object.values(p.levels).join(""),
  );
  if (p.intercepted) break;
}
require("node:assert/strict")(
  p.intercepted,
  "A skilled test pilot can finish the campaign",
);
require("node:assert/strict")(
  p.day >= 3 && p.day <= 30,
  "Campaign progression remains bounded",
);
console.log(
  "PASS complete asteroid interception campaign in " +
    p.day +
    " days; test-only external pilot, no runtime autopilot.",
);
