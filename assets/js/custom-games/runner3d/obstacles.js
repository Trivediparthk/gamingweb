import { THREE, makeGlowTexture, rand, randInt } from "../three-kit.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function createObstacles(scene, assets, laneX, quality) {
  const colliders = {
    low: { yMin: 0, yMax: 1.06, halfW: 0.86, halfD: 0.66 },
    arch: { yMin: 1.0, yMax: 2.7, halfW: 1.2, halfD: 0.43 },
    tall: { yMin: 0, yMax: 3.1, halfW: 0.72, halfD: 0.6 },
    spikes: { yMin: 0, yMax: 0.66, halfW: 0.82, halfD: 0.64 },
    boulder: { yMin: 0, yMax: 2.3, halfW: 1.0, halfD: 1.0 },
  };

  const stoneMaps = {
    map: assets.textures.cobbleDiffuse.clone(),
    normalMap: assets.textures.cobbleNormal.clone(),
    roughnessMap: assets.textures.cobbleRoughness.clone(),
  };
  Object.values(stoneMaps).forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.needsUpdate = true;
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    ...stoneMaps,
    color: "#9a876b",
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.65,
  });

  const prepare = (source, targetHeight) => {
    const group = new THREE.Group();
    const clone = source.clone(true);
    const initial = new THREE.Box3().setFromObject(clone);
    const initialSize = initial.getSize(new THREE.Vector3());
    const factor = targetHeight / Math.max(0.001, initialSize.y);
    clone.scale.multiplyScalar(factor);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= box.min.y;
    clone.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material) material.envMapIntensity = 0.75;
      });
    });
    group.add(clone);
    return group;
  };

  const makeLow = () => prepare(assets.dungeon.crates_stacked, 1.0);
  const makeTall = () => {
    const group = new THREE.Group();
    group.add(prepare(assets.dungeon.pillar_decorated, 2.95));
    const banner = prepare(assets.dungeon.banner_red, 1.5);
    banner.position.set(0, 1.35, 0.42);
    group.add(banner);
    return group;
  };
  const makeSpikes = () => prepare(assets.dungeon.floor_tile_big_spikes, 0.58);
  const makeBoulder = () => prepare(assets.forest.Rock_3_A_Color1, 2.2);
  const makeArch = () => {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const post = prepare(assets.dungeon.pillar, 2.3);
      post.position.set(side * 1.2, 0, 0);
      group.add(post);
      const torch = prepare(assets.dungeon.torch_lit, 1.0);
      torch.position.set(side * 1.32, 1.15, 0.28);
      group.add(torch);
    }
    const lintelGeo = new RoundedBoxGeometry(2.6, 0.4, 0.6, 3, 0.08);
    const lintel = new THREE.Mesh(lintelGeo, stoneMat);
    lintel.position.y = 2.4;
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    group.add(lintel);
    for (const side of [-1, 1]) {
      const banner = prepare(assets.dungeon.banner_patternA_green, 1.35);
      banner.position.set(side * 0.45, 1.12, 0.34);
      group.add(banner);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture("#ffcf6a", "rgba(255,179,71,0)"),
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    glow.position.set(0, 2.4, 0.1);
    glow.scale.set(2.2, 1.1, 1);
    group.add(glow);
    return group;
  };

  const factories = { low: makeLow, arch: makeArch, tall: makeTall, spikes: makeSpikes, boulder: makeBoulder };
  const poolSizes = { low: 10, arch: 8, tall: 8, spikes: 6, boulder: 5 };
  const items = [];
  const pools = {};
  for (const [type, count] of Object.entries(poolSizes)) {
    pools[type] = [];
    for (let i = 0; i < count; i += 1) {
      const group = factories[type]();
      group.visible = false;
      scene.add(group);
      const item = {
        type,
        group,
        active: false,
        lane: 0,
        z: 0,
        collider: colliders[type],
        extraSpeed: type === "boulder" ? rand(2.5, 5.5) : 0,
        spin: rand(1.4, 3.2),
      };
      pools[type].push(item);
      items.push(item);
    }
  }

  const activate = (type, lane, z) => {
    const item = pools[type]?.find((candidate) => !candidate.active);
    if (!item) return null;
    item.active = true;
    item.lane = lane;
    item.z = z;
    item.group.position.set(laneX[lane], 0, z);
    item.group.rotation.set(0, rand(-0.15, 0.15), 0);
    item.group.visible = true;
    return item;
  };

  const deactivate = (item) => {
    if (!item) return;
    item.active = false;
    item.group.visible = false;
    item.group.position.z = 80;
  };

  const spawnPattern = (difficulty, z) => {
    const lanes = [0, 1, 2];
    if (difficulty < 0.3 && Math.random() < 0.45) {
      const lane = randInt(0, 2);
      const early = ["low", "arch", "spikes"];
      const type = early[randInt(0, early.length - 1)];
      if (activate(type, lane, z)) {
        return { freeLanes: lanes.filter((value) => value !== lane), lanesUsed: [lane] };
      }
    }
    const free = randInt(0, 2);
    const used = lanes.filter((lane) => lane !== free);
    const pool = difficulty > 0.55 ? ["low", "arch", "tall", "spikes", "boulder"] : ["low", "arch", "tall", "spikes"];
    const chosen = [];
    const lanePool = [...used];
    for (let i = 0; i < 2 && lanePool.length; i += 1) {
      const lane = lanePool.splice(randInt(0, lanePool.length - 1), 1)[0];
      const type = pool[randInt(0, pool.length - 1)];
      if (activate(type, lane, z + rand(-0.08, 0.08))) chosen.push(lane);
    }
    return { freeLanes: [free], lanesUsed: chosen };
  };

  const update = (moved, dt = 0) => {
    for (const item of items) {
      if (!item.active) continue;
      item.z += moved + item.extraSpeed * dt;
      item.group.position.z = item.z;
      if (item.type === "boulder") {
        item.group.rotation.x += item.spin * dt;
        item.group.rotation.z += item.spin * 0.6 * dt;
      }
      if (item.z > 16) deactivate(item);
    }
  };

  const getActive = () => items.filter((item) => item.active);
  const countActive = () => items.reduce((sum, item) => sum + (item.active ? 1 : 0), 0);
  const reset = () => items.forEach((item) => {
    item.active = false;
    item.group.visible = false;
    item.group.position.z = 80;
  });
  const debugSpawn = (type, lane, z) => activate(type, lane, z);

  return {
    spawnPattern,
    update,
    getActive,
    countActive,
    deactivate,
    reset,
    debugSpawn,
    dispose: () => {
      items.forEach((item) => scene.remove(item.group));
    },
  };
}
