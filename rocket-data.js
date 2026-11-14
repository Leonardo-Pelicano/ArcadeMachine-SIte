/* Projeto Selene — original arcade flight campaign, inspired by launch/upgrade games. */
(function (root) {
  "use strict";
  const upgrades = [
    {
      id: "engine",
      name: "MOTOR PRINCIPAL",
      tag: "PROPULSÃO",
      base: 100,
      growth: 1.8,
      color: "#9aead7",
      about: "Mais empuxo e velocidade para atravessar as camadas.",
      max: 6,
    },
    {
      id: "tank",
      name: "TANQUE DE COMBUSTÍVEL",
      tag: "AUTONOMIA",
      base: 85,
      growth: 1.8,
      color: "#a6c7f5",
      about: "Mais combustível em cada lançamento.",
      max: 6,
    },
    {
      id: "efficiency",
      name: "INJEÇÃO ECONÔMICA",
      tag: "EFICIÊNCIA",
      base: 125,
      growth: 1.8,
      color: "#b7acf0",
      about: "Reduz o consumo do motor principal.",
      max: 6,
    },
    {
      id: "booster",
      name: "PROPULSORES AUXILIARES",
      tag: "IMPULSO",
      base: 115,
      growth: 1.8,
      color: "#eac18d",
      about: "Reserva independente para subir rápido ou salvar uma queda.",
      max: 6,
    },
    {
      id: "hull",
      name: "CASCO REFORÇADO",
      tag: "INTEGRIDADE",
      base: 80,
      growth: 1.8,
      color: "#f2a2b8",
      about: "Suporta mais impactos e reduz os danos recebidos.",
      max: 6,
    },
    {
      id: "stability",
      name: "CONTROLE & ALETAS",
      tag: "CONTROLE",
      base: 95,
      growth: 1.8,
      color: "#97dbe8",
      about: "Direção mais precisa e menor efeito do vento.",
      max: 6,
    },
    {
      id: "magnet",
      name: "COLETOR MAGNÉTICO",
      tag: "RECUPERAÇÃO",
      base: 75,
      growth: 1.8,
      color: "#e7d493",
      about: "Atrai dinheiro e suprimentos próximos.",
      max: 6,
    },
    {
      id: "shield",
      name: "ESCUDO DE PARTÍCULAS",
      tag: "DEFESA",
      base: 150,
      growth: 1.8,
      color: "#a9e4cf",
      about: "Absorve danos e recarrega depois de um período sem impactos.",
      max: 6,
    },
  ];
  const fuelGrades = [
    {tier:1,name:"PADRÃO",tag:"P",scale:1,radius:24,fraction:.18,liters:2,color:"#d67a60"},
    {tier:2,name:"GRANDE",tag:"G",scale:1.35,radius:31,fraction:.29,liters:4,color:"#dab665"},
    {tier:3,name:"EXTRA GRANDE",tag:"XL",scale:1.65,radius:38,fraction:.40,liters:5,color:"#8ed6df"},
  ];
  function fuelTierAt(height){return height>=28000?3:height>=12000?2:1;}
  function fuelGrade(item){const tier=Number.isInteger(item?.fuelTier)&&item.fuelTier>=1&&item.fuelTier<=3?item.fuelTier:fuelTierAt(Number(item?.y)||0);return fuelGrades[tier-1];}
  const milestones = [
    {height:3000,name:"ACIMA DAS NUVENS",reward:50},
    {height:7000,name:"LIMITE DA ATMOSFERA",reward:90},
    {height:12000,name:"ÓRBITA BAIXA",reward:130},
    {height:19000,name:"ROTA DE TRANSFERÊNCIA",reward:180},
    {height:28000,name:"ESPAÇO PROFUNDO",reward:260},
    {height:38000,name:"CORREDOR TK–87",reward:360},
    {height:48000,name:"ALTITUDE DE INTERCEPTAÇÃO",reward:500},
  ];
  function supplies(height) {
    const p=Math.max(0,Math.min(1,height/48000));
    return {chance:.84*Math.exp(-p*2.4),fuelWeight:.42*(1-p)+.10*p,repairWeight:.13*(1-p)+.05*p,spread:460+220*p};
  }
  const contracts = [
    {id:"arcade_memory",name:"UM CRÉDITO. OUTRA GALÁXIA.",text:"Encontre um sinal perdido do Arcade Zone.",kind:"relic",target:1,reward:87},
    {
      id: "first",
      name: "PRIMEIRO CONTATO",
      text: "Complete seu primeiro voo.",
      kind: "flights",
      target: 1,
      reward: 75,
    },
    {
      id: "clouds",
      name: "ACIMA DAS NUVENS",
      text: "Alcance 1.200 unidades da rota.",
      kind: "height",
      target: 1200,
      reward: 130,
    },
    {
      id: "salvage",
      name: "COLETA ORBITAL",
      text: "Recupere 12 caixas de dinheiro na campanha.",
      kind: "coins",
      target: 12,
      reward: 180,
    },
    {
      id: "refuel",
      name: "REABASTECIMENTO",
      text: "Colete 4 tanques de combustível.",
      kind: "fuel",
      target: 4,
      reward: 200,
    },
    {
      id: "clean",
      name: "VOO PRECISO",
      text: "Alcance 2.200 unidades sem sofrer impactos.",
      kind: "clean",
      target: 2200,
      reward: 250,
    },
    {
      id: "strato",
      name: "CÉU PROFUNDO",
      text: "Alcance a estratosfera.",
      kind: "height",
      target: 5000,
      reward: 400,
    },
    {
      id: "orbit",
      name: "ALÉM DA ATMOSFERA",
      text: "Atravesse a fronteira orbital.",
      kind: "height",
      target: 9000,
      reward: 650,
    },
    {
      id: "transit",
      name: "VETOR DE INTERCEPTAÇÃO",
      text: "Alcance a rota de transferência.",
      kind: "height",
      target: 15000,
      reward: 750,
    },
    {
      id: "takedown",
      name: "TERRA A SALVO",
      text: "Alcance 48 km e conclua a sequência de interceptação.",
      kind: "intercept",
      target: 1,
      reward: 2500,
    },
  ];
  const zones = [
    {
      from: 0,
      name: "01 / PLATAFORMA AURORA",
      short: "TROPOSFERA",
      top: "#244f7d",
      bottom: "#b6a7bd",
      accent: "#a0edda",
    },
    {
      from: 3000,
      name: "02 / CORREDOR DAS NUVENS",
      short: "ESTRATOSFERA",
      top: "#233d70",
      bottom: "#7777a5",
      accent: "#c0b7f2",
    },
    {
      from: 7000,
      name: "03 / FRONTEIRA ORBITAL",
      short: "ÓRBITA",
      top: "#101b45",
      bottom: "#394267",
      accent: "#a0dff0",
    },
    {
      from: 16000,
      name: "04 / VETOR DE INTERCEPTAÇÃO",
      short: "ESPAÇO PROFUNDO",
      top: "#0b1534",
      bottom: "#252b55",
      accent: "#d4b3ef",
    },
    {
      from: 40000,
      name: "05 / AMEAÇA TK–87",
      short: "INTERCEPTAÇÃO",
      top: "#111936",
      bottom: "#343556",
      accent: "#efd8ad",
    },
  ];
  function stats(levels) {
    const l = (id) => Math.max(0, Math.min(6, Number(levels[id]) || 0));
    return {
      thrust: 52 + l("engine") * 8.5,
      fuel: 17 + l("tank") * 10,
      burn: 0.95 - l("efficiency") * 0.075,
      booster: 2.5 + l("booster") * 2.2,
      boostThrust: 26 + l("booster") * 4,
      health: 65 + l("hull") * 22,
      armor: 1 - l("hull") * 0.065,
      control: 2.1 + l("stability") * 0.38,
      wind: 1 - l("stability") * 0.105,
      magnet: 38 + l("magnet") * 18,
      shield: l("shield") * 15,
      shieldRegen: 0.8 + l("shield") * 0.4,
      maxSpeed: 130 + l("engine") * 18,
    };
  }
  function cost(id, level) {
    const u = upgrades.find((u) => u.id === id);
    return !u || level >= u.max
      ? Infinity
      : Math.round(u.base * Math.pow(u.growth, level));
  }
  function tierCost(id, current, target) {
    if (target <= current) return 0;
    return cost(id, target - 1);
  }
  function zone(h) {
    return [...zones].reverse().find((z) => h >= z.from) || zones[0];
  }
  function distance(h) {
    if (h < 3000) return Math.max(0, h) * 0.004;
    if (h < 7000) return 12 + (h - 3000) * 0.022;
    if (h < 12000) return 100 + (h - 7000) * 2;
    return 10100 + ((h - 12000) / 36000) * 374300;
  }
  // Sprite-local ellipses [x,y,rx,ry], including separate solid parts.
  const obstacleShapes = {
    plane: [[0, 0, 60, 17]],
    balloon: [
      [0, -11, 30, 36],
      [0, 24, 10, 5],
      [0, 46, 14, 11],
    ],
    bird: [
      [0, 2, 12, 7],
      [-16, -3, 14, 8],
      [16, -3, 14, 8],
    ],
    storm: [
      [0, -9, 67, 32],
      [0, 30, 13, 20],
    ],
    satellite: [
      [0, 0, 16, 24],
      [-39, 1, 20, 16],
      [39, 1, 20, 16],
    ],
    drone: [
      [0, 2, 18, 13],
      [-35, -9, 15, 7],
      [35, -9, 15, 7],
      [-30, 13, 15, 7],
      [30, 13, 15, 7],
    ],
    deepSatellite: [[0,0,20,34],[-53,-22,25,17],[53,-22,25,17],[-53,23,25,17],[53,23,25,17],[0,-52,26,16]],
    mothership: [[0,1,94,24],[0,-24,51,23],[-83,7,25,18],[83,7,25,18]],
    ufo: [
      [0, 8, 47, 13],
      [0, -10, 23, 17],
    ],
  };
  root.SeleneData = {
    target(f) { return {x: Math.sin(f.time * .09) * 210, y:49800, r:105}; },
    milestones, supplies, fuelGrades, fuelTierAt, fuelGrade, finaleDuration:42,
    upgrades,
    obstacleShapes,
    contracts: [...contracts, ...milestones.map(m=>({id:"route_"+m.height,name:m.name,text:"Alcance "+(m.height/1000)+" km.",kind:"height",target:m.height,reward:m.reward}))],
    zones,
    stats,
    cost,
    tierCost,
    zone,
    distance,
    launchY: 42,
    goal: 48000,
    key: "arcade-selene-pelicano-v2",
  };
})(typeof window !== "undefined" ? window : globalThis);
