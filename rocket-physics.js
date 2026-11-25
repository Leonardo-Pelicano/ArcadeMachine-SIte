/* Pure deterministic campaign/flight logic. No DOM, WebGL or audio dependencies. */
(function (root) {
  "use strict";
  const D = root.SeleneData,
    C = (v, a, b) => Math.max(a, Math.min(b, v));
  function fresh() {
    return {
      schema: 2,
      routeRevision:21,
      day: 0,
      money: D.presentation?50000:0,
      seed: 1987,
      levels: Object.fromEntries(D.upgrades.map((u) => [u.id, D.presentation?4:0])),
      best: 0,
      flights: 0,
      totalCoins: 0,
      totalFuel: 0,
      totalEarned: 0,
      contracts: [],
      moon: false,
      intercepted: false,
      history: [],
      pending: null,
      introSeen: false,
      owned: Object.fromEntries(D.upgrades.map((u) => [u.id, D.presentation?[0,4]:[0]])),
      settings: { control: "mouse", voice: true, inputRevision: 14 },
      lastSettled: 0,
    };
  }
  function cleanProfile(raw) {
    const p = fresh();
    if (!raw || raw.schema !== 2) return p;
    for (const k of [
      "day",
      "money",
      "seed",
      "best",
      "flights",
      "totalCoins",
      "totalFuel",
      "totalEarned",
      "lastSettled",
    ])
      p[k] = C(Number(raw[k]) || 0, 0, k === "best" ? D.goal : 1e9);
    p.day = Math.floor(p.day);
    p.seed = Math.floor(p.seed) || 1987;
    for (const u of D.upgrades)
      p.levels[u.id] = Math.floor(C(Number(raw.levels?.[u.id]) || 0, 0, u.max));
    for (const u of D.upgrades) {
      const saved = Array.isArray(raw.owned?.[u.id]) ? raw.owned[u.id].filter(v => Number.isInteger(v) && v>=0 && v<=u.max) : [];
      p.owned[u.id] = [...new Set([0, p.levels[u.id], ...saved])].sort((a,b)=>a-b);
    }
    p.contracts = Array.isArray(raw.contracts)
      ? raw.contracts.filter((id) => D.contracts.some((c) => c.id === id))
      : [];
    if (raw.routeRevision !== 21) for(const m of D.milestones) if(p.best>=m.height && !p.contracts.includes("route_"+m.height)) p.contracts.push("route_"+m.height);
    p.moon = !!raw.moon;
    p.intercepted = !!raw.intercepted;
    p.missionIntroSeen = !!raw.missionIntroSeen;
    p.introSeen = !!raw.introSeen;
    p.settings = {
      control:
        raw.settings?.inputRevision >= 14 &&
        raw.settings?.control === "keyboard"
          ? "keyboard"
          : "mouse",
      inputRevision: 14,
      voice: raw.settings?.voice !== false,
    };
    p.history = Array.isArray(raw.history) ? raw.history.slice(-12) : [];
    if (
      raw.pending &&
      raw.pending.id > p.lastSettled &&
      raw.pending.id <= p.day
    ) {
      try {
        p.pending = Flight.restore(raw.pending).save();
      } catch (e) {}
    }
    return p;
  }
  function owns(p,id,target) {
    return Number.isInteger(target) && (target === 0 || p.levels[id] === target || (p.owned?.[id] || []).includes(target));
  }
  function ownedLevel(p, id) {
    return Math.max(p.levels[id] || 0, ...(p.owned?.[id] || [0]));
  }
  function equip(p, id, target) {
    const u = D.upgrades.find((u) => u.id === id);
    if (p.pending)
      return { ok: false, reason: "Conclua o voo antes de trocar peças." };
    if (
      !u ||
      !Number.isInteger(target) ||
      target < 0 ||
      target > u.max || !owns(p,id,target)
    )
      return { ok: false, reason: "Adquira esse modelo primeiro." };
    p.levels[id] = target;
    return { ok: true, level: target };
  }
  function purchase(p, id, target) {
    if (p.pending)
      return {
        ok: false,
        reason: "Encerre ou retome o voo antes de trocar peças.",
      };
    const u = D.upgrades.find((u) => u.id === id);
    if (!u) return { ok: false, reason: "Peça desconhecida." };
    target = target === undefined ? Array.from({length:u.max},(_,i)=>i+1).find(v=>!owns(p,id,v)) : Number(target);
    if (!Number.isInteger(target) || target < 1 || owns(p,id,target) || target > u.max)
      return { ok: false, reason: "Modelo já adquirido ou nível inválido." };
    const price = D.cost(id, target - 1);
    if (p.money < price)
      return { ok: false, reason: "Ainda faltam créditos para esse modelo." };
    p.money -= price;
    p.levels[id] = target;
    if (!p.owned) p.owned = {};
    p.owned[id] = [...new Set([0, ...(p.owned[id] || []), target])].sort((a,b)=>a-b);
    return { ok: true, price, level: target };
  }
  class Flight {
    constructor(levels, { id = 1, seed = 1987, difficulty = "normal" } = {}) {
      this.id = id;
      this.seed = seed >>> 0;
      this.rngState = this.seed;
      this.difficulty = difficulty;
      this.levels = { ...levels };
      this.stats = D.stats(levels);
      this.time = 0;
      this.x = 0;
      this.y = D.launchY;
      this.vx = 0;
      this.vy = 0;
      this.angle = 0;
      this.fuel = this.stats.fuel;
      this.hp = this.stats.health;
      this.aux = this.stats.booster;
      this.shield = this.stats.shield;
      this.maxY = 0;
      this.coins = 0;
      this.cash = 0;
      this.fuelPacks = 0;
      this.repairPacks = 0;
      this.hits = 0;
      this.invuln = 1.5;
      this.lastHit = -100;
      this.boostTime = 0;
      this.gateBoost = 0;
      this.cleanHeight = 0;
      this.announcedContracts = [];
      this.previousX = 0; this.previousY = D.launchY;
      this.generated = 0;
      this.objects = [];
      this.nextObject = 1;
      this.lastMothershipAt = -10000;
      this.arcadeRelicSpawned = false;
      this.arcadeMemory = false;
      this.depots = [];
      this.events = [];
      this.ended = false;
      this.win = false;
      this.reason = "";
      this.endTime = 0;
      this.maxSpeed = 0;
      this.countdown = 2.4;
      this.approach = 0;
      this.impactPoint = null;
      this.cinematicCues = [];
      this.engineOn = true;
      this.boostOn = false;
      this.input = { steer: 0, thrust: true, boost: false };
      this.nextPing = 0;
      this.fallTimer = 0;
      this.angularVelocity = 0;
      this.crashing = 0;
      this.damageFlash = 0;
      this.impactCount = 0;
      this.impactAt = -100;
      this.turnKick = 0;
      this.disabledFor = 0;
      this.rebootGrace = 0;
    }
    random() {
      this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0;
      return this.rngState / 4294967296;
    }
    emit(type, data = {}) {
      this.events.push({ type, ...data });
      if (this.events.length > 50) this.events.shift();
    }
    drain() {
      return this.events.splice(0);
    }
    finish(win, reason) {
      if (this.ended) return;
      this.ended = true;
      this.win = win;
      this.reason = reason;
      this.endTime = this.time;
      this.emit("finish", { win, reason });
    }
    damage(amount, contact = {}) {
 if(D.presentation){this.damageFlash=.1;return {loss:0,absorbed:0};}
      if (this.invuln > 0 || this.ended || this.crashing)
        return { loss: 0, absorbed: 0 };
      const mult =
        this.difficulty === "easy"
          ? 0.72
          : this.difficulty === "hard"
            ? 1.18
            : 1;
      let loss = amount * this.stats.armor * mult,
        absorbed = Math.min(this.shield, loss);
      this.shield -= absorbed;
      loss -= absorbed;
      this.hp = Math.max(0, this.hp - loss);
      this.hits++;
      this.lastHit = this.time;
      this.invuln = 0.7;
      this.damageFlash = 0.35;
      this.emit("hit", { loss, absorbed, x: this.x, y: this.y, ...contact });
      if (this.hp <= 0) {
        this.crashing = 1.8;
        this.engineOn = false;
        this.boostOn = false;
        this.emit("destroy", { x: this.x, y: this.y });
      }
      return { loss, absorbed };
    }
    collide(o) {
      if (this.ended || this.crashing || (o.cooldown || 0) > 0) return false;
      const regions = o.kind === "gate" ? [[-54, 0, 8, 17], [54, 0, 8, 17]] : D.obstacleShapes[o.type] || [[0, 0, o.r, o.r]],
        rotation = o.rotation || 0,
        c = Math.cos(rotation),
        s = Math.sin(rotation),
        facing = ["plane","bird"].includes(o.type) ? o.facing || (o.vx < 0 ? -1 : 1) : 1;
      let contact = null;
      for (const along of [-17, 7, 32]) {
        const x = this.x + Math.sin(this.angle) * along - o.x,
          y = this.y + Math.cos(this.angle) * along - o.y;
        const lx = (x * c - y * s) * facing,
          ly = -x * s - y * c;
        for (const [cx, cy, rx, ry] of regions) {
          const dx = lx - cx,
            dy = ly - cy,
            ex = rx + 14,
            ey = ry + 14,
            q = (dx / ex) ** 2 + (dy / ey) ** 2;
          if (q < 1 && (!contact || q < contact.q)) {
            const gx = (dx / ex ** 2) * facing,
              gy = dy / ey ** 2;
            contact = { q, ex, ey, nx: gx * c - gy * s, ny: -gx * s - gy * c };
          }
        }
      }
      if (!contact) return false;
      if (o.type === "storm") {
        if (this.disabledFor > 0 || this.rebootGrace > 0) return false;
        o.cooldown = 2.8;
        o.flash = 0.35;
        this.disabledFor =
          2.2 - Math.min(0.5, (this.levels.shield || 0) * 0.08);
        this.engineOn = false;
        this.boostOn = false;
        this.emit("disabled", {
          duration: this.disabledFor,
          x: this.x,
          y: this.y,
        });
        this.vy *= 0.88;
        this.angularVelocity += (this.random() - 0.5) * 2;
        this.damage(15, { kind: "storm" });
        this.emit("lightning", { x: o.x, y: o.y });
        return true;
      }
      const nx0 = contact.nx,
        ny0 = contact.ny,
        len = Math.hypot(nx0, ny0) || 1,
        nx = len === 1 && nx0 === 0 && ny0 === 0 ? 0 : nx0 / len,
        ny = len === 1 && nx0 === 0 && ny0 === 0 ? -1 : ny0 / len;
      const rvx = this.vx - (o.vx || 0),
        rvy = this.vy - (o.vy || 0),
        closing = Math.max(0, -(rvx * nx + rvy * ny)),
        relative = Math.hypot(rvx, rvy),
        impact = Math.max(closing, relative * 0.25);
      // Positional separation plus a velocity impulse: solid objects stay physical after contact.
      const separation =
        (1 - Math.sqrt(contact.q)) * Math.min(contact.ex, contact.ey) + 1;
      this.x += nx * separation;
      this.y += ny * separation;
      const soft = o.type === "balloon" || o.type === "bird",
        j = closing * (soft ? 0.35 : 1.1);
      this.vx += nx * j;
      this.vy += ny * j;
      this.vx *= soft ? 0.94 : 0.85;
      this.vy *= soft ? 0.94 : 0.85;
      this.angularVelocity += C(
        (nx || Math.sign(this.x - o.x) || 1) * (0.45 + impact * 0.012),
        -2.4,
        2.4,
      );
      this.turnKick = 0.9;
      if (["plane","bird"].includes(o.type) && o.facing === undefined)
        o.facing = o.vx < 0 ? -1 : 1;
      o.vx = (o.vx || 0) - nx * j * 0.5;
      o.vy = (o.vy || 0) - ny * j * 0.45 - 12;
      o.spin = (nx || 1) * (1 + impact * 0.025);
      o.cooldown = 1.3;
      o.flash = 0.25;
      o.state = soft ? (o.type === "balloon" ? "popped" : "flee") : "wreck";
      o.age = 0;
      if(o.type==="bird"){
        o.spin=0;o.vx=(o.facing||1)*85;
        this.emit("feathers",{x:o.x,y:o.y,kind:"bird",vx:this.vx,vy:this.vy});
      }
      if (o.kind === "gate") { o.state = null; o.vx = 0; o.vy = 0; o.spin = 0; o.rotation = 0; }
      this.impactAt = this.time;
      this.impactCount++;
      this.damage(((soft ? 4 : 7) + impact * (soft ? 0.14 : 0.23))*1.2, {
        kind: o.type,
        force: impact,
        normalX: nx,
        normalY: ny,
      });
      this.emit("collision", {
        x: o.x,
        y: o.y,
        kind: o.type,
        force: impact,
        soft,
      });
      return true;
    }
    spawn() {
      while (this.generated < this.maxY + 1100) {
        this.generated += 150 + Math.min(140,this.generated*.003) + this.random()*160;
        const h = this.generated,
          space = h > 7000,
          safe = C(this.x + this.vx * .7, -600, 600);
        let x = (this.random() - 0.5) * 1600;
        if (h < 450 && Math.abs(x) < 130) x += x >= 0 ? 210 : -210;
        x = C(x, -850, 850);
        let type = !space
          ? h < 3000
            ? ["balloon", "plane", "bird"][Math.floor(this.random() * 3)]
            : ["storm", "drone", "plane"][Math.floor(this.random() * 3)]
          : ["asteroid", "satellite", "ufo"][Math.floor(this.random() * 3)];
        if(h>=18000&&this.random()<.27)type="deepSatellite";
        if(h>=32000&&h-this.lastMothershipAt>6000&&this.random()<.07)type="mothership";
        if (this.random() < .85) { if(type==="mothership")this.lastMothershipAt=h; this.objects.push({
          id: this.nextObject++,
          kind: "obstacle",
          type,
          x,
          y: h + this.random() * 60,
          r:
            type === "mothership" ? 110 : type === "deepSatellite" ? 80 : type === "storm"
              ? 65
              : type === "plane"
                ? 38
                : type === "satellite"
                  ? 34
                  : 24 + this.random() * 12,
          vx:
            type === "bird" ? (this.random()>.5?1:-1)*(24+this.random()*18) : type === "mothership" ? (this.random()>.5?1:-1)*(10+this.random()*8) : type === "plane"
              ? this.random() > 0.5
                ? 28 + this.random() * 24
                : -28 - this.random() * 24
              : type === "ufo"
                ? (this.random() - .5) * 64
                : 0,
          phase: this.random() * 6,
          hit: false,
        });}
        const supply = D.supplies(h), roll = this.random(),
          pickup = roll < supply.fuelWeight ? "fuel" : roll < supply.fuelWeight+supply.repairWeight ? "repair" : roll < .87 ? "cash" : roll < .96 ? "aux" : "shield";
        if (this.random() < supply.chance) { const pickupObject = {
          id: this.nextObject++,
          kind: "pickup",
          type: pickup,
          x: C(safe + (this.random() - 0.5) * supply.spread, -900, 900),
          y: h + 45 + this.random() * 150,
          r: 24,
          vx: 0,
          phase: this.random() * 6,
          hit: false,
        };
          if(pickup==="fuel"){const grade=D.fuelGrade(pickupObject);pickupObject.fuelTier=grade.tier;pickupObject.r=grade.radius;}
          this.objects.push(pickupObject);
        }
        if(h>20000&&h<44000&&!this.arcadeRelicSpawned&&this.random()<.006){
          this.arcadeRelicSpawned=true;
          this.objects.push({id:this.nextObject++,kind:"pickup",type:"arcadeRelic",x:C(safe+(this.random()-.5)*400,-900,900),y:h+100,r:26,vx:0,phase:this.random()*6,hit:false});
        }
        if (h > 9000 && this.random() < .13)
          this.objects.push({
            id: this.nextObject++,
            kind: "gate",
            type: "gate",
            x: safe,
            y: h + 70 + this.random() * 100,
            r: 65,
            vx: 0,
            phase: 0,
            hit: false,
          });
      }
    }
    collect(o) {
      if (o.hit) return;
      o.hit = true;
      o.collected = 0.55;
      let fuelAdded=0;
      const fuelGrade=o.type==="fuel"?D.fuelGrade(o):null;
      switch (o.type) {
        case "arcadeRelic": this.arcadeMemory=true;break;
        case "cash":
          this.coins++;
          this.cash += 12 + Math.floor(this.y / 2500) * 4;
          break;
        case "fuel":
          fuelAdded=Math.min(this.stats.fuel-this.fuel,this.stats.fuel*fuelGrade.fraction+fuelGrade.liters);
          this.fuel+=fuelAdded;
          this.fuelPacks++;
          break;
        case "repair":
          this.hp = Math.min(
            this.stats.health,
            this.hp + 24 + this.levels.hull * 3,
          );
          this.repairPacks++;
          break;
        case "aux":
          this.aux = Math.min(this.stats.booster, this.aux + 2.5);
          break;
        case "shield":
          this.shield = Math.min(
            Math.max(25, this.stats.shield),
            this.shield + 25,
          );
          break;
      }
      this.emit("pickup", {
        kind: o.type,
        fuelAdded, fuelTier:fuelGrade?.tier || 0,
        x: o.x,
        y: o.y,
        amount: o.type === "cash" ? 12 + Math.floor(this.y / 2500) * 4 : 0,
      });
    }
    step(dt) {
      if (this.ended) return;
      dt = C(dt, 0, 0.05);
      this.time += dt;
      this.damageFlash = Math.max(0, this.damageFlash - dt);
      this.rebootGrace = Math.max(0, this.rebootGrace - dt);
      if (this.disabledFor > 0) {
        this.disabledFor = Math.max(0, this.disabledFor - dt);
        if (this.disabledFor === 0 && !this.crashing) {
          this.rebootGrace = 1.2;
          this.emit("reboot");
        }
      }
      if (this.crashing > 0) {
        this.crashing -= dt;
        this.angularVelocity += dt * 0.8;
        this.angle += this.angularVelocity * dt;
        this.vy -= 40 * dt;
        this.x += this.vx * dt;
        this.y = Math.max(D.launchY, this.y + this.vy * dt);
        this.updateObjects(dt);
        if (this.crashing <= 0)
          this.finish(false, "FOGUETE DANIFICADO · CÁPSULA RESGATADA");
        return;
      }

      if (this.countdown > 0) {
        const prev = Math.ceil(this.countdown);
        this.countdown = Math.max(0, this.countdown - dt);
        if (Math.ceil(this.countdown) !== prev)
          this.emit("countdown", { value: Math.ceil(this.countdown) });
        return;
      }
      if (this.approach > 0) {
        this.approach += dt;
        this.engineOn = false; this.boostOn = false;
        for (const [at,name] of [[5.5,"pelicano"],[12,"ground"],[19,"burn"],[25,"silence"],[27.2,"impact"],[30.5,"relief"],[36,"saved"]])
          if(this.approach>=at&&!this.cinematicCues.includes(name)){this.cinematicCues.push(name);this.emit("cinemaCue",{name});}
        if (this.approach >= D.finaleDuration) this.finish(true, "TK–87 NEUTRALIZADO · TERRA A SALVO");
        return;
      }
      const deliberateCut = this.engineOn && !this.input.thrust && this.disabledFor <= 0;
      this.invuln = Math.max(0, this.invuln - dt);
      const density = Math.exp(-this.y / 6500),
        gravity = 36,
        wind =
          this.y < 9000
            ? Math.sin(this.time * 0.55 + this.seed) *
              2.3 *
              density *
              this.stats.wind
            : 0;
      const locked = this.disabledFor > 0;
      if (locked) {
        this.angularVelocity *= Math.exp(-dt * 1.4);
        this.angle = Math.atan2(
          Math.sin(this.angle + this.angularVelocity * dt),
          Math.cos(this.angle + this.angularVelocity * dt),
        );
        this.engineOn = false;
        this.boostOn = false;
      } else {
        const freeAim =
          !!this.input.freeAim && Number.isFinite(this.input.aimAngle);
        if (Number.isFinite(this.input.aimAngle)) {
          const target = freeAim
              ? this.input.aimAngle
              : C(this.input.aimAngle, -1.3, 1.3),
            delta = target - this.angle;
          const error = freeAim
            ? Math.atan2(Math.sin(delta), Math.cos(delta))
            : delta;
          this.angularVelocity +=
            error * this.stats.control * (freeAim ? 6 : 4) * dt;
        } else
          this.angularVelocity +=
            C(this.input.steer, -1, 1) * this.stats.control * dt;
        this.angularVelocity *= Math.exp(
          -dt * (this.turnKick > 0 ? 1.5 : freeAim ? 4.8 : 3.5),
        );
        this.angularVelocity = C(this.angularVelocity, -6, 6);
        const nextAngle = this.angle + this.angularVelocity * dt;
        this.angle = freeAim
          ? Math.atan2(Math.sin(nextAngle), Math.cos(nextAngle))
          : C(nextAngle, -1.45, 1.45);
        this.turnKick = Math.max(0, this.turnKick - dt);
        this.engineOn = !!this.input.thrust && this.fuel > 0;
        this.boostOn = !!this.input.boost && this.aux > 0;
      }
      if (deliberateCut && !this.boostOn) this.gateBoost = 0;
      // Gentle coast damping keeps speed-dependent momentum controllable.
      // Gate impulses and electrical outages retain their separate response.
      const coastDrag=!this.engineOn&&!this.boostOn&&!locked&&this.gateBoost<=0?Math.max(0,this.vy)*.30:0;
      let force = 0;
      if (this.engineOn) {
        force += this.stats.thrust;
        this.fuel = Math.max(0, this.fuel - dt * this.stats.burn);
      }
      if (this.boostOn) {
        force += this.stats.boostThrust*(D.presentation?5:1);
        this.aux = Math.max(0, this.aux - dt*(D.presentation ? .18 : 1));
        this.boostTime += dt;
      }
      this.vx +=
        (Math.sin(this.angle) * force * 1.15 +
          wind -
          this.vx * (0.23 + density * 0.20)) *
        dt;
      this.vy +=
        (Math.cos(this.angle) * force -
          gravity - coastDrag -
          (this.vy < 0 ? 0.00065 : 0.0016) *
            Math.max(0.12, density) *
            this.vy *
            Math.abs(this.vy)) *
        dt;
      this.vx = C(this.vx, -195, 195);
      this.gateBoost = Math.max(0, this.gateBoost - dt);
      const speedCeiling=this.stats.maxSpeed+(D.presentation&&this.boostOn?350:0)+105*Math.min(1,this.gateBoost);
      this.vy=C(this.vy,-300,force>0?speedCeiling:Math.max(speedCeiling,this.vy));
      this.previousX = this.x; this.previousY = this.y;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.maxY = Math.max(this.maxY, this.y);
      if (this.hits === 0) this.cleanHeight = Math.max(this.cleanHeight, this.y);
      this.maxSpeed = Math.max(this.maxSpeed, Math.hypot(this.vx, this.vy));
      if (Math.abs(this.x) > 1050) {
        this.x = C(this.x, -1050, 1050);
        this.vx *= -0.4;
        this.damage(10);
      }
      this.spawn();
      this.updateObjects(dt);
      for (const m of D.milestones) if(this.maxY>=m.height && !this.depots.includes(m.height)) {
        this.depots.push(m.height);
        const fuelAdded=Math.min(this.stats.fuel-this.fuel,this.stats.fuel*.20);this.fuel+=fuelAdded;
        this.emit("checkpoint",{height:m.height,name:m.name,reward:m.reward,fuelAdded});
      }
      if (this.maxY>=D.goal && this.hp>0 && !this.crashing) {
        this.y=D.goal;this.maxY=D.goal;this.approach=.001;this.impactPoint=D.target(this);
        this.engineOn=false;this.boostOn=false;
        this.emit("approach");return;
      }
      if (
        this.disabledFor <= 0 &&
        this.time - this.lastHit > 7 &&
        this.stats.shield
      )
        this.shield = Math.min(
          this.stats.shield,
          this.shield + dt * this.stats.shieldRegen,
        );
      if (this.y <= D.launchY) {
        this.y = D.launchY;
        this.vy = Math.max(0, this.vy);
        if (this.time > 4 && (this.maxY > D.launchY + 3 || !this.engineOn))
          this.finish(
            false,
            this.hp <= 0 ? "CASCO COMPROMETIDO" : "RETORNO À BASE",
          );
      }
      this.fallTimer =
        this.vy < -35 && !this.engineOn && !this.boostOn
          ? this.fallTimer + dt
          : 0;
      if (this.fallTimer > 7) this.finish(false, "CÁPSULA RECUPERADA");
      if (this.time > 280) this.finish(false, "FIM DA JANELA DE LANÇAMENTO");
    }
    updateObjects(dt) {
      for (const o of this.objects) {
        if(o.type==="bird"&&!o.state){
          if(!o.vx)o.vx=Math.sin(o.phase||1)>0?30:-30;
          if(!Number.isFinite(o.baseY))o.baseY=o.y;
          o.flightClock=(o.flightClock||0)+dt;
          o.y=o.baseY+Math.sin(o.flightClock*1.7+(o.phase||0))*11;
        }
        if(o.type==="mothership"&&!o.state){if(!Number.isFinite(o.baseY))o.baseY=o.y;o.flightClock=(o.flightClock||0)+dt;o.y=o.baseY+Math.sin(o.flightClock*.6+(o.phase||0))*12;}
        if (["plane","bird"].includes(o.type) && !o.state) o.facing = o.vx < 0 ? -1 : 1;
        o.cooldown = Math.max(0, (o.cooldown || 0) - dt);
        o.flash = Math.max(0, (o.flash || 0) - dt);
        if (o.hit) {
          o.collected = Math.max(0, (o.collected || 0) - dt);
          continue;
        }
        if (o.state) {
          o.age = (o.age || 0) + dt;
          if (o.state === "wreck") {
            o.vy = (o.vy || 0) - 11 * dt;
            o.y += o.vy * dt;
          } else if (o.state === "flee") o.y += 70 * dt;
        }
        o.x += (o.vx || 0) * dt;
        o.rotation = (o.rotation || 0) + (o.spin || 0) * dt;
        if (Math.abs(o.x) > 1200 && !o.state) o.vx *= -1;
        if (o.state === "popped" || o.state === "flee") continue;
        const dx = o.x - this.x,
          dy = o.y - this.y,
          distance = Math.hypot(dx, dy);
        if (
          this.disabledFor <= 0 &&
          o.kind === "pickup" &&
          distance < this.stats.magnet
        ) {
          o.x -= dx * dt * 3;
          o.y -= dy * dt * 3;
        }
        if (o.kind === "pickup" && distance < o.r + 20) this.collect(o);
        else if (o.kind === "obstacle") this.collide(o);
        else if (o.kind === "gate") {
          o.boostFlash = Math.max(0, (o.boostFlash || 0) - dt);
          const py = this.previousY ?? this.y, px = this.previousX ?? this.x;
          const crossed = (py < o.y && this.y >= o.y) || (py > o.y && this.y <= o.y);
          const ratio = crossed ? (o.y - py) / (this.y - py) : 0;
          const crossingX = px + (this.x - px) * ratio;
          // Side housings are solid. Only a centered, upright passage activates the field.
          const contact = this.collide(o);
          if (!contact && crossed && Math.abs(crossingX - o.x) < 25 && Math.abs(Math.sin(this.angle)) < .55 && !(o.gateCooldown > 0)) {
            o.gateCooldown = 2; o.boostFlash = .9;
            this.gateBoost = 1.7;
            this.vy = Math.min(this.stats.maxSpeed + 105, Math.max(95, this.vy) + 90);
            this.emit("gate", {x:o.x, y:o.y});
          }
          o.gateCooldown = Math.max(0, (o.gateCooldown || 0) - dt);
        }
      }
      this.objects = this.objects.filter(
        (o) =>
          o.kind === "gate" || ((!o.hit || o.collected > 0) &&
          !(o.state === "popped" && o.age > 1.6) &&
          !(o.state === "flee" && o.age > 3) &&
          !(o.state === "wreck" && o.age > 9) &&
          o.y > this.y - 1300 &&
          o.y < this.y + 1700),
      );
      if (this.objects.length > 80) this.objects = [...this.objects.filter(o => o.kind === "gate"), ...this.objects.filter(o => o.kind !== "gate").slice(-80)];
    }
    save() {
      const data = {};
      for (const key of Object.keys(this))
        if (!["events", "input", "stats"].includes(key)) data[key] = this[key];
      data.motorRequested =
        typeof this.motorRequested === "boolean"
          ? this.motorRequested
          : !!this.input.thrust;
      return JSON.parse(JSON.stringify(data));
    }
    static restore(raw) {
      if (
        !raw ||
        !Number.isFinite(raw.y) ||
        !Number.isFinite(raw.time) ||
        raw.time < 0 ||
        raw.time > 280 + D.finaleDuration + 5 ||
        !Number.isInteger(raw.id) ||
        raw.id < 1
      )
        throw Error("Voo inválido");
      const levels = Object.fromEntries(
        D.upgrades.map((u) => [
          u.id,
          Math.floor(C(Number(raw.levels?.[u.id]) || 0, 0, u.max)),
        ]),
      );
      const f = new Flight(levels, {
        id: raw.id,
        seed: raw.seed,
        difficulty: raw.difficulty,
      });
      for (const key of Object.keys(f)) {
        if (["events", "stats", "input", "levels"].includes(key)) continue;
        if (key in raw) f[key] = raw[key];
      }
      for (const key of [
        "x",
        "y",
        "vx",
        "vy",
        "angle",
        "angularVelocity",
        "crashing",
        "rngState",
        "maxY",
        "fuel",
        "hp",
        "aux",
        "shield",
        "generated",
        "countdown",
        "disabledFor",
        "rebootGrace",
      ])
        if (!Number.isFinite(f[key]))
          throw Error("Estado de voo inválido: " + key);
      f.x = C(Number(f.x) || 0, -1050, 1050);
      f.y = C(f.y, 0, D.goal);
      f.fuel = C(Number(f.fuel) || 0, 0, f.stats.fuel);
      f.hp = C(Number(f.hp) || 0, 0, f.stats.health);
      f.aux = C(Number(f.aux) || 0, 0, f.stats.booster);
      f.objects = Array.isArray(f.objects)
        ? f.objects
            .slice(-256)
            .filter(
              (o) =>
                Number.isFinite(o.x) &&
                Number.isFinite(o.y) &&
                Number.isFinite(o.r) &&
                o.r > 0 &&
                o.r < 200 &&
                ["obstacle", "pickup", "gate"].includes(o.kind),
            )
        : [];
      for(const o of f.objects) if(o.kind==="pickup"&&o.type==="fuel"){const grade=D.fuelGrade(o);o.fuelTier=grade.tier;o.r=grade.radius;}
      if (f.approach > 0 && !f.impactPoint) f.impactPoint=D.target(f);
      f.events = [];
      f.input = {
        steer: 0,
        thrust:
          typeof raw.motorRequested === "boolean"
            ? raw.motorRequested
            : raw.engineOn !== false,
        boost: false,
      };
      return f;
    }
  }
  function randomSeed() {
    if (root.crypto?.getRandomValues) return root.crypto.getRandomValues(new Uint32Array(1))[0];
    return (Math.floor(Math.random() * 4294967296) ^ Date.now()) >>> 0;
  }
  function launch(p, difficulty = "normal", options = {}) {
    if (p.pending) throw Error("Retome ou encerre o voo atual.");
    p.day++;
    const f = new Flight(p.levels, {
      id: p.day,
      seed: options.seed ?? randomSeed(),
      difficulty,
    });
    p.pending = f.save();
    return f;
  }
  function earnings(p, f) {
    let income = 55 + Math.floor(f.maxY * .035 + f.cash + Math.max(0, f.time - f.countdown) * .15);
    if (f.difficulty === "hard") income = Math.round(income * 1.15);
    const rewards = D.contracts.filter(c => {
      const value = c.kind === "flights" ? p.flights + 1 : c.kind === "height" ? Math.max(p.best, f.maxY) : c.kind === "coins" ? p.totalCoins + f.coins : c.kind === "fuel" ? p.totalFuel + f.fuelPacks : c.kind === "relic" ? (f.arcadeMemory ? 1 : 0) : c.kind === "intercept" ? (f.win ? 1 : 0) : c.kind === "clean" ? Math.max(f.cleanHeight || 0, f.hits === 0 ? f.maxY : 0) : 0;
      return value >= c.target && !p.contracts.includes(c.id);
    });
    const contracts = rewards.reduce((sum, c) => sum + c.reward, 0);
    return {income, contracts, total:income + contracts, cash:f.cash, flight:income - f.cash, rewards};
  }
  function settle(p, f) {
    if (
      !f.ended ||
      f.id <= p.lastSettled ||
      f.id !== p.day ||
      p.pending?.id !== f.id
    )
      return { ok: false };
    const {income, contracts, rewards} = earnings(p, f);
    p.flights++;
    p.best = Math.max(p.best, f.maxY);
    p.totalCoins += f.coins;
    p.totalFuel += f.fuelPacks;
    p.contracts.push(...rewards.map(c => c.id));
    p.money += income + contracts;
    p.totalEarned += income + contracts;
    p.intercepted = p.intercepted || f.win;
    p.lastSettled = f.id;
    p.pending = null;
    const report = {
      day: f.id,
      income,
      contracts,
      total: income + contracts,
      height: f.maxY,
      coins: f.coins,
      reason: f.reason,
      win: f.win,
      hits: f.hits,
      rewards: rewards.map((r) => r.id),
    };
    p.history.push(report);
    p.history = p.history.slice(-12);
    return { ok: true, ...report };
  }
  root.SelenePhysics = {
    Flight,
    fresh,
    cleanProfile,
    purchase,
    equip,
    ownedLevel,
    owns,
    launch,
    settle,
    earnings,
  };
})(typeof window !== "undefined" ? window : globalThis);
