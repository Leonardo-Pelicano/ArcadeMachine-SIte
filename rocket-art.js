/* Original illustrated props for the Pelicano laboratory and flight world. */
(function (root) {
  "use strict";
  const ink = "#293f49",
    TAU = Math.PI * 2;
  function path(g, p, fill, stroke = ink, lw = 1.7) {
    g.beginPath();
    p.forEach((q, i) => {
      if (q[0] === "Q") g.quadraticCurveTo(...q.slice(1));
      else if (q[0] === "C") g.bezierCurveTo(...q.slice(1));
      else i ? g.lineTo(...q) : g.moveTo(...q);
    });
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
  function oval(g, x, y, rx, ry, fill, stroke = ink, lw = 1.6) {
    g.beginPath();
    g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
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
  function rect(g, x, y, w, h, fill, stroke = ink, r = 3, lw = 1.5) {
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
  function line(g, p, color = ink, lw = 1.5) {
    g.beginPath();
    p.forEach((q, i) => (i ? g.lineTo(...q) : g.moveTo(...q)));
    g.strokeStyle = color;
    g.lineWidth = lw;
    g.stroke();
  }
  function grad(g, x1, y1, x2, y2, colors) {
    const c = g.createLinearGradient(x1, y1, x2, y2);
    colors.forEach((v, i) => c.addColorStop(i / (colors.length - 1), v));
    return c;
  }
  function rivet(g, x, y) {
    oval(g, x, y, 1.6, 1.6, "#dbe4cd", ink, 0.65);
  }
  function label(g, s, x, y, size = 9, color = ink) {
    g.fillStyle = color;
    g.font = "bold " + size + "px sans-serif";
    g.fillText(s, x, y);
  }
  function basket(g, y = 40, a = 1) {
    g.save();
    g.globalAlpha *= a;
    line(
      g,
      [
        [-12, 22],
        [-9, y],
        [9, y],
        [12, 22],
      ],
      "#665b47",
      1.1,
    );
    rect(
      g,
      -13,
      y,
      26,
      17,
      grad(g, -13, y, 13, y, ["#ddbd80", "#a77e55"]),
      ink,
      3,
      1.5,
    );
    g.save();
    g.beginPath();
    g.rect(-11, y + 2, 22, 13);
    g.clip();
    for (let i = -18; i < 20; i += 6) {
      line(
        g,
        [
          [i, y],
          [i + 11, y + 18],
        ],
        "#8c6d4d",
        0.75,
      );
      line(
        g,
        [
          [i + 11, y],
          [i, y + 18],
        ],
        "#f0d29a",
        0.7,
      );
    }
    g.restore();
    rect(g, -14, y - 2, 28, 5, "#947550", ink, 2, 1);
    g.restore();
  }
  function balloon(g, o, t) {
    if (o.state === "popped") {
      const age = o.age || 0;
      g.save();
      g.globalAlpha *= Math.max(0, 1 - age / 1.6);
      for (let i = 0; i < 6; i++) {
        g.save();
        g.translate(
          Math.sin(i * 2.1) * age * 42,
          Math.cos(i * 2.1) * age * 32 + age * age * 12 - 12,
        );
        g.rotate(i * 0.7 + age * (i % 2 ? 2 : -2));
        path(
          g,
          [
            [0, -12],
            ["Q", 14, -3, 6, 12],
            ["Q", -4, 1, -8, -6],
          ],
          i % 2 ? "#c87c58" : "#e4be79",
          ink,
          1,
        );
        g.restore();
      }
      basket(g, 40 + age * age * 25);
      g.restore();
      return;
    }
    const body = [
      [-11, 24],
      ["C", -18, 12, -32, -2, -31, -19],
      ["C", -31, -36, -19, -47, 0, -47],
      ["C", 19, -47, 31, -36, 31, -19],
      ["C", 32, -2, 18, 12, 11, 24],
    ];
    path(
      g,
      body,
      grad(g, -31, 0, 31, 0, ["#a76f54", "#efd397", "#c28b5c"]),
      ink,
      1.9,
    );
    g.save();
    g.beginPath();
    g.moveTo(-11, 24);
    g.bezierCurveTo(-18, 12, -32, -2, -31, -19);
    g.bezierCurveTo(-31, -36, -19, -47, 0, -47);
    g.bezierCurveTo(19, -47, 31, -36, 31, -19);
    g.bezierCurveTo(32, -2, 18, 12, 11, 24);
    g.closePath();
    g.clip();
    path(
      g,
      [
        [-2, -48],
        ["C", -21, -33, -21, -7, -6, 24],
        [7, 24],
        ["C", 19, -9, 20, -33, 2, -48],
      ],
      grad(g, -13, 0, 14, 0, ["#bf7757", "#d99f70", "#a76450"]),
      "#8d6d52",
      0.8,
    );
    g.beginPath();
    g.moveTo(0, -47);
    g.bezierCurveTo(-6, -27, -6, -2, 0, 24);
    g.strokeStyle = "#ead6a3";
    g.lineWidth = 1;
    g.stroke();
    line(
      g,
      [
        [-30, -18],
        [30, -18],
      ],
      "#e6ca94",
      1,
    );
    line(
      g,
      [
        [-23, 4],
        [23, 4],
      ],
      "#9a7758",
      0.75,
    );
    g.restore();
    oval(g, -15, -29, 4, 9, "#fff2c340", null);
    rect(g, -9, 22, 18, 5, "#a58b5e", ink, 2, 1);
    basket(g);
    if (Math.sin(t * 3 + (o.phase || 0)) > 0.65)
      path(
        g,
        [
          [-3, 30],
          [0, 23],
          [3, 30],
        ],
        "#e6ad5d",
        null,
      );
  }
  function feather(g,x,y,size,color="#d8dfd7"){
    g.save();g.translate(x,y);g.scale(size/7,size/7);
    path(g,[[0,-10],["C",-6,-8,-5,1,0,8],["C",6,0,5,-8,0,-10]],color,"#455969",.7);
    line(g,[[0,-8],[0,11]],"#e5e6d5",.65);for(const k of[-1,1])for(let i=0;i<3;i++)line(g,[[0,-5+i*4],[k*3,-7+i*4]],"#70858c88",.4);
    g.restore();
  }
  function bird(g,o,t){
    const flap=Math.sin(t*(o.state==="flee"?18:12)+(o.phase||0)),dir=o.facing||((o.vx||1)<0?-1:1);
    g.save();g.scale(dir,1);g.rotate(Math.sin(t*2+(o.phase||0))*.035);
    // Far wing, tail and layered flight feathers, behind the rounded body.
    path(g,[[-6,1],["C",-15,-5-flap*10,-19,-18-flap*16,-30,-9-flap*14],["Q",-34,-2-flap*9,-23,4],[-12,9]],"#718a95",ink,1.2);
    path(g,[[-12,3],[-29,0],[-33,6],[-24,10],[-11,8]],"#4e6677",ink,1.2);
    oval(g,-1,5,15,8,grad(g,-7,-3,10,12,["#d7e0da","#9aafb6","#647d90"]),ink,1.4);
    path(g,[[-7,3],["C",-14,-5-flap*10,-16,-21-flap*19,-27,-17-flap*17],["Q",-33,-13-flap*14,-28,-7-flap*10],["Q",-30,-2-flap*7,-23,3],["Q",-22,8,-14,10],[-2,9]],"#a9bdc7",ink,1.3);
    for(let i=0;i<4;i++)line(g,[[-8-i*3,4],[-24-i*1.5,-7-flap*(12+i*2)]],i%2?"#718998":"#d4dedc",.8);
    oval(g,10,-2,6,8,"#728d9a",ink,1.2);
    path(g,[[5,-1],[6,5],[13,5],[16,1]],"#78a49a",null);
    oval(g,14,-8,7,6,grad(g,9,-12,18,-3,["#c6d3d5","#819ba7"]),ink,1.2);
    path(g,[[20,-8],[27,-5],[20,-3]],"#d9b16d",ink,.8);
    oval(g,16,-9,2,2,"#f5dba3",null);oval(g,16.6,-9.2,1.1,1.1,"#162c40",null);
    line(g,[[-1,12],[-6,15],[-2,15]],"#b08279",1);line(g,[[5,12],[1,16],[5,16]],"#b08279",1);
    g.restore();
  }
  function deepSatellite(g,o,t){
    const wreck=o.state==="wreck";g.save();if(!wreck)g.rotate(Math.sin(t*.23+(o.phase||0))*.035);
    for(const k of[-1,1]){
      line(g,[[k*14,-22],[k*76,-22]],"#94a9a7",5);line(g,[[k*14,23],[k*76,23]],"#94a9a7",5);
      solarPanel(g,k*53,-22,47,30,wreck&&k<0);solarPanel(g,k*53,23,47,30,false);
    }
    rect(g,-18,-32,36,66,grad(g,-20,-25,20,35,["#e3c98d","#a98f60","#ddd6ad"]),ink,5,1.6);
    rect(g,-12,-23,24,45,"#b69b69",ink,3,1);for(let i=0;i<4;i++)line(g,[[-9,-17+i*11],[9,-17+i*11]],"#ead8a6",1);
    // Deep-space telescope and a segmented communication dish.
    line(g,[[0,-32],[0,-54]],"#a5b7b2",6);
    path(g,[[-25,-61],["Q",0,-28,25,-61],["Q",0,-70,-25,-61]],"#ccd8d2",ink,1.5);
    for(const k of[-1,0,1])line(g,[[0,-45],[k*20,-62]],"#718c96",.8);
    line(g,[[0,-48],[0,-73]],"#bdc8b8",2);oval(g,0,-73,3,3,"#e8c989",ink,.8);
    rect(g,-13,20,26,19,"#607e92",ink,3,1.3);oval(g,0,30,8,8,"#1b435b",ink,1.2);oval(g,-2,28,4,4,"#96d8db",null);
    for(const y of[-27,27])for(const x of[-14,14])rivet(g,x,y);
    if(!wreck){oval(g,12,-23,2.5,2.5,Math.sin(t*3)>0?"#d5e7ad":"#69897b",null);}
    g.restore();
  }
  function mothership(g,o,t){
    const wreck=o.state==="wreck",pulse=.6+.4*Math.sin(t*2+(o.phase||0));g.save();
    if(!wreck)for(const x of[-72,0,72]){
      const z=grad(g,0,13,0,45,["#a6e9d58a","#9bded000"]);path(g,[[x-10,14],[x-15,43+pulse*5],[x+15,43+pulse*5],[x+10,14]],z,null);
    }
    // Tiered armored hull, inset bridge, engine pods and a ring of windows.
    path(g,[[-108,9],[-86,-10],[-58,-23],[58,-23],[86,-10],[108,9],[86,25],[-86,25]],grad(g,0,-25,0,27,["#bdc5b6","#728d91","#304d62"]),ink,2);
    path(g,[[-68,-14],[-43,-42],[43,-42],[68,-14]],grad(g,0,-44,0,-10,["#718b96","#bccabb","#4e6c7d"]),ink,1.8);
    path(g,[[-37,-37],[-25,-49],[25,-49],[37,-37],[31,-21],[-31,-21]],"#284d5f",ink,1.3);
    path(g,[[-28,-36],[-21,-43],[21,-43],[28,-36],[24,-26],[-24,-26]],grad(g,0,-44,0,-24,["#b4e5d8","#4f9c9c"]),"#88bcae",1);
    for(const x of[-14,0,14])line(g,[[x,-42],[x,-25]],"#426e78",1);
    if(!wreck){oval(g,0,-32,11,6,"#507f8155",null);for(const x of[-5,5]){oval(g,x,-33,2.5,1.8,"#d3f5b5",null);line(g,[[x,-34],[x,-32]],"#2d5164",.8);}}
    for(const x of[-80,-60,-40,-20,0,20,40,60,80])rect(g,x-4,0,8,5,wreck?"#4b6269":Math.sin(t*2+x*.1)>.1?"#e6d398":"#82bbb4",ink,1,.7);
    for(const k of[-1,1]){rect(g,k*84-15,7,30,17,"#617e89",ink,4,1.5);oval(g,k*84,14,8,5,wreck?"#344f60":"#a2d6ca",ink,1);line(g,[[k*55,-18],[k*95,9]],"#d0c69c",1.3);}
    oval(g,0,20,28,8,"#294e62",ink,1.3);oval(g,0,19,19,4,wreck?"#516c78":"#a5dccd",null);
    for(const x of[-48,48])line(g,[[x,-25],[x,-55]],"#8aa69f",1.8);
    for(const x of[-48,48])oval(g,x,-55,2.5,2.5,Math.sin(t*4+x)>0?"#dbc18e":"#728d8d",null);
    if(wreck)path(g,[[-25,-13],[-8,-5],[-17,5],[8,12]],null,"#233c51",2);
    g.restore();
  }
  function arcadeRelic(g,o,t){
    g.save();const glow=.65+.2*Math.sin(t*3);g.globalAlpha*=glow;
    oval(g,0,0,27,35,"#b995dd24",null);g.globalAlpha/=glow;
    rect(g,-21,-29,42,58,grad(g,0,-30,0,30,["#b0bfc5","#365369"]),ink,6,1.6);
    rect(g,-16,-24,32,39,"#172b49","#9c87c4",3,1);
    // The blue ship silhouette and white center strip are the Arcade Zone player.
    path(g,[[0,-19],[12,8],[4,5],[0,12],[-4,5],[-12,8]],"#57d8ff",null);
    rect(g,-2,-9,4,16,"#b8f1ff",null,0);
    g.fillStyle="#cfb3ee";g.textAlign="center";g.font='bold 4.5px "Space Mono",monospace';g.fillText("ARCADE ZONE",0,22);
    for(const x of[-16,16])for(const y of[-24,24])rivet(g,x,y);
    g.restore();
  }
  function storm(g, o, t) {
    const flash = (o.flash || 0) > 0;
    g.save();
    const silhouette = [
      [-65, 10],
      ["C", -78, -7, -65, -26, -48, -25],
      ["C", -46, -43, -24, -48, -10, -36],
      ["C", 4, -57, 34, -42, 34, -26],
      ["C", 58, -32, 75, -16, 65, 4],
      ["C", 57, 19, 30, 19, 21, 14],
      ["C", 1, 27, -26, 19, -34, 14],
      ["C", -47, 22, -61, 20, -65, 10],
    ];
    path(
      g,
      silhouette,
      grad(
        g,
        0,
        -43,
        0,
        24,
        flash ? ["#e0e8ca", "#a6c9c9"] : ["#9aafb4", "#596f86", "#435e76"],
      ),
      ink,
      1.9,
    );
    g.beginPath();
    g.moveTo(-60, -8);
    g.quadraticCurveTo(-54, -21, -43, -18);
    g.moveTo(-39, -26);
    g.quadraticCurveTo(-27, -38, -16, -29);
    g.moveTo(2, -31);
    g.quadraticCurveTo(18, -40, 28, -27);
    g.strokeStyle = flash ? "#f5edc8" : "#c3d0c4";
    g.lineWidth = 1.3;
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const phase = (t * 0.7 + i * 0.17) % 1,
        x = -43 + i * 17;
      line(
        g,
        [
          [x, 24 + phase * 15],
          [x - 3, 31 + phase * 15],
        ],
        "#8ab6c377",
        1.4,
      );
    }
    path(
      g,
      [
        [-3, 10],
        [-16, 32],
        [-3, 29],
        [-8, 49],
        [16, 20],
        [3, 23],
        [10, 10],
      ],
      flash ? "#fff0a2" : "#e4bf64",
      "#9a8655",
      1.2,
    );
    if (flash) {
      g.strokeStyle = "#e6f7d8";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-22, -9);
      g.lineTo(-6, -1);
      g.lineTo(-11, 10);
      g.lineTo(8, 16);
      g.stroke();
    }
    g.restore();
  }
  function solarPanel(g, x, y, w, h, damaged = false) {
    g.save();
    g.translate(x, y);
    if (damaged) g.rotate(0.12);
    rect(g, -w / 2, -h / 2, w, h, "#b8c6ae", ink, 2, 1.5);
    rect(
      g,
      -w / 2 + 3,
      -h / 2 + 3,
      w - 6,
      h - 6,
      grad(g, 0, -h / 2, w / 2, h / 2, ["#4e718c", "#8ca9af", "#456e8c"]),
      "#485f6d",
      1,
      0.8,
    );
    for (let i = 1; i < 4; i++)
      line(
        g,
        [
          [-w / 2 + 3, -h / 2 + 3 + ((h - 6) * i) / 4],
          [w / 2 - 3, -h / 2 + 3 + ((h - 6) * i) / 4],
        ],
        "#c3d8c4",
        0.65,
      );
    for (let i = 1; i < 4; i++)
      line(
        g,
        [
          [-w / 2 + 3 + ((w - 6) * i) / 4, -h / 2 + 3],
          [-w / 2 + 3 + ((w - 6) * i) / 4, h / 2 - 3],
        ],
        "#c3d8c4",
        0.65,
      );
    if (damaged)
      line(
        g,
        [
          [-10, -10],
          [0, -3],
          [-5, 4],
          [10, 12],
        ],
        "#344c5d",
        1.5,
      );
    else
      line(
        g,
        [
          [-w / 2 + 5, -h / 2 + 6],
          [w / 2 - 6, h / 2 - 7],
        ],
        "#eff5d138",
        2,
      );
    g.restore();
  }
  function satellite(g, o, t) {
    const wreck = o.state === "wreck";
    g.save();
    if (!wreck) g.rotate(Math.sin(t * 0.25 + (o.phase || 0)) * 0.055);
    line(
      g,
      [
        [-53, 1],
        [53, 1],
      ],
      "#839d99",
      6,
    );
    solarPanel(g, -39, 1, 39, 31, wreck);
    solarPanel(g, 39, 1, 39, 31, false);
    const foil = grad(
      g,
      -16,
      0,
      16,
      0,
      wreck
        ? ["#a4a084", "#c1bda1", "#8a8e7f"]
        : ["#af915b", "#e3cf92", "#b19b67"],
    );
    rect(g, -16, -23, 32, 46, foil, ink, 5, 1.8);
    path(
      g,
      [
        [4, -22],
        [15, -20],
        [15, 21],
        [4, 23],
      ],
      "#96856a55",
      null,
    );
    rect(g, -9, -12, 18, 15, "#637f86", ink, 2, 1);
    oval(g, 0, -5, 4, 4, "#a5c6c5", ink, 1);
    line(
      g,
      [
        [-10, 8],
        [10, 8],
      ],
      "#8a805f",
      1,
    );
    line(
      g,
      [
        [-10, 14],
        [10, 14],
      ],
      "#8a805f",
      1,
    );
    for (const x of [-12, 12]) for (const y of [-18, 18]) rivet(g, x, y);
    line(
      g,
      [
        [2, -23],
        [7, -33],
        [17, -36],
      ],
      ink,
      1.5,
    );
    g.save();
    g.translate(17, -36);
    g.rotate(-0.4);
    path(
      g,
      [
        [-11, -4],
        ["Q", 0, 11, 11, -4],
        ["Q", 0, 0, -11, -4],
      ],
      "#dce0bf",
      ink,
      1.2,
    );
    line(
      g,
      [
        [0, -1],
        [4, -10],
      ],
      "#8fa99f",
      1.2,
    );
    oval(g, 4, -10, 2, 2, "#bf7961", ink, 0.7);
    g.restore();
    line(
      g,
      [
        [-8, -24],
        [-12, -35],
      ],
      ink,
      1.3,
    );
    oval(
      g,
      -12,
      -36,
      2.2,
      2.2,
      wreck ? "#8c8f7b" : Math.sin(t * 3) > 0.3 ? "#e1bb5c" : "#b97856",
      ink,
      0.6,
    );
    if (wreck)
      line(
        g,
        [
          [-9, -19],
          [-1, -13],
          [-5, -6],
          [8, -1],
        ],
        "#4d615f",
        1.2,
      );
    g.restore();
  }
  function rotor(g, x, y, phase, live) {
    g.save();
    g.translate(x, y);
    oval(g, 0, 0, 15, 4, live ? "#c5dac366" : "#829c9755", null);
    const a = phase,
      dx = Math.cos(a) * 14,
      dy = Math.sin(a) * 3.5;
    line(
      g,
      [
        [-dx, -dy],
        [dx, dy],
      ],
      "#617e7c",
      2,
    );
    oval(g, 0, 0, 3, 3, "#c3ceb4", ink, 1);
    g.restore();
  }
  function drone(g, o, t) {
    const wreck = o.state === "wreck",
      spin = wreck ? (o.age || 0) * 5 : t * 31 + (o.phase || 0);
    g.save();
    line(
      g,
      [
        [-35, -9],
        [-9, 2],
        [35, -9],
      ],
      "#778f8d",
      5,
    );
    line(
      g,
      [
        [-30, 13],
        [-9, 2],
        [30, 13],
      ],
      "#a4b7a4",
      4,
    );
    for (const [i, q] of [
      [-35, -9],
      [35, -9],
      [-30, 13],
      [30, 13],
    ].entries()) {
      rect(g, q[0] - 4, q[1], 8, 7, "#758d8b", ink, 2, 1);
      rotor(g, q[0], q[1] - 2, spin + i, !wreck);
    }
    rect(
      g,
      -16,
      -10,
      32,
      23,
      grad(
        g,
        0,
        -10,
        0,
        13,
        wreck ? ["#a7b6a6", "#6c817f"] : ["#dce6c9", "#8baaa4"],
      ),
      ink,
      6,
      1.8,
    );
    rect(g, -8, -8, 16, 6, "#c7925f", ink, 2, 0.9);
    line(
      g,
      [
        [-10, 13],
        [-13, 24],
        [13, 24],
        [10, 13],
      ],
      "#506e73",
      1.6,
    );
    rect(g, -7, 10, 14, 11, "#667e83", ink, 3, 1.2);
    oval(g, 0, 15, 4, 4, "#8dc1cf", ink, 1.1);
    oval(g, -1, 14, 1.2, 1.2, "#e9f4d5", null);
    oval(g, -12, 2, 1.8, 1.8, wreck ? "#8d8d7e" : "#d58161", null);
    oval(
      g,
      12,
      2,
      1.8,
      1.8,
      wreck ? "#8d8d7e" : Math.sin(t * 3) > 0 ? "#d4df9b" : "#8eaf8f",
      null,
    );
    if (wreck)
      line(
        g,
        [
          [-12, -5],
          [-2, 1],
          [-6, 7],
          [7, 10],
        ],
        ink,
        1.2,
      );
    g.restore();
  }
  function ufo(g, o, t) {
    const wreck = o.state === "wreck";
    g.save();
    if (!wreck) {
      const flare = g.createRadialGradient(0, 19, 1, 0, 20, 20);
      flare.addColorStop(0, "#a1e2de66");
      flare.addColorStop(1, "#a1e2de00");
      oval(g, 0, 21, 21, 9, flare, null);
    }
    oval(
      g,
      0,
      9,
      47,
      13,
      grad(g, 0, -2, 0, 22, [
        "#d6ddbd",
        wreck ? "#8c9c92" : "#8da7a2",
        "#5c7c82",
      ]),
      ink,
      1.8,
    );
    path(
      g,
      [
        [-24, 2],
        ["C", -25, -30, 25, -30, 24, 2],
      ],
      grad(g, -20, -22, 20, 2, ["#d3eee0", "#90c5cc", "#658b9f"]),
      ink,
      1.7,
    );
    g.save();
    g.beginPath();
    g.moveTo(-22, 2);
    g.bezierCurveTo(-23, -26, 23, -26, 22, 2);
    g.closePath();
    g.clip();
    if (!wreck) {
      oval(g, 0, -5, 9, 11, "#a6bb86", "#5b7e70", 1);
      oval(g, -4, -7, 2.5, 3.5, "#344e50", null);
      oval(g, 4, -7, 2.5, 3.5, "#344e50", null);
      line(
        g,
        [
          [-2, -1],
          [2, -1],
        ],
        "#70865e",
        1,
      );
    }
    g.restore();
    g.beginPath();
    g.moveTo(-17, -4);
    g.quadraticCurveTo(-18, -18, -7, -20);
    g.strokeStyle = "#eef5d8aa";
    g.lineWidth = 2;
    g.stroke();
    path(
      g,
      [
        [-47, 7],
        ["Q", 0, -7, 47, 7],
        ["Q", 39, 16, 0, 17],
        ["Q", -39, 16, -47, 7],
      ],
      grad(g, 0, 3, 0, 18, ["#c7d5b8", "#7d9a96"]),
      ink,
      1.7,
    );
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 11,
        y = 10 + 3 * (1 - (x / 36) ** 2);
      oval(
        g,
        x,
        y,
        2.2,
        1.8,
        wreck ? "#667d78" : Math.sin(t * 3 - i) > 0.2 ? "#e6cb74" : "#a7c5a0",
        ink,
        0.65,
      );
    }
    line(
      g,
      [
        [-20, 20],
        [-15, 25],
      ],
      "#607b7b",
      1.6,
    );
    line(
      g,
      [
        [20, 20],
        [15, 25],
      ],
      "#607b7b",
      1.6,
    );
    if (wreck)
      line(
        g,
        [
          [-14, -18],
          [-3, -10],
          [-7, -3],
          [5, 2],
        ],
        "#415e69",
        1.3,
      );
    g.restore();
  }
  function asteroid(g, o, t) {
    const r = o.r || 30,
      seed = o.id || 0;
    g.save();
    if (o.state !== "wreck") g.rotate((o.phase || 0) + t * 0.06);
    const points = Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * TAU,
        rr = r * (0.88 + 0.11 * Math.sin(i * 5.3 + seed));
      return [Math.cos(a) * rr, Math.sin(a) * rr];
    });
    const rock = grad(g, -r, -r, r, r, ["#c2b59a", "#9c9d8a", "#697e7e"]);
    path(g, points, rock, ink, 1.8);
    g.save();
    g.beginPath();
    points.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)));
    g.closePath();
    g.clip();
    path(
      g,
      [
        [r * 0.1, -r],
        [r * 0.4, -r * 0.2],
        [r * 0.9, r * 0.1],
        [r * 0.5, r * 0.9],
        [-r * 0.1, r * 0.4],
      ],
      "#596f7438",
      null,
    );
    for (let i = 0; i < 4; i++) {
      const x = Math.sin(seed + i * 2.4) * r * 0.53,
        y = Math.cos(seed * 0.3 + i * 2.3) * r * 0.5,
        cr = r * (0.12 + (i % 2) * 0.08);
      oval(g, x, y, cr, cr * 0.73, "#74847c", "#667a77", 0.7);
      g.beginPath();
      g.ellipse(x, y, cr, cr * 0.73, 0, Math.PI, TAU);
      g.strokeStyle = "#e4d4ac";
      g.lineWidth = 1;
      g.stroke();
    }
    line(
      g,
      [
        [-r * 0.6, -r * 0.5],
        [-r * 0.15, -r * 0.7],
        [r * 0.2, -r * 0.53],
      ],
      "#e2d4ac99",
      1.1,
    );
    if (o.state === "wreck")
      line(
        g,
        [
          [-r * 0.7, -r * 0.5],
          [-r * 0.2, -r * 0.1],
          [-r * 0.4, r * 0.25],
          [r * 0.2, r * 0.5],
        ],
        "#4c676a",
        1.4,
      );
    g.restore();
    g.restore();
  }
  // TK-87 uses the same physical radius as the flight interception test.
  function threat(g, x, y, r, t) {
    g.save(); g.translate(x,y);
    const plume = grad(g,0,-r*3,0,0,["#df784000","#ed9b4277","#ffd78b"]);
    path(g,[[-r*.7,-r*.3],[-r*.5,-r*2.2],[0,-r*3.2],[r*.35,-r*1.7],[r*.72,-r*.3]],plume,null);
    g.shadowColor="#e58d40"; g.shadowBlur=r*.22;
    asteroid(g,{r,id:87,phase:-.3},t); g.shadowBlur=0;
    for (const side of [-1,1]) line(g,[[side*r*.6,-r*.52],[side*r*.15,-r*.1],[side*r*.35,r*.22],[side*r*.08,r*.65]],"#e8a25f",Math.max(1,r*.025));
    g.restore();
  }
  function gate(g, o, t) {
    g.save();
    const used = (o.boostFlash || 0) > 0,
      pulse = 0.65 + 0.15 * Math.sin(t * 3);
    g.globalAlpha *= used ? 0.8 : 1;
    oval(g, 0, 0, 57, 20, null, "#496e79", 8);
    oval(g, 0, 0, 54, 18, null, "#d9c38b", 4);
    oval(g, 0, 0, 47, 14, null, used ? "#e6edc2" : "#98dcd4", 2);
    for (const k of [-1, 1]) {
      rect(
        g,
        k * 54 - 7,
        -16,
        14,
        31,
        grad(g, 0, -15, 0, 15, ["#e0c687", "#8d7b5a"]),
        ink,
        4,
        1.5,
      );
      rect(g, k * 54 - 3, -8, 6, 14, used ? "#e6df9c" : "#9ec8c2", ink, 1, 0.7);
      for (const y of [-11, 11]) rivet(g, k * 54, y);
    }
    g.save();
    g.globalAlpha *= pulse;
    for (const x of [-13, 13])
      path(
        g,
        [
          [x - 5, 4],
          [x, -4],
          [x + 5, 4],
          [x, 1],
        ],
        "#c2f0da",
        null,
      );
    g.restore();
    g.restore();
  }
  function cloud(g, x, y, s = 1, alpha = 1) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    g.globalAlpha *= alpha;
    path(
      g,
      [
        [-63, 8],
        ["C", -82, -5, -63, -24, -47, -19],
        ["C", -43, -42, -15, -44, -5, -25],
        ["C", 10, -40, 35, -29, 35, -13],
        ["C", 57, -22, 75, -2, 60, 11],
        ["C", 35, 23, -37, 24, -63, 8],
      ],
      grad(g, 0, -35, 0, 22, ["#f4edce", "#d0dfca"]),
      null,
    );
    g.beginPath();
    g.moveTo(-54, -7);
    g.quadraticCurveTo(-45, -20, -31, -15);
    g.moveTo(-21, -27);
    g.quadraticCurveTo(-7, -34, 3, -23);
    g.strokeStyle = "#fff8e499";
    g.lineWidth = 1.2;
    g.stroke();
    g.restore();
  }
  function moon(g, x, y, r) {
    g.save();
    g.translate(x, y);
    g.scale(r / 100, r / 100);
    oval(
      g,
      0,
      0,
      100,
      100,
      grad(g, -60, -70, 90, 80, ["#f0e5b5", "#c6c9aa", "#829b98"]),
      ink,
      2,
    );
    g.beginPath();
    g.arc(0, 0, 98, 0, TAU);
    g.clip();
    for (let i = 0; i < 15; i++) {
      const cx = Math.sin(i * 2.37) * 78,
        cy = Math.cos(i * 1.73) * 77,
        cr = 5 + (i % 4) * 3;
      oval(g, cx, cy, cr, cr * 0.68, "#99ab9777", "#98a88f", 0.6);
      g.beginPath();
      g.ellipse(cx, cy, cr, cr * 0.68, 0, Math.PI, TAU);
      g.strokeStyle = "#fff1c3";
      g.lineWidth = 1;
      g.stroke();
    }
    path(
      g,
      [
        [30, -100],
        ["C", 100, -60, 92, 47, 34, 94],
        [110, 110],
        [110, -110],
      ],
      "#577c842b",
      null,
    );
    g.restore();
  }
  function earth(g,x,y,r,t=0){
    g.save();g.translate(x,y);g.scale(r/100,r/100);
    const halo=g.createRadialGradient(0,0,97,0,0,112);halo.addColorStop(0,"#91cfdc66");halo.addColorStop(1,"#91cfdc00");oval(g,0,0,112,112,halo,null);
    const ocean=g.createRadialGradient(-40,-45,4,0,0,105);ocean.addColorStop(0,"#83b8c0");ocean.addColorStop(.58,"#397b97");ocean.addColorStop(1,"#183b61");oval(g,0,0,100,100,ocean,null);
    g.beginPath();g.arc(0,0,99,0,TAU);g.clip();
    const center=(-28+Math.sin(t*.025)*3)*Math.PI/180;
    const project=([lon,lat])=>{const l=lon*Math.PI/180-center,a=lat*Math.PI/180;return {x:Math.cos(a)*Math.sin(l)*98,y:-Math.sin(a)*98,z:Math.cos(a)*Math.cos(l)};};
    const continents=[
      [[-165,65],[-140,70],[-124,69],[-110,72],[-96,72],[-82,62],[-62,52],[-54,49],[-62,42],[-75,36],[-80,25],[-91,18],[-86,12],[-77,8],[-83,7],[-96,17],[-105,24],[-115,31],[-123,43],[-130,53],[-150,60]],
      [[-81,12],[-70,11],[-62,8],[-52,4],[-47,-2],[-34,-7],[-39,-21],[-48,-28],[-54,-40],[-67,-55],[-75,-45],[-74,-28],[-80,-15],[-78,-2],[-81,8]],
      [[-17,36],[-6,36],[9,37],[16,33],[32,31],[35,23],[43,12],[51,11],[43,-4],[40,-15],[32,-26],[18,-35],[12,-30],[8,-13],[-1,4],[-10,6],[-17,15]],
      [[-10,36],[-9,43],[2,49],[-5,58],[10,58],[9,63],[20,71],[32,70],[40,58],[35,46],[27,41],[24,35],[15,38],[12,44],[7,43],[2,41]],
      [[30,70],[50,69],[80,65],[95,55],[72,30],[55,25],[48,15],[35,28],[27,41],[40,58]],
      [[-54,60],[-44,61],[-20,70],[-25,80],[-47,84],[-65,79],[-70,69]],
      [[-8,50],[-5,59],[1,58],[2,51]],[[45,-13],[51,-16],[49,-26],[44,-24]],
    ];
    const land=g.createLinearGradient(-60,-75,70,85);land.addColorStop(0,"#b6c3a0");land.addColorStop(.5,"#7d9e7b");land.addColorStop(1,"#487965");
    for(let i=0;i<continents.length;i++){
      const points=continents[i].map(project).filter(p=>p.z>-.08);if(points.length<3)continue;
      path(g,points.map(p=>[p.x,p.y]),i===5?"#d2e1d3":land,"#8fbaa54d",.45);
    }
    const desert=[[-14,29],[2,33],[28,29],[32,18],[16,15],[-8,19]].map(project);path(g,desert.map(p=>[p.x,p.y]),"#d3bf9188",null);
    oval(g,0,98,67,5,"#dae5d9",null);
    g.save();g.globalAlpha*=.65;
    for(let i=0;i<29;i++){
      const lat=-52+(i*37)%112,lon=-106+(i*51)%158,pt=project([lon,lat]);if(pt.z<.15)continue;
      const len=4+(i%5)*3,drift=Math.sin(t*.06+i)*2;
      g.beginPath();g.moveTo(pt.x-len,pt.y+drift);g.bezierCurveTo(pt.x-len*.3,pt.y-2+drift,pt.x+len*.2,pt.y+3+drift,pt.x+len,pt.y-1+drift);g.strokeStyle=i%3?"#e8eee2":"#bedcda";g.lineWidth=.7+(i%4)*.55;g.stroke();
    }g.restore();
    const shade=g.createLinearGradient(-70,-40,100,45);shade.addColorStop(.15,"#051a3100");shade.addColorStop(.6,"#0b294322");shade.addColorStop(1,"#041329c9");g.fillStyle=shade;g.fillRect(-100,-100,200,200);
    g.restore();g.save();g.translate(x,y);g.strokeStyle="#acd8d680";g.lineWidth=Math.max(1,r*.012);g.beginPath();g.arc(0,0,r,0,TAU);g.stroke();g.restore();
  }
  function tower(g, x, y) {
    g.save();
    g.translate(x, y);
    rect(g, -5, 7, 31, 12, "#869b8e", ink, 2, 1.2);
    rect(
      g,
      0,
      -176,
      18,
      185,
      grad(g, 0, 0, 18, 0, ["#d7d8b4", "#789a96"]),
      ink,
      2,
      1.6,
    );
    for (let i = 0; i < 6; i++)
      line(
        g,
        [
          [2, -171 + i * 29],
          [16, -147 + i * 29],
        ],
        "#56767c",
        1.2,
      );
    rect(g, -12, -179, 82, 7, "#657f80", ink, 2, 1.3);
    for (const cy of [-168, -5]) for (const cx of [3, 14]) rivet(g, cx, cy);
    line(
      g,
      [
        [62, -171],
        [62, -140],
        [47, -127],
      ],
      "#5c7e7b",
      1,
    );
    rect(g, 43, -130, 8, 9, "#ceab65", ink, 1, 1);
    g.restore();
  }
  function building(g, x, y) {
    g.save();
    g.translate(x, y);
    path(
      g,
      [
        [0, -65],
        [104, -65],
        [119, -55],
        [119, 25],
        [0, 25],
      ],
      "#b7bd9d",
      ink,
      1.7,
    );
    rect(
      g,
      0,
      -65,
      103,
      90,
      grad(g, 0, -65, 103, 25, ["#e5d6ac", "#b5b99a"]),
      ink,
      2,
      1.6,
    );
    path(
      g,
      [
        [-8, -66],
        [48, -104],
        [113, -66],
      ],
      grad(g, 0, -95, 0, -65, ["#cf8666", "#a05d50"]),
      ink,
      1.8,
    );
    line(
      g,
      [
        [0, -63],
        [104, -63],
      ],
      "#705d4e",
      3,
    );
    line(
      g,
      [
        [110, -61],
        [110, 17],
        [119, 20],
      ],
      "#6f8b81",
      3,
    );
    rect(g, 14, -51, 31, 29, "#7ca9af", ink, 3, 1.5);
    line(
      g,
      [
        [29, -49],
        [29, -23],
      ],
      "#d0dcc0",
      1,
    );
    line(
      g,
      [
        [17, -36],
        [43, -36],
      ],
      "#d0dcc0",
      1,
    );
    line(
      g,
      [
        [19, -46],
        [25, -42],
      ],
      "#f1efd4",
      1.2,
    );
    rect(g, 61, -37, 29, 61, "#65877f", ink, 4, 1.5);
    oval(g, 75, -20, 7, 8, "#a5cdcc", ink, 1.4);
    oval(g, 84, 3, 1.8, 1.8, "#e0c47c", ink, 0.8);
    rect(g, 56, 22, 39, 5, "#8a9b8a", ink, 1, 1);
    rect(g, 16, -84, 66, 15, "#e1dfbc", ink, 2, 1.1);
    label(g, "PELICANO / 87", 21, -74, 7);
    rect(g, 85, -98, 13, 24, "#8b9f91", ink, 2, 1.3);
    oval(g, 92, -99, 11, 3, "#778b82", ink, 1);
    g.restore();
  }
  function toolbox(g, x, y, s = 1) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    rect(g, -8, -24, 16, 9, "#6f8d87", ink, 2, 1.2);
    rect(
      g,
      -25,
      -17,
      50,
      31,
      grad(g, 0, -17, 0, 14, ["#c47c60", "#9e5e4e"]),
      ink,
      4,
      1.5,
    );
    rect(g, -26, -17, 52, 10, "#d69771", ink, 3, 1.3);
    for (const cx of [-15, 15])
      rect(g, cx - 3, -10, 6, 10, "#d1bf8f", ink, 1, 0.8);
    line(
      g,
      [
        [-20, 9],
        [20, 9],
      ],
      "#e6bd8c",
      1,
    );
    g.restore();
  }
  function flask(g, x, y, s = 1, color = "#96ba91") {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    path(
      g,
      [
        [-5, -34],
        [5, -34],
        [5, -17],
        ["Q", 19, 1, 13, 9],
        ["Q", 0, 14, -13, 9],
        ["Q", -19, 1, -5, -17],
      ],
      "#c8ded34d",
      ink,
      1.2,
    );
    path(
      g,
      [
        [-12, -2],
        ["Q", 0, 3, 12, -2],
        ["Q", 20, 13, 0, 11],
        ["Q", -20, 13, -12, -2],
      ],
      color,
      null,
    );
    rect(g, -7, -36, 14, 4, "#a6b99f", ink, 1, 1);
    line(
      g,
      [
        [-9, -11],
        [-11, -1],
      ],
      "#f6f4d3",
      1.3,
    );
    oval(g, 4, 0, 1.5, 1.5, "#e8edc1", null);
    g.restore();
  }
  function consoleBox(g, x, y, t = 0) {
    g.save();
    g.translate(x, y);
    path(
      g,
      [
        [-18, 0],
        [-18, -54],
        [12, -59],
        [21, -52],
        [21, 0],
      ],
      "#789891",
      ink,
      1.5,
    );
    rect(
      g,
      -18,
      -54,
      32,
      54,
      grad(g, -18, 0, 14, -45, ["#9eb49e", "#d1d3b0"]),
      ink,
      3,
      1.3,
    );
    rect(g, -12, -44, 20, 12, "#4b6b70", ink, 2, 1);
    line(
      g,
      [
        [-8, -37],
        [-5, -37],
        [-5, -40],
        [1, -40],
        [1, -35],
        [5, -35],
      ],
      "#b9d8ac",
      1,
    );
    for (let k = 0; k < 3; k++)
      oval(
        g,
        -8 + k * 6,
        -22,
        2,
        2,
        k === 0 ? "#d5b35f" : k === 1 ? "#af7158" : "#7ba79a",
        ink,
        0.7,
      );
    line(
      g,
      [
        [-9, -11],
        [5, -11],
      ],
      "#65887b",
      1,
    );
    line(
      g,
      [
        [-9, -7],
        [5, -7],
      ],
      "#65887b",
      1,
    );
    oval(g, -2, -58, 9, 4, "#916954", ink, 1);
    oval(g, -2, -61, 8, 4, "#c77d60", ink, 1);
    for (const q of [
      [-14, -49],
      [10, -49],
      [-14, -4],
      [10, -4],
    ])
      rivet(g, ...q);
    line(
      g,
      [
        [20, -10],
        [30, -10],
        [34, -1],
        [50, -1],
      ],
      "#496b6b",
      2,
    );
    g.restore();
  }
  function barrel(g, x, y, s = 1) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    rect(
      g,
      -17,
      -44,
      34,
      41,
      grad(g, -17, 0, 17, 0, ["#a36250", "#db9d71", "#98634f"]),
      ink,
      2,
      1.5,
    );
    oval(g, 0, -44, 17, 5, "#b68962", ink, 1.4);
    oval(g, 0, -3, 17, 4, "#9b7256", ink, 1.2);
    for (const yy of [-34, -13]) rect(g, -18, yy, 36, 4, "#9eaa91", ink, 1, 1);
    oval(g, 7, -45, 3, 1.6, "#617e7a", ink, 0.8);
    path(
      g,
      [
        [0, -30],
        ["Q", -10, -20, 0, -17],
        ["Q", 10, -20, 0, -30],
      ],
      "#e8ce8b",
      ink,
      0.9,
    );
    g.restore();
  }
  function rocketDetails(g, levels) {
    g.save();
    line(
      g,
      [
        [-13, -2],
        [13, -2],
      ],
      "#8a9d95",
      0.8,
    );
    for (const x of [-12, 12]) rivet(g, x, 1);
    if ((levels.hull || 0) > 1) {
      for (const x of [-17, 17]) {
        line(
          g,
          [
            [x, -17],
            [x, -8],
          ],
          "#536e75",
          3,
        );
        line(
          g,
          [
            [x - 1, -17],
            [x - 1, -9],
          ],
          "#cedcd0",
          0.8,
        );
      }
    }
    g.beginPath();
    g.moveTo(-11, -40);
    g.quadraticCurveTo(-15, -27, -13, -10);
    g.strokeStyle = "#fff6d7aa";
    g.lineWidth = 1.2;
    g.stroke();
    g.restore();
  }
  function drawObstacle(g, o, t) {
    g.save();
    g.lineJoin = "round";
    g.lineCap = "round";
    const map = { balloon, bird, storm, satellite, deepSatellite, mothership, drone, ufo, asteroid };
    (map[o.type] || asteroid)(g, o, t);
    g.restore();
  }
  root.SeleneArt = {
    drawObstacle,
    balloon,
    bird, feather, deepSatellite, mothership, arcadeRelic,
    storm,
    satellite,
    drone,
    ufo,
    asteroid,
    gate,
    threat,
    cloud,
    moon,
    earth,
    tower,
    building,
    toolbox,
    flask,
    rocketDetails,
    consoleBox,
    barrel,
  };
})(typeof window !== "undefined" ? window : globalThis);
