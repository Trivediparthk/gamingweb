import {
  THREE,
  createStage,
  addStudioLights,
  createStarfield,
  ParticleBurst,
  makeGlowTexture,
  clamp,
  lerp,
  show3DError,
} from "./three-kit.js";

export default function createGridRunner3D(shell) {
  let stage;
  try {
    stage = createStage(shell, {
      fov: 48,
      background: "#040810",
      fogColor: "#040810",
      fogNear: 30,
      fogFar: 80,
    });
  } catch (error) {
    show3DError(shell, error.message);
    return { destroy() {} };
  }

  const { renderer, scene, camera, dispose } = stage;
  const map = [
    "###############",
    "#.............#",
    "#.###.#.#.###.#",
    "#.............#",
    "#.#.###.###.#.#",
    "#...#.....#...#",
    "#.###.###.###.#",
    "#.............#",
    "###############",
  ];
  const cols = map[0].length;
  const rows = map.length;
  const CELL = 1.15;
  const shardPositions = [
    [5, 1],
    [9, 1],
    [13, 3],
    [7, 5],
    [1, 7],
    [11, 7],
  ];
  const exitCell = { x: 13, y: 7 };
  const BASE_CAM = new THREE.Vector3(0, 11.2, 11.8);

  camera.position.copy(BASE_CAM);
  camera.lookAt(0, 0, 0);

  addStudioLights(scene, {
    key: "#e8f2ff",
    accentA: "#58e5ff",
    accentB: "#8c70ff",
    keyIntensity: 2.1,
  });
  createStarfield(scene, { count: 900, radius: 75, color: "#bcd0ff", size: 0.4, opacity: 0.7 });
  scene.add(new THREE.AmbientLight(0x24405a, 0.95));
  const boardLight = new THREE.PointLight("#58e5ff", 45, 24, 2);
  boardLight.position.set(0, 7, 0);
  scene.add(boardLight);
  const boardLightB = new THREE.PointLight("#8c70ff", 24, 22, 2);
  boardLightB.position.set(0, 4, -4);
  scene.add(boardLightB);

  const cellToWorld = (gx, gy) => new THREE.Vector3((gx - (cols - 1) / 2) * CELL, 0, (gy - (rows - 1) / 2) * CELL);
  const walkable = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && map[y][x] === ".";

  const boardW = cols * CELL;
  const boardD = rows * CELL;
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(boardW + 0.8, 0.42, boardD + 0.8),
    new THREE.MeshStandardMaterial({ color: "#060d16", roughness: 0.45, metalness: 0.55 }),
  );
  platform.position.y = -0.24;
  platform.receiveShadow = true;
  scene.add(platform);

  const floorCanvas = document.createElement("canvas");
  floorCanvas.width = 690;
  floorCanvas.height = 414;
  const fctx = floorCanvas.getContext("2d");
  fctx.fillStyle = "#07111c";
  fctx.fillRect(0, 0, floorCanvas.width, floorCanvas.height);
  const cw = floorCanvas.width / cols;
  const ch = floorCanvas.height / rows;
  fctx.strokeStyle = "rgba(88,229,255,0.38)";
  fctx.lineWidth = 2;
  for (let x = 0; x <= cols; x += 1) {
    fctx.beginPath();
    fctx.moveTo(x * cw, 0);
    fctx.lineTo(x * cw, floorCanvas.height);
    fctx.stroke();
  }
  for (let y = 0; y <= rows; y += 1) {
    fctx.beginPath();
    fctx.moveTo(0, y * ch);
    fctx.lineTo(floorCanvas.width, y * ch);
    fctx.stroke();
  }
  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(boardW, boardD),
    new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.5,
      metalness: 0.35,
      emissive: "#0b2f42",
      emissiveIntensity: 0.7,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  floor.receiveShadow = true;
  scene.add(floor);

  const underGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#58e5ff", "rgba(0,0,0,0)"),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  underGlow.scale.set(28, 20, 1);
  underGlow.position.set(0, -0.5, 0);
  scene.add(underGlow);

  const wallGeo = new THREE.BoxGeometry(CELL * 0.94, 1.5, CELL * 0.94);
  const wallMat = new THREE.MeshStandardMaterial({
    color: "#0a1a2a",
    emissive: "#1b5a72",
    emissiveIntensity: 0.6,
    roughness: 0.42,
    metalness: 0.45,
  });
  const wallEdgeGeo = new THREE.EdgesGeometry(wallGeo);
  const wallEdgeMat = new THREE.LineBasicMaterial({ color: "#58e5ff", transparent: true, opacity: 0.32 });
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (map[y][x] !== "#") continue;
      const pos = cellToWorld(x, y);
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(pos.x, 0.75, pos.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      const edges = new THREE.LineSegments(wallEdgeGeo, wallEdgeMat);
      edges.position.copy(wall.position);
      scene.add(edges);
    }
  }

  const makeGroup = () => new THREE.Group();

  const player = makeGroup();
  const playerBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 24, 16),
    new THREE.MeshStandardMaterial({
      color: "#eaffc8",
      emissive: "#c9ff4a",
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.4,
    }),
  );
  playerBody.castShadow = true;
  playerBody.position.y = 0.52;
  const playerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.03, 8, 48),
    new THREE.MeshStandardMaterial({ color: "#c9ff4a", emissive: "#c9ff4a", emissiveIntensity: 1.6 }),
  );
  playerRing.rotation.x = Math.PI / 2;
  playerRing.position.y = 0.06;
  const playerNose = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#c9ff4a", emissiveIntensity: 2 }),
  );
  playerNose.position.set(0.32, 0.52, 0);
  const playerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#c9ff4a", "rgba(201,255,74,0)"),
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  playerGlow.scale.setScalar(2.6);
  playerGlow.position.y = 0.55;
  const playerLight = new THREE.PointLight("#c9ff4a", 5, 6, 2);
  playerLight.position.y = 0.8;
  player.add(playerBody, playerRing, playerNose, playerGlow, playerLight);
  scene.add(player);

  const shardMeshes = shardPositions.map(([x, y], index) => {
    const group = makeGroup();
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({
        color: "#eaffb0",
        emissive: "#c9ff4a",
        emissiveIntensity: 1.9,
        roughness: 0.16,
        metalness: 0.35,
      }),
    );
    gem.castShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.018, 6, 40),
      new THREE.MeshStandardMaterial({ color: "#c9ff4a", emissive: "#c9ff4a", emissiveIntensity: 1.4, transparent: true, opacity: 0.65 }),
    );
    ring.rotation.x = Math.PI / 2;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture("#c9ff4a", "rgba(201,255,74,0)"),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(2.2);
    group.add(gem, ring, glow);
    const pos = cellToWorld(x, y);
    group.position.set(pos.x, 0.9, pos.z);
    scene.add(group);
    return { group, gem, ring, x, y, phase: index * 0.9, collected: false };
  });

  const droneData = [
    { x: 7, y: 3, dx: 1, dy: 0, phase: 0 },
    { x: 5, y: 5, dx: 0, dy: 1, phase: 1.8 },
    { x: 11, y: 1, dx: -1, dy: 0, phase: 3.4 },
  ];
  const droneMeshes = droneData.map((drone) => {
    const group = makeGroup();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 20, 14),
      new THREE.MeshStandardMaterial({
        color: "#ffd6c9",
        emissive: "#ff8666",
        emissiveIntensity: 1.9,
        roughness: 0.2,
        metalness: 0.4,
      }),
    );
    body.castShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.025, 6, 44),
      new THREE.MeshStandardMaterial({ color: "#ff8666", emissive: "#ff8666", emissiveIntensity: 1.5, transparent: true, opacity: 0.8 }),
    );
    ring.rotation.x = Math.PI / 2.4;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture("#ff8666", "rgba(255,134,102,0)"),
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(2.1);
    group.add(body, ring, glow);
    scene.add(group);
    return { group, ring, phase: drone.phase };
  });

  // Exit portal
  const exitPos = cellToWorld(exitCell.x, exitCell.y);
  const exitGroup = makeGroup();
  exitGroup.position.set(exitPos.x, 0, exitPos.z);
  const exitMat = new THREE.MeshStandardMaterial({
    color: "#301418",
    emissive: "#ff8666",
    emissiveIntensity: 0.7,
    roughness: 0.35,
    metalness: 0.4,
  });
  const pillarGeo = new THREE.BoxGeometry(0.16, 2.2, 0.16);
  const leftPillar = new THREE.Mesh(pillarGeo, exitMat);
  leftPillar.position.set(-0.5, 1.1, 0);
  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 0.5;
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.16, 0.16), exitMat);
  topBar.position.y = 2.2;
  const exitRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.04, 8, 48),
    new THREE.MeshStandardMaterial({ color: "#ff8666", emissive: "#ff8666", emissiveIntensity: 1.2, transparent: true, opacity: 0.8 }),
  );
  exitRing.position.y = 1.1;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 2.1, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: "#c9ff4a",
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  beam.position.y = 1.05;
  exitGroup.add(leftPillar, rightPillar, topBar, exitRing, beam);
  scene.add(exitGroup);

  const makeLabel = (text, color) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.font = "700 34px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillText(text, 128, 34);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  const lockTexture = makeLabel("LOCK", "#ff8666");
  const exitTexture = makeLabel("EXIT", "#c9ff4a");
  const exitLabel = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: lockTexture, transparent: true, depthWrite: false }),
  );
  exitLabel.position.set(0, 2.65, 0);
  exitLabel.scale.set(1.6, 0.4, 1);
  exitGroup.add(exitLabel);

  const particles = new ParticleBurst(scene, { max: 320, size: 0.1 });
  let playerCell = { x: 1, y: 1, facing: "right" };
  let shards = [];
  let drones = [];
  let score = 0;
  let moves = 0;
  let collected = 0;
  let running = false;
  let paused = false;
  let finished = false;
  let won = false;
  let death = false;
  let time = 0;
  let shake = 0;
  let bump = 0;

  const playerWorld = () => cellToWorld(playerCell.x, playerCell.y);
  const setPlayerNose = () => {
    const map2 = {
      right: [0.34, 0, 0],
      left: [-0.34, 0, 0],
      up: [0, 0, -0.34],
      down: [0, 0, 0.34],
    };
    const [x, , z] = map2[playerCell.facing] || map2.right;
    playerNose.position.set(x, 0.52, z);
  };

  const updateHud = () => {
    shell.setScore(score);
    shell.setExtra([
      { label: "Shards", value: `${collected}/6` },
      { label: "Moves", value: moves },
    ]);
  };

  const setExitState = (unlocked) => {
    const color = unlocked ? "#c9ff4a" : "#ff8666";
    exitMat.emissive.set(color);
    exitMat.emissiveIntensity = unlocked ? 1.8 : 0.7;
    exitRing.material.color.set(color);
    exitRing.material.emissive.set(color);
    exitRing.material.emissiveIntensity = unlocked ? 1.8 : 1.2;
    exitLabel.material.map = unlocked ? exitTexture : lockTexture;
    exitLabel.material.needsUpdate = true;
    beam.material.opacity = unlocked ? 0.16 : 0.02;
  };

  const snapVisuals = () => {
    const p = playerWorld();
    player.position.set(p.x, 0, p.z);
    setPlayerNose();
    player.visible = true;
    drones.forEach((drone, index) => {
      const pos = cellToWorld(drone.x, drone.y);
      droneMeshes[index].group.position.set(pos.x, 0.55, pos.z);
      droneMeshes[index].group.visible = true;
    });
    shardMeshes.forEach((shard) => {
      shard.group.visible = !shard.collected;
    });
  };

  const reset = () => {
    playerCell = { x: 1, y: 1, facing: "right" };
    shards = shardPositions.map(([x, y], index) => ({
      x,
      y,
      collected: false,
      phase: index * 0.9,
    }));
    drones = droneData.map((d) => ({ ...d }));
    score = 0;
    moves = 0;
    collected = 0;
    running = true;
    paused = false;
    finished = false;
    won = false;
    death = false;
    time = 0;
    shake = 0;
    bump = 0;
    shardMeshes.forEach((shard) => {
      shard.collected = false;
      shard.group.visible = true;
    });
    setExitState(false);
    snapVisuals();
    updateHud();
    shell.setBest(shell.best);
    shell.setPaused(false);
    stage.clock.getDelta();
  };

  const start = () => {
    reset();
    shell.hideOverlay();
    shell.setStatus("In play", "playing");
    shell.announce("Grid Runner started. Collect all six shards, avoid the drones and reach the exit.");
    stage.clock.getDelta();
  };

  const die = () => {
    if (!running || death) return;
    running = false;
    death = true;
    finished = true;
    shake = 0.5;
    player.visible = false;
    particles.emit(player.position, 50, "#ff8666", 6, 1, 2);
    shell.setScore(score, true);
    shell.setStatus("Runner lost", "paused");
    shell.showOverlay({
      kicker: "Route compromised",
      title: "Runner lost.",
      text: "The patrol found the path first. Watch the drones between your moves and use the open rows.",
      actionLabel: "Run again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${collected}/6 shards / ${moves} moves`,
      mark: "restart",
    });
    shell.announce(`Runner lost after ${moves} moves. Score ${score}.`);
  };

  const complete = () => {
    if (!running) return;
    running = false;
    won = true;
    finished = true;
    score += 500;
    shake = 0.3;
    particles.emit(exitGroup.position, 45, "#c9ff4a", 5, 0.9, 1.2);
    setExitState(true);
    shell.setScore(score, true);
    shell.setStatus("Grid cleared", "ready");
    shell.showOverlay({
      kicker: "Exit reached",
      title: "Grid cleared.",
      text: "Every shard collected and the exit found. A clean route through a moving system.",
      actionLabel: "Run again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `Clear bonus +500 / ${moves} moves`,
      mark: "spark",
    });
    shell.announce(`Grid cleared in ${moves} moves. Score ${score}.`);
  };

  const moveDrone = (drone) => {
    const directions = [
      [drone.dx, drone.dy],
      [-drone.dy, drone.dx],
      [drone.dy, -drone.dx],
      [-drone.dx, -drone.dy],
    ];
    for (const [dx, dy] of directions) {
      const nx = drone.x + dx;
      const ny = drone.y + dy;
      if (walkable(nx, ny)) {
        drone.dx = dx;
        drone.dy = dy;
        drone.x = nx;
        drone.y = ny;
        return;
      }
    }
  };

  const droneAt = (x, y) => drones.some((drone) => drone.x === x && drone.y === y);

  const movePlayer = (dx, dy, facing) => {
    if (!running || paused || finished) return;
    playerCell.facing = facing;
    setPlayerNose();
    const nx = playerCell.x + dx;
    const ny = playerCell.y + dy;
    if (!walkable(nx, ny)) {
      bump = 0.3;
      shake = Math.max(shake, 0.08);
      return;
    }
    playerCell.x = nx;
    playerCell.y = ny;
    moves += 1;

    const shard = shards.find((item) => !item.collected && item.x === nx && item.y === ny);
    if (shard) {
      shard.collected = true;
      collected += 1;
      score += 100;
      const mesh = shardMeshes.find((item) => item.x === nx && item.y === ny);
      if (mesh) {
        mesh.collected = true;
        mesh.group.visible = false;
        particles.emit(mesh.group.position, 22, "#c9ff4a", 4, 0.7, 1);
      }
      shell.announce(`Shard collected. ${collected} of 6.`);
      if (collected === shards.length) {
        setExitState(true);
        particles.emit(exitGroup.position, 30, "#c9ff4a", 4, 0.7);
        shell.announce("All shards collected. The exit is unlocked.");
      }
    }
    updateHud();

    if (nx === exitCell.x && ny === exitCell.y) {
      if (collected === shards.length) {
        complete();
        return;
      }
      shell.announce("The exit is locked. Collect every shard first.");
    }

    if (droneAt(nx, ny)) {
      die();
      return;
    }

    drones.forEach(moveDrone);

    if (droneAt(playerCell.x, playerCell.y)) {
      die();
    }
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
        title: "Grid on hold.",
        text: "The patrol will wait. Resume when you are ready, or start a fresh run.",
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

  const keyMap = {
    ArrowUp: [0, -1, "up"],
    ArrowDown: [0, 1, "down"],
    ArrowLeft: [-1, 0, "left"],
    ArrowRight: [1, 0, "right"],
    w: [0, -1, "up"],
    W: [0, -1, "up"],
    s: [0, 1, "down"],
    S: [0, 1, "down"],
    a: [-1, 0, "left"],
    A: [-1, 0, "left"],
    d: [1, 0, "right"],
    D: [1, 0, "right"],
  };
  shell.onKey((event) => {
    const entry = keyMap[event.key];
    if (!entry) return;
    if (!running || paused || finished) return;
    event.preventDefault();
    movePlayer(entry[0], entry[1], entry[2]);
  });
  shell.enableSwipe((dir) => {
    if (dir === "up") movePlayer(0, -1, "up");
    else if (dir === "down") movePlayer(0, 1, "down");
    else if (dir === "left") movePlayer(-1, 0, "left");
    else if (dir === "right") movePlayer(1, 0, "right");
  });
  shell.enableDpad((dir) => {
    if (dir === "up") movePlayer(0, -1, "up");
    else if (dir === "down") movePlayer(0, 1, "down");
    else if (dir === "left") movePlayer(-1, 0, "left");
    else if (dir === "right") movePlayer(1, 0, "right");
  }, "Use the pad or swipe<br>to move");

  const update = (dt) => {
    time += dt;
    const p = playerWorld();
    player.position.x = lerp(player.position.x, p.x, 1 - Math.exp(-15 * dt));
    player.position.z = lerp(player.position.z, p.z, 1 - Math.exp(-15 * dt));
    playerRing.rotation.z += dt * 1.2;
    playerRing.scale.setScalar(1 + Math.sin(time * 3) * 0.05 + bump);
    playerGlow.material.opacity = 0.35 + Math.sin(time * 2.5) * 0.06;
    playerLight.intensity = 4 + Math.sin(time * 3.2) * 1.2;
    bump = Math.max(0, bump - dt * 1.4);

    drones.forEach((drone, index) => {
      const pos = cellToWorld(drone.x, drone.y);
      const mesh = droneMeshes[index];
      mesh.group.position.x = lerp(mesh.group.position.x, pos.x, 1 - Math.exp(-12 * dt));
      mesh.group.position.z = lerp(mesh.group.position.z, pos.z, 1 - Math.exp(-12 * dt));
      mesh.group.position.y = 0.55 + Math.sin(time * 2.4 + mesh.phase) * 0.06;
      mesh.ring.rotation.z += dt * 1.4;
    });

    shardMeshes.forEach((shard) => {
      if (shard.collected) return;
      shard.group.position.y = 0.9 + Math.sin(time * 2.2 + shard.phase) * 0.14;
      shard.gem.rotation.y += dt * 1.8;
      shard.gem.rotation.x += dt * 0.9;
      shard.ring.rotation.z += dt * 0.9;
    });

    exitRing.rotation.z += dt * (collected === shards.length ? 1.6 : 0.5);
    if (collected === shards.length) {
      beam.material.opacity = 0.1 + Math.sin(time * 3.2) * 0.06;
    }

    particles.update(dt);
    shake = Math.max(0, shake - dt * 1.6);
    camera.position.set(
      BASE_CAM.x + Math.sin(time * 0.22) * 0.35 + Math.sin(time * 47) * shake,
      BASE_CAM.y + Math.cos(time * 0.4) * 0.18 + Math.cos(time * 39) * shake * 0.4,
      BASE_CAM.z,
    );
    camera.lookAt(0, 0, 0);
  };

  const animate = () => {
    const dt = Math.min(stage.clock.getDelta(), 0.033);
    if (running && !paused) update(dt);
    else if (finished) particles.update(dt);
    renderer.render(scene, camera);
  };

  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  if (new URLSearchParams(window.location.search).has("debug3d")) {
    window.__robloxsplay3d = {
      state: () => ({ game: "grid-runner", score, moves, collected, player: { ...playerCell }, drones: drones.map((d) => ({ x: d.x, y: d.y })), running, paused, won, death }),
      win: () => {
        collected = shards.length;
        playerCell.x = exitCell.x;
        playerCell.y = exitCell.y;
        complete();
      },
      lose: () => die(),
    };
  }

  reset();
  running = false;
  shell.showOverlay({
    kicker: "Adventure / 3D / 008",
    title: "Grid Runner 3D",
    text: "A turn-based 3D maze. Collect all six shards, read the patrol drones and reach the exit before they close the route.",
    actionLabel: "Start run",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Arrow keys / WASD / swipe / on-screen pad",
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
