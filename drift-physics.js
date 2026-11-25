/* Fixed-step racing simulation, independent of DOM, audio and WebGL. */
(function (root) {
  "use strict";
  const V =
    root.DriftDynamics ||
    (typeof require === "function" ? require("./drift-dynamics.js") : null);
  const D = root.DriftData,
    clamp = (x, a, b) => Math.max(a, Math.min(b, x)),
    mod = (x, m) => ((x % m) + m) % m;
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function spline(a, b, c, d, t) {
    return (
      0.5 *
      (2 * b +
        (-a + c) * t +
        (2 * a - 5 * b + 4 * c - d) * t * t +
        (-a + 3 * b - 3 * c + d) * t * t * t)
    );
  }
  function buildTrack(config) {
    const controls = config.points,
      n = controls.length,
      raw = [];
    for (let i = 0; i < n * 100; i++) {
      const u = i / 100,
        k = Math.floor(u),
        t = u - k;
      raw.push(
        [0, 1, 2].map((axis) =>
          spline(
            controls[mod(k - 1, n)][axis],
            controls[k % n][axis],
            controls[(k + 1) % n][axis],
            controls[(k + 2) % n][axis],
            t,
          ),
        ),
      );
    }
    raw.push(raw[0]);
    const cumulative = [0];
    for (let i = 1; i < raw.length; i++)
      cumulative.push(
        cumulative[i - 1] +
          Math.hypot(...raw[i].map((v, k) => v - raw[i - 1][k])),
      );
    const length = cumulative.at(-1),
      samples = [];
    let j = 1;
    for (let i = 0; i <= 720; i++) {
      const s = (i / 720) * length;
      while (j < raw.length - 1 && cumulative[j] < s) j++;
      const f =
        (s - cumulative[j - 1]) / (cumulative[j] - cumulative[j - 1] || 1);
      samples.push(
        raw[j].map((v, k) => raw[j - 1][k] + (v - raw[j - 1][k]) * f),
      );
    }
    function at(s) {
      const u = (mod(s, length) / length) * 720,
        i = Math.floor(u),
        f = u - i;
      const p = samples[i],
        q = samples[(i + 1) % 720];
      return {
        x: p[0] + (q[0] - p[0]) * f,
        y: p[1] + (q[1] - p[1]) * f,
        z: p[2] + (q[2] - p[2]) * f,
      };
    }
    function frame(s) {
      const p = at(s),
        a = at(s - 2),
        b = at(s + 2),
        dx = b.x - a.x,
        dz = b.z - a.z,
        m = Math.hypot(dx, dz) || 1,
        tx = dx / m,
        tz = dz / m;
      return { ...p, tx, tz, nx: -tz, nz: tx, yaw: Math.atan2(tx, tz) };
    }
    function curvature(s) {
      const a = frame(s - 8),
        b = frame(s + 8);
      return (
        Math.atan2(a.tz * b.tx - a.tx * b.tz, a.tx * b.tx + a.tz * b.tz) / 16
      );
    }
    const turns = [];
    let peak = null;
    for (let i = 0; i <= 720; i++) {
      const s = (i / 720) * length,
        k = curvature(s);
      if (Math.abs(k) > 0.025) {
        if (!peak || Math.abs(k) > Math.abs(peak.curve)) peak = { s, curve: k };
      } else if (peak) {
        if (
          Math.abs(peak.curve) > 0.029 &&
          (!turns.length || peak.s - turns.at(-1).s > 55)
        )
          turns.push(peak);
        peak = null;
      }
    }
    if (peak && Math.abs(peak.curve) > 0.029) turns.push(peak);
    return { ...config, length, samples, at, frame, curvature, turns };
  }
  const cache = new Map();
  function track(id) {
    const cfg =
      typeof id === "number"
        ? D.tracks[id]
        : D.tracks.find((t) => t.id === id) || D.tracks[0];
    if (!cache.has(cfg.id)) cache.set(cfg.id, buildTrack(cfg));
    return cache.get(cfg.id);
  }
  class Race {
    constructor({
      trackIndex = 0,
      carIndex = 0,
      difficulty = "normal",
      seed = Date.now(),
    } = {}) {
      this.trackIndex = clamp(trackIndex, 0, D.tracks.length - 1);
      this.track = track(this.trackIndex);
      this.carIndex = clamp(carIndex, 0, D.cars.length - 1);
      this.difficulty = difficulty;
      this.random = rng(seed);
      this.time = 0;
      this.elapsed = 0;
      this.phase = "countdown";
      this.countdown = 3.2;
      this.events = [];
      this.hazards = [];
      this.ranking = [];
      this.finishOrder = [];
      this.contacts = new Map();
      this.target = 0;
      this.input = { drift: false, brake: false, steer: 0,throttle:0 };
      this.controlMode = "pointer";
      this.features = this.track.features.map((f) => ({
        ...f,
        s: f.fraction * this.track.length,
        endS: (f.end || f.fraction) * this.track.length,
      }));
      this.lastCountdown = 4;
      this.boostPads = [0.19, 0.53, 0.83].map((f, i) => ({
        s: this.track.length * f,
        lane: i % 2 ? 0.55 : -0.55,
      }));
      this.boxes = [0.12, 0.32, 0.48, 0.66, 0.89].flatMap((f, i) =>
        [-0.6, 0, 0.6].map((lane, k) => ({
          s: this.track.length * f,
          lane,
          ready: 0,
          phase: i + k,
        })),
      );
      const create = (id, index) => {
        const rival = D.rivals[id - 1],
          car = D.cars[id === 0 ? this.carIndex : rival.car];
        return {
          id,
          name: id === 0 ? "VOCÊ" : rival.name,
          car,
          color: id === 0 ? car.color : rival.color,
          s: -index * 7,
          lane: index % 2 ? -0.36 : 0.36,
          target: index % 2 ? -0.36 : 0.36,
          speed: 0,
          skill: id === 0 ? 1 : rival.skill,
          aggression: id === 0 ? 0 : rival.aggression,
          lap: 1,
          completedLaps: 0,
          lapStarted: 0,
          lastLap: 0,
          bestLap: Infinity,
          boost: 0,
          shield: 0,
          slow: 0,
          spin: 0,
          invulnerable: 0,
          item: null,
          itemAt: 0,
          decision: 0,
          drifting: false,
          driftCharge: 0,
          driftDir: 0,
          finished: false,
          finishTime: 0,
          rank: 8,
          padAt: 0,
          progress: 0,
          steerVisual: 0,
          laneV: 0,
          heading: 0,
          wheelAngle: 0,
          slipAngle: 0,
          air: 0,
          jumpAt: 0,
          planLane: ((id % 3) - 1) * 0.48,
          maneuverUntil: 0,
          desiredLane: 0,
        };
      };
      this.cars = [
        create(0, 5),
        ...D.rivals.map((r, i) => create(i + 1, i < 5 ? i : i + 1)),
      ];
      this.cars.forEach((c) => V.init(c));
      this.player = this.cars[0];
      this.player.lane = 0;
      this.player.target = 0;
      this.target = 0;
      this.startS = this.player.s;
      this.updateRanking();
    }
    emit(type, data = {}) {
      this.events.push({ type, ...data });
      if (this.events.length > 80) this.events.shift();
    }
    drainEvents() {
      return this.events.splice(0);
    }
    setSteer(axis) {
      this.controlMode = "keyboard";
      this.input.steer = clamp(axis, -1, 1);
    }
    setTarget(x) {
      this.controlMode = "pointer";
      this.target = clamp(x, -1.2, 1.2);
    }
    reposition(){if(this.phase!=='racing'||this.elapsed<(this.resetAt||0))return false;const c=this.player;const lanes=[0,-.55,.55];c.lane=lanes.find(l=>!this.cars.some(o=>o!==c&&Math.abs(o.s-c.s)<8&&Math.abs(o.lane-l)<.35))??0;c.heading=0;c.slipAngle=0;c.wheelAngle=0;c.yawRate=0;c.speed=0;c.kickVX=0;c.driftExitArmed=0;c.driftExitRemaining=0;c.driftExitBias=0;c.driftCharge=0;c.pendingDrift=0;c.driftSpoiled=true;this.elapsed+=2;this.resetAt=this.elapsed+2;this.target=0;this.input.steer=0;this.emit('reposition',{id:0});return true;}
    updateRanking() {
      const sorted = this.cars
        .slice()
        .sort((a, b) =>
          a.finished && b.finished
            ? a.finishTime - b.finishTime
            : a.finished
              ? -1
              : b.finished
                ? 1
                : b.s - a.s,
        );
      sorted.forEach((c, i) => (c.rank = i + 1));
      this.ranking = sorted;
      return sorted;
    }
    useItem(c = this.player) {
      if (this.phase !== "racing" || !c.item || c.finished) return false;
      const item = c.item;
      c.item = null;
      c.itemAt = this.elapsed;
      if (item === "boost") {
        c.boost = Math.max(c.boost, 2.8);
        this.emit("boost", { id: c.id });
      } else if (item === "shield") {
        c.shield = 7;
        this.emit("shield", { id: c.id });
      } else if (item === "mine") {
        this.hazards.push({ s: c.s - 6, lane: c.lane, owner: c.id, life: 14 });
        this.emit("mine", { id: c.id });
      } else {
        const candidates = this.cars
          .filter((r) => r !== c && !r.finished && r.s > c.s && r.s - c.s < 95)
          .sort((a, b) => a.s - b.s);
        if (candidates[0]) {
          this.hit(candidates[0], 2.2, c.id);
          this.emit("pulse", { id: c.id, target: candidates[0].id });
        } else this.emit("miss", { id: c.id });
      }
      return true;
    }
    hit(c, power, source) {
      if (c.invulnerable > 0 || c.finished) return false;
      if (c.shield > 0) {
        c.shield = 0;
        c.invulnerable = 0.7;
        this.emit("blocked", { id: c.id });
        return false;
      }
      c.driftSpoiled = true;
      c.driftCharge = 0;
      c.pendingDrift = 0;
      c.slow = Math.max(c.slow, power);
      c.spin = c.id === 0 ? 0 : 0.7;
      c.speed *= 0.65;
      c.invulnerable = 1.4;
      this.emit("hit", { id: c.id, source });
      return true;
    }
    chooseItem(c) {
      const r = this.random();
      if (c.rank >= 5) return r < 0.5 ? "boost" : r < 0.8 ? "pulse" : "shield";
      return r < 0.3
        ? "boost"
        : r < 0.55
          ? "shield"
          : r < 0.8
            ? "mine"
            : "pulse";
    }
    think(c, dt) {
      // Lane decisions are committed for seconds, not re-randomized every frame.
      c.decision -= dt;
      if (c.decision <= 0) {
        c.decision = 1.15 + this.random() * 0.55;
        const ahead = this.cars
          .filter(
            (o) =>
              o !== c &&
              !o.finished &&
              o.s > c.s &&
              o.s - c.s < 38 &&
              Math.abs(o.lane - c.planLane) < 0.27,
          )
          .sort((a, b) => a.s - b.s)[0];
        const clear = (lane) =>
          !this.cars.some(
            (o) =>
              o !== c &&
              Math.abs(o.s - c.s) < 23 &&
              Math.abs(o.lane - lane) < 0.3,
          );
        if (ahead && this.elapsed >= c.maneuverUntil) {
          const candidates = [-0.64, 0, 0.64].filter(
            (lane) => Math.abs(lane - ahead.lane) > 0.35 && clear(lane),
          );
          if (candidates.length) {
            c.planLane = candidates.sort(
              (a, b) => Math.abs(a - c.lane) - Math.abs(b - c.lane),
            )[0];
            c.maneuverUntil = this.elapsed + 2.8;
          }
        }
        const hazard = this.hazards.find(
          (h) =>
            h.owner !== c.id &&
            mod(h.s - c.s, this.track.length) < 48 &&
            Math.abs(h.lane - c.planLane) < 0.3,
        );
        if (hazard && this.elapsed >= c.maneuverUntil) {
          const lanes = [-0.64, 0, 0.64].filter(
            (l) => Math.abs(l - hazard.lane) > 0.4 && clear(l),
          );
          if (lanes.length) {
            c.planLane = lanes.sort(
              (a, b) => Math.abs(a - c.lane) - Math.abs(b - c.lane),
            )[0];
            c.maneuverUntil = this.elapsed + 2.3;
          }
        }
        const obstacle = this.features.find(
          (f) => f.type === "boulder" && mod(f.s - c.s, this.track.length) < 55,
        );
        if (obstacle && this.elapsed >= c.maneuverUntil) {
          c.planLane = c.id % 2 ? 0.65 : -0.65;
          c.maneuverUntil = this.elapsed + 2.6;
        }
        if (
          c.item &&
          this.elapsed - c.itemAt > 1.8 &&
          (c.item !== "mine" ||
            this.cars.some((o) => c.s - o.s > 0 && c.s - o.s < 35))
        )
          this.useItem(c);
      }
      const apex = clamp(-this.track.curvature(c.s + 32) * 13, -0.2, 0.2);
      const aim = clamp(c.planLane + apex, -0.85, 0.85);
      c.target += clamp(aim - c.target, -dt * 0.42, dt * 0.42);
      const bend = Math.abs(this.track.curvature(c.s + 16));
      c.aiCornering =
        c.speed > 30 &&
        c.slow <= 0 &&
        (c.drifting ? bend > 0.004 : bend > 0.009);
    }
    step(dt) {
      if (this.phase === "finished" || this.phase === "paused") return;
      dt = clamp(dt, 0, 0.05);
      this.time += dt;
      if (this.phase === "countdown") {
        const next = Math.min(3, Math.ceil(Math.max(0, this.countdown)));
        if (next !== this.lastCountdown) {
          this.lastCountdown = next;
          this.emit("countdown", { value: next });
        }
        this.countdown -= dt;
        if (this.countdown <= 0) {
          this.phase = "racing";
          this.emit("go");
        }
        return;
      }
      this.elapsed += dt;
      const factor =
        this.difficulty === "easy"
          ? 0.9
          : this.difficulty === "hard"
            ? 1.045
            : 0.98;
      for (const c of this.cars) {
        if (c.finished) continue;
        for (const k of ["boost", "shield", "slow", "spin", "invulnerable"])
          c[k] = Math.max(0, c[k] - dt);
        const curve = this.track.curvature(c.s + (c.id ? 12 : 0));
        if (c.id) {
          this.think(c, dt);
        } else {
          c.target = this.target;
        }
        V.handbrake(this, c, dt, curve);
        const delta = c.target - c.lane;
        const ice = this.features.some(
          (f) =>
            f.type === "ice" &&
            mod(c.s, this.track.length) > f.s &&
            mod(c.s, this.track.length) < f.endS,
        );
        const grip = c.car.grip * this.track.grip * (ice ? 0.76 : 1);
        const keyboard = c.id === 0 && this.controlMode === "keyboard";
        const wanted = keyboard
          ? this.input.steer * (c.drifting ? 1.38 : 1.16)
          : clamp(delta * (c.id ? 2.2 : 3.1), -1.2, 1.2);
        const response = (c.drifting ? 4.2 : 6.5) * Math.sqrt(grip);
        if (c.id === 0) {
          V.integrate(this, c, dt, wanted, curve, grip);
        } else {
          // Preserve the established NPC trajectories and decision cadence.
          c.laneV += (wanted - c.laneV) * (1 - Math.exp(-dt * response));
          c.lane +=
            (c.laneV + c.kickVX / this.track.width) * dt +
            clamp(curve * c.speed * c.speed * 0.009, -0.23, 0.23) *
              dt *
              (c.drifting ? 1.3 : 1);
          c.heading = Math.atan2(
            c.laneV * this.track.width,
            Math.max(12, c.speed),
          );
          c.wheelAngle = clamp(
            -Math.atan(curve * (c.car.shape === "formula" ? 3.05 : 2.65)),
            -0.3,
            0.3,
          );
        }
        c.steerVisual +=
          (clamp(c.wheelAngle / 0.3, -1, 1) - c.steerVisual) *
          (1 - Math.exp(-dt * 9));
        c.air = Math.max(0, c.air - dt);
        for (const feature of this.features) {
          const passed = mod(c.s - feature.s, this.track.length);
          const ahead = mod(feature.s - c.s, this.track.length),
            lap = Math.floor(Math.max(0, c.s) / this.track.length);
          if (
            c.id === 0 &&
            feature.type !== "tunnel" &&
            ahead > 30 &&
            ahead < 65 &&
            feature.warnedLap !== lap
          ) {
            feature.warnedLap = lap;
            this.emit("featureWarning", { id: 0, feature: feature.type });
          }
          if (
            feature.type === "ramp" &&
            passed < 5 &&
            Math.abs(c.lane - feature.lane) < 0.33 &&
            c.speed > 28 &&
            this.elapsed > c.jumpAt
          ) {
            c.air = 1.1;
            c.jumpAt = this.elapsed + 2;
            this.emit("jump", { id: c.id });
          }
          if (feature.type === "boulder" && passed < 6 && c.air < 0.15) {
            const rockLane =
              Math.sin((this.time + feature.phase) * 0.63) * 1.08;
            if (Math.abs(c.lane - rockLane) < 0.19) this.hit(c, 1.2, -1);
          }
        }
        V.drift(this, c, dt);
        let max = c.car.speed;if(!c.id&&root.ReleaseEdition?.adm)max=Math.max(c.car.speed,...this.cars.filter(r=>r.id).map(r=>r.car.speed*factor*r.skill*1.055))*1.06;
        if (c.id) {
          const catchup = clamp((this.player.s - c.s) / 400, -0.055, 0.055);
          max *= factor * c.skill * (1 + catchup);
        }
        const turnFactor = clamp(
          1 -
            (Math.abs(curve) * (c.drifting ? 8 : 13)) /
              (c.car.grip * this.track.grip),
          0.65,
          1,
        );
        if(c.id)max *= turnFactor;
        const lookBend = Math.max(
          Math.abs(curve),
          Math.abs(this.track.curvature(c.s + 22)),
          Math.abs(this.track.curvature(c.s + 42)),
        );
        if(c.id)max = Math.min(
          max,
          Math.sqrt(
            (38 * c.car.grip * this.track.grip) / Math.max(0.001, lookBend),
          ) * (c.id ? (this.difficulty === "easy" ? 0.91 : 1) : 1.03),
        );
        if (Math.abs(c.lane) > 1.02) max *= 0.58;
        if (c.slow > 0) max *= 0.58;
        if (c.id === 0 && this.input.brake) max *= 0.42;
        if (c.boost > 0 && !c.handbrake) max *= 1.3;
        if (c.handbrake) max = Math.min(max, c.speed);
        const slope = this.track.at(c.s + 3).y - this.track.at(c.s - 3).y;
        max *= clamp(1 - slope * 0.02, 0.93, 1.05);
        if(c.id)c.speed+=(max-c.speed)*Math.min(1,dt*(c.speed<max?c.car.accel/19:3.2));
        else{
          const throttle=clamp(this.input.throttle||0,0,1);
          if(throttle&&!c.handbrake&&!this.input.brake)c.speed+=(max-c.speed)*Math.min(1,dt*c.car.accel/19);
          else c.speed=Math.max(0,c.speed-dt*(2.1+c.speed*.055));
          if(this.input.brake)c.speed=Math.max(0,c.speed-dt*18);
        }
        if (c.handbrake && c.air < 0.05)
          c.speed = Math.max(0, c.speed - dt * (8 + c.speed * 0.1));
        c.speed = Math.max(
          0,
          c.speed - Math.abs(c.slipAngle) * Math.min(7, c.speed * 0.13) * dt,
        );
        const previous = c.s;
        c.s +=
          Math.max(0, c.speed) *
          (c.id === 0
            ? Math.cos(c.heading) /
              Math.max(0.6, 1 + curve * c.lane * this.track.width)
            : 1) *
          dt;
        c.progress = Math.max(0, c.s) / this.track.length;
        const beforeLap = Math.floor(Math.max(0, previous) / this.track.length),
          afterLap = Math.floor(Math.max(0, c.s) / this.track.length);
        if (afterLap > c.completedLaps) {
          c.completedLaps = afterLap;
          const crossedAt =
            this.elapsed -
            (c.s - afterLap * this.track.length) /
              Math.max(0.01, (c.s - previous) / dt);
          c.lastLap = crossedAt - c.lapStarted;
          c.bestLap = Math.min(c.bestLap, c.lastLap);
          c.lapStarted = crossedAt;
          c.lap = Math.min(D.laps, afterLap + 1);
          this.emit("lap", { id: c.id, lap: c.lap, lastLap: c.lastLap });
          if (afterLap >= D.laps) {
            c.finished = true;
            c.finishTime = crossedAt;
            this.finishOrder.push(c.id);
            this.emit("finish", { id: c.id });
          }
        }
        for (const p of this.boostPads) {
          if (
            this.elapsed > c.padAt &&
            mod(c.s - p.s, this.track.length) < 5 &&
            Math.abs(c.lane - p.lane) < 0.3
          ) {
            c.boost = Math.max(c.boost, 0.85);
            c.padAt = this.elapsed + 1;
            this.emit("pad", { id: c.id });
          }
        }
        if (!c.item)
          for (const b of this.boxes) {
            if (
              b.ready <= this.elapsed &&
              mod(c.s - b.s, this.track.length) < 4 &&
              Math.abs(c.lane - b.lane) < 0.22
            ) {
              b.ready = this.elapsed + 7;
              c.item = this.chooseItem(c);
              c.itemAt = this.elapsed;
              this.emit("pickup", { id: c.id, item: c.item });
              break;
            }
          }
        for (const h of this.hazards)
          if (
            h.owner !== c.id &&
            mod(c.s - h.s, this.track.length) < 4 &&
            Math.abs(c.lane - h.lane) < 0.23 &&
            h.life > 0
          ) {
            this.hit(c, 1.8, h.owner);
            h.life = 0;
          }
      }
      for (const c of this.cars) V.wall(this, c);
      for (let i = 0; i < this.cars.length; i++)
        for (let j = i + 1; j < this.cars.length; j++)
          V.pair(this, this.cars[i], this.cars[j]);
      for (const c of this.cars) V.wall(this, c);
      this.hazards = this.hazards.filter((h) => (h.life -= dt) > 0);
      this.updateRanking();
      if (this.player.finished) {
        this.phase = "finished";
        const completed = this.ranking.filter((c) => c.finished),
          others = this.ranking.filter((c) => !c.finished);
        others.forEach((c) => {
          c.finishTime =
            this.elapsed +
            Math.max(
              0.1,
              (this.track.length * D.laps - c.s) / Math.max(10, c.speed),
            );
          c.projected = true;
        });
        this.results = [...completed, ...others].map((c, i) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          car: c.car.name,
          position: i + 1,
          time: c.finishTime,
          projected: !!c.projected,
          points: D.points[i],
        }));
        this.emit("raceEnd", { position: this.player.rank });
      }
    }
  }
  root.DriftPhysics = { Race, track, buildTrack, clamp, mod, rng };
})(typeof window !== "undefined" ? window : globalThis);
