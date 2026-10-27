import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const PIECE_TYPES = ["p", "n", "b", "r", "q", "k"];
export const PIECE_LABELS = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

const V2 = (x, y) => new THREE.Vector2(x, y);

function makeLathe(points, segments = 56) {
  const geometry = new THREE.LatheGeometry(points.map(([x, y]) => V2(x, y)), segments);
  geometry.setAttribute("uv2", geometry.attributes.uv);
  geometry.computeVertexNormals();
  return geometry;
}

function makeTorus(radius, tube = 0.018, segments = 40) {
  const geometry = new THREE.TorusGeometry(radius, tube, 8, segments);
  geometry.setAttribute("uv2", geometry.attributes.uv);
  return geometry;
}

function woodTexture(source, repeatX = 1, repeatY = 1, rotation = 0) {
  if (!source) return null;
  const texture = source.clone();
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.rotation = rotation;
  texture.center.set(0.5, 0.5);
  texture.needsUpdate = true;
  return texture;
}

function physicalWood(maps, { color, repeatX = 1, repeatY = 1, rotation = 0, roughness = 0.4, clearcoat = 0.5, env = 0.95 }) {
  return new THREE.MeshPhysicalMaterial({
    map: woodTexture(maps.diffuse, repeatX, repeatY, rotation),
    normalMap: woodTexture(maps.normal, repeatX, repeatY, rotation),
    roughnessMap: woodTexture(maps.roughness, repeatX, repeatY, rotation),
    aoMap: woodTexture(maps.ao, repeatX, repeatY, rotation),
    color,
    roughness,
    metalness: 0.015,
    clearcoat,
    clearcoatRoughness: 0.24,
    envMapIntensity: env,
    normalScale: new THREE.Vector2(0.38, 0.38),
    aoMapIntensity: 0.65,
  });
}

export function createChessMaterials(wood) {
  const light = physicalWood(wood.maple, { color: "#dfc39f", repeatX: 1.15, repeatY: 1.6, roughness: 0.46, clearcoat: 0.42 });
  const lightAlt = physicalWood(wood.maple, { color: "#d2b38b", repeatX: 1.05, repeatY: 1.4, rotation: 0.2, roughness: 0.5, clearcoat: 0.38 });
  const dark = physicalWood(wood.walnut, { color: "#6a4028", repeatX: 1.1, repeatY: 1.5, roughness: 0.36 });
  const darkAlt = physicalWood(wood.walnut, { color: "#55311f", repeatX: 1.2, repeatY: 1.65, rotation: 0.16, roughness: 0.4 });
  const boardLight = physicalWood(wood.maple, { color: "#f7e7c9", repeatX: 1, repeatY: 1, roughness: 0.32, clearcoat: 0.62, env: 1.05 });
  const boardLightAlt = physicalWood(wood.maple, { color: "#eed7b4", repeatX: 1.1, repeatY: 1, rotation: 0.3, roughness: 0.35, clearcoat: 0.58 });
  const boardDark = physicalWood(wood.walnut, { color: "#603820", repeatX: 1, repeatY: 1, roughness: 0.3, clearcoat: 0.65, env: 1.05 });
  const boardDarkAlt = physicalWood(wood.walnut, { color: "#4f2d1b", repeatX: 1.1, repeatY: 1, rotation: 0.2, roughness: 0.34, clearcoat: 0.6 });
  const frame = physicalWood(wood.walnut, { color: "#47291a", repeatX: 2.1, repeatY: 1, roughness: 0.3, clearcoat: 0.62, env: 1.1 });
  const ebony = new THREE.MeshPhysicalMaterial({
    color: "#15100d",
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: "#b9975b",
    metalness: 0.9,
    roughness: 0.3,
    envMapIntensity: 1.2,
  });
  const felt = new THREE.MeshStandardMaterial({ color: "#1d251b", roughness: 1 });

  return {
    light,
    lightAlt,
    dark,
    darkAlt,
    boardLight,
    boardLightAlt,
    boardDark,
    boardDarkAlt,
    frame,
    ebony,
    brass,
    felt,
  };
}

const geometryCache = new Map();
function cached(key, factory) {
  if (!geometryCache.has(key)) geometryCache.set(key, factory());
  return geometryCache.get(key);
}

function bodyFor(type) {
  return cached(`body-${type}`, () => {
    if (type === "p") {
      return makeLathe([
        [0, 0], [0.26, 0], [0.29, 0.025], [0.29, 0.06], [0.25, 0.085],
        [0.21, 0.12], [0.13, 0.15], [0.11, 0.19], [0.14, 0.24], [0.2, 0.29],
        [0.205, 0.33], [0.17, 0.36], [0.14, 0.39], [0.16, 0.42], [0.18, 0.46],
        [0.155, 0.5], [0.12, 0.54], [0.13, 0.57], [0.17, 0.6], [0.18, 0.63],
        [0.14, 0.66], [0.08, 0.68], [0, 0.69],
      ]);
    }
    if (type === "r") {
      return makeLathe([
        [0, 0], [0.32, 0], [0.35, 0.025], [0.35, 0.065], [0.31, 0.09],
        [0.26, 0.125], [0.225, 0.18], [0.215, 0.25], [0.22, 0.43],
        [0.25, 0.49], [0.29, 0.53], [0.29, 0.57], [0.26, 0.6],
        [0.275, 0.63], [0.32, 0.66], [0.32, 0.7], [0.27, 0.73], [0, 0.73],
      ]);
    }
    if (type === "n") {
      return makeLathe([
        [0, 0], [0.3, 0], [0.33, 0.025], [0.33, 0.06], [0.29, 0.085],
        [0.24, 0.12], [0.19, 0.18], [0.165, 0.24], [0.18, 0.3],
        [0.22, 0.35], [0.21, 0.39], [0.17, 0.42], [0.14, 0.45],
        [0.18, 0.48], [0, 0.5],
      ]);
    }
    if (type === "b") {
      return makeLathe([
        [0, 0], [0.3, 0], [0.33, 0.025], [0.33, 0.065], [0.29, 0.09],
        [0.23, 0.125], [0.18, 0.18], [0.15, 0.25], [0.165, 0.35],
        [0.205, 0.45], [0.20, 0.51], [0.16, 0.56], [0.13, 0.6],
        [0.17, 0.64], [0.22, 0.68], [0.19, 0.72], [0.12, 0.75], [0, 0.76],
      ]);
    }
    if (type === "q") {
      return makeLathe([
        [0, 0], [0.36, 0], [0.39, 0.03], [0.39, 0.075], [0.35, 0.1],
        [0.29, 0.14], [0.22, 0.2], [0.18, 0.28], [0.19, 0.4],
        [0.24, 0.52], [0.22, 0.62], [0.17, 0.68], [0.14, 0.72],
        [0.18, 0.76], [0.23, 0.8], [0.22, 0.84], [0.16, 0.87], [0, 0.88],
      ]);
    }
    return makeLathe([
      [0, 0], [0.38, 0], [0.41, 0.03], [0.41, 0.08], [0.37, 0.105],
      [0.31, 0.145], [0.24, 0.205], [0.195, 0.29], [0.205, 0.41],
      [0.255, 0.54], [0.235, 0.65], [0.18, 0.72], [0.15, 0.77],
      [0.19, 0.81], [0.24, 0.85], [0.22, 0.89], [0.15, 0.92], [0, 0.93],
    ]);
  });
}

const ringCache = {
  base: new Map(),
};
function ring(radius, tube = 0.018) {
  const key = `${radius}-${tube}`;
  if (!ringCache.base.has(key)) ringCache.base.set(key, makeTorus(radius, tube));
  return ringCache.base.get(key);
}

function addMesh(group, geometry, material, position = [0, 0, 0], rotation = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addRing(group, material, radius, y, tube = 0.017) {
  const mesh = addMesh(group, ring(radius, tube), material, [0, y, 0], [Math.PI / 2, 0, 0]);
  return mesh;
}

function knightHeadGeometry() {
  return cached("knight-head", () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.18, 0.28);
    shape.bezierCurveTo(-0.3, 0.42, -0.26, 0.6, -0.23, 0.72);
    shape.lineTo(-0.18, 0.84);
    shape.lineTo(-0.26, 0.92);
    shape.lineTo(-0.17, 0.9);
    shape.lineTo(-0.2, 1.02);
    shape.lineTo(-0.08, 0.95);
    shape.lineTo(-0.055, 1.045);
    shape.lineTo(0.02, 0.94);
    shape.bezierCurveTo(0.1, 0.915, 0.135, 0.84, 0.17, 0.79);
    shape.bezierCurveTo(0.27, 0.755, 0.36, 0.69, 0.395, 0.61);
    shape.bezierCurveTo(0.425, 0.535, 0.36, 0.485, 0.29, 0.505);
    shape.bezierCurveTo(0.22, 0.46, 0.13, 0.435, 0.08, 0.38);
    shape.lineTo(0.055, 0.28);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.27,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      curveSegments: 22,
    });
    geometry.translate(0, 0, -0.135);
    geometry.computeVertexNormals();
    return geometry;
  });
}

function knightManeGeometry() {
  return cached("knight-mane", () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.17, 0.42);
    shape.lineTo(-0.27, 0.51);
    shape.lineTo(-0.19, 0.57);
    shape.lineTo(-0.3, 0.68);
    shape.lineTo(-0.2, 0.73);
    shape.lineTo(-0.29, 0.83);
    shape.lineTo(-0.19, 0.86);
    shape.lineTo(-0.22, 0.96);
    shape.lineTo(-0.13, 0.9);
    shape.lineTo(-0.12, 0.82);
    shape.lineTo(-0.11, 0.54);
    shape.lineTo(-0.12, 0.44);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      curveSegments: 8,
    });
    geometry.translate(0, 0, -0.009);
    return geometry;
  });
}

function knightBridleGeometry() {
  return cached("knight-bridle", () => new THREE.BoxGeometry(0.16, 0.014, 0.018));
}

function kingCrossGeometry() {
  return cached("king-cross", () => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.032, 0);
    shape.lineTo(-0.032, 0.1);
    shape.lineTo(-0.11, 0.1);
    shape.lineTo(-0.11, 0.16);
    shape.lineTo(-0.032, 0.16);
    shape.lineTo(-0.032, 0.3);
    shape.lineTo(0.032, 0.3);
    shape.lineTo(0.032, 0.16);
    shape.lineTo(0.11, 0.16);
    shape.lineTo(0.11, 0.1);
    shape.lineTo(0.032, 0.1);
    shape.lineTo(0.032, 0);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.008,
      bevelThickness: 0.008,
      curveSegments: 8,
    });
    geometry.translate(0, 0, -0.0225);
    return geometry;
  });
}

function crownSpikeGeometry() {
  return cached("crown-spike", () => {
    const geometry = new THREE.ConeGeometry(0.033, 0.16, 5, 1, false);
    geometry.setAttribute("uv2", geometry.attributes.uv);
    return geometry;
  });
}

function rookMerlonGeometry() {
  return cached("rook-merlon", () => {
    const geometry = new RoundedBoxGeometry(0.12, 0.15, 0.16, 2, 0.025);
    geometry.setAttribute("uv2", geometry.attributes.uv);
    return geometry;
  });
}

export function createPiece(type, color, materials) {
  const group = new THREE.Group();
  const bodyMaterial = color === "w" ? materials.light : materials.dark;
  const accentMaterial = color === "w" ? materials.darkAlt : materials.lightAlt;
  const body = addMesh(group, bodyFor(type), bodyMaterial);

  if (type === "p") {
    addRing(group, accentMaterial, 0.235, 0.09, 0.012);
    addRing(group, accentMaterial, 0.165, 0.35, 0.012);
    addRing(group, accentMaterial, 0.13, 0.56, 0.01);
  } else if (type === "r") {
    addRing(group, accentMaterial, 0.285, 0.1, 0.014);
    addRing(group, accentMaterial, 0.255, 0.48, 0.012);
    const merlon = rookMerlonGeometry();
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2;
      addMesh(group, merlon, bodyMaterial, [Math.cos(a) * 0.235, 0.77, Math.sin(a) * 0.235], [0, -a, 0]);
    }
    addRing(group, accentMaterial, 0.29, 0.72, 0.014);
  } else if (type === "n") {
    addRing(group, accentMaterial, 0.27, 0.1, 0.014);
    addRing(group, accentMaterial, 0.18, 0.4, 0.012);
    const head = new THREE.Group();
    const headMesh = addMesh(head, knightHeadGeometry(), bodyMaterial);
    headMesh.castShadow = true;
    addMesh(head, knightManeGeometry(), accentMaterial, [0, 0, 0.138]);
    addMesh(head, knightManeGeometry(), accentMaterial, [0, 0, -0.138]);
    const eyeGeometry = cached("knight-eye", () => new THREE.SphereGeometry(0.024, 12, 8));
    addMesh(head, eyeGeometry, materials.ebony, [0.145, 0.79, 0.139]);
    addMesh(head, eyeGeometry, materials.ebony, [0.145, 0.79, -0.139]);
    const nostril = cached("knight-nostril", () => new THREE.SphereGeometry(0.013, 8, 6));
    addMesh(head, nostril, materials.ebony, [0.35, 0.63, 0.138]);
    addMesh(head, nostril, materials.ebony, [0.35, 0.63, -0.138]);
    addMesh(head, knightBridleGeometry(), materials.ebony, [0.26, 0.58, 0.139], [0, 0, 0.18]);
    addMesh(head, knightBridleGeometry(), materials.ebony, [0.26, 0.58, -0.139], [0, 0, -0.18]);
    head.rotation.y = color === "w" ? 0 : Math.PI;
    group.add(head);
  } else if (type === "b") {
    addRing(group, accentMaterial, 0.26, 0.1, 0.014);
    addRing(group, accentMaterial, 0.18, 0.57, 0.012);
    const mitre = makeLathe([
      [0, 0.74], [0.115, 0.76], [0.145, 0.8], [0.135, 0.86],
      [0.105, 0.92], [0.068, 0.98], [0.035, 1.02], [0, 1.04],
    ], 48);
    addMesh(group, mitre, bodyMaterial);
    addRing(group, accentMaterial, 0.135, 0.78, 0.012);
    const ball = cached("bishop-ball", () => {
      const g = new THREE.SphereGeometry(0.043, 16, 12);
      g.setAttribute("uv2", g.attributes.uv);
      return g;
    });
    addMesh(group, ball, bodyMaterial, [0, 1.075, 0]);
    const slit = cached("bishop-slit", () => new THREE.BoxGeometry(0.011, 0.23, 0.018));
    addMesh(group, slit, materials.ebony, [0.024, 0.9, 0.122], [0.48, 0, 0.5]);
    addMesh(group, slit, materials.ebony, [-0.024, 0.9, -0.122], [0.48, 0, -0.5]);
  } else if (type === "q") {
    addRing(group, accentMaterial, 0.28, 0.1, 0.014);
    addRing(group, accentMaterial, 0.2, 0.69, 0.012);
    addRing(group, bodyMaterial, 0.225, 0.84, 0.024);
    const spike = crownSpikeGeometry();
    const bead = cached("crown-bead", () => {
      const g = new THREE.SphereGeometry(0.028, 12, 8);
      g.setAttribute("uv2", g.attributes.uv);
      return g;
    });
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      addMesh(group, spike, bodyMaterial, [Math.cos(a) * 0.21, 0.96, Math.sin(a) * 0.21]);
      addMesh(group, bead, accentMaterial, [Math.cos(a) * 0.21, 1.045, Math.sin(a) * 0.21]);
    }
    addMesh(group, bead, bodyMaterial, [0, 1.07, 0]);
  } else if (type === "k") {
    addRing(group, accentMaterial, 0.29, 0.1, 0.014);
    addRing(group, accentMaterial, 0.205, 0.73, 0.012);
    addRing(group, bodyMaterial, 0.23, 0.88, 0.025);
    const spike = crownSpikeGeometry();
    const bead = cached("crown-bead", () => {
      const g = new THREE.SphereGeometry(0.028, 12, 8);
      g.setAttribute("uv2", g.attributes.uv);
      return g;
    });
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      addMesh(group, spike, bodyMaterial, [Math.cos(a) * 0.205, 0.99, Math.sin(a) * 0.205]);
      addMesh(group, bead, accentMaterial, [Math.cos(a) * 0.205, 1.075, Math.sin(a) * 0.205]);
    }
    addMesh(group, kingCrossGeometry(), accentMaterial, [0, 1.05, 0]);
  }

  group.userData.pieceType = type;
  group.userData.color = color;
  group.userData.title = `${color === "w" ? "White" : "Black"} ${PIECE_LABELS[type]}`;
  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      object.userData.pieceRoot = group;
    }
  });
  void body;
  return group;
}

function makeCoordinateTexture(labels) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 1024, 96);
  ctx.fillStyle = "rgba(224, 197, 145, 0.78)";
  ctx.font = "600 46px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  labels.forEach((label, index) => {
    ctx.fillText(label, 64 + index * 128, 50);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addCoordinateStrips(group, materials) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const fileTexture = makeCoordinateTexture(files);
  const rankTexture = makeCoordinateTexture(ranks);
  const materialFile = new THREE.MeshBasicMaterial({ map: fileTexture, transparent: true, depthWrite: false });
  const materialRank = new THREE.MeshBasicMaterial({ map: rankTexture, transparent: true, depthWrite: false });
  const geoH = new THREE.PlaneGeometry(8, 0.34);
  const geoV = new THREE.PlaneGeometry(8, 0.34);
  for (const z of [4.17, -4.17]) {
    const strip = new THREE.Mesh(geoH, materialFile);
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = z < 0 ? Math.PI : 0;
    strip.position.set(0, 0.232, z);
    group.add(strip);
  }
  for (const x of [4.17, -4.17]) {
    const strip = new THREE.Mesh(geoV, materialRank);
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = Math.PI / 2;
    strip.position.set(x, 0.232, 0);
    group.add(strip);
  }
  void materials;
}

export function createChessBoard(materials) {
  const group = new THREE.Group();
  group.name = "Chessboard";
  const base = new THREE.Mesh(new RoundedBoxGeometry(9.45, 0.34, 9.45, 4, 0.09), materials.frame);
  base.position.y = -0.17;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const tileGeometry = new RoundedBoxGeometry(0.935, 0.1, 0.935, 3, 0.018);
  const squares = new Map();
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const isLight = (file + rank) % 2 === 1;
      const variant = (file * 3 + rank * 5) % 3;
      const material = isLight
        ? variant === 0 ? materials.boardLightAlt : materials.boardLight
        : variant === 0 ? materials.boardDarkAlt : materials.boardDark;
      const mesh = new THREE.Mesh(tileGeometry, material);
      mesh.position.set(file - 3.5, 0.05, 3.5 - rank);
      mesh.receiveShadow = true;
      const square = `${"abcdefgh"[file]}${rank + 1}`;
      mesh.userData.square = square;
      squares.set(square, mesh);
      group.add(mesh);
    }
  }

  const railGeoH = new RoundedBoxGeometry(9.55, 0.22, 0.52, 3, 0.05);
  const railGeoV = new RoundedBoxGeometry(0.52, 0.22, 9.55, 3, 0.05);
  for (const z of [4.23, -4.23]) {
    const rail = new THREE.Mesh(railGeoH, materials.frame);
    rail.position.set(0, 0.11, z);
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.012, 0.022), materials.brass);
    inlay.position.set(0, 0.226, z * 0.91);
    group.add(inlay);
  }
  for (const x of [4.23, -4.23]) {
    const rail = new THREE.Mesh(railGeoV, materials.frame);
    rail.position.set(x, 0.11, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    group.add(rail);
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 8.2), materials.brass);
    inlay.position.set(x * 0.91, 0.226, 0);
    group.add(inlay);
  }
  addCoordinateStrips(group, materials);
  return { group, squares, topY: 0.1 };
}

export function squareToWorld(square) {
  const file = "abcdefgh".indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  return { x: file - 3.5, z: 3.5 - rank };
}

export function worldToSquare(x, z) {
  const file = Math.round(x + 3.5);
  const rank = Math.round(3.5 - z);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${"abcdefgh"[file]}${rank + 1}`;
}

