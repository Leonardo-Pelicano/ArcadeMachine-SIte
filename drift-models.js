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
  function create(config,color){
 const group=new T.Group(),body=new T.Group();group.add(body);const type=config.shape;
 const paint=mat(color||config.color,{metalness:.58,roughness:.3}),trim=mat(config.accent,{emissive:config.accent,emissiveIntensity:.25}),dark=mat('#121024',{metalness:.55}),glass=mat('#253b69',{metalness:.75,roughness:.12,emissive:'#143855',emissiveIntensity:.5}),white=mat('#dcd8f5');
 const hull=(sections,m=paint)=>loft(body,sections,m);
 function ellipsoid(x,y,z,sx,sy,sz,m){const o=mesh(body,new T.SphereGeometry(1,20,12),m,x,y,z);o.scale.set(sx,sy,sz);return o;}
 function wing(points,y=.45){const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.05,bevelThickness:.035,bevelSegments:1,steps:1});geo.rotateX(Math.PI/2);return mesh(body,geo,paint,0,y,0);}
 const engines=[];
 function engine(x,z,r=.34){const shell=mesh(body,new T.CylinderGeometry(r,r*.85,.65,16),dark,x,.52,z);shell.rotation.x=Math.PI/2;const rim=mesh(body,new T.TorusGeometry(r*.78,.055,6,20),trim,x,.52,z-.35);const core=mesh(body,new T.CircleGeometry(r*.65,16),new T.MeshBasicMaterial({color:'#b9dfff',side:T.DoubleSide}),x,.52,z-.37);engines.push({x,z:z-.5,r});return shell;}
 let length=2.5;
 if(type==='gt'){hull([[-1.9,.28,.3,.6],[-.8,.5,.25,.85],[.6,.38,.3,.83],[2.45,.035,.38,.45]],white);for(const sign of [-1,1]){wing([[sign*.3,1.1],[sign*1.7,-1.4],[sign*1.3,-1.8],[sign*.3,-.8]]);engine(sign*.82,-1.5,.3);box(body,trim,.12,.05,1.3,sign*1.15,.54,-.8);}ellipsoid(0,.85,.3,.26,.22,.66,glass);}
 if(type==='sport'){wing([[-.1,2.1],[-1.9,-1.2],[-1.5,-1.7],[0,-.8],[1.5,-1.7],[1.9,-1.2],[.1,2.1]],.6);hull([[-1,.32,.35,.8],[0,.4,.3,.95],[1.9,.04,.45,.5]]);ellipsoid(0,.85,.5,.28,.2,.7,glass);for(const x of [-.8,.8])engine(x,-1,.28);}
 if(type==='muscle'){length=2.8;for(const sign of [-1,1]){const pod=new T.Group();body.add(pod);pod.position.x=sign*1.05;loft(pod,[[-2,.4,.2,.8],[-.5,.48,.18,1],[1.8,.3,.25,.6],[2.3,.08,.3,.4]],paint);engine(sign*1.05,-1.9,.42);box(body,trim,.12,.06,1.5,sign*1.1,1,-.5);}box(body,dark,1.8,.22,1.5,0,.5,0);ellipsoid(0,.82,.3,.42,.28,.65,glass);}
 if(type==='rally'){for(let i=0;i<3;i++){const a=i/3*Math.PI*2,x=Math.sin(a)*1.25,z=Math.cos(a)*1.1;ellipsoid(x,.45,z,.48,.28,.8,paint);engine(x,z-.55,.25);rod(body,[0,.5,0],[x,.45,z],.13,dark);}ellipsoid(0,.7,.3,.65,.44,.9,white);ellipsoid(0,1,.5,.35,.2,.45,glass);}
 if(type==='prototype'){length=2.4;const ring=mesh(body,new T.TorusGeometry(1.45,.16,10,48),paint,0,.5,-.25);ring.rotation.x=Math.PI/2;const inner=mesh(body,new T.TorusGeometry(1.2,.045,6,48),trim,0,.5,-.25);inner.rotation.x=Math.PI/2;hull([[-1.7,.2,.3,.6],[0,.4,.3,1],[2,.04,.35,.4]],white);for(const x of [-1,1])rod(body,[0,.55,0],[x*1.45,.5,-.25],.09,dark);ellipsoid(0,.95,.4,.25,.2,.6,glass);engine(0,-1.55,.36);}
 if(type==='formula'){length=3;hull([[-2.25,.2,.28,.65],[-.7,.43,.28,.95],[.8,.25,.35,.72],[3,.025,.4,.43]],white);for(const x of [-1,1]){wing([[x*.2,.9],[x*1.35,1.2],[x*1.2,.6],[x*.25,.1]]);wing([[x*.2,-.8],[x*1.25,-2.4],[x*.7,-2.1],[x*.2,-1.5]]);engine(x*.55,-1.9,.25);box(body,trim,.08,.04,1.8,x*.15,.7,-.4);}ellipsoid(0,.9,.1,.23,.21,.65,glass);}
 // Hull seams, navigation lights, magnetic suspension and independent exhaust cones.
 for(const x of [-.22,.22])box(body,dark,.035,.025,1.1,x,.88,-.5);
 const flame=new T.Group();body.add(flame);for(const e of engines){const jet=mesh(flame,new T.ConeGeometry(e.r*.65,1.3,12),new T.MeshBasicMaterial({color:'#aa91ff',transparent:true,opacity:.75}),e.x,.52,e.z-.4);jet.rotation.x=-Math.PI/2;}
 const shield=mesh(group,new T.SphereGeometry(2.8,20,12),new T.MeshBasicMaterial({color:'#b1a2ff',wireframe:true,transparent:true,opacity:.1,depthWrite:false}),0,.5,0);shield.scale.set(.8,.4,1);shield.visible=false;
 const shadow=mesh(group,new T.CircleGeometry(1,24),new T.MeshBasicMaterial({color:'#aa7bff',transparent:true,opacity:.11,depthWrite:false}),0,.04,0);shadow.rotation.x=-Math.PI/2;shadow.scale.set(1.7,2.4,1);shadow.userData.baseScale=shadow.scale.clone();group.userData={body,wheels:[],flame,shield,shadow,length,engines};return group;
 }
 root.DriftModels={create,loft};
})(window);
