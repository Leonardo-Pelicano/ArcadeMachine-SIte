/* Neon Drift '87 / Circuit 87: garage, single races, eight-round cup and touch controls. */
(function () {
  "use strict";
  const D = window.DriftData,
    P = window.DriftPhysics,
    $ = (s) => document.querySelector(s),
    modal = $("#driftModal"),
    canvas = $("#driftCanvas");
  let active = false,
    view = null,
    race = null,
    profile = { key: "normal" },
    screen = "garage",
    carIndex = 0,
    trackIndex = 0,
    mode = "single",
    cup = null,
    last = 0,
    frame = 0,
    accumulator = 0,
    uiAt = 0,
    noticeUntil = 0,
    engine = null,
    paused = false,
    resultAt = 0;
  const map = $("#driftMap"),
    mapCtx = map.getContext("2d");
  let saved = { car: 0, track: 0, records: {}, cups: {} };
  const storageKey = "neon-drift-circuit87-v11";
  try {
    const current = localStorage.getItem(storageKey),
      previous = JSON.parse(
        localStorage.getItem("neon-drift-circuit87-v10") || localStorage.getItem("neon-drift-circuit87") || "{}",
      );
    saved = {
      ...saved,
      ...(current
        ? JSON.parse(current)
        : { car: previous.car || 0, track: previous.track || 0 }),
    };
    carIndex = P.clamp(Number(saved.car) || 0, 0, D.cars.length - 1);
    trackIndex = P.clamp(Number(saved.track) || 0, 0, D.tracks.length - 1);
  } catch (e) {}
  function persist() {
    saved.car = carIndex;
    saved.track = trackIndex;
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (e) {}
  }
  function tone(f, d = 0.12, type = "triangle", v = 0.035) {
    window.arcadeSound?.tone(f, d, type, v);
  }
  function engineStart() {
    engineStop();
    const sound = window.arcadeSound;
    if (!sound?.ctx || !sound.master) return;
    try {
      const ctx = sound.ctx,
        osc = ctx.createOscillator(),
        osc2 = ctx.createOscillator(),
        filter = ctx.createBiquadFilter(),
        gain = ctx.createGain();
      osc.type = "sawtooth";
      osc2.type = "triangle";
      filter.type = "lowpass";
      filter.frequency.value = 420;
      gain.gain.value = 0;
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(sound.master);
      osc.start();
      osc2.start();
      if (!sound.skidBuffer) {
        sound.skidBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const samples = sound.skidBuffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++)
          samples[i] = Math.random() * 2 - 1;
      }
      const skid = ctx.createBufferSource(),
        skidFilter = ctx.createBiquadFilter(),
        skidGain = ctx.createGain();
      skid.buffer = sound.skidBuffer;
      skid.loop = true;
      skidFilter.type = "bandpass";
      skidFilter.frequency.value = 1100;
      skidFilter.Q.value = 1.5;
      skidGain.gain.value = 0;
      skid.connect(skidFilter);
      skidFilter.connect(skidGain);
      skidGain.connect(sound.master);
      skid.start();
      engine = { ctx, osc, osc2, filter, gain, skid, skidFilter, skidGain };
    } catch (e) {}
  }
  function engineUpdate() {
    if (!engine) return;
    const { ctx, osc, osc2, filter, gain } = engine,
      p = race?.player;
    const speed = p?.speed || 0,
      running = screen === "race" && race?.phase === "racing" && !paused;
    const slip = Math.abs(p?.slipAngle || 0);
    engine.skidGain.gain.setTargetAtTime(
      running && speed > 10 && slip > 0.1
        ? Math.min(0.022, (slip - 0.1) * 0.05)
        : 0,
      ctx.currentTime,
      0.09,
    );
    engine.skidFilter.frequency.setTargetAtTime(
      750 + speed * 12,
      ctx.currentTime,
      0.12,
    );
    const rpm = 42 + speed * 2 + (p?.drifting ? 13 : 0);
    osc.frequency.setTargetAtTime(rpm, ctx.currentTime, 0.08);
    osc2.frequency.setTargetAtTime(rpm * 0.502, ctx.currentTime, 0.08);
    filter.frequency.setTargetAtTime(230 + speed * 10, ctx.currentTime, 0.1);
    gain.gain.setTargetAtTime(running ? 0.012 : 0, ctx.currentTime, 0.08);
  }
  function engineStop() {
    if (!engine) return;
    try {
      engine.skid.stop();
      engine.skidGain.disconnect();
      engine.osc.stop();
      engine.osc2.stop();
      engine.gain.disconnect();
    } catch (e) {}
    engine = null;
  }
  function timeText(t) {
    if (!Number.isFinite(t)) return "—";
    const minutes = Math.floor(t / 60);
    return minutes + ":" + (t % 60).toFixed(2).padStart(5, "0");
  }
  function notice(text, seconds = 2.3) {
    $("#driftNotice").textContent = text;
    $("#driftNotice").classList.add("visible");
    noticeUntil = (race?.time || 0) + seconds;
  }
  function mapSVG(index) {
    const t = P.track(index),
      xs = t.samples.map((p) => p[0]),
      zs = t.samples.map((p) => p[2]),
      minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minZ = Math.min(...zs),
      maxZ = Math.max(...zs),
      scale = Math.min(130 / (maxX - minX), 63 / (maxZ - minZ));
    let points = t.samples
      .filter((_, i) => i % 6 === 0)
      .map((p) =>
        [
          (p[0] - (minX + maxX) / 2) * scale + 80,
          (p[2] - (minZ + maxZ) / 2) * -scale + 43,
        ]
          .map((v) => v.toFixed(1))
          .join(","),
      )
      .join(" ");
    return (
      '<svg viewBox="0 0 160 86" aria-hidden="true"><polyline points="' +
      points +
      " " +
      points.split(" ")[0] +
      '" fill="none" stroke="' +
      t.accent +
      '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' +
      ((t.samples[0][0] - (minX + maxX) / 2) * scale + 80).toFixed(1) +
      '" cy="' +
      ((t.samples[0][2] - (minZ + maxZ) / 2) * -scale + 43).toFixed(1) +
      '" r="4" fill="#fff0d6"/></svg>'
    );
  }
  function buildGarage() {
    const cars = $("#driftCars"),
      tracks = $("#driftTracks");
    cars.innerHTML = D.cars
      .map(
        (c, i) =>
          '<button type="button" class="drift-car-choice" data-car="' +
          i +
          '" aria-pressed="false" style="--car:' +
          c.color +
          '"><span class="car-swatch" aria-hidden="true"><svg viewBox="0 0 80 40"><path d="M8 28 13 18 26 15 33 7 51 7 61 16 72 19 76 28Z" fill="' +
          c.color +
          '"/><path d="m30 15 6-6h12l7 7Z" fill="#23435b"/><circle cx="22" cy="29" r="6" fill="#0f1e30"/><circle cx="63" cy="29" r="6" fill="#0f1e30"/><circle cx="22" cy="29" r="2.6" fill="#b0ccd3"/><circle cx="63" cy="29" r="2.6" fill="#b0ccd3"/></svg></span><b>' +
          c.name +
          "</b><small>" +
          c.role +
          "</small></button>",
      )
      .join("");
    const formulaIcon = cars.querySelector('[data-car="5"] .car-swatch');
    if (formulaIcon)
      formulaIcon.innerHTML =
        '<svg viewBox="0 0 80 40"><path fill="#f56867" d="M12 29V15h8l5 9h17l12 5h17v4H12z"/><path fill="#f56867" d="M26 24v-8l10-5 6 13Z"/><path d="M31 16h7v6h-8" fill="#20384b"/><path stroke="#d9e5e8" stroke-width="2" d="M30 22v-8h10l3 9"/><path fill="#f3ded0" d="M65 28h11v3H65zM7 12h16v3H7z"/><circle cx="20" cy="30" r="7" fill="#122130"/><circle cx="59" cy="30" r="7" fill="#122130"/><circle cx="20" cy="30" r="3" fill="#e3d8bd"/><circle cx="59" cy="30" r="3" fill="#e3d8bd"/></svg>';
    tracks.innerHTML = D.tracks
      .map(
        (t, i) =>
          '<button type="button" class="drift-track-choice" data-track="' +
          i +
          '" aria-pressed="false" style="--track:' +
          t.accent +
          '"><span class="track-order">0' +
          (i + 1) +
          " <span>" +
          t.type +
          "</span></span>" +
          mapSVG(i) +
          "<b>" +
          t.name +
          "</b><small>" +
          t.grade +
          "</small></button>",
      )
      .join("");
    for (const b of cars.querySelectorAll("button"))
      b.onclick = () => selectCar(Number(b.dataset.car));
    for (const b of tracks.querySelectorAll("button"))
      b.onclick = () => selectTrack(Number(b.dataset.track));
    selectCar(carIndex);
    selectTrack(trackIndex);
    setMode(mode);
  }
  function selectCar(index) {
    carIndex = index;
    const c = D.cars[index];
    view?.selectCar(index);
    $("#driftCarName").textContent = c.name;
    $("#driftCarRole").textContent = c.role;
    $("#driftCarDescription").textContent = c.about;
    $("#driftCarName").style.color = c.color;
    const labels = ["VELOCIDADE", "ACELERAÇÃO", "CONTROLE"];
    $("#driftStats").innerHTML = c.stats
      .map(
        (value, i) =>
          "<div><span>" +
          labels[i] +
          '</span><span class="stat-bars" aria-label="' +
          value +
          ' de 5">' +
          Array.from(
            { length: 5 },
            (_, k) =>
              '<i class="' +
              (k < value ? "on" : "") +
              '" style="--car:' +
              c.color +
              '"></i>',
          ).join("") +
          "</span></div>",
      )
      .join("");
    document
      .querySelectorAll("[data-car]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.car) === index)),
      );
    persist();
  }
  function selectTrack(index) {
    trackIndex = index;
    const t = D.tracks[index];
    $("#driftTrackDescription").textContent = t.description;
    $("#driftTrackName").textContent = t.name;
    $("#driftTrackMeta").textContent =
      (P.track(index).length / 1000).toFixed(2) + " km · 3 VOLTAS · " + t.grade;
    document
      .querySelectorAll("[data-track]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(Number(b.dataset.track) === index),
        ),
      );
    const rec = saved.records[t.id + ":" + profile.key];
    $("#driftRecord").textContent = rec
      ? "SEU RECORDE " + timeText(rec.time) + " · " + rec.car
      : "PRIMEIRA CORRIDA NESTA PISTA";
    persist();
  }
  function setMode(value) {
    mode = value;
    document
      .querySelectorAll("[data-drift-mode]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.driftMode === value)),
      );
    $("#driftTrackSelector").dataset.mode = value;
    $("#driftModeHelp").textContent =
      value === "cup"
        ? "As 8 pistas em sequência. Some pontos e conquiste o Circuito 87."
        : "Escolha qualquer pista. Três voltas e sete rivais pela vitória.";
    $("#driftLaunch").textContent =
      value === "cup" ? "INICIAR CAMPEONATO ↗" : "IR PARA O GRID ↗";
    $("#driftTrackSelector .drift-section-label").textContent =
      value === "cup" ? "03 / AS OITO ETAPAS" : "03 / ESCOLHA A PISTA";
  }
  function setScreen(value) {
    screen = value;
    modal.dataset.screen = value;
    $("#driftGarage").hidden = value !== "garage";
    $("#driftGarageHero").hidden = value !== "garage";
    $("#driftHUD").hidden = value === "garage";
    $("#driftRaceControls").hidden = value !== "race";
    $("#driftResult").hidden = value !== "result";
    $("#driftPause").hidden = value !== "race";
    $("#driftPauseLayer").hidden = true;
    $("#driftCountdown").textContent = "";
    $("#driftNotice").classList.remove("visible");
    if (value === "garage") {
      if (view) view.mode = "garage";
      $("#driftLaunch").focus();
    }
    window.TouchArcade?.releaseAll();
  }
  function start() {
    if (mode === "cup")
      cup = { round: 0, points: Array(8).fill(0), rounds: [], complete: false };
    else cup = null;
    startRace(mode === "cup" ? 0 : trackIndex);
  }
  function startRace(index) {
    mouseDrift = false;
    window.arcadeSound?.init();
    window.ArcadeAudio.prepare();
    trackIndex = index;
    race = new P.Race({
      trackIndex: index,
      carIndex,
      difficulty: profile.key,
      seed: Date.now(),
    });
    paused = false;
    accumulator = 0;
    last = 0;
    uiAt = 0;
    resultAt = 0;
    view.load(race);
    setScreen("race");
    modal.querySelector(".drift-shell").scrollTop = 0;
    $("#driftRaceName").textContent = D.tracks[index].name;
    $("#driftRound").textContent = cup
      ? "CIRCUITO 87 · ETAPA " + (cup.round + 1) + "/" + D.tracks.length
      : "CORRIDA AVULSA · " + profile.label;
    $('#driftRaceHelp').textContent=matchMedia('(pointer:coarse)').matches?'Arraste para esterçar · aceleração automática · R reposiciona':'Segure W/↑ para acelerar · A/D ou ←/→ esterçam · S/↓ freia · Shift/clique: freio de mão · R reposiciona';
    $("#driftResume").textContent = "CONTINUAR CORRIDA";
    $("#driftPause").textContent = "PAUSAR Ⅱ";
    window.TouchArcade?.reset("drift", 410, 440);
    engineStart();
    window.ArcadeAudio.music("prism");
    updateHUD();
    notice("3 VOLTAS · 8 PILOTOS · A LARGADA É SUA", 3.2);
    $("#driftPause").focus();
  }
  function event(e) {
    view.effect?.(e, race);
    const own = e.id === 0;
    if (e.type === "countdown") {
      tone(440, 0.11, "square", 0.025);
      return;
    }
    if (e.type === "go") {
      tone(880, 0.25, "triangle", 0.05);
      notice("VAI! ENCONTRE SUA LINHA.", 1.8);
      return;
    }
    if (!own && e.type !== "raceEnd") return;
    if(e.type==='reposition'){notice('REPOSICIONADO · +2 s',1.5)}else if (e.type === "handbrake") {
      notice("FREIO DE MÃO · CORRIJA A TRASEIRA", 1.1);
    } else if (e.type === "driftFail") {
      notice("DERRAPAGEM EXCESSIVA · RECUPERE O CONTROLE", 1.8);
      window.ArcadeAudio.effect("hit", 0.18);
    } else if (e.type === "featureWarning") {
      notice(
        {
          ice: "GELO À FRENTE · DIREÇÃO SUAVE",
          boulder: "ROCHAS À FRENTE · OBSERVE A PASSAGEM",
          ramp: "RAMPA À FRENTE · PREPARE O SALTO",
        }[e.feature],
        1.8,
      );
    } else if (e.type === "jump") {
      tone(620, 0.14);
      notice("SALTO! MANTENHA A LINHA.", 1.1);
    } else if (e.type === "pickup") {
      tone(990, 0.12);
      notice(D.items[e.item].name + " PRONTO · USE QUANDO QUISER", 1.8);
    } else if (e.type === "lap" && race?.phase !== "finished") {
      tone(780, 0.16);
      notice(
        e.lap === 3
          ? "ÚLTIMA VOLTA. VALE TUDO!"
          : "VOLTA " + e.lap + " / 3 · " + timeText(e.lastLap),
        2.5,
      );
    } else if (e.type === "driftBoost") {
      tone(e.level === 2 ? 1150 : 890, 0.18);
      notice(
        e.level === 2
          ? "DRIFT LIMPO · TRAÇÃO RECUPERADA!"
          : "DRIFT CONTROLADO!",
        1.4,
      );
    } else if (e.type === "boost" || e.type === "pad") {
      window.ArcadeAudio.effect("warp", 0.16);
    } else if (e.type === "hit" || e.type === "bump" || e.type === "wall") {
      window.ArcadeAudio.effect(
        "hit",
        e.type === "hit" ? 0.28 : 0.08 + (e.severity || 0) * 0.22,
      );
      if (e.type === "wall" && e.severity > 0.2)
        notice("BARREIRA! RETOME A TRAÇÃO.", 1.1);
      else if (e.type === "bump" && e.severity > 0.3)
        notice(
          e.kind === "rear"
            ? "IMPACTO NA LONGITUDINAL!"
            : "TOQUE LATERAL! CORRIJA A DIREÇÃO.",
          1.1,
        );
      else if (e.type === "hit") notice("IMPACTO! RETOME A LINHA.", 1.4);
    } else if (e.type === "blocked") {
      tone(1330, 0.16);
      notice("ESCUDO ABSORVEU O IMPACTO", 1.5);
    } else if (e.type === "miss")
      notice("NENHUM RIVAL NO ALCANCE DO PULSO", 1.6);
    else if (e.type === "shield") {
      tone(1090, 0.2);
      notice("ESCUDO ATIVO", 1.3);
    } else if (e.type === "pulse") notice("PULSO LANÇADO", 1.3);
    else if (e.type === "mine") notice("ECO DEIXADO NA PISTA", 1.3);
    else if (e.type === "raceEnd") finish();
  }
  function finish() {
    if (screen === "result") return;
    resultAt = performance.now();
    paused = false;
    engineStop();
    window.ArcadeAudio.stopEffects();
    window.ArcadeAudio.music("menu");
    const position = race.player.rank,
      recKey = race.track.id + ":" + profile.key,
      old = saved.records[recKey];
    let record = false;
    if (!old || race.elapsed < old.time) {
      record = true;
      saved.records[recKey] = {
        time: race.elapsed,
        car: D.cars[carIndex].name,
      };
      persist();
    }
    if (cup) {
      race.results.forEach((r) => (cup.points[r.id] += r.points));
      cup.rounds.push(race.results);
      cup.complete = cup.round === D.tracks.length - 1;
      if (cup.complete) {
        const best = saved.cups[profile.key] || 0;
        saved.cups[profile.key] = Math.max(best, cup.points[0]);
        persist();
      }
    }
    setScreen("result");
    modal.querySelector(".drift-shell").scrollTop = 0;
    $("#driftResultEyebrow").textContent = cup
      ? cup.complete
        ? "CIRCUITO 87 · CLASSIFICAÇÃO FINAL"
        : "CIRCUITO 87 · ETAPA " + (cup.round + 1) + "/" + D.tracks.length
      : "BANDEIRADA · " + race.track.name;
    const cupOrder = cup
      ? D.rivals
          .map((r, i) => ({
            id: i + 1,
            name: r.name,
            color: r.color,
            points: cup.points[i + 1],
          }))
          .concat([
            {
              id: 0,
              name: "VOCÊ",
              color: race.player.color,
              points: cup.points[0],
            },
          ])
          .sort(
            (a, b) =>
              b.points - a.points ||
              race.results.find((r) => r.id === a.id).position -
                race.results.find((r) => r.id === b.id).position,
          )
      : null;
    const finalPosition = cup?.complete
      ? cupOrder.findIndex((r) => r.id === 0) + 1
      : position;
    $("#driftResultTitle").textContent =
      finalPosition === 1
        ? cup?.complete
          ? "CAMPEÃO DO CIRCUITO!"
          : "A PISTA É SUA!"
        : finalPosition <= 3
          ? "LUGAR NO PÓDIO!"
          : "ATÉ A PRÓXIMA CURVA.";
    $("#driftResultPosition").textContent = String(finalPosition).padStart(
      2,
      "0",
    );
    $("#driftResultPositionLabel").textContent = cup?.complete
      ? "NO CAMPEONATO"
      : "NA CORRIDA";
    $("#driftResultSummary").textContent =
      timeText(race.elapsed) +
      " · MELHOR VOLTA " +
      timeText(race.player.bestLap) +
      (record ? " · NOVO RECORDE" : "");
    const standings = cup?.complete
      ? cupOrder.map((r, i) => ({ ...r, position: i + 1 }))
      : race.results;
    $("#driftStandings").innerHTML = standings
      .map(
        (r) =>
          '<li class="' +
          (r.id === 0 ? "you" : "") +
          '"><span>' +
          String(r.position).padStart(2, "0") +
          '</span><i style="background:' +
          r.color +
          '"></i><b>' +
          r.name +
          "</b><span>" +
          (cup?.complete
            ? r.points + " pts"
            : r.projected
              ? "NA PISTA"
              : timeText(r.time)) +
          "</span><small>" +
          (cup && !cup.complete
            ? cup.points[r.id] + " pts"
            : !cup
              ? r.points + " pts"
              : "") +
          "</small></li>",
      )
      .join("");
    $("#driftResultNext").textContent =
      cup && !cup.complete
        ? "PRÓXIMA PISTA ↗"
        : cup
          ? "DISPUTAR OUTRO CAMPEONATO"
          : "CORRER NOVAMENTE ↗";
    $("#driftResultHint").textContent =
      cup && !cup.complete
        ? "ENTER avança para " + D.tracks[cup.round + 1].name
        : "ENTER repete a disputa · GARAGEM para mudar carro ou pista";
    $("#driftCupProgress").hidden = !cup || cup.complete;
    if (cup && !cup.complete)
      $("#driftCupProgress").textContent =
        "CAMPEONATO: " +
        cupOrder
          .slice(0, 3)
          .map((r, i) => i + 1 + "º " + r.name + " " + r.points + " pts")
          .join(" · ");
    $("#driftResultNext").focus();
    [660, 830, 1100].forEach((f, i) =>
      setTimeout(() => {
        if (active && screen === "result") tone(f, 0.22, "triangle", 0.045);
      }, i * 120),
    );
    $("#gameStatus").textContent =
      "Corrida concluída. Você terminou em " +
      position +
      "º lugar. Enter continua.";
  }
  function continueResult() {
    if (screen !== "result" || performance.now() - resultAt < 400) return false;
    if (cup && !cup.complete) {
      cup.round++;
      startRace(cup.round);
    } else start();
    return true;
  }
  function garage() {
    engineStop();
    race = null;
    cup = null;
    paused = false;
    setScreen("garage");
    view.close();
    selectTrack(trackIndex);
    selectCar(carIndex);
    window.ArcadeAudio.music("menu");
  }
  function pause(force) {
    if (!active || screen !== "race" || !race || race.phase === "finished")
      return;
    mouseDrift = false;
    paused = typeof force === "boolean" ? force : !paused;
    race.input.drift = false;
    race.input.brake = false;
    race.input.throttle=0;
    window.TouchArcade?.releaseAll();
    $("#driftPauseLayer").hidden = !paused;
    $("#driftPause").textContent = paused ? "CONTINUAR ▶" : "PAUSAR Ⅱ";
    engineUpdate();
    if (paused) $("#driftResume").focus();
    last = 0;
  }
  function use() {
    if (!active || paused || screen !== "race") return;
    race.useItem();
    updateHUD();
  }
  function updateMap() {
    if (!race) return;
    const g = mapCtx,
      w = map.width,
      h = map.height,
      t = race.track,
      xs = t.samples.map((p) => p[0]),
      zs = t.samples.map((p) => p[2]),
      minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minZ = Math.min(...zs),
      maxZ = Math.max(...zs),
      scale = Math.min((w - 22) / (maxX - minX), (h - 22) / (maxZ - minZ)),
      point = (f) => ({
        x: (f.x - (minX + maxX) / 2) * scale + w / 2,
        y: -(f.z - (minZ + maxZ) / 2) * scale + h / 2,
      });
    g.clearRect(0, 0, w, h);
    g.lineJoin = "round";
    g.lineCap = "round";
    g.strokeStyle = "#c3d8e855";
    g.lineWidth = 5;
    g.beginPath();
    t.samples.forEach((p, i) => {
      const q = point({ x: p[0], z: p[2] });
      i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y);
    });
    g.closePath();
    g.stroke();
    for (const c of race.cars.slice().reverse()) {
      const p = point(t.at(c.s));
      g.fillStyle = c.id === 0 ? "#fff4d5" : c.color;
      g.beginPath();
      g.arc(p.x, p.y, c.id === 0 ? 4.3 : 2.8, 0, Math.PI * 2);
      g.fill();
      if (c.id === 0) {
        g.strokeStyle = "#203449";
        g.lineWidth = 1;
        g.stroke();
      }
    }
  }
  function updateHUD() {
    if (!race) return;
    $("#driftHold").classList.toggle("held", !!race.input.drift);
    const p = race.player;
    $("#driftPosition").textContent = p.rank;
    $("#driftLap").textContent = p.lap + " / 3";
    $("#driftClock").textContent = timeText(race.elapsed);
    $("#driftSpeed").textContent = Math.round(p.speed * 3.6);
    $("#driftBoostStatus").textContent =
      p.boost > 0
        ? "TURBO"
        : p.shield > 0
          ? "ESCUDO"
          : Math.abs(p.lane) > 1.02
            ? "FORA DA PISTA"
            : "KM/H";
    $("#driftBoostStatus").classList.toggle("lit", p.boost > 0 || p.shield > 0);
    $("#driftDriftCharge").style.width =
      Math.min(100, ((p.pendingDrift || p.driftCharge) / 1.6) * 100) + "%";
    $("#driftDriftCharge").style.background =
      p.driftRisk > 0.7 ? "#f6a0b4" : "linear-gradient(90deg,#84dfff,#d5a6ff)";
    $("#driftChargeLabel").textContent = p.handbrake
      ? p.speed < 9
        ? "SOLTE O FREIO PARA ACELERAR"
        : p.driftRisk > 0.7
          ? "TRASEIRA SOLTA · CONTRAESTERCE"
          : "FREIO DE MÃO · ÂNGULO " +
            Math.round((Math.abs(p.slipAngle) * 180) / Math.PI) +
            "°"
      : p.pendingDrift
        ? "RECUPERE A TRAÇÃO PARA FECHAR O DRIFT"
        : "SHIFT / CLIQUE · FREIO DE MÃO";
    const item = D.items[p.item];
    $("#driftItem").disabled = !item || race.phase !== "racing" || paused;
    $("#driftItemIcon").textContent = item ? item.short : "—";
    $("#driftItemName").textContent = item ? item.name : "SEM ITEM";
    $("#driftDesktopItem").textContent = item ? item.short + " · " + item.name + " · ESPAÇO / E" : "SEM ITEM · COLETE UM CRISTAL";
    $("#driftItem").style.setProperty("--item", item?.color || "#71869d");
    $("#driftItem").setAttribute(
      "aria-label",
      item
        ? "Usar " + item.name + ": " + item.help
        : "Sem item. Colete um cristal na pista.",
    );
    $("#driftOrder").innerHTML = race.ranking
      .slice(0, 4)
      .map(
        (c) =>
          '<span class="' +
          (c.id === 0 ? "you" : "") +
          '"><i style="background:' +
          c.color +
          '"></i>' +
          c.rank +
          " " +
          c.name +
          "</span>",
      )
      .join("");
    $("#driftCountdown").textContent =
      race.phase === "countdown"
        ? String(Math.min(3, Math.max(1, Math.ceil(race.countdown))))
        : race.elapsed < 0.7
          ? "VAI!"
          : "";
    if (race.time > noticeUntil) $("#driftNotice").classList.remove("visible");
    updateMap();
  }
  function loop(ms) {
    if (!active) return;
    frame = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (ms - (last || ms)) / 1000);
    last = ms;
    if (document.hidden) {
      last = 0;
      return;
    }
    if (race && screen === "race" && !paused) {
      const direction =
        (keys.ArrowRight || keys.d || keys.D ? 1 : 0) -
        (keys.ArrowLeft || keys.a || keys.A ? 1 : 0);
      if (direction || !window.TouchArcade?.enabled || race.controlMode === "keyboard")
        race.setSteer(direction);
      race.input.drift = heldDrift || mouseDrift || !!keys.Shift;
      race.input.brake = heldBrake || !!keys.ArrowDown || !!keys.s || !!keys.S;
      race.input.throttle=window.TouchArcade?.enabled?1:(keys.w||keys.W||keys.ArrowUp?1:0);
      accumulator += dt;
      let steps = 0;
      while (accumulator >= 1 / 60 && steps++ < 8) {
        race.step(1 / 60);
        accumulator -= 1 / 60;
      }
      for (const e of race.drainEvents()) event(e);
    }
    engineUpdate();
    if (ms - uiAt > 80) {
      updateHUD();
      uiAt = ms;
    }
    view.render(race, ms / 1000, dt || 0.016);
  }
  let mouseDrift = false;
  let heldDrift = false,
    heldBrake = false;
  function hold(button, kind) {
    const set = (v) => {
      if (kind === "drift") heldDrift = v;
      else heldBrake = v;
      button.classList.toggle("held", v);
    };
    button.addEventListener("pointerdown", (e) => {
      if (screen !== "race" || paused) return;
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      set(true);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(name, () => set(false));
    button.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        set(true);
      }
    });
    button.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        set(false);
      }
    });
    button.addEventListener("blur", () => set(false));
  }
  hold($("#driftHold"), "drift");
  hold($("#driftBrake"), "brake");
  $("#driftItem").onclick = use;
  $("#driftLaunch").onclick = () => {
    if (screen === "garage") start();
  };
  $("#driftResultNext").onclick = continueResult;
  $("#driftResultGarage").onclick = garage;
  $("#driftPause").onclick = () => pause();
  $("#driftResume").onclick = () => pause(false);
  $("#driftAbandon").onclick = garage;
  for (const b of document.querySelectorAll("[data-drift-mode]"))
    b.onclick = () => setMode(b.dataset.driftMode);
  // Holding the left mouse button over the arena/pad also holds drift.
  for (const surface of [
    canvas,
    document.querySelector('[data-pad="drift"]'),
  ]) {
    surface.addEventListener("pointerdown", (e) => {
      if (
        e.pointerType !== "mouse" ||
        e.button !== 0 ||
        !active ||
        screen !== "race" ||
        paused
      )
        return;
      e.preventDefault();
      mouseDrift = true;
      surface.setPointerCapture(e.pointerId);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      surface.addEventListener(name, (e) => {
        if (e.pointerType === "mouse" || name === "lostpointercapture")
          mouseDrift = false;
      });
  }
  window.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse") mouseDrift = false;
  });
  window.addEventListener("keydown", (e) => {
    if (!active) return;
    if(screen==="race"&&e.key.startsWith("Arrow"))e.preventDefault();
    if (e.key === "Shift" && screen === "race") {
      e.preventDefault();
      heldDrift = true;
    }
    if(e.code==='KeyR'&&!e.repeat&&screen==='race'&&!paused){e.preventDefault();race.reposition()}
    if (e.code === "KeyP" && !e.repeat) {
      e.preventDefault();
      pause();
    }
    if (
      (e.code === "Space" || e.code === "KeyE") &&
      screen === "race" &&
      !e.repeat &&
      e.target !== $("#driftHold") &&
      e.target !== $("#driftBrake")
    ) {
      e.preventDefault();
      use();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (!active) return;
    if(screen==="race"&&e.key.startsWith("Arrow"))e.preventDefault();
    if (e.key === "Shift") heldDrift = false;
  });
  window.addEventListener("blur", () => {
    mouseDrift = heldDrift = heldBrake = false;
    if (active && screen === "race") pause(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && active && screen === "race") pause(true);
  });
  function syncAudio() {
    for (const [a, b] of [
      ["driftMusic", "music"],
      ["driftSound", "sound"],
    ]) {
      const source = document.getElementById(b),
        button = document.getElementById(a);
      button.textContent = source.textContent;
      button.setAttribute(
        "aria-pressed",
        source.getAttribute("aria-pressed") ||
          String(source.textContent.includes("ON")),
      );
    }
  }
  document.getElementById("driftMusic").onclick = () => {
    document.getElementById("music").click();
    syncAudio();
  };
  document.getElementById("driftSound").onclick = () => {
    document.getElementById("sound").click();
    syncAudio();
  };
  window.DriftGame = {
    open(d) {
      profile = d;
      active = true;
      modal.style.display = "flex";
      document.body.classList.add("drift-open");
      if (!view) view = new window.DriftRenderer.View(canvas);
      buildGarage();
      syncAudio();
      setScreen("garage");
      race = null;
      cup = null;
      paused = false;
      mouseDrift = heldDrift = heldBrake = false;
      last = 0;
      view.mode = "garage";
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    },
    close() {
      active = false;
      mouseDrift = heldDrift = heldBrake = false;
      modal.style.display = "none";
      document.body.classList.remove("drift-open");
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      engineStop();
      window.TouchArcade?.releaseAll();
      view?.close();
      race = null;
      cup = null;
      paused = false;
    },
    steer(x) {
      if (race && screen === "race" && !paused) race.setTarget(Math.max(-1,Math.min(1,(x-410)/160)));
    },
    get pose() {
      return { x: 410, y: 440 };
    },
    get active() {
      return active;
    },
    get racing() {
      return (
        active && screen === "race" && !paused && race?.phase !== "finished"
      );
    },
    get snapshot() {
      return race;
    },
    get screen() {
      return screen;
    },
    get selection() {
      return { carIndex, trackIndex, mode };
    },
    get cup() {
      return cup;
    },
    pause,
    restart() {
      if (screen === "garage") {
        start();
        return true;
      }
      return continueResult();
    },
    preview: window.DriftRenderer.preview,
  };
})();
