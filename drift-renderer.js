/* Low-poly vehicles, track meshes and themed scenery, built locally with Three.js. */
(function (root) {
  "use strict";
  const D = root.DriftData,
    P = root.DriftPhysics,
    T = root.THREE;
  const lerp = (a, b, t) => a + (b - a) * t;
 function car2D(g,x,y,scale,color,angle=0,shape='gt'){window.SpaceArt.racer(g,x,y,scale,color,shape,angle,performance.now()/1000);}
  function preview(g,w,h,t){window.ArcadeUniverse.paint(g,w,h,t,'race');g.save();const horizon=h*.42;for(let i=0;i<35;i++){const z=i/35,q=(i+1)/35,y=horizon+z*z*h*.58,y2=horizon+q*q*h*.58,half=8+z*z*w*.48,half2=8+q*q*w*.48,c=w*.5+Math.sin(t*.2+z)*w*.12,c2=w*.5+Math.sin(t*.2+q)*w*.12;g.fillStyle=i%2?'#2c1b44':'#211533';g.beginPath();g.moveTo(c-half,y);g.lineTo(c+half,y);g.lineTo(c2+half2,y2);g.lineTo(c2-half2,y2);g.fill();g.strokeStyle='#bd92f7';g.lineWidth=1;g.beginPath();g.moveTo(c-half,y);g.lineTo(c2-half2,y2);g.moveTo(c+half,y);g.lineTo(c2+half2,y2);g.stroke();}car2D(g,w*.47,h*.8,h/170,'#bba5ff',-.1,'prototype');car2D(g,w*.67,h*.6,h/260,'#96e8dc',.1,'sport');g.restore();}
  function material(color, extra = {}) {
    return new T.MeshStandardMaterial({
      color,
      roughness: 0.48,
      metalness: 0.25,
      ...extra,
    });
  }
  function mesh(parent, geo, mat, x = 0, y = 0, z = 0) {
    const o = new T.Mesh(geo, mat);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  }
  function box(parent, mat, w, h, d, x, y, z) {
    return mesh(parent, new T.BoxGeometry(w, h, d), mat, x, y, z);
  }
  function planBody(points, thickness, top, mat, parent) {
    const shape = new T.Shape();
    points.forEach((p, i) => (i ? shape.lineTo(...p) : shape.moveTo(...p)));
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.07,
      bevelThickness: 0.06,
    });
    geo.rotateX(Math.PI / 2);
    return mesh(parent, geo, mat, 0, top, 0);
  }
  function createCar(config, color) {
    return root.DriftModels.create(config, color);
  }
  function stripGeometry(track, width, height = 0, offset = 0) {
    const positions = [],
      uv = [],
      indices = [],
      count = 720;
    for (let i = 0; i <= count; i++) {
      const f = track.frame((i / count) * track.length);
      for (const side of [-1, 1]) {
        const lane = offset + side * width;
        positions.push(f.x + f.nx * lane, f.y + height, f.z + f.nz * lane);
        uv.push(side === -1 ? 0 : 1, ((i / count) * track.length) / 8);
      }
    }
    for (let i = 0; i < count; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
  function addStrip(parent, track, width, height, offset, mat) {
    return mesh(parent, stripGeometry(track, width, height, offset), mat);
  }
  function roadMesh(track) {
    const group = new T.Group(),
      asphalt = material(track.road, {
        roughness: (track.theme || track.id) === "city" ? 0.32 : 0.9,
        side: T.DoubleSide,
      }),
      edge = new T.MeshBasicMaterial({
        color: track.accent,
        side: T.DoubleSide,
      });
    addStrip(
      group,
      track,
      track.width + 2.2,
      -0.13,
      0,
      material(track.ground, { side: T.DoubleSide }),
    );
    addStrip(group, track, track.width, 0, 0, asphalt);
    for (const s of [-1, 1]) {
      addStrip(
        group,
        track,
        0.85,
        0.012,
        s * (track.width - 0.3),
        material(track.edge, { side: T.DoubleSide }),
      );
      addStrip(group, track, 0.095, 0.035, s * (track.width + 0.08), edge);
    }
    // Solid road edges and terrain banks make hills and bridges read as physical places.
    const skirtPositions = [],
      skirtIndices = [];
    for (const side of [-1, 1])
      for (let i = 0; i < 720; i++) {
        const a = track.frame((i / 720) * track.length),
          b = track.frame(((i + 1) / 720) * track.length),
          bridge =
            (track.theme || track.id) === "space" ||
            ((track.theme || track.id) === "coast" && Math.max(a.y, b.y) > 5);
        const near = track.width + 2.2,
          far = bridge ? near : near + 14,
          k = skirtPositions.length / 3;
        skirtPositions.push(
          a.x + a.nx * near * side,
          a.y - 0.12,
          a.z + a.nz * near * side,
          b.x + b.nx * near * side,
          b.y - 0.12,
          b.z + b.nz * near * side,
          a.x + a.nx * far * side,
          bridge ? a.y - 1.2 : -4,
          a.z + a.nz * far * side,
          b.x + b.nx * far * side,
          bridge ? b.y - 1.2 : -4,
          b.z + b.nz * far * side,
        );
        skirtIndices.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
      }
    const skirt = new T.BufferGeometry();
    skirt.setAttribute(
      "position",
      new T.Float32BufferAttribute(skirtPositions, 3),
    );
    skirt.setIndex(skirtIndices);
    skirt.computeVertexNormals();
    mesh(
      group,
      skirt,
      material(
        (track.theme || track.id) === "space" ? "#576181" : track.ground,
        {
          side: T.DoubleSide,
        },
      ),
    );
    const dashGeo = new T.BoxGeometry(0.12, 0.035, 4.8),
      dashMat = material("#d2e4e7"),
      dashCount = Math.floor(track.length / 13) * 2,
      dashes = new T.InstancedMesh(dashGeo, dashMat, dashCount);
    let k = 0;
    const tmp = new T.Object3D();
    for (let s = 0; s < track.length - 13; s += 13) {
      const f = track.frame(s);
      for (const side of [-1, 1]) {
        tmp.position.set(
          f.x + f.nx * side * track.width * 0.32,
          f.y + 0.035,
          f.z + f.nz * side * track.width * 0.32,
        );
        tmp.rotation.set(0, f.yaw, 0);
        tmp.updateMatrix();
        dashes.setMatrixAt(k++, tmp.matrix);
      }
    }
    dashes.count = k;
    group.add(dashes);
    const curbGeo = new T.BoxGeometry(1.05, 0.055, 3),
      curbs = new T.InstancedMesh(
        curbGeo,
        material("#dae4e5"),
        Math.ceil(track.length / 8) * 2,
      );
    k = 0;
    for (let s = 0; s < track.length; s += 8) {
      const f = track.frame(s);
      for (const side of [-1, 1]) {
        tmp.position.set(
          f.x + f.nx * side * (track.width - 0.3),
          f.y + 0.04,
          f.z + f.nz * side * (track.width - 0.3),
        );
        tmp.rotation.set(0, f.yaw, 0);
        tmp.updateMatrix();
        curbs.setMatrixAt(k++, tmp.matrix);
      }
    }
    curbs.count = k;
    group.add(curbs);
    return group;
  }
  function instanced(scene, geo, mat, entries) {
    if (!entries.length) return;
    const inst = new T.InstancedMesh(geo, mat, entries.length),
      o = new T.Object3D();
    entries.forEach((e, i) => {
      o.position.set(e.x, e.y, e.z);
      o.rotation.set(e.rx || 0, e.ry || 0, e.rz || 0);
      o.scale.set(e.sx || 1, e.sy || 1, e.sz || 1);
      o.updateMatrix();
      inst.setMatrixAt(i, o.matrix);
    });
    scene.add(inst);
    return inst;
  }
  function canvasTexture(paint, w = 512, h = 256) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    paint(c.getContext("2d"), w, h);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }
  function trackSign(text, accent) {
    return canvasTexture(
      (g, w, h) => {
        g.fillStyle = "#142439";
        g.fillRect(0, 0, w, h);
        g.strokeStyle = accent;
        g.lineWidth = 6;
        g.strokeRect(8, 8, w - 16, h - 16);
        g.fillStyle = accent;
        g.textAlign = "center";
        g.font = '900 48px "Barlow Condensed",sans-serif';
        g.fillText(text, w / 2, h * 0.58);
        g.font = "12px monospace";
        g.fillText("NEON DRIFT · CIRCUIT 87", w / 2, h * 0.79);
      },
      512,
      160,
    );
  }
  class View {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = null;
      this.mode = "garage";
      this.track = null;
      this.models = [];
      this.fx = [];
      this.rings = [];
      this.lastW = 0;
      this.lastH = 0;
      this.cameraReady = false;
      try {
        if (!T) throw Error("Three unavailable");
        this.renderer = new T.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
        this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 1.6));
        this.renderer.outputColorSpace = T.SRGBColorSpace;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        this.camera = new T.PerspectiveCamera(55, 16 / 9, 0.1, 2400);
        this.cameraPosition = new T.Vector3();
        this.lookTarget = new T.Vector3();
        this.initGarage();
        this.canvas.dataset.engine = "webgl";
      } catch (e) {
        this.renderer = null;
        this.ctx = canvas.getContext("2d");
        this.canvas.dataset.engine = "canvas";
        console.warn("Neon Drift: renderização alternativa 2.5D.", e.message);
      }
      this.canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        root.DriftGame?.pause(true);
        document.getElementById("driftNotice").textContent =
          "O cenário 3D foi interrompido. Reabra o jogo para tentar novamente.";
      });
    }
    resize() {
      const r = this.canvas.getBoundingClientRect(),
        w = Math.max(2, Math.round(r.width)),
        h = Math.max(2, Math.round(r.height));
      if (w === this.lastW && h === this.lastH) return;
      this.lastW = w;
      this.lastH = h;
      if (this.renderer) {
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      } else {
        const d = Math.min(root.devicePixelRatio || 1, 1.5);
        this.canvas.width = w * d;
        this.canvas.height = h * d;
      }
    }
    lights(scene) {
      scene.add(new T.HemisphereLight("#d9f0ff", "#544563", 2.2));
      const sun = new T.DirectionalLight("#ffe2bd", 3);
      sun.position.set(-90, 140, 70);
      scene.add(sun);
      const rim = new T.DirectionalLight("#9be4fa", 1.8);
      rim.position.set(50, 40, -90);
      scene.add(rim);
    }
    initGarage() {
      this.garage = new T.Scene();
      this.garage.background = new T.Color("#100d24");
      this.garage.fog = new T.FogExp2("#100d24", 0.012);
      this.lights(this.garage);
      const floor = mesh(
        this.garage,
        new T.PlaneGeometry(400, 400),
        material("#1f1737", { roughness: 0.5 }),
        0,
        -0.12,
        0,
      );
      floor.rotation.x = -Math.PI / 2;
      const grid = new T.GridHelper(80, 40, "#5d7b90", "#304d62");
      grid.position.y = -0.1;
      this.garage.add(grid);
      mesh(
        this.garage,
        new T.CylinderGeometry(4.3, 4.7, 0.22, 64),
        material("#3a2855"),
        0,
        -0.05,
        0,
      );
      const ring = mesh(
        this.garage,
        new T.TorusGeometry(4.32, 0.035, 8, 64),
        new T.MeshBasicMaterial({ color: "#8ce8d6" }),
        0,
        0.08,
        0,
      );
      ring.rotation.x = Math.PI / 2;
      this.garageCar = null;
    }
    selectCar(index) {
      this.carIndex = index;
      if (!this.renderer) return;
      if (this.garageCar) {
        this.garage.remove(this.garageCar);
        this.disposeObject(this.garageCar);
      }
      this.garageCar = createCar(D.cars[index]);
      this.garage.add(this.garageCar);
    }
    disposeObject(object) {
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set();
      object.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          for (const m of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(m);
            if (m.map) textures.add(m.map);
          }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    }
    load(race) {
      this.mode = "race";
      this.track = race.track;
      this.cameraReady = false;
      if (!this.renderer) return;
      if (this.raceScene) this.disposeObject(this.raceScene);
      this.raceScene = new T.Scene();
      this.raceScene.background = new T.Color(this.track.sky);
      this.raceScene.fog = new T.FogExp2(this.track.fog, 0.0016);
      this.lights(this.raceScene);
      this.raceScene.add(roadMesh(this.track));
      this.world = root.DriftWorld.build(this.raceScene, this.track);
      this.models = race.cars.map((c) => {
        const model = createCar(c.car, c.color);
        this.raceScene.add(model);
        return model;
      });
      this.boxes = race.boxes.map((b) => {
        const group = new T.Group(),
          mat = new T.MeshBasicMaterial({
            color: this.track.accent,
            transparent: true,
            opacity: 0.72,
          });
        const cube = mesh(
          group,
          new T.OctahedronGeometry(0.95),
          mat,
          0,
          1.5,
          0,
        );
        const frame = mesh(
          group,
          new T.TorusGeometry(1.15, 0.055, 5, 12),
          new T.MeshBasicMaterial({ color: "#f0eaff" }),
          0,
          1.5,
          0,
        );
        frame.rotation.x = Math.PI / 2;
        const f = this.track.frame(b.s);
        group.position.set(
          f.x + f.nx * b.lane * this.track.width,
          f.y,
          f.z + f.nz * b.lane * this.track.width,
        );
        this.raceScene.add(group);
        return group;
      });
      this.padModels = race.boostPads.map((p) => {
        const group = new T.Group(),
          f = this.track.frame(p.s);
        group.position.set(
          f.x + f.nx * p.lane * this.track.width,
          f.y + 0.07,
          f.z + f.nz * p.lane * this.track.width,
        );
        group.rotation.y = f.yaw;
        const mat = new T.MeshBasicMaterial({
          color: "#ead39b",
          transparent: true,
          opacity: 0.85,
          side: T.DoubleSide,
        });
        for (let i = 0; i < 3; i++) {
          const shape = new T.Shape();
          shape.moveTo(-2, -0.6 + i * 1.6);
          shape.lineTo(0, 0.6 + i * 1.6);
          shape.lineTo(2, -0.6 + i * 1.6);
          shape.lineTo(2, 0.2 + i * 1.6);
          shape.lineTo(0, 1.4 + i * 1.6);
          shape.lineTo(-2, 0.2 + i * 1.6);
          shape.closePath();
          const geo = new T.ShapeGeometry(shape);
          geo.rotateX(Math.PI / 2);
          mesh(group, geo, mat);
        }
        this.raceScene.add(group);
        return group;
      });
      this.mineModels = [];
      for (let i = 0; i < 28; i++) {
        const m = mesh(
          this.raceScene,
          new T.TorusGeometry(0.9, 0.17, 6, 12),
          new T.MeshBasicMaterial({ color: "#f29dbf" }),
        );
        m.rotation.x = Math.PI / 2;
        m.visible = false;
        this.mineModels.push(m);
      }
      const pgeo = new T.BufferGeometry(),
        positions = new Float32Array(120 * 3),
        colors = new Float32Array(120 * 3);
      pgeo.setAttribute("position", new T.BufferAttribute(positions, 3));
      pgeo.setAttribute("color", new T.BufferAttribute(colors, 3));
      this.sparkPoints = new T.Points(
        pgeo,
        new T.PointsMaterial({
          vertexColors: true,
          size: 0.25,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      );
      this.sparkPoints.frustumCulled = false;
      this.raceScene.add(this.sparkPoints);
      this.fx = [];
      this.rings = [];
      this.shake = 0;
      this.skids = [];
      this.smoke = [];
      this.lastTyres = new Map();
      const skidGeometry = new T.BufferGeometry();
      skidGeometry.setAttribute(
        "position",
        new T.BufferAttribute(new Float32Array(280 * 2 * 3), 3),
      );
      this.skidLines = new T.LineSegments(
        skidGeometry,
        new T.LineBasicMaterial({
          color: "#172a36",
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      );
      this.skidLines.frustumCulled = false;
      this.raceScene.add(this.skidLines);
      const puffMap = canvasTexture(
        (g) => {
          const grad = g.createRadialGradient?.(32, 32, 0, 32, 32, 32);
          if (grad?.addColorStop) {
            grad.addColorStop(0, "#ffffffaa");
            grad.addColorStop(1, "#ffffff00");
            g.fillStyle = grad;
          } else g.fillStyle = "#ffffff";
          g.fillRect(0, 0, 64, 64);
        },
        64,
        64,
      );
      const smokeGeometry = new T.BufferGeometry();
      smokeGeometry.setAttribute(
        "position",
        new T.BufferAttribute(new Float32Array(120 * 3), 3),
      );
      this.smokePoints = new T.Points(
        smokeGeometry,
        new T.PointsMaterial({
          map: puffMap,
          size: 1.3,
          transparent: true,
          opacity: 0.25,
          depthWrite: false,
          color: "#d9e1dd",
        }),
      );
      this.smokePoints.frustumCulled = false;
      this.raceScene.add(this.smokePoints);
    }
    effect(event, race) {
      if (!this.renderer || !this.raceScene || !race) return;
      const c = race.cars[event.id];
      if (!c) return;
      const f = race.track.frame(event.atS ?? c.s),
        contactLane = event.atLane ?? c.lane;
      if (
        (event.type === "bump" || event.type === "wall") &&
        (event.id === 0 || event.other === 0)
      )
        this.shake = Math.max(this.shake, (event.severity || 0.1) * 0.8);
      if (["pulse", "blocked", "pickup", "hit"].includes(event.type)) {
        const color =
          event.type === "hit"
            ? "#f5a6bf"
            : event.type === "pickup"
              ? "#fff0b6"
              : "#b9c4ff";
        const ring = mesh(
          this.raceScene,
          new T.TorusGeometry(1, 0.045, 5, 36),
          new T.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
          }),
          f.x + f.nx * c.lane * race.track.width,
          f.y + 1.2,
          f.z + f.nz * c.lane * race.track.width,
        );
        ring.rotation.x = Math.PI / 2;
        this.rings.push({ mesh: ring, life: 0.65, max: 0.65 });
      }
      if (["hit", "bump", "wall"].includes(event.type)) {
        for (
          let i = 0;
          i <
            (event.type === "hit"
              ? 16
              : 4 + Math.round((event.severity || 0.1) * 18)) &&
          this.fx.length < 115;
          i++
        )
          this.fx.push({
            x: f.x + f.nx * contactLane * race.track.width,
            y: f.y + 1,
            z: f.z + f.nz * contactLane * race.track.width,
            vx: (Math.random() - 0.5) * 12,
            vy: 2 + Math.random() * 5,
            vz: (Math.random() - 0.5) * 12,
            life: 0.45,
            color: new T.Color("#ffc9ab"),
          });
      }
    }
    render(race, time, dt = 0.016) {
      this.resize();
      if (!this.renderer) {
        this.fallback(race, time);
        return;
      }
      if (this.mode === "garage") {
        if (this.garageCar) this.garageCar.rotation.y = time * 0.22 + 0.5;
        const mobile = this.lastW < 600;
        this.camera.position.set(mobile ? 8 : 8.5, 5.4, 10.8);
        this.camera.lookAt(mobile ? 0 : -1, 0.8, 0);
        this.renderer.render(this.garage, this.camera);
        return;
      }
      if (!race || !this.raceScene) return;
      const track = race.track;
      this.world?.update(time, dt, race);
      race.cars.forEach((c, i) => {
        const model = this.models[i],
          f = track.frame(c.s);
        model.position.set(
          f.x + f.nx * c.lane * track.width,
          f.y +
            0.04 +
            (c.air > 0 ? Math.sin(Math.PI * (1 - c.air / 1.1)) * 2.2 : 0),
          f.z + f.nz * c.lane * track.width,
        );
        model.rotation.order = "YXZ";
        const grade = (track.at(c.s + 3).y - track.at(c.s - 3).y) / 6;
        model.rotation.x = -Math.atan(grade);
        model.rotation.y =
          f.yaw -
          c.heading -
          c.slipAngle -
          (c.impactYaw || 0) +
          (c.spin > 0 ? c.spin * 8 : 0);
        const { body, wheels, flame, shield, shadow } = model.userData;
        const airHeight =
          c.air > 0 ? Math.sin(Math.PI * (1 - c.air / 1.1)) * 2.2 : 0;
        shadow.position.y = 0.03 - airHeight;
        shadow.scale
          .copy(shadow.userData.baseScale)
          .multiplyScalar(1 - airHeight * 0.08);
        body.rotation.z =
          c.steerVisual * 0.035 + Math.sin(time * 39) * (c.impact || 0) * 0.035;
        body.position.y = .35+Math.sin(time*3+i)*.08;
        wheels.forEach((w) => {
          w.wheel.rotation.x = -c.s * 2.3;
          if (w.front) w.wheel.rotation.y = -c.wheelAngle;
        });
        flame.visible = c.speed > 2;
        for(const jet of flame.children)jet.scale.y=(c.boost>0?1.6:.7)+Math.sin(time*32)*.12;
        shield.visible = c.shield > 0;
        shield.rotation.y = time;
        const nearby =
          c.id === 0 ||
          Math.min(
            P.mod(c.s - race.player.s, track.length),
            P.mod(race.player.s - c.s, track.length),
          ) < 190;
        model.visible =
          nearby && (c.invulnerable <= 0 || Math.sin(time * 25) > -0.5);
        const sliding =
          Math.abs(c.slipAngle) > 0.11 &&
          c.speed > 11 &&
          c.air < 0.05 &&
          nearby;
        if (sliding) {
          const beta = c.heading + c.slipAngle,
            dirX = f.tx * Math.cos(beta) + f.nx * Math.sin(beta),
            dirZ = f.tz * Math.cos(beta) + f.nz * Math.sin(beta),
            rightX = f.nx * Math.cos(beta) - f.tx * Math.sin(beta),
            rightZ = f.nz * Math.cos(beta) - f.tz * Math.sin(beta);
          const tyres = [];
          for (const side of [-1, 1]) {
            const point = {
              x:
                model.position.x -
                dirX * c.length * 0.29 +
                rightX * side * 0.86,
              y: f.y + 0.065,
              z:
                model.position.z -
                dirZ * c.length * 0.29 +
                rightZ * side * 0.86,
            };
            tyres.push(point);
            const previous = this.lastTyres.get(c.id)?.[tyres.length - 1];
            if (
              previous &&
              Math.hypot(point.x - previous.x, point.z - previous.z) < 4
            )
              this.skids.push({ a: previous, b: point, life: 4 });
            if (this.smoke.length < 118 && Math.random() < 0.3)
              this.smoke.push({
                ...point,
                life: 0.75,
                vx: -dirX * 0.6,
                vz: -dirZ * 0.6,
              });
          }
          this.lastTyres.set(c.id, tyres);
        } else this.lastTyres.delete(c.id);
        if (c.drifting && c.driftCharge > 0.2 && this.fx.length < 110) {
          const sf = track.frame(c.s - 1.5);
          for (const side of [-1, 1])
            this.fx.push({
              x: sf.x + sf.nx * (c.lane * track.width + side),
              y: sf.y + 0.25,
              z: sf.z + sf.nz * (c.lane * track.width + side),
              vx: (Math.random() - 0.5) * 3,
              vy: 1 + Math.random() * 2,
              vz: (Math.random() - 0.5) * 3,
              life: 0.4,
              color:
                c.driftCharge > 1.45
                  ? new T.Color("#ddafff")
                  : new T.Color("#94e9ff"),
            });
        }
      });
      this.boxes.forEach((model, i) => {
        model.visible = race.boxes[i].ready <= race.elapsed;
        model.children[0].rotation.y = time * 0.8;
        model.children[0].position.y = 1.7 + Math.sin(time * 2 + i) * 0.2;
      });
      this.mineModels.forEach((m, i) => {
        const h = race.hazards[i];
        m.visible = !!h;
        if (h) {
          const f = track.frame(h.s);
          m.position.set(
            f.x + f.nx * h.lane * track.width,
            f.y + 0.2,
            f.z + f.nz * h.lane * track.width,
          );
          m.scale.setScalar(0.9 + Math.sin(time * 8) * 0.15);
        }
      });
      this.rings = this.rings.filter((r) => {
        r.life -= dt;
        if (r.life <= 0) {
          this.raceScene.remove(r.mesh);
          r.mesh.geometry.dispose();
          r.mesh.material.dispose();
          return false;
        }
        r.mesh.scale.setScalar(1 + (1 - r.life / r.max) * 7);
        r.mesh.material.opacity = (r.life / r.max) * 0.65;
        return true;
      });
      this.skids = this.skids.filter((s) => (s.life -= dt) > 0).slice(-280);
      const skidPositions = this.skidLines.geometry.attributes.position;
      this.skids.forEach((s, i) => {
        skidPositions.setXYZ(i * 2, s.a.x, s.a.y, s.a.z);
        skidPositions.setXYZ(i * 2 + 1, s.b.x, s.b.y, s.b.z);
      });
      skidPositions.needsUpdate = true;
      this.skidLines.geometry.setDrawRange(0, this.skids.length * 2);
      this.smoke = this.smoke.filter((p) => (p.life -= dt) > 0);
      const smokePositions = this.smokePoints.geometry.attributes.position;
      this.smoke.forEach((p, i) => {
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.y += dt * 0.85;
        smokePositions.setXYZ(i, p.x, p.y, p.z);
      });
      smokePositions.needsUpdate = true;
      this.smokePoints.geometry.setDrawRange(0, this.smoke.length);
      const positions = this.sparkPoints.geometry.attributes.position,
        colors = this.sparkPoints.geometry.attributes.color;
      this.fx = this.fx.filter((p) => (p.life -= dt) > 0);
      this.fx.forEach((p, i) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        positions.setXYZ(i, p.x, p.y, p.z);
        colors.setXYZ(i, p.color.r, p.color.g, p.color.b);
      });
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      this.sparkPoints.geometry.setDrawRange(0, this.fx.length);
      const player = race.player,
        f = track.frame(player.s),
        future = track.frame(player.s + 24),
        wide = this.lastW / Math.max(1, this.lastH) < 1.35;
      const position = new T.Vector3(
          f.x +
            f.nx * player.lane * track.width * 0.32 -
            f.tx * (wide ? 13 : 12),
          f.y + (wide ? 7.4 : 6.7),
          f.z +
            f.nz * player.lane * track.width * 0.32 -
            f.tz * (wide ? 13 : 12),
        ),
        look = new T.Vector3(
          future.x + future.nx * player.lane * track.width * 0.2,
          future.y + 1.2,
          future.z + future.nz * player.lane * track.width * 0.2,
        );
      if (race.phase === "finished") {
        position.set(
          f.x + Math.sin(time * 0.3) * 11,
          f.y + 5,
          f.z + Math.cos(time * 0.3) * 11,
        );
        look.copy(this.models[0].position);
        look.y += 1;
      }
      if (!this.cameraReady) {
        this.cameraPosition.copy(position);
        this.lookTarget.copy(look);
        this.cameraReady = true;
      } else {
        this.cameraPosition.lerp(position, 1 - Math.exp(-dt * 7));
        this.lookTarget.lerp(look, 1 - Math.exp(-dt * 10));
      }
      this.camera.position.copy(this.cameraPosition);
      this.camera.lookAt(this.lookTarget);
      this.shake = Math.max(0, (this.shake || 0) - dt * 2.4);
      if (this.shake > 0) {
        this.camera.position.x += Math.sin(time * 83) * this.shake * 0.13;
        this.camera.position.y += Math.cos(time * 71) * this.shake * 0.08;
        this.camera.rotateZ(Math.sin(time * 61) * this.shake * 0.008);
      }
      const fov = player.boost > 0 ? 64 : 55;
      if (Math.abs(this.camera.fov - fov) > 0.05) {
        this.camera.fov = lerp(this.camera.fov, fov, Math.min(1, dt * 4));
        this.camera.updateProjectionMatrix();
      }
      this.renderer.render(this.raceScene, this.camera);
    }
    fallback(race, time) {
      const g = this.ctx;
      if (!g) return;
      const w = this.canvas.width,
        h = this.canvas.height;
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (this.mode === "garage") {
        const grad = g.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#100d24");
        grad.addColorStop(1, "#30234b");
        g.fillStyle = grad;
        g.fillRect(0, 0, w, h);
        g.strokeStyle = "#63829c55";
        for (let i = 0; i < 14; i++) {
          g.beginPath();
          g.moveTo(w / 2, h * 0.35);
          g.lineTo(((i - 7) * w) / 5 + w / 2, h);
          g.stroke();
        }
        for (let i = 0; i < 12; i++) {
          const y = h * 0.35 + (i / 12) ** 2 * h * 0.65;
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(w, y);
          g.stroke();
        }
        car2D(
          g,
          w * 0.62,
          h * 0.61,
          h / 180,
          D.cars[this.carIndex || 0].color,
          -0.3 + Math.sin(time * 0.3) * 0.08,D.cars[this.carIndex||0].shape,
        );
        return;
      }
      if (!race) {
        preview(g, w, h, time);
        return;
      }
      const track = race.track,
        player = race.player;
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, track.sky);
      sky.addColorStop(0.55, track.fog);
      sky.addColorStop(1, track.ground);
      g.fillStyle = sky;
      g.fillRect(0, 0, w, h);
      g.fillStyle = track.sun;
      g.beginPath();
      g.arc(w * 0.77, h * 0.19, h * 0.09, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = track.ground;
      g.fillRect(0, h * 0.4, w, h * 0.6);
      const f0 = track.frame(player.s),
        segments = [];
      let clip = h;
      const project = (s, lane = 0) => {
        const f = track.frame(s),
          dx = f.x - f0.x,
          dz = f.z - f0.z;
        const ahead = dx * f0.tx + dz * f0.tz + 12,
          side = dx * f0.nx + dz * f0.nz - player.lane * track.width;
        const scale = (h * 0.78) / Math.max(1, ahead);
        return {
          x: w * 0.5 + side * scale,
          y: h * 0.48 + (f0.y + 6 - f.y) * scale,
          width: track.width * scale,
          scale,
          ahead,
        };
      };
      for (let i = 0; i <= 100; i++) {
        const distance = 4 + i * 2.8;
        segments.push(project(player.s + distance));
      }
      for (let i = segments.length - 2; i >= 0; i--) {
        const a = segments[i],
          b = segments[i + 1];
        if (a.ahead <= 1 || b.ahead <= 1) continue;
        g.fillStyle =
          Math.floor((player.s + i * 2.8) / 8) % 2 ? track.road : "#2c2042";
        g.beginPath();
        g.moveTo(a.x - a.width, a.y);
        g.lineTo(a.x + a.width, a.y);
        g.lineTo(b.x + b.width, b.y);
        g.lineTo(b.x - b.width, b.y);
        g.fill();
        g.strokeStyle = track.accent;
        g.lineWidth = Math.max(1, a.scale * 0.13);
        for (const side of [-1, 1]) {
          g.beginPath();
          g.moveTo(a.x + side * a.width, a.y);
          g.lineTo(b.x + side * b.width, b.y);
          g.stroke();
        }
        if (i % 5 < 2) {
          g.strokeStyle = "#dae3e77a";
          for (const side of [-0.33, 0.33]) {
            g.beginPath();
            g.moveTo(a.x + side * a.width, a.y);
            g.lineTo(b.x + side * b.width, b.y);
            g.stroke();
          }
        }
      }
      root.DriftWorld.paint2D(g, track, player, project, w, h, time, race);
      const visible = race.cars
        .filter((c) => c.id && c.s - player.s > 0 && c.s - player.s < 250)
        .sort((a, b) => b.s - a.s);
      for (const c of visible) {
        const p = project(c.s);
        car2D(
          g,
          p.x + c.lane * p.width,
          p.y,
          p.scale * 0.054,
          c.color,
          c.heading + c.slipAngle,c.car.shape,
        );
      }
      for (const b of race.boxes) {
        let delta = P.mod(b.s - player.s, track.length);
        if (delta > 10 && delta < 180 && b.ready <= race.elapsed) {
          const p = project(player.s + delta);
          g.save();
          g.translate(p.x + b.lane * p.width, p.y - 1.5 * p.scale);
          g.rotate(time);
          g.fillStyle = track.accent;
          g.fillRect(
            -p.scale * 0.7,
            -p.scale * 0.7,
            p.scale * 1.4,
            p.scale * 1.4,
          );
          g.restore();
        }
      }
      car2D(
        g,
        w * 0.5,
        h * 0.82,
        h / 550,
        player.color,
        player.heading + player.slipAngle,player.car.shape,
      );
      if (player.shield > 0) {
        g.strokeStyle = "#a8ffdf";
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(w / 2, h * 0.82, h * 0.07, h * 0.12, 0, 0, Math.PI * 2);
        g.stroke();
      }
      if (player.boost > 0) {
        g.strokeStyle = "#b9f9fb99";
        for (let i = 0; i < 12; i++) {
          const x = (i * 173) % w,
            y = (time * 300 + i * 51) % h;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x, y + 25);
          g.stroke();
        }
      }
    }
    close() {
      this.mode = "garage";
      if (this.raceScene) {
        this.disposeObject(this.raceScene);
        this.raceScene = null;
        this.world = null;
        this.skids = [];
        this.smoke = [];
        this.lastTyres?.clear();
        this.models = [];
        this.fx = [];
      }
    }
  }
  root.DriftRenderer = {
    View,
    createCar,
    roadMesh,
    stripGeometry,
    preview,
    car2D,
  };
})(window);
