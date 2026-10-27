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

export default function createPrismBreaker3D(shell) {
  let stage;
  try {
    stage = createStage(shell, {
      fov: 56,
      background: "#050912",
      fogColor: "#050912",
      fogNear: 22,
      fogFar: 70,
    });
  } catch (error) {
    show3DError(shell, error.message);
    return { destroy() {} };
  }

  const { renderer, scene, camera, dispose } = stage;
  const ARENA = { halfW: 7.2, top: 5.6, bottom: -4.4, back: -5.25, paddleZ: 4.2, brickZ: -4.55 };
  const PADDLE_W = 3.4;
  const PADDLE_H = 9.6;
  const BALL_R = 0.3;
  const BRICK_W = 1.36;
  const BRICK_H = 0.6;
  const BRICK_D = 0.7;
  const COLS = 9;
  const ROWS = 5;
  const TOTAL_BLOCKS = COLS * ROWS;
  const ROW_COLORS = ["#ff8666", "#8c70ff", "#58e5ff", "#c9ff4a", "#ffd166"];

  const BASE_CAM = new THREE.Vector3(0, 3.8, 15.5);
  camera.position.copy(BASE_CAM);
  camera.lookAt(0, 0.7, -1.5);

  addStudioLights(scene, {
    key: "#fff1dc",
    accentA: "#c9ff4a",
    accentB: "#8c70ff",
    keyIntensity: 2.2,
  });
  createStarfield(scene, { count: 850, radius: 85, color: "#9fc4ff", size: 0.4 });
  createGridFloor(scene, {
    size: 34,
    divisions: 34,
    y: ARENA.bottom,
    colorA: "#1a5b74",
    colorB: "#08151f",
  });

  // Arena frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: "#0a2430",
    emissive: "#58e5ff",
    emissiveIntensity: 0.95,
    roughness: 0.35,
    metalness: 0.4,
  });
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA.halfW * 2, ARENA.top - ARENA.bottom),
    new THREE.MeshStandardMaterial({ color: "#07111d", roughness: 0.55, metalness: 0.45 }),
  );
  backWall.position.set(0, (ARENA.top + ARENA.bottom) / 2, ARENA.back);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const backGrid = new THREE.GridHelper(14.4, 14, "#1f6f8b", "#0b2330");
  backGrid.rotation.x = Math.PI / 2;
  backGrid.position.set(0, 0.6, ARENA.back + 0.02);
  backGrid.material.transparent = true;
  backGrid.material.opacity = 0.45;
  scene.add(backGrid);

  const railGeo = new THREE.BoxGeometry(0.12, PADDLE_H, 9.6);
  const leftRail = new THREE.Mesh(railGeo, frameMat);
  leftRail.position.set(-ARENA.halfW, 0.6, -0.4);
  const rightRail = leftRail.clone();
  rightRail.position.x = ARENA.halfW;
  scene.add(leftRail, rightRail);

  const topRail = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.12, 9.6), frameMat);
  topRail.position.set(0, ARENA.top, -0.4);
  const bottomRail = topRail.clone();
  bottomRail.position.y = ARENA.bottom;
  scene.add(topRail, bottomRail);

  // Row glow panels behind the bricks
  for (let row = 0; row < ROWS; row += 1) {
    const mat = new THREE.SpriteMaterial({
      map: makeGlowTexture(ROW_COLORS[row], "rgba(0,0,0,0)"),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(mat);
    glow.position.set(0, 4.05 - row * 0.78, ARENA.brickZ - 0.5);
    glow.scale.set(13.5, 1.7, 1);
    scene.add(glow);
  }

  const bricks = [];
  const brickGeo = new THREE.BoxGeometry(BRICK_W, BRICK_H, BRICK_D);
  for (let row = 0; row < ROWS; row += 1) {
    const color = ROW_COLORS[row];
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.35,
    });
    for (let col = 0; col < COLS; col += 1) {
      const mesh = new THREE.Mesh(brickGeo, material.clone());
      const x = (col - (COLS - 1) / 2) * 1.5;
      const y = 4.05 - row * 0.78;
      mesh.position.set(x, y, ARENA.brickZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      bricks.push({ mesh, x, y, alive: true, shrink: 1 });
    }
  }

  // Paddle: a tall, semi-transparent energy barrier
  const paddle = new THREE.Group();
  paddle.position.set(0, 0.6, ARENA.paddleZ);
  const paddleFill = new THREE.Mesh(
    new THREE.BoxGeometry(PADDLE_W, PADDLE_H, 0.08),
    new THREE.MeshStandardMaterial({
      color: "#0b2a19",
      emissive: "#c9ff4a",
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.14,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false,
    }),
  );
  const paddleEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(PADDLE_W, PADDLE_H, 0.08)),
    new THREE.LineBasicMaterial({ color: "#c9ff4a", transparent: true, opacity: 0.95 }),
  );
  const paddleBar = new THREE.Mesh(
    new THREE.BoxGeometry(PADDLE_W, 0.18, 0.16),
    new THREE.MeshStandardMaterial({
      color: "#dfff9e",
      emissive: "#c9ff4a",
      emissiveIntensity: 2.4,
      roughness: 0.2,
      metalness: 0.3,
    }),
  );
  paddleBar.position.y = -PADDLE_H / 2 + 0.12;
  const paddleTop = paddleBar.clone();
  paddleTop.position.y = PADDLE_H / 2 - 0.12;
  const leftPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, PADDLE_H, 0.16),
    new THREE.MeshStandardMaterial({
      color: "#dfff9e",
      emissive: "#8fe321",
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.3,
    }),
  );
  leftPost.position.x = -PADDLE_W / 2 + 0.07;
  const rightPost = leftPost.clone();
  rightPost.position.x = PADDLE_W / 2 - 0.07;
  paddle.add(paddleFill, paddleEdges, paddleBar, paddleTop, leftPost, rightPost);
  scene.add(paddle);

  const paddleGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(
        (() => {
          const canvas = document.createElement("canvas");
          canvas.width = 128;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          const g = ctx.createLinearGradient(0, 0, 0, 256);
          g.addColorStop(0, "rgba(201,255,74,0.55)");
          g.addColorStop(0.5, "rgba(201,255,74,0.12)");
          g.addColorStop(1, "rgba(201,255,74,0.55)");
          ctx.fillStyle = g;
          ctx.fillRect(36, 0, 56, 256);
          return canvas;
        })(),
      ),
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  paddleGlow.scale.set(5.2, 10.2, 1);
  paddleGlow.position.set(0, 0.6, ARENA.paddleZ + 0.05);
  scene.add(paddleGlow);

  // Ball
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R, 32, 20),
    new THREE.MeshStandardMaterial({
      color: "#eaffff",
      emissive: "#58e5ff",
      emissiveIntensity: 2.8,
      roughness: 0.12,
      metalness: 0.35,
    }),
  );
  ball.castShadow = true;
  scene.add(ball);
  const ballGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(
        (() => {
          const canvas = document.createElement("canvas");
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext("2d");
          const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
          g.addColorStop(0, "rgba(220,255,255,1)");
          g.addColorStop(0.25, "rgba(88,229,255,0.7)");
          g.addColorStop(1, "rgba(88,229,255,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 128, 128);
          return canvas;
        })(),
      ),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ballGlow.scale.setScalar(2.1);
  scene.add(ballGlow);
  const ballLight = new THREE.PointLight("#58e5ff", 9, 11, 2);
  scene.add(ballLight);

  const particles = new ParticleBurst(scene, { max: 340, size: 0.12 });
  const trail = new Trail(scene, { color: "#58e5ff", count: 26 });
  const input = new Input(shell.canvas, {
    signal: stage.signal,
    isActive: () => running && !paused && !shell.overlayVisible(),
  });

  const ballPos = new THREE.Vector3(0, 0.6, ARENA.paddleZ - 0.7);
  const ballVel = new THREE.Vector3();
  let paddleX = 0;
  let targetX = 0;
  let score = 0;
  let lives = 3;
  let blocksLeft = TOTAL_BLOCKS;
  let speed = 12.5;
  let attached = true;
  let running = false;
  let paused = false;
  let finished = false;
  let shake = 0;
  let time = 0;

  shell.canvas.style.cursor = "crosshair";

  const updateExtra = () => {
    shell.setExtra([
      { label: "Lives", value: `${"●".repeat(Math.max(0, lives))}${"○".repeat(Math.max(0, 3 - lives))}` },
      { label: "Blocks", value: blocksLeft },
    ]);
  };

  const syncBall = () => {
    ball.position.copy(ballPos);
    ballGlow.position.copy(ballPos);
    ballLight.position.copy(ballPos);
    trail.update(ballPos);
  };

  const resetBall = () => {
    attached = true;
    ballPos.set(paddleX, 0.6, ARENA.paddleZ - 0.7);
    ballVel.set(0, 0, 0);
    speed = 12.5;
    for (let i = 0; i < 30; i += 1) trail.update(ballPos);
    syncBall();
  };

  const reset = () => {
    score = 0;
    lives = 3;
    blocksLeft = TOTAL_BLOCKS;
    paddleX = 0;
    targetX = 0;
    shake = 0;
    time = 0;
    finished = false;
    paused = false;
    bricks.forEach((brick) => {
      brick.alive = true;
      brick.shrink = 1;
      brick.mesh.visible = true;
      brick.mesh.scale.set(1, 1, 1);
    });
    paddle.position.x = 0;
    paddleGlow.position.x = 0;
    resetBall();
    shell.setScore(0);
    shell.setBest(shell.best);
    shell.setPaused(false);
    updateExtra();
    stage.clock.getDelta();
  };

  const launch = () => {
    if (!running || paused || !attached) return;
    attached = false;
    const horizontal = rand(-0.42, 0.42);
    ballVel.set(horizontal, rand(0.18, 0.4), -1).normalize().multiplyScalar(speed);
    ballPos.set(paddleX, rand(-0.6, 1.4), ARENA.paddleZ - 0.7);
    syncBall();
    particles.emit(ballPos, 10, "#c9ff4a", 2.2, 0.5);
    shell.announce("Core launched.");
  };

  const breakBrick = (brick) => {
    brick.alive = false;
    brick.shrink = 1;
    blocksLeft -= 1;
    score += 10;
    shell.setScore(score);
    updateExtra();
    particles.emit(brick.mesh.position, 16, ROW_COLORS[Math.round((4.05 - brick.y) / 0.78)] || "#c9ff4a", 4.2, 0.7, 4);
    if (blocksLeft <= 0) finish(true);
  };

  const loseLife = () => {
    if (!running || attached) return;
    lives -= 1;
    updateExtra();
    shake = 0.4;
    particles.emit(ballPos, 34, "#ff8666", 5, 0.9, 2);
    if (lives <= 0) {
      finish(false);
      return;
    }
    resetBall();
    shell.setStatus(`${lives} lives left`, "playing");
    shell.announce(`${lives} lives left. Click or press Space to launch.`);
  };

  const finish = (won) => {
    if (finished) return;
    finished = true;
    running = false;
    shell.setScore(score, true);
    shell.setStatus(won ? "Wall cleared" : "Run ended", won ? "ready" : "paused");
    shell.showOverlay({
      kicker: won ? "Sector clear" : "Run ended",
      title: won ? "Prism broken." : "Core lost.",
      text: won
        ? "Every prism in the wall is gone. The core held. Take the clear and try a cleaner line."
        : "The core slipped past the barrier. Tighten the paddle line and break the wall again.",
      actionLabel: "Play again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${score} points / ${blocksLeft} blocks left / ${lives} lives`,
      mark: won ? "spark" : "restart",
    });
    shell.announce(won ? `Wall cleared. Score ${score}.` : `Run over. Score ${score}.`);
  };

  const start = () => {
    reset();
    running = true;
    paused = false;
    shell.hideOverlay();
    shell.setPaused(false);
    shell.setStatus("In play", "playing");
    shell.announce("Prism Breaker started. Move the barrier and launch the core.");
    stage.clock.getDelta();
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
        title: "Hold the line.",
        text: "The prism wall will wait. Resume when you are ready, or start a fresh run.",
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

  const clampPaddle = () => {
    const limit = ARENA.halfW - PADDLE_W / 2 - 0.15;
    targetX = clamp(targetX, -limit, limit);
    paddleX = clamp(paddleX, -limit, limit);
  };

  const collide = () => {
    if (ballPos.x < -ARENA.halfW + BALL_R) {
      ballPos.x = -ARENA.halfW + BALL_R;
      ballVel.x = Math.abs(ballVel.x);
      particles.emit(ballPos, 5, "#58e5ff", 2.2, 0.35);
    } else if (ballPos.x > ARENA.halfW - BALL_R) {
      ballPos.x = ARENA.halfW - BALL_R;
      ballVel.x = -Math.abs(ballVel.x);
      particles.emit(ballPos, 5, "#58e5ff", 2.2, 0.35);
    }
    if (ballPos.y > ARENA.top - BALL_R) {
      ballPos.y = ARENA.top - BALL_R;
      ballVel.y = -Math.abs(ballVel.y);
      particles.emit(ballPos, 5, "#58e5ff", 2.2, 0.35);
    } else if (ballPos.y < ARENA.bottom + BALL_R) {
      ballPos.y = ARENA.bottom + BALL_R;
      ballVel.y = Math.abs(ballVel.y);
      particles.emit(ballPos, 5, "#58e5ff", 2.2, 0.35);
    }
    if (ballPos.z < ARENA.back + BALL_R) {
      ballPos.z = ARENA.back + BALL_R;
      ballVel.z = Math.abs(ballVel.z);
    }

    if (ballVel.z < 0 && ballPos.z - BALL_R <= ARENA.brickZ + BRICK_D / 2) {
      for (const brick of bricks) {
        if (!brick.alive) continue;
        if (
          Math.abs(ballPos.x - brick.x) <= BRICK_W / 2 + BALL_R &&
          Math.abs(ballPos.y - brick.y) <= BRICK_H / 2 + BALL_R
        ) {
          breakBrick(brick);
          ballPos.z = ARENA.brickZ + BRICK_D / 2 + BALL_R;
          ballVel.z = Math.abs(ballVel.z);
          speed = Math.min(speed + 0.22, 18);
          ballVel.setLength(speed);
          break;
        }
      }
    }

    if (ballVel.z > 0 && ballPos.z + BALL_R >= ARENA.paddleZ - 0.15) {
      if (Math.abs(ballPos.x - paddleX) <= PADDLE_W / 2 + BALL_R) {
        ballPos.z = ARENA.paddleZ - 0.15 - BALL_R;
        ballVel.z = -Math.abs(ballVel.z);
        ballVel.x += (ballPos.x - paddleX) * 1.8;
        ballVel.x = clamp(ballVel.x, -7, 7);
        ballVel.setLength(speed);
        particles.emit(ballPos, 9, "#c9ff4a", 2.6, 0.4);
      } else if (ballPos.z > ARENA.paddleZ + 1.5) {
        loseLife();
      }
    }
    if (ballPos.z > ARENA.paddleZ + 2) loseLife();
  };

  const update = (dt) => {
    time += dt;
    const keyStep = 12 * dt;
    const left = input.down("ArrowLeft", "KeyA");
    const right = input.down("ArrowRight", "KeyD");
    if (left) targetX -= keyStep;
    if (right) targetX += keyStep;
    if (!left && !right && input.pointer.active) {
      targetX = input.pointer.ndcX * (ARENA.halfW - PADDLE_W / 2 - 0.15);
    }
    clampPaddle();
    paddleX = lerp(paddleX, targetX, 1 - Math.exp(-14 * dt));
    paddle.position.x = paddleX;
    paddleGlow.position.x = paddleX;

    if (input.consumePress("Space", " ")) launch();
    if (input.consumeTap()) launch();

    if (attached) {
      ballPos.set(paddleX, 0.6, ARENA.paddleZ - 0.7);
      syncBall();
    } else {
      const steps = 2;
      const h = dt / steps;
      for (let i = 0; i < steps && running; i += 1) {
        ballPos.addScaledVector(ballVel, h);
        collide();
      }
      syncBall();
    }

    bricks.forEach((brick) => {
      if (!brick.alive && brick.mesh.visible) {
        brick.shrink = Math.max(0, brick.shrink - dt * 6);
        brick.mesh.scale.setScalar(Math.max(0.001, brick.shrink));
        if (brick.shrink <= 0) brick.mesh.visible = false;
      }
    });

    particles.update(dt);

    shake = Math.max(0, shake - dt * 1.8);
    camera.position.set(
      BASE_CAM.x + Math.sin(time * 57) * shake,
      BASE_CAM.y + Math.cos(time * 43) * shake * 0.5,
      BASE_CAM.z,
    );
    camera.lookAt(0, 0.7, -1.5);

    if (attached) targetX = clamp(targetX, -ARENA.halfW + PADDLE_W / 2, ARENA.halfW - PADDLE_W / 2);
    ball.rotation.x += dt * 2.2;
    ball.rotation.y += dt * 3.1;
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
      state: () => ({ game: "prism-breaker", score, lives, blocksLeft, speed, attached, running, paused }),
      win: () => finish(true),
      lose: () => finish(false),
    };
  }

  reset();
  shell.showOverlay({
    kicker: "Racing the wall / 3D",
    title: "Prism Breaker 3D",
    text: "Break the prism wall in a real 3D arena. Move the energy barrier, keep the core alive and clear every block.",
    actionLabel: "Start run",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Move: mouse / touch / A-D · Launch: click / Space",
    mark: "play",
  });
  shell.setStatus("Ready to play");
  renderer.setAnimationLoop(animate);

  return {
    destroy() {
      dispose();
      shell.canvas.style.cursor = "";
    },
  };
}
