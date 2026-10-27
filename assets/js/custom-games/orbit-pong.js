import {
  THREE,
  createStage,
  addStudioLights,
  createStarfield,
  ParticleBurst,
  Trail,
  Input,
  makeGlowTexture,
  clamp,
  lerp,
  rand,
  show3DError,
} from "./three-kit.js";

export default function createOrbitPong3D(shell) {
  let stage;
  try {
    stage = createStage(shell, {
      fov: 52,
      background: "#050714",
      fogColor: "#050714",
      fogNear: 28,
      fogFar: 82,
    });
  } catch (error) {
    show3DError(shell, error.message);
    return { destroy() {} };
  }

  const { renderer, scene, camera, dispose } = stage;
  const LIMIT = { x: 4.15, y: 2.45, playerZ: 6.0, aiZ: -6.0, scoreZ: 7.4 };
  const BALL_R = 0.28;
  const PADDLE_W = 3.4;
  const PADDLE_H = 2.2;
  const MAX_POINTS = 7;
  const BASE_CAM = new THREE.Vector3(0, 5.4, 14.5);

  camera.position.copy(BASE_CAM);
  camera.lookAt(0, 0, -1.2);

  addStudioLights(scene, {
    key: "#eef5ff",
    accentA: "#58e5ff",
    accentB: "#ff8666",
    keyIntensity: 2.0,
  });
  createStarfield(scene, { count: 1100, radius: 70, color: "#bcd0ff", size: 0.42, opacity: 0.8 });
  scene.add(new THREE.AmbientLight(0x2c4a7a, 0.9));
  const courtLightA = new THREE.PointLight("#58e5ff", 36, 30, 2);
  courtLightA.position.set(0, 3.2, 7);
  scene.add(courtLightA);
  const courtLightB = new THREE.PointLight("#ff8666", 26, 30, 2);
  courtLightB.position.set(0, 2.4, -7);
  scene.add(courtLightB);

  const court = new THREE.Group();
  scene.add(court);

  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(8.8, 5.4, 16.8)),
    new THREE.LineBasicMaterial({ color: "#58e5ff", transparent: true, opacity: 0.38 }),
  );
  court.add(frame);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 16.8),
    new THREE.MeshStandardMaterial({ color: "#071626", emissive: "#0b3a4a", emissiveIntensity: 0.5, roughness: 0.34, metalness: 0.58 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.7;
  floor.receiveShadow = true;
  court.add(floor);

  const grid = new THREE.GridHelper(16.8, 20, "#1a5f78", "#0a1a26");
  grid.position.y = -2.69;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  court.add(grid);

  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.5 + i * 0.8, 0.022, 8, 96),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? "#8c70ff" : "#c9ff4a",
        transparent: true,
        opacity: 0.15 - i * 0.03,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -2.2 + i * 0.6;
    court.add(ring);
  }

  const centerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.035, 8, 64),
    new THREE.MeshStandardMaterial({
      color: "#8c70ff",
      emissive: "#8c70ff",
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.55,
    }),
  );
  centerRing.position.z = 0.02;
  court.add(centerRing);

  for (const x of [-4.5, 4.5]) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(16.8, 5.4),
      new THREE.MeshStandardMaterial({
        color: "#081a2b",
        emissive: "#0a3a4d",
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    panel.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    panel.position.set(x, 0, 0);
    court.add(panel);
  }
  const backGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#8c70ff", "rgba(0,0,0,0)"),
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  backGlow.position.set(0, 2.4, -9.6);
  backGlow.scale.set(16, 10, 1);
  court.add(backGlow);
  const orbitSun = new THREE.Mesh(
    new THREE.TorusGeometry(5.6, 0.055, 8, 96),
    new THREE.MeshStandardMaterial({ color: "#8c70ff", emissive: "#8c70ff", emissiveIntensity: 1.2, transparent: true, opacity: 0.55 }),
  );
  orbitSun.position.set(0, 0, -8.7);
  court.add(orbitSun);

  const goalRing = (z, color) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(3.15, 0.045, 10, 72),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.3,
        transparent: true,
        opacity: 0.5,
      }),
    );
    mesh.position.z = z;
    court.add(mesh);
    return mesh;
  };
  const playerGoal = goalRing(6.25, "#58e5ff");
  const aiGoal = goalRing(-6.25, "#ff8666");

  const buildPaddle = (color, dark) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(PADDLE_W, PADDLE_H, 0.3),
      new THREE.MeshStandardMaterial({
        color: dark,
        emissive: color,
        emissiveIntensity: 1.1,
        roughness: 0.22,
        metalness: 0.42,
      }),
    );
    body.castShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.05, 8, 64),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.2,
        roughness: 0.2,
        metalness: 0.3,
      }),
    );
    group.add(body, ring);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(color, "rgba(0,0,0,0)"),
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(5.2);
    group.add(glow);
    return group;
  };

  const player = buildPaddle("#58e5ff", "#0a2430");
  player.position.set(0, 0, LIMIT.playerZ);
  scene.add(player);
  const ai = buildPaddle("#ff8666", "#301418");
  ai.position.set(0, 0, LIMIT.aiZ);
  scene.add(ai);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R, 32, 20),
    new THREE.MeshStandardMaterial({
      color: "#f2ffff",
      emissive: "#58e5ff",
      emissiveIntensity: 3,
      roughness: 0.1,
      metalness: 0.4,
    }),
  );
  ball.castShadow = true;
  scene.add(ball);
  const ballGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#bff6ff", "rgba(88,229,255,0)"),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ballGlow.scale.setScalar(2.2);
  scene.add(ballGlow);
  const ballLight = new THREE.PointLight("#58e5ff", 11, 12, 2);
  scene.add(ballLight);

  const particles = new ParticleBurst(scene, { max: 320, size: 0.12 });
  const trail = new Trail(scene, { color: "#58e5ff", count: 26 });
  const input = new Input(shell.canvas, {
    signal: stage.signal,
    isActive: () => running && !paused && !shell.overlayVisible(),
  });

  const ballPos = new THREE.Vector3(0, 0, 0);
  const ballVel = new THREE.Vector3();
  let playerX = 0;
  let playerY = 0;
  let targetX = 0;
  let targetY = 0;
  let aiX = 0;
  let aiY = 0;
  let playerPoints = 0;
  let rivalPoints = 0;
  let matchWins = Number(shell.best) || 0;
  let rally = 0;
  let ballSpeed = 10.5;
  let running = false;
  let paused = false;
  let finished = false;
  let serving = true;
  let serveTimer = 1.1;
  let time = 0;
  let shake = 0;

  const syncBall = () => {
    ball.position.copy(ballPos);
    ballGlow.position.copy(ballPos);
    ballLight.position.copy(ballPos);
    trail.update(ballPos);
  };

  const updateExtra = () => {
    shell.setExtra([
      { label: "Rival", value: rivalPoints },
      { label: "Rally", value: rally },
    ]);
  };

  const setPlayStatus = () => {
    if (playerPoints === MAX_POINTS - 1 || rivalPoints === MAX_POINTS - 1) {
      shell.setStatus("Match point", "playing");
    } else {
      shell.setStatus("In play", "playing");
    }
  };

  const resetTrail = () => {
    for (let i = 0; i < 32; i += 1) trail.update(ballPos);
  };

  const serve = () => {
    serving = true;
    serveTimer = 1.1;
    ballPos.set(0, rand(-0.45, 0.45), 0);
    ballVel.set(0, 0, 0);
    resetTrail();
    syncBall();
    shell.setStatus("Serve", "playing");
  };

  const launchServe = () => {
    serving = false;
    const dirZ = Math.random() < 0.5 ? 1 : -1;
    ballVel
      .set(rand(-1.1, 1.1), rand(-0.65, 0.65), dirZ * 1.7)
      .normalize()
      .multiplyScalar(ballSpeed);
    shell.announce("Serve.");
  };

  const point = (who) => {
    if (finished) return;
    if (who === "player") playerPoints += 1;
    else rivalPoints += 1;
    rally = 0;
    shell.setScore(playerPoints);
    updateExtra();
    shake = 0.32;
    particles.emit(ballPos, 34, who === "player" ? "#c9ff4a" : "#ff8666", 4.5, 0.8, 0);
    if (playerPoints >= MAX_POINTS || rivalPoints >= MAX_POINTS) {
      finish(playerPoints >= MAX_POINTS);
      return;
    }
    shell.announce(
      who === "player"
        ? `Point to you. ${playerPoints} to ${rivalPoints}.`
        : `Point to rival. ${playerPoints} to ${rivalPoints}.`,
    );
    serve();
  };

  const finish = (won) => {
    if (finished) return;
    finished = true;
    running = false;
    serving = false;
    ballVel.set(0, 0, 0);
    if (won) {
      matchWins += 1;
      shell.recordBest(matchWins);
    }
    shell.setScore(playerPoints);
    shell.setStatus(won ? "Match won" : "Match lost", won ? "ready" : "paused");
    shell.showOverlay({
      kicker: won ? "Match complete" : "Match complete",
      title: won ? "Orbit held." : "Orbit lost.",
      text: won
        ? "You took the 3D court. Keep the rally alive and defend the next match."
        : "The rival found the gap. Read the spin and take the court again.",
      actionLabel: "New match",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      scoreLabel: "Your points",
      bestLabel: "Match wins",
      hint: `Final: you ${playerPoints} – ${rivalPoints} rival / best-of-seven`,
      mark: won ? "spark" : "restart",
    });
    shell.announce(won ? `Match won ${playerPoints} to ${rivalPoints}.` : `Match lost ${playerPoints} to ${rivalPoints}.`);
  };

  const resetMatch = () => {
    playerPoints = 0;
    rivalPoints = 0;
    rally = 0;
    matchWins = Number(shell.best) || 0;
    ballSpeed = 10.5;
    playerX = 0;
    playerY = 0;
    targetX = 0;
    targetY = 0;
    aiX = 0;
    aiY = 0;
    shake = 0;
    finished = false;
    paused = false;
    running = true;
    shell.setScore(0);
    shell.setBest(matchWins);
    updateExtra();
    serve();
    shell.setPaused(false);
    stage.clock.getDelta();
  };

  const start = () => {
    resetMatch();
    shell.hideOverlay();
    shell.setPaused(false);
    setPlayStatus();
    shell.announce("Orbit Pong started. Move your paddle and hold the court.");
    stage.clock.getDelta();
  };

  const pause = () => {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      setPlayStatus();
      stage.clock.getDelta();
    } else {
      paused = true;
      shell.setPaused(true);
      shell.showOverlay({
        kicker: "Game paused",
        title: "Court on hold.",
        text: "The rally will wait. Resume when you are ready, or start a new match.",
        actionLabel: "Resume",
        onAction: () => {
          paused = false;
          shell.setPaused(false);
          setPlayStatus();
          stage.clock.getDelta();
        },
        secondaryLabel: "New match",
        onSecondary: start,
        mark: "pause",
      });
    }
  };

  const paddleBounds = () => {
    targetX = clamp(targetX, -(LIMIT.x - PADDLE_W / 2 - 0.08), LIMIT.x - PADDLE_W / 2 - 0.08);
    targetY = clamp(targetY, -(LIMIT.y - PADDLE_H / 2 - 0.08), LIMIT.y - PADDLE_H / 2 - 0.08);
  };

  const collide = () => {
    if (ballPos.x < -LIMIT.x + BALL_R) {
      ballPos.x = -LIMIT.x + BALL_R;
      ballVel.x = Math.abs(ballVel.x);
      particles.emit(ballPos, 6, "#58e5ff", 2.4, 0.4);
    } else if (ballPos.x > LIMIT.x - BALL_R) {
      ballPos.x = LIMIT.x - BALL_R;
      ballVel.x = -Math.abs(ballVel.x);
      particles.emit(ballPos, 6, "#58e5ff", 2.4, 0.4);
    }
    if (ballPos.y < -LIMIT.y + BALL_R) {
      ballPos.y = -LIMIT.y + BALL_R;
      ballVel.y = Math.abs(ballVel.y);
      particles.emit(ballPos, 6, "#8c70ff", 2.4, 0.4);
    } else if (ballPos.y > LIMIT.y - BALL_R) {
      ballPos.y = LIMIT.y - BALL_R;
      ballVel.y = -Math.abs(ballVel.y);
      particles.emit(ballPos, 6, "#8c70ff", 2.4, 0.4);
    }

    if (ballVel.z > 0 && ballPos.z + BALL_R >= LIMIT.playerZ - 0.15) {
      if (
        Math.abs(ballPos.x - playerX) <= PADDLE_W / 2 + BALL_R &&
        Math.abs(ballPos.y - playerY) <= PADDLE_H / 2 + BALL_R
      ) {
        ballPos.z = LIMIT.playerZ - 0.15 - BALL_R;
        ballVel.z = -Math.abs(ballVel.z);
        const ox = (ballPos.x - playerX) / (PADDLE_W / 2);
        const oy = (ballPos.y - playerY) / (PADDLE_H / 2);
        ballVel.x += ox * 3.4;
        ballVel.y += oy * 3.4;
        rally += 1;
        ballSpeed = Math.min(ballSpeed * 1.045, 18);
        ballVel.setLength(ballSpeed);
        particles.emit(ballPos, 11, "#58e5ff", 3.1, 0.5);
        updateExtra();
      } else if (ballPos.z > LIMIT.playerZ + 0.95) {
        point("rival");
      }
    }

    if (ballVel.z < 0 && ballPos.z - BALL_R <= LIMIT.aiZ + 0.15) {
      if (
        Math.abs(ballPos.x - aiX) <= PADDLE_W / 2 + BALL_R &&
        Math.abs(ballPos.y - aiY) <= PADDLE_H / 2 + BALL_R
      ) {
        ballPos.z = LIMIT.aiZ + 0.15 + BALL_R;
        ballVel.z = Math.abs(ballVel.z);
        const ox = (ballPos.x - aiX) / (PADDLE_W / 2);
        const oy = (ballPos.y - aiY) / (PADDLE_H / 2);
        ballVel.x += ox * 2.8;
        ballVel.y += oy * 2.8;
        rally += 1;
        ballSpeed = Math.min(ballSpeed * 1.045, 18);
        ballVel.setLength(ballSpeed);
        particles.emit(ballPos, 11, "#ff8666", 3.1, 0.5);
        updateExtra();
      } else if (ballPos.z < LIMIT.aiZ - 0.95) {
        point("player");
      }
    }
  };

  const update = (dt) => {
    time += dt;
    const keyStep = 8 * dt;
    const left = input.down("ArrowLeft", "KeyA");
    const right = input.down("ArrowRight", "KeyD");
    const up = input.down("ArrowUp", "KeyW");
    const down = input.down("ArrowDown", "KeyS");
    if (left) targetX -= keyStep;
    if (right) targetX += keyStep;
    if (up) targetY += keyStep;
    if (down) targetY -= keyStep;
    if (!left && !right && !up && !down && input.pointer.active) {
      targetX = input.pointer.ndcX * (LIMIT.x - PADDLE_W / 2 - 0.1);
      targetY = input.pointer.ndcY * (LIMIT.y - PADDLE_H / 2 - 0.1);
    }
    paddleBounds();
    playerX = lerp(playerX, targetX, 1 - Math.exp(-16 * dt));
    playerY = lerp(playerY, targetY, 1 - Math.exp(-16 * dt));
    player.position.set(playerX, playerY, LIMIT.playerZ);

    const aiTargetX = ballVel.z < 0 && !serving ? ballPos.x * 0.9 : Math.sin(time * 0.9) * 0.8;
    const aiTargetY = ballVel.z < 0 && !serving ? ballPos.y * 0.9 : Math.cos(time * 1.1) * 0.45;
    const aiEase = 1 - Math.exp(-(2.1 + rally * 0.09) * dt);
    aiX = lerp(aiX, aiTargetX, aiEase);
    aiY = lerp(aiY, aiTargetY, aiEase);
    ai.position.set(aiX, aiY, LIMIT.aiZ);

    if (serving) {
      serveTimer -= dt;
      ballPos.set(0, Math.sin(time * 2) * 0.25, 0);
      syncBall();
      if (serveTimer <= 0) launchServe();
    } else {
      const steps = 2;
      const h = dt / steps;
      for (let i = 0; i < steps && running; i += 1) {
        ballPos.addScaledVector(ballVel, h);
        collide();
      }
      syncBall();
    }

    particles.update(dt);
    centerRing.rotation.z += dt * 0.35;
    centerRing.scale.setScalar(1 + Math.sin(time * 2.4) * 0.04);
    playerGoal.rotation.z += dt * 0.12;
    aiGoal.rotation.z -= dt * 0.12;
    ball.rotation.x += dt * 2;
    ball.rotation.y += dt * 2.6;

    shake = Math.max(0, shake - dt * 1.8);
    camera.position.set(
      BASE_CAM.x + Math.sin(time * 51) * shake,
      BASE_CAM.y + Math.cos(time * 39) * shake * 0.6,
      BASE_CAM.z,
    );
    camera.lookAt(0, 0, -1.2);
  };

  const animate = () => {
    const dt = Math.min(stage.clock.getDelta(), 0.033);
    if (running && !paused) update(dt);
    renderer.render(scene, camera);
  };

  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  if (new URLSearchParams(window.location.search).has("debug3d")) {
    window.__robloxsplay3d = {
      state: () => ({ game: "orbit-pong", playerPoints, rivalPoints, matchWins, rally, ballSpeed, serving, running, paused }),
      win: () => {
        playerPoints = MAX_POINTS;
        finish(true);
      },
      lose: () => {
        rivalPoints = MAX_POINTS;
        finish(false);
      },
    };
  }

  resetMatch();
  running = false;
  shell.showOverlay({
    kicker: "Sports / 3D / 002",
    title: "Orbit Pong 3D",
    text: "Zero-gravity pong in a real 3D court. Move your paddle across the plane, add spin and take the match to seven.",
    actionLabel: "Start match",
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
