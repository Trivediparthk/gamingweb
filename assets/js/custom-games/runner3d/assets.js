import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

const BASE = "/assets/games/ruin-runner";

const FOREST_MODELS = [
  "Tree_1_A_Color1",
  "Tree_1_B_Color1",
  "Tree_2_A_Color1",
  "Tree_2_C_Color1",
  "Tree_3_A_Color1",
  "Tree_4_A_Color1",
  "Tree_Bare_1_A_Color1",
  "Bush_1_A_Color1",
  "Bush_1_D_Color1",
  "Bush_2_A_Color1",
  "Bush_3_A_Color1",
  "Bush_4_A_Color1",
  "Rock_1_A_Color1",
  "Rock_1_E_Color1",
  "Rock_2_A_Color1",
  "Rock_3_A_Color1",
  "Rock_3_M_Color1",
  "Grass_1_A_Color1",
  "Grass_1_C_Color1",
  "Grass_2_A_Color1",
  "Grass_2_C_Color1",
];

const DUNGEON_MODELS = {
  wall: "wall.gltf.glb",
  wall_cracked: "wall_cracked.gltf.glb",
  wall_broken: "wall_broken.gltf.glb",
  wall_archedwindow_open: "wall_archedwindow_open.gltf.glb",
  wall_arched: "wall_arched.gltf.glb",
  wall_doorway: "wall_doorway.glb",
  wall_pillar: "wall_pillar.gltf.glb",
  pillar: "pillar.gltf.glb",
  pillar_decorated: "pillar_decorated.gltf.glb",
  column: "column.gltf.glb",
  stairs_wide: "stairs_wide.gltf.glb",
  floor_tile_large: "floor_tile_large.gltf.glb",
  floor_tile_large_rocks: "floor_tile_large_rocks.gltf.glb",
  floor_tile_big_spikes: "floor_tile_big_spikes.glb",
  torch: "torch.gltf.glb",
  torch_lit: "torch_lit.gltf.glb",
  torch_mounted: "torch_mounted.gltf.glb",
  banner_red: "banner_red.gltf.glb",
  banner_patternA_green: "banner_patternA_green.gltf.glb",
  banner_patternC_blue: "banner_patternC_blue.gltf.glb",
  crates_stacked: "crates_stacked.gltf.glb",
  barrel_large: "barrel_large.gltf.glb",
  rubble_large: "rubble_large.gltf.glb",
  rubble_half: "rubble_half.gltf.glb",
  chest_gold: "chest_gold.glb",
  barrier: "barrier.gltf.glb",
  trunk_large_A: "trunk_large_A.gltf.glb",
  trunk_large_B: "trunk_large_B.gltf.glb",
  coin: "coin.gltf.glb",
};

const TEXTURE_FILES = [
  ["cobbleDiffuse", "cobble_diff_1k.jpg", true],
  ["cobbleNormal", "cobble_nor_1k.jpg", false],
  ["cobbleRoughness", "cobble_rough_1k.jpg", false],
  ["cobbleAO", "cobble_ao_1k.jpg", false],
  ["rockDiffuse", "darkrock_diff_1k.jpg", true],
  ["rockNormal", "darkrock_nor_1k.jpg", false],
  ["rockRoughness", "darkrock_rough_1k.jpg", false],
  ["rockAO", "darkrock_ao_1k.jpg", false],
  ["grassDiffuse", "grass_1k.jpg", true],
  ["grassNormal", "grassnor_1k.jpg", false],
  ["grassRoughness", "grassrough_1k.jpg", false],
  ["grassAO", "grassao_1k.jpg", false],
];

function forestUrl(name) {
  return `${BASE}/forest/${name}.gltf`;
}

function dungeonUrl(file) {
  return `${BASE}/dungeon/${file}`;
}

function dedupeMaterials(groups) {
  const shared = new Map();
  const duplicates = [];
  for (const root of groups) {
    root.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const next = materials.map((material) => {
        if (!material || !material.name) return material;
        const map = material.map;
        const key = `${material.name}|${map?.image?.width || 0}x${map?.image?.height || 0}`;
        if (!shared.has(key)) {
          shared.set(key, material);
          return material;
        }
        const original = shared.get(key);
        if (material !== original) duplicates.push(material);
        return original;
      });
      object.material = Array.isArray(object.material) ? next : next[0];
    });
  }
  const disposedMaps = new Set();
  duplicates.forEach((material) => {
    if (material.map && !disposedMaps.has(material.map) && !material.map.userData?.shared) {
      material.map.dispose();
      disposedMaps.add(material.map);
    }
    material.dispose?.();
  });
  return shared;
}

export async function loadRunnerAssets(onProgress = () => {}) {
  const manager = new THREE.LoadingManager();
  const loader = new GLTFLoader(manager);
  const textureLoader = new THREE.TextureLoader(manager);
  const hdrLoader = new HDRLoader(manager);
  const tasks = [];

  const addTask = (label, promise) => {
    tasks.push({ label, promise });
    return promise;
  };

  const hdri = addTask("Loading sky", hdrLoader.loadAsync(`${BASE}/hdri/dikhololo_night_1k.hdr`).then((texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }));
  const character = addTask("Loading automaton", loader.loadAsync(`${BASE}/characters/robot-expressive.glb`));
  const forest = {};
  const dungeon = {};
  const textures = {};

  FOREST_MODELS.forEach((name) => {
    forest[name] = addTask(`Loading ${name}`, loader.loadAsync(forestUrl(name)));
  });
  Object.entries(DUNGEON_MODELS).forEach(([name, file]) => {
    dungeon[name] = addTask(`Loading ${name}`, loader.loadAsync(dungeonUrl(file)));
  });
  TEXTURE_FILES.forEach(([key, file, srgb]) => {
    textures[key] = addTask(`Loading ${file}`, textureLoader.loadAsync(`${BASE}/textures/${file}`).then((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
      else texture.colorSpace = THREE.NoColorSpace;
      return texture;
    }));
  });

  const total = tasks.length;
  let completed = 0;
  onProgress(0, total, "Preparing the expedition");
  for (const task of tasks) {
    try {
      await task.promise;
    } catch (error) {
      throw new Error(`Could not load ${task.label}: ${error.message}`);
    }
    completed += 1;
    onProgress(completed, total, task.label);
  }

  const characterResult = await character;
  const forestScenes = {};
  for (const name of FOREST_MODELS) forestScenes[name] = (await forest[name]).scene;
  const dungeonScenes = {};
  for (const name of Object.keys(DUNGEON_MODELS)) dungeonScenes[name] = (await dungeon[name]).scene;
  const textureMaps = {};
  for (const [key] of TEXTURE_FILES) textureMaps[key] = await textures[key];

  const allPropScenes = [...Object.values(forestScenes), ...Object.values(dungeonScenes)];
  dedupeMaterials(allPropScenes);

  return {
    hdri: await hdri,
    character: characterResult,
    forest: forestScenes,
    dungeon: dungeonScenes,
    textures: textureMaps,
    allPropScenes,
  };
}
