/* Shared physical component drawings: thumbnails and assembled rocket use these same models. */
(function (root) {
  "use strict";
  const D = root.SeleneData,
    ink = "#293f4a",
    TAU = Math.PI * 2;
  const names = {
    hull: [
      "PROTÓTIPO",
      "REBITE",
      "CÁPSULA",
      "AURORA",
      "ÓRBITA",
      "EXPLORADOR",
      "SELENE",
    ],
    stability: [
      "BÁSICA",
      "ASA CURVA",
      "DELTA",
      "VETOR",
      "DUPLA",
      "FLECHA",
      "LUNAR",
    ],
    engine: ["TESTE", "B-01", "TURBINA", "PLASMA", "ION", "NOVA", "PULSAR"],
    tank: [
      "RESERVA",
      "COMPACTO",
      "DUPLO",
      "CRIO",
      "PRESSÃO",
      "ORBITAL",
      "LONGO ALC.",
    ],
    booster: ["SEM AUX.", "PAVIO", "IMPULSO", "PAR", "VETOR", "NOVA", "LUNAR"],
    efficiency: [
      "PADRÃO",
      "INJETOR",
      "MISTURA",
      "FLUXO",
      "CICLO",
      "ION",
      "QUÂNTICO",
    ],
    magnet: [
      "SEM COLETOR",
      "ANEL",
      "BOBINA",
      "DUPLO",
      "VETOR",
      "ORBITAL",
      "CAMPO",
    ],
    shield: [
      "SEM ESCUDO",
      "CAPA",
      "MALHA",
      "CAMPO",
      "BOLHA",
      "AURORA",
      "AEGIS",
    ],
  };
  const colors = [
    "#b75d53",
    "#bd805e",
    "#648e9e",
    "#6e9c8b",
    "#79799b",
    "#c19b65",
    "#628e91",
  ];
  function path(g, p, fill, stroke = ink, lw = 1.5) {
    g.beginPath();
    p.forEach((q, i) =>
      q[0] === "Q"
        ? g.quadraticCurveTo(...q.slice(1))
        : q[0] === "C"
          ? g.bezierCurveTo(...q.slice(1))
          : i
            ? g.lineTo(...q)
            : g.moveTo(...q),
    );
    g.closePath();
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke) {
      g.strokeStyle = stroke;
      g.lineWidth = lw;
      g.stroke();
    }
  }
  function oval(g, x, y, rx, ry, fill, stroke = ink, lw = 1.5) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke) {
      g.strokeStyle = stroke;
      g.lineWidth = lw;
      g.stroke();
    }
  }
  function box(g, x, y, w, h, fill, stroke = ink, r = 3, lw = 1.4) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke) {
      g.strokeStyle = stroke;
      g.lineWidth = lw;
      g.stroke();
    }
  }
  function line(g, p, color = ink, lw = 1.3) {
    g.beginPath();
    p.forEach((q, i) => (i ? g.lineTo(...q) : g.moveTo(...q)));
    g.strokeStyle = color;
    g.lineWidth = lw;
    g.stroke();
  }
  function metal(g, x, y, w, h, light = "#eff1d9", dark = "#718d96") {
    const c = g.createLinearGradient(x, y, x + w, y + h * 0.1);
    c.addColorStop(0, dark);
    c.addColorStop(0.25, light);
    c.addColorStop(0.55, "#b7cbc3");
    c.addColorStop(1, dark);
    return c;
  }
  function bolt(g, x, y) {
    oval(g, x, y, 1.4, 1.4, "#dbe6cd", ink, 0.6);
  }
  function hull(g, level, tank = 0, hp = 1) {
    const w = 18 + level * 0.5,
      top = -45 - tank * 1.5,
      c = colors[level];
    path(
      g,
      [
        [-w, 28],
        [-w, top + 17],
        ["Q", -w, top + 2, 0, top - 21],
        ["Q", w, top + 2, w, top + 17],
        [w, 28],
      ],
      metal(
        g,
        -w,
        top,
        w * 2,
        75,
        level < 2 ? "#f2e9cd" : "#e6eee1",
        level < 2 ? "#99aaa1" : colors[(level + 2) % 7],
      ),
      ink,
      1.7,
    );
    path(
      g,
      [
        [-w, top + 17],
        ["Q", -w, top + 2, 0, top - 21],
        ["Q", w, top + 2, w, top + 17],
      ],
      c,
      ink,
      1.4,
    );
    line(
      g,
      [
        [-w + 2, top + 19],
        [w - 2, top + 19],
      ],
      "#edcc8e",
      2,
    );
    if (level > 2) {
      for (const side of [-1, 1]) {
        line(
          g,
          [
            [side * (w - 3), -10],
            [side * (w - 3), 9],
          ],
          "#5b7580",
          2.5,
        );
        for (let k = 0; k < 3; k++) bolt(g, side * (w - 3), -9 + k * 8);
      }
    }
    if (level >= 4) box(g, -w + 2, -4, w * 2 - 4, 7, c, ink, 1, 1);
    const glass = g.createRadialGradient(
      -4,
      -24 - tank * 0.5,
      1,
      0,
      -20 - tank * 0.5,
      12,
    );
    glass.addColorStop(0, "#eff8e2");
    glass.addColorStop(0.35, "#a8d5d4");
    glass.addColorStop(1, "#476e86");
    if (level >= 5) {
      path(
        g,
        [
          [-10, -28 - tank * 0.5],
          [0, -33 - tank * 0.5],
          [10, -28 - tank * 0.5],
          [11, -16 - tank * 0.5],
          [0, -9 - tank * 0.5],
          [-11, -16 - tank * 0.5],
        ],
        glass,
        ink,
        2,
      );
    } else oval(g, 0, -20 - tank * 0.5, 10, 12, glass, ink, 2.3);
    oval(g, -3, -24 - tank * 0.5, 3, 3, "#f2f8dc", null);
    for (const x of [-w + 3, w - 3])
      for (const y of [top + 23, 8, 24]) bolt(g, x, y);
    line(
      g,
      [
        [-12, top + 29],
        [-12, -36],
      ],
      "#fff5d388",
      1.1,
    );
    if (hp < 0.7)
      line(
        g,
        [
          [10, -5],
          [3, 0],
          [7, 4],
          [-1, 10],
        ],
        ink,
        1.5,
      );
    if (hp < 0.35)
      line(
        g,
        [
          [-16, -35],
          [-9, -30],
          [-13, -23],
          [-6, -20],
        ],
        ink,
        1.4,
      );
  }
  function fin(g, level) {
    const span = 17 + level;
    const c = colors[level];
    const variants = [
      [
        [0, -12],
        [span, 15],
        [span, 30],
        [-6, 20],
      ],
      [
        [0, -12],
        ["Q", 12, -5, span, 18],
        [span, 30],
        [-6, 20],
      ],
      [
        [0, -12],
        [span, 8],
        [span, 30],
        [-6, 20],
      ],
      [
        [0, -12],
        [span, 13],
        [span, 23],
        [span - 6, 30],
        [-6, 20],
      ],
      [
        [0, -12],
        [span, 1],
        [span, 12],
        [12, 11],
        [span, 24],
        [span, 30],
        [-6, 20],
      ],
      [
        [0, -12],
        [span, -1],
        [span - 4, 13],
        [span, 30],
        [10, 24],
        [-6, 20],
      ],
      [
        [0, -12],
        [span, 5],
        [span, 15],
        [14, 12],
        [span, 27],
        [span, 30],
        [-6, 20],
      ],
    ];
    path(g, variants[level], c, ink, 1.6);
    line(
      g,
      [
        [2, -3],
        [span - 3, 19],
      ],
      "#f1d9a388",
      1.2,
    );
    if (level >= 3)
      line(
        g,
        [
          [7, 9],
          [span - 2, 17],
        ],
        "#294e61aa",
        1,
      );
  }
  function engine(g, level) {
    const w = 9 + level * 1.3;
    box(g, -w, -7, w * 2, 5, "#97b2ad", ink, 1, 1.2);
    path(
      g,
      [
        [-w + 3, -2],
        [-w - 1, 6],
        ["Q", 0, 12, w + 1, 6],
        [w - 3, -2],
      ],
      metal(g, -w, 0, w * 2, 8, "#cad9cc", "#4e6a79"),
      ink,
      1.4,
    );
    oval(g, 0, 6, w, 3.2, "#304c5d", ink, 1);
    oval(g, 0, 5.5, w - 3, 1.7, level >= 3 ? "#9dd7d8" : "#d6b775", null);
    for (let i = 0; i < Math.min(3, level); i++)
      line(
        g,
        [
          [-w + 2, -4 + i * 2],
          [w - 2, -4 + i * 2],
        ],
        colors[level],
        0.8,
      );
  }
  function tank(g, level) {
    const w = 17 + level * 0.35,
      h = 20 + level * 3;
    box(
      g,
      -w,
      -h / 2,
      w * 2,
      h,
      metal(g, -w, 0, w * 2, h, "#e4e1c4", colors[(level + 1) % 7]),
      ink,
      4,
      1.5,
    );
    for (const y of [-h / 2 + 4, h / 2 - 4])
      box(g, -w - 1, y - 2, w * 2 + 2, 4, colors[(level + 1) % 7], ink, 1, 0.8);
    if (level >= 2) {
      const qty = 1 + Math.floor(level / 2);
      for (let i = 0; i < qty; i++) {
        box(
          g,
          -12 + (i * 24) / qty,
          -h / 2 + 7,
          4,
          h - 14,
          "#688896",
          ink,
          1,
          0.7,
        );
      }
    } else {
      oval(g, 0, 0, 5, 6, "#d8c491", ink, 1);
      line(
        g,
        [
          [0, -4],
          [0, 4],
        ],
        ink,
        1,
      );
    }
    for (const x of [-w + 3, w - 3]) bolt(g, x, 0);
  }
  function booster(g, level) {
    const w = 6 + level * 0.55,
      c = colors[level],
      end = 36;
    path(
      g,
      [
        [-w, end - 7],
        [-w, -9],
        ["Q", -w, -21, 0, -27],
        ["Q", w, -21, w, -9],
        [w, end - 7],
      ],
      metal(g, -w, 0, w * 2, 50, "#e6ead3", "#6f8c98"),
      ink,
      1.4,
    );
    path(
      g,
      [
        [-w, -8],
        ["Q", -w, -21, 0, -27],
        ["Q", w, -21, w, -8],
      ],
      c,
      ink,
      1.2,
    );
    for (let i = 0; i < Math.min(3, 1 + Math.floor(level / 2)); i++)
      box(g, -w - 1, 2 + i * 8, w * 2 + 2, 3, c, ink, 1, 0.6);
    path(
      g,
      [
        [-w + 1, end - 9],
        [-w, end],
        [w, end],
        [w - 1, end - 9],
      ],
      "#536f7d",
      ink,
      1.1,
    );
  }
  function accessory(g, id, level, t) {
    if (id === "efficiency") {
      box(g, -18, -17, 36, 34, metal(g, -18, 0, 36, 34), ink, 4);
      for (let i = 0; i < 3 + Math.floor(level / 2); i++)
        line(
          g,
          [
            [-12 + i * 5, -10],
            [-12 + i * 5, 11],
          ],
          colors[(level + 2) % 7],
          2.4,
        );
      box(g, -8, -23, 16, 7, "#bda477", ink, 2);
      bolt(g, -13, 13);
      bolt(g, 13, 13);
    } else if (id === "magnet") {
      path(
        g,
        [
          [-17, -17],
          [-8, -17],
          [-8, 5],
          ["Q", 0, 14, 8, 5],
          [8, -17],
          [17, -17],
          [17, 7],
          ["Q", 0, 30, -17, 7],
        ],
        metal(g, -17, 0, 34, 34),
        ink,
        1.5,
      );
      for (const x of [-17, 8]) box(g, x, -17, 9, 9, colors[level], ink, 1, 1);
      for (let i = 0; i < level; i++)
        line(
          g,
          [
            [-16, 1 + i * 2],
            [-9, 1 + i * 2],
          ],
          "#b29463",
          1,
        );
    } else {
      path(
        g,
        [
          [0, -24],
          [20, -16],
          [18, 9],
          ["Q", 12, 24, 0, 29],
          ["Q", -12, 24, -18, 9],
          [-20, -16],
        ],
        metal(g, -20, 0, 40, 45, "#ebdfb7", colors[level]),
        ink,
        1.6,
      );
      path(
        g,
        [
          [0, -17],
          [13, -11],
          [11, 7],
          ["Q", 8, 17, 0, 21],
          ["Q", -8, 17, -11, 7],
          [-13, -11],
        ],
        "#8ebac5",
        ink,
        1,
      );
      line(
        g,
        [
          [0, -11],
          [0, 15],
        ],
        "#e3f3d9",
        2,
      );
      for (let i = 0; i < level; i++) bolt(g, -13 + i * 5, -13);
    }
  }
  function drawPart(g, id, level, t = 0) {
    g.save();
    g.lineJoin = "round";
    g.lineCap = "round";
    if (id === "hull") hull(g, level);
    else if (id === "stability") fin(g, level);
    else if (id === "engine") engine(g, level);
    else if (id === "tank") tank(g, level);
    else if (id === "booster") {
      if (level === 0) {
        g.setLineDash([3, 3]);
        box(g, -8, -24, 16, 58, null, "#839c9d", 6, 1);
        g.setLineDash([]);
      } else booster(g, level);
    } else accessory(g, id, level, t);
    g.restore();
  }
  function flame(g, x, y, w, len, t, color = "#edb168") {
    g.save();
    g.translate(x, y);
    path(
      g,
      [
        [-w, 0],
        ["Q", -w * 1.7, len * 0.45, 0, len + Math.sin(t * 31) * 4],
        ["Q", w * 1.5, len * 0.45, w, 0],
      ],
      color,
      "#a57850",
      0.8,
    );
    path(
      g,
      [
        [-w * 0.5, 0],
        [0, len * 0.7],
        [w * 0.5, 0],
      ],
      "#fff0b7",
      null,
    );
    g.restore();
  }
  function rocket(
    g,
    x,
    y,
    s,
    a,
    l,
    t,
    fire = false,
    boost = false,
    shield = 0,
    legs = false,
    hp = 1,
  ) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.scale(s, s);
    g.lineJoin = "round";
    if (fire || boost)
      flame(g, 0, 39, 10, boost ? 95 : 53, t, boost ? "#a3dae0" : "#e9ad62");
    for (const side of [-1, 1]) {
      if (l.booster > 0) {
        g.save();
        g.translate(side * 29, 0);
        booster(g, l.booster);
        if (boost) flame(g, 0, 36, 5, 54, t, "#b2e5e2");
        g.restore();
      }
      g.save();
      g.translate(side * (15 + (l.hull || 0) * 0.5), 12);
      g.scale(side, 1);
      fin(g, l.stability || 0);
      g.restore();
    }
    hull(g, l.hull || 0, l.tank || 0, hp);
    g.save();
    g.translate(0, 18);
    g.scale(0.94, 0.5);
    tank(g, l.tank || 0);
    g.restore();
    g.save();
    g.translate(0, 33);
    engine(g, l.engine || 0);
    g.restore();
    if (l.efficiency > 0) {
      g.save();
      g.translate(0, 0);
      g.scale(0.27, 0.27);
      accessory(g, "efficiency", l.efficiency, t);
      g.restore();
    }
    if (l.magnet > 0)
      for (const side of [-1, 1]) {
        g.save();
        g.translate(side * 22, 2);
        g.scale(0.23, 0.23);
        accessory(g, "magnet", l.magnet, t);
        g.restore();
      }
    if (l.shield > 0) {
      g.save();
      g.translate(0, 6);
      g.scale(0.2, 0.2);
      accessory(g, "shield", l.shield, t);
      g.restore();
    }
    if (legs)
      for (const side of [-1, 1])
        line(
          g,
          [
            [side * 14, 24],
            [side * 34, 47],
            [side * 45, 47],
          ],
          ink,
          3,
        );
    if (shield > 0) {
      oval(g, 0, -9, 47, 76, null, "#9bdbdb88", 1.8);
    }
    g.restore();
  }
  function thumbnail(canvas, id, level, t = 0) {
    const g = canvas.getContext("2d");
    canvas.width = 160;
    canvas.height = 132;
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, 80, 66);
    g.save();
    const scales = {
      hull: 0.52,
      stability: 1.05,
      engine: 1.65,
      tank: 0.94,
      booster: 0.72,
      efficiency: 0.86,
      magnet: 0.8,
      shield: 0.76,
    };
    g.translate(
      id === "stability" ? 31 : 40,
      id === "hull" ? 43 : id === "engine" ? 32 : 33,
    );
    g.scale(scales[id], scales[id]);
    drawPart(g, id, level, t);
    g.restore();
  }
  function assemblyPreview(g, w, h, levels, t) {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#6f919f");
    sky.addColorStop(1, "#bdc9b1");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#9aad9b";
    g.fillRect(0, h * 0.77, w, h * 0.23);
    for (let i = 0; i < 6; i++) {
      line(
        g,
        [
          [(i * w) / 5, h * 0.77],
          [w * 0.5 + (i - 2.5) * w * 0.45, h],
        ],
        "#7f9a8c66",
        1,
      );
    }
    const scale = Math.min(w / 105, h / 155, 4),
      floor = h * 0.85;
    box(g, w * 0.15, floor, w * 0.7, 11, "#c4bd9c", ink, 2, 2);
    rocket(
      g,
      w * 0.5,
      floor - 42 * scale,
      scale,
      0,
      levels,
      t,
      false,
      false,
      levels.shield * 3,
    );
    g.fillStyle = "#e8ebd2";
    g.font = "bold 13px sans-serif";
    g.textAlign = "center";
    g.fillText(
      "P–87 / " + Object.values(levels).reduce((a, b) => a + b, 0),
      w / 2,
      h * 0.1,
    );
    g.textAlign = "left";
  }
  function emp(g, x, y, s, t) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + (i * TAU) / 3,
        r = 42;
      line(
        g,
        [
          [Math.cos(a) * r, Math.sin(a) * r - 8],
          [Math.cos(a + 0.15) * (r + 8), Math.sin(a + 0.15) * (r + 8) - 8],
          [Math.cos(a + 0.28) * r, Math.sin(a + 0.28) * r - 8],
        ],
        "#d7edf1",
        1.5,
      );
    }
    g.restore();
  }
  root.SeleneParts = {
    drawPart,
    rocket,
    thumbnail,
    assemblyPreview,
    emp,
    names,
    primary: ["hull", "stability", "engine", "tank", "booster"],
    extra: ["efficiency", "magnet", "shield"],
  };
})(typeof window !== "undefined" ? window : globalThis);
