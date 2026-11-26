const arcadeModal = document.getElementById("arcadeModal"),
  pilotModal = document.getElementById("pilotModal"),
  closeArcadeModal = document.getElementById("closeArcadeModal"),
  closePilotModal = document.getElementById("closePilotModal"),
  arcadeCanvas = document.getElementById("arcadeCanvas"),
  pilotCanvas = document.getElementById("pilotCanvas"),
  ctx = arcadeCanvas.getContext("2d"),
  pctx = pilotCanvas.getContext("2d");
let arcadeRunning = false,
  gameOver = false,
  animationId = null,
  score = 0,
  lives = 3,
  level = 1,
  lastEnemyFire = 0,
  lastFrame = 0;
let bossEntering = false,
  bossEntryStart = 0,
  bossWarnings = [];
let victoryTimer = 0,
  victoryActive = false,
  boss2SummonTimer = 0;
let upgrade = null; // null | 'charged' | 'homing'
let shotCooldown = 0,
  chargeStart = 0,
  isCharging = false,
  screenShake = 0;
let pilotRunning = false,
  pilotAnimationId = null,
  pilotLastFrame = 0,
  pilotScore = 0,
  pilotLives = 3,
  pilotGameOver = false;
let pilotAsteroids = [],
  pilotStars = [],
  pilotParticles = [];
let pilotMouseX = 410,
  pilotMouseY = 450,
  pilotShipX = 410,
  pilotShipY = 450;
let pilotInvincible = 0;
let keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  a: false,
  d: false,
  w: false,
  s: false,
  A: false,
  D: false,
  W: false,
  S: false,
};
let playerShots = [],
  enemyShots = [],
  enemies = [],
  starsBg = [];
let player = { x: 410, y: 460, w: 34, h: 34, speed: 300 };
const DIFFICULTIES = {
  easy: {
    key: "easy",
    label: "FÁCIL",
    lives: 5,
    enemyRate: 1.4,
    bulletSpeed: 0.78,
    bossHP: 0.8,
    bossSpeed: 0.85,
    pilotSpawn: 0.65,
    pilotSpeed: 0.75,
    invincible: 2.3,
  },
  normal: {
    key: "normal",
    label: "NORMAL",
    lives: 3,
    enemyRate: 1,
    bulletSpeed: 1,
    bossHP: 1,
    bossSpeed: 1,
    pilotSpawn: 1,
    pilotSpeed: 1,
    invincible: 1.8,
  },
  hard: {
    key: "hard",
    label: "DIFÍCIL",
    lives: 2,
    enemyRate: 0.72,
    bulletSpeed: 1.28,
    bossHP: 1.25,
    bossSpeed: 1.1,
    pilotSpawn: 1.4,
    pilotSpeed: 1.25,
    invincible: 1.2,
  },
};
let gameDifficulty = DIFFICULTIES.normal,
  pilotWaveMilestone = 0;
function alertSound() {
  window.ArcadeAudio?.effect("hit", 0.32);
}
function beep(...args) {
  window.arcadeSound?.tone(...args);
}
let waveReadyUntil = 0,
  mobileNextShot = 0;
let arcadeClock = 0,
  arcadeTime = 0,
  arcadeInvincible = 0,
  arcadeParticles = [],
  arcadeEndAt = 0,
  arcadeWon = false,
  bossNotice = "",
  bossNoticeUntil = 0;
function spawnEnemy(x, y) {
  const advanced = gameDifficulty.key !== "easy",
    hp =
      2 +
      (advanced && level > 1 ? 1 : 0) +
      (gameDifficulty.key === "hard" && level === 3 ? 1 : 0);
  enemies.push({
    x,
    y,
    baseX: x,
    baseY: y,
    w: 28,
    h: 24,
    alive: true,
    boss: false,
    hp,
    maxHp: hp,
    seed: Math.random() * 6.28,
    drift: 18 + Math.random() * 20,
    targetX: x,
    targetY: y,
    decisionAt: 0,
    hitUntil: 0,
    diving: false,
  });
}
function createEnemies(lvl=1){
 enemies=[];bossWarnings=[];bossEntering=false;victoryActive=false;boss2SummonTimer=0;
 const stage=window.LaunchCampaign.shooter[lvl-1];if(!stage){endArcade(true);return;}
 bossNotice=stage.name;bossNoticeUntil=arcadeClock+2600;
 if(!stage.boss){const total=stage.count;for(let i=0;i<total;i++){
 let x=100+(i%8)*88,y=80+Math.floor(i/8)*54;
 if(stage.pattern==='ring'){const a=i/total*Math.PI*2;x=410+Math.cos(a)*225;y=155+Math.sin(a)*85;}
 if(stage.pattern==='v'){const j=i-total/2;x=410+j*39;y=68+Math.abs(j)*13;}
 if(stage.pattern==='lanes'){x=110+(i%3)*300;y=62+Math.floor(i/3)*43;}
 spawnEnemy(x,y);const e=enemies.at(-1);window.ShooterDirector.initEnemy(e,(stage.mix||[stage.kind])[i%(stage.mix||[stage.kind]).length]);e.pattern=stage.pattern;e.waveIndex=i;
 }}else{bossEntering=true;bossEntryStart=arcadeClock;const n=stage.boss;bossNotice=window.ShooterDirector.bosses[n-1].name;const hp=Math.round(window.ShooterDirector.bosses[n-1].hp*gameDifficulty.bossHP);
 enemies.push({x:410,y:-120,targetY:92,w:145+n*4,h:86,alive:true,boss:true,boss2:n===5,bossKind:n,hp,maxHp:hp,phase:0,stage:1,vx:110,moveTimer:0,tentaclePhase:0,targetX:410,targetY2:92,decisionAt:0,attackAt:arcadeClock+3000,laughAt:arcadeClock+9000,morphUntil:0});window.ArcadeAudio.effect(n===5?'laughFinal':'laugh',.32);}
}
function initStars() {
  starsBg = Array.from({ length: 80 }, () => ({
    x: Math.random() * arcadeCanvas.width,
    y: Math.random() * arcadeCanvas.height,
    s: Math.random() * 2 + 0.5,
    v: Math.random() * 25 + 10,
  }));
}
function resetArcadeGame() {
 window.ClassicPause?.reset();
  arcadeClock = performance.now();
  arcadeTime = 0;
  arcadeInvincible = 1;
  arcadeParticles = [];
  arcadeEndAt = 0;
  arcadeWon = false;
  bossNotice = "";
  score = 0;
  lives = gameDifficulty.lives;
  level = 1;
  gameOver = false;
  victoryActive = false;
  bossWarnings = [];
  upgrade = null;
  isCharging = false;
  screenShake = 0;
  shotCooldown = 0;
  player = { x: 410, y: 460, w: 30, h: 30, speed: 300 };
  playerShots = [];
  enemyShots = [];
  resetArcadePosition(800);
  createEnemies(1);
  initStars();
  lastEnemyFire = arcadeClock;
  lastFrame = 0;
  window.GameFX.hideRestart("arcadeModal");
}
function resetArcadePosition(delay = 1100) {
  player.x = 410;
  player.y = 460;
  playerShots = [];
  enemyShots = [];
  bossWarnings = [];
  arcadeInvincible = Math.max(arcadeInvincible, delay / 1000 + 0.35);
  waveReadyUntil = arcadeClock + delay;
  mobileNextShot = waveReadyUntil;
  for (const key of Object.keys(keys)) keys[key] = false;
  window.TouchArcade?.reset("arcade", 410, 460);
}
function endArcade(win = false) {
  if (gameOver) return;
  gameOver = true;
  arcadeWon = win;
  arcadeEndAt = performance.now();
  bossWarnings = [];
  window.GameFX.terminal("arcadeModal", win);
}
function drawHeart(x, y, size) {
  ctx.save();
  ctx.fillStyle = "#ff697f";
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
  ctx.bezierCurveTo(
    x - size * 0.5,
    y + size * 0.6,
    x,
    y + size * 0.9,
    x,
    y + size,
  );
  ctx.bezierCurveTo(
    x,
    y + size * 0.9,
    x + size * 0.5,
    y + size * 0.6,
    x + size * 0.5,
    y + size * 0.3,
  );
  ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
  ctx.fill();
  ctx.restore();
}
function drawPlayer(paint=ctx,pose=player){window.SpaceArt.ship(paint,pose.x,pose.y,1,arcadeTime,0);}
function drawShot(s, color, h) {
  window.GameFX.bolt(ctx, s, color, h);
}
function intersects(a, b) {
  return (
    a.x - (a.w || 2) / 2 < b.x + b.w / 2 &&
    a.x + (a.w || 2) / 2 > b.x - b.w / 2 &&
    a.y - (a.h || 12) / 2 < b.y + b.h / 2 &&
    a.y + (a.h || 12) / 2 > b.y - b.h / 2
  );
}
function fireBossLaser(boss, now, forcedHoriz) {
  const horiz =
      typeof forcedHoriz === "boolean" ? forcedHoriz : Math.random() < 0.48,
    limit = horiz ? 520 : 820;
  const aim = (horiz ? player.y : player.x) + (Math.random() - 0.5) * 120;
  const pos = Math.max(
    50,
    Math.min(
      limit - 50,
      Math.random() < 0.65 ? aim : 60 + Math.random() * (limit - 120),
    ),
  );
  const warn =
    gameDifficulty.key === "hard"
      ? 1400
      : gameDifficulty.key === "easy"
        ? 2300
        : 1850;
  bossWarnings.push({
    horiz,
    pos,
    start: now,
    fireAt: now + warn,
    endAt: now + warn + 880,
    rise: 150,
    hold: 270,
    fade: 460,
    fired: false,
    lastCountdown: -1,
  });
}
function laserEnvelope(w, now) {
  const age = now - w.fireAt,
    length = w.horiz ? 820 : 520;
  if (age < 0) return { active: false, head: 0, tail: 0, width: 0, alpha: 0 };
  const head = length * Math.min(1, age / w.rise),
    decay = Math.max(0, (age - w.rise - w.hold) / w.fade),
    tail = length * Math.min(1, decay);
  return {
    active: age < w.rise + w.hold + w.fade,
    head,
    tail,
    width: 18 * Math.pow(Math.max(0, 1 - decay), 0.65) * Math.min(1, age / 70),
    alpha: Math.max(0, 1 - decay),
  };
}
function fan(boss,now,spiral=false){const n=boss.bossKind||1,angle=Math.atan2(player.y-boss.y,player.x-boss.x),count=n===1?3:n===2?5:n===3?7:n===4?8:10;
for(let i=0;i<count;i++){const a=n>=4?i/count*Math.PI*2+boss.moveTimer*.45:angle+(i-(count-1)/2)*(.13+n*.025);const speed=145+n*13;enemyShots.push({x:boss.x,y:boss.y+20,vx:Math.cos(a)*speed,v:Math.sin(a)*speed,w:7,h:16})}window.ArcadeAudio.effect('enemyLaser',.13);}
function updateArcade(dt, now) {
  arcadeTime += dt;
  arcadeParticles = window.GameFX.update(arcadeParticles, dt);
  arcadeInvincible = Math.max(0, arcadeInvincible - dt);
  screenShake = Math.max(0, screenShake - dt * 8);
  starsBg.forEach((s) => {
    s.y = (s.y + s.v * dt) % 520;
  });
  if (gameOver) return;
  if (victoryActive) {
    victoryTimer -= dt;
    if (victoryTimer <= 0) {
      victoryActive = false;
      level++;
      resetArcadePosition();
      createEnemies(level);
    }
    return;
  }
  if (now < waveReadyUntil) return;
  const touch = window.TouchArcade?.read("arcade");
  if (window.TouchArcade?.enabled && touch) {
    const follow = Math.min(1, dt * 19);
    player.x += (touch.x - player.x) * follow;
    player.y += (touch.y - player.y) * follow;
  }
  if (window.TouchArcade?.enabled && now >= mobileNextShot) {
    shootArcade();
    mobileNextShot = now + 380;
  }
  const k = keys;
  player.x = Math.max(
    20,
    Math.min(
      800,
      player.x +
        ((k.ArrowRight || k.d || k.D ? 1 : 0) -
          (k.ArrowLeft || k.a || k.A ? 1 : 0)) *
          player.speed *
          dt,
    ),
  );
  player.y = Math.max(
    45,
    Math.min(
      495,
      player.y +
        ((k.ArrowDown || k.s || k.S ? 1 : 0) -
          (k.ArrowUp || k.w || k.W ? 1 : 0)) *
          player.speed *
          dt,
    ),
  );
  for (const s of playerShots) {
    if (s.homing && s.target?.alive) {
      const a = Math.atan2(s.target.y - s.y, s.target.x - s.x);
      s.x += Math.cos(a) * 300 * dt;
      s.y += Math.sin(a) * 300 * dt;
    } else s.y -= 470 * dt;
  }
  playerShots = playerShots.filter(
    (s) => s.y > -40 && s.x > -40 && s.x < 860 && !s.spent,
  );
  window.ShooterDirector.updateShots(dt);
  for (const s of enemyShots) {
    s.x += (s.vx || 0) * dt * gameDifficulty.bulletSpeed;
    s.y += s.v * dt * gameDifficulty.bulletSpeed;
  }
  enemyShots = enemyShots.filter(
    (s) => s.x > -40 && s.x < 860 && s.y > -40 && s.y < 560,
  );
  let divers = enemies.filter((e) => e.diving && e.alive).length;
  for (const e of enemies) {
    if (!e.alive || e.boss) continue;
    if (gameDifficulty.key === "easy") {
      e.x = e.baseX + Math.sin(arcadeTime * 2 + e.seed) * e.drift;
      e.y = e.baseY + Math.cos(arcadeTime * 1.5 + e.seed) * 12;
    } else {
      if (now >= e.decisionAt) {
        e.diving =
          divers < 2 &&
          Math.random() < (gameDifficulty.key === "hard" ? 0.23 : 0.12);
        if (e.diving) divers++;
        e.targetX = Math.max(
          35,
          Math.min(785, e.baseX + (Math.random() - 0.5) * 190),
        );
        e.targetY = e.diving
          ? 250 + Math.random() * 105
          : Math.max(58, Math.min(250, e.baseY + (Math.random() - 0.5) * 85));
        e.decisionAt =
          now +
          (gameDifficulty.key === "hard" ? 550 : 950) +
          Math.random() * 1000;
      }
      const speed = gameDifficulty.key === "hard" ? 3.2 : 2.2;
      e.x += (e.targetX - e.x) * Math.min(1, dt * speed);
      e.y +=
        (e.targetY - e.y) * Math.min(1, dt * speed) +
        Math.sin(arcadeTime * 2.7 + e.seed) * dt * 9;
    }
  }
  for(const e of enemies){if(!e.alive||e.boss)continue;
 const i=e.waveIndex||0,t=arcadeTime;
 if(e.pattern==='orbit'){e.x=e.baseX+Math.sin(t*1.8+i)*70;e.y=e.baseY+Math.cos(t*1.6+i)*28;}
 if(e.pattern==='sweep'){e.x=410+Math.sin(t*.8+i*.48)*325;e.y=e.baseY+Math.sin(t*2+i)*18;}
 if(e.pattern==='lanes'){e.x=e.baseX+Math.sin(t*2+i*.7)*40;}
 if(e.kind==='striker'&&Math.sin(t*1.2+i)> .8)e.targetY=360;
 }
  const boss=enemies.find(e=>e.boss&&e.alive);
  if(boss)window.ShooterDirector.updateBoss(boss,dt,now);
  window.ShooterDirector.updateEnemies(dt,now);
  for (const w of bossWarnings) {
    if (now >= w.fireAt && !w.fired) {
      w.fired = true;
      window.ArcadeAudio.effect("bossLaser", w.volume||.2);
      screenShake = 0.45;
    }
    if (!w.fired) {
      const count = Math.ceil((w.fireAt - now) / 1000);
      if (count !== w.lastCountdown) {
        w.lastCountdown = count;
        beep(520 + count * 100, 0.055, "triangle", 0.018);
      }
    }
  }
  bossWarnings = bossWarnings.filter((w) => now < w.endAt);
  for (const shot of playerShots) {
    if (shot.spent) continue;
    for (const e of enemies) {
      if (!e.alive || (e.boss && now < e.morphUntil)) continue;
      if (intersects({ x: shot.x, y: shot.y, w: 6, h: 20 }, e)) {
        shot.spent = true;
        e.hp -= window.ReleaseEdition.adm
          ? (e.boss ? (shot.dmg || 1) * 4 : e.hp)
          : (shot.dmg || 1);
        e.hitUntil = now + 140;
        window.GameFX.particles(
          arcadeParticles,
          shot.x,
          shot.y,
          e.boss ? "#ffba95" : "#96ffea",
          7,
        );
        if (e.hp <= 0) {
          e.alive = false;
          score += e.boss ? 1000 : 25;
          window.ArcadeAudio.effect("explosion", e.boss ? 0.4 : 0.15);
          window.GameFX.particles(
            arcadeParticles,
            e.x,
            e.y,
            e.boss ? "#c58aff" : "#9dffe0",
            e.boss ? 45 : 16,
          );
        }
        break;
      }
    }
  }
  playerShots = playerShots.filter((s) => !s.spent);
  let hit = false;
  if (!window.ReleaseEdition.adm && arcadeInvincible <= 0) {
    for (const s of enemyShots) {
      if(s.harmless)continue;
      if (intersects({ x: s.x, y: s.y, w: 7, h: 16 }, player)) {
        s.y = 999;
        hit = true;
        break;
      }
    }
    if (!hit)
      for (const w of bossWarnings) {
        const b = laserEnvelope(w, now),
          long = w.horiz ? player.x : player.y,
          cross = w.horiz ? player.y : player.x;
        if (
          b.active &&
          long >= b.tail &&
          long <= b.head &&
          Math.abs(cross - w.pos) < b.width * 0.5 + 9
        ) {
          hit = true;
          break;
        }
      }
    if (!hit)
      for (const e of enemies) {
        if (e.alive && !e.boss && intersects(e, player)) {
          e.targetY = 65;
          hit = true;
          break;
        }
      }
    if (hit) {
      lives--;
      arcadeInvincible = 1.1;
      screenShake = 1;
      alertSound();
      window.GameFX.particles(
        arcadeParticles,
        player.x,
        player.y,
        "#ffb3cf",
        20,
      );
      if (lives <= 0) {
        endArcade(false);
        return;
      }
    }
  }
  if (enemies.length && enemies.every((e) => !e.alive)) {
    bossWarnings = [];
    enemyShots = [];
    playerShots = [];
    if(level>=window.LaunchCampaign.shooter.length)endArcade(true);
    else{level++;resetArcadePosition(1700);createEnemies(level);lastEnemyFire=now;arcadeInvincible=2; if(level%3===1)lives=Math.min(gameDifficulty.lives,lives+1);}

  }
}
function drawEnemy(e, paint = ctx) {
  if(e.bossKind){window.SpaceArt.boss(paint,e,arcadeTime);return;}
  if(e.kind){window.SpaceArt.enemy(paint,e,arcadeTime);return;}
  const t = performance.now();
  paint.save();
  paint.translate(e.x, e.y);
  if (e.boss) {
    const isBoss2 = e.boss2;
    if (!isBoss2) {
      const pulse = Math.sin(t / 300) * 0.06;
      paint.save();
      paint.scale(1 + pulse, 1 - pulse * 0.5);
      paint.shadowColor = "#ff304f";
      paint.shadowBlur = 22;
      const hg = paint.createRadialGradient(0, 0, 8, 0, 10, 80);
      hg.addColorStop(0, "#ff5060");
      hg.addColorStop(0.5, "#8a0f20");
      hg.addColorStop(1, "#3a0008");
      paint.fillStyle = hg;
      paint.beginPath();
      paint.moveTo(-72, 5);
      paint.bezierCurveTo(-60, -45, -20, -42, 0, -38);
      paint.bezierCurveTo(20, -42, 60, -45, 72, 5);
      paint.bezierCurveTo(64, 38, 30, 44, 0, 42);
      paint.bezierCurveTo(-30, 44, -64, 38, -72, 5);
      paint.closePath();
      paint.fill();
      paint.strokeStyle = "rgba(255,100,80,.4)";
      paint.lineWidth = 1.5;
      for (let r = 0; r < 3; r++) {
        paint.beginPath();
        paint.ellipse(0, 0, 68 - r * 14, 36 - r * 7, 0, 0, Math.PI * 2);
        paint.stroke();
      }
      paint.shadowColor = "#ffcc00";
      paint.shadowBlur = 16;
      const eyePositions = [
        [-18, -4],
        [0, -8],
        [18, -4],
        [-10, 12],
        [10, 12],
      ];
      eyePositions.forEach(([ex, ey], i) => {
        const blink = Math.sin(t / 400 + i * 1.3) > 0.7;
        paint.fillStyle = blink ? "#ffdd00" : "#ff3300";
        paint.beginPath();
        paint.ellipse(ex, ey, 7, blink ? 3 : 7, 0, 0, Math.PI * 2);
        paint.fill();
        paint.fillStyle = "#fff";
        paint.beginPath();
        paint.arc(ex - 2, ey - 2, 2, 0, Math.PI * 2);
        paint.fill();
      });
      [
        [-58, 10],
        [58, 10],
      ].forEach(([cx, cy]) => {
        paint.shadowBlur = 0;
        paint.fillStyle = "#600010";
        paint.beginPath();
        paint.ellipse(cx, cy, 14, 8, Math.PI * 0.15, 0, Math.PI * 2);
        paint.fill();
        paint.fillStyle = "#ff4030";
        paint.shadowColor = "#ff4030";
        paint.shadowBlur = 8;
        paint.beginPath();
        paint.arc(cx, cy, 5, 0, Math.PI * 2);
        paint.fill();
      });
      paint.shadowBlur = 0;
      paint.fillStyle = "rgba(0,0,0,.55)";
      paint.fillRect(-60, -58, 120, 10);
      paint.fillStyle = "#ff3344";
      paint.fillRect(-60, -58, 120, 10);
      paint.fillStyle = "#72ffb0";
      paint.fillRect(-60, -58, (e.hp / e.maxHp) * 120, 10);
      paint.restore();
    } else {
      const wobble = Math.sin(t / 220) * 0.1;
      paint.save();
      paint.scale(1 + wobble, 1 - wobble * 0.6);
      const tentPhase = e.tentaclePhase || 0;
      paint.shadowColor = "#8840ff";
      paint.shadowBlur = 30;
      const ag = paint.createRadialGradient(-8, -5, 5, 0, 0, 70);
      ag.addColorStop(0, "#cc80ff");
      ag.addColorStop(0.4, "#6020cc");
      ag.addColorStop(1, "#1a0040");
      paint.fillStyle = ag;
      paint.beginPath();
      paint.moveTo(-55, -8);
      paint.bezierCurveTo(-62, -38, -18, -50, 12, -44);
      paint.bezierCurveTo(44, -38, 68, -18, 60, 18);
      paint.bezierCurveTo(52, 42, 18, 50, -8, 44);
      paint.bezierCurveTo(-36, 50, -62, 30, -55, -8);
      paint.closePath();
      paint.fill();
      paint.strokeStyle = "rgba(200,120,255,.35)";
      paint.lineWidth = 1.2;
      for (let v = 0; v < 4; v++) {
        const ang = (v / 4) * Math.PI * 2 + tentPhase * 0.5;
        paint.beginPath();
        paint.moveTo(0, 0);
        paint.bezierCurveTo(
          Math.cos(ang) * 20,
          Math.sin(ang) * 20,
          Math.cos(ang + 0.4) * 42,
          Math.sin(ang + 0.4) * 42,
          Math.cos(ang + 0.2) * 50,
          Math.sin(ang + 0.2) * 50,
        );
        paint.stroke();
      }
      paint.shadowBlur = 10;
      paint.shadowColor = "#aa60ff";
      const tentDefs = [
        { angle: -1.8, len: 52, thick: 6, color: "#9050d0" },
        { angle: -0.7, len: 44, thick: 5, color: "#7030b0" },
        { angle: 0.3, len: 60, thick: 7, color: "#a060e0" },
        { angle: 1.4, len: 38, thick: 4, color: "#6020a0" },
        { angle: 2.4, len: 55, thick: 6, color: "#8040c0" },
        { angle: 3.2, len: 42, thick: 5, color: "#5010a0" },
      ];
      tentDefs.forEach((td, i) => {
        const waveA = Math.sin(tentPhase * 1.4 + i) * 0.4;
        const ang = td.angle + waveA;
        const ex = Math.cos(ang) * (50 + td.len * 0.6);
        const ey = Math.sin(ang) * (50 + td.len * 0.6);
        const mid1x = Math.cos(ang + 0.4) * td.len * 0.4;
        const mid1y = Math.sin(ang + 0.3) * td.len * 0.4;
        paint.strokeStyle = td.color;
        paint.lineWidth = td.thick;
        paint.lineCap = "round";
        paint.beginPath();
        paint.moveTo(Math.cos(td.angle) * 45, Math.sin(td.angle) * 45);
        paint.bezierCurveTo(mid1x, mid1y, ex * 0.7, ey * 0.7, ex, ey);
        paint.stroke();
        paint.fillStyle = "rgba(200,100,255,.7)";
        paint.beginPath();
        paint.arc(ex, ey, td.thick * 0.9, 0, Math.PI * 2);
        paint.fill();
      });
      paint.shadowColor = "#ffffff";
      paint.shadowBlur = 20;
      paint.fillStyle = "#200040";
      paint.beginPath();
      paint.ellipse(-4, -2, 24, 20, -0.2, 0, Math.PI * 2);
      paint.fill();
      const irisShift = Math.sin(t / 600) * 6;
      const irisg = paint.createRadialGradient(
        -4 + irisShift,
        -2,
        2,
        -4 + irisShift,
        -2,
        18,
      );
      irisg.addColorStop(0, "#ff80ff");
      irisg.addColorStop(0.4, "#aa20ff");
      irisg.addColorStop(1, "#400080");
      paint.fillStyle = irisg;
      paint.beginPath();
      paint.ellipse(-4 + irisShift, -2, 16, 14, 0, 0, Math.PI * 2);
      paint.fill();
      paint.fillStyle = "#000";
      paint.beginPath();
      paint.ellipse(-4 + irisShift, -2, 6, 10, 0, 0, Math.PI * 2);
      paint.fill();
      paint.fillStyle = "rgba(255,255,255,.8)";
      paint.beginPath();
      paint.arc(-4 + irisShift - 5, -8, 4, 0, Math.PI * 2);
      paint.fill();
      paint.shadowBlur = 0;
      paint.fillStyle = "rgba(0,0,0,.55)";
      paint.fillRect(-55, -65, 120, 10);
      paint.fillStyle = "#8840ff";
      paint.fillRect(-55, -65, 120, 10);
      paint.fillStyle = "#72ffb0";
      paint.fillRect(-55, -65, (e.hp / e.maxHp) * 120, 10);
      paint.restore();
    }
  } else {
    const wobM = Math.sin(t / 280 + e.seed) * 0.08;
    paint.save();
    paint.rotate(wobM);
    const mGrad = paint.createRadialGradient(-3, -3, 2, 0, 0, 18);
    if (level >= 5) {
      mGrad.addColorStop(0, "#ee80ff");
      mGrad.addColorStop(0.6, "#8820bb");
      mGrad.addColorStop(1, "#330055");
    } else {
      mGrad.addColorStop(0, "#88ffcc");
      mGrad.addColorStop(0.6, "#208855");
      mGrad.addColorStop(1, "#003322");
    }
    paint.fillStyle = mGrad;
    paint.shadowColor = level >= 5 ? "#cc44ff" : "#44ffaa";
    paint.shadowBlur = 10;
    paint.beginPath();
    paint.moveTo(-16, -3);
    paint.bezierCurveTo(-18, -14, -4, -16, 6, -13);
    paint.bezierCurveTo(16, -10, 18, 2, 14, 10);
    paint.bezierCurveTo(10, 16, -8, 14, -14, 8);
    paint.bezierCurveTo(-20, 4, -14, 6, -16, -3);
    paint.closePath();
    paint.fill();
    paint.shadowBlur = 6;
    paint.shadowColor = level >= 5 ? "#ffaaff" : "#aaffcc";
    [
      [-6, -4],
      [5, -6],
    ].forEach(([ex, ey]) => {
      paint.fillStyle = level >= 5 ? "#ff80ff" : "#80ffcc";
      paint.beginPath();
      paint.ellipse(ex, ey, 4, 3, 0, 0, Math.PI * 2);
      paint.fill();
      paint.fillStyle = "#000";
      paint.beginPath();
      paint.arc(ex, ey, 1.5, 0, Math.PI * 2);
      paint.fill();
    });
    paint.shadowBlur = 0;
    paint.strokeStyle = level >= 5 ? "#9933cc" : "#228855";
    paint.lineWidth = 2;
    paint.lineCap = "round";
    paint.beginPath();
    paint.moveTo(8, 10);
    paint.bezierCurveTo(12, 16, 6, 20, 10, 22);
    paint.stroke();
    paint.restore();
  }
  paint.restore();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function drawArcade() {
  ctx.save();
  if (screenShake > 0) {
    const amount = screenShake * 6;
    ctx.translate(
      (Math.random() - 0.5) * amount,
      (Math.random() - 0.5) * amount,
    );
  }
  window.ArcadeUniverse.paint(
    ctx,
    arcadeCanvas.width,
    arcadeCanvas.height,
    performance.now() / 1000,
    "arcade",
  );
  starsBg.forEach((st) => {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillRect(st.x, st.y, st.s, st.s);
  });
  const now = arcadeClock;
  bossWarnings.forEach((w) => drawLaserWarning(ctx, w, now));
  enemies
    .filter((e) => e.alive)
    .forEach((e) => {
      drawEnemy(e);
      if (!e.boss && e.hp < e.maxHp) {
        ctx.fillStyle = "#0d1c34";
        ctx.fillRect(e.x - 16, e.y - 24, 32, 3);
        ctx.fillStyle = "#a2ffe8";
        ctx.fillRect(e.x - 16, e.y - 24, (32 * e.hp) / e.maxHp, 3);
      }
      if (e.hitUntil > now) {
        ctx.strokeStyle = "#e1ffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.boss ? 65 : 19, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (e.boss && e.stage === 2) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(now * 0.001);
        ctx.strokeStyle = "#ffb377";
        ctx.shadowColor = "#ff749e";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 85, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.rotate(Math.PI);
        ctx.strokeStyle = "#b78aff";
        ctx.beginPath();
        ctx.arc(0, 0, 95, 0, Math.PI * 1.4);
        ctx.stroke();
        ctx.restore();
      }
    });
  window.GameFX.draw(ctx, arcadeParticles);
  playerShots.forEach((s) => {
    if (s.exploding) {
      const alpha = Math.max(0, 1 - s.explodeR / s.explodeMaxR);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#ff6600";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#ff4400";
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.explodeR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#ffdd44";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.explodeR * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    } else if (s.homing) {
      ctx.save();
      ctx.shadowColor = "#72ffb0";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#72ffb0";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(114,255,176,0.35)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else if (s.charged) {
      const w = 4 + (s.dmg - 1) * 4;
      ctx.save();
      ctx.shadowColor =
        s.dmg >= 5 ? "#ff2200" : s.dmg >= 3.125 ? "#ff4411" : "#ff8844";
      ctx.shadowBlur = 22;
      const g = ctx.createLinearGradient(s.x, s.y - 28, s.x, s.y + 6);
      g.addColorStop(0, s.dmg >= 5 ? "#ff2200" : "#ff6633");
      g.addColorStop(1, "#ffcc88");
      ctx.fillStyle = g;
      ctx.fillRect(s.x - w / 2, s.y - 32, w, 36);
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      drawShot(s, "#7dfff0", 23);
    }
  });
  enemyShots.filter(s=>!s.beam).forEach(s=>window.ShooterDirector.drawShot(ctx,s));
  window.ShooterDirector.drawTelegraphs(ctx,now);
  if (upgrade === "charged" && isCharging) {
    const held = Math.min((now - chargeStart) / 1000, 10);
    const phase = Math.min(Math.ceil(held), 5);
    const colors = ["#ff9944", "#ff7722", "#ff4411", "#ff2200", "#ff0000"];
    const col = colors[Math.max(phase, 1) - 1];
    const pulse = 0.6 + Math.sin(now / 80) * 0.4;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = col;
    ctx.shadowBlur = 20 + Math.min(held, 5) * 4;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18 + Math.min(held, 5) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.fillStyle = col;
    ctx.font = `bold ${12 + phase}px Inter, Arial`;
    ctx.textAlign = "center";
    ctx.fillText(`⚡${phase}`, player.x, player.y - 28);
    ctx.textAlign = "start";
  }
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.4 * Math.sin(now * 0.035);
  ctx.fillStyle = "#89efff";
  ctx.shadowColor = "#68c9ff";
  ctx.shadowBlur = 17;
  ctx.beginPath();
  ctx.moveTo(player.x - 5, player.y + 14);
  ctx.lineTo(player.x, player.y + 32 + Math.sin(now * 0.04) * 5);
  ctx.lineTo(player.x + 5, player.y + 14);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha =
    arcadeInvincible > 0 ? 0.45 + 0.45 * Math.abs(Math.sin(now * 0.02)) : 1;
  drawPlayer();
  ctx.globalAlpha = 1;
  if (bossNotice && now < bossNoticeUntil) {
    ctx.save();
    ctx.fillStyle = "#101b39d9";
    ctx.fillRect(120, 48, 580, 38);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e4b1ff";
    ctx.font = 'bold 22px "Barlow Condensed",sans-serif';
    ctx.fillText(bossNotice, 410, 74);
    ctx.restore();
  }
  if(window.ReleaseEdition.adm){ctx.fillStyle='#c3afff';ctx.font='bold 16px monospace';ctx.fillText('∞ ADM',24,28);}else for(let i=0;i<lives;i++)drawHeart(25+i*25,14,15);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 28px Inter, Arial";
  ctx.fillText(String(score), arcadeCanvas.width - 92, 30);
  ctx.font = "bold 18px Inter, Arial";
  ctx.fillText(`Fase ${level+" / 15"}`, arcadeCanvas.width / 2 - 30, 30);
  const healthBoss=enemies.find(e=>e.boss&&e.alive);
  if(healthBoss){ctx.fillStyle='#141025dd';ctx.fillRect(245,37,330,6);ctx.fillStyle=healthBoss.stage===2?'#ff9fdf':window.ShooterDirector.bosses[healthBoss.bossKind-1].color;ctx.fillRect(245,37,330*Math.max(0,healthBoss.hp/healthBoss.maxHp),6);}
  if (bossEntering) {
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.font = "bold 34px Inter, Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      level === 15 ? "BOSS FINAL · ECLIPSE" : "ALERTA: BOSS CHEGANDO",
      arcadeCanvas.width / 2,
      70,
    );
    ctx.textAlign = "start";
  }
  ctx.restore();
  if (victoryActive) {
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(0, 0, arcadeCanvas.width, arcadeCanvas.height);
    const t2 = performance.now() / 500;
    ctx.save();
    ctx.translate(arcadeCanvas.width / 2, arcadeCanvas.height / 2 - 30);
    ctx.scale(1 + Math.sin(t2) * 0.04, 1 + Math.sin(t2) * 0.04);
    ctx.fillStyle = "#ffdd44";
    ctx.shadowColor = "#ffdd44";
    ctx.shadowBlur = 30;
    ctx.font = "bold 52px Inter, Arial";
    ctx.textAlign = "center";
    ctx.fillText("✦ BOSS DESTRUÍDO! ✦", 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px Inter, Arial";
    ctx.fillText("Prepare-se... o Boss Final chega!", 0, 54);
    ctx.textAlign = "start";
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + t2,
        r = 80 + Math.sin(t2 * 2 + i) * 20;
      ctx.fillStyle = ["#ffdd44", "#ff6aaa", "#6fe7ff", "#72ffb0"][i % 4];
      ctx.beginPath();
      ctx.arc(
        arcadeCanvas.width / 2 + Math.cos(angle) * r,
        arcadeCanvas.height / 2 - 30 + Math.sin(angle) * r,
        6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  if (!gameOver && !victoryActive && now < waveReadyUntil) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#102745e8";
    ctx.fillRect(255, 345, 310, 45);
    ctx.fillStyle = "#afffeb";
    ctx.font = 'bold 24px \"Barlow Condensed\",sans-serif';
    ctx.fillText("FASE " + level + " · PREPARE-SE", 410, 375);
    ctx.restore();
  }
  if (gameOver)
    window.GameFX.endCard(ctx, 820, 520, arcadeWon, "PONTUAÇÃO " + score);
}

let pilotHazards=[],pilotHazardNext=8;
let pilotMission=0,pilotMissionStart=0,pilotCrystals=0,pilotPortals=0,pilotWon=false;
function resetPilotGame() {
 window.ClassicPause?.reset();
 pilotHazards=[];pilotHazardNext=8;pilotMission=0;pilotMissionStart=0;pilotCrystals=0;pilotPortals=0;pilotWon=false;
  pilotElapsed = 0;
  pilotGems = [];
  pilotGates = [];
  pilotShield = 0;
  pilotFX = [];
  pilotNextGem = 4;
  pilotNextEvent = 10;
  pilotEvent = null;
  pilotEventIndex = 0;
  pilotEndAt = 0;
  pilotCombo = 0;
  pilotMessage = "";
  window.GameFX.hideRestart("pilotModal");
  pilotScore = 0;
  pilotLives = gameDifficulty.lives;
  pilotWaveMilestone = 0;
  pilotGameOver = false;
  pilotLastFrame = 0;
  pilotShipX = pilotCanvas.width / 2;
  pilotShipY = pilotCanvas.height - 80;
  pilotMouseX = pilotCanvas.width / 2;
  pilotMouseY = pilotCanvas.height - 80;
  window.TouchArcade?.reset("pilot", pilotMouseX, pilotMouseY);
  pilotAsteroids = [];
  pilotParticles = [];
  pilotInvincible = 0;
  pilotStars = Array.from({ length: 120 }, () => ({
    x: Math.random() * pilotCanvas.width,
    y: Math.random() * pilotCanvas.height,
    s: Math.random() * 2.2 + 0.3,
    v: Math.random() * 80 + 40,
    opacity: Math.random() * 0.6 + 0.4,
    twinkle: Math.random() * Math.PI * 2,
  }));
}
function spawnPilotAsteroid(score, forcedType) {
  const difficulty = Math.min(1 + score / 600, 5);
  const type = Number.isInteger(forcedType)
    ? forcedType
    : (pilotMission===1?2:pilotMission===2?3:Math.floor(Math.random()*4));
  const isMeteor = type === 1;
  const r = isMeteor ? 10 + Math.random() * 14 : 16 + Math.random() * 32;
  const numPts = 7 + Math.floor(Math.random() * 5);
  const pts = Array.from({ length: numPts }, (_, i) => {
    const angle = (i / numPts) * Math.PI * 2;
    const jag = isMeteor
      ? 0.85 + Math.random() * 0.15
      : 0.55 + Math.random() * 0.45;
    return { a: angle, d: r * jag };
  });
  const colors = [
    ["#8a7f72", "#6b6259", "#a09488"],
    ["#ff6030", "#ff9050", "#ffcc70"],
    ["#a0c8ff", "#70a8f0", "#d0e8ff"],
    ["#7a6a5a", "#5a4a3a", "#9a8a7a"],
  ];
  const col = colors[type];
  const spawnX = 40 + Math.random() * (pilotCanvas.width - 80);
  const angle = isMeteor ? Math.PI * 0.3 + Math.random() * Math.PI * 0.4 : 0;
  const speed =
    (140 + Math.random() * 100) *
    (1 + difficulty * 0.18) *
    gameDifficulty.pilotSpeed;
  return {
    x: spawnX,
    y: -r - 10,
    r,
    type,
    pts,
    col,
    vx: isMeteor
      ? Math.cos(angle - Math.PI / 2) * speed * 0.6
      : (Math.random() - 0.5) * 60 * difficulty,
    vy: isMeteor ? Math.sin(angle - Math.PI / 2) * speed + speed * 0.5 : speed,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * (isMeteor ? 6 : 1.5),
    trailPts: isMeteor ? [] : null,
    cracks:
      type === 3
        ? Array.from({ length: 3 }, () => ({
            a: Math.random() * Math.PI * 2,
            len: 0.5 + Math.random() * 0.4,
          }))
        : null,
    glowColor:
      type === 2
        ? "rgba(160,200,255,0.5)"
        : type === 1
          ? "rgba(255,120,40,0.45)"
          : null,
    hit: false,
  };
}
let pilotElapsed = 0,
  pilotGems = [],
  pilotGates = [],
  pilotShield = 0,
  pilotFX = [],
  pilotNextGem = 4,
  pilotNextEvent = 10,
  pilotEvent = null,
  pilotEventIndex = 0,
  pilotEndAt = 0,
  pilotMessage = "",
  pilotMessageUntil = 0,
  pilotCombo = 0,
  pilotComboUntil = 0;
function endPilot() {
  if (pilotGameOver) return;
  pilotGameOver = true;
  pilotEndAt = performance.now();
  window.GameFX.terminal("pilotModal", pilotWon);
}
function pilotDamage() {
 if(window.ReleaseEdition.adm)return;
  if (pilotInvincible > 0 || pilotGameOver) return;
  pilotCombo = 0;
  if (pilotShield > 0) {
    pilotShield = 0;
    pilotInvincible = 0.8;
    pilotMessage = "ESCUDO ABSORVEU O IMPACTO";
    pilotMessageUntil = pilotElapsed + 1.4;
    window.GameFX.particles(pilotFX, pilotShipX, pilotShipY, "#8effed", 24);
    beep(250, 0.2, "triangle", 0.03);
    return;
  }
  pilotLives--;
  pilotInvincible = gameDifficulty.invincible;
  alertSound();
  window.GameFX.particles(pilotFX, pilotShipX, pilotShipY, "#ff9da9", 25);
  if (pilotLives <= 0) endPilot();
}
function updatePilot(dt) {
  const touch = window.TouchArcade?.read("pilot");
  if (window.TouchArcade?.enabled && touch) {
    pilotMouseX = touch.x;
    pilotMouseY = touch.y;
  }
  pilotFX = window.GameFX.update(pilotFX, dt);
  if (pilotGameOver) return;
  pilotElapsed += dt;
  pilotInvincible = Math.max(0, pilotInvincible - dt);
  pilotShield = Math.max(0, pilotShield - dt);
  if (pilotElapsed > pilotComboUntil) pilotCombo = 0;
  if (keys.ArrowLeft || keys.a || keys.A) pilotMouseX -= 360 * dt;
  if (keys.ArrowRight || keys.d || keys.D) pilotMouseX += 360 * dt;
  if (keys.ArrowUp || keys.w || keys.W) pilotMouseY -= 360 * dt;
  if (keys.ArrowDown || keys.s || keys.S) pilotMouseY += 360 * dt;
  pilotMouseX = Math.max(24, Math.min(796, pilotMouseX));
  pilotMouseY = Math.max(40, Math.min(496, pilotMouseY));
  pilotShipX += (pilotMouseX - pilotShipX) * Math.min(1, 12 * dt);
  pilotShipY += (pilotMouseY - pilotShipY) * Math.min(1, 12 * dt);
  pilotStars.forEach((s) => {
    s.y = (s.y + s.v * dt) % 520;
    s.twinkle += dt * 2;
  });
  if (pilotElapsed >= pilotNextGem) {
    pilotNextGem = pilotElapsed + 2.2 + Math.random() * 1.5;
    pilotGems.push({
      x: 50 + Math.random() * 720,
      y: -25,
      vy: 120,
      type: Math.random() < 0.18 ? "shield" : "crystal",
      spin: Math.random() * 6,
    });
  }
  if (pilotElapsed >= pilotNextEvent) {
    const kind = pilotEventIndex++ % 2 === 0 ? "gate" : "meteor";
    pilotEvent = {
      kind,
      at: pilotElapsed,
      emitted: false,
      next: pilotElapsed + 1.8,
    };
    pilotNextEvent = pilotElapsed + 9;
    pilotMessage =
      kind === "gate"
        ? "PORTAL À FRENTE · ATRAVESSE O CENTRO"
        : "ALERTA · CHUVA DE METEOROS";
    pilotMessageUntil = pilotElapsed + 2.5;
    beep(480, 0.18, "triangle", 0.04);
  }
  if (pilotEvent) {
    const e = pilotEvent;
    if (e.kind === "gate" && !e.emitted && pilotElapsed - e.at > 1.8) {
      e.emitted = true;
      pilotGates.push({
        x: Math.max(
          170,
          Math.min(650, pilotShipX + (Math.random() - 0.5) * 200),
        ),
        y: -50,
        lastY: -50,
        width:
          gameDifficulty.key === "easy"
            ? 290
            : gameDifficulty.key === "hard"
              ? 195
              : 245,
        passed: false,
      });
    }
    if (
      e.kind === "meteor" &&
      pilotElapsed - e.at > 1.8 &&
      pilotElapsed - e.at < 6.5 &&
      pilotElapsed >= e.next
    ) {
      e.next = pilotElapsed + 0.65;
      pilotAsteroids.push(spawnPilotAsteroid(pilotScore, 1));
    }
    if (pilotElapsed - e.at > 7) pilotEvent = null;
  }
  const chance = 0.025 + Math.min(pilotScore / 2400, 0.055);
  if (
    Math.random() <
    1 - Math.pow(1 - chance, dt * 60 * gameDifficulty.pilotSpawn)
  )
    pilotAsteroids.push(spawnPilotAsteroid(pilotScore));
  for (const a of pilotAsteroids) {
    if(a.type===3)a.vx+=Math.sin(pilotElapsed*1.4+a.r)*dt*22;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.rot += a.rotV * dt;
    if (a.trailPts) {
      a.trailPts.unshift({ x: a.x, y: a.y });
      a.trailPts.length = Math.min(14, a.trailPts.length);
    }
    if (a.hit) continue;
    const dx = a.x - pilotShipX,
      dy = a.y - pilotShipY,
      hitR = a.r * 0.65 + 12;
    if (!window.ReleaseEdition.adm && Math.hypot(dx, dy) < hitR) {
      a.hit = true;
      pilotDamage();
    } else if (
      !a.nearMiss &&
      a.y > pilotShipY + a.r &&
      a.y < pilotShipY + a.r + 32 &&
      Math.abs(dx) > hitR &&
      Math.abs(dx) < hitR + 35
    ) {
      a.nearMiss = true;
      pilotCombo = Math.min(5, pilotCombo + 1);
      pilotComboUntil = pilotElapsed + 3;
      pilotScore += 3 * pilotCombo;
      pilotMessage =
        "RASANTE! +" + 3 * pilotCombo + " KM · COMBO ×" + pilotCombo;
      pilotMessageUntil = pilotElapsed + 1.1;
      beep(880 + pilotCombo * 80, 0.065, "sine", 0.02);
    }
  }
  pilotAsteroids = pilotAsteroids.filter(
    (a) => a.y < 610 && a.x > -100 && a.x < 920 && !a.hit,
  );
  for (const gem of pilotGems) {
    gem.y += gem.vy * dt;
    gem.spin += dt * 2;
    if (Math.hypot(gem.x - pilotShipX, gem.y - pilotShipY) < 28) {
      gem.taken = true;
      if (gem.type === "shield") {
        pilotShield = 8;
        pilotMessage = "ESCUDO ATIVO · 8 SEGUNDOS";
      } else {
        pilotScore += 15;pilotCrystals++;
        pilotMessage = "CRISTAL RECUPERADO · +15 KM";
      }
      pilotMessageUntil = pilotElapsed + 1.2;
      window.GameFX.particles(pilotFX, gem.x, gem.y, "#9cffe5", 16);
      beep(1100, 0.12, "triangle", 0.04);
    }
  }
  pilotGems = pilotGems.filter((g) => g.y < 550 && !g.taken);
  for (const gate of pilotGates) {
    gate.lastY = gate.y;
    gate.y += 185 * gameDifficulty.pilotSpeed * dt;
    if (!gate.passed && gate.lastY <= pilotShipY && gate.y > pilotShipY) {
      gate.passed = true;
      if (Math.abs(pilotShipX - gate.x) < gate.width / 2 - 15) {
        pilotScore += 35;pilotPortals++;
        pilotMessage = "DOBRA PERFEITA · +35 KM";
        pilotMessageUntil = pilotElapsed + 1.4;
        window.GameFX.particles(pilotFX, pilotShipX, pilotShipY, "#bb9aff", 28);
        beep(1400, 0.18, "triangle", 0.04);
      } else pilotDamage();
    }
  }
  pilotGates = pilotGates.filter((g) => g.y < 580);
  if(!pilotGameOver)pilotScore+=dt*10;
 if(pilotMission>=3&&pilotElapsed>=pilotHazardNext){pilotHazardNext=pilotElapsed+10;pilotHazards.push({x:90+Math.random()*640,start:pilotElapsed,fireAt:pilotElapsed+2,end:pilotElapsed+3.2});}
 for(const h of pilotHazards)if(pilotElapsed>=h.fireAt&&pilotElapsed<h.end&&Math.abs(pilotShipX-h.x)<40)pilotDamage();pilotHazards=pilotHazards.filter(h=>h.end>pilotElapsed);
 const mission=window.LaunchCampaign.pilot[pilotMission],age=pilotElapsed-pilotMissionStart;
 if(mission&&age>=mission.seconds&&pilotCrystals>=mission.crystals&&pilotPortals>=mission.portals){
 pilotScore+=150;pilotMission++;pilotMissionStart=pilotElapsed;pilotCrystals=0;pilotPortals=0;pilotAsteroids=[];pilotGates=[];pilotHazards=[];pilotLives=Math.min(gameDifficulty.lives,pilotLives+1);pilotInvincible=2;
 if(pilotMission>=window.LaunchCampaign.pilot.length){pilotWon=true;endPilot();}else{pilotMessage='SETOR CONCLUÍDO · '+window.LaunchCampaign.pilot[pilotMission].name;pilotMessageUntil=pilotElapsed+3;}}

}
function drawPilotExtras() {
 for(const h of pilotHazards){pctx.save();const live=pilotElapsed>=h.fireAt;pctx.fillStyle=live?'#c693ff88':'#b899ff11';pctx.fillRect(h.x-35,88,70,432);pctx.strokeStyle='#d5b4ff';pctx.lineWidth=live?5:1;pctx.setLineDash(live?[]:[5,8]);pctx.beginPath();pctx.moveTo(h.x,90);pctx.lineTo(h.x,520);pctx.stroke();if(!live){pctx.fillStyle='#f0c7ff';pctx.textAlign='center';pctx.font='bold 15px monospace';pctx.fillText('! '+(h.fireAt-pilotElapsed).toFixed(1),h.x,115);}pctx.restore();}

 const m=window.LaunchCampaign.pilot[pilotMission];if(m&&!pilotGameOver){pctx.save();pctx.fillStyle="#17132be8";pctx.fillRect(140,45,540,42);pctx.textAlign="center";pctx.fillStyle="#d8c5ff";pctx.font="bold 14px monospace";pctx.fillText((pilotMission+1)+"/6 · "+m.name,410,62);pctx.font="12px monospace";pctx.fillStyle="#b9eaff";pctx.fillText("CRISTAIS "+pilotCrystals+"/"+m.crystals+" · PORTAIS "+pilotPortals+"/"+m.portals+" · TEMPO "+Math.min(m.seconds,Math.floor(pilotElapsed-pilotMissionStart))+"/"+m.seconds+"s",410,79);pctx.restore();}
  pctx.save();
  for (const g of pilotGems) {
    pctx.save();
    pctx.translate(g.x, g.y);
    pctx.rotate(g.spin);
    pctx.strokeStyle = g.type === "shield" ? "#8cfff0" : "#dcb3ff";
    pctx.fillStyle = g.type === "shield" ? "#5bf7e855" : "#be8aff66";
    pctx.shadowColor = pctx.strokeStyle;
    pctx.shadowBlur = 14;
    pctx.lineWidth = 2;
    pctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      i ? pctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12) : pctx.moveTo(12, 0);
    }
    pctx.closePath();
    pctx.fill();
    pctx.stroke();
    pctx.rotate(-g.spin);
    pctx.fillStyle = "#ecffff";
    pctx.font = "bold 12px monospace";
    pctx.textAlign = "center";
    pctx.fillText(g.type === "shield" ? "S" : "✦", 0, 4);
    pctx.restore();
  }
  for (const gate of pilotGates) {
    const l = gate.x - gate.width / 2,
      r = gate.x + gate.width / 2;
    pctx.strokeStyle = "#c48bff";
    pctx.shadowColor = "#aa77ff";
    pctx.shadowBlur = 12;
    pctx.lineWidth = 7;
    pctx.beginPath();
    pctx.moveTo(0, gate.y);
    pctx.lineTo(l, gate.y);
    pctx.moveTo(r, gate.y);
    pctx.lineTo(820, gate.y);
    pctx.stroke();
    pctx.strokeStyle = "#a4ffea";
    pctx.lineWidth = 3;
    pctx.beginPath();
    pctx.arc(l, gate.y, 19, -Math.PI / 2, Math.PI / 2);
    pctx.moveTo(r, gate.y - 19);
    pctx.arc(r, gate.y, 19, Math.PI / 2, Math.PI * 1.5);
    pctx.stroke();
    pctx.fillStyle = "#b7ffeb";
    pctx.textAlign = "center";
    pctx.font = "12px monospace";
    pctx.fillText("PORTAL +35 KM", gate.x, gate.y - 18);
  }
  pctx.shadowBlur = 0;
  if (pilotShield > 0) {
    pctx.strokeStyle = "#9effed";
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.arc(
      pilotShipX,
      pilotShipY,
      30 + Math.sin(pilotElapsed * 4) * 2,
      0,
      Math.PI * 2,
    );
    pctx.stroke();
    pctx.fillStyle = "#aaffdf";
    pctx.textAlign = "left";
    pctx.font = "12px monospace";
    pctx.fillText("ESCUDO " + Math.ceil(pilotShield) + "s", 20, 498);
  }
  if (pilotMessage && pilotElapsed < pilotMessageUntil) {
    pctx.fillStyle = "#102a4ae6";
    pctx.beginPath();
    pctx.roundRect(110, 88, 600, 34, 8);
    pctx.fill();
    pctx.fillStyle = "#c7ffed";
    pctx.textAlign = "center";
    pctx.font = 'bold 17px "Barlow Condensed",sans-serif';
    pctx.fillText(pilotMessage, 410, 111);
  }
  pctx.restore();
  window.GameFX.draw(pctx, pilotFX);
}
function drawAsteroid(ctx, a) {
 if(a.type>=2){window.SpaceArt.obstacle(ctx,a,pilotElapsed);return;}
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  if (a.trailPts && a.trailPts.length > 1) {
    ctx.restore();
    ctx.save();
    for (let i = 0; i < a.trailPts.length - 1; i++) {
      const alpha = (1 - i / a.trailPts.length) * 0.55;
      const w = a.r * 0.6 * (1 - i / a.trailPts.length);
      ctx.strokeStyle = `rgba(255,${140 - i * 8},${40 - i * 2},${alpha})`;
      ctx.lineWidth = Math.max(w, 1);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.trailPts[i].x, a.trailPts[i].y);
      ctx.lineTo(a.trailPts[i + 1].x, a.trailPts[i + 1].y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
  }
  if (a.glowColor) {
    ctx.shadowColor = a.glowColor;
    ctx.shadowBlur = 18;
  }
  ctx.beginPath();
  a.pts.forEach((p, i) => {
    const px = Math.cos(p.a) * p.d,
      py = Math.sin(p.a) * p.d;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  const grad = ctx.createRadialGradient(
    -a.r * 0.25,
    -a.r * 0.25,
    a.r * 0.05,
    0,
    0,
    a.r,
  );
  grad.addColorStop(0, a.col[2]);
  grad.addColorStop(0.5, a.col[0]);
  grad.addColorStop(1, a.col[1]);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = a.type === 2 ? "rgba(180,220,255,0.6)" : "rgba(0,0,0,0.35)";
  ctx.lineWidth = a.type === 2 ? 1.5 : 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
  if (a.type === 2) {
    ctx.strokeStyle = "rgba(200,230,255,0.3)";
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      const p1 = a.pts[(i * 2) % a.pts.length],
        p2 = a.pts[(i * 2 + 3) % a.pts.length];
      ctx.beginPath();
      ctx.moveTo(Math.cos(p1.a) * p1.d * 0.3, Math.sin(p1.a) * p1.d * 0.3);
      ctx.lineTo(Math.cos(p2.a) * p2.d * 0.7, Math.sin(p2.a) * p2.d * 0.7);
      ctx.stroke();
    }
  }
  if (a.cracks) {
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1.2;
    a.cracks.forEach((c) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(c.a) * a.r * c.len, Math.sin(c.a) * a.r * c.len);
      ctx.stroke();
    });
  }
  ctx.restore();
}
function drawPilotShip(g,x,y,invincible){g.save();g.globalAlpha=invincible>0?.6:1;window.SpaceArt.ship(g,x,y,1,pilotElapsed,(pilotMouseX-pilotShipX)*.003);g.restore();}
function drawPilot() {
  const W = pilotCanvas.width,
    H = pilotCanvas.height;
  window.ArcadeUniverse.paint(pctx, W, H, performance.now() / 1000, "pilot");
  pilotStars.forEach((st) => {
    const tw = 0.5 + 0.5 * Math.sin(st.twinkle);
    pctx.globalAlpha = st.opacity * tw;
    pctx.fillStyle = st.s > 1.8 ? "#c8e8ff" : "#ffffff";
    if (st.s > 1.5) {
      pctx.beginPath();
      pctx.arc(st.x, st.y, st.s * 0.6, 0, Math.PI * 2);
      pctx.fill();
    } else {
      pctx.fillRect(st.x, st.y, st.s, st.s);
    }
  });
  pctx.globalAlpha = 1;
  pilotAsteroids.forEach((a) => drawAsteroid(pctx, a));
  pilotParticles.forEach((p) => {
    const t = p.life / p.maxLife;
    pctx.globalAlpha = t;
    pctx.fillStyle = p.col;
    pctx.beginPath();
    pctx.arc(p.x, p.y, 3 * t + 1, 0, Math.PI * 2);
    pctx.fill();
  });
  pctx.globalAlpha = 1;
  if (!pilotGameOver || pilotLives > 0) {
    drawPilotShip(pctx, pilotShipX, pilotShipY, pilotInvincible);
  }
  for (let i = 0; i < gameDifficulty.lives; i++) {
    const filled = i < pilotLives;
    pctx.font = "20px serif";
    pctx.globalAlpha = filled ? 1 : 0.2;
    pctx.fillStyle = "#ff697f";
    pctx.shadowColor = "#ff697f";
    pctx.shadowBlur = filled ? 10 : 0;
    pctx.fillText("❤", 18 + i * 30, 36);
  }
  pctx.shadowBlur = 0;
  pctx.globalAlpha = 1;
  pctx.fillStyle = "rgba(0,0,0,0.4)";
  pctx.beginPath();
  pctx.roundRect(W - 220, 10, 210, 38, 10);
  pctx.fill();
  pctx.fillStyle = "#6fe7ff";
  pctx.font = "bold 20px Inter, Arial";
  pctx.textAlign = "right";
  pctx.fillText(`⬆ ${Math.floor(pilotScore)} km`, W - 16, 34);
  pctx.textAlign = "start";
  if (pilotInvincible > 0 && Math.floor(pilotInvincible * 8) % 2 === 0) {
    pctx.strokeStyle = "rgba(111,231,255,0.5)";
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.arc(pilotShipX, pilotShipY, 28, 0, Math.PI * 2);
    pctx.stroke();
  }
  drawPilotExtras();
  if (pilotGameOver)
    window.GameFX.endCard(
      pctx,
      820,
      520,
      pilotWon,
      Math.floor(pilotScore) + " KM PERCORRIDOS",
    );
}

function pilotLoop(ts) {
  if (!pilotRunning) return;
  const now = ts || performance.now();
  const dt = Math.min((now - (pilotLastFrame || now)) / 1000, 0.03);
  pilotLastFrame = now;
  if(!window.ClassicPause.active)updatePilot(dt);
  drawPilot();
  pilotAnimationId = requestAnimationFrame(pilotLoop);
}
function openPilotModal() {
  pilotModal.style.display = "flex";
  pilotRunning = true;
  resetPilotGame();
  if (pilotAnimationId) cancelAnimationFrame(pilotAnimationId);
  pilotAnimationId = requestAnimationFrame(pilotLoop);
}
function closePilotGame() {
  pilotRunning = false;
  pilotModal.style.display = "none";
  if (pilotAnimationId) cancelAnimationFrame(pilotAnimationId);
  pilotAnimationId = null;
}
function arcadeLoop(ts) {
  if (!arcadeRunning) return;
  const now = ts || performance.now();
  const dt = Math.min((now - (lastFrame || now)) / 1000, 0.03);
  lastFrame = now;
  if(!window.ClassicPause.active)arcadeClock += dt * 1000;
  if(!window.ClassicPause.active)updateArcade(dt, arcadeClock);
  drawArcade();
  animationId = requestAnimationFrame(arcadeLoop);
}
function openArcadeModal() {
  arcadeModal.style.display = "flex";
  arcadeRunning = true;
  resetArcadeGame();
  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(arcadeLoop);
}
function closeArcadeGame() {
  arcadeRunning = false;
  arcadeModal.style.display = "none";
  if (animationId) cancelAnimationFrame(animationId);
  animationId = null;
}
closeArcadeModal.addEventListener("click", closeArcadeGame);
arcadeModal.addEventListener("click", (e) => {
  if (e.target === arcadeModal) closeArcadeGame();
});
closePilotModal.addEventListener("click", closePilotGame);
pilotModal.addEventListener("click", (e) => {
  if (e.target === pilotModal) closePilotGame();
});
pilotCanvas.addEventListener("pointermove", (e) => {
  if (!pilotRunning || e.pointerType !== "mouse") return;
  const r = pilotCanvas.getBoundingClientRect();
  pilotMouseX = ((e.clientX - r.left) * 820) / r.width;
  pilotMouseY = ((e.clientY - r.top) * 520) / r.height;
});
window.addEventListener("keydown", (e) => {
  if (e.key in keys) {
    keys[e.key] = true;
    if (arcadeRunning) e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key in keys) {
    keys[e.key] = false;
    if (arcadeRunning) e.preventDefault();
  }
});
function fireHomingShots() {
  const minions = enemies.filter((e) => e.alive && !e.boss);
  const boss = enemies.find((e) => e.alive && e.boss);
  const tgt = minions.length
    ? minions[Math.floor(Math.random() * minions.length)]
    : boss;
  if (!tgt) return;
  playerShots.push({
    x: player.x,
    y: player.y - 14,
    homing: true,
    target: tgt,
    dmg: 0.2,
    w: 12,
    h: 12,
  });
  window.ArcadeAudio?.effect("laser", 0.2);
}
arcadeCanvas.addEventListener("click", () => {
  if (!window.TouchArcade?.enabled) shootArcade();
});

window.games = {
  open(i, difficulty = "normal") {
    gameDifficulty = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
    if (i === 4) window.SeleneGame.open(gameDifficulty);
    else if (i === 3) window.DriftGame.open(gameDifficulty);
    else if (i === 2) window.PrismGame.open(gameDifficulty);
    else i === 0 ? openArcadeModal() : openPilotModal();
  },
  getDifficulty() {
    return { ...gameDifficulty };
  },
  profiles: DIFFICULTIES,
  close() {
    closeArcadeGame();
    closePilotGame();
    window.PrismGame?.close();
    window.DriftGame?.close();
    window.SeleneGame?.close();
    window.TouchArcade?.releaseAll();
    Object.keys(keys).forEach((k) => (keys[k] = false));
  },
  active() {
    return (
      arcadeRunning ||
      pilotRunning ||
      !!window.PrismGame?.active ||
      !!window.DriftGame?.active ||
      !!window.SeleneGame?.active
    );
  },
  restart() {
    if (arcadeRunning && gameOver && performance.now() - arcadeEndAt > 350) {
      window.ArcadeAudio.stopEffects();
      resetArcadeGame();
      window.ArcadeAudio.music("arcade");
      return true;
    }
    if (pilotRunning && pilotGameOver && performance.now() - pilotEndAt > 350) {
      window.ArcadeAudio.stopEffects();
      resetPilotGame();
      window.ArcadeAudio.music("pilot");
      return true;
    }
    return (
      window.PrismGame?.restart() ||
      window.DriftGame?.restart() ||
      window.SeleneGame?.restart() ||
      false
    );
  },
};
window.addEventListener("blur", () =>
  Object.keys(keys).forEach((k) => (keys[k] = false)),
);

function drawLaserWarning(g, w, now) {
  const pending = now < w.fireAt;
  g.save();
  const length = w.horiz ? 820 : 520;
  g.translate(w.horiz ? 0 : w.pos, w.horiz ? w.pos : 0);
  if (!w.horiz) g.rotate(Math.PI / 2);
  if (pending) {
    const progress = 1 - (w.fireAt - now) / (w.fireAt - w.start);
    g.strokeStyle = `rgba(255,189,128,${0.35 + progress * 0.5})`;
    g.lineWidth = 1;
    g.setLineDash([5, 7]);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(length, 0);
    g.stroke();
    g.setLineDash([]);
    g.restore();
    g.save();
    const x = w.horiz ? 68 : w.pos,
      y = w.horiz ? Math.max(42, w.pos - 23) : 76;
    g.fillStyle = "#38243deb";
    g.strokeStyle = w.color||"#ffc18d";
    g.beginPath();
    g.roundRect(x - 41, y - 16, 82, 31, 6);
    g.fill();
    g.stroke();
    g.fillStyle = "#ffe0b0";
    g.textAlign = "center";
    g.font = "bold 15px monospace";
    g.fillText(
      "! " + Math.max(0, (w.fireAt - now) / 1000).toFixed(1),
      x,
      y + 5,
    );
  } else {
    const b = laserEnvelope(w, now);
    if (b.active && b.head > b.tail) {
      g.globalAlpha = b.alpha;
      g.shadowColor = w.color||"#ff7fd5";
      g.shadowBlur = 28;
      g.strokeStyle = (w.color||"#bf56ff")+"66";
      g.lineWidth = b.width + 17;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(b.tail, 0);
      g.lineTo(b.head, 0);
      g.stroke();
      g.strokeStyle = w.color||"#ff84d9";
      g.lineWidth = b.width;
      g.stroke();
      g.shadowBlur = 8;
      g.strokeStyle = "#fff4ff";
      g.lineWidth = Math.max(1, b.width * 0.22);
      g.stroke();
      g.globalAlpha = b.alpha * 0.6;
      g.strokeStyle = "#d8c2ff";
      g.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        for (let x = b.tail; x < b.head; x += 12) {
          const y = Math.sin(x * 0.08 + now * 0.026 + i) * b.width * 0.4;
          x === b.tail ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
    }
  }
  g.restore();
}
function shootArcade() {
  if (!arcadeRunning || gameOver || victoryActive || window.ClassicPause.active) return;
  if (arcadeClock - shotCooldown < 100) return;
  shotCooldown = arcadeClock;
  playerShots.push({ x: player.x, y: player.y - 18, w: 6, h: 20, dmg: 1 });
  window.ArcadeAudio.effect("laser", 0.25);
  window.GameFX.particles(
    arcadeParticles,
    player.x,
    player.y - 19,
    "#a6fff6",
    3,
  );
}
