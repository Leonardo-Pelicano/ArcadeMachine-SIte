/* Sculpted, smooth-shaded original vehicles. All cars face local +Z. */
(function (root) {
  "use strict";
  const T = root.THREE;
  function mat(color, extra = {}) {
    return new T.MeshPhysicalMaterial({
      color,
      metalness: 0.25,
      roughness: 0.34,
      clearcoat: 0.65,
      clearcoatRoughness: 0.25,
      ...extra,
    });
  }
  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function box(p, m, w, h, d, x, y, z) {
    return mesh(p, new T.BoxGeometry(w, h, d), m, x, y, z);
  }
  // Eight rounded corner vertices per section produce a curved, coherent silhouette.
  function loft(p, sections, material) {
    const positions = [],
      indices = [];
    for (const [z, w, b, t] of sections) {
      const bevel = Math.min(0.07, (t - b) * 0.25);
      for (const [x, y] of [
        [-0.85 * w, b],
        [-w, b + bevel],
        [-w, t - bevel],
        [-0.78 * w, t],
        [0.78 * w, t],
        [w, t - bevel],
        [w, b + bevel],
        [0.85 * w, b],
      ])
        positions.push(x, y, z);
    }
    for (let i = 0; i < sections.length - 1; i++)
      for (let j = 0; j < 8; j++) {
        const a = i * 8 + j,
          b = i * 8 + ((j + 1) % 8),
          c = a + 8,
          d = b + 8;
        indices.push(a, b, c, b, d, c);
      }
    for (let j = 1; j < 7; j++) {
      indices.push(0, j + 1, j);
      const a = (sections.length - 1) * 8;
      indices.push(a, a + j, a + j + 1);
    }
    for (let i = 0; i < indices.length; i += 3) {
      const v = indices[i + 1];
      indices[i + 1] = indices[i + 2];
      indices[i + 2] = v;
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return mesh(p, g, material);
  }
  function rod(p, a, b, r, m) {
    const va = new T.Vector3(...a),
      vb = new T.Vector3(...b),
      v = vb.clone().sub(va),
      o = mesh(p, new T.CylinderGeometry(r, r, v.length(), 10), m);
    o.position.copy(va.add(vb).multiplyScalar(0.5));
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
    return o;
  }
  function tube(p, points, r, material) {
    return mesh(
      p,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v))),
        20,
        r,
        8,
        false,
      ),
      material,
    );
  }
  function create(config, color) {
    const group = new T.Group(),
      body = new T.Group();
    group.add(body);
    const formula = config.shape === "formula",
      sport = config.shape === "sport",
      muscle = config.shape === "muscle",
      rally = config.shape === "rally",
      proto = config.shape === "prototype";
    const width = formula ? 1.22 : muscle ? 1.1 : sport ? 0.96 : 1.02,
      length = formula
        ? 2.65
        : proto
          ? 2.35
          : muscle
            ? 2.2
            : rally
              ? 1.92
              : 2.08;
    const paint = mat(color || config.color),
      trim = mat(config.accent),
      dark = mat("#132537", { roughness: 0.65, metalness: 0.1 }),
      glass = mat("#214355", {
        roughness: 0.12,
        metalness: 0.45,
        clearcoat: 1,
      }),
      rubber = mat("#17212b", { roughness: 0.88, metalness: 0 }),
      metal = mat("#bfd0d6", { metalness: 0.8, roughness: 0.25 }),
      red = new T.MeshBasicMaterial({ color: "#f07997" }),
      white = new T.MeshBasicMaterial({ color: "#e1fff0" });
    if (formula) {
      loft(
        body,
        [
          [-2.25, 0.36, 0.38, 0.75],
          [-1.5, 0.5, 0.35, 0.94],
          [-0.5, 0.52, 0.3, 0.86],
          [0.5, 0.35, 0.31, 0.72],
          [1.55, 0.17, 0.35, 0.61],
          [2.5, 0.12, 0.34, 0.43],
        ],
        paint,
      );
      for (const s of [-1, 1]) {
        loft(
          body,
          [
            [-1.5, 0.28, 0.28, 0.66],
            [-1.1, 0.43, 0.3, 0.8],
            [-0.3, 0.38, 0.28, 0.72],
            [0.55, 0.26, 0.27, 0.62],
          ],
          paint,
        ).position.x = s * 0.66;
        box(body, dark, 0.46, 0.12, 0.5, s * 0.7, 0.82, -1);
        for (const z of [-1.5, 1.6]) {
          rod(body, [s * 0.35, 0.4, z - 0.3], [s * 1.23, 0.44, z], 0.035, dark);
          rod(
            body,
            [s * 0.32, 0.61, z + 0.15],
            [s * 1.23, 0.44, z],
            0.028,
            metal,
          );
        }
      }
      loft(
        body,
        [
          [-1.6, 0.4, 0.8, 1.15],
          [-1.15, 0.32, 0.8, 1.39],
          [-0.65, 0.22, 0.76, 1.16],
        ],
        paint,
      );
      mesh(
        body,
        new T.SphereGeometry(0.24, 20, 12),
        dark,
        0,
        0.85,
        -0.22,
      ).scale.set(1, 0.8, 1.55);
      mesh(body, new T.SphereGeometry(0.19, 20, 12), trim, 0, 1.03, -0.3);
      const visor = mesh(
        body,
        new T.SphereGeometry(0.193, 16, 10, 0, Math.PI),
        glass,
        0,
        1.045,
        -0.27,
      );
      visor.scale.set(1, 0.45, 1);
      tube(
        body,
        [
          [-0.35, 0.89, -0.65],
          [-0.38, 1.31, -0.4],
          [0, 1.35, 0.27],
          [0.38, 1.31, -0.4],
          [0.35, 0.89, -0.65],
        ],
        0.045,
        dark,
      );
      rod(body, [0, 1.34, 0.27], [0, 0.75, 0.48], 0.043, dark);
      for (let i = 0; i < 3; i++) {
        loft(
          body,
          [
            [2.05 + i * 0.12, 1.35, 0.3 + i * 0.06, 0.36 + i * 0.06],
            [2.4 + i * 0.08, 1.4, 0.28 + i * 0.06, 0.34 + i * 0.06],
          ],
          i === 1 ? trim : paint,
        );
        box(body, dark, 0.06, 0.34, 0.53, (i % 2 ? 1 : -1) * 1.38, 0.43, 2.35);
      }
      for (const s of [-1, 1]) {
        box(body, dark, 0.07, 0.51, 0.1, s * 0.8, 1.01, -2.05);
        box(body, paint, 0.06, 0.45, 0.61, s * 1.01, 1.35, -2.1);
      }
      loft(
        body,
        [
          [-2.4, 1.02, 1.28, 1.35],
          [-1.9, 1.02, 1.38, 1.45],
        ],
        paint,
      );
      box(body, trim, 1.96, 0.045, 0.12, 0, 1.46, -1.95);
    } else {
      const ht = proto ? 0.73 : muscle ? 0.9 : 0.86;
      loft(
        body,
        [
          [-length, 0.7 * width, 0.35, ht * 0.87],
          [-length * 0.83, 0.94 * width, 0.3, ht],
          [-length * 0.45, width, 0.27, ht * 1.06],
          [length * 0.23, width, 0.28, ht],
          [length * 0.72, 0.95 * width, 0.31, ht * 0.91],
          [length, 0.69 * width, 0.4, ht * 0.72],
        ],
        paint,
      );
      const roof = proto ? 1.32 : rally ? 1.65 : muscle ? 1.52 : 1.53;
      loft(
        body,
        [
          [-1.12, 0.6 * width, 0.82, 0.91],
          [-0.72, 0.72 * width, 0.85, roof - 0.08],
          [-0.24, 0.69 * width, 0.86, roof],
          [0.28, 0.63 * width, 0.85, roof - 0.13],
          [0.86, 0.52 * width, 0.8, 0.88],
        ],
        glass,
      );
      loft(
        body,
        [
          [-0.73, 0.68 * width, roof - 0.12, roof - 0.07],
          [-0.22, 0.66 * width, roof - 0.035, roof + 0.015],
          [0.25, 0.59 * width, roof - 0.15, roof - 0.1],
        ],
        paint,
      );
      for (const s of [-1, 1]) {
        tube(
          body,
          [
            [s * 0.59 * width, 0.91, -1.1],
            [s * 0.71 * width, roof - 0.08, -0.71],
            [s * 0.66 * width, roof, -0.23],
            [s * 0.61 * width, roof - 0.13, 0.28],
            [s * 0.51 * width, 0.86, 0.85],
          ],
          0.035,
          paint,
        );
        rod(
          body,
          [s * 0.68 * width, 0.86, -0.3],
          [s * 0.67 * width, roof - 0.02, -0.3],
          0.026,
          paint,
        );
        mesh(
          body,
          new T.SphereGeometry(0.15, 12, 8),
          paint,
          s * (width + 0.08),
          1.03,
          0.38,
        ).scale.set(1, 0.48, 1.4);
        // Curved wheel brows, wrap-around headlamps, door seams and handles.
        for (const z of [-length * 0.61, length * 0.62]) {
          const brow = mesh(
            body,
            new T.TorusGeometry(0.48, 0.055, 8, 20, Math.PI),
            paint,
            s * width,
            0.47,
            z,
          );
          brow.rotation.y = Math.PI / 2;
          brow.rotation.z = Math.PI / 2;
        }
        const head = mesh(
          body,
          new T.SphereGeometry(1, 16, 8),
          white,
          s * width * 0.56,
          0.68,
          length - 0.09,
        );
        head.scale.set(width * 0.29, 0.075, 0.16);
        const tail = mesh(
          body,
          new T.SphereGeometry(1, 12, 8),
          red,
          s * width * 0.54,
          0.71,
          -length + 0.03,
        );
        tail.scale.set(width * 0.29, 0.065, 0.12);
        rod(
          body,
          [s * (width + 0.013), 0.79, -0.7],
          [s * (width + 0.013), 0.76, 0.4],
          0.009,
          dark,
        );
        box(body, metal, 0.035, 0.035, 0.19, s * (width + 0.035), 0.83, -0.04);
        box(body, dark, 0.08, 0.085, length * 1.6, s * width, 0.29, -0.03);
      }
      loft(
        body,
        [
          [length - 0.2, width * 0.89, 0.29, 0.36],
          [length + 0.08, width * 0.91, 0.27, 0.34],
        ],
        dark,
      );
      loft(
        body,
        [
          [-length - 0.05, width * 0.84, 0.3, 0.36],
          [-length + 0.22, width * 0.95, 0.28, 0.35],
        ],
        dark,
      );
      for (const side of [-1, 1])
        loft(
          body,
          [
            [0.8, 0.055, 0.855, 0.865],
            [1.3, 0.052, 0.79, 0.8],
            [length - 0.14, 0.045, 0.68, 0.69],
          ],
          trim,
        ).position.x = side * 0.14;
      if (muscle) {
        loft(
          body,
          [
            [0.75, 0.3, 0.92, 1.02],
            [1.25, 0.28, 0.87, 0.96],
          ],
          dark,
        );
      }
      if (rally)
        for (const x of [-0.35, 0, 0.35])
          mesh(
            body,
            new T.SphereGeometry(0.105, 12, 8),
            white,
            x,
            0.85,
            length - 0.01,
          );
      const wing = proto || sport;
      for (const s of [-1, 1])
        rod(
          body,
          [s * 0.65, 0.82, -length + 0.2],
          [s * 0.65, wing ? 1.26 : 1.01, -length + 0.15],
          0.035,
          dark,
        );
      loft(
        body,
        [
          [
            -length - 0.08,
            width * (wing ? 1.06 : 0.83),
            wing ? 1.25 : 1.01,
            wing ? 1.31 : 1.06,
          ],
          [
            -length + 0.24,
            width * (wing ? 1.06 : 0.83),
            wing ? 1.3 : 1.03,
            wing ? 1.36 : 1.08,
          ],
        ],
        paint,
      );
    }
    const wheels = [];
    for (const s of [-1, 1])
      for (const front of [false, true]) {
        const z = front
            ? formula
              ? 1.6
              : length * 0.62
            : formula
              ? -1.52
              : -length * 0.61,
          wheel = new T.Group(),
          axle = formula ? 1.28 : width;
        wheel.position.set(s * axle, 0.43, z);
        body.add(wheel);
        const radius = formula ? 0.41 : 0.39,
          thick = formula && !front ? 0.46 : 0.31;
        const tire = new T.CylinderGeometry(
          radius * 0.91,
          radius * 0.91,
          thick,
          24,
        );
        tire.rotateZ(Math.PI / 2);
        mesh(wheel, tire, rubber);
        for (const face of [-1, 1]) {
          const torus = mesh(
            wheel,
            new T.TorusGeometry(radius * 0.83, 0.065, 8, 24),
            rubber,
            face * thick * 0.43,
            0,
            0,
          );
          torus.rotation.y = Math.PI / 2;
          const rim = mesh(
            wheel,
            new T.CylinderGeometry(
              radius * 0.59,
              radius * 0.59,
              thick + 0.008,
              20,
            ),
            dark,
          );
          rim.rotation.z = Math.PI / 2;
          const ring = mesh(
            wheel,
            new T.TorusGeometry(radius * 0.58, 0.023, 6, 20),
            formula ? trim : metal,
            s * (thick * 0.5 + 0.005),
            0,
            0,
          );
          ring.rotation.y = Math.PI / 2;
        }
        for (let i = 0; i < 5; i++) {
          const spoke = box(
            wheel,
            metal,
            0.035,
            0.035,
            radius * 1.06,
            s * (thick * 0.51 + 0.012),
            0,
            0,
          );
          spoke.rotation.x = (i * Math.PI * 2) / 5;
        }
        wheels.push({ wheel, front });
      }
    const shadow = mesh(
      group,
      new T.CircleGeometry(1, 32),
      new T.MeshBasicMaterial({
        color: "#08111e",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
      0,
      0.035,
      0,
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(width * 1.4, length * 1.1, 1);
    shadow.userData.baseScale = shadow.scale.clone();
    const flame = mesh(
      body,
      new T.ConeGeometry(0.2, 1.4, 12),
      new T.MeshBasicMaterial({
        color: "#a6efff",
        transparent: true,
        opacity: 0.8,
      }),
      0,
      0.48,
      -length - 0.4,
    );
    flame.rotation.x = -Math.PI / 2;
    flame.visible = false;
    const shield = mesh(
      group,
      new T.SphereGeometry(2.9, 20, 12),
      new T.MeshBasicMaterial({
        color: "#96f3dc",
        wireframe: true,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      }),
      0,
      1,
      0,
    );
    shield.scale.set(0.65, 0.5, 1);
    shield.visible = false;
    group.userData = { body, wheels, flame, shield, shadow, length };
    return group;
  }
  root.DriftModels = { create, loft };
})(window);
