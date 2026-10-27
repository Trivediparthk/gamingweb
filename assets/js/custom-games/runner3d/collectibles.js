import { THREE, ParticleBurst, makeGlowTexture, rand, lerp } from "../three-kit.js";

const POWER_TYPES = ["shield", "magnet", "boost"];
const POWER_COLORS = { shield: "#58e5ff", magnet: "#8c70ff", boost: "#ffb347" };

function makeCoin(source) {
  const group = new THREE.Group();
  const clone = source.clone(true);
  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());
  const factor = 0.58 / Math.max(0.001, size.y);
  clone.scale.multiplyScalar(factor);
  const scaled = new THREE.Box3().setFromObject(clone);
  const center = scaled.getCenter(new THREE.Vector3());
  clone.position.x -= center.x;
  clone.position.y -= center.y;
  clone.position.z -= center.z;
  clone.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material) return;
      material.envMapIntensity = 1;
      material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.25);
    });
  });
  group.add(clone);
  return group;
}

function shieldGeo() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.6);
  shape.lineTo(0.46, 0.46);
  shape.quadraticCurveTo(0.5, 0.05, 0, -0.55);
  shape.quadraticCurveTo(-0.5, 0.05, -0.46, 0.46);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 2,
    curveSegments: 16,
  });
}

function magnetGroup() {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.32, -0.3, 0),
    new THREE.Vector3(-0.38, 0.15, 0),
    new THREE.Vector3(-0.2, 0.44, 0),
    new THREE.Vector3(0, 0.52, 0),
    new THREE.Vector3(0.2, 0.44, 0),
    new THREE.Vector3(0.38, 0.15, 0),
    new THREE.Vector3(0.32, -0.3, 0),
  ]);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 42, 0.12, 10, false),
    new THREE.MeshStandardMaterial({ color: "#d8dde2", roughness: 0.2, metalness: 0.9, envMapIntensity: 1.2 }),
  );
  group.add(tube);
  const tipMat = new THREE.MeshStandardMaterial({ color: "#8c70ff", roughness: 0.25, metalness: 0.5, emissive: "#4a2db0", emissiveIntensity: 0.7 });
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 12), tipMat);
    tip.position.set(side * 0.32, -0.39, 0);
    group.add(tip);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.025, 8, 40),
    new THREE.MeshStandardMaterial({ color: "#c9b8ff", emissive: "#8c70ff", emissiveIntensity: 1.4, roughness: 0.25, metalness: 0.4 }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

function boostGroup() {
  const group = new THREE.Group();
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: "#ffd27a",
    emissive: "#ff9a2e",
    emissiveIntensity: 1.1,
    roughness: 0.16,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.2,
    thickness: 0.2,
  });
  const shards = [
    [0, 0.1, 0, 0.16, 0.75, 0.16, 0],
    [-0.22, 0.02, 0.02, 0.1, 0.48, 0.1, -0.35],
    [0.22, 0.0, -0.02, 0.11, 0.52, 0.11, 0.42],
    [0.06, -0.06, 0.2, 0.08, 0.36, 0.08, 0.7],
  ];
  for (const [x, y, z, sx, sy, sz, rz] of shards) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 5), crystalMat);
    shard.scale.set(sx, sy, sz);
    shard.position.set(x, y, z);
    shard.rotation.z = rz;
    group.add(shard);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.028, 8, 40),
    new THREE.MeshStandardMaterial({ color: "#ffcf6a", emissive: "#ffb347", emissiveIntensity: 1.6, roughness: 0.25, metalness: 0.55 }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

function shieldGroup() {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    shieldGeo(),
    new THREE.MeshPhysicalMaterial({
      color: "#9fefff",
      emissive: "#1f8fa8",
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    }),
  );
  mesh.scale.setScalar(0.82);
  group.add(mesh);
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12, 0),
    new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#58e5ff", emissiveIntensity: 2.4, roughness: 0.15, metalness: 0.2 }),
  );
  core.position.z = 0.13;
  group.add(core);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.025, 8, 40),
    new THREE.MeshStandardMaterial({ color: "#58e5ff", emissive: "#58e5ff", emissiveIntensity: 1.8, roughness: 0.2, metalness: 0.4 }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

function makePowerup(type) {
  const group = new THREE.Group();
  if (type === "shield") group.add(shieldGroup());
  else if (type === "magnet") group.add(magnetGroup());
  else group.add(boostGroup());
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(POWER_COLORS[type], "rgba(0,0,0,0)"),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  glow.scale.setScalar(2.4);
  group.add(glow);
  return { group, glow };
}

export function createCollectibles(scene, assets, laneX) {
  const sparks = new ParticleBurst(scene, { max: 300, size: 0.12 });
  const coins = [];
  const coinGlowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture("#ffcf6a", "rgba(255,179,71,0)"),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 48; i += 1) {
    const group = makeCoin(assets.dungeon.coin);
    const glow = new THREE.Sprite(coinGlowMat);
    glow.scale.set(1.15, 1.15, 1);
    group.add(glow);
    group.visible = false;
    scene.add(group);
    coins.push({ group, active: false, x: 0, y: 1, z: 0, baseY: 1, phase: rand(0, Math.PI * 2) });
  }

  const powerups = [];
  for (const type of POWER_TYPES) {
    for (let i = 0; i < 2; i += 1) {
      const { group, glow } = makePowerup(type);
      group.visible = false;
      scene.add(group);
      powerups.push({ type, group, glow, active: false, x: 0, y: 1.5, z: 0, phase: rand(0, Math.PI * 2) });
    }
  }

  let time = 0;

  const spawnCoinLine = (lane, zStart, count = 6, arc = false) => {
    let spawned = 0;
    for (let i = 0; i < count; i += 1) {
      const coin = coins.find((item) => !item.active);
      if (!coin) break;
      coin.active = true;
      coin.x = laneX[lane];
      coin.baseY = 1.05 + (arc ? Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 1.35 : 0);
      coin.y = coin.baseY;
      coin.z = zStart - i * 2.35;
      coin.phase = rand(0, Math.PI * 2);
      coin.group.position.set(coin.x, coin.y, coin.z);
      coin.group.scale.setScalar(1);
      coin.group.visible = true;
      spawned += 1;
    }
    return spawned;
  };

  const spawnPowerup = (type, lane, z) => {
    const power = powerups.find((item) => !item.active && item.type === type);
    if (!power) return false;
    power.active = true;
    power.x = laneX[lane];
    power.y = 1.5;
    power.z = z;
    power.group.position.set(power.x, power.y, power.z);
    power.group.visible = true;
    return true;
  };

  const reset = () => {
    coins.forEach((coin) => {
      coin.active = false;
      coin.group.visible = false;
      coin.group.position.z = 60;
    });
    powerups.forEach((power) => {
      power.active = false;
      power.group.visible = false;
      power.group.position.z = 60;
    });
  };

  const update = (dt, moved, player, magnetActive) => {
    time += dt;
    const events = { coins: 0, powerups: [], coinPositions: [] };

    for (const coin of coins) {
      if (!coin.active) continue;
      coin.z += moved;
      if (coin.z > 14) {
        coin.active = false;
        coin.group.visible = false;
        continue;
      }
      if (magnetActive && coin.z > -16 && coin.z < 5) {
        coin.x = lerp(coin.x, player.x, 1 - Math.exp(-7 * dt));
        coin.y = lerp(coin.y, player.y + 1.0, 1 - Math.exp(-6 * dt));
      }
      coin.group.position.x = coin.x;
      coin.group.position.y = coin.y + Math.sin(time * 3 + coin.phase) * 0.08;
      coin.group.position.z = coin.z;
      coin.group.rotation.y += dt * 2.8;

      const dx = Math.abs(coin.x - player.x);
      const dz = Math.abs(coin.z);
      const dy = Math.abs(coin.group.position.y - (player.y + 0.95));
      if (dx < 0.8 && dz < 0.75 && dy < 1.4) {
        coin.active = false;
        coin.group.visible = false;
        events.coins += 1;
        events.coinPositions.push({ x: coin.x, y: coin.group.position.y, z: coin.z });
        sparks.emit({ x: coin.x, y: coin.group.position.y, z: coin.z }, 12, "#ffcf6a", 3, 0.5);
      }
    }

    for (const power of powerups) {
      if (!power.active) continue;
      power.z += moved;
      if (power.z > 14) {
        power.active = false;
        power.group.visible = false;
        continue;
      }
      power.group.position.set(power.x, power.y + Math.sin(time * 2.2 + power.phase) * 0.16, power.z);
      power.group.rotation.y += dt * 1.6;
      power.group.rotation.z = Math.sin(time * 1.4 + power.phase) * 0.08;
      power.glow.material.opacity = 0.4 + Math.sin(time * 3 + power.phase) * 0.1;
      const dx = Math.abs(power.x - player.x);
      const dz = Math.abs(power.z);
      const dy = Math.abs(power.group.position.y - (player.y + 0.95));
      if (dx < 1.0 && dz < 0.95 && dy < 1.6) {
        power.active = false;
        power.group.visible = false;
        events.powerups.push({ type: power.type, position: { x: power.x, y: power.group.position.y, z: power.z } });
        sparks.emit({ x: power.x, y: power.group.position.y, z: power.z }, 28, POWER_COLORS[power.type], 4, 0.7);
      }
    }

    sparks.update(dt);
    return events;
  };

  const setQuality = (value) => {
    coinGlowMat.opacity = value === "low" ? 0.2 : 0.5;
    powerups.forEach((power) => {
      power.glow.material.opacity = value === "low" ? 0.25 : 0.5;
    });
  };

  return {
    spawnCoinLine,
    spawnPowerup,
    update,
    reset,
    setQuality,
    dispose: () => {
      coins.forEach((coin) => scene.remove(coin.group));
      powerups.forEach((power) => scene.remove(power.group));
      sparks.dispose();
    },
    coins,
    powerups,
  };
}
