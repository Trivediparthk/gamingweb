import { THREE, makeGlowTexture, rand, randInt, clamp, lerp } from "../three-kit.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const LANE_X = [-2.2, 0, 2.2];
const SECTION_COUNT = 8;
const SECTION_LENGTH = 24;
const SECTION_SPAN = SECTION_COUNT * SECTION_LENGTH;
const TRACK_WIDTH = 10.4;
const SLAB_LANES = [-3.05, 0, 3.05];
const QUALITY_INDEX = { low: 0, medium: 1, high: 2 };
const ZONE_SEQUENCE = ["jungle", "temple", "bridge", "tunnel", "courtyard", "jungle", "temple", "bridge"];

const ZONE_ATMOSPHERE = {
  jungle: { fogColor: "#0b1f22", fogNear: 18, fogFar: 135, sunColor: "#9bc0ff", sunIntensity: 1.35, hemiIntensity: 0.32, exposure: 0.95 },
  temple: { fogColor: "#122026", fogNear: 16, fogFar: 145, sunColor: "#b4cbff", sunIntensity: 1.55, hemiIntensity: 0.3, exposure: 0.98 },
  bridge: { fogColor: "#0a2028", fogNear: 12, fogFar: 112, sunColor: "#c3d7ff", sunIntensity: 1.8, hemiIntensity: 0.34, exposure: 0.95 },
  tunnel: { fogColor: "#070908", fogNear: 4, fogFar: 46, sunColor: "#ff9a58", sunIntensity: 0.22, hemiIntensity: 0.16, exposure: 0.9 },
  courtyard: { fogColor: "#132226", fogNear: 17, fogFar: 145, sunColor: "#c4d6ff", sunIntensity: 1.7, hemiIntensity: 0.34, exposure: 1.0 },
};

const FOREST = {
  trees: ["Tree_1_A_Color1", "Tree_1_B_Color1", "Tree_2_A_Color1", "Tree_2_C_Color1", "Tree_3_A_Color1", "Tree_4_A_Color1", "Tree_Bare_1_A_Color1"],
  bushes: ["Bush_1_A_Color1", "Bush_1_D_Color1", "Bush_2_A_Color1", "Bush_3_A_Color1", "Bush_4_A_Color1"],
  rocks: ["Rock_1_A_Color1", "Rock_1_E_Color1", "Rock_2_A_Color1", "Rock_3_A_Color1", "Rock_3_M_Color1"],
  grass: ["Grass_1_A_Color1", "Grass_1_C_Color1", "Grass_2_A_Color1", "Grass_2_C_Color1"],
};

function texClone(texture, repeatX = 1, repeatY = 1, srgb = false) {
  const copy = texture.clone();
  copy.wrapS = THREE.RepeatWrapping;
  copy.wrapT = THREE.RepeatWrapping;
  copy.repeat.set(repeatX, repeatY);
  copy.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  copy.needsUpdate = true;
  return copy;
}

function makeRuneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 128);
  ctx.strokeStyle = "rgba(255,205,105,0.95)";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#ffb347";
  ctx.shadowBlur = 16;
  for (let g = 0; g < 4; g += 1) {
    const ox = 20 + g * 124;
    ctx.beginPath();
    ctx.moveTo(ox, 30);
    ctx.lineTo(ox + 26, 64);
    ctx.lineTo(ox + 4, 98);
    ctx.lineTo(ox + 34, 98);
    ctx.lineTo(ox + 52, 64);
    ctx.lineTo(ox + 30, 30);
    ctx.lineTo(ox + 10, 64);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeWaterNormal() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const nx = Math.sin(x * 0.11 + y * 0.04) * 0.35 + Math.sin(y * 0.17 - x * 0.03) * 0.25;
      const ny = Math.cos(y * 0.13 - x * 0.06) * 0.35 + Math.cos(x * 0.08 + y * 0.02) * 0.22;
      const i = (y * 256 + x) * 4;
      image.data[i] = 128 + nx * 110;
      image.data[i + 1] = 128 + ny * 110;
      image.data[i + 2] = 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function makeWaterfallTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, "rgba(210,245,255,0.95)");
  base.addColorStop(0.5, "rgba(130,200,220,0.8)");
  base.addColorStop(1, "rgba(220,250,255,0.4)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * 256;
    const w = 1 + Math.random() * 5;
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.4})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, Math.random() * 200);
    ctx.lineTo(x + rand(-10, 10), 300 + Math.random() * 212);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

function makeRuneMesh(material, geometry) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.025;
  mesh.renderOrder = 2;
  return mesh;
}

export function createEnvironment(scene, assets, initialQuality = "medium", applyAtmosphere = () => {}) {
  let quality = initialQuality;
  let qualityIndex = QUALITY_INDEX[quality] ?? 1;
  let time = 0;
  let currentZone = "";
  let disposed = false;

  const pbr = assets.textures;
  const pathMaps = {
    map: texClone(pbr.cobbleDiffuse, 1, 1, true),
    normalMap: texClone(pbr.cobbleNormal, 1, 1),
    roughnessMap: texClone(pbr.cobbleRoughness, 1, 1),
    aoMap: texClone(pbr.cobbleAO, 1, 1),
  };
  const baseMaps = {
    map: texClone(pbr.cobbleDiffuse, 3, 34, true),
    normalMap: texClone(pbr.cobbleNormal, 3, 34),
    roughnessMap: texClone(pbr.cobbleRoughness, 3, 34),
    aoMap: texClone(pbr.cobbleAO, 3, 34),
  };
  const curbMaps = {
    map: texClone(pbr.cobbleDiffuse, 1, 8, true),
    normalMap: texClone(pbr.cobbleNormal, 1, 8),
    roughnessMap: texClone(pbr.cobbleRoughness, 1, 8),
    aoMap: texClone(pbr.cobbleAO, 1, 8),
  };
  const grassMaps = {
    map: texClone(pbr.grassDiffuse, 4, 4, true),
    normalMap: texClone(pbr.grassNormal, 4, 4),
    roughnessMap: texClone(pbr.grassRoughness, 4, 4),
    aoMap: texClone(pbr.grassAO, 4, 4),
  };
  const rockMaps = {
    map: texClone(pbr.rockDiffuse, 2, 2, true),
    normalMap: texClone(pbr.rockNormal, 2, 2),
    roughnessMap: texClone(pbr.rockRoughness, 2, 2),
    aoMap: texClone(pbr.rockAO, 2, 2),
  };

  const pathMat = new THREE.MeshStandardMaterial({
    ...pathMaps,
    roughness: 0.82,
    metalness: 0.03,
    envMapIntensity: 0.95,
    normalScale: new THREE.Vector2(0.9, 0.9),
  });
  const baseMat = new THREE.MeshStandardMaterial({
    ...baseMaps,
    color: "#6d5b48",
    roughness: 1,
    metalness: 0.02,
    envMapIntensity: 0.55,
    normalScale: new THREE.Vector2(0.9, 0.9),
  });
  const curbMat = new THREE.MeshStandardMaterial({
    ...curbMaps,
    roughness: 0.95,
    metalness: 0.02,
    envMapIntensity: 0.55,
  });
  const grassMat = new THREE.MeshStandardMaterial({
    ...grassMaps,
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.5,
    normalScale: new THREE.Vector2(0.7, 0.7),
  });
  const rockMat = new THREE.MeshStandardMaterial({
    ...rockMaps,
    color: "#8d8172",
    roughness: 0.98,
    metalness: 0.01,
    envMapIntensity: 0.5,
    normalScale: new THREE.Vector2(1, 1),
  });
  const mossMat = new THREE.MeshStandardMaterial({
    map: texClone(pbr.grassDiffuse, 2, 8, true),
    color: "#739c55",
    roughness: 1,
    metalness: 0,
  });
  const waterNormal = makeWaterNormal();
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: "#4f9b9a",
    roughness: 0.08,
    metalness: 0.12,
    transparent: true,
    opacity: 0.7,
    envMapIntensity: 1.2,
    normalMap: waterNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    side: THREE.DoubleSide,
  });
  const waterfallTexture = makeWaterfallTexture();
  const waterfallMat = new THREE.MeshBasicMaterial({
    map: waterfallTexture,
    color: "#c9f4ff",
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const runeTexture = makeRuneTexture();

  const runeMaterial = new THREE.MeshBasicMaterial({
    map: runeTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const materials = [pathMat, baseMat, curbMat, grassMat, rockMat, mossMat, waterMat, waterfallMat, runeMaterial];
  const pathTextures = [...Object.values(pathMaps), ...Object.values(baseMaps), ...Object.values(curbMaps), ...Object.values(grassMaps), ...Object.values(rockMaps), waterNormal, waterfallTexture, runeTexture];

  // Static causeway base
  const baseGeo = new THREE.PlaneGeometry(TRACK_WIDTH + 1.4, 250);
  baseGeo.setAttribute("uv2", baseGeo.attributes.uv);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, -0.16, -88);
  base.receiveShadow = true;
  scene.add(base);

  const laneGeo = new THREE.PlaneGeometry(0.085, 250);
  const laneMat = new THREE.MeshBasicMaterial({
    color: "#5ce8ff",
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  for (const laneX of [-1.1, 1.1]) {
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(laneX, 0.032, -88);
    lane.renderOrder = 1;
    scene.add(lane);
  }

  // Lane slabs
  const slabGeo = new RoundedBoxGeometry(2.88, 0.2, 2.72, 3, 0.07);
  slabGeo.setAttribute("uv2", slabGeo.attributes.uv);

  const curbGeo = new RoundedBoxGeometry(0.5, 0.34, 24.1, 3, 0.06);
  curbGeo.setAttribute("uv2", curbGeo.attributes.uv);
  const mossGeo = new RoundedBoxGeometry(0.38, 0.04, 24.05, 2, 0.02);
  const lintelGeo = new RoundedBoxGeometry(11.8, 0.6, 0.9, 3, 0.12);
  lintelGeo.setAttribute("uv2", lintelGeo.attributes.uv);
  const ceilingGeo = new RoundedBoxGeometry(11.6, 0.5, 24.1, 2, 0.08);
  ceilingGeo.setAttribute("uv2", ceilingGeo.attributes.uv);
  const postGeo = new RoundedBoxGeometry(0.5, 2.2, 0.5, 2, 0.06);
  const waterGeo = new THREE.PlaneGeometry(34, 26);
  const waterfallGeo = new THREE.PlaneGeometry(7, 9);
  const fallBaseGeo = new THREE.PlaneGeometry(9, 2.5);
  const sheenGeo = new THREE.PlaneGeometry(6.5, 3.4);
  const puddleGeo = new THREE.PlaneGeometry(1, 1);
  const runeGeo = new THREE.PlaneGeometry(2.8, 0.7);

  const sections = [];
  const dustCount = 720;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustBase = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    const x = rand(-14, 14);
    const y = rand(0.3, 10);
    const z = rand(-140, 24);
    dustPositions[i * 3] = x;
    dustPositions[i * 3 + 1] = y;
    dustPositions[i * 3 + 2] = z;
    dustBase[i * 3] = x;
    dustBase[i * 3 + 1] = y;
    dustBase[i * 3 + 2] = z;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: "#ffe4b0",
    size: 0.11,
    map: makeGlowTexture("#ffe6b8", "rgba(255,230,184,0)"),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  const fireflyCount = 160;
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflyBase = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i += 1) {
    const x = rand(-12, 12);
    const y = rand(0.6, 6);
    const z = rand(-120, 12);
    fireflyPositions[i * 3] = x;
    fireflyPositions[i * 3 + 1] = y;
    fireflyPositions[i * 3 + 2] = z;
    fireflyBase[i * 3] = x;
    fireflyBase[i * 3 + 1] = y;
    fireflyBase[i * 3 + 2] = z;
  }
  const fireflyGeo = new THREE.BufferGeometry();
  fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
  const fireflyMat = new THREE.PointsMaterial({
    color: "#d8ff7a",
    size: 0.16,
    map: makeGlowTexture("#d8ff7a", "rgba(216,255,122,0)"),
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  fireflies.frustumCulled = false;
  scene.add(fireflies);

  const mistTexture = makeGlowTexture("#d8f4ff", "rgba(216,244,255,0)");
  const mistSprites = [];
  for (let i = 0; i < 16; i += 1) {
    const mat = new THREE.SpriteMaterial({
      map: mistTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    scene.add(sprite);
    mistSprites.push({ sprite, phase: rand(0, Math.PI * 2), section: null });
  }

  let randomPropCursor = 0;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const setShadow = (object, cast, receive = true) => {
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = cast;
      child.receiveShadow = receive;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat) return;
        mat.envMapIntensity = 0.8;
        mat.needsUpdate = true;
      });
    });
  };

  const placeProp = (section, source, options) => {
    const { x, y, z, targetHeight, rotationY = rand(0, Math.PI * 2), minQuality = 0, cast = true, sway = false, scale = null } = options;
    const clone = source.clone(true);
    const initial = new THREE.Box3().setFromObject(clone);
    const initialSize = initial.getSize(new THREE.Vector3());
    const factor = scale || (targetHeight ? targetHeight / Math.max(0.001, initialSize.y) : 1);
    clone.scale.multiplyScalar(factor);
    clone.rotation.y = rotationY;
    const box = new THREE.Box3().setFromObject(clone);
    clone.position.set(x, y - box.min.y, z);
    setShadow(clone, cast, true);
    section.propsGroup.add(clone);
    const entry = {
      group: clone,
      minQuality,
      sway: sway ? { baseZ: 0, amp: rand(0.012, 0.032), phase: rand(0, Math.PI * 2) } : null,
    };
    section.props.push(entry);
    if (sway) section.sway.push(entry);
    return clone;
  };

  const addGroundMaterial = (mesh, material) => {
    mesh.material = material;
    mesh.receiveShadow = true;
  };

  const buildSideGround = (section, zone) => {
    const group = section.groundGroup;
    group.traverse((child) => {
      if (child.isMesh) child.geometry.dispose();
    });
    group.clear();
    if (zone === "bridge") {
      group.visible = false;
      return;
    }
    group.visible = true;
    const material = zone === "tunnel" ? rockMat : grassMat;
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(24, 24, 12, 12);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const localX = pos.getX(i);
        const localZ = pos.getZ(i);
        const t = side < 0 ? (12 - localX) / 24 : (localX + 12) / 24;
        const lift = Math.pow(clamp(t, 0, 1), 1.7) * 1.15 + Math.sin(localX * 0.4 + localZ * 0.3) * 0.12;
        pos.setY(i, clamp(lift, 0, 1.4));
      }
      geo.computeVertexNormals();
      geo.setAttribute("uv2", geo.attributes.uv);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(side * 17.2, -0.42, 0);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  };

  const addCurb = (section, zone) => {
    if (zone === "bridge") return;
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(side * 5.32, 0.12, 0);
      curb.castShadow = true;
      curb.receiveShadow = true;
      section.propsGroup.add(curb);
      const moss = new THREE.Mesh(mossGeo, mossMat);
      moss.position.set(side * 5.32, 0.305, 0);
      section.propsGroup.add(moss);
    }
  };

  const addFoliage = (section, zone, options = {}) => {
    const { trees = 2, bushes = 2, rocks = 2, grass = 3 } = options;
    const isStart = section.index === 1;
    for (let i = 0; i < trees; i += 1) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side * rand(isStart ? 8.8 : 8.0, 14.5);
      const z = isStart ? rand(-10.5, -4.2) : rand(-10.5, 10.5);
      const source = assets.forest[pick(FOREST.trees)];
      placeProp(section, source, {
        x,
        y: -0.42,
        z,
        targetHeight: isStart ? rand(5.0, 7.4) : rand(5.4, 8.8),
        minQuality: i < 1 ? 1 : 2,
        sway: true,
        cast: true,
      });
    }
    for (let i = 0; i < bushes; i += 1) {
      const side = Math.random() < 0.5 ? -1 : 1;
      placeProp(section, assets.forest[pick(FOREST.bushes)], {
        x: side * rand(5.6, 11.5),
        y: -0.42,
        z: rand(-10.5, 10.5),
        targetHeight: rand(1.4, 2.8),
        minQuality: i < 1 ? 0 : 1,
        sway: true,
      });
    }
    for (let i = 0; i < rocks; i += 1) {
      const side = Math.random() < 0.5 ? -1 : 1;
      placeProp(section, assets.forest[pick(FOREST.rocks)], {
        x: side * rand(6.0, 13.5),
        y: -0.42,
        z: rand(-10.5, 10.5),
        targetHeight: rand(1.1, 3.2),
        minQuality: i < 1 ? 0 : 1,
      });
    }
    for (let i = 0; i < grass; i += 1) {
      const side = Math.random() < 0.5 ? -1 : 1;
      placeProp(section, assets.forest[pick(FOREST.grass)], {
        x: side * rand(5.5, 10.5),
        y: -0.42,
        z: rand(-10.5, 10.5),
        targetHeight: rand(0.65, 1.2),
        minQuality: 1,
        sway: true,
        cast: false,
      });
    }
  };

  const addTemple = (section) => {
    addCurb(section, "temple");
    addFoliage(section, "temple", { trees: 2, bushes: 2, rocks: 2, grass: 2 });
    const gateZ = -10.7;
    for (const side of [-1, 1]) {
      placeProp(section, assets.dungeon.column, {
        x: side * 7.2,
        y: 0,
        z: -5.2,
        targetHeight: 3.45,
        rotationY: side < 0 ? Math.PI / 2.2 : -Math.PI / 2.2,
        minQuality: 1,
        cast: true,
      });
      if (section.index !== 1) {
        placeProp(section, assets.dungeon.wall_cracked, {
          x: side * 10.2,
          y: 0,
          z: -4,
          targetHeight: 4.5,
          rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
          minQuality: 1,
          cast: true,
        });
      }
      placeProp(section, assets.dungeon.torch_lit, {
        x: side * 5.55,
        y: 0,
        z: -3,
        targetHeight: 1.6,
        minQuality: 0,
        cast: false,
      });
      placeProp(section, assets.dungeon.crates_stacked, {
        x: side * 6.2,
        y: 0,
        z: 6,
        targetHeight: 1.3,
        minQuality: 2,
      });
    }
    // Ruined gate at the far end of the section, opening the view from the start.
    for (const side of [-1, 1]) {
      placeProp(section, assets.dungeon.pillar, {
        x: side * 5.4,
        y: 0,
        z: gateZ,
        targetHeight: 5.9,
        rotationY: 0,
        minQuality: 0,
        cast: true,
      });
      placeProp(section, assets.dungeon.banner_red, {
        x: side * 5.15,
        y: 2.9,
        z: gateZ + 0.15,
        targetHeight: 1.25,
        rotationY: 0,
        minQuality: 2,
        cast: false,
      });
      placeProp(section, assets.dungeon.torch_lit, {
        x: side * 5.0,
        y: 0,
        z: gateZ + 0.8,
        targetHeight: 1.5,
        minQuality: 0,
        cast: false,
      });
      const torchLight = new THREE.PointLight("#ff9a55", 1.7, 9, 2);
      torchLight.position.set(side * 5.0, 1.9, gateZ + 0.8);
      section.propsGroup.add(torchLight);
    }
  };

  const addJungle = (section) => {
    addCurb(section, "jungle");
    addFoliage(section, "jungle", { trees: 4, bushes: 4, rocks: 3, grass: 5 });
    placeProp(section, assets.dungeon.rubble_large, {
      x: -7.5,
      y: -0.42,
      z: rand(-8, 8),
      targetHeight: rand(1.5, 2.6),
      minQuality: 1,
    });
    placeProp(section, assets.dungeon.column, {
      x: 8.5,
      y: -0.42,
      z: rand(-8, 8),
      targetHeight: rand(3.5, 5.5),
      rotationY: rand(0, Math.PI),
      minQuality: 2,
    });
  };

  const addBridge = (section) => {
    // Railings and posts
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i += 1) {
        placeProp(section, assets.dungeon.barrier, {
          x: side * 4.95,
          y: 0.05,
          z: -9.6 + i * 4.8,
          targetHeight: 1.15,
          rotationY: Math.PI / 2,
          minQuality: 0,
          cast: true,
        });
        placeProp(section, assets.dungeon.column, {
          x: side * 5.05,
          y: 0,
          z: -10 + i * 5,
          targetHeight: 1.9,
          minQuality: 1,
          cast: true,
        });
      }
      placeProp(section, assets.dungeon.torch_lit, {
        x: side * 4.8,
        y: 0.05,
        z: -4,
        targetHeight: 1.4,
        minQuality: 1,
        cast: false,
      });
    }

    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -2.55, 0);
    water.receiveShadow = true;
    section.propsGroup.add(water);

    const fallSide = Math.random() < 0.5 ? -1 : 1;
    const fall = new THREE.Mesh(waterfallGeo, waterfallMat);
    fall.rotation.y = fallSide < 0 ? Math.PI / 2 : -Math.PI / 2;
    fall.position.set(fallSide * 9.5, 1.4, 0);
    section.propsGroup.add(fall);
    const fallBase = new THREE.Mesh(fallBaseGeo, waterMat);
    fallBase.rotation.x = -Math.PI / 2;
    fallBase.position.set(fallSide * 8.5, -2.5, 0);
    section.propsGroup.add(fallBase);

    // Cliff framing
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        placeProp(section, assets.forest[pick(FOREST.rocks)], {
          x: side * rand(11, 18),
          y: -2.8,
          z: rand(-11, 11),
          targetHeight: rand(4, 9),
          minQuality: i === 0 ? 0 : 1,
          cast: true,
        });
      }
      placeProp(section, assets.forest.Tree_2_C_Color1, {
        x: side * rand(13, 18),
        y: -2.8,
        z: rand(-10, 10),
        targetHeight: rand(6, 9),
        minQuality: 2,
        sway: true,
      });
      placeProp(section, assets.dungeon.pillar, {
        x: side * 4.1,
        y: -2.6,
        z: rand(-8, 8),
        targetHeight: rand(4, 6),
        minQuality: 1,
        cast: true,
      });
    }

    const mist = mistSprites[section.index % mistSprites.length];
    if (mist) {
      mist.section = section;
      mist.sprite.position.set(fallSide * 8.2, 0.8, 0);
      mist.sprite.visible = true;
      mist.sprite.scale.set(8, 6, 1);
      mist.sprite.material.opacity = 0.16;
      section.propsGroup.add(mist.sprite);
    }

    // Puddle/sheen on the bridge deck
    const sheen = new THREE.Mesh(sheenGeo, waterMat);
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.set(rand(-1, 1), 0.018, rand(-8, 8));
    section.propsGroup.add(sheen);
  };

  const addTunnel = (section) => {
    addCurb(section, "tunnel");
    for (const side of [-1, 1]) {
      for (const z of [-9, -3, 3, 9]) {
        placeProp(section, assets.dungeon.wall, {
          x: side * 5.65,
          y: 0,
          z,
          targetHeight: 5.4,
          rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
          minQuality: 0,
          cast: true,
        });
      }
      placeProp(section, assets.dungeon.torch_lit, {
        x: side * 4.9,
        y: 0,
        z: -5,
        targetHeight: 1.5,
        minQuality: 0,
        cast: false,
      });
      placeProp(section, assets.dungeon.banner_patternC_blue, {
        x: side * 5.35,
        y: 2.8,
        z: 6,
        targetHeight: 2.4,
        rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
        minQuality: 1,
        cast: false,
      });
      placeProp(section, assets.dungeon.rubble_half, {
        x: side * rand(6, 8),
        y: 0.05,
        z: rand(-8, 8),
        targetHeight: rand(0.8, 1.8),
        minQuality: 2,
      });
    }
    const ceiling = new THREE.Mesh(ceilingGeo, rockMat);
    ceiling.position.set(0, 5.5, 0);
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    section.propsGroup.add(ceiling);
  };

  const addCourtyard = (section) => {
    addCurb(section, "courtyard");
    addFoliage(section, "courtyard", { trees: 2, bushes: 2, rocks: 1, grass: 3 });
    for (const side of [-1, 1]) {
      for (const z of [-8, 0, 8]) {
        placeProp(section, assets.dungeon.column, {
          x: side * 6.4,
          y: 0,
          z,
          targetHeight: 5.4,
          minQuality: 0,
          cast: true,
        });
      }
      placeProp(section, assets.dungeon.wall_broken, {
        x: side * 9.6,
        y: 0,
        z: 2,
        targetHeight: 4.2,
        rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
        minQuality: 1,
        cast: true,
      });
      placeProp(section, assets.dungeon.chest_gold, {
        x: side * 6.0,
        y: 0,
        z: 5.5,
        targetHeight: 0.9,
        minQuality: 1,
      });
      placeProp(section, assets.dungeon.barrel_large, {
        x: side * 6.8,
        y: 0,
        z: -4,
        targetHeight: 1.0,
        minQuality: 2,
      });
    }
    placeProp(section, assets.dungeon.pillar_decorated, {
      x: 5.5,
      y: 0,
      z: -11.5,
      targetHeight: 6.5,
      minQuality: 2,
    });
  };

  const builders = { jungle: addJungle, temple: addTemple, bridge: addBridge, tunnel: addTunnel, courtyard: addCourtyard };

  const buildSection = (section, zone) => {
    section.props.forEach((entry) => entry.group.removeFromParent());
    section.props.length = 0;
    section.sway.length = 0;
    section.zone = zone;
    section.propsGroup.clear();
    section.propsGroup.position.set(0, 0, 0);
    buildSideGround(section, zone);
    builders[zone](section);
    applyPropQuality(section);
    // Rune strip
    if (zone !== "bridge" && zone !== "tunnel") {
      const rune = makeRuneMesh(runeMaterial, runeGeo);
      rune.position.set(0, 0.028, 0);
      section.propsGroup.add(rune);
    }
    // Path detailing: occasional puddle
    if (quality !== "low" && zone !== "bridge" && Math.random() < 0.45) {
      const puddle = new THREE.Mesh(puddleGeo, waterMat);
      puddle.scale.set(rand(1.1, 2.2), rand(0.8, 1.6), 1);
      puddle.rotation.x = -Math.PI / 2;
      puddle.rotation.z = rand(0, Math.PI);
      puddle.position.set(LANE_X[randInt(0, 2)] + rand(-0.5, 0.5), 0.022, rand(-8, 8));
      puddle.renderOrder = 1;
      section.propsGroup.add(puddle);
    }
  };

  const applyPropQuality = (section) => {
    section.props.forEach((entry) => {
      entry.group.visible = entry.minQuality <= qualityIndex;
    });
  };

  // Sections
  for (let i = 0; i < SECTION_COUNT; i += 1) {
    const group = new THREE.Group();
    group.position.z = 24 - i * SECTION_LENGTH;
    scene.add(group);
    const groundGroup = new THREE.Group();
    group.add(groundGroup);
    const propsGroup = new THREE.Group();
    group.add(propsGroup);

    const slabs = new THREE.InstancedMesh(slabGeo, pathMat, SLAB_LANES.length * 8);
    slabs.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    slabs.castShadow = true;
    slabs.receiveShadow = true;
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    let index = 0;
    for (let row = 0; row < 8; row += 1) {
      for (let lane = 0; lane < SLAB_LANES.length; lane += 1) {
        dummy.position.set(SLAB_LANES[lane] + rand(-0.025, 0.025), -0.1 + rand(-0.012, 0.012), -10.5 + row * 3);
        dummy.rotation.y = rand(-0.012, 0.012);
        dummy.updateMatrix();
        slabs.setMatrixAt(index, dummy.matrix);
        const value = rand(0.84, 1.06);
        tint.setRGB(value, value * rand(0.96, 1.02), value * rand(0.9, 1));
        slabs.setColorAt(index, tint);
        index += 1;
      }
    }
    slabs.instanceMatrix.needsUpdate = true;
    if (slabs.instanceColor) slabs.instanceColor.needsUpdate = true;
    group.add(slabs);

    sections.push({
      index: i,
      group,
      groundGroup,
      propsGroup,
      props: [],
      sway: [],
      zone: ZONE_SEQUENCE[i % ZONE_SEQUENCE.length],
      slabs,
    });
  }

  const applyQuality = (value) => {
    quality = value;
    qualityIndex = QUALITY_INDEX[value] ?? 1;
    sections.forEach(applyPropQuality);
    dustGeo.setDrawRange(0, value === "high" ? dustCount : value === "medium" ? 500 : 260);
    fireflies.visible = value !== "low";
    fireflyGeo.setDrawRange(0, value === "high" ? fireflyCount : 90);
    mistSprites.forEach((mist) => {
      if (value === "low") mist.sprite.visible = false;
    });
  };

  let lastZone = "";
  const update = (dt, speed) => {
    if (disposed) return;
    time += dt;
    const moved = speed * dt;
    baseMaps.map.offset.y += moved * 0.045;
    baseMaps.normalMap.offset.y += moved * 0.045;
    baseMaps.roughnessMap.offset.y += moved * 0.045;
    waterNormal.offset.y += dt * 0.035;
    waterNormal.offset.x += dt * 0.012;
    waterfallTexture.offset.y -= dt * 0.55;

    for (const section of sections) {
      section.group.position.z += moved;
      if (section.group.position.z > 38) {
        section.group.position.z -= SECTION_SPAN;
        buildSection(section, section.zone);
      }
      for (const entry of section.sway) {
        if (!entry.group.visible) continue;
        entry.group.rotation.z = (entry.sway?.baseZ || 0) + Math.sin(time * 1.15 + (entry.sway?.phase || 0)) * (entry.sway?.amp || 0);
      }
    }

    // Atmosphere based on the section around the runner.
    let nearest = sections[0];
    let nearestDistance = Infinity;
    for (const section of sections) {
      const d = Math.abs(section.group.position.z);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = section;
      }
    }
    if (nearest.zone !== lastZone) {
      lastZone = nearest.zone;
      applyAtmosphere(ZONE_ATMOSPHERE[nearest.zone]);
      currentZone = nearest.zone;
    }

    // Dust
    const dustDraw = dustGeo.drawRange.count;
    for (let i = 0; i < dustDraw; i += 1) {
      dustPositions[i * 3 + 2] += moved * 0.4;
      dustPositions[i * 3] = dustBase[i * 3] + Math.sin(time * 0.7 + i) * 0.25;
      dustPositions[i * 3 + 1] = dustBase[i * 3 + 1] + Math.sin(time * 1.1 + i) * 0.22;
      if (dustPositions[i * 3 + 2] > 28) {
        dustBase[i * 3] = rand(-14, 14);
        dustBase[i * 3 + 1] = rand(0.3, 10);
        dustPositions[i * 3 + 2] = -140;
      }
    }
    dustGeo.attributes.position.needsUpdate = true;

    if (fireflies.visible) {
      const count = fireflyGeo.drawRange.count;
      for (let i = 0; i < count; i += 1) {
        fireflyPositions[i * 3] = fireflyBase[i * 3] + Math.sin(time * 0.8 + i * 1.3) * 0.8;
        fireflyPositions[i * 3 + 1] = fireflyBase[i * 3 + 1] + Math.sin(time * 1.4 + i) * 0.35;
        fireflyPositions[i * 3 + 2] = fireflyBase[i * 3 + 2];
      }
      fireflyGeo.attributes.position.needsUpdate = true;
    }

    for (const mist of mistSprites) {
      if (!mist.section || mist.section.zone !== "bridge" || quality === "low") {
        mist.sprite.visible = false;
        continue;
      }
      const phase = Math.sin(time * 1.2 + mist.phase);
      mist.sprite.visible = true;
      mist.sprite.material.opacity = 0.12 + phase * 0.04;
      mist.sprite.scale.set(6 + phase * 1.2, 4.5 + phase * 0.8, 1);
    }
    void currentZone;
  };

  const reset = () => {
    time = 0;
    lastZone = "";
    sections.forEach((section, index) => {
      section.group.position.z = 24 - index * SECTION_LENGTH;
      buildSection(section, section.zone);
    });
    baseMaps.map.offset.y = 0;
    baseMaps.normalMap.offset.y = 0;
    baseMaps.roughnessMap.offset.y = 0;
    waterNormal.offset.set(0, 0);
    waterfallTexture.offset.y = 0;
    for (let i = 0; i < dustCount; i += 1) {
      dustBase[i * 3] = rand(-14, 14);
      dustBase[i * 3 + 1] = rand(0.3, 10);
      dustBase[i * 3 + 2] = rand(-140, 24);
      dustPositions[i * 3] = dustBase[i * 3];
      dustPositions[i * 3 + 1] = dustBase[i * 3 + 1];
      dustPositions[i * 3 + 2] = dustBase[i * 3 + 2];
    }
    dustGeo.attributes.position.needsUpdate = true;
    applyQuality(quality);
    const initial = sections[1];
    lastZone = initial.zone;
    currentZone = initial.zone;
    applyAtmosphere(ZONE_ATMOSPHERE[initial.zone]);
  };

  const dispose = () => {
    disposed = true;
    // The scene stage disposes the shared scene resources. Custom arrays are released here.
    sections.length = 0;
    mistSprites.length = 0;
  };

  applyQuality(quality);
  reset();

  return {
    update,
    reset,
    setQuality: applyQuality,
    dispose,
    laneX: LANE_X,
    trackWidth: TRACK_WIDTH,
    groundY: 0,
    get zone() {
      return currentZone;
    },
  };
}
