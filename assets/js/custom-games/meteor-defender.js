import {
  THREE,
  createStage,
  addStudioLights,
  createStarfield,
  createGridFloor,
  ParticleBurst,
  Trail,
  Input,
  makeGlowTexture,
  clamp,
  lerp,
  rand,
  show3DError,
} from "./three-kit.js";

export default function createMeteorDefender3D(shell) {
  let stage;
  try {
    stage = createStage(shell, {
      fov: 58,
      background: "#03040c",
      fogColor: "#050816",
      fogNear: 26,
      fogFar: 135,
    });
  } catch (error) {
    show3DError(shell, error.message);
    return { destroy() {} };
  }

  const { renderer, scene, camera, dispose } = stage;
  const BASE_CAM = new THREE.Vector3(0, 3.2, 11);
  const SHIP_LIMIT = { x: 5.6, y: 2.25 };
  camera.position.copy(BASE_CAM);
  camera.lookAt(0, 0, -10);

  addStudioLights(scene, {
    key: "#dfe9ff",
    accentA: "#c9ff4a",
    accentB: "#8c70ff",
    keyIntensity: 1.7,
  });
  const stars = createStarfield(scene, { count: 1800, radius: 130, color: "#d0e0ff", size: 0.78, opacity: 1 });
  scene.add(new THREE.AmbientLight(0x2c4a7a, 1.2));
  const fieldGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#58e5ff", "rgba(0,0,0,0)"),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  fieldGlow.position.set(0, -5.8, -24);
  fieldGlow.scale.set(80, 40, 1);
  scene.add(fieldGlow);
  createGridFloor(scene, {
    y: -7,
    size: 90,
    divisions: 45,
    colorA: "#163a55",
    colorB: "#07121c",
    plane: true,
  });

  const makeNebula = (x, y, z, scale, color, opacity) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(color, "rgba(0,0,0,0)"),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, scale, 1);
    scene.add(sprite);
    return sprite;
  };
  makeNebula(-30, 12, -95, 62, "#8c70ff", 0.16);
  makeNebula(26, -10, -105, 72, "#58e5ff", 0.11);
  makeNebula(2, 20, -115, 54, "#ff8666", 0.09);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(10, 40, 28),
    new THREE.MeshStandardMaterial({
      color: "#1b1038",
      emissive: "#3b1f6e",
      emissiveIntensity: 0.45,
      roughness: 0.85,
      metalness: 0.1,
    }),
  );
  planet.position.set(-16, -7, -55);
  scene.add(planet);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#ffd166", "rgba(0,0,0,0)"),
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sunGlow.position.set(20, 12, -70);
  sunGlow.scale.set(42, 42, 1);
  scene.add(sunGlow);
  const planetRing = new THREE.Mesh(
    new THREE.TorusGeometry(16, 0.4, 10, 90),
    new THREE.MeshStandardMaterial({
      color: "#8c70ff",
      emissive: "#8c70ff",
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.6,
      roughness: 0.4,
      metalness: 0.3,
    }),
  );
  planetRing.position.copy(planet.position);
  planetRing.rotation.set(1.2, 0.2, 0.4);
  scene.add(planetRing);

  const ship = new THREE.Group();
  ship.position.set(0, 0, 0);
  ship.scale.setScalar(1.12);
  scene.add(ship);
  const shipModel = new THREE.Group();
  ship.add(shipModel);

  const hullMat = new THREE.MeshStandardMaterial({
    color: "#d7efff",
    emissive: "#58e5ff",
    emissiveIntensity: 0.35,
    roughness: 0.24,
    metalness: 0.75,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: "#15263a",
    emissive: "#0a2a3a",
    emissiveIntensity: 0.5,
    roughness: 0.35,
    metalness: 0.8,
  });
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.9, 4), hullMat);
  hull.rotation.x = -Math.PI / 2;
  hull.rotation.y = Math.PI / 4;
  hull.castShadow = true;
  shipModel.add(hull);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.09, 0.52), darkMat);
  wingL.position.set(-0.78, 0, 0.24);
  wingL.rotation.z = 0.16;
  const wingR = wingL.clone();
  wingR.position.x = 0.78;
  wingR.rotation.z = -0.16;
  shipModel.add(wingL, wingR);
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 20, 14),
    new THREE.MeshStandardMaterial({
      color: "#c9ffff",
      emissive: "#58e5ff",
      emissiveIntensity: 1.8,
      roughness: 0.08,
      metalness: 0.2,
    }),
  );
  cockpit.position.set(0, 0.16, -0.22);
  shipModel.add(cockpit);

  const engineTexture = makeGlowTexture("#dfff9e", "rgba(201,255,74,0)");
  const engineL = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: engineTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  engineL.position.set(-0.32, 0, 0.95);
  engineL.scale.setScalar(0.9);
  const engineR = engineL.clone();
  engineR.position.x = 0.32;
  shipModel.add(engineL, engineR);
  const engineLight = new THREE.PointLight("#c9ff4a", 7, 10, 2);
  engineLight.position.set(0, 0, 1.1);
  shipModel.add(engineLight);

  const shipRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.022, 8, 64),
    new THREE.MeshStandardMaterial({
      color: "#58e5ff",
      emissive: "#58e5ff",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.45,
    }),
  );
  shipRing.position.z = 0.15;
  shipModel.add(shipRing);

  const shipGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#9ff4ff", "rgba(88,229,255,0)"),
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  shipGlow.scale.setScalar(4.2);
  shipGlow.position.z = 0.4;
  shipModel.add(shipGlow);

  const shockwave = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.09, 10, 72),
    new THREE.MeshBasicMaterial({
      color: "#ff8666",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  shockwave.visible = false;
  scene.add(shockwave);

  const particles = new ParticleBurst(scene, { max: 460, size: 0.14 });
  const shipTrail = new Trail(scene, { color: "#58e5ff", count: 18 });
  const input = new Input(shell.canvas, {
    signal: stage.signal,
    isActive: () => running && !paused && !shell.overlayVisible(),
  });

  const meteors = [];
  const shards = [];
  let elapsed = 0;
  let shardsCollected = 0;
  let passBonus = 0;
  let score = 0;
  let running = false;
  let paused = false;
  let finished = false;
  let shake = 0;
  let time = 0;
  let spawnTimer = 1.2;
  let shardTimer = 2.6;
  let displayedSecond = -1;
  let targetX = 0;
  let targetY = 0;
  let deathTimer = 0;

  const disposeMesh = (mesh) => {
    scene.remove(mesh);
    mesh.traverse((child) => {
      child.geometry?.dispose?.();
      if (child.material) {
        const list = Array.isArray(child.material) ? child.material : [child.material];
        list.forEach((material) => material.dispose?.());
      }
    });
  };

  const spawnMeteor = () => {
    const radius = rand(0.65, 1.9);
    const geometry = new THREE.IcosahedronGeometry(radius, 1);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const v = new THREE.Vector3().fromBufferAttribute(position, i);
      const scale = 1 + rand(-0.24, 0.24);
      position.setXYZ(i, v.x * scale, v.y * scale, v.z * scale);
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: "#4a2a22",
      emissive: "#ff5a2a",
      emissiveIntensity: 0.45,
      roughness: 0.92,
      metalness: 0.18,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: "#ff8666", transparent: true, opacity: 0.24 }),
    );
    mesh.add(edges);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture("#ff6a3d", "rgba(255,90,45,0)"),
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(radius * 4);
    mesh.add(glow);
    mesh.position.set(rand(-9.5, 9.5), rand(-5.5, 4.6), -46);
    scene.add(mesh);
    meteors.push({
      mesh,
      radius,
      velocity: new THREE.Vector3(rand(-1.5, 1.5), rand(-0.8, 0.8), rand(7.4, 12.6) + elapsed * 0.06),
      spin: new THREE.Vector3(rand(-2, 2), rand(-2, 2), rand(-2, 2)),
      passed: false,
    });
  };

  const spawnShard = () => {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.52, 0),
      new THREE.MeshStandardMaterial({
        color: "#eaffb0",
        emissive: "#c9ff4a",
        emissiveIntensity: 1.7,
        roughness: 0.2,
        metalness: 0.4,
      }),
    );
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture("#c9ff4a", "rgba(201,255,74,0)"),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(2.6);
    mesh.add(glow);
    mesh.position.set(rand(-7.5, 7.5), rand(-4.2, 3.4), -42);
    scene.add(mesh);
    shards.push({
      mesh,
      velocity: new THREE.Vector3(rand(-0.35, 0.35), rand(-0.2, 0.2), rand(6.5, 8.6)),
      spin: rand(1.5, 3.2),
    });
  };

  const resetTrail = () => {
    const point = new THREE.Vector3(ship.position.x, ship.position.y, 1.25);
    for (let i = 0; i < 24; i += 1) shipTrail.update(point);
  };

  const clearObjects = () => {
    while (meteors.length) disposeMesh(meteors.pop().mesh);
    while (shards.length) disposeMesh(shards.pop().mesh);
  };

  const updateExtra = () => {
    shell.setExtra([
      { label: "Time", value: `${Math.floor(elapsed)}s` },
      { label: "Shards", value: shardsCollected },
    ]);
  };

  const reset = () => {
    clearObjects();
    elapsed = 0;
    shardsCollected = 0;
    passBonus = 0;
    score = 0;
    shake = 0;
    time = 0;
    spawnTimer = 1.1;
    shardTimer = 2.4;
    displayedSecond = -1;
    finished = false;
    paused = false;
    deathTimer = 0;
    ship.visible = true;
    ship.position.set(0, 0, 0);
    targetX = 0;
    targetY = 0;
    shockwave.visible = false;
    shockwave.material.opacity = 0;
    resetTrail();
    shell.setScore(0);
    shell.setBest(shell.best);
    updateExtra();
    shell.setPaused(false);
    stage.clock.getDelta();
  };

  const seedField = () => {
    const spots = [[-14, -3, 2], [-19, 4, -1], [-24, 0, 3.4], [-29, -5, -2], [-34, 3, 1]];
    spots.forEach(([z, x, y]) => {
      spawnMeteor();
      const meteor = meteors[meteors.length - 1];
      meteor.mesh.position.set(x, y, z);
    });
    spawnShard();
    const shard = shards[shards.length - 1];
    shard.mesh.position.set(2.4, 1.4, -16);
  };

  const start = () => {
    reset();
    seedField();
    running = true;
    paused = false;
    shell.hideOverlay();
    shell.setStatus("In play", "playing");
    shell.announce("Meteor Defender started. Dodge the rocks and collect the shards.");
    stage.clock.getDelta();
  };

  const showDeathOverlay = () => {
    if (!finished) return;
    shell.showOverlay({
      kicker: "Run ended",
      title: "Ship lost.",
      text: "The field got too dense. Read the depth, slip the rocks and collect more shards.",
      actionLabel: "Fly again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${Math.floor(elapsed)}s survived / ${shardsCollected} shards / ${score} points`,
      mark: "restart",
    });
  };

  const die = () => {
    if (!running) return;
    running = false;
    paused = false;
    finished = true;
    deathTimer = 0.65;
    ship.visible = false;
    shake = 0.8;
    shockwave.position.copy(ship.position);
    shockwave.scale.setScalar(1);
    shockwave.material.opacity = 0.9;
    shockwave.visible = true;
    particles.emit(ship.position, 70, "#ff8666", 7.5, 1.1, 2.5);
    particles.emit(ship.position, 36, "#58e5ff", 5.5, 0.9, 1.2);
    shell.setScore(score, true);
    shell.setStatus("Ship lost", "paused");
    shell.announce(`Ship lost. Score ${score}.`);
    window.setTimeout(showDeathOverlay, 650);
  };

  const pause = () => {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      shell.setStatus("In play", "playing");
      stage.clock.getDelta();
    } else {
      paused = true;
      shell.setPaused(true);
      shell.showOverlay({
        kicker: "Game paused",
        title: "Field on hold.",
        text: "The meteors will wait. Resume when you are ready, or launch a fresh run.",
        actionLabel: "Resume",
        onAction: () => {
          paused = false;
          shell.setPaused(false);
          shell.setStatus("In play", "playing");
          stage.clock.getDelta();
        },
        secondaryLabel: "Restart",
        onSecondary: start,
        mark: "pause",
      });
    }
  };

  const update = (dt) => {
    time += dt;
    elapsed += dt;

    const keyStep = 9 * dt;
    const left = input.down("ArrowLeft", "KeyA");
    const right = input.down("ArrowRight", "KeyD");
    const up = input.down("ArrowUp", "KeyW");
    const down = input.down("ArrowDown", "KeyS");
    if (left) targetX -= keyStep;
    if (right) targetX += keyStep;
    if (up) targetY += keyStep;
    if (down) targetY -= keyStep;
    if (!left && !right && !up && !down && input.pointer.active) {
      targetX = input.pointer.ndcX * SHIP_LIMIT.x;
      targetY = input.pointer.ndcY * SHIP_LIMIT.y;
    }
    targetX = clamp(targetX, -SHIP_LIMIT.x, SHIP_LIMIT.x);
    targetY = clamp(targetY, -SHIP_LIMIT.y, SHIP_LIMIT.y);
    const ease = 1 - Math.exp(-11 * dt);
    ship.position.x = lerp(ship.position.x, targetX, ease);
    ship.position.y = lerp(ship.position.y, targetY, ease);
    ship.rotation.z = lerp(ship.rotation.z, (targetX - ship.position.x) * -0.16, 0.12);
    ship.rotation.x = lerp(ship.rotation.x, (targetY - ship.position.y) * 0.1, 0.12);
    shipModel.position.y = Math.sin(time * 2.1) * 0.045;
    shipRing.rotation.z += dt * 0.8;
    engineL.scale.setScalar(0.8 + Math.sin(time * 18) * 0.12);
    engineR.scale.setScalar(0.8 + Math.cos(time * 19) * 0.12);
    shipTrail.update(new THREE.Vector3(ship.position.x, ship.position.y, 1.25));

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnMeteor();
      if (elapsed > 18 && Math.random() < 0.45) spawnMeteor();
      spawnTimer = Math.max(0.34, 1.05 - elapsed * 0.013);
    }
    shardTimer -= dt;
    if (shardTimer <= 0) {
      spawnShard();
      shardTimer = rand(3.1, 4.6);
    }

    for (let i = meteors.length - 1; i >= 0; i -= 1) {
      const meteor = meteors[i];
      const mesh = meteor.mesh;
      mesh.position.addScaledVector(meteor.velocity, dt);
      mesh.rotation.x += meteor.spin.x * dt;
      mesh.rotation.y += meteor.spin.y * dt;
      mesh.rotation.z += meteor.spin.z * dt;
      if (!meteor.passed && mesh.position.z > 4.5) {
        meteor.passed = true;
        passBonus += 5;
      }
      if (mesh.position.z > 9) {
        disposeMesh(mesh);
        meteors.splice(i, 1);
        continue;
      }
      if (Math.abs(mesh.position.z) < meteor.radius + 0.85) {
        const dx = mesh.position.x - ship.position.x;
        const dy = mesh.position.y - ship.position.y;
        if (Math.hypot(dx, dy) < meteor.radius + 0.62) {
          disposeMesh(mesh);
          meteors.splice(i, 1);
          die();
          return;
        }
      }
    }

    for (let i = shards.length - 1; i >= 0; i -= 1) {
      const shard = shards[i];
      const mesh = shard.mesh;
      mesh.position.addScaledVector(shard.velocity, dt);
      mesh.rotation.x += shard.spin * dt;
      mesh.rotation.y += shard.spin * 1.3 * dt;
      if (mesh.position.z > 6) {
        disposeMesh(mesh);
        shards.splice(i, 1);
        continue;
      }
      if (mesh.position.distanceTo(ship.position) < 1.35) {
        shardsCollected += 1;
        particles.emit(mesh.position, 18, "#c9ff4a", 3.2, 0.6);
        disposeMesh(mesh);
        shards.splice(i, 1);
      }
    }

    const nextScore = Math.floor(elapsed) * 10 + shardsCollected * 25 + passBonus;
    if (nextScore !== score) {
      score = nextScore;
      shell.setScore(score);
    }
    const second = Math.floor(elapsed);
    if (second !== displayedSecond) {
      displayedSecond = second;
      updateExtra();
    }

    particles.update(dt);
    stars.rotation.z += dt * 0.004;
    planet.rotation.y += dt * 0.01;
    planetRing.rotation.z += dt * 0.006;

    shake = Math.max(0, shake - dt * 1.7);
    camera.position.set(
      BASE_CAM.x + ship.position.x * 0.2 + Math.sin(time * 49) * shake,
      BASE_CAM.y + Math.cos(time * 41) * shake * 0.5,
      BASE_CAM.z,
    );
    camera.lookAt(ship.position.x * 0.28, 0, -10);

    if (shockwave.visible) {
      shockwave.scale.multiplyScalar(1 + dt * 4.2);
      shockwave.material.opacity = Math.max(0, shockwave.material.opacity - dt * 1.5);
      if (shockwave.material.opacity <= 0) shockwave.visible = false;
    }
  };

  const animate = () => {
    const dt = Math.min(stage.clock.getDelta(), 0.033);
    if (running && !paused) {
      update(dt);
    } else if (finished) {
      particles.update(dt);
      if (shockwave.visible) {
        shockwave.scale.multiplyScalar(1 + dt * 4.2);
        shockwave.material.opacity = Math.max(0, shockwave.material.opacity - dt * 1.5);
        if (shockwave.material.opacity <= 0) shockwave.visible = false;
      }
      shake = Math.max(0, shake - dt * 1.7);
      camera.position.set(BASE_CAM.x + Math.sin(time * 49) * shake, BASE_CAM.y + Math.cos(time * 41) * shake * 0.5, BASE_CAM.z);
      camera.lookAt(ship.position.x * 0.28, 0, -10);
      deathTimer = Math.max(0, deathTimer - dt);
    }
    renderer.render(scene, camera);
  };

  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  if (new URLSearchParams(window.location.search).has("debug3d")) {
    window.__robloxsplay3d = {
      state: () => ({ game: "meteor-defender", score, elapsed, shardsCollected, passBonus, meteors: meteors.length, running, paused }),
      lose: () => die(),
    };
  }

  reset();
  running = false;
  shell.showOverlay({
    kicker: "Shooting / 3D / 006",
    title: "Meteor Defender 3D",
    text: "A real 3D asteroid field. Thread the ship through the rocks, collect energy shards and survive as long as you can.",
    actionLabel: "Launch",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Move: mouse / touch / WASD or arrows",
    mark: "play",
  });
  shell.setStatus("Ready to play");
  renderer.setAnimationLoop(animate);

  return {
    destroy() {
      dispose();
    },
  };
}
