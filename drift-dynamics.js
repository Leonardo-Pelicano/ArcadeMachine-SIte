/* Original arcade adaptation of tyre-slip, rear-grip and impulse principles.
   References (concepts only): Marco Monster, Car Physics for Games; Unity wheel friction docs.
   SI units inside the contact solver; track lane coordinates remain normalized. */
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    angle = (v) => Math.atan2(Math.sin(v), Math.cos(v));
  function init(c) {
    Object.assign(c, {
      rearGrip: 1,
      yawRate: 0,
      handbrake: false,
      wasHandbrake: false,
      hbPulse: 0,
      hbNext: 0,
      pendingDrift: 0,
      recoverUntil: 0,
      driftSpoiled: false,
      driftRisk: 0,
      spinCooldown: 0,
      kickVX: 0,
      impactYaw: 0,
      impact: 0,
      wallAt: -1,
      length:
        c.car.shape === "formula"
          ? 5.2
          : c.car.shape === "prototype"
            ? 4.7
            : 4.25,
      width:
        c.car.shape === "formula"
          ? 2.65
          : c.car.shape === "muscle"
            ? 2.3
            : 2.15,
    });
  }
  function handbrake(r, c, dt, curve) {
    c.impact = Math.max(0, c.impact - dt * 3);
    c.kickVX *= Math.exp(-dt * 3.6);
    c.impactYaw *= Math.exp(-dt * 4);
    c.spinCooldown = Math.max(0, c.spinCooldown - dt);
    let pressed;
    if (c.id === 0) pressed = !!r.input.drift && !r.input.brake;
    else {
      c.hbPulse = Math.max(0, c.hbPulse - dt);
      const bend = Math.abs(curve),
        safe = Math.sqrt(
          (34 * c.car.grip * r.track.grip) / Math.max(0.001, bend),
        );
      if (bend > 0.018 && c.speed > safe * 1.06 && r.elapsed > c.hbNext) {
        c.hbPulse = 0.33;
        c.hbNext = r.elapsed + 3.2;
      }
      pressed = c.hbPulse > 0;
    }
    c.wasHandbrake = c.handbrake;
    c.handbrake = pressed;
    c.rearGrip +=
      ((pressed ? 0.3 : 1) - c.rearGrip) *
      (1 - Math.exp(-dt * (pressed ? 12 : 2.6)));
    if (pressed && !c.wasHandbrake && c.air < 0.05) {
      c.pendingDrift = 0;
      c.driftCharge = 0;
      c.speed *= 0.91;
      c.driftSpoiled = false;
      const direction = Math.sign(
        c.id
          ? -curve
          : r.controlMode === "keyboard"
            ? r.input.steer
            : c.target - c.lane,
      );
      c.yawRate += direction * 0.24 * Math.min(1, c.speed / 25);
      r.emit("handbrake", { id: c.id });
    }
    c.drifting =
      c.speed > 9 &&
      c.air < 0.05 &&
      (pressed || (c.rearGrip < 0.85 && Math.abs(c.slipAngle) > 0.1));
  }
  function integrate(r, c, dt, wanted, curve, grip) {
    const wheelbase = c.car.shape === "formula" ? 3.05 : 2.65,
      body = c.heading + c.slipAngle;
    const roadYaw =
      (curve * c.speed * Math.cos(c.heading)) /
      Math.max(0.65, 1 + curve * c.lane * r.track.width);
    // Direct steering: roadYaw only changes the road reference frame. It never steers the tyres.
    const steer = clamp(
      r.controlMode === "keyboard" ? r.input.steer : r.target,
      -1,
      1,
    );
    const limit = 0.36 / (1 + c.speed * 0.055),
      demand = steer * limit * (c.handbrake ? 1.15 : 1);
    c.wheelAngle +=
      (clamp(demand, -0.4, 0.4) - c.wheelAngle) *
      (1 - Math.exp(-dt * (c.handbrake ? 8 : 13)));
    const oversteer = c.handbrake
        ? c.slipAngle * (0.7 + c.speed * 0.018) * (1 - c.rearGrip)
        : 0,
      targetYaw = (c.speed / wheelbase) * Math.tan(c.wheelAngle) + oversteer;
    c.yawRate +=
      (targetYaw - c.yawRate) * (1 - Math.exp(-dt * (c.handbrake ? 4.5 : 12)));
    let nextBody = angle(body + (roadYaw + c.yawRate) * dt),
      slip = angle(body + c.yawRate * dt - c.heading),
      tyre = clamp(1 - Math.max(0, Math.abs(slip) - 0.18) * 0.9, 0.45, 1),
      maxRate =
        ((c.handbrake || c.rearGrip < 0.8 ? 42 : 75) *
          grip *
          (0.55 + 0.45 * c.rearGrip) *
          tyre) /
        Math.max(10, c.speed),
      align = slip * (5.5 + 8 * c.rearGrip) * grip;
    c.heading = angle(
      c.heading + (roadYaw + clamp(align, -maxRate, maxRate)) * dt,
    );
    c.slipAngle = clamp(angle(nextBody - c.heading), -0.95, 0.95);
    c.laneV = (c.speed * Math.sin(c.heading)) / r.track.width;
    c.lane += c.laneV * dt;
    c.driftRisk = clamp((Math.abs(c.slipAngle) - 0.2) / 0.58, 0, 1);
    if (Math.abs(c.slipAngle) > 0.79 && c.speed > 20 && c.spinCooldown <= 0) {
      c.speed *= 0.64;
      c.spin = 0.65;
      c.spinCooldown = 3;
      c.driftSpoiled = true;
      c.driftCharge = 0;
      c.pendingDrift = 0;
      c.yawRate *= 0.3;
      r.emit("driftFail", { id: c.id });
    }
  }
  function drift(r, c, dt) {
    if (c.id) {
      const sign = Math.sign(c.heading || -r.track.curvature(c.s));
      c.slipAngle +=
        ((c.handbrake ? sign * 0.23 : 0) - c.slipAngle) *
        (1 - Math.exp(-dt * 4));
      c.driftRisk = clamp(Math.abs(c.slipAngle) / 0.8, 0, 1);
    }
    if (Math.abs(c.lane) > 1.02 || c.slow > 0) {
      c.driftSpoiled = true;
      c.driftCharge = 0;
      c.pendingDrift = 0;
    }
    if (c.handbrake && c.speed < 10) c.driftCharge = 0;
    const beta = Math.abs(c.slipAngle),
      valid =
        c.drifting &&
        c.speed > 13 &&
        beta > 0.1 &&
        beta < 0.64 &&
        c.air < 0.05 &&
        Math.abs(c.lane) < 0.97 &&
        !c.driftSpoiled;
    if (valid)
      c.driftCharge = Math.min(
        2,
        c.driftCharge +
          dt * (0.5 + beta * 1.7) * Math.min(1, c.speed / 32) * c.car.drift,
      );
    if (c.wasHandbrake && !c.handbrake) {
      c.pendingDrift =
        c.driftCharge > 0.55 && !c.driftSpoiled ? c.driftCharge : 0;
      c.recoverUntil = r.elapsed + 2;
      c.driftCharge = 0;
    }
    if (c.pendingDrift) {
      if (
        r.elapsed > c.recoverUntil ||
        Math.abs(c.lane) > 1.02 ||
        c.driftSpoiled
      )
        c.pendingDrift = 0;
      else if (beta < 0.11 && c.rearGrip > 0.78) {
        const level = c.pendingDrift > 1.3 ? 2 : 1;
        c.boost = Math.max(c.boost, level === 2 ? 0.85 : 0.5);
        c.pendingDrift = 0;
        r.emit("driftBoost", { id: c.id, level });
      }
    }
    if (!c.handbrake && !c.pendingDrift && beta < 0.08) c.driftCharge = 0;
  }
  function velocity(c) {
    return {
      x: Math.sin(c.heading) * c.speed,
      z: Math.cos(c.heading) * c.speed,
    };
  }
  function setVelocity(c, vx, vz) {
    const body = c.heading + c.slipAngle;
    c.speed = clamp(Math.hypot(vx, vz), 0, c.car.speed * 1.6);
    const heading = angle(Math.atan2(vx, vz));
    if (c.id) c.kickVX += vx - Math.sin(c.heading) * c.speed;
    c.heading = heading;
    c.slipAngle = clamp(angle(body - heading), -0.9, 0.9);
  }
  function spoil(c, severity) {
    if (severity > 0.12) {
      c.driftSpoiled = true;
      c.driftCharge = 0;
      c.pendingDrift = 0;
    }
    c.impact = Math.max(c.impact, severity);
  }
  function pair(r, a, b) {
    if (a.finished || b.finished || Math.abs(a.air - b.air) > 0.35)
      return false;
    const L = r.track.length,
      dz = ((((b.s - a.s + L / 2) % L) + L) % L) - L / 2,
      dx = (b.lane - a.lane) * r.track.width;
    if (Math.abs(dz) > 8 || Math.abs(dx) > 6) return false;
    const aa = a.heading + a.slipAngle,
      ba = b.heading + b.slipAngle,
      af = { x: Math.sin(aa), z: Math.cos(aa) },
      ar = { x: Math.cos(aa), z: -Math.sin(aa) },
      bf = { x: Math.sin(ba), z: Math.cos(ba) },
      br = { x: Math.cos(ba), z: -Math.sin(ba) },
      axes = [af, ar, bf, br];
    let overlap = Infinity,
      normal = null;
    for (const n of axes) {
      const ra =
          a.length * 0.5 * Math.abs(n.x * af.x + n.z * af.z) +
          a.width * 0.5 * Math.abs(n.x * ar.x + n.z * ar.z),
        rb =
          b.length * 0.5 * Math.abs(n.x * bf.x + n.z * bf.z) +
          b.width * 0.5 * Math.abs(n.x * br.x + n.z * br.z),
        d = dx * n.x + dz * n.z,
        o = ra + rb - Math.abs(d);
      if (o <= 0) return false;
      if (o < overlap) {
        overlap = o;
        const sign = d >= 0 ? 1 : -1;
        normal = { x: n.x * sign, z: n.z * sign };
      }
    }
    const av = velocity(a),
      bv = velocity(b),
      rel = (bv.x - av.x) * normal.x + (bv.z - av.z) * normal.z,
      closing = Math.max(0, -rel),
      protectedA = a.shield > 0,
      protectedB = b.shield > 0,
      ma = a.car.weight * (protectedA ? 4 : 1),
      mb = b.car.weight * (protectedB ? 4 : 1),
      ia = 1 / ma,
      ib = 1 / mb;
    const correction = Math.min(overlap + 0.015, 1.3) / (ia + ib);
    a.lane -= (normal.x * correction * ia) / r.track.width;
    b.lane += (normal.x * correction * ib) / r.track.width;
    a.s -= normal.z * correction * ia;
    b.s += normal.z * correction * ib;
    const impulse = Math.min(32, (1.16 * closing) / (ia + ib));
    if (impulse > 0.01) {
      const tx = -normal.z,
        tz = normal.x,
        relT = (bv.x - av.x) * tx + (bv.z - av.z) * tz,
        friction = clamp(-relT / (ia + ib), -impulse * 0.18, impulse * 0.18),
        jx = normal.x * impulse + tx * friction,
        jz = normal.z * impulse + tz * friction;
      setVelocity(a, av.x - jx * ia, av.z - jz * ia);
      setVelocity(b, bv.x + jx * ib, bv.z + jz * ib);
      const torque = clamp(
        (dx * normal.z - dz * normal.x) * impulse * 0.022,
        -0.65,
        0.65,
      );
      a.yawRate -= torque * ia;
      b.yawRate += torque * ib;
      a.impactYaw -= torque * 0.15;
      b.impactYaw += torque * 0.15;
    }
    const severity = clamp(closing / 22 + 0.04, 0, 1);
    if (!protectedA) spoil(a, severity);
    if (!protectedB) spoil(b, severity);
    if (protectedA && closing > 3) {
      a.shield = 0;
      r.emit("blocked", { id: a.id });
    }
    if (protectedB && closing > 3) {
      b.shield = 0;
      r.emit("blocked", { id: b.id });
    }
    const key = Math.min(a.id, b.id) + ":" + Math.max(a.id, b.id),
      last = r.contacts.get(key) ?? -10;
    if (r.elapsed - last > 0.18 && closing > 0.3) {
      r.contacts.set(key, r.elapsed);
      r.emit("bump", {
        id: a.id,
        other: b.id,
        kind: Math.abs(normal.z) > 0.65 ? "rear" : "side",
        severity,
        impulse,
        atS: a.s + normal.z * a.length * 0.5,
        atLane: (a.lane + b.lane) * 0.5,
      });
    }
    return true;
  }
  function wall(r, c) {
    if (c.finished || c.air > 0.3) return;
    const side = Math.sign(c.lane) || 1,
      body = c.heading + c.slipAngle,
      half =
        Math.abs(Math.cos(body)) * c.width * 0.5 +
        Math.abs(Math.sin(body)) * c.length * 0.5,
      limit = (r.track.width + 2.2 - half) / r.track.width;
    if (Math.abs(c.lane) <= limit) return;
    const v = velocity(c),
      out = Math.max(0, v.x * side),
      scrape = clamp(out / 28, 0.015, 0.36),
      protectedCar = c.shield > 0;
    c.lane = side * limit;
    if (out > 0.1) {
      setVelocity(
        c,
        -side * out * 0.28,
        v.z * (protectedCar ? 0.97 : 1 - scrape),
      );
      c.yawRate -= side * clamp(out * 0.055, 0.05, 0.6);
      if (c.id) c.kickVX = -side * out * 0.25;
    }
    const severity = clamp(out / 20 + 0.05, 0, 1);
    if (!protectedCar) spoil(c, severity);
    if (protectedCar && out > 3) {
      c.shield = 0;
      r.emit("blocked", { id: c.id });
    }
    if (r.elapsed - c.wallAt > 0.22) {
      c.wallAt = r.elapsed;
      r.emit("wall", {
        id: c.id,
        severity,
        atS: c.s,
        atLane: (side * (r.track.width + 2.1)) / r.track.width,
      });
    }
  }
  const api = { init, handbrake, integrate, drift, pair, wall, velocity };
  root.DriftDynamics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
