/* Five authored roadside worlds, moving scenery and shared race features. */
(function (root) {
  "use strict";
  const T = root.THREE,
    P = root.DriftPhysics;
  function material(color, extra = {}) {
    return new T.MeshStandardMaterial({
      color,
      roughness: 0.75,
      metalness: 0.1,
      ...extra,
    });
  }
  function mesh(p, g, m, x = 0, y = 0, z = 0) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    p.add(o);
    return o;
  }
  function box(p, m, w, h, d, x, y, z) {
    return mesh(p, new T.BoxGeometry(w, h, d), m, x, y, z);
  }
  function batch(p, g, m, list) {
    if (!list.length) return;
    const a = new T.InstancedMesh(g, m, list.length),
      o = new T.Object3D();
    list.forEach((q, i) => {
      o.position.set(q.x, q.y, q.z);
      o.rotation.set(q.rx || 0, q.ry || 0, q.rz || 0);
      o.scale.set(q.sx || 1, q.sy || 1, q.sz || 1);
      o.updateMatrix();
      a.setMatrixAt(i, o.matrix);
    });
    p.add(a);
    return a;
  }
  function surface(track, start, end, inner, outer, y, mat, parent) {
    const vertices = [],
      indices = [];
    const steps = Math.max(8, Math.ceil((end - start) / 5));
    for (let i = 0; i <= steps; i++) {
      const f = track.frame(start + ((end - start) * i) / steps);
      for (const off of [inner, outer])
        vertices.push(f.x + f.nx * off, f.y + y, f.z + f.nz * off);
    }
    for (let i = 0; i < steps; i++) {
      let a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return mesh(parent, g, mat);
  }
  function signTexture(text, color) {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 192;
    const g = c.getContext("2d");
    g.fillStyle = "#172c41";
    g.fillRect(0, 0, 768, 192);
    g.strokeStyle = color;
    g.lineWidth = 8;
    g.strokeRect(8, 8, 752, 176);
    g.fillStyle = color;
    g.textAlign = "center";
    g.font = '900 88px "Barlow Condensed",sans-serif';
    g.fillText(text, 384, 119);
    g.font = "15px monospace";
    g.fillText("NEON DRIFT · CIRCUITO 87", 384, 158);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  function build(scene, track) {
    const theme = track.theme || track.id;
    const world = new T.Group();
    scene.add(world);
    const random = P.rng(track.seed + 808),
      moving = [],
      weather = [],
      opaque = material("#315269"),
      light = new T.MeshBasicMaterial({ color: track.accent }),
      ground = -4;
    const clearanceSamples = track.samples.filter((_, i) => i % 6 === 0);
    const anchor = (s, off = 0) => {
      const f = track.frame(s);
      if (Math.abs(off) > track.width + 5) {
        for (let attempt = 0; attempt < 6; attempt++) {
          const x = f.x + f.nx * off,
            z = f.z + f.nz * off;
          if (
            clearanceSamples.every(
              (p) => Math.hypot(p[0] - x, p[2] - z) > track.width + 7,
            )
          )
            break;
          off *= 1.2;
        }
      }
      const d = Math.abs(off),
        base =
          theme === "city"
            ? f.y - 0.25
            : Math.max(
                ground,
                f.y -
                  (f.y - ground) * P.clamp((d - track.width - 2) / 14, 0, 1),
              );
      return { ...f, x: f.x + f.nx * off, z: f.z + f.nz * off, y: base };
    };
    const put = (s, off, group, height = 0) => {
      const f = anchor(s, off);
      group.position.set(f.x, f.y + height, f.z);
      group.rotation.y = f.yaw;
      world.add(group);
      return group;
    };
    // A visible start/finish complex, raised roadside shoulders and directional chevrons.
    const arch = new T.Group(),
      steel = material("#344e65");
    for (const side of [-1, 1]) {
      box(arch, steel, 0.65, 7, 0.8, side * (track.width + 1), 3.5, 0);
      box(arch, light, 0.12, 6.2, 0.12, side * (track.width + 0.58), 3.5, 0.48);
    }
    box(arch, steel, track.width * 2 + 3, 1, 0.9, 0, 7, 0);
    mesh(
      arch,
      new T.PlaneGeometry(12, 2.3),
      new T.MeshBasicMaterial({
        map: signTexture(track.name, track.accent),
        side: T.DoubleSide,
      }),
      0,
      7.2,
      0.5,
    );
    put(0, 0, arch);
    arch.position.y = track.at(0).y;
    const checker = [[], []];
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 24; col++) {
        const f = track.frame(row - 0.5),
          off = ((col - 11.5) * track.width) / 12;
        checker[(row + col) % 2].push({
          x: f.x + f.nx * off,
          y: f.y + 0.055,
          z: f.z + f.nz * off,
          sx: track.width / 12,
          sy: 0.025,
          sz: 1,
          ry: f.yaw,
        });
      }
    checker.forEach((list, i) =>
      batch(
        world,
        new T.BoxGeometry(1, 1, 1),
        material(i ? "#e5ede5" : "#223349"),
        list,
      ),
    );
    const posts = [],
      rails = [],
      chevrons = [];
    for (let s = 20; s < track.length; s += 18) {
      const f = track.frame(s);
      for (const side of [-1, 1]) {
        const off = side * (track.width + 2.2);
        posts.push({
          x: f.x + f.nx * off,
          y: f.y + 0.8,
          z: f.z + f.nz * off,
          sx: 0.13,
          sy: 1.6,
          sz: 0.13,
        });
        if (
          track.barriers ||
          theme === "orbit" ||
          (theme === "coast" && f.y > 5)
        )
          rails.push({
            x: f.x + f.nx * off,
            y: f.y + 1.2,
            z: f.z + f.nz * off,
            sx: 0.13,
            sy: 0.16,
            sz: 17,
            ry: f.yaw,
          });
      }
    }
    batch(world, new T.BoxGeometry(1, 1, 1), steel, posts);
    batch(world, new T.BoxGeometry(1, 1, 1), material(track.edge), rails);
    const panelMat = new T.MeshBasicMaterial({
      map: signTexture("› › ›", track.accent),
      side: T.DoubleSide,
    });
    const leftPanel = new T.MeshBasicMaterial({
      map: signTexture("‹ ‹ ‹", track.accent),
      side: T.DoubleSide,
    });
    for (const turn of track.turns || []) {
      const g = new T.Group();
      box(g, steel, 0.12, 2.8, 0.12, 0, 1.4, 0);
      mesh(
        g,
        new T.PlaneGeometry(3.5, 1.5),
        new T.MeshBasicMaterial({
          map: signTexture("FREIE", "#f0cd9a"),
          side: T.DoubleSide,
        }),
        0,
        2.8,
        0,
      );
      put(turn.s - 38, Math.sign(turn.curve) * (track.width + 3), g);
    }
    for (let i = 1; i < 16; i++) {
      const f = track.frame((i / 16) * track.length),
        side = track.curvature((i / 16) * track.length) > 0 ? 1 : -1,
        off = side * (track.width + 3),
        g = new T.Group();
      box(g, steel, 0.1, 2, 0.1, 0, 1, 0);
      mesh(
        g,
        new T.PlaneGeometry(2.7, 1.1),
        side > 0 ? leftPanel : panelMat,
        0,
        2.2,
        0,
      );
      put((i / 16) * track.length, off, g);
    }
    if (theme !== "orbit") {
      const base = mesh(
        world,
        new T.PlaneGeometry(5000, 5000),
        material(theme === "coast" ? "#438d9d" : track.ground),
        0,
        theme === "coast" ? -5 : ground,
        0,
      );
      base.rotation.x = -Math.PI / 2;
    }
    if (theme === "coast") {
      const trunks = [],
        leaves = [],
        houses = [],
        roofs = [];
      const leafGeo = new T.BufferGeometry();
      leafGeo.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [0, 0, 0, -0.58, 0.35, 1.7, 0, -0.9, 4.4, 0.58, 0.35, 1.7],
          3,
        ),
      );
      leafGeo.setIndex([0, 1, 2, 0, 2, 3]);
      leafGeo.computeVertexNormals();
      for (let i = 0; i < 84; i++) {
        const s = ((i + 0.25) / 84) * track.length,
          f = anchor(s, (i % 2 ? 1 : -1) * (track.width + 6 + random() * 13)),
          h = 6 + random() * 3;
        trunks.push({
          x: f.x,
          y: f.y + h * 0.5,
          z: f.z,
          sx: 0.32,
          sy: h,
          sz: 0.32,
          rz: (random() - 0.5) * 0.1,
        });
        for (let j = 0; j < 7; j++)
          leaves.push({
            x: f.x,
            y: f.y + h,
            z: f.z,
            ry: (j / 7) * Math.PI * 2 + random() * 0.2,
            sx: 1,
            sy: 1,
            sz: 0.9 + random() * 0.3,
          });
        if (i % 4 === 0) {
          const f = anchor(s, (i % 2 ? 1 : -1) * (track.width + 24));
          houses.push({
            x: f.x,
            y: f.y + 1.8,
            z: f.z,
            sx: 7,
            sy: 3.6,
            sz: 5,
            ry: f.yaw,
          });
          roofs.push({
            x: f.x,
            y: f.y + 4,
            z: f.z,
            sx: 5,
            sy: 1.8,
            sz: 4,
            ry: f.yaw,
          });
        }
      }
      batch(
        world,
        new T.CylinderGeometry(1, 1.15, 1, 10),
        material("#a38968"),
        trunks,
      );
      batch(
        world,
        leafGeo,
        material("#4c8a77", { side: T.DoubleSide }),
        leaves,
      );
      batch(world, new T.BoxGeometry(1, 1, 1), material("#ede0c0"), houses);
      batch(world, new T.ConeGeometry(1, 1, 4), material("#cc8c76"), roofs);
      // Animated sailboats and a broad striped lighthouse make the bay recognizable.
      for (const fraction of [0.14, 0.46, 0.77]) {
        const boat = new T.Group();
        root.DriftModels.loft(
          boat,
          [
            [-3, 0.6, 0.1, 0.6],
            [-1, 1, 0.05, 0.65],
            [1, 1, 0.05, 0.65],
            [3, 0.1, 0.15, 0.75],
          ],
          material("#eee3cf"),
        );
        box(boat, steel, 0.08, 7, 0.08, 0, 3.8, 0);
        const sailGeo = new T.BufferGeometry();
        sailGeo.setAttribute(
          "position",
          new T.Float32BufferAttribute(
            [0.1, 1.1, 0, 0.1, 7, 0, 3.2, 1.1, 0],
            3,
          ),
        );
        sailGeo.setIndex([0, 1, 2]);
        sailGeo.computeVertexNormals();
        mesh(boat, sailGeo, material("#f1d8be", { side: T.DoubleSide }));
        const f = track.frame(track.length * fraction);
        boat.position.set(f.x + f.nx * 65, -4.6, f.z + f.nz * 65);
        boat.rotation.y = f.yaw;
        world.add(boat);
        moving.push({
          type: "boat",
          object: boat,
          base: boat.position.clone(),
          phase: fraction * 9,
        });
      }
      const tower = new T.Group();
      for (let i = 0; i < 4; i++)
        mesh(
          tower,
          new T.CylinderGeometry(2.2 - i * 0.15, 2.4 - i * 0.15, 4, 20),
          material(i % 2 ? "#d77c78" : "#f0e5cf"),
          0,
          2 + i * 4,
          0,
        );
      mesh(tower, new T.CylinderGeometry(2.3, 2.3, 2, 16), light, 0, 17, 0);
      mesh(
        tower,
        new T.ConeGeometry(2.8, 2.4, 20),
        material("#657c87"),
        0,
        19,
        0,
      );
      put(track.length * 0.07, 35, tower);
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      g.fillStyle = "#438d9d";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "#92d9d533";
      g.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const x = random() * 128,
          y = random() * 128;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + 9, y + 2, x + 20, y);
        g.stroke();
      }
      const tex = new T.CanvasTexture(c);
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      tex.repeat.set(100, 100);
      const water = mesh(
        world,
        new T.PlaneGeometry(3000, 3000),
        material("#76b9bd", { map: tex, roughness: 0.26 }),
        0,
        -4.9,
        0,
      );
      water.rotation.x = -Math.PI / 2;
      moving.push({ type: "water", texture: tex });
    } else if (theme === "city") {
      const buildings = [],
        bands = [],
        windows = [],
        sidewalk = material("#3b4a5a", { side: T.DoubleSide });
      for (const side of [-1, 1])
        surface(
          track,
          0,
          track.length,
          side * (track.width + 2),
          side * (track.width + 55),
          -0.3,
          sidewalk,
          world,
        );
      for (let i = 0; i < 130; i++) {
        const s = (i / 130) * track.length,
          side = i % 2 ? 1 : -1,
          f = anchor(s, side * (track.width + 11 + random() * 25)),
          h = 12 + random() * 50,
          w = 6 + random() * 7;
        buildings.push({
          x: f.x,
          y: f.y + h / 2,
          z: f.z,
          sx: w,
          sy: h,
          sz: w * 0.8,
          ry: f.yaw,
        });
        bands.push({
          x: f.x,
          y: f.y + h * 0.8,
          z: f.z,
          sx: w + 0.15,
          sy: 0.3,
          sz: w * 0.8 + 0.15,
          ry: f.yaw,
        });
        for (let row = 0; row < 5; row++) {
          windows.push({
            x: f.x - f.nx * w * 0.51,
            y: f.y + 3 + (row * h) / 6,
            z: f.z - f.nz * w * 0.51,
            sx: 0.12,
            sy: 0.45,
            sz: w * 0.6,
            ry: f.yaw,
          });
        }
      }
      batch(world, new T.BoxGeometry(1, 1, 1), material("#263b52"), buildings);
      batch(
        world,
        new T.BoxGeometry(1, 1, 1),
        new T.MeshBasicMaterial({ color: "#ae99e0" }),
        bands,
      );
      batch(
        world,
        new T.BoxGeometry(1, 1, 1),
        new T.MeshBasicMaterial({ color: "#e2c5aa" }),
        windows,
      );
      const lamps = [],
        lampHeads = [];
      for (let s = 10; s < track.length; s += 25) {
        const f = track.frame(s);
        for (const side of [-1, 1]) {
          const off = side * (track.width + 4);
          lamps.push({
            x: f.x + f.nx * off,
            y: f.y + 3.5,
            z: f.z + f.nz * off,
            sx: 0.13,
            sy: 7,
            sz: 0.13,
          });
          lampHeads.push({
            x: f.x + f.nx * (off - side * 1.2),
            y: f.y + 7,
            z: f.z + f.nz * (off - side * 1.2),
            sx: 2.8,
            sy: 0.12,
            sz: 0.6,
            ry: f.yaw,
          });
        }
      }
      batch(world, new T.BoxGeometry(1, 1, 1), steel, lamps);
      batch(
        world,
        new T.BoxGeometry(1, 1, 1),
        new T.MeshBasicMaterial({ color: "#d3eff1" }),
        lampHeads,
      );
      for (const [i, text] of [
        "NEON 87",
        "MIDNIGHT",
        "ARCADE",
        "PULSE",
        "AURORA",
        "CIRCUIT",
      ].entries()) {
        const board = new T.Group();
        mesh(
          board,
          new T.PlaneGeometry(9, 4),
          new T.MeshBasicMaterial({
            map: signTexture(text, i % 2 ? "#f0a0c1" : "#8eeddc"),
            side: T.DoubleSide,
          }),
          0,
          5,
          0,
        );
        put(
          (track.length * (i + 0.4)) / 6,
          (i % 2 ? 1 : -1) * (track.width + 7),
          board,
        );
      }
      const tunnel = track.features.find((f) => f.type === "tunnel"),
        arches = [],
        strips = [];
      for (
        let s = tunnel.fraction * track.length;
        s < tunnel.end * track.length;
        s += 8
      ) {
        const f = track.frame(s);
        arches.push({
          x: f.x,
          y: f.y,
          z: f.z,
          ry: f.yaw,
          sx: 1,
          sy: 0.7,
          sz: 1,
        });
        for (const side of [-1, 1])
          strips.push({
            x: f.x + f.nx * side * (track.width + 0.2),
            y: f.y + 2,
            z: f.z + f.nz * side * (track.width + 0.2),
            sx: 0.08,
            sy: 0.12,
            sz: 5.5,
            ry: f.yaw,
          });
      }
      batch(
        world,
        new T.TorusGeometry(track.width + 1, 0.5, 8, 24, Math.PI),
        material("#3e526a"),
        arches,
      );
      batch(world, new T.BoxGeometry(1, 1, 1), light, strips);
      surface(
        track,
        tunnel.fraction * track.length,
        tunnel.end * track.length,
        -track.width - 1,
        track.width + 1,
        8,
        material("#2b4055", { side: T.DoubleSide }),
        world,
      );
    } else if (theme === "canyon") {
      const rocks = [],
        tops = [],
        cacti = [];
      for (let i = 0; i < 110; i++) {
        const f = anchor(
            (i / 110) * track.length,
            (i % 2 ? 1 : -1) * (track.width + 16 + random() * 35),
          ),
          h = 10 + random() * 36,
          w = 5 + random() * 11;
        rocks.push({
          x: f.x,
          y: f.y + h * 0.45,
          z: f.z,
          sx: w,
          sy: h,
          sz: w * 0.7,
          ry: random() * 6,
        });
        tops.push({
          x: f.x,
          y: f.y + h * 0.81,
          z: f.z,
          sx: w * 0.95,
          sy: h * 0.24,
          sz: w * 0.7,
          ry: random() * 6,
        });
        if (i % 3 === 0) {
          const f = anchor(
            (i / 110) * track.length,
            (i % 2 ? 1 : -1) * (track.width + 7),
          );
          cacti.push({ x: f.x, y: f.y + 2, z: f.z, sx: 0.4, sy: 4, sz: 0.4 });
        }
      }
      batch(
        world,
        new T.CylinderGeometry(0.85, 1.12, 1, 7),
        material("#b98c69"),
        rocks,
      );
      batch(
        world,
        new T.CylinderGeometry(1, 1.05, 1, 7),
        material("#dfb68c"),
        tops,
      );
      batch(
        world,
        new T.CylinderGeometry(0.8, 1, 1, 8),
        material("#698c77"),
        cacti,
      );
      for (const q of [0.19, 0.61, 0.9]) {
        const g = new T.Group(),
          rock = material("#c49a77");
        for (const side of [-1, 1]) {
          const p = mesh(
            g,
            new T.DodecahedronGeometry(1, 1),
            rock,
            side * (track.width + 5),
            5,
            0,
          );
          p.scale.set(5, 8, 5);
        }
        const top = mesh(g, new T.DodecahedronGeometry(1, 1), rock, 0, 12, 0);
        top.scale.set(track.width + 7, 3.5, 4.5);
        put(q * track.length, 0, g);
      }
    } else if (theme === "glacier") {
      const mountains = [],
        caps = [],
        crystals = [];
      for (let i = 0; i < 94; i++) {
        const f = anchor(
            (i / 94) * track.length,
            (i % 2 ? 1 : -1) * (track.width + 25 + random() * 30),
          ),
          h = 14 + random() * 44,
          w = 9 + random() * 15;
        mountains.push({
          x: f.x,
          y: f.y + h / 2,
          z: f.z,
          sx: w,
          sy: h,
          sz: w,
          ry: random() * 6,
        });
        caps.push({
          x: f.x,
          y: f.y + h * 0.79,
          z: f.z,
          sx: w * 0.44,
          sy: h * 0.43,
          sz: w * 0.44,
          ry: random() * 6,
        });
        const c = anchor(
          (i / 94) * track.length,
          (i % 2 ? 1 : -1) * (track.width + 7 + random() * 7),
        );
        crystals.push({
          x: c.x,
          y: c.y + 3,
          z: c.z,
          sx: 1.3,
          sy: 6,
          sz: 1.3,
          ry: random() * 6,
        });
      }
      batch(world, new T.ConeGeometry(1, 1, 7), material("#a2c5d7"), mountains);
      batch(world, new T.ConeGeometry(1, 1, 7), material("#f1f5eb"), caps);
      batch(
        world,
        new T.ConeGeometry(1, 1, 5),
        material("#79c6d8", { metalness: 0.3, roughness: 0.25 }),
        crystals,
      );
      for (let k = 0; k < 3; k++) {
        const g = new T.PlaneGeometry(800, 16, 48, 1),
          m = new T.MeshBasicMaterial({
            color: k % 2 ? "#b9a1ed" : "#87e4c4",
            transparent: true,
            opacity: 0.2,
            side: T.DoubleSide,
            depthWrite: false,
          });
        const o = mesh(world, g, m, 120, 110 + k * 18, 200);
        o.rotation.y = 0.3;
        moving.push({ type: "aurora", object: o, phase: k });
      }
    } else {
      const pillars = [],
        pods = [],
        pads = [];
      for (let i = 0; i < 70; i++) {
        const s = (i / 70) * track.length,
          f = track.frame(s),
          side = i % 2 ? 1 : -1,
          off = side * (track.width + 13);
        pillars.push({
          x: f.x + f.nx * off,
          y: f.y + 5,
          z: f.z + f.nz * off,
          sx: 1.2,
          sy: 10,
          sz: 1.2,
        });
        pods.push({
          x: f.x + f.nx * (off + side * 4),
          y: f.y + 8,
          z: f.z + f.nz * (off + side * 4),
          sx: 8,
          sy: 4,
          sz: 6,
          ry: f.yaw,
        });
        pads.push({
          x: f.x + f.nx * off,
          y: f.y + 0.1,
          z: f.z + f.nz * off,
          sx: 9,
          sy: 0.3,
          sz: 12,
          ry: f.yaw,
        });
      }
      batch(world, new T.BoxGeometry(1, 1, 1), material("#6a7e9d"), pillars);
      batch(
        world,
        new T.CylinderGeometry(1, 1, 1, 10),
        material("#94a2bd"),
        pods,
      );
      batch(world, new T.BoxGeometry(1, 1, 1), material("#516884"), pads);
      for (let i = 0; i < 4; i++) {
        const ship = new T.Group();
        const hull = mesh(
          ship,
          new T.SphereGeometry(1, 20, 12),
          material(i % 2 ? "#c6a7ce" : "#9abfc9"),
        );
        hull.scale.set(1.5, 0.7, 4);
        for (const side of [-1, 1]) {
          const wing = mesh(
            ship,
            new T.ConeGeometry(1, 4, 3),
            material("#698aa8"),
            side * 2,
            0,
            -1,
          );
          wing.rotation.z = (side * Math.PI) / 2;
          mesh(
            ship,
            new T.SphereGeometry(0.4, 12, 8),
            light,
            side * 0.7,
            0,
            -3,
          );
        }
        world.add(ship);
        moving.push({
          type: "ship",
          object: ship,
          phase: (i / 4) * track.length,
        });
      }
    }
    // Interactive features are the same objects used in the race simulation.
    const rockFeatures = [];
    for (const feature of track.features) {
      const s = feature.fraction * track.length,
        f = track.frame(s);
      if (feature.type === "ramp") {
        const g = new T.BufferGeometry(),
          w = 3.5;
        g.setAttribute(
          "position",
          new T.Float32BufferAttribute(
            [-w, 0, -6, w, 0, -6, -w, 0.8, 0, w, 0.8, 0, -w, 0, 1, w, 0, 1],
            3,
          ),
        );
        g.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5]);
        g.computeVertexNormals();
        const ramp = mesh(
          world,
          g,
          material("#d8b886", { side: T.DoubleSide }),
          f.x + f.nx * feature.lane * track.width,
          f.y + 0.04,
          f.z + f.nz * feature.lane * track.width,
        );
        ramp.rotation.y = f.yaw;
        const hoop = mesh(
          world,
          new T.TorusGeometry(3.4, 0.1, 8, 32),
          new T.MeshBasicMaterial({
            color: track.accent,
            transparent: true,
            opacity: 0.8,
          }),
          f.x + f.nx * feature.lane * track.width,
          f.y + 3.3,
          f.z + f.nz * feature.lane * track.width,
        );
        hoop.rotation.y = f.yaw;
        moving.push({ type: "hoop", object: hoop, phase: s });
      } else if (feature.type === "ice") {
        surface(
          track,
          s,
          feature.end * track.length,
          -track.width * 0.94,
          track.width * 0.94,
          0.045,
          material("#a9dcde", {
            roughness: 0.15,
            metalness: 0.25,
            transparent: true,
            opacity: 0.65,
            side: T.DoubleSide,
          }),
          world,
        );
      } else if (feature.type === "boulder") {
        const b = mesh(
          world,
          new T.DodecahedronGeometry(1.5, 1),
          material("#9d7862"),
        );
        rockFeatures.push({ object: b, feature, f });
      }
      if (feature.type !== "tunnel") {
        const sign = new T.Group();
        box(sign, steel, 0.12, 3, 0.12, 0, 1.5, 0);
        mesh(
          sign,
          new T.PlaneGeometry(3.8, 1.6),
          new T.MeshBasicMaterial({
            map: signTexture(
              { ramp: "SALTO", ice: "GELO", boulder: "ROCHAS" }[feature.type],
              track.accent,
            ),
            side: T.DoubleSide,
          }),
          0,
          3.2,
          0,
        );
        put(s - 40, track.width + 3, sign);
      }
    }
    // A sky dome, distant landmarks and local weather fill the view beyond the road.
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 8;
    skyCanvas.height = 256;
    const g = skyCanvas.getContext("2d"),
      gradient = g.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, track.sky);
    gradient.addColorStop(0.64, track.fog);
    gradient.addColorStop(1, track.fog);
    g.fillStyle = gradient;
    g.fillRect(0, 0, 8, 256);
    const skyMap = new T.CanvasTexture(skyCanvas);
    skyMap.colorSpace = T.SRGBColorSpace;
    mesh(
      world,
      new T.SphereGeometry(1800, 32, 16),
      new T.MeshBasicMaterial({ map: skyMap, side: T.BackSide, fog: false }),
    );
    const sun = mesh(
      world,
      new T.SphereGeometry(theme === "orbit" ? 90 : 45, 32, 20),
      new T.MeshBasicMaterial({ color: track.sun, fog: false }),
      -430,
      theme === "orbit" ? 230 : 150,
      700,
    );
    if (theme === "orbit") {
      const ring = mesh(
        world,
        new T.TorusGeometry(135, 3, 8, 80),
        new T.MeshBasicMaterial({ color: "#a596d0", fog: false }),
        -430,
        230,
        700,
      );
      ring.rotation.x = 1.12;
      ring.rotation.z = 0.3;
    }
    if (theme === "city" || theme === "orbit") {
      const a = [];
      for (let i = 0; i < 650; i++)
        a.push(
          (random() - 0.5) * 2400,
          200 + random() * 1200,
          (random() - 0.5) * 2400,
        );
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(a, 3));
      world.add(
        new T.Points(
          geo,
          new T.PointsMaterial({
            color: "#cde6ff",
            size: 1,
            fog: false,
            sizeAttenuation: true,
          }),
        ),
      );
    }
    if (theme === "city" || theme === "glacier") {
      const count = theme === "city" ? 330 : 180,
        a = new Float32Array(count * 3),
        geo = new T.BufferGeometry();
      for (let i = 0; i < count; i++) {
        a[i * 3] = (random() - 0.5) * 100;
        a[i * 3 + 1] = random() * 45;
        a[i * 3 + 2] = (random() - 0.5) * 120;
      }
      geo.setAttribute("position", new T.BufferAttribute(a, 3));
      const particles = new T.Points(
        geo,
        new T.PointsMaterial({
          color: theme === "city" ? "#a9c9de" : "#f0ffff",
          size: theme === "city" ? 0.1 : 0.2,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      );
      world.add(particles);
      weather.push({ particles, count, speed: theme === "city" ? 27 : 4 });
    }
    return {
      group: world,
      landmarks: world.children.length,
      update(time, dt, race) {
        for (const m of moving) {
          if (m.type === "boat") {
            m.object.position.y =
              m.base.y + Math.sin(time * 0.9 + m.phase) * 0.15;
            m.object.rotation.z = Math.sin(time * 0.7 + m.phase) * 0.025;
          } else if (m.type === "water") {
            m.texture.offset.x = time * 0.003;
            m.texture.offset.y = time * 0.001;
          } else if (m.type === "ship") {
            const f = track.frame(m.phase + time * 28);
            m.object.position.set(
              f.x + f.nx * 45,
              f.y + 13 + Math.sin(time + m.phase) * 2,
              f.z + f.nz * 45,
            );
            m.object.rotation.y = f.yaw;
          } else if (m.type === "aurora") {
            const a = m.object.geometry.attributes.position;
            for (let i = 0; i < a.count; i++)
              a.setZ(
                i,
                Math.sin(a.getX(i) * 0.008 + time * 0.3 + m.phase) * 17,
              );
            a.needsUpdate = true;
          } else if (m.type === "hoop") {
            m.object.material.opacity =
              0.65 + Math.sin(time * 2 + m.phase) * 0.2;
          }
        }
        for (const b of rockFeatures) {
          const lane = Math.sin((race.time + b.feature.phase) * 0.63) * 1.08;
          b.object.position.set(
            b.f.x + b.f.nx * lane * track.width,
            b.f.y + 1.45,
            b.f.z + b.f.nz * lane * track.width,
          );
          b.object.rotation.z = time * 1.3;
        }
        for (const w of weather) {
          const f = track.frame(race.player.s),
            a = w.particles.geometry.attributes.position;
          w.particles.position.set(f.x, f.y, f.z);
          for (let i = 0; i < w.count; i++) {
            let y = a.getY(i) - dt * w.speed;
            if (y < 0) y += 45;
            a.setY(i, y);
          }
          a.needsUpdate = true;
        }
      },
    };
  }
  function paint2D(g, track, player, project, w, h, time, race) {
    const theme = track.theme || track.id;
    g.save();
    const night = theme === "city" || theme === "orbit";
    if (theme === "canyon" || theme === "glacier") {
      g.fillStyle = theme === "canyon" ? "#b38e72" : "#a6c9d9";
      for (let i = 0; i < 12; i++) {
        const x = ((i - 1) * w) / 10,
          y = h * 0.4,
          ht = h * (0.12 + ((i * 7) % 5) * 0.025);
        g.beginPath();
        g.moveTo(x - w * 0.09, y);
        g.lineTo(x, y - ht);
        g.lineTo(x + w * 0.13, y);
        g.fill();
        if (theme === "glacier") {
          g.fillStyle = "#e9f1e8";
          g.beginPath();
          g.moveTo(x - w * 0.035, y - ht * 0.6);
          g.lineTo(x, y - ht);
          g.lineTo(x + w * 0.05, y - ht * 0.6);
          g.fill();
          g.fillStyle = "#a6c9d9";
        }
      }
    }
    if (night) {
      g.fillStyle = "#cde9fa";
      for (let i = 0; i < 65; i++)
        g.fillRect((i * 137) % w, 10 + ((i * 47) % (h * 0.32)), 1, 1);
    }
    for (let i = 32; i >= 1; i--) {
      const spacing = 9,
        s = Math.floor(player.s / spacing) * spacing + i * spacing,
        side = i % 2 ? 1 : -1,
        p = project(s);
      if (p.ahead < 8 || p.ahead > 290 || p.y < h * 0.25 || p.y > h) continue;
      const x = p.x + side * p.width * (1.65 + (i % 3) * 0.22),
        scale = p.scale;
      if (theme === "coast") {
        const ht = scale * 7;
        g.strokeStyle = "#977f63";
        g.lineWidth = Math.max(1, scale * 0.27);
        g.beginPath();
        g.moveTo(x, p.y);
        g.quadraticCurveTo(x + side * ht * 0.08, p.y - ht * 0.5, x, p.y - ht);
        g.stroke();
        g.strokeStyle = "#43846f";
        g.lineWidth = Math.max(1, scale * 0.36);
        for (let a = 0; a < 5; a++) {
          g.beginPath();
          g.moveTo(x, p.y - ht);
          g.quadraticCurveTo(
            x + (a - 2) * scale,
            p.y - ht - scale,
            x + (a - 2) * scale * 1.6,
            p.y - ht + scale * 1.2,
          );
          g.stroke();
        }
      } else if (theme === "city") {
        const ht = (14 + (i % 6) * 4) * scale,
          ww = scale * (5 + (i % 3));
        g.fillStyle = i % 2 ? "#24364c" : "#30475e";
        g.fillRect(x - ww / 2, p.y - ht, ww, ht);
        g.fillStyle = i % 3 ? "#e7c49c" : "#b5a1e7";
        for (let row = 0; row < 5; row++)
          for (let col = 0; col < 3; col++)
            g.fillRect(
              x - ww * 0.35 + col * ww * 0.3,
              p.y - ht + ht * 0.13 + row * ht * 0.15,
              Math.max(1, ww * 0.09),
              Math.max(1, scale * 0.3),
            );
        g.fillStyle = "#8bdbd6";
        g.fillRect(
          x - ww * 0.52,
          p.y - ht * 0.9,
          ww * 1.04,
          Math.max(1, scale * 0.1),
        );
      } else if (theme === "canyon" || theme === "glacier") {
        const ht = scale * (10 + (i % 5) * 4),
          ww = scale * (6 + (i % 4) * 2);
        g.fillStyle = theme === "canyon" ? "#c29b78" : "#b2d5df";
        g.beginPath();
        g.moveTo(x - ww, p.y);
        g.lineTo(x - ww * 0.7, p.y - ht * 0.8);
        g.lineTo(x, p.y - ht);
        g.lineTo(x + ww * 0.6, p.y - ht * 0.78);
        g.lineTo(x + ww, p.y);
        g.fill();
        if (theme === "canyon") {
          g.strokeStyle = "#a27d6477";
          g.lineWidth = Math.max(1, scale * 0.5);
          g.beginPath();
          g.moveTo(x - ww * 0.7, p.y - ht * 0.5);
          g.lineTo(x + ww * 0.8, p.y - ht * 0.45);
          g.stroke();
        }
      } else {
        g.strokeStyle = "#8ca7c9";
        g.lineWidth = Math.max(1, scale * 0.5);
        g.beginPath();
        g.moveTo(x, p.y);
        g.lineTo(x, p.y - scale * 12);
        g.stroke();
        g.fillStyle = "#617d9f";
        g.fillRect(x - scale * 3, p.y - scale * 13, scale * 6, scale * 3);
        g.fillStyle = "#94e8e6";
        g.fillRect(
          x - scale * 2.5,
          p.y - scale * 12.7,
          scale * 5,
          Math.max(1, scale * 0.2),
        );
      }
    }
    for (const f of race?.features || []) {
      const ds = P.mod(f.s - player.s, track.length);
      if (ds < 8 || ds > 180) continue;
      const p = project(player.s + ds);
      if (f.type === "boulder") {
        const lane = Math.sin((race.time + f.phase) * 0.63) * 1.08;
        g.fillStyle = "#96745b";
        g.beginPath();
        g.arc(
          p.x + lane * p.width,
          p.y - p.scale,
          p.scale * 1.5,
          0,
          Math.PI * 2,
        );
        g.fill();
      } else if (f.type === "ramp") {
        g.fillStyle = "#dec18a";
        g.beginPath();
        const x = p.x + f.lane * p.width;
        g.moveTo(x - p.scale * 3, p.y);
        g.lineTo(x + p.scale * 3, p.y);
        g.lineTo(x + p.scale * 2.8, p.y - p.scale * 0.9);
        g.lineTo(x - p.scale * 2.8, p.y - p.scale * 0.9);
        g.fill();
      }
    }
    if (theme === "glacier") {
      g.fillStyle = "#f4ffffaa";
      for (let i = 0; i < 35; i++)
        g.fillRect(
          (i * 157 + Math.sin(time + i) * 15) % w,
          (i * 67 + time * 24) % h,
          2,
          2,
        );
    } else if (theme === "city") {
      g.strokeStyle = "#bfdce644";
      g.lineWidth = 1;
      for (let i = 0; i < 38; i++) {
        const x = (i * 173) % w,
          y = (i * 67 + time * 360) % h;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x - 2, y + 8);
        g.stroke();
      }
    }
    g.restore();
  }
  root.DriftWorld = { build, paint2D };
})(window);
