/* PRISMA REACTOR — a twelve-chamber neon ricochet game. */
(function () {
  "use strict";
  const modal = document.getElementById("prismModal"),
    canvas = document.getElementById("prismCanvas"),
    g = canvas.getContext("2d");
  let active = false,
    frame = null,
    last = 0,
    t = 0,
    profile = null,
    state = null,
    targetX = 410;
  const colors = ["#9affee", "#b99aff", "#ffb399", "#92bdff", "#f1a0df"];
  const chamberNames=['DESPERTAR','CONSTELAÇÃO','ÓRBITAS','PULSO DUPLO','LABIRINTO DE LUZ','FENDA DIMENSIONAL','CASCOS DE TITÂNIO','ROTAÇÃO','SUPERNOVA','ECO BINÁRIO','NÚCLEO INSTÁVEL','CORAÇÃO DO REATOR'];
 function levelBoard(){state.paddle.x=410;targetX=410;window.TouchArcade?.reset('prism',410,465);state.bricks=[];const L=state.level,rows=L>8?6:5;
 for(let row=0;row<rows;row++)for(let col=0;col<10;col++){
 if(L%4===2&&Math.abs(col-4.5)+row>7)continue;
 if(L%4===3&&(row+col)%4===0)continue;
 if(L%4===0&&row%2===0&&col%3===0)continue;
 const hp=1+(L>=4&&(row+col)%3===0?1:0)+(L>=9&&row%2===0?1:0),x=82+col*66,y=76+row*30;
 state.bricks.push({x,y,baseX:x,baseY:y,w:59,h:22,hp,max:hp,color:colors[row%colors.length],flash:0,volatile:L>=5&&(row+col*2)%11===0});}
 state.balls=[];state.waiting=true;state.nextLevel=0;state.combo=0;state.drops=[];state.teleports=0;
 state.bumpers=L>=3?[{x:260,y:310,r:20},{x:560,y:310,r:20}]:[];state.portal=L>=6;
 state.banner='CÂMARA '+L+'/12 · '+chamberNames[L-1];state.bannerUntil=t+2.5;
 }
  function reset() {
 window.ClassicPause?.reset();
    t = 0;
    last = 0;
    targetX = 410;
    state = {
      level: 1,
      lives: profile.lives,
      score: 0,
      paddle: { x: 410, width: 104 },
      balls: [],
      bricks: [],
      particles: [],
      drops: [],
      wideUntil: 0,
      shield: false,
      combo: 0,
      waiting: true,
      ended: false,
      win: false,
      endAt: 0,
      nextLevel: 0,
      banner: "",
      bannerUntil: 0,
    };
    levelBoard();
    window.GameFX.hideRestart("prismModal");
  }
  function launch() {
    if (!active || state.ended || !state.waiting || state.nextLevel > 0) return;
    state.waiting = false;
    const speed =
      profile.key === "easy" ? 330 : profile.key === "hard" ? 440 : 385;
    state.balls.push({
      x: state.paddle.x,
      y: 447,
      vx: (Math.random() - 0.5) * 130,
      vy: -speed,
      r: 7,
      speed,
    });
    window.ArcadeAudio.effect("laser", 0.15);
  }
  function end(win) {
    if (state.ended) return;
    state.ended = true;
    state.win = win;
    state.endAt = performance.now();
    window.GameFX.terminal("prismModal", win);
  }
  function pickup(type) {
    if (type === "wide") {
      state.wideUntil = t + 9;
      state.banner = "PLATAFORMA AMPLIADA · 9s";
    } else if (type === "shield") {
      state.shield = true;
      state.banner = "REDE DE SEGURANÇA ATIVA";
    } else {
      const originals = state.balls.slice(0, 2);
      for (const b of originals)
        for (const shift of [-0.4, 0.4]) {
          if (state.balls.length >= 5) break;
          const angle = Math.atan2(b.vy, b.vx) + shift;
          state.balls.push({
            ...b,
            vx: Math.cos(angle) * b.speed,
            vy: Math.sin(angle) * b.speed,
          });
        }
      state.banner = "MULTIESFERAS!";
    }
    state.bannerUntil = t + 1.4;
    window.arcadeSound?.tone(1120, 0.16, "triangle", 0.04);
  }
  function update(dt) {
    t += dt;
    state.particles = window.GameFX.update(state.particles, dt);
    if (state.ended) return;
    const direction =
      (keys.ArrowRight || keys.d || keys.D ? 1 : 0) -
      (keys.ArrowLeft || keys.a || keys.A ? 1 : 0);
    targetX = Math.max(55, Math.min(765, targetX + direction * 470 * dt));
    state.paddle.width = t < state.wideUntil ? 164 : 104;
    state.paddle.x += (targetX - state.paddle.x) * Math.min(1, dt * 15);
    state.paddle.x = Math.max(
      state.paddle.width / 2 + 8,
      Math.min(812 - state.paddle.width / 2, state.paddle.x),
    );
    if (state.nextLevel) {
      if (t >= state.nextLevel) {
        state.level++;if(state.level%3===1)state.lives=Math.min(profile.lives,state.lives+1);
        levelBoard();
      }
      return;
    }
    if(state.waiting)return;
 for(const b of state.bricks){b.x=b.baseX+(state.level>=4?Math.sin(t*(.35+state.level*.025)+Math.round((b.baseY-76)/30)*.6)*18:0);}
 for(let i=0;i<state.bumpers.length;i++){const b=state.bumpers[i];b.x=(i?560:260)+Math.sin(t*.8+i*Math.PI)*Math.min(80,state.level*6);b.y=306+Math.sin(t*.6)*14;}

    const substeps = 3,
      step = dt / substeps;
    for (let k = 0; k < substeps; k++)
      for (const ball of state.balls) {
        const oldX = ball.x,
          oldY = ball.y;
        ball.portalLock=Math.max(0,(ball.portalLock||0)-step);
        for(const bump of state.bumpers){const dx=ball.x-bump.x,dy=ball.y-bump.y,d=Math.hypot(dx,dy);if(d<ball.r+bump.r&&d>0){const nx=dx/d,ny=dy/d,dot=ball.vx*nx+ball.vy*ny;if(dot<0){ball.vx-=2*dot*nx;ball.vy-=2*dot*ny;ball.x=bump.x+nx*(bump.r+ball.r+1);ball.y=bump.y+ny*(bump.r+ball.r+1);window.GameFX.particles(state.particles,ball.x,ball.y,'#e5a8ff',5);}}}
        if(state.portal&&ball.portalLock===0){for(const [px,other] of [[90,730],[730,90]])if(Math.hypot(ball.x-px,ball.y-360)<23){ball.x=other;ball.portalLock=1;state.teleports++;window.GameFX.particles(state.particles,ball.x,ball.y,'#9bffff',14);break;}}

        ball.x += ball.vx * step;
        ball.y += ball.vy * step;
        if (ball.x < ball.r) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x > 820 - ball.r) {
          ball.x = 820 - ball.r;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y < 48 + ball.r) {
          ball.y = 48 + ball.r;
          ball.vy = Math.abs(ball.vy);
        }
        if (
          ball.vy > 0 &&
          oldY + ball.r <= 465 &&
          ball.y + ball.r >= 465 &&
          Math.abs(ball.x - state.paddle.x) < state.paddle.width / 2 + ball.r
        ) {
          const offset = Math.max(
              -1,
              Math.min(1, (ball.x - state.paddle.x) / (state.paddle.width / 2)),
            ),
            a = offset * 1.08;
          ball.speed = Math.min(
            profile.key === "hard" ? 650 : 560,
            ball.speed + 4,
          );
          ball.vx = Math.sin(a) * ball.speed;
          ball.vy = -Math.cos(a) * ball.speed;
          ball.y = 457;
          state.combo = 0;
          window.ArcadeAudio.effect("hit", 0.09);
          window.GameFX.particles(state.particles, ball.x, 465, "#9cffe7", 5);
        }
        if (ball.y > 503 && state.shield) {
          ball.y = 500;
          ball.vy = -Math.abs(ball.vy);
          state.shield = false;
          window.GameFX.particles(state.particles, ball.x, 501, "#97eaff", 30);
        }
        for (const brick of state.bricks) {
          if (brick.hp <= 0) continue;
          const nx = Math.max(brick.x, Math.min(brick.x + brick.w, ball.x)),
            ny = Math.max(brick.y, Math.min(brick.y + brick.h, ball.y));
          if (Math.hypot(ball.x - nx, ball.y - ny) < ball.r) {
            if (oldX + ball.r <= brick.x || oldX - ball.r >= brick.x + brick.w)
              ball.vx *= -1;
            else ball.vy *= -1;
            ball.x = oldX;
            ball.y = oldY;
            brick.hp--;
            if(brick.hp<=0&&brick.volatile){for(const near of state.bricks)if(near!==brick&&near.hp>0&&Math.hypot(near.x-brick.x,near.y-brick.y)<95){near.hp=Math.max(0,near.hp-1);near.flash=t+.3;state.score+=5;}window.GameFX.particles(state.particles,brick.x+30,brick.y+10,'#ffb0e7',32);}

            brick.flash = t + 0.12;
            state.combo++;
            state.score += 10 * Math.min(5, 1 + Math.floor(state.combo / 5));
            window.GameFX.particles(
              state.particles,
              ball.x,
              ball.y,
              brick.color,
              brick.hp ? 7 : 14,
            );
            window.ArcadeAudio.effect("explosion", 0.09);
            if (!brick.hp && Math.random() < 0.19)
              state.drops.push({
                x: brick.x + brick.w / 2,
                y: brick.y,
                type: ["wide", "multi", "shield"][
                  Math.floor(Math.random() * 3)
                ],
              });
            break;
          }
        }
      }
    state.balls = state.balls.filter((b) => b.y < 550);
    for (const d of state.drops) {
      d.y += 110 * dt;
      if (
        d.y > 445 &&
        d.y < 487 &&
        Math.abs(d.x - state.paddle.x) < state.paddle.width / 2 + 12
      ) {
        d.taken = true;
        pickup(d.type);
      }
    }
    state.drops = state.drops.filter((d) => d.y < 540 && !d.taken);
    if (state.bricks.every((b) => b.hp <= 0)) {
      state.balls = [];
      if (state.level === 12) end(true);
      else {
        state.nextLevel = t + 1.8;
        state.banner = "CÂMARA ESTABILIZADA";
        state.bannerUntil = t + 1.8;
      }
      return;
    }
    if (!state.balls.length) {
      state.lives--;
      state.combo = 0;
      window.ArcadeAudio.effect("hit", 0.28);
      if (state.lives <= 0) end(false);
      else {
        state.waiting = true;
        state.drops = [];
      }
    }
  }
  function draw() {
    window.ArcadeUniverse.paint(g, 820, 520, t, "prism");
    g.save();
    g.strokeStyle = "#adacff15";
    g.lineWidth = 1;
    for (let y = 295; y < 520; y += 25) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(820, y);
      g.stroke();
    }
    for (let i = 0; i < 15; i++) {
      g.beginPath();
      g.moveTo(410 + (i - 7) * 25, 290);
      g.lineTo(410 + (i - 7) * 110, 520);
      g.stroke();
    }
    g.restore();
    for (const b of state.bricks) {
      if (b.hp <= 0) continue;
      g.save();
      g.shadowColor = b.color;
      g.shadowBlur = b.flash > t ? 22 : 8;
      g.fillStyle = b.flash > t ? "#efffff" : b.color + "88";
      g.strokeStyle = b.color;
      g.lineWidth = 1.5;
      g.beginPath();
      g.roundRect(b.x, b.y, b.w, b.h, 5);
      g.fill();
      g.stroke();
      g.fillStyle = "#ffffff99";
      g.fillRect(b.x + 5, b.y + 4, b.w - 10, 2);
      if(b.volatile){g.fillStyle='#fff1bc';g.font='bold 17px monospace';g.textAlign='center';g.fillText('✦',b.x+b.w/2,b.y+17);}
      if (b.hp > 1) {
        g.fillStyle = "#172a46";
        g.fillRect(b.x + b.w / 2 - 8, b.y + 9, 16, 5);
      }
      g.restore();
    }
    for(const b of state.bumpers){g.save();g.translate(b.x,b.y);g.rotate(t);g.strokeStyle='#9de6fc';g.fillStyle='#322656';g.lineWidth=3;g.beginPath();g.arc(0,0,b.r,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#b09bff';g.fillRect(-8,-8,16,16);g.restore();}
 if(state.portal)for(const x of [90,730]){g.save();g.translate(x,360);g.rotate(t*(x===90?1:-1));g.strokeStyle='#af8aff';g.lineWidth=4;g.setLineDash([8,5]);g.beginPath();g.ellipse(0,0,17,25,0,0,Math.PI*2);g.stroke();g.restore();}
 const p = state.paddle;
    g.save();
    g.shadowColor = "#95fff1";
    g.shadowBlur = 20;
    g.fillStyle = "#a6fff0";
    g.beginPath();
    g.roundRect(p.x - p.width / 2, 465, p.width, 12, 6);
    g.fill();
    g.fillStyle = "#29496a";
    g.fillRect(p.x - p.width / 2 + 8, 470, p.width - 16, 3);
    g.restore();
    for (const b of state.balls) {
      g.save();
      g.strokeStyle = "#b4dcff55";
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(b.x, b.y);
      g.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
      g.stroke();
      g.shadowColor = "#e6bcff";
      g.shadowBlur = 22;
      g.fillStyle = "#fff8ff";
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    if (state.waiting && !state.ended) {
      g.fillStyle = "#effdff";
      g.beginPath();
      g.arc(p.x, 451, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#cfb5ff";
      g.textAlign = "center";
      g.font = 'bold 16px "Space Mono",monospace';
      g.fillText("CLIQUE OU ESPAÇO PARA LANÇAR", 410, 352);
    }
    for (const d of state.drops) {
      g.save();
      g.translate(d.x, d.y);
      g.rotate(t * 0.8);
      g.fillStyle =
        d.type === "wide"
          ? "#a4ffdf"
          : d.type === "multi"
            ? "#e6aaff"
            : "#a5daff";
      g.shadowColor = g.fillStyle;
      g.shadowBlur = 12;
      g.beginPath();
      g.roundRect(-12, -12, 24, 24, 5);
      g.fill();
      g.rotate(-t * 0.8);
      g.fillStyle = "#152a44";
      g.textAlign = "center";
      g.font = "bold 14px monospace";
      g.fillText(
        d.type === "wide" ? "↔" : d.type === "multi" ? "3" : "S",
        0,
        5,
      );
      g.restore();
    }
    if (state.shield) {
      g.strokeStyle = "#9bdcff";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(12, 503);
      g.lineTo(808, 503);
      g.stroke();
    }
    window.GameFX.draw(g, state.particles);
    g.fillStyle = "#102746d9";
    g.fillRect(0, 0, 820, 45);
    g.textAlign = "left";
    g.fillStyle = "#e5d9ff";
    g.font = 'bold 14px "Space Mono",monospace';
    g.fillText("CÂMARA " + state.level + "/12", 20, 29);
    g.fillStyle = "#a2ffe8";
    g.fillText("VIDAS " + state.lives, 230, 29);
    g.fillStyle = "#d5c0ff";
    g.fillText(
      "COMBO ×" + Math.min(5, 1 + Math.floor(state.combo / 5)),
      410,
      29,
    );
    g.textAlign = "right";
    g.fillStyle = "#fff5ff";
    g.fillText(String(state.score).padStart(5, "0"), 800, 29);
    if (t < state.bannerUntil) {
      g.fillStyle = "#132544e8";
      g.fillRect(160, 274, 500, 37);
      g.textAlign = "center";
      g.fillStyle = "#cbb1ff";
      g.font = 'bold 22px "Barlow Condensed",sans-serif';
      g.fillText(state.banner, 410, 300);
    }
    if (state.ended)
      window.GameFX.endCard(
        g,
        820,
        520,
        state.win,
        "ENERGIA RECUPERADA " + state.score,
      );
  }
  function loop(now) {
    if (!active) return;
    const dt = Math.min(0.033, (now - (last || now)) / 1000);
    last = now;
    if(!window.ClassicPause.active)update(dt);
    draw();
    frame = requestAnimationFrame(loop);
  }
  canvas.addEventListener("pointermove", (e) => {
    if (!active || state.ended || e.pointerType !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    targetX = ((e.clientX - r.left) * 820) / r.width;
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    const r = canvas.getBoundingClientRect();
    targetX = ((e.clientX - r.left) * 820) / r.width;
    launch();
  });
  window.PrismGame = {
    open(difficulty) {
      profile = difficulty;
      active = true;
      modal.style.display = "flex";
      reset();
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    },
    close() {
      active = false;
      modal.style.display = "none";
      if (frame) cancelAnimationFrame(frame);
      frame = null;
    },
    launch,
    steer(x) {
      targetX = Math.max(55, Math.min(765, x));
    },
    get pose() {
      return { x: state?.paddle.x || 410, y: 465 };
    },
    restart() {
      if (!active || !state.ended || performance.now() - state.endAt < 350)
        return false;
      window.ArcadeAudio.stopEffects();
      reset();
      window.ArcadeAudio.music("prism");
      return true;
    },
    get active() {
      return active;
    },
    get snapshot() {
      return state;
    },
    step: update,
  };
})();
