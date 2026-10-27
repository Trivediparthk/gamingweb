import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const ROOM = 16;

function cloneMap(map, repeatX, repeatY, rotation = 0) {
  if (!map) return null;
  const copy = map.clone();
  copy.wrapS = THREE.RepeatWrapping;
  copy.wrapT = THREE.RepeatWrapping;
  copy.repeat.set(repeatX, repeatY);
  copy.rotation = rotation;
  copy.center.set(0.5, 0.5);
  copy.needsUpdate = true;
  return copy;
}

function woodVariant(base, color, repeatX = 1, repeatY = 1) {
  const material = base.clone();
  material.color.set(color);
  material.map = cloneMap(base.map, repeatX, repeatY);
  material.normalMap = cloneMap(base.normalMap, repeatX, repeatY);
  material.roughnessMap = cloneMap(base.roughnessMap, repeatX, repeatY);
  material.aoMap = cloneMap(base.aoMap, repeatX, repeatY);
  material.needsUpdate = true;
  return material;
}

function mesh(geometry, material, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  return object;
}

function box(w, h, d, material, x, y, z, radius = 0.03, segments = 2) {
  const object = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, radius), material);
  object.position.set(x, y, z);
  return object;
}


function makeForestSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#6f97b4");
  gradient.addColorStop(0.36, "#a8c3c5");
  gradient.addColorStop(0.66, "#d9dfc4");
  gradient.addColorStop(1, "#e5d8ae");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  let seed = 3071;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 22; i += 1) {
    const x = random() * 1024;
    const y = 75 + random() * 190;
    const radius = 35 + random() * 100;
    const cloud = ctx.createRadialGradient(x, y, 2, x, y, radius);
    cloud.addColorStop(0, "rgba(255,250,235,0.28)");
    cloud.addColorStop(0.55, "rgba(255,247,225,0.11)");
    cloud.addColorStop(1, "rgba(255,245,220,0)");
    ctx.fillStyle = cloud;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  const sun = ctx.createRadialGradient(790, 160, 2, 790, 160, 150);
  sun.addColorStop(0, "rgba(255,250,217,0.72)");
  sun.addColorStop(0.2, "rgba(255,235,178,0.2)");
  sun.addColorStop(1, "rgba(255,230,170,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 1024, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeForestGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#34452b";
  ctx.fillRect(0, 0, 512, 512);
  let seed = 9931;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 1700; i += 1) {
    const green = 48 + Math.floor(random() * 35);
    ctx.fillStyle = `rgba(${28 + Math.floor(random() * 20)}, ${green}, ${22 + Math.floor(random() * 18)}, ${0.12 + random() * 0.22})`;
    ctx.beginPath();
    ctx.arc(random() * 512, random() * 512, 1 + random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  return texture;
}

function buildStudy(materials, lowDetail) {
  const group = new THREE.Group();
  group.name = "Luxury wooden study";
  const floorWood = woodVariant(materials.frame, "#392219", 8, 8);
  const wallWood = woodVariant(materials.frame, "#4a2c1e", 6, 2);
  const tableWood = woodVariant(materials.frame, "#7a4b2c", 4.5, 3.5);
  const plaster = new THREE.MeshStandardMaterial({ color: "#564b3e", roughness: 0.92 });
  const plasterDark = new THREE.MeshStandardMaterial({ color: "#2c2620", roughness: 0.95 });
  const rug = new THREE.MeshStandardMaterial({ color: "#5f2721", roughness: 0.94 });
  const rugTrim = new THREE.MeshStandardMaterial({ color: "#b4925f", metalness: 0.45, roughness: 0.45 });
  const leather = new THREE.MeshStandardMaterial({ color: "#3a1d16", roughness: 0.72 });
  const bookColors = ["#5b2b22", "#2e463e", "#2d3652", "#58452a", "#382b41", "#64452e"];
  const lampShade = new THREE.MeshStandardMaterial({
    color: "#d8a56a",
    emissive: "#9a5422",
    emissiveIntensity: 0.6,
    roughness: 0.68,
    side: THREE.DoubleSide,
  });

  const floor = mesh(new THREE.PlaneGeometry(ROOM * 2.4, ROOM * 2.4), floorWood, [0, -2.3, 0]);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const carpet = box(17, 0.035, 12.6, rug, 0, -2.255, 0.4, 0.02);
  carpet.receiveShadow = true;
  group.add(carpet);
  for (const [w, d, x, z] of [[16.4, 0.06, 0, 6.55], [16.4, 0.06, 0, -5.75], [0.06, 11.9, -8.05, 0.4], [0.06, 11.9, 8.05, 0.4]]) {
    const trim = box(w, 0.025, d, rugTrim, x, -2.23, z, 0.01);
    group.add(trim);
  }

  const tableTop = box(14.2, 0.48, 11.2, tableWood, 0, -0.58, 0, 0.16, 4);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);
  for (const x of [-5.6, 5.6]) {
    for (const z of [-4.2, 4.2]) {
      const leg = box(0.55, 2.0, 0.55, tableWood, x, -1.62, z, 0.08, 3);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    }
  }

  // Shelved walls and panelling.
  for (const [z, rot] of [[-ROOM, 0], [ROOM, Math.PI]]) {
    const wall = box(ROOM * 2, 13, 0.34, plaster, 0, 3.9, z, 0.02);
    wall.rotation.y = rot;
    wall.receiveShadow = true;
    group.add(wall);
    for (const x of [-11, -7.3, -3.6, 0, 3.6, 7.3, 11]) {
      const panel = box(2.8, 4.6, 0.2, wallWood, x, -0.1, z + (z < 0 ? 0.24 : -0.24), 0.06);
      group.add(panel);
    }
    const upper = box(ROOM * 2, 1.1, 0.4, wallWood, 0, -2.0, z + (z < 0 ? 0.22 : -0.22), 0.04);
    group.add(upper);
  }
  for (const [x, rot] of [[-ROOM, Math.PI / 2], [ROOM, -Math.PI / 2]]) {
    const wall = box(ROOM * 2, 13, 0.34, plaster, x, 3.9, 0, 0.02);
    wall.rotation.y = rot;
    wall.receiveShadow = true;
    group.add(wall);
    const trim = box(0.32, 1.1, ROOM * 2, wallWood, x + (x < 0 ? 0.23 : -0.23), -2.0, 0, 0.05);
    group.add(trim);
  }

  const bookcase = (x, z, rotation) => {
    const caseGroup = new THREE.Group();
    caseGroup.position.set(x, 0, z);
    caseGroup.rotation.y = rotation;
    const carcass = box(3.6, 6.2, 0.65, wallWood, 0, 0.4, 0, 0.04);
    carcass.castShadow = true;
    caseGroup.add(carcass);
    for (let shelfIndex = 0; shelfIndex < 4; shelfIndex += 1) {
      const y = -1.95 + shelfIndex * 1.45;
      caseGroup.add(box(3.35, 0.1, 0.76, tableWood, 0, y - 0.7, 0.02, 0.02));
      const count = lowDetail ? 4 : 7;
      for (let i = 0; i < count; i += 1) {
        const h = 0.55 + ((i * 17 + shelfIndex * 11) % 5) * 0.08;
        const w = 0.12 + ((i * 5 + shelfIndex) % 3) * 0.035;
        const book = box(w, h, 0.42, new THREE.MeshStandardMaterial({ color: bookColors[(i + shelfIndex) % bookColors.length], roughness: 0.82 }), -1.3 + i * 0.4, y - 0.65 + h / 2, 0.38, 0.01);
        caseGroup.add(book);
      }
    }
    const crown = box(3.85, 0.2, 0.85, tableWood, 0, 3.6, 0, 0.03);
    caseGroup.add(crown);
    group.add(caseGroup);
  };
  bookcase(-8.5, -11.9, 0);
  bookcase(0, -11.9, 0);
  bookcase(8.5, -11.9, 0);

  // A warm window on the right wall.
  const windowGlow = new THREE.MeshBasicMaterial({ color: "#f4c383" });
  const window = box(0.08, 4.2, 4.4, windowGlow, 12.98, 3.1, 0, 0.02);
  group.add(window);
  const windowFrame = woodVariant(materials.frame, "#3b2418", 2, 2);
  for (const z of [-2.4, 2.4]) group.add(box(0.18, 4.7, 0.16, windowFrame, 12.85, 3.1, z, 0.02));
  for (const y of [0.95, 5.25]) group.add(box(0.18, 0.16, 4.9, windowFrame, 12.85, y, 0, 0.02));
  group.add(box(0.18, 0.15, 4.5, windowFrame, 12.82, 3.1, 0, 0.02));
  const curtainMat = new THREE.MeshStandardMaterial({ color: "#5d2821", roughness: 0.85, side: THREE.DoubleSide });
  for (const z of [-3.5, 3.5]) {
    const curtain = box(0.22, 5.2, 1.05, curtainMat, 12.65, 2.8, z, 0.06);
    group.add(curtain);
  }

  // A framed landscape on the back wall.
  const painting = box(5.5, 3.2, 0.12, new THREE.MeshStandardMaterial({ color: "#2d3d32", roughness: 0.9 }), 0, 3.55, -13.05, 0.02);
  group.add(painting);
  const goldFrame = new THREE.MeshStandardMaterial({ color: "#a98550", metalness: 0.65, roughness: 0.36 });
  group.add(box(5.9, 0.16, 0.2, goldFrame, 0, 5.2, -12.92, 0.02));
  group.add(box(5.9, 0.16, 0.2, goldFrame, 0, 1.9, -12.92, 0.02));
  group.add(box(0.16, 3.45, 0.2, goldFrame, -2.95, 3.55, -12.92, 0.02));
  group.add(box(0.16, 3.45, 0.2, goldFrame, 2.95, 3.55, -12.92, 0.02));

  // Table lamps, brass and warm glow.
  const brass = materials.brass;
  const lampPositions = [[-4.7, -2.5], [4.8, -2.6]];
  const lampLights = [];
  for (const [x, z] of lampPositions) {
    const lamp = new THREE.Group();
    lamp.position.set(x, -0.32, z);
    lamp.add(mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.12, 32), brass, [0, 0.06, 0]));
    lamp.add(mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.85, 16), brass, [0, 0.9, 0]));
    lamp.add(mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.12, 24), brass, [0, 1.82, 0]));
    const shade = mesh(new THREE.CylinderGeometry(0.65, 1.02, 0.72, 32, 1, true), lampShade, [0, 2.22, 0]);
    lamp.add(shade);
    const light = new THREE.PointLight("#ffb76d", 13, 12, 2);
    light.position.set(0, 2.0, 0);
    lamp.add(light);
    lampLights.push({ light, phase: Math.random() * 10 });
    group.add(lamp);
  }

  // A low leather chair in the corner.
  const chair = new THREE.Group();
  chair.position.set(-9.0, -0.4, 6.8);
  chair.rotation.y = 0.55;
  chair.add(box(2.6, 0.45, 2.4, leather, 0, 0.3, 0.4, 0.18));
  chair.add(box(2.6, 2.4, 0.35, leather, 0, 1.35, -0.85, 0.16));
  for (const x of [-1.05, 1.05]) chair.add(box(0.28, 1.1, 0.28, leather, x, 0.55, 1.2, 0.08));
  chair.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  group.add(chair);

  const hemi = new THREE.HemisphereLight("#ffd6a8", "#21150f", 0.82);
  group.add(hemi);
  const key = new THREE.DirectionalLight("#ffd2a1", 2.4);
  key.position.set(-7, 10, 7);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 36;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.025;
  group.add(key, key.target);
  const windowLight = new THREE.PointLight("#ffba76", 30, 18, 2);
  windowLight.position.set(11.4, 4.8, 0);
  group.add(windowLight);
  const fill = new THREE.PointLight("#6f8caf", 8, 18, 2);
  fill.position.set(-6, 4, -7);
  group.add(fill);

  const tableGlow = new THREE.PointLight("#ffb16d", 13, 16, 2);
  tableGlow.position.set(0, 4.2, 4.8);
  group.add(tableGlow);

  return { group, key, lampLights, exposure: 1.08, background: new THREE.Color("#110c08"), fog: "#1c130d", fogNear: 20, fogFar: 48, envIntensity: 0.42 };
}

function makeLeafMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
}

function buildForest(materials, lowDetail) {
  const group = new THREE.Group();
  group.name = "Forest nature";
  const groundMaterial = new THREE.MeshStandardMaterial({
    map: makeForestGroundTexture(),
    color: "#d4d7b0",
    roughness: 1,
  });
  const grassMaterial = new THREE.MeshStandardMaterial({ color: "#526b38", roughness: 1 });
  const barkMaterial = woodVariant(materials.frame, "#3e2a1c", 3, 8);
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: "#6f7469", roughness: 0.96 });
  const tableWood = woodVariant(materials.frame, "#5b3821", 3, 2);
  const leafMaterials = ["#42613a", "#547543", "#355332", "#6b8b4b"].map(makeLeafMaterial);

  const ground = mesh(new THREE.PlaneGeometry(70, 70), groundMaterial, [0, -2.5, 0]);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(54, 32, 18),
    new THREE.MeshBasicMaterial({ map: makeForestSkyTexture(), side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  sky.position.y = 6;
  sky.renderOrder = -2;
  group.add(sky);

  // Rustic slab table over stone supports.
  const table = box(13.2, 0.38, 10.4, tableWood, 0, -0.55, 0, 0.16, 4);
  table.castShadow = true;
  table.receiveShadow = true;
  group.add(table);
  for (const x of [-4.7, 4.7]) {
    group.add(box(0.8, 1.7, 1.4, stoneMaterial, x, -1.65, 0.6, 0.16));
  }
  group.add(box(2.6, 0.16, 1.8, grassMaterial, -5.4, -0.34, -4.1, 0.04));
  group.add(box(2.0, 0.14, 1.4, grassMaterial, 5.2, -0.35, 3.7, 0.04));

  const treeCount = lowDetail ? 7 : 13;
  const treePositions = [];
  for (let i = 0; i < treeCount; i += 1) {
    const angle = (i / treeCount) * Math.PI * 2 + (i % 3) * 0.14;
    const radius = 10 + ((i * 7) % 8);
    treePositions.push({ x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, h: 5.5 + (i % 4) * 1.15 });
  }
  for (const [index, tree] of treePositions.entries()) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tree.x, -2.4, tree.z);
    treeGroup.rotation.y = index * 1.7;
    const trunk = mesh(new THREE.CylinderGeometry(0.34, 0.65, tree.h, 9), barkMaterial, [0, tree.h / 2, 0]);
    trunk.castShadow = index < 4;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    for (let i = 0; i < 3; i += 1) {
      const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + ((i + index) % 3) * 0.32, 1), leafMaterials[(i + index) % leafMaterials.length]);
      foliage.position.set(Math.cos(i * 2.1 + index) * 1.45, tree.h - 0.45 + i * 0.72, Math.sin(i * 2.1 + index) * 1.45);
      foliage.scale.y = 1.1;
      foliage.castShadow = index < 3 && i < 2;
      treeGroup.add(foliage);
    }
    group.add(treeGroup);
  }

  // Ferns, stones and grass tufts close to the table.
  const fernMaterial = new THREE.MeshStandardMaterial({ color: "#496d3c", roughness: 0.92, side: THREE.DoubleSide });
  for (let i = 0; i < (lowDetail ? 18 : 38); i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 7 + Math.random() * 10;
    const fern = new THREE.Group();
    fern.position.set(Math.cos(angle) * radius, -2.43, Math.sin(angle) * radius);
    for (let j = 0; j < 4; j += 1) {
      const blade = mesh(new THREE.ConeGeometry(0.13, 0.7 + Math.random() * 0.5, 4), fernMaterial, [Math.cos(j * 1.8) * 0.24, 0.3, Math.sin(j * 1.8) * 0.24]);
      blade.rotation.z = Math.cos(j) * 0.5;
      fern.add(blade);
    }
    group.add(fern);
  }
  for (let i = 0; i < (lowDetail ? 7 : 15); i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 7.5 + Math.random() * 11;
    const rock = mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.65, 0), stoneMaterial, [Math.cos(angle) * radius, -2.15, Math.sin(angle) * radius]);
    rock.scale.y = 0.6;
    rock.castShadow = i < 4;
    rock.receiveShadow = true;
    group.add(rock);
  }

  const hemi = new THREE.HemisphereLight("#e5f2ff", "#33422b", 1.12);
  group.add(hemi);
  const sun = new THREE.DirectionalLight("#fff0be", 3.35);
  sun.position.set(-10, 16, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 55;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  group.add(sun);
  const rim = new THREE.PointLight("#a6df94", 8, 22, 2);
  rim.position.set(9, 4, -8);
  group.add(rim);

  return { group, sun, exposure: 1.18, background: new THREE.Color("#a7bfb7"), fog: "#aabfb4", fogNear: 18, fogFar: 58, envIntensity: 0.35 };
}

function buildRoyal(materials, lowDetail) {
  const group = new THREE.Group();
  group.name = "Dark royal room";
  const floorWood = woodVariant(materials.frame, "#24140f", 10, 10);
  const wallWood = woodVariant(materials.frame, "#2e1b14", 4, 2);
  const tableWood = woodVariant(materials.frame, "#3c2317", 4, 3);
  const gold = new THREE.MeshStandardMaterial({ color: "#b28b4f", metalness: 0.82, roughness: 0.28 });
  const velvet = new THREE.MeshStandardMaterial({ color: "#4a1419", roughness: 0.9, side: THREE.DoubleSide });
  const marble = new THREE.MeshStandardMaterial({ color: "#38302f", roughness: 0.52, metalness: 0.05 });
  const brass = materials.brass;

  const floor = mesh(new THREE.PlaneGeometry(ROOM * 2.4, ROOM * 2.4), floorWood, [0, -2.3, 0]);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  const rug = box(17, 0.035, 12.5, velvet, 0, -2.25, 0, 0.02);
  rug.receiveShadow = true;
  group.add(rug);
  for (const [w, d, x, z] of [[16.4, 0.04, 0, 6.5], [16.4, 0.04, 0, -6.5], [0.04, 11.9, -8.1, 0], [0.04, 11.9, 8.1, 0]]) {
    group.add(box(w, 0.02, d, gold, x, -2.22, z, 0.01));
  }

  const table = box(14.2, 0.5, 11.2, tableWood, 0, -0.59, 0, 0.16, 4);
  table.castShadow = true;
  table.receiveShadow = true;
  group.add(table);
  for (const x of [-5.4, 5.4]) for (const z of [-4.2, 4.2]) group.add(box(0.6, 2.0, 0.6, tableWood, x, -1.62, z, 0.08));

  for (const z of [-ROOM, ROOM]) {
    group.add(box(ROOM * 2, 13, 0.36, wallWood, 0, 3.9, z, 0.02));
    for (const x of [-10.5, -5.25, 0, 5.25, 10.5]) {
      group.add(box(3.2, 5.8, 0.2, marble, x, 0.2, z + (z < 0 ? 0.25 : -0.25), 0.06));
      group.add(box(0.08, 5.3, 0.08, gold, x - 1.55, 0.2, z + (z < 0 ? 0.38 : -0.38), 0.01));
    }
  }
  for (const x of [-ROOM, ROOM]) {
    group.add(box(0.36, 13, ROOM * 2, wallWood, x, 3.9, 0, 0.02));
  }

  // Heavy drapes and a gold valance behind the board.
  for (const x of [-10.6, 10.6]) {
    const drape = box(1.8, 8.4, 0.45, velvet, x, 1.9, -12.6, 0.08);
    group.add(drape);
    for (let i = 0; i < 4; i += 1) {
      group.add(box(0.16, 8.0, 0.5, new THREE.MeshStandardMaterial({ color: "#5b1b20", roughness: 0.9 }), x - 0.7 + i * 0.46, 1.9, -12.35, 0.04));
    }
  }
  group.add(box(23.5, 0.35, 0.7, gold, 0, 6.2, -12.4, 0.04));

  // Throne silhouette on the back wall.
  const throne = new THREE.Group();
  throne.position.set(0, -2.2, -10.1);
  throne.add(box(4.1, 5.8, 0.7, velvet, 0, 3.0, 0, 0.15));
  throne.add(box(3.7, 4.8, 0.3, gold, 0, 3.2, 0.42, 0.06));
  throne.add(box(3.5, 4.55, 0.32, velvet, 0, 3.2, 0.58, 0.04));
  for (const x of [-2.1, 2.1]) throne.add(box(0.25, 5.4, 0.35, gold, x, 2.8, 0.5, 0.04));
  throne.add(box(4.7, 0.45, 1.6, velvet, 0, 0.3, 0.7, 0.12));
  group.add(throne);

  // Candelabra and a central chandelier.
  const candleMaterial = new THREE.MeshStandardMaterial({ color: "#efd39e", emissive: "#ff9e47", emissiveIntensity: 0.6 });
  const candleLights = [];
  for (const [x, z] of [[-5.6, -3.7], [5.6, -3.7]]) {
    const stand = new THREE.Group();
    stand.position.set(x, -0.25, z);
    stand.add(mesh(new THREE.CylinderGeometry(0.38, 0.5, 0.14, 24), gold, [0, 0.06, 0]));
    stand.add(mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.5, 16), gold, [0, 1.25, 0]));
    for (const dx of [-0.6, 0, 0.6]) {
      const candle = mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.66, 12), candleMaterial, [dx, 2.55, 0]);
      stand.add(candle);
      const flame = new THREE.PointLight("#ff9f52", 5.2, 7, 2);
      flame.position.set(dx, 2.95, 0);
      stand.add(flame);
      candleLights.push({ light: flame, phase: Math.random() * 10 });
    }
    group.add(stand);
  }

  const chandelier = new THREE.Group();
  chandelier.position.set(0, 6.7, -3.0);
  chandelier.add(mesh(new THREE.TorusGeometry(1.5, 0.055, 8, 48), gold));
  chandelier.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.0, 12), gold, [0, 1.0, 0]));
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2;
    const candle = mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.56, 10), candleMaterial, [Math.cos(a) * 1.35, 0.3, Math.sin(a) * 1.35]);
    chandelier.add(candle);
  }
  const chandelierLight = new THREE.PointLight("#ffad66", 38, 22, 2);
  chandelierLight.position.set(0, 0.1, 0);
  chandelier.add(chandelierLight);
  candleLights.push({ light: chandelierLight, phase: 2 });
  group.add(chandelier);

  const hemi = new THREE.HemisphereLight("#525b82", "#160e0d", 0.32);
  group.add(hemi);
  const spot = new THREE.SpotLight("#ffd0a0", 110, 34, Math.PI / 5.5, 0.55, 2);
  spot.position.set(-5.5, 13, 7);
  spot.target.position.set(0, -0.2, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.camera.near = 2;
  spot.shadow.camera.far = 35;
  spot.shadow.bias = -0.0006;
  group.add(spot, spot.target);
  const goldWash = new THREE.PointLight("#c88d4b", 11, 18, 2);
  goldWash.position.set(5.5, 3.2, -9);
  group.add(goldWash);

  return { group, spot, exposure: 0.98, background: new THREE.Color("#090607"), fog: "#120b0d", fogNear: 16, fogFar: 44, envIntensity: 0.38, candleLights };
}

export function createEnvironments(scene, materials, renderer, { lowDetail = false } = {}) {
  const groups = {
    study: buildStudy(materials, lowDetail),
    forest: buildForest(materials, lowDetail),
    royal: buildRoyal(materials, lowDetail),
  };
  for (const preset of Object.values(groups)) {
    preset.group.visible = false;
    scene.add(preset.group);
  }
  let current = "study";
  let elapsed = 0;

  function applyTheme(key) {
    if (!groups[key]) return current;
    for (const [name, preset] of Object.entries(groups)) preset.group.visible = name === key;
    const preset = groups[key];
    scene.background = preset.background.clone();
    if (scene.fog) {
      scene.fog.color.set(preset.fog);
      scene.fog.near = preset.fogNear;
      scene.fog.far = preset.fogFar;
    }
    renderer.toneMappingExposure = preset.exposure;
    scene.environmentIntensity = preset.envIntensity;
    current = key;
    return current;
  }

  function update(dt) {
    elapsed += dt;
    const study = groups.study;
    for (const lamp of study.lampLights) {
      lamp.light.intensity = 12.5 + Math.sin(elapsed * 4.2 + lamp.phase) * 0.7;
    }
    const royal = groups.royal;
    for (const light of royal.candleLights) {
      light.light.intensity = (light.light === royal.candleLights[royal.candleLights.length - 1].light ? 36 : 4.7) + Math.sin(elapsed * 6 + light.phase) * 0.7;
    }
    if (groups.forest.group.visible) {
      void elapsed;
    }
  }

  applyTheme("study");
  return {
    groups,
    applyTheme,
    update,
    get current() {
      return current;
    },
    dispose() {
      for (const preset of Object.values(groups)) {
        scene.remove(preset.group);
      }
    },
  };
}

