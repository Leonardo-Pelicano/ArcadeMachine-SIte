/* Original cartoon artwork: Pelicano's improvised space program. All paths are local. */
(function (root) {
  "use strict";
  const D = root.SeleneData,
    A = root.SeleneArt,
    TAU = Math.PI * 2,
    ink = "#243848",
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shape(g, p, fill, stroke = ink, lw = 2) {
    g.beginPath();
    for (const [i, q] of p.entries()) {
      const f = q[0];
      if (typeof f === "string") {
        if (f === "C") g.bezierCurveTo(...q.slice(1));
        else if (f === "Q") g.quadraticCurveTo(...q.slice(1));
        else if (f === "A") g.arc(...q.slice(1));
      } else if (i) g.lineTo(...q);
      else g.moveTo(...q);
    }
    g.closePath();
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (stroke) {
      g.lineWidth = lw;
      g.strokeStyle = stroke;
      g.stroke();
    }
  }
  function ellipse(g, x, y, rx, ry, fill, stroke = ink, lw = 2) {
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
  function box(g, x, y, w, h, fill, stroke = ink, r = 4, lw = 2) {
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
  function line(g, p, color = ink, lw = 2) {
    g.beginPath();
    p.forEach((q, i) => (i ? g.lineTo(...q) : g.moveTo(...q)));
    g.strokeStyle = color;
    g.lineWidth = lw;
    g.stroke();
  }
  function text(g, s, x, y, size = 14, color = ink, font = "sans-serif") {
    g.fillStyle = color;
    g.font = "bold " + size + "px " + font;
    g.fillText(s, x, y);
  }
  function bolt(g, x, y) {
    ellipse(g, x, y, 3, 3, "#b5c0b9", ink, 1);
    line(
      g,
      [
        [x - 1, y + 1],
        [x + 1, y - 1],
      ],
      ink,
      1,
    );
  }
  function pelicano(g, x, y, scale = 1, t = 0, mood = "excited", talk = false) {
    if (root.SelenePortrait?.draw(g, x, y, scale, t, mood, talk)) return;
    g.save();
    g.translate(x, y);
    g.scale(scale, scale);
    g.lineJoin = "round";
    g.lineCap = "round";
    ellipse(g, 0, 3, 59, 9, "#233e4033", null);
    g.translate(0, Math.sin(t * 2) * 1.2);
    const coat = g.createLinearGradient(-55, -155, 48, -60);
    coat.addColorStop(0, "#fff9e8");
    coat.addColorStop(0.5, "#eeeada");
    coat.addColorStop(1, "#bacac6");
    const skin = g.createLinearGradient(-34, -240, 38, -190);
    skin.addColorStop(0, "#f6d3ab");
    skin.addColorStop(0.6, "#ecc096");
    skin.addColorStop(1, "#cd966f");
    const hair = g.createLinearGradient(0, -285, 0, -196);
    hair.addColorStop(0, "#ffffed");
    hair.addColorStop(1, "#cbd8d0");
    shape(
      g,
      [
        [-30, -76],
        ["Q", -35, -46, -28, -10],
        [-9, -10],
        [0, -58],
        [10, -10],
        [31, -10],
        ["Q", 35, -47, 28, -76],
      ],
      "#617186",
    );
    line(
      g,
      [
        [-21, -58],
        [-20, -18],
      ],
      "#8c9ba7",
      2,
    );
    line(
      g,
      [
        [20, -58],
        [21, -18],
      ],
      "#455866",
      2,
    );
    box(g, -39, -13, 34, 15, "#344551", ink, 6);
    box(g, 7, -13, 35, 15, "#344551", ink, 6);
    line(
      g,
      [
        [-30, -8],
        [-13, -8],
      ],
      "#92a4ac",
      2,
    );
    line(
      g,
      [
        [17, -8],
        [35, -8],
      ],
      "#92a4ac",
      2,
    );
    // Neck connects the jaw to the shirt, behind the collar and head.
    shape(
      g,
      [
        [-11, -190],
        [-12, -164],
        ["Q", 0, -155, 13, -164],
        [12, -190],
      ],
      skin,
      ink,
      1.7,
    );
    g.beginPath();
    g.moveTo(-10, -177);
    g.quadraticCurveTo(1, -171, 12, -177);
    g.strokeStyle = "#b7856766";
    g.lineWidth = 2;
    g.stroke();
    // Curved coat silhouette and restrained, clean material shading.
    shape(
      g,
      [
        [-34, -166],
        ["Q", -50, -164, -60, -145],
        [-52, -106],
        [-49, -87],
        [-51, -67],
        ["Q", -28, -58, -5, -62],
        [0, -111],
        [8, -62],
        ["Q", 32, -61, 50, -68],
        [43, -133],
        ["Q", 43, -158, 29, -165],
      ],
      coat,
    );
    shape(
      g,
      [
        [22, -160],
        [38, -143],
        [45, -73],
        [27, -68],
        [19, -120],
      ],
      "#aabfc03d",
      null,
    );
    shape(
      g,
      [
        [-15, -169],
        [-28, -150],
        [-11, -130],
        [0, -148],
        [15, -131],
        [27, -150],
        [16, -168],
      ],
      "#fffbed",
    );
    shape(
      g,
      [
        [-5, -151],
        [6, -151],
        [12, -104],
        [1, -92],
        [-10, -104],
      ],
      "#9f6d82",
    );
    shape(
      g,
      [
        [-22, -156],
        ["Q", -18, -162, -7, -159],
        [0, -152],
        [11, -160],
        ["Q", 20, -161, 23, -155],
        [14, -144],
        [0, -149],
        [-12, -144],
      ],
      "#a57aa3",
    );
    ellipse(g, 0, -153, 4, 5, "#cd9cbe", ink, 1.5);
    for (let i = 0; i < 3; i++)
      ellipse(g, 5, -123 + i * 16, 1.8, 1.8, "#839b99", null);
    box(g, -37, -110, 23, 24, "#e5e7d8", ink, 3, 1.4);
    box(g, 20, -112, 21, 24, "#d1ded5", ink, 3, 1.4);
    line(
      g,
      [
        [-31, -112],
        [-33, -127],
      ],
      "#b77d55",
      3,
    );
    line(
      g,
      [
        [-24, -112],
        [-23, -127],
      ],
      "#659ea5",
      3,
    );
    ellipse(g, 29, -103, 5, 5, "#ddbd6f", ink, 1);
    text(g, "P", 26, -100, 7);
    // Bent sleeves and rounded hands; no intersecting outlines across the face.
    shape(
      g,
      [
        [-42, -157],
        ["Q", -54, -163, -63, -151],
        [-85, -174],
        [-96, -163],
        ["Q", -80, -135, -65, -128],
        ["Q", -53, -124, -48, -139],
      ],
      coat,
    );
    // One continuous, closed silhouette outlines the palm and both raised fingers.
    shape(
      g,
      [
        [-99, -168],
        ["Q", -104, -176, -99, -184],
        [-106, -200],
        ["Q", -108, -205, -103, -205],
        ["Q", -100, -205, -99, -201],
        [-94, -186],
        ["Q", -91, -189, -88, -185],
        [-84, -195],
        ["Q", -82, -199, -79, -196],
        ["Q", -78, -194, -80, -191],
        [-84, -179],
        ["Q", -79, -177, -82, -170],
        ["Q", -87, -161, -96, -165],
      ],
      skin,
      ink,
      1.8,
    );
    g.beginPath();
    g.moveTo(-96, -181);
    g.quadraticCurveTo(-90, -185, -89, -177);
    g.moveTo(-90, -181);
    g.quadraticCurveTo(-84, -183, -85, -175);
    g.moveTo(-94, -171);
    g.quadraticCurveTo(-90, -168, -86, -172);
    g.strokeStyle = "#966b55";
    g.lineWidth = 1.2;
    g.stroke();
    const wave = Math.sin(t * 2.6) * 2;
    shape(
      g,
      [
        [35, -158],
        ["Q", 49, -158, 58, -146],
        [69 + wave, -130],
        [62 + wave, -120],
        [45, -132],
        [42, -114],
      ],
      coat,
    );
    ellipse(g, 66 + wave, -127, 10, 11, skin, ink, 1.8);
    g.beginPath();
    for (let k = 0; k < 3; k++) {
      g.moveTo(66 + wave, -134 + k * 5);
      g.quadraticCurveTo(74 + wave, -134 + k * 5, 72 + wave, -130 + k * 5);
    }
    g.strokeStyle = "#775744";
    g.lineWidth = 1.2;
    g.stroke();
    g.save();
    g.translate(74 + wave, -133);
    g.rotate(0.35);
    box(g, -4, -38, 8, 43, "#9eb8b9", ink, 3, 1.5);
    shape(
      g,
      [
        [-4, -35],
        ["Q", -14, -41, -10, -53],
        [-5, -46],
        [3, -46],
        [8, -53],
        ["Q", 15, -41, 5, -35],
      ],
      "#b4c9c5",
      ink,
      1.7,
    );
    line(
      g,
      [
        [-1, -27],
        [-1, -3],
      ],
      "#e7efdd",
      1,
    );
    g.restore();
    // Soft tufts, ears and a continuous cheek/jaw contour.
    shape(
      g,
      [
        [-35, -205],
        ["Q", -56, -204, -50, -221],
        ["Q", -70, -224, -49, -238],
        ["Q", -65, -255, -39, -251],
        ["Q", -44, -282, -22, -264],
        ["Q", -11, -295, -1, -271],
        ["Q", 17, -296, 23, -268],
        ["Q", 47, -284, 40, -255],
        ["Q", 66, -265, 49, -242],
        ["Q", 73, -237, 52, -223],
        ["Q", 61, -206, 36, -204],
      ],
      hair,
      ink,
      2,
    );
    ellipse(g, -38, -217, 9, 14, skin, ink, 1.7);
    ellipse(g, 38, -217, 9, 14, skin, ink, 1.7);
    line(
      g,
      [
        [-40, -222],
        [-35, -217],
        [-39, -211],
      ],
      "#bd8c6a",
      1.2,
    );
    line(
      g,
      [
        [40, -222],
        [35, -217],
        [39, -211],
      ],
      "#bd8c6a",
      1.2,
    );
    shape(
      g,
      [
        [-30, -246],
        ["Q", -20, -263, 9, -258],
        ["Q", 36, -257, 37, -233],
        [34, -206],
        ["Q", 30, -181, 5, -180],
        ["Q", -23, -178, -33, -200],
        [-37, -224],
        ["Q", -37, -239, -30, -246],
      ],
      skin,
      ink,
      2,
    );
    // Protective goggles: lens gradients, reflections and small articulated pupils.
    line(
      g,
      [
        [-38, -229],
        [-46, -234],
      ],
      "#567780",
      5,
    );
    line(
      g,
      [
        [38, -229],
        [47, -234],
      ],
      "#567780",
      5,
    );
    const glass = g.createLinearGradient(-20, -248, 20, -206);
    glass.addColorStop(0, "#d4ede6");
    glass.addColorStop(1, "#9bc1c7");
    for (const cx of [-19, 20]) {
      ellipse(g, cx, -226, 19, 20, glass, "#3e6670", 3);
      ellipse(g, cx, -225, 13, 14, "#f9f4dc", null);
    }
    line(
      g,
      [
        [0, -228],
        [2, -228],
      ],
      "#395d67",
      3,
    );
    const blink = Math.sin(t * 1.3) > 0.997,
      look = Math.sin(t * 0.7) * 1.8;
    if (blink) {
      line(
        g,
        [
          [-28, -225],
          [-10, -225],
        ],
        ink,
        2,
      );
      line(
        g,
        [
          [11, -225],
          [29, -225],
        ],
        ink,
        2,
      );
    } else {
      ellipse(g, -17 + look, -224, 3.5, 5.5, "#304654", null);
      ellipse(g, 22 + look, -224, 3.5, 5.5, "#304654", null);
      ellipse(g, -18 + look, -226, 1, 1, "#fff8df", null);
      ellipse(g, 21 + look, -226, 1, 1, "#fff8df", null);
    }
    g.beginPath();
    g.moveTo(-32, -245);
    g.quadraticCurveTo(-21, -254, -9, -246);
    g.strokeStyle = "#fff9e6";
    g.lineWidth = 5;
    g.stroke();
    g.beginPath();
    g.moveTo(10, -247);
    g.quadraticCurveTo(23, mood === "worried" ? -243 : -256, 32, -246);
    g.stroke();
    line(
      g,
      [
        [-30, -234],
        [-25, -238],
      ],
      "#ffffffa0",
      2,
    );
    line(
      g,
      [
        [10, -234],
        [15, -238],
      ],
      "#ffffffa0",
      2,
    );
    // Pelicano's long nose and rounded moustache keep his silhouette recognisable.
    shape(
      g,
      [
        [0, -224],
        ["Q", -3, -211, 5, -207],
        ["Q", 24, -209, 24, -200],
        ["Q", 23, -192, 10, -196],
        [-1, -197],
        ["Q", -9, -203, 0, -224],
      ],
      skin,
      ink,
      1.6,
    );
    shape(
      g,
      [
        [0, -197],
        ["Q", -15, -205, -28, -192],
        ["Q", -18, -187, -2, -191],
        [5, -191],
        ["Q", 24, -185, 32, -194],
        ["Q", 17, -201, 5, -196],
      ],
      hair,
      ink,
      1.4,
    );
    if (talk && Math.sin(t * 17) > 0.1) {
      ellipse(g, 2, -185, 9, 5, "#744d52", ink, 1.2);
      ellipse(g, 3, -182, 5, 1.5, "#c99083", null);
    } else {
      g.beginPath();
      g.moveTo(-8, -185);
      g.quadraticCurveTo(2, mood === "worried" ? -189 : -178, 13, -185);
      g.strokeStyle = ink;
      g.lineWidth = 1.8;
      g.stroke();
    }
    line(
      g,
      [
        [-28, -208],
        [-30, -203],
      ],
      "#ce9877",
      1,
    );
    line(
      g,
      [
        [30, -208],
        [32, -203],
      ],
      "#ce9877",
      1,
    );
    g.restore();
  }
  function rocket(
    g,
    x,
    y,
    s = 1,
    a = 0,
    l = {},
    t = 0,
    fire = false,
    boost = false,
    shield = 0,
    legs = false,
    hp = 1,
  ) {
    root.SeleneParts.rocket(g, x, y, s, a, l, t, fire, boost, shield, legs, hp);
  }
  function moon(g, x, y, r) {
    A.moon(g, x, y, r);
  }
  function clouds(g, w, h, t, alt = 0) {
    for (let i = 0; i < 8; i++) {
      const x = ((i * 177 + t * 3) % (w + 220)) - 100,
        y = ((i * 137 + alt * 0.22) % (h + 190)) - 90;
      A.cloud(g, x, y, 0.7 + (i % 3) * 0.18, 0.48);
    }
  }
  function ground(g, w, h, offset = 0, t = 0) {
    const y = h - 70 + offset;
    g.fillStyle = "#7fa69a";
    shape(
      g,
      [
        [0, y],
        [w * 0.14, y - 55],
        [w * 0.3, y - 19],
        [w * 0.47, y - 65],
        [w * 0.65, y - 20],
        [w * 0.84, y - 40],
        [w, y],
        [w, h + offset],
        [0, h + offset],
      ],
      "#73979b",
      null,
    );
    shape(
      g,
      [
        [0, y + 15],
        [w * 0.25, y - 25],
        [w * 0.6, y],
        [w * 0.83, y - 14],
        [w, y + 12],
        [w, h + offset],
        [0, h + offset],
      ],
      "#73a87c",
      null,
    );
    g.fillStyle = "#7d8279";
    g.fillRect(0, y + 25, w, h + Math.abs(offset));
    box(g, w * 0.22, y + 19, w * 0.56, 12, "#b6b294", ink, 1);
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 ? "#d6bd60" : "#46545a";
      g.fillRect(w * 0.22 + i * w * 0.043, y + 21, w * 0.043, 5);
    }
    A.tower(g, w * 0.39, y);
    A.building(g, w * 0.73, y);
    A.barrel(g, w * 0.66, y + 25, 0.65);
    if (offset < 180) {
      pelicano(g, w * 0.25, y + 19, 0.44, t, "excited", false);
      A.consoleBox(g, w * 0.18 + 17, y + 19, t);
    }
    for (let i = 0; i < 3; i++) {
      const x = w * 0.12 + i * 21;
      line(
        g,
        [
          [x, y + 30],
          [x, y - 27],
        ],
        ink,
        3,
      );
      shape(
        g,
        [
          [x, y - 27],
          [x + 19, y - 23],
          [x, y - 16],
        ],
        "#e5bd65",
      );
    }
  }
  function laboratory(g, w, h, t, chapter = 0) {
    box(g, 0, 0, w, h, "#9eafa5", null, 0);
    g.fillStyle = "#aeb9a7";
    for (let y = 0; y < h; y += 64) {
      line(
        g,
        [
          [0, y],
          [w, y],
        ],
        "#647c7640",
        1,
      );
      for (let x = (Math.floor(y / 64) % 2) * 80; x < w; x += 160)
        line(
          g,
          [
            [x, y],
            [x, y + 64],
          ],
          "#647c7640",
          1,
        );
    }
    g.fillStyle = "#626e67";
    g.fillRect(0, h * 0.84, w, h * 0.16);
    // Recessed observatory glass: all sky, tails and reflections stay inside the frame.
    const wx=w*.76,wy=h*.3,wr=Math.min(w,h)*.2;
    g.save();g.beginPath();g.arc(wx,wy,wr,0,Math.PI*2);g.clip();
    const sky=g.createLinearGradient(0,wy-wr,0,wy+wr);sky.addColorStop(0,"#102439");sky.addColorStop(1,"#426879");g.fillStyle=sky;g.fillRect(wx-wr,wy-wr,wr*2,wr*2);
    for(let i=0;i<28;i++){g.fillStyle=i%4?"#cfdfd0":"#9ed8de";g.fillRect(wx-wr+((i*37)%97)/97*wr*2,wy-wr+((i*53)%89)/89*wr*2,1.3,1.3);}
    A.threat(g,wx+wr*.18,wy+wr*.1,wr*.44,t);
    line(g,[[wx-wr*.7,wy-wr*.4],[wx-wr*.25,wy-wr*.85]],"#d3e4dd40",wr*.13);
    g.restore();ellipse(g,wx,wy,wr+3,wr+3,null,"#223e4d",8);ellipse(g,wx,wy,wr+8,wr+8,null,"#789794",4);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(g,wx+Math.cos(a)*(wr+8),wy+Math.sin(a)*(wr+8),2,2,"#b8c9b5",null);}
    g.save();
    g.translate(w * 0.52, h * 0.23);
    g.rotate(-0.055);
    box(g, -88, -62, 176, 125, "#385d5d", "#d7c9a5", 7, 8);
    line(
      g,
      [
        [-55, 30],
        [-20, -20],
        [16, 13],
        [52, -36],
      ],
      "#c5e0b8",
      2,
    );
    text(g, "ALVO: TK–87", -68, -38, 14, "#e5e7bf");
    text(g, "P = ?!  F = UAU", -65, 51, 12, "#b9d8b4");
    g.restore();
    box(g, w * 0.06, h * 0.13, w * 0.22, 14, "#637e72", ink, 1);
    for (let i = 0; i < 4; i++) {
      A.flask(
        g,
        w * 0.1 + i * 34,
        h * 0.13 - 6,
        0.55,
        ["#a9c295", "#e0c681", "#a4c7c5", "#c78f82"][i],
      );
    }
    box(g, w * 0.48, h * 0.7, w * 0.45, 18, "#b39872", ink, 3);
    box(g, w * 0.5, h * 0.7 + 18, w * 0.04, h * 0.16, "#797f6b");
    box(g, w * 0.86, h * 0.7 + 18, w * 0.04, h * 0.16, "#797f6b");
    rocket(
      g,
      w * 0.64,
      h * 0.7 -
        0.83 *
          (42 * Math.cos(chapter === 2 ? -0.23 : 0) +
            35 * Math.abs(Math.sin(chapter === 2 ? -0.23 : 0))),
      0.83,
      chapter === 2 ? -0.23 : 0,
      { engine: chapter > 2 ? 2 : 0 },
      t,
      chapter === 3,
      false,
      0,
      false,
    );
    for (let i = 0; i < 3; i++) {
      const scale = 0.75 + i * 0.1;
      A.flask(
        g,
        w * 0.78 + i * 31,
        h * 0.7 - 11 * scale,
        scale,
        ["#98be98", "#9ec7ca", "#cfb577"][i],
      );
    }
    pelicano(
      g,
      w * 0.26,
      h * 0.89,
      Math.min(h / 340, w / 330),
      t,
      chapter === 2 ? "worried" : "excited",
      chapter !== 2,
    );
    box(g, w * 0.045, h * 0.89, w * 0.19, 20, "#526d6b", ink, 2);
    text(g, "LABORATÓRIO P–87", w * 0.055, h * 0.89 + 14, 10, "#ebe6c9");
  }
  function hangar(g, w, h, t, profile, options) {
    g.fillStyle = "#7b958e";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const x = (i * w) / 7;
      line(
        g,
        [
          [x, 0],
          [x, h * 0.8],
        ],
        "#576f6c",
        2,
      );
    }
    const beam = g.createLinearGradient(w * 0.56, 0, w * 0.68, h);
    beam.addColorStop(0, "#fff4b66b");
    beam.addColorStop(1, "#fff4b600");
    shape(
      g,
      [
        [w * 0.57, 0],
        [w * 0.7, 0],
        [w * 0.93, h],
        [w * 0.38, h],
      ],
      beam,
      null,
    );
    g.fillStyle = "#596c68";
    g.fillRect(0, h * 0.8, w, h * 0.2);
    box(g, w * 0.42, h * 0.81, w * 0.4, 15, "#b5af87", ink, 3);
    box(g, w * 0.07, h * 0.24, w * 0.19, h * 0.32, "#315b5c", "#c5bb96", 2, 5);
    text(
      g,
      "PROJETO  S E L E N E",
      w * 0.08,
      h * 0.3,
      Math.max(8, w * 0.011),
      "#d9debc",
    );
    line(
      g,
      [
        [w * 0.1, h * 0.44],
        [w * 0.2, h * 0.35],
        [w * 0.24, h * 0.45],
      ],
      "#b0d7c2",
      2,
    );
    text(
      g,
      "REVISÃO " + String(profile.day + 1).padStart(2, "0"),
      w * 0.09,
      h * 0.51,
      10,
      "#c5ddc2",
    );
    pelicano(
      g,
      w * 0.23,
      h * 0.95,
      Math.min(h / 320, 0.95),
      t,
      "excited",
      false,
    );
    const l = options.previewLevels || profile.levels,
      s = Math.min(2.3, h / 145),
      x = w * 0.64,
      y = h * 0.81 - 42 * s;
    rocket(
      g,
      x,
      y,
      s,
      options.damaged ? -0.14 : 0,
      l,
      t,
      false,
      false,
      options.damaged ? 0 : l.shield,
      false,
      options.damaged ? 0.18 : 1,
    );
    ellipse(g, x, h * 0.84, 60, 9, "#31494355", null);
    const anchors = {
        engine: [0, 34],
        tank: [19, -10],
        efficiency: [0, 13],
        booster: [31, 7],
        hull: [19, -23],
        stability: [34, 32],
        magnet: [0, -35],
        shield: [-42, -10],
      },
      a = anchors[options.module || "engine"];
    g.save();
    g.setLineDash([4, 4]);
    ellipse(g, x + a[0] * s, y + a[1] * s, 22, 22, null, "#f7d777", 2);
    g.restore();
    line(
      g,
      [
        [x + a[0] * s + 22, y + a[1] * s],
        [w * 0.91, y + a[1] * s],
      ],
      "#f5d883",
      1.5,
    );
    text(
      g,
      "P–87",
      w * 0.83,
      h * 0.16,
      Math.max(19, w * 0.035),
      "#e9dfb8",
      '"Barlow Condensed",sans-serif',
    );
    text(
      g,
      "PROTÓTIPO " +
        String(1 + Object.values(l).reduce((a, b) => a + b, 0)).padStart(
          2,
          "0",
        ),
      w * 0.8,
      h * 0.23,
      Math.max(7, w * 0.009),
      "#becbb7",
    );
    A.toolbox(g, w * 0.89, h * 0.82, 0.8);
    A.flask(g, w * 0.86, h * 0.8 - 11, 0.7, "#a5c6a0");
  }
  function pickup(g, o, t) {
    if(o.type==="arcadeRelic"){g.save();g.translate(o.x,o.y);A.arcadeRelic(g,o,t);g.restore();return;}
    g.save();
    g.translate(o.x, o.y + Math.sin(t * 2 + (o.phase || 0)) * 1.2);
    g.lineJoin = "round";
    g.lineCap = "round";
    const grade=o.type==="fuel"?D.fuelGrade(o):null;
    if(grade)g.scale(grade.scale,grade.scale);
    const colors = {
      cash: "#e6bf59",
      fuel: grade?.color || "#d67a60",
      repair: "#c6dfbb",
      aux: "#91c9dd",
      shield: "#8ed9dc",
    };
    const halo = g.createRadialGradient(0, 0, 8, 0, 0, 25);
    halo.addColorStop(0, colors[o.type] + "36");
    halo.addColorStop(1, colors[o.type] + "00");
    ellipse(g, 0, 0, 25, 25, halo, null);
    if (o.type === "cash") {
      ellipse(g, -8, 3, 10, 12, "#c79238", ink, 1.5);
      ellipse(g, -4, 0, 10, 12, "#eccb72", ink, 1.5);
      const gold = g.createLinearGradient(-10, -12, 15, 14);
      gold.addColorStop(0, "#fff0a7");
      gold.addColorStop(0.5, "#e4b74b");
      gold.addColorStop(1, "#ba8230");
      ellipse(g, 5, 1, 12, 14, gold, ink, 1.8);
      ellipse(g, 5, 1, 8.5, 10.5, null, "#fff1a0", 1);
      text(g, "$", 0.2, 6, 15, "#845a29");
      line(
        g,
        [
          [-12, -10],
          [-8, -15],
        ],
        "#fff7ce",
        1.7,
      );
      line(
        g,
        [
          [-12, -15],
          [-8, -10],
        ],
        "#fff7ce",
        1.7,
      );
    } else if (o.type === "fuel") {
      // A real jerrycan silhouette: handle, angled spout and a fuel-drop emblem.
      shape(
        g,
        [
          [3, -9],
          [5, -23],
          [14, -21],
          [12, -9],
        ],
        "#6f7c79",
        ink,
        1.5,
      );
      box(g, -12, -17, 13, 8, "#ad5743", ink, 2, 1.5);
      box(g, -9, -15, 7, 4, "#dfe2be", ink, 1);
      const red = g.createLinearGradient(-14, -9, 13, 13);
      red.addColorStop(0, grade.tier===3?"#a9dbe1":grade.tier===2?"#e7ca7b":"#de9070");
      red.addColorStop(1, grade.tier===3?"#386c85":grade.tier===2?"#a57a3e":"#a74e42");
      box(g, -14, -10, 28, 29, red, ink, 4, 1.8);
      line(
        g,
        [
          [-10, -5],
          [-10, 12],
        ],
        "#f4bd8a",
        2,
      );
      shape(
        g,
        [
          [2, -6],
          ["Q", -9, 5, -3, 10],
          ["Q", 2, 15, 7, 9],
          ["Q", 11, 5, 2, -6],
        ],
        "#f6e4ad",
        ink,
        1.2,
      );
      line(
        g,
        [
          [-11, 15],
          [10, 15],
        ],
        "#793e38",
        1,
      );
      if(grade.tier>1){
        line(g,[[-14,-1],[-14,15],[14,15],[14,-1]],"#d7ddc7",1.5);
        box(g,-9,10,18,8,"#244252",ink,1,.6);
        g.save();g.textAlign="center";text(g,grade.tag,0,16,6.5,"#f5e6b5",'"Space Mono",monospace');g.restore();
      }
    } else if (o.type === "repair") {
      box(g, -7, -20, 14, 10, "#7d9a89", ink, 3, 1.5);
      box(g, -4, -18, 8, 6, "#dbe9d2", null, 1);
      box(g, -17, -12, 34, 28, "#f1e8ce", ink, 4, 1.8);
      box(g, -17, 8, 34, 8, "#b4c9ae", ink, 3, 1.1);
      box(g, -13, -8, 26, 17, "#fff7e2", null, 2);
      shape(
        g,
        [
          [-3, -6],
          [3, -6],
          [3, -1],
          [9, -1],
          [9, 5],
          [3, 5],
          [3, 10],
          [-3, 10],
          [-3, 5],
          [-9, 5],
          [-9, -1],
          [-3, -1],
        ],
        "#bb5d51",
        null,
      );
      box(g, -12, 9, 5, 4, "#a3936e", ink, 1, 1);
      box(g, 7, 9, 5, 4, "#a3936e", ink, 1, 1);
    } else if (o.type === "aux") {
      const metal = g.createLinearGradient(-10, 0, 10, 0);
      metal.addColorStop(0, "#6a98ab");
      metal.addColorStop(0.4, "#dcf0e5");
      metal.addColorStop(1, "#6895a9");
      shape(
        g,
        [
          [-9, -9],
          ["Q", -8, -17, 0, -23],
          ["Q", 8, -17, 9, -9],
          [9, 10],
          [-9, 10],
        ],
        metal,
        ink,
        1.7,
      );
      box(g, -10, 7, 20, 6, "#638591", ink, 2, 1.2);
      box(g, -6, 13, 12, 5, "#4e6673", ink, 1, 1.3);
      shape(
        g,
        [
          [-5, 19],
          [0, 26 + Math.sin(t * 9) * 2],
          [5, 19],
        ],
        "#e6b368",
        "#976c47",
        1,
      );
      shape(
        g,
        [
          [1, -8],
          [-5, 0],
          [-1, 0],
          [-2, 6],
          [6, -3],
          [2, -3],
        ],
        "#dfb75e",
        ink,
        1,
      );
    } else {
      // A shield badge, visually different from tanks, tools and booster capsules.
      const blue = g.createLinearGradient(-12, -14, 12, 17);
      blue.addColorStop(0, "#b8eeea");
      blue.addColorStop(0.6, "#79b9ca");
      blue.addColorStop(1, "#557b9b");
      shape(
        g,
        [
          [0, -20],
          [17, -13],
          [15, 5],
          ["Q", 13, 15, 0, 22],
          ["Q", -13, 15, -15, 5],
          [-17, -13],
        ],
        "#decb8c",
        ink,
        1.8,
      );
      shape(
        g,
        [
          [0, -15],
          [12, -10],
          [10, 4],
          ["Q", 9, 11, 0, 16],
          ["Q", -9, 11, -10, 4],
          [-12, -10],
        ],
        blue,
        ink,
        1.2,
      );
      line(
        g,
        [
          [0, -10],
          [0, 10],
        ],
        "#e3f6e6",
        2,
      );
      line(
        g,
        [
          [-6, -3],
          [6, -3],
        ],
        "#e3f6e6",
        2,
      );
      line(
        g,
        [
          [15, -22],
          [15, -15],
        ],
        "#f7f2be",
        1.5,
      );
      line(
        g,
        [
          [12, -18.5],
          [18, -18.5],
        ],
        "#f7f2be",
        1.5,
      );
    }
    g.restore();
  }
  function obstacle(g, o, t) {
    g.save();
    g.translate(o.x, o.y);
    g.rotate(o.rotation || 0);
    const wreck = o.state === "wreck",
      flash = o.flash > 0;
    g.lineJoin = "round";
    if (o.type === "plane") {
      g.scale(o.facing || (o.vx < 0 ? -1 : 1), 1);
      // Readable side-view biplane: wings are parallel, not crossed over the body.
      const paint = g.createLinearGradient(0, -9, 0, 13);
      paint.addColorStop(0, wreck ? "#b0ada0" : "#f0dbad");
      paint.addColorStop(0.55, wreck ? "#8f988e" : "#d9be86");
      paint.addColorStop(1, "#9d8768");
      shape(
        g,
        [
          [-55, 2],
          [-56, -18],
          ["Q", -55, -24, -49, -24],
          ["Q", -44, -22, -38, 1],
        ],
        wreck ? "#8d8c7f" : "#ad6151",
        ink,
        1.7,
      );
      shape(
        g,
        [
          [-56, 5],
          [-66, 11],
          ["Q", -68, 15, -59, 15],
          [-36, 11],
          [-35, 6],
        ],
        "#c17c5c",
        ink,
        1.5,
      );
      // Far wing and structural struts go behind the fuselage.
      box(g, -27, -24, 62, 7, wreck ? "#8d8c7f" : "#b86650", ink, 3, 1.8);
      line(
        g,
        [
          [-20, -17],
          [-15, 13],
        ],
        "#6d7b74",
        2,
      );
      line(
        g,
        [
          [24, -17],
          [27, 13],
        ],
        "#6d7b74",
        2,
      );
      line(
        g,
        [
          [-19, -17],
          [26, 13],
        ],
        "#a19b7b",
        0.8,
      );
      line(
        g,
        [
          [23, -17],
          [-14, 13],
        ],
        "#a19b7b",
        0.8,
      );
      shape(
        g,
        [
          [-57, 3],
          ["Q", -34, -5, -7, -6],
          [34, -8],
          ["Q", 51, -8, 57, 1],
          ["Q", 55, 10, 40, 12],
          [0, 10],
          ["Q", -33, 10, -57, 7],
        ],
        paint,
        ink,
        1.9,
      );
      // A small windscreen sits in the fuselage, rather than a square glued above it.
      shape(
        g,
        [
          [7, -6],
          [8, -15],
          ["Q", 18, -19, 25, -8],
          [25, -6],
        ],
        "#93c4ce",
        ink,
        1.5,
      );
      line(
        g,
        [
          [14, -13],
          [20, -9],
        ],
        "#e6f3e4",
        1.4,
      );
      line(
        g,
        [
          [-40, 4],
          [42, 4],
        ],
        wreck ? "#6f7c75" : "#b76a50",
        2,
      );
      box(g, 37, -7, 15, 18, "#9eaaa0", ink, 3, 1.4);
      line(
        g,
        [
          [41, -3],
          [49, -3],
        ],
        "#61736f",
        1,
      );
      line(
        g,
        [
          [41, 2],
          [49, 2],
        ],
        "#61736f",
        1,
      );
      line(
        g,
        [
          [41, 7],
          [49, 7],
        ],
        "#61736f",
        1,
      );
      box(g, -23, 11, 58, 7, wreck ? "#8e8a79" : "#b96751", ink, 3, 1.8);
      line(
        g,
        [
          [-18, 13],
          [29, 13],
        ],
        "#dfac75",
        1.2,
      );
      line(
        g,
        [
          [9, 17],
          [13, 25],
        ],
        "#657970",
        2,
      );
      ellipse(g, 14, 25, 5, 5, "#4c6062", ink, 1.4);
      ellipse(g, 14, 25, 2, 2, "#bec4a6", null);
      // Two rotating blades with a faint swept disc; damaged planes coast down.
      g.save();
      g.translate(60, 2);
      ellipse(g, 0, 0, 4, 23, "#d2ddc342", null);
      g.scale(0.2, 1);
      g.rotate(
        wreck ? (o.phase || 0) + (o.age || 0) * 7 : t * 36 + (o.phase || 0),
      );
      for (let k = 0; k < 2; k++) {
        g.rotate(Math.PI);
        shape(
          g,
          [
            [-2, -2],
            ["Q", -7, -10, -4, -21],
            ["Q", 0, -26, 4, -21],
            ["Q", 7, -9, 2, 2],
          ],
          "#647c79",
          ink,
          1.5,
        );
        line(
          g,
          [
            [-2, -19],
            [2, -19],
          ],
          "#e5c575",
          2,
        );
      }
      g.restore();
      ellipse(g, 59, 2, 4, 5, "#c1c9ac", ink, 1.4);
      if (wreck) {
        line(
          g,
          [
            [-20, -3],
            [-12, 3],
            [-17, 7],
            [-7, 10],
          ],
          "#52615e",
          1.5,
        );
        line(
          g,
          [
            [1, 12],
            [6, 15],
            [3, 18],
          ],
          "#52615e",
          1.3,
        );
      }
    } else {
      A.drawObstacle(g, o, t);
    }
    if (flash && o.type !== "storm") {
      g.globalAlpha = 0.6;
      ellipse(g, 0, 0, o.r + 5, o.r + 5, "#f7dd96", null);
    }
    if (wreck) {
      g.strokeStyle = "#414b4b";
      g.lineWidth = 2;
      line(
        g,
        [
          [-8, -12],
          [2, -3],
          [-3, 5],
          [12, 14],
        ],
        ink,
        2,
      );
    }
    g.restore();
  }
  class View {
    constructor(canvas) {
      this.canvas = canvas;
      this.g = canvas.getContext("2d");
      this.particles = [];
      this.popups = [];
      this.trail = [];
      this.shake = 0;
      this.scale = 1;
      this.anchorMix = 0;
      this.lastW = 0;
      this.lastH = 0;
      this.options = {};
      this.pose = { x: 0, y: 0, w: 960, h: 600 };
    }
    resize() {
      const r = this.canvas.getBoundingClientRect(),
        w = Math.max(1, r.width),
        h = Math.max(1, r.height),
        d = Math.min(root.devicePixelRatio || 1, 2.5);
      if (w !== this.lastW || h !== this.lastH || d !== this.lastDPR) {
        this.lastDPR = d;
        this.lastW = w;
        this.lastH = h;
        this.canvas.width = Math.round(w * d);
        this.canvas.height = Math.round(h * d);
      }
      const logical = Math.min(960, Math.max(560, w));
      return { w: logical, h: (logical * h) / w };
    }
    effect(e, f) {
      if(e.type==="feathers")for(let i=0;i<44;i++){
        const angle=Math.random()*TAU,speed=45+Math.random()*130;
        this.particles.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed+(e.vx||0)*.16,vy:Math.sin(angle)*speed+(e.vy||0)*.12,life:1.8+Math.random()*1.5,initial:3.3,size:3+Math.random()*4,color:["#dbe3df","#9fb5bf","#eff0dc","#6b8596"][i%4],angle,spin:Math.random()*5-2.5,feather:true,phase:Math.random()*6});
      }
      if (["hit", "collision", "destroy", "lightning"].includes(e.type)) {
        this.shake =
          e.type === "destroy" ? 1 : 0.35 + Math.min(0.5, (e.force || 0) / 180);
        const number =
          e.kind==="bird"?0:e.type === "destroy" ? 36 : e.type === "collision" ? 20 : 8;
        for (let i = 0; i < number; i++) {
          const a = Math.random() * TAU,
            v = 30 + Math.random() * 90;
          this.particles.push({
            x: e.x ?? f.x,
            y: e.y ?? f.y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 1 + Math.random(),
            initial: 2,
            angle: a,
            spin: Math.random() * 7 - 3,
            color: (e.kind === "asteroid"
              ? ["#a59a84", "#74837e", "#d7c4a0"]
              : e.kind === "balloon"
                ? ["#dfba7b", "#bc795b", "#b49a71"]
                : ["satellite","deepSatellite","mothership"].includes(e.kind)
                  ? ["#829faa", "#d3bd83", "#d6ddbd"]
                  : ["#d3c39a", "#e39556", "#96b4ac"])[i % 3],
            size: 2 + Math.random() * 5,
            metal: e.type !== "lightning" && !e.soft && e.kind !== "asteroid",
          });
        }
        if (e.type === "hit")
          this.popups.push({
            x: f.x,
            y: f.y + 35,
            text: e.loss ? "−" + Math.ceil(e.loss) + " CASCO" : "ESCUDO!",
            life: 1.2,
            color: "#f8d3a2",
          });
      }
      if (e.type === "pickup") {
        this.popups.push({
          x: e.x,
          y: e.y,
          text: {
            arcadeRelic:"MEMÓRIA: ARCADE ZONE",
            cash: "+$" + e.amount,
            fuel: Number.isFinite(e.fuelAdded)?(e.fuelAdded>0?"+"+e.fuelAdded.toLocaleString("pt-BR",{maximumFractionDigits:1})+" L"+(e.fuelTier>1?" · "+(e.fuelTier===3?"XL":"G"):""):"TANQUE CHEIO"):"+COMBUSTÍVEL",
            repair: "+CASCO",
            aux: "+PROPULSOR",
            shield: "+ESCUDO",
          }[e.kind],
          life: 1.4,
          color: "#ecedb3",
        });
        for (let i = 0; i < 9; i++)
          this.particles.push({
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * 65,
            vy: (Math.random() - 0.5) * 65,
            life: 0.6,
            initial: 0.6,
            size: 3,
            color: "#e9d989",
          });
      }
      if (this.popups.length > 3) this.popups.splice(0, this.popups.length - 3);
      if (this.particles.length > 180)
        this.particles.splice(0, this.particles.length - 180);
    }
    draw(f, p, ms, dt = 0.016) {
      const { w, h } = this.resize(),
        g = this.g,
        t = ms / 1000,
        options = this.options;
      g.setTransform(this.canvas.width / w, 0, 0, this.canvas.height / h, 0, 0);
      g.lineCap = "round";
      g.lineJoin = "round";
      g.globalAlpha = 1;
      if (options.scene === "intro") {
        laboratory(g, w, h, t, options.chapter || 0);
        return;
      }
      if (options.scene === "result" && !f?.win) {
        hangar(g, w, h, t, p, { ...options, damaged: true });
        return;
      }
      if (options.scene === "workshop") {
        root.SeleneParts.assemblyPreview(
          g,
          w,
          h,
          options.previewLevels || p.levels,
          t,
        );
        return;
      }
      if(f && (f.approach>0 || f.win)){root.SeleneFinale.draw(g,w,h,f.win?D.finaleDuration:f.approach,f.levels,f.win);return;}
      if (!f) {
        hangar(g, w, h, t, p, options);
        return;
      }
      const alt = Math.max(0, f.y),
        z =
          alt < 3000
            ? ["#69a5bb", "#c3d7b7"]
            : alt < 7000
              ? ["#447da4", "#9dbcb5"]
              : alt < 16000
                ? ["#274b75", "#6892a4"]
                : ["#1e2e54", "#4b5c7c"];
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, z[0]);
      grad.addColorStop(1, z[1]);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.translate(
        Math.sin(t * 73) * this.shake * 5,
        Math.cos(t * 61) * this.shake * 3,
      );
      if (alt > 4500) {
        g.save();
        g.globalAlpha = Math.min(1, (alt - 4500) / 4000);
        for (let i = 0; i < 120; i++) {
          const x = (i * 173 + 8) % w,
            y = ((i * 93 + alt * 0.035) % (h + 40)) - 20;
          g.fillStyle = i % 4 ? "#e4dfbd" : "#a6ddd7";
          g.fillRect(x, y, i % 7 ? 1.3 : 2.3, i % 7 ? 1.3 : 2.3);
        }
        g.restore();
      }
      if (alt < 9000) {
        g.save();
        g.globalAlpha = Math.max(0, 1 - alt / 9000);
        clouds(g, w, h, t, alt);
        g.restore();
      }
      if (alt > 6500)
        A.earth(g, w * 0.17, h * 0.85, Math.max(55, 150 - alt * 0.002), t);
      // One shared, viewport-based scale. Acceleration never zooms the world away.
      const desired = clamp(Math.min(w / 760, h / 650), .45, .72);
      this.scale = desired;
      this.anchorMix +=
        (clamp(-f.vy / 120,0,1) - this.anchorMix) * (1-Math.exp(-dt*1.8));
      const scale = this.scale,
        anchor = h * (0.64 - 0.12 * this.anchorMix),
        cameraX = f.x * 0.87,
        world = (x, y) => ({
          x: w * 0.45 + (x - cameraX) * scale,
          y: anchor - (y - f.y) * scale,
        });
      const objective = D.target(f), aim = world(objective.x,objective.y);
      if (aim.y > -240 && aim.y < h+240) {
        A.threat(g,aim.x,aim.y,objective.r*scale,t);
        g.save(); g.strokeStyle="#f7c781";g.lineWidth=1.5;g.setLineDash([5,7]);
        g.beginPath();g.arc(aim.x,aim.y,(objective.r+24)*scale,0,Math.PI*2);g.stroke();g.setLineDash([]);
        g.textAlign="center";text(g,"INTERCEPTAÇÃO AUTOMÁTICA · "+(D.goal/1000)+" KM",aim.x,aim.y+(objective.r+48)*scale,Math.min(12,w*.025),"#ffe1a1");g.restore();
      } else {
        const bx=clamp(aim.x,75,w-75), by=aim.y<0?24:h-35;
        g.save();g.textAlign="center";
        text(g,(aim.y<0?"▲ ":"▼ ")+"OBJETIVO: 48 KM",bx,by,11,"#f6d79b");g.restore();
      }
      // The platform top is world y=0, shared with the fins at launchY=42.
      const padY = world(0, 0).y;
      this.padPose = { x: world(0, 0).x, y: padY };
      if (alt < 600) ground(g, w, h, padY - (h - 51), t);
      if (
        (f.engineOn || f.boostOn || f.crashing) &&
        f.countdown === 0 &&
        !f.ended
      ) {
        this.trail.push({
          x: f.x - Math.sin(f.angle) * 31,
          y: f.y - Math.cos(f.angle) * 31,
          life: f.crashing ? 1.5 : 1,
          size: f.crashing ? 13 : f.boostOn ? 11 : 7,
          smoke: f.crashing,
        });
      }
      if (this.trail.length > 90) this.trail.shift();
      this.trail = this.trail.filter((a) => (a.life -= dt) > 0);
      for (const a of this.trail) {
        const q = world(a.x, a.y);
        g.globalAlpha = a.life * 0.4;
        ellipse(
          g,
          q.x,
          q.y,
          a.size * (1.7 - a.life),
          a.size * (1.7 - a.life),
          a.smoke ? "#424b54" : "#ebdfbd",
          null,
        );
      }
      g.globalAlpha = 1;
      for (const o of f.objects) {
        const a = world(o.x, o.y);
        if (a.y < -140 || a.y > h + 150 || a.x < -140 || a.x > w + 140)
          continue;
        g.save();
        g.translate(a.x, a.y);
        g.scale(scale, scale);
        if (o.hit) {
          g.globalAlpha = clamp(o.collected / 0.55, 0, 1);
          g.scale(
            1 + (0.55 - o.collected) * 1.3,
            1 + (0.55 - o.collected) * 1.3,
          );
        }
        if (o.kind === "pickup") {
          // Enlarge the illustrated supplies to match the larger collection radius.
          g.save(); g.scale(1.2,1.2); pickup(g,{...o,fuelTier:o.type==="fuel"?D.fuelGrade(o).tier:0,x:0,y:0},t); g.restore();
          if(!o.hit && ["fuel","repair"].includes(o.type)) {
            g.strokeStyle=o.type==="fuel"?"#ffd09a":"#c7f5ae";g.lineWidth=1.5/scale;
            g.beginPath();g.arc(0,0,32*(o.type==="fuel"?D.fuelGrade(o).scale:1)+Math.sin(t*3+(o.phase||0))*2,0,Math.PI*2);g.stroke();
          }
        }
        else if (o.kind === "gate") A.gate(g, o, t);
        else obstacle(g, { ...o, x: 0, y: 0 }, t);
        g.restore();
      }
      for (const type of ["fuel","repair"]) {
        const nearest=f.objects.filter(o=>o.kind==="pickup" && o.type===type && !o.hit && Math.abs(o.y-f.y)<550)
          .sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y))[0];
        if(!nearest)continue;
        const hint=world(nearest.x,nearest.y), visible=hint.x>38&&hint.x<w-75&&hint.y>30&&hint.y<h-40;
        const x=visible?hint.x:clamp(hint.x,65,w-115),y=visible?hint.y+35*scale*(type==="fuel"?D.fuelGrade(nearest).scale:1):clamp(hint.y,160,h-115);
        const arrow=visible?"":hint.x<38?"◀ ":hint.x>w-75?"▶ ":hint.y<30?"▲ ":"▼ ";
        const hintFont=w<600?11:12;
        g.save();g.textAlign="center";g.font="bold "+hintFont+"px sans-serif";g.lineWidth=3;g.strokeStyle="#132c3c";
        const label=arrow+(type==="fuel"?"COMBUSTÍVEL"+(D.fuelGrade(nearest).tier>1?" "+D.fuelGrade(nearest).tag:""):"REPARO");g.strokeText(label,x,y);text(g,label,x,y,hintFont,type==="fuel"?"#ffdda3":"#d0f7af");g.restore();
      }
      this.particles = this.particles.filter((a) => (a.life -= dt) > 0);
      for (const a of this.particles) {
        if(a.feather){a.vx*=Math.exp(-dt*.75);a.vy+=(-22-a.vy)*Math.min(1,dt*1.1);}
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if(!a.feather)a.vy -= 25 * dt;
        a.angle = (a.angle || 0) + (a.spin || 0) * dt;
        const q = world(a.x, a.y);
        g.save();
        g.translate(q.x, q.y);
        g.rotate((a.angle || 0)+(a.feather?Math.sin(t*5+a.phase)*.5:0));
        g.globalAlpha = Math.min(1, a.life * 2);
        if(a.feather){A.feather(g,0,0,a.size,a.color);g.restore();continue;}
        box(
          g,
          -a.size / 2,
          -a.size / 2,
          a.size * 1.6,
          a.size,
          a.color,
          a.metal ? ink : null,
          0,
          1,
        );
        g.restore();
      }
      const q = world(f.x, f.y);
      const spriteScale = scale;
      this.pose = { ...q, w, h, spriteScale };
      this.shake = Math.max(0, this.shake - dt * 1.8);
      const shake = Math.sin(t * 73) * this.shake * 5;
      g.save();
      if (f.damageFlash > 0) g.globalAlpha = 0.5 + Math.sin(t * 45) * 0.25;
      rocket(
        g,
        q.x + shake,
        q.y,
        spriteScale,
        f.angle,
        p.levels,
        t,
        f.engineOn && f.countdown === 0,
        f.boostOn,
        f.shield,
        false,
        f.hp / f.stats.health,
      );
      g.restore();
      if (f.disabledFor > 0) root.SeleneParts.emp(g, q.x, q.y, spriteScale, t);
      this.popups = this.popups.filter((a) => (a.life -= dt) > 0);
      for (const a of this.popups) {
        a.y += 22 * dt;
        const q = world(a.x, a.y);
        g.save();
        g.globalAlpha = Math.min(1, a.life * 2);
        g.textAlign = "center";
        g.strokeStyle = ink;
        g.lineWidth = 3;
        g.font = "bold 15px sans-serif";
        g.strokeText(a.text, q.x, q.y);
        text(g, a.text, q.x, q.y, 15, a.color);
        g.restore();
      }
      if (f.countdown > 0) {
        g.save();
        g.textAlign = "center";
        g.strokeStyle = ink;
        g.lineWidth = 5;
        g.font = '900 96px "Barlow Condensed",sans-serif';
        g.strokeText(String(Math.ceil(f.countdown)), w * 0.45, h * 0.31);
        text(
          g,
          String(Math.ceil(f.countdown)),
          w * 0.45,
          h * 0.31,
          96,
          "#f4d97f",
          '"Barlow Condensed",sans-serif',
        );
        g.restore();
      }
      if (f.damageFlash > 0) {
        g.strokeStyle = "#c0564899";
        g.lineWidth = 12;
        g.strokeRect(5, 5, w - 10, h - 10);
      }
    }
  }
  function preview(g, w, h, t) {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#5a8eae");
    grad.addColorStop(1, "#c3cfaa");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    clouds(g, w, h, t, 0);
    A.threat(g, w * 0.83, h * 0.24, h * 0.14, t);
    rocket(
      g,
      w * 0.56,
      h * 0.62,
      Math.max(0.5, h / 190),
      -0.13,
      { engine: 3, tank: 2, booster: 2 },
      t,
      true,
      true,
    );
    pelicano(g, w * 0.17, h * 1.25, h / 280, t, "excited", true);
  }
  root.SeleneRenderer = {
    View,
    rocket,
    pelicano,
    laboratory,
    preview,
    obstacle,
    pickup,
  };
})(window);
