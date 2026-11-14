/* Pelicano's laboratory: illustrated dialogue, component shop and checkpointed launch campaign. */
(function () {
  "use strict";
  const D = window.SeleneData,
    P = window.SelenePhysics,
    R = window.SeleneRenderer,
    Parts = window.SeleneParts,
    $ = (s) => document.querySelector(s),
    modal = $("#rocketModal"),
    canvas = $("#seleneCanvas");
  let profile = P.fresh(),
    flight = null,
    active = false,
    screen = "intro",
    paused = false,
    view = null,
    frame = 0,
    last = 0,
    accumulator = 0,
    hudAt = 0,
    checkpointAt = 0,
    resultAt = 0,
    noticeUntil = 0,
    radioUntil = 0,
    heldBoost = false,
    motor = true,
    touchAim = null,
    mouseAim = 0,
    mousePointer = null,
    mouseCut = false,
    saveOk = true,
    soundNode = null,
    difficulty = { key: "normal", label: "NORMAL" },
    chapter = 0,
    storyAt = 0,
    storyChars = -1,
    module = "engine",
    tier = 1,
    purchaseQuip = "",
    lastRadio = -100,
    mutedVoice = false,
    touchUI = matchMedia("(pointer:coarse)").matches,
    wasPausedForOptions = false,
    expanded = false,
    fullscreenBusy = false,
    lastFullscreenExit = -10000;
  try {
    profile = P.cleanProfile(JSON.parse(localStorage.getItem(D.key) || "null"));
  } catch (e) {}
  const esc = (s) =>
      String(s).replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
      ),
    fmt = (n) => Math.floor(Number(n) || 0).toLocaleString("pt-BR"),
    alt = (n) =>
      n < 1000
        ? fmt(n) + " m"
        : (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) +
          " km";
  const story = [
    {
      title: "UMA IDEIA|QUASE BOA.",
      who: "DR. PELICANO",
      tag: "CIENTISTA. PROVAVELMENTE.",
      text: "Ah, você veio! Excelente. Preciso de um piloto com reflexos rápidos... e uma definição bastante flexível de segurança.",
    },
    {
      title: "PRÓXIMA PARADA:|A LUA.",
      who: "DR. PELICANO",
      tag: "DIRETOR, MECÂNICO E ÚNICO FUNCIONÁRIO",
      text: "Eu sou o doutor Pelicano! Depois de anos de pesquisa, três torradeiras e um pequeno incêndio, construí o P–87. Nosso destino? Aquela pedra enorme ali no céu!",
    },
    {
      title: "ISSO VAI|MESMO VOAR?",
      who: "VOCÊ",
      tag: "PILOTO VOLUNTÁRIO. AGORA JÁ ERA.",
      text: "Doutor... esse tanque era uma panela de pressão? E por que tem um parafuso sobrando na minha cadeira?",
    },
    {
      title: "DETALHES|DE ENGENHARIA.",
      who: "DR. PELICANO",
      tag: "CONFIANÇA: 100% / ORÇAMENTO: QUASE ZERO",
      text: "Peças sobressalentes! Um sinal de eficiência. Começamos com um protótipo modesto: suba, recolha dinheiro e combustível e volte para a bancada. Cada tentativa financia a próxima.",
    },
    {
      title: "PILOTE.|NÃO ABRACE AVIÕES.",
      who: "DR. PELICANO",
      tag: "BREVE TREINAMENTO DE SOBREVIVÊNCIA",
      text: "No computador, aponte o cursor para guiar o foguete e segure o clique para os propulsores. Aproxime o cursor dele para cortar o motor. No celular, use o campo de arraste e os botões!",
    },
    {
      title: "A CIÊNCIA|CHAMA!",
      who: "DR. PELICANO",
      tag: "PODE APERTAR O BOTÃO VERMELHO",
      text: "Balões, aviões e nuvens elétricas? O céu está um pouquinho ocupado. Nada que bons reflexos não resolvam! Vamos testar, melhorar as peças e colocar o primeiro Pelicano na Lua!",
    },
  ];
  function save() {
    if (flight && !flight.ended) profile.pending = flight.save();
    try {
      localStorage.setItem(D.key, JSON.stringify(profile));
      saveOk = true;
    } catch (e) {
      saveOk = false;
    }
    $("#seleneSaveStatus").textContent = saveOk
      ? "SALVO NESTE NAVEGADOR"
      : "SEM ARMAZENAMENTO · MANTENHA ESTA ABA ABERTA";
  }
  function tone(f, d = 0.12) {
    window.arcadeSound?.tone(f, d, "triangle", 0.035);
  }
  function stopVoice() {
    try {
      window.speechSynthesis?.cancel();
    } catch (e) {}
  }
  function speak(text) {
    stopVoice();
    if (
      !profile.settings.voice ||
      $("#sound").textContent.includes("OFF") ||
      !window.speechSynthesis ||
      !window.SpeechSynthesisUtterance
    )
      return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      u.rate = 1.05;
      u.pitch = 1.16;
      u.volume = 0.75;
      const voice =
        speechSynthesis
          .getVoices()
          .find((v) => v.lang.toLowerCase().startsWith("pt-br")) ||
        speechSynthesis.getVoices().find((v) => v.lang.startsWith("pt"));
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function syncSound() {
    for (const [a, b] of [
      ["seleneMusic", "music"],
      ["seleneSound", "sound"],
    ]) {
      const src = $("#" + b);
      $("#" + a).textContent = src.textContent;
      $("#" + a).setAttribute(
        "aria-pressed",
        src.getAttribute("aria-pressed") ||
          String(src.textContent.includes("ON")),
      );
    }
    const can = !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
    $("#seleneVoice").disabled = !can;
    $("#seleneVoice").textContent = can
      ? profile.settings.voice
        ? "VOZ ON"
        : "VOZ OFF"
      : "VOZ —";
    $("#seleneVoice").setAttribute(
      "aria-pressed",
      String(can && profile.settings.voice),
    );
    $("#seleneVoice").title = can
      ? "Voz sintetizada do navegador. As legendas permanecem visíveis."
      : "Este navegador não oferece síntese de voz; todas as falas estão legendadas.";
  }
  function audioStart() {
    audioStop();
    const s = window.arcadeSound;
    if (!s?.ctx || !s.master) return;
    try {
      const o = s.ctx.createOscillator(),
        g = s.ctx.createGain(),
        f = s.ctx.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.value = 50;
      f.type = "lowpass";
      f.frequency.value = 300;
      g.gain.value = 0;
      o.connect(f);
      f.connect(g);
      g.connect(s.master);
      o.start();
      soundNode = { o, g, f, ctx: s.ctx };
    } catch (e) {}
  }
  function audioUpdate() {
    if (!soundNode) return;
    const { ctx, o, g, f } = soundNode,
      running =
        active &&
        screen === "flight" &&
        !paused &&
        !flight.ended &&
        flight.countdown === 0,
      thrust = running && (flight.engineOn || flight.boostOn);
    o.frequency.setTargetAtTime(
      43 + Math.max(0, flight?.vy || 0) * 0.14 + (flight?.boostOn ? 32 : 0),
      ctx.currentTime,
      0.07,
    );
    f.frequency.setTargetAtTime(
      flight?.boostOn ? 1000 : 360,
      ctx.currentTime,
      0.08,
    );
    g.gain.setTargetAtTime(
      thrust ? (flight.boostOn ? 0.036 : 0.022) : 0,
      ctx.currentTime,
      0.05,
    );
  }
  function audioStop() {
    if (!soundNode) return;
    try {
      soundNode.o.stop();
      soundNode.g.disconnect();
    } catch (e) {}
    soundNode = null;
  }
  function notice(text, d = 2) {
    $("#seleneNotice").textContent = text;
    $("#seleneNotice").classList.add("visible");
    noticeUntil = (flight?.time || 0) + d;
  }
  function radio(text, d = 4) {
    if (!flight || flight.time - lastRadio < 3) return;
    lastRadio = flight.time;
    radioUntil = flight.time + d;
    $("#seleneRadio").hidden = true;
    $("#seleneRadioText").textContent = text;
  }
  function setScreen(value) {
    screen = value;
    modal.dataset.screen = value;
    const stage = canvas.parentElement,
      shell = modal.querySelector(".selene-shell");
    if (value === "workshop") $("#selenePreviewMount").appendChild(stage);
    else if (stage.parentElement !== shell)
      shell.insertBefore(stage, $("#seleneStory"));
    for (const [id, on] of [
      ["seleneWorkshop", value === "workshop"],
      ["seleneWorkshopHero", value === "workshop"],
      ["seleneStory", value === "intro"],
      ["seleneIntroHeading", value === "intro"],
      ["seleneFlightHUD", value === "flight"],
      ["seleneFlightControls", value === "flight" && touchUI],
      ["seleneReport", value === "result"],
      ["selenePause", value === "flight"],
    ])
      $("#" + id).hidden = !on;
    $("#selenePauseLayer").hidden = true;
    $("#seleneRadio").hidden = true;
    $("#seleneNotice").classList.remove("visible");
    window.TouchArcade?.releaseAll();
    modal.querySelector(".selene-shell").scrollTop = 0;
    view.options = { scene: value === "intro" ? "intro" : value, module };
    syncInputMode();
  }
  function intro() {
    flight = null;
    audioStop();
    paused = false;
    chapter = 0;
    setScreen("intro");
    showChapter();
    window.ArcadeAudio.music("menu");
  }
  function showChapter() {
    storyAt = performance.now();
    storyChars = -1;
    view.options = { scene: "intro", chapter };
    const c = story[chapter];
    $("#seleneChapter").textContent =
      "PRÓLOGO / " +
      String(chapter + 1).padStart(2, "0") +
      " — " +
      String(story.length).padStart(2, "0");
    $("#seleneIntroHeading h2").innerHTML = c.title
      .split("|")
      .map(esc)
      .join("<br>");
    $("#seleneSpeaker").textContent = c.who;
    $("#seleneDialogueMeta").textContent = c.tag;
    $("#seleneDialogue").textContent = "";
    $("#seleneStoryNext").textContent =
      chapter === story.length - 1 ? "VAMOS À BANCADA! →" : "CONTINUAR →";
    $("#seleneStoryNext").focus();
    speak(c.text);
  }
  function nextStory() {
    if (screen !== "intro") return;
    const c = story[chapter];
    if (storyChars < c.text.length) {
      storyAt = performance.now() - c.text.length * 23;
      storyChars = c.text.length;
      $("#seleneDialogue").textContent = c.text;
      return;
    }
    chapter++;
    if (chapter >= story.length) finishStory();
    else showChapter();
  }
  function finishStory() {
    profile.introSeen = true;
    stopVoice();
    save();
    workshop();
  }
  function moduleStat(id, levels) {
    const s = D.stats(levels);
    return {
      engine: [s.thrust, "EMP."],
      tank: [s.fuel, "L"],
      efficiency: [s.burn, "L/s"],
      booster: [s.booster, "s"],
      hull: [s.health, "HP"],
      stability: [s.control, "CTRL"],
      magnet: [s.magnet, "RAIO"],
      shield: [s.shield, "HP"],
    }[id];
  }
  function buildShop() {
    const labels = {
      hull: "CASCO",
      stability: "ALETAS",
      engine: "MOTOR",
      tank: "TANQUE",
      booster: "AUXILIAR",
      efficiency: "INJEÇÃO",
      magnet: "COLETOR",
      shield: "ESCUDO",
    };
    function row(id) {
      const u = D.upgrades.find((u) => u.id === id),
        current = profile.levels[id],
        highest = P.ownedLevel(profile, id);
      return (
        '<div class="selene-part-row"><button class="selene-equipped-part" id="module-' +
        id +
        '" data-module="' +
        id +
        '" type="button"><strong>' +
        labels[id] +
        '</strong><canvas data-part-paint="' +
        id +
        '" data-level="' +
        0 +
        '" aria-hidden="true"></canvas><small>' +
        (current === 0 ? "EM USO" : "ORIGINAL") +
        "</small></button>" +
        Array.from({ length: 6 }, (_, i) => {
          const v = i + 1,
            owned = v <= highest;
          return (
            '<button type="button" id="selene-part-' +
            id +
            "-" +
            v +
            '" class="selene-model-card ' +
            (owned ? "owned" : "") +
            '" data-model="' +
            id +
            '" data-tier="' +
            v +
            '" aria-pressed="false" title="' +
            u.name +
            " · " +
            Parts.names[id][v] +
            " · " +
            (owned ? "Adquirido" : "$" + fmt(D.cost(id, v - 1))) +
            '"><canvas data-part-paint="' +
            id +
            '" data-level="' +
            v +
            '" aria-hidden="true"></canvas><strong>' +
            Parts.names[id][v] +
            "</strong><small>" +
            (owned
              ? v === current
                ? "EM USO"
                : "ADQUIRIDO"
              : "$" + fmt(D.cost(id, v - 1))) +
            "</small></button>"
          );
        }).join("") +
        "</div>"
      );
    }
    $("#seleneModelRows").innerHTML = Parts.primary.map(row).join("");
    $("#seleneExtraRows").innerHTML = Parts.extra.map(row).join("");
    for (const c of modal.querySelectorAll("[data-part-paint]"))
      Parts.thumbnail(c, c.dataset.partPaint, +c.dataset.level);
    for (const b of modal.querySelectorAll("[data-module]"))
      b.onclick = () => {
        showModule(b.dataset.module, 0);
        b.focus();
      };
    for (const b of modal.querySelectorAll("[data-model]")) {
      b.onclick = () => {
        showModule(b.dataset.model, +b.dataset.tier);
        b.focus();
        tone(520, 0.05);
      };
      b.onmouseenter = () => previewModel(b.dataset.model, +b.dataset.tier);
      b.onmouseleave = () => previewModel(module, tier);
      b.onfocus = () => previewModel(b.dataset.model, +b.dataset.tier);
      b.onblur = () => previewModel(module, tier);
      b.onkeydown = (e) => {
        if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();
        const next = clamp(
          +b.dataset.tier + (e.key === "ArrowRight" ? 1 : -1),
          1,
          6,
        );
        showModule(b.dataset.model, next);
        $("#selene-part-" + b.dataset.model + "-" + next).focus();
      };
    }
  }
  function previewModel(id, level) {
    if (screen !== "workshop") return;
    const preview = { ...profile.levels, [id]: level };
    view.options = { scene: "workshop", module: id, previewLevels: preview };
    $("#selenePreviewBadge").hidden = level === profile.levels[id];
    $("#selenePreviewBadge").textContent = "PRÉVIA · " + Parts.names[id][level];
  }
  function showModule(id = module, newTier) {
    module = id;
    tier = newTier ?? profile.levels[id];
    const current = profile.levels[id],
      u = D.upgrades.find((u) => u.id === id),
      highest = P.ownedLevel(profile, id),
      owned = tier <= highest,
      installed = tier === current,
      price = owned ? 0 : D.cost(id, tier - 1),
      preview = { ...profile.levels, [id]: tier },
      a = moduleStat(id, profile.levels),
      b = moduleStat(id, preview),
      n = (v) =>
        Number.isInteger(v)
          ? fmt(v)
          : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    for (const cell of modal.querySelectorAll("[data-model]"))
      cell.setAttribute(
        "aria-pressed",
        String(cell.dataset.model === id && +cell.dataset.tier === tier),
      );
    for (const cell of modal.querySelectorAll("[data-module]"))
      cell.classList.toggle("selected", cell.dataset.module === id);
    $("#seleneModuleTag").textContent = u.tag + " / MODELO " + tier;
    $("#seleneModuleName").textContent = Parts.names[id][tier];
    $("#seleneModuleAbout").textContent = u.about;
    $("#seleneConfigStats").innerHTML =
      "<span><small>ATUAL</small><b>" +
      n(a[0]) +
      " <em>" +
      a[1] +
      "</em></b></span><i>→</i><span><small>PRÉVIA</small><b>" +
      n(b[0]) +
      " <em>" +
      b[1] +
      "</em></b></span>";
    $("#seleneBuy").disabled =
      !!profile.pending || installed || (!owned && profile.money < price);
    $("#seleneBuy").textContent = installed
      ? "MODELO EQUIPADO"
      : profile.pending
        ? "VOO EM ANDAMENTO"
        : owned
          ? "EQUIPAR MODELO"
          : "COMPRAR · $" + fmt(price);
    $("#seleneShopMessage").textContent = profile.pending
      ? "Retome ou encerre o voo antes de trocar peças."
      : installed
        ? "Selecione outro modelo para comparar."
        : owned
          ? "Esta peça já é sua. Equipar não gasta créditos."
          : profile.money < price
            ? "FALTAM $" + fmt(price - profile.money)
            : "Comprar e equipar no próximo voo.";
    previewModel(id, tier);
  }
  function workshop() {
    stopVoice();
    paused = false;
    heldBoost = false;
    touchAim = null;
    flight = null;
    audioStop();
    setScreen("workshop");
    $("#seleneDay").textContent =
      "DIA " + (profile.pending ? profile.pending.id : profile.day + 1);
    $("#seleneBank").textContent = "$" + fmt(profile.money);
    $("#seleneBest").textContent = alt(profile.best);
    $("#seleneLaunch").textContent = profile.pending
      ? "RETOMAR VOO ↗"
      : profile.moon
        ? "VOAR DE NOVO ↗"
        : "LANÇAR · DIA " + (profile.day + 1) + " ↗";
    $("#selenePending").hidden = !profile.pending;
    $("#seleneProfessorNote").textContent =
      purchaseQuip ||
      (profile.pending
        ? "Nosso piloto ainda está lá em cima. Não vamos desmontar o motor durante o voo, combinado?"
        : profile.moon
          ? "Um pequeno passo para um piloto, um salto enorme para a reputação deste laboratório!"
          : profile.day === 0
            ? "O orçamento está curto. Vamos voar primeiro, conseguir uma bolsa e melhorar esse foguetinho!"
            : profile.best < 3000
              ? "Já temos dados! Motor e tanque ajudam a subir; casco ajuda a voltar inteiro."
              : profile.best < 9000
                ? "O céu ficou mais ocupado. Tire o pé do motor antes de bater e procure tanques de combustível."
                : "O espaço é enorme. Invista em autonomia, proteja o casco e use os anéis de impulso.");
    purchaseQuip = "";
    buildShop();
    showModule(module, profile.levels[module]);
    $("#seleneMedalCount").textContent =
      profile.contracts.length + " / " + D.contracts.length;
    $("#seleneContracts").innerHTML = D.contracts
      .map(
        (c) =>
          '<li class="' +
          (profile.contracts.includes(c.id) ? "done" : "") +
          '"><span>' +
          (profile.contracts.includes(c.id) ? "★ CONQUISTADO" : "☆ BOLSA") +
          "</span><b>" +
          c.name +
          "</b><p>" +
          c.text +
          "</p><small>+$" +
          fmt(c.reward) +
          "</small></li>",
      )
      .join("");
    $("#seleneHistory").innerHTML =
      profile.history
        .slice()
        .reverse()
        .slice(0, 8)
        .map(
          (r) =>
            "<tr><td>" +
            fmt(r.day) +
            "</td><td>" +
            alt(r.height) +
            "</td><td>+$" +
            fmt(r.total) +
            "</td><td>" +
            esc(r.reason) +
            "</td></tr>",
        )
        .join("") ||
      '<tr><td colspan="4">Ainda não temos dados. Aperte LANÇAR para começar.</td></tr>';
    for (const b of document.querySelectorAll("[data-selene-control]"))
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.seleneControl === profile.settings.control),
      );
    save();
    $("#seleneLaunch").focus();
    window.ArcadeAudio.music("menu");
  }
  function launch() {
    stopVoice();
    window.arcadeSound?.init();
    window.ArcadeAudio.prepare();
    flight = profile.pending
      ? P.Flight.restore(profile.pending)
      : P.launch(profile, difficulty.key);
    motor = flight.input.thrust;
    flight.motorRequested = motor;
    touchAim = null;
    mouseAim = 0;
    mousePointer = null;
    mouseCut = false;
    heldBoost = false;
    paused = false;
    last = 0;
    accumulator = 0;
    checkpointAt = 0;
    lastRadio = -100;
    view.scale = 1;
    view.particles = [];
    view.popups = [];
    view.trail = [];
    setScreen("flight");
    $("#selenePause").textContent = "PAUSAR Ⅱ";
    audioStart();
    window.ArcadeAudio.music("pilot");
    save();
    updateHUD();
    radio(
      flight.id === 1
        ? matchMedia("(pointer:coarse)").matches
          ? "Aqui é Pelicano! Arraste no campo para pilotar e use os botões com outro dedo!"
          : profile.settings.control === "mouse"
            ? "Aqui é Pelicano! Aponte o cursor para pilotar. Segure o clique para dar impulso!"
            : "Aqui é Pelicano! Cima dá impulso. Baixo corta o motor. E desvie dos aviões, por favor!"
        : "Todos os parafusos conferidos. Bem... a maioria. Boa viagem!",
      6,
    );
    $("#selenePause").focus();
    if (flight.ended) finish();
  }
  function finish() {
    if (screen === "result") return;
    const report = P.settle(profile, flight);
    if (!report.ok) {
      workshop();
      return;
    }
    audioStop();
    heldBoost = false;
    touchAim = null;
    save();
    setScreen("result");
    resultAt = performance.now();
    $("#seleneResultEyebrow").textContent =
      "RELATÓRIO DE TESTE / DIA " + report.day;
    $("#seleneResultTitle").textContent = report.win
      ? "PELICANO, CHEGAMOS!"
      : report.hits > 4
        ? "UM POUSO... CRIATIVO."
        : report.height > 7000
          ? "ESTAMOS CHEGANDO LÁ!"
          : "ISSO TAMBÉM É CIÊNCIA.";
    const quip = report.win
      ? "Eu sabia! Eu sabia! Ignore as minhas vinte e sete cartas de despedida. Você colocou o Pelicano na Lua!"
      : report.hits > 4
        ? "O foguete não foi projetado para colecionar aviões. Mas os dados são excelentes! Vamos reforçar o casco e tentar outra vez."
        : report.height < 1500
          ? "Subiu! E voltou! Na ciência, chamamos isso de resultado promissor. Agora temos dinheiro para uma peça de verdade."
          : report.height < 7000
            ? "Nada de fracasso: descobrimos mais uma maneira de não chegar à Lua. Ajuste o motor, aumente o tanque e vamos de novo!"
            : "Olhe a altitude! A Lua está ficando preocupada. Precisamos de mais autonomia e um voo bem cuidadoso.";
    $("#seleneResultQuip").textContent = quip;
    $("#seleneResultReason").textContent = report.reason;
    $("#seleneResultNumbers").innerHTML = [
      ["ALTITUDE MÁXIMA", alt(report.height)],
      ["VOO & COLETA", "$" + fmt(report.income)],
      ["BOLSAS & MEDALHAS", "$" + fmt(report.contracts)],
      ["RENDA TOTAL", "+$" + fmt(report.total)],
    ]
      .map(([n, v]) => "<span><small>" + n + "</small><b>" + v + "</b></span>")
      .join("");
    $("#seleneNewContracts").textContent = report.rewards.length
      ? "★ " +
        report.rewards
          .map((id) => D.contracts.find((c) => c.id === id).name)
          .join(" · ")
      : "Os créditos foram adicionados ao caixa do laboratório.";
    $("#seleneResultBank").textContent = "CAIXA: $" + fmt(profile.money);
    $("#seleneNextDay").focus();
    window.ArcadeAudio.music("menu");
    if (report.win)
      [660, 880, 1320].forEach((f, i) =>
        setTimeout(() => {
          if (active && screen === "result") tone(f, 0.22);
        }, i * 120),
      );
    else window.ArcadeAudio.effect("gameover", 0.35);
    speak(quip);
    $("#gameStatus").textContent =
      "Voo encerrado. " +
      report.total +
      " créditos recebidos. Enter abre a oficina.";
  }
  function pause(force) {
    if (!active || screen !== "flight" || !flight || flight.ended) return;
    paused = typeof force === "boolean" ? force : !paused;
    heldBoost = false;
    touchAim = null;
    flight.input.boost = false;
    flight.input.steer = 0;
    $("#selenePauseLayer").hidden = !paused;
    modal.classList.toggle("paused", paused);
    $("#selenePause").textContent = paused ? "CONTINUAR ▶" : "PAUSAR Ⅱ";
    last = 0;
    save();
    audioUpdate();
    if (paused) $("#seleneResume").focus();
  }
  function abort() {
    if (profile.pending && !flight) flight = P.Flight.restore(profile.pending);
    if (!flight) return;
    flight.finish(false, "RESGATE SOLICITADO");
    finish();
  }
  function event(e) {
    view.effect(e, flight);
    if (e.type === "disabled") {
      // The status pill already explains the outage; avoid a second HUD banner.
      window.arcadeSound?.noise(0.18, 0.06, 1600);
    }
    if (e.type === "reboot") {
      notice("SISTEMAS RESTABELECIDOS", 1.5);
      tone(850, 0.1);
    }
    if (e.type === "countdown") tone(e.value ? 400 : 880, 0.15);
    if (e.type === "hit") {
      window.ArcadeAudio.effect("hit", 0.28);
      notice(
        e.absorbed && !e.loss
          ? "ESCUDO ABSORVEU O IMPACTO"
          : "IMPACTO! −" + Math.ceil(e.loss) + " CASCO",
        1.2,
      );
      if (e.kind === "storm")
        radio("Isso não era uma nuvem de algodão! Desvie das próximas.", 4);
      else radio("Ai! Reduza antes de bater e corrija a inclinação!", 3);
    }
    if (e.type === "collision") {
      window.arcadeSound?.noise(
        e.soft ? 0.12 : 0.24,
        e.soft ? 0.045 : 0.11,
        e.soft ? 2400 : 700,
      );
      if (!e.soft) tone(120, 0.16);
    }
    if (e.type === "destroy") {
      window.arcadeSound?.noise(0.65, 0.18, 450);
      radio("Cápsula de emergência! Já estou chamando o resgate!", 3);
    }
    if (e.type === "pickup") tone(e.kind === "cash" ? 880 : 1150, 0.08);
    if (e.type === "zone") {
      window.ArcadeAudio.effect("warp", 0.18);
      notice("NOVA CAMADA! " + e.name + " · +COMBUSTÍVEL", 3);
      radio("Novo marco! O tanque recebeu suprimentos. Continue!", 4);
    }
    if (e.type === "gate") {
      window.ArcadeAudio.effect("warp", 0.22);
      notice("ANEL DE ACELERAÇÃO!", 1.2);
    }
    if (e.type === "approach") {
      notice("LUA À VISTA · PREPARANDO POUSO!", 4);
      radio(
        "Eu estou vendo você! Ou é uma mancha na minha lente? Não, é você!",
        4,
      );
    }
    if (e.type === "finish") finish();
  }
  function updateHUD() {
    if (!flight) return;
    const f = flight;
    $("#seleneFlightDay").textContent = "DIA " + f.id;
    $("#seleneRouteValue").textContent = alt(Math.max(0, f.y - D.launchY));
    $("#seleneZone").textContent = D.zone(f.y).short;
    const pay = P.earnings(profile, f);
    $("#seleneFlightCash").textContent = "COLETA $" + fmt(f.cash);
    $("#seleneIncomeTotal").textContent = "RENDA PREVISTA $" + fmt(pay.total);
    $("#seleneIncomeBreakdown").textContent = "VOO $" + fmt(pay.flight) + " · CONQUISTAS $" + fmt(pay.contracts);
    $("#seleneMoonPercent").textContent = Math.min(100, f.maxY / D.goal * 100).toFixed(1).replace(".", ",") + "%";
    const earnedIds = f.announcedContracts || (f.announcedContracts = []);
    for (const reward of pay.rewards) if (!earnedIds.includes(reward.id) && f.countdown <= 0) {
      earnedIds.push(reward.id);
      notice("CONQUISTA · " + (reward.name || reward.title || reward.id) + " +$" + reward.reward, 3);
      tone(1050, .12);
    }
    $("#seleneFlightTime").textContent =
      Math.floor(f.time / 60) +
      ":" +
      String(Math.floor(f.time % 60)).padStart(2, "0");
    for (const [id, v, max] of [
      ["Fuel", f.fuel, f.stats.fuel],
      ["Hull", f.hp, f.stats.health],
      ["Aux", f.aux, f.stats.booster],
      ["Shield", f.shield, Math.max(25, f.stats.shield)],
    ]) {
      $("#selene" + id + "Bar").style.width =
        clamp((v / max) * 100, 0, 100) + "%";
      $("#selene" + id + "Value").textContent =
        Math.round((v / max) * 100) + "%";
    }
    $("#seleneJourneyBar").style.height =
      Math.min(100, (f.maxY / D.goal) * 100) + "%";
    $("#seleneAltitudeMarker").style.bottom =
      clamp((f.y / D.goal) * 100, 0, 100) + "%";
    $("#seleneSpeed").textContent = fmt(Math.hypot(f.vx, f.vy)) + " m/s";
    $("#seleneThrust").textContent =
      f.disabledFor > 0
        ? "SISTEMAS OFF"
        : motor
          ? "MOTOR LIGADO"
          : "MOTOR DESLIGADO";
    $("#seleneThrust").setAttribute("aria-pressed", String(motor));
    $("#seleneShieldMeter").hidden = f.stats.shield <= 0 && f.shield <= 0;
    $("#seleneSystemStatus").hidden = f.disabledFor <= 0;
    $("#seleneSystemStatus").textContent =
      f.disabledFor > 0
        ? "SISTEMAS OFF · " + f.disabledFor.toFixed(1).replace(".", ",") + " s"
        : "";
    $("#seleneBoost").disabled =
      f.aux <= 0 || f.countdown > 0 || paused || f.crashing > 0;
    $("#seleneBoost").setAttribute("aria-disabled", String(f.disabledFor > 0));
    $("#seleneThrust").setAttribute("aria-disabled", String(f.disabledFor > 0));
    $("#seleneBoost").classList.toggle("held", heldBoost);
    $("#seleneFlightStatus").textContent =
      f.disabledFor > 0
        ? "SISTEMAS DESLIGADOS"
        : f.crashing
          ? "CÁPSULA EJETADA · RESGATE A CAMINHO"
          : f.approach
            ? "POUSO ASSISTIDO"
            : f.fuel <= 0
              ? "SEM COMBUSTÍVEL · USE O AUXILIAR OU SOLICITE RESGATE"
              : profile.settings.control === "mouse"
                ? "APONTE PARA PILOTAR · CLIQUE SEGURADO: PROPULSOR"
                : "A/D GIRAM · ↓ CORTA MOTOR · ↑ PROPULSOR";
    if (f.time > noticeUntil) $("#seleneNotice").classList.remove("visible");
    if (f.time > radioUntil) $("#seleneRadio").hidden = true;
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
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
    if (screen === "intro") {
      const c = story[chapter],
        chars = Math.min(c.text.length, Math.floor((ms - storyAt) / 23));
      if (chars !== storyChars) {
        storyChars = chars;
        $("#seleneDialogue").textContent = c.text.slice(0, chars);
        if (
          chars % 5 === 0 &&
          (!profile.settings.voice || !window.speechSynthesis)
        )
          tone(180 + (chars % 7) * 25, 0.025);
      }
    }
    if (screen === "flight" && flight && !paused) {
      const keyboard =
        (keys.ArrowRight || keys.d || keys.D ? 1 : 0) -
        (keys.ArrowLeft || keys.a || keys.A ? 1 : 0);
      if (profile.settings.control === "mouse" && mousePointer) {
        const rect = canvas.getBoundingClientRect(),
          p = view.pose;
        const x = ((mousePointer.x - rect.left) / rect.width) * p.w,
          y = ((mousePointer.y - rect.top) / rect.height) * p.h;
        const dx = x - p.x,
          dy = p.y - y;
        mouseCut = Math.hypot(dx, dy) < 65;
        if (!mouseCut) mouseAim = Math.atan2(dx, dy);
      }
      flight.input.freeAim =
        touchAim === null && profile.settings.control === "mouse";
      flight.input.steer = keyboard;
      flight.input.aimAngle =
        touchAim !== null
          ? touchAim
          : profile.settings.control === "mouse"
            ? mouseAim
            : null;
      flight.motorRequested = motor;
      flight.input.thrust =
        motor &&
        !(keys.ArrowDown || keys.s || keys.S) &&
        !(profile.settings.control === "mouse" && mouseCut);
      flight.input.boost = heldBoost;
      accumulator += dt;
      let n = 0;
      while (accumulator >= 1 / 60 && n++ < 8) {
        flight.step(1 / 60);
        accumulator -= 1 / 60;
      }
      for (const e of flight.drain()) event(e);
      if (ms - checkpointAt > 2000) {
        save();
        checkpointAt = ms;
      }
      if (flight.ended && screen === "flight") finish();
      if (
        flight.fuel < flight.stats.fuel * 0.15 &&
        flight.fuel > 0 &&
        flight.time - lastRadio > 18
      )
        radio(
          "Combustível baixo! Procure os galões ou corte o motor para economizar.",
          5,
        );
    }
    if (ms - hudAt > 90) {
      updateHUD();
      hudAt = ms;
    }
    const off = $("#sound").textContent.includes("OFF");
    if (off && !mutedVoice) stopVoice();
    mutedVoice = off;
    audioUpdate();
    view.draw(
      screen === "workshop" || screen === "intro" ? null : flight,
      profile,
      ms,
      paused ? 0 : dt || 0.016,
    );
  }
  function toggleMotor() {
    if (screen !== "flight" || paused || flight?.disabledFor > 0) return;
    motor = !motor;
    flight.motorRequested = motor;
    tone(motor ? 700 : 300, 0.08);
    updateHUD();
  }
  function syncInputMode() {
    modal.dataset.input = touchUI ? "touch" : "mouse";
    $("#seleneFlightControls").hidden = screen !== "flight" || !touchUI;
  }
  function ownsFullscreen() {
    const el = document.fullscreenElement || document.webkitFullscreenElement;
    return el === modal || (!!el && modal.contains(el));
  }
  function syncFullscreen() {
    const on = ownsFullscreen() || expanded;
    modal.classList.toggle("selene-expanded", expanded);
    $("#seleneFullscreen").setAttribute("aria-pressed", String(on));
    $("#seleneFullscreen").textContent = on
      ? "⛶ SAIR DA TELA CHEIA"
      : "⛶ TELA CHEIA";
    $("#seleneFullscreen").setAttribute(
      "aria-label",
      on ? "Sair da tela cheia" : "Entrar em tela cheia",
    );
  }
  async function toggleFullscreen() {
    if (!active || fullscreenBusy) return;
    fullscreenBusy = true;
    try {
      if (ownsFullscreen()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit?.call(document);
        lastFullscreenExit = performance.now();
      } else if (expanded) {
        expanded = false;
        lastFullscreenExit = performance.now();
      } else if (modal.requestFullscreen) {
        try {
          await modal.requestFullscreen({ navigationUI: "hide" });
        } catch (e) {
          expanded = true;
          $("#seleneViewStatus").textContent =
            "Modo expandido ativado; o navegador mantém suas barras.";
        }
      } else if (modal.webkitRequestFullscreen) {
        modal.webkitRequestFullscreen();
      } else {
        expanded = true;
        $("#seleneViewStatus").textContent =
          "Modo expandido ativado; o navegador mantém suas barras.";
      }
    } finally {
      syncFullscreen();
      mousePointer = null;
      mouseAim = flight?.angle || 0;
      setTimeout(() => (fullscreenBusy = false), 200);
    }
  }
  function openOptions() {
    if (!active) return;
    wasPausedForOptions = paused;
    if (screen === "flight" && !paused) pause(true);
    syncSound();
    $("#seleneOptionsDone").textContent =
      screen === "flight" ? "CONTINUAR VOO" : "VOLTAR";
    $("#seleneOptionsDialog").showModal();
    $("#seleneCloseOptions").focus();
  }
  function closeOptions(resume = true) {
    if ($("#seleneOptionsDialog").open) $("#seleneOptionsDialog").close();
    if (resume && screen === "flight" && !wasPausedForOptions) pause(false);
  }
  function handleEscape() {
    if (!active) return false;
    if ($("#seleneOptionsDialog").open) {
      closeOptions();
      return true;
    }
    if (ownsFullscreen() || expanded) {
      toggleFullscreen();
      return true;
    }
    return performance.now() - lastFullscreenExit < 500;
  }
  $("#seleneFullscreen").onclick = toggleFullscreen;
  $("#seleneSettings").onclick = openOptions;
  $("#seleneCloseOptions").onclick = () => closeOptions();
  $("#seleneOptionsDone").onclick = () => closeOptions();
  $("#seleneOptionsDialog").addEventListener("cancel", (e) => {
    e.preventDefault();
    closeOptions();
  });
  $("#seleneOptionsDialog").addEventListener("click", (e) => {
    if (e.target === $("#seleneOptionsDialog")) closeOptions();
  });
  for (const event of ["fullscreenchange", "webkitfullscreenchange"])
    document.addEventListener(event, () => {
      if (!ownsFullscreen()) lastFullscreenExit = performance.now();
      syncFullscreen();
      mousePointer = null;
      mouseAim = flight?.angle || 0;
    });
  window.addEventListener("resize", syncInputMode);
  window.addEventListener("pointerdown", (e) => {
    if (!active) return;
    const next =
      e.pointerType === "touch"
        ? true
        : e.pointerType === "mouse"
          ? false
          : touchUI;
    if (next !== touchUI) {
      touchUI = next;
      if (!touchUI) touchAim = null;
      syncInputMode();
    }
  });
  $("#seleneLaunch").onclick = launch;
  $("#seleneReplay").onclick = intro;
  $("#seleneStoryNext").onclick = nextStory;
  $("#seleneSkipIntro").onclick = finishStory;
  $("#selenePause").onclick = () => pause();
  $("#seleneResume").onclick = () => pause(false);
  $("#seleneToWorkshop").onclick = () => {
    save();
    workshop();
  };
  $("#seleneAbort").onclick = abort;
  $("#seleneEndPending").onclick = abort;
  $("#seleneNextDay").onclick = () => {
    if (performance.now() - resultAt > 350) workshop();
  };
  $("#seleneThrust").onclick = toggleMotor;
  $("#seleneBuy").onclick = () => {
    const result =
      tier <= P.ownedLevel(profile, module)
        ? P.equip(profile, module, tier)
        : P.purchase(profile, module, tier);
    if (result.ok) {
      purchaseQuip = [
        "Agora sim! Isso parece uma peça de foguete. E quase não soltou fumaça!",
        "Instalado! A garantia termina assim que sair do chão.",
        "Uma melhoria perfeitamente calculada. Desta vez eu usei calculadora.",
      ][(profile.day + tier) % 3];
      tone(990);
      save();
      workshop();
    } else $("#seleneShopMessage").textContent = result.reason;
  };
  for (const b of document.querySelectorAll("[data-selene-control]"))
    b.onclick = () => {
      profile.settings.control = b.dataset.seleneControl;
      save();
      if (screen === "workshop") workshop();
      else {
        for (const button of modal.querySelectorAll("[data-selene-control]"))
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.seleneControl === profile.settings.control),
          );
        mousePointer = null;
        mouseAim = flight?.angle || 0;
        updateHUD();
      }
    };
  const boostButton = $("#seleneBoost");
  boostButton.addEventListener("pointerdown", (e) => {
    if (screen !== "flight" || paused || flight?.disabledFor > 0) return;
    e.preventDefault();
    boostButton.setPointerCapture(e.pointerId);
    heldBoost = true;
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    boostButton.addEventListener(type, () => (heldBoost = false));
  $("#seleneMusic").onclick = () => {
    $("#music").click();
    syncSound();
  };
  $("#seleneSound").onclick = () => {
    $("#sound").click();
    if ($("#sound").textContent.includes("OFF")) stopVoice();
    syncSound();
  };
  $("#seleneVoice").onclick = () => {
    profile.settings.voice = !profile.settings.voice;
    save();
    syncSound();
    if (!profile.settings.voice) stopVoice();
    else if (screen === "intro") speak(story[chapter].text);
  };
  $("#seleneNewCampaign").onclick = () => {
    if ($("#seleneOptionsDialog").open) closeOptions(false);
    $("#seleneResetDialog").showModal();
  };
  $("#seleneKeepCampaign").onclick = () => $("#seleneResetDialog").close();
  $("#seleneConfirmReset").onclick = () => {
    profile = P.fresh();
    flight = null;
    save();
    $("#seleneResetDialog").close();
    intro();
  };
  canvas.addEventListener("pointermove", (e) => {
    if (
      !active ||
      screen !== "flight" ||
      paused ||
      e.pointerType !== "mouse" ||
      profile.settings.control !== "mouse"
    )
      return;
    mousePointer = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (
      e.pointerType === "mouse" &&
      e.button === 0 &&
      active &&
      screen === "flight" &&
      !paused &&
      profile.settings.control === "mouse"
    ) {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      heldBoost = true;
    }
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(type, () => (heldBoost = false));
  canvas.addEventListener("pointerleave", () => {
    mouseCut = false;
    mousePointer = null;
  });
  window.addEventListener("keydown", (e) => {
    if (!active || $("#seleneResetDialog").open) return;
    if (e.code === "KeyF" && !e.repeat && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toggleFullscreen();
      return;
    }
    if ($("#seleneOptionsDialog").open) return;
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code))
      touchAim = null;
    if (screen === "flight" && e.code === "KeyP" && !e.repeat) {
      e.preventDefault();
      pause();
    }
    if (
      screen === "flight" &&
      !paused &&
      ["Space", "ArrowUp", "KeyW"].includes(e.code)
    ) {
      e.preventDefault();
      heldBoost = true;
    }
    if (screen === "flight" && !paused && e.code === "KeyE" && !e.repeat) {
      e.preventDefault();
      toggleMotor();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) heldBoost = false;
  });
  window.addEventListener("blur", () => {
    heldBoost = false;
    touchAim = null;
    if (active && screen === "flight" && !fullscreenBusy) pause(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopVoice();
      if (active && screen === "flight" && !fullscreenBusy) pause(true);
    }
  });
  window.addEventListener("pagehide", save);
  window.SeleneGame = {
    open(d) {
      difficulty = d;
      active = true;
      modal.style.display = "flex";
      document.body.classList.add("selene-open");
      if (!view) view = new R.View(canvas);
      syncSound();
      syncFullscreen();
      syncInputMode();
      last = 0;
      if (profile.introSeen || profile.pending) workshop();
      else intro();
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    },
    close() {
      if ($("#seleneOptionsDialog").open) $("#seleneOptionsDialog").close();
      if (ownsFullscreen()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        try {
          const result = exit?.call(document);
          result?.catch?.(() => {});
        } catch (e) {}
      }
      expanded = false;
      syncFullscreen();
      if (flight && !flight.ended) save();
      active = false;
      paused = true;
      heldBoost = false;
      touchAim = null;
      stopVoice();
      audioStop();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      modal.style.display = "none";
      document.body.classList.remove("selene-open");
    },
    restart() {
      if (!active) return false;
      if (screen === "intro") {
        nextStory();
        return true;
      }
      if (screen === "workshop") {
        launch();
        return true;
      }
      if (screen === "result" && performance.now() - resultAt > 350) {
        workshop();
        return true;
      }
      return false;
    },
    steer(x) {
      touchAim = clamp((x - 410) / 180, -1, 1) * 1.1;
    },
    release() {
      if (touchAim !== null) touchAim = 0;
    },
    get active() {
      return active;
    },
    get flying() {
      return active && screen === "flight" && !paused && !flight?.ended;
    },
    get screen() {
      return screen;
    },
    get selection() {
      return {
        module,
        tier,
        previewLevels: { ...view?.options?.previewLevels },
      };
    },
    get profile() {
      return profile;
    },
    get snapshot() {
      return flight;
    },
    pause,
    toggleFullscreen,
    handleEscape,
    closeOptions,
    get inputMode() {
      return touchUI ? "touch" : "mouse";
    },
    get fullscreen() {
      return ownsFullscreen() || expanded;
    },
    preview: R.preview,
  };
})();
