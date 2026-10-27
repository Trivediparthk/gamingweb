import {
  THREE,
  createStage,
  addStudioLights,
  ParticleBurst,
  Input,
  makeGlowTexture,
  clamp,
  rand,
  show3DError,
} from "./three-kit.js";

export default function createTargetTap3D(shell) {
  let stage;
  try {
    stage = createStage(shell, {
      fov: 58,
      background: "#04070f",
      fogColor: "#04070f",
      fogNear: 22,
      fogFar: 72,
    });
  } catch (error) {
    show3DError(shell, error.message);
    return { destroy() {} };
  }

  const { renderer, scene, camera, dispose } = stage;
  const BASE_CAM = new THREE.Vector3(0, 2.4, 8.5);
  const ROUND_SECONDS = 30;
  const TARGET_COLORS = ["#ff8666", "#8c70ff", "#58e5ff", "#c9ff4a", "#ffd166"];
  const MUZZLE = new THREE.Vector3(0, -1.05, 5.6);
  camera.position.copy(BASE_CAM);
  camera.lookAt(0, 0.8, -6);

  addStudioLights(scene, {
    key: "#fff2e2",
    accentA: "#c9ff4a",
    accentB: "#8c70ff",
    keyIntensity: 1.9,
  });
  scene.add(new THREE.AmbientLight(0x2c4a7a, 1.05));
  const rangeLight = new THREE.PointLight("#c9ff4a", 85, 36, 2);
  rangeLight.position.set(0, 4.6, -8);
  scene.add(rangeLight);
  const fillLight = new THREE.PointLight("#58e5ff", 45, 28, 2);
  fillLight.position.set(0, 1.6, -1);
  scene.add(fillLight);

  // Range shell
  const wallCanvas = document.createElement("canvas");
  wallCanvas.width = 1024;
  wallCanvas.height = 512;
  const wctx = wallCanvas.getContext("2d");
  const wallGradient = wctx.createLinearGradient(0, 0, 0, 512);
  wallGradient.addColorStop(0, "#07121d");
  wallGradient.addColorStop(1, "#03070d");
  wctx.fillStyle = wallGradient;
  wctx.fillRect(0, 0, 1024, 512);
  wctx.strokeStyle = "rgba(88,229,255,0.14)";
  wctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += 64) {
    wctx.beginPath();
    wctx.moveTo(x, 0);
    wctx.lineTo(x, 512);
    wctx.stroke();
  }
  for (let y = 0; y <= 512; y += 64) {
    wctx.beginPath();
    wctx.moveTo(0, y);
    wctx.lineTo(1024, y);
    wctx.stroke();
  }
  wctx.fillStyle = "#c9ff4a";
  wctx.font = "700 26px Arial";
  wctx.fillText("ROBLOXSPLAY", 48, 62);
  wctx.fillStyle = "rgba(255,255,255,0.92)";
  wctx.font = "800 74px Arial";
  wctx.fillText("AIM RANGE", 48, 168);
  wctx.fillStyle = "rgba(88,229,255,0.8)";
  wctx.font = "600 22px Arial";
  wctx.fillText("30 SECOND SCORE ATTACK", 50, 210);
  wctx.strokeStyle = "rgba(201,255,74,0.55)";
  wctx.lineWidth = 4;
  wctx.strokeRect(46, 238, 932, 210);
  wctx.strokeStyle = "rgba(140,112,255,0.45)";
  wctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    wctx.beginPath();
    wctx.arc(780 + i * 36, 340, 16 + i * 1.5, 0, Math.PI * 2);
    wctx.stroke();
  }
  wctx.fillStyle = "rgba(88,229,255,0.55)";
  wctx.fillRect(48, 466, 928, 6);
  const wallTexture = new THREE.CanvasTexture(wallCanvas);
  wallTexture.colorSpace = THREE.SRGBColorSpace;
  const backdropViolet = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#8c70ff", "rgba(0,0,0,0)"),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  backdropViolet.position.set(0, 2, -18);
  backdropViolet.scale.set(30, 18, 1);
  scene.add(backdropViolet);
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 18),
    new THREE.MeshStandardMaterial({
      map: wallTexture,
      emissive: "#0a1a2a",
      emissiveIntensity: 1.15,
      roughness: 0.55,
      metalness: 0.3,
    }),
  );
  backWall.position.set(0, 3, -21);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 32),
    new THREE.MeshStandardMaterial({ color: "#081422", emissive: "#0b2a3a", emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.6 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.6, 0);
  floor.receiveShadow = true;
  scene.add(floor);
  const floorGrid = new THREE.GridHelper(32, 32, "#1c5f78", "#0a1a26");
  floorGrid.position.y = -2.59;
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.55;
  scene.add(floorGrid);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 32),
    new THREE.MeshStandardMaterial({ color: "#050a12", roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.2, 0);
  scene.add(ceiling);

  const stripMat = (color, opacity = 0.9) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity,
      roughness: 0.2,
      metalness: 0.2,
    });
  for (const x of [-7, 0, 7]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(8, 0.09, 0.35), stripMat(x === 0 ? "#c9ff4a" : "#58e5ff", 0.85));
    strip.position.set(x, 6.1, -8);
    scene.add(strip);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 8.8, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: x === 0 ? "#c9ff4a" : "#58e5ff",
        transparent: true,
        opacity: 0.045,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    cone.position.set(x, 1.8, -8);
    scene.add(cone);
  }

  for (const x of [-10, 10]) {
    const side = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 9),
      new THREE.MeshStandardMaterial({ color: "#050b14", roughness: 0.6, metalness: 0.35, side: THREE.DoubleSide }),
    );
    side.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    side.position.set(x, 1.8, -8);
    scene.add(side);
    for (let i = 0; i < 3; i += 1) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 22), stripMat(i === 1 ? "#8c70ff" : "#58e5ff", 0.55));
      line.position.set(x - Math.sign(x) * 0.08, 0.4 + i * 1.5, -8);
      scene.add(line);
    }
  }

  // Dust
  const dustCount = 360;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = rand(-9, 9);
    dustPositions[i * 3 + 1] = rand(-2.2, 5.6);
    dustPositions[i * 3 + 2] = rand(-20, 4);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: "#9fd8ff",
      size: 0.07,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  scene.add(dust);

  // Timer display and bar
  const timerCanvas = document.createElement("canvas");
  timerCanvas.width = 256;
  timerCanvas.height = 128;
  const timerCtx = timerCanvas.getContext("2d");
  const timerTexture = new THREE.CanvasTexture(timerCanvas);
  timerTexture.colorSpace = THREE.SRGBColorSpace;
  const timerSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: timerTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  timerSprite.position.set(0, 4.2, -19.6);
  timerSprite.scale.set(3.2, 1.6, 1);
  scene.add(timerSprite);

  const barBack = new THREE.Mesh(
    new THREE.BoxGeometry(9.4, 0.18, 0.06),
    new THREE.MeshStandardMaterial({ color: "#0b1622", emissive: "#0a1a2a", emissiveIntensity: 0.4, roughness: 0.4, metalness: 0.3 }),
  );
  barBack.position.set(0, -1.8, -19.6);
  scene.add(barBack);
  const barFill = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.14, 0.08),
    new THREE.MeshStandardMaterial({ color: "#c9ff4a", emissive: "#c9ff4a", emissiveIntensity: 1.8, roughness: 0.2, metalness: 0.2 }),
  );
  barFill.position.set(0, -1.8, -19.55);
  scene.add(barFill);

  const targets = [];
  const tracers = [];
  const floaters = [];
  const particles = new ParticleBurst(scene, { max: 380, size: 0.11 });
  const raycaster = new THREE.Raycaster();
  const input = new Input(shell.canvas, {
    signal: stage.signal,
    isActive: () => running && !paused && !shell.overlayVisible(),
  });

  const reticle = document.createElement("div");
  reticle.setAttribute("aria-hidden", "true");
  reticle.style.cssText =
    "position:absolute;left:50%;top:50%;width:38px;height:38px;margin-left:-19px;margin-top:-19px;border:1.5px solid rgba(201,255,74,.9);border-radius:50%;box-shadow:0 0 14px rgba(201,255,74,.45), inset 0 0 10px rgba(201,255,74,.18);pointer-events:none;z-index:6;display:none;transform:scale(1);transition:transform 80ms ease, border-color 80ms ease;background:radial-gradient(circle, rgba(201,255,74,.95) 0 2px, transparent 3px);";
  shell.stage.appendChild(reticle);

  let running = false;
  let paused = false;
  let finished = false;
  let timeLeft = ROUND_SECONDS;
  let elapsed = 0;
  let score = 0;
  let combo = 0;
  let bestCombo = 0;
  let hits = 0;
  let taps = 0;
  let spawnTimer = 0.4;
  let time = 0;
  let recoil = 0;
  let aimX = 0;
  let aimY = 0;
  let usingPointer = false;
  let lastSecond = -1;

  shell.canvas.style.cursor = "none";
  shell.canvas.addEventListener("pointermove", () => {
    usingPointer = true;
  }, { signal: stage.signal });

  const drawTimer = () => {
    const seconds = Math.max(0, Math.ceil(timeLeft));
    timerCtx.clearRect(0, 0, 256, 128);
    timerCtx.textAlign = "center";
    timerCtx.textBaseline = "middle";
    timerCtx.font = "800 92px Arial";
    timerCtx.fillStyle = seconds <= 8 ? "#ff8666" : "#eaffc8";
    timerCtx.shadowColor = seconds <= 8 ? "#ff8666" : "#c9ff4a";
    timerCtx.shadowBlur = 26;
    timerCtx.fillText(String(seconds), 128, 58);
    timerCtx.font = "700 20px Arial";
    timerCtx.fillStyle = "rgba(201,255,74,.8)";
    timerCtx.fillText("SECONDS", 128, 108);
    timerTexture.needsUpdate = true;
  };

  const updateHud = () => {
    shell.setScore(score);
    shell.setExtra([
      { label: "Time", value: `${Math.max(0, Math.ceil(timeLeft))}s` },
      { label: "Combo", value: combo },
    ]);
  };

  const disposeGroup = (group) => {
    scene.remove(group);
    group.traverse((child) => {
      child.geometry?.dispose?.();
      if (child.material) {
        const list = Array.isArray(child.material) ? child.material : [child.material];
        list.forEach((material) => material.dispose?.());
      }
    });
  };

  const spawnTarget = () => {
    const progress = clamp(elapsed / ROUND_SECONDS, 0, 1);
    const radius = 1.08 - progress * 0.2;
    const lifetime = 2.05 - progress * 0.7;
    let base = null;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const candidate = new THREE.Vector3(rand(-6, 6), rand(-0.4, 3.5), rand(-15, -6));
      if (targets.every((target) => target.base.distanceTo(candidate) > 2.6)) {
        base = candidate;
        break;
      }
    }
    if (!base) base = new THREE.Vector3(rand(-5, 5), rand(0, 3), rand(-15, -9));

    const color = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];
    const group = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.16,
        metalness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
    );
    sphere.castShadow = true;
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 20, 16),
      new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: color, emissiveIntensity: 2.4, roughness: 0.1, metalness: 0.2 }),
    );
    const ringA = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.035, 8, 56),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8, transparent: true, opacity: 0.85 }),
    );
    ringA.rotation.x = Math.PI / 2.4;
    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(1.44, 0.025, 8, 56),
      new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: color, emissiveIntensity: 0.9, transparent: true, opacity: 0.5 }),
    );
    ringB.rotation.y = Math.PI / 2.2;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(color, "rgba(0,0,0,0)"),
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(3.1);
    group.add(sphere, core, ringA, ringB, glow);
    group.position.copy(base);
    group.scale.setScalar(radius);
    scene.add(group);
    group.updateMatrixWorld(true);

    const target = {
      group,
      sphere,
      ringA,
      ringB,
      glow,
      base,
      radius,
      age: 0,
      life: lifetime,
      color,
      phase: rand(0, Math.PI * 2),
    };
    sphere.userData.target = target;
    targets.push(target);
  };

  const removeTarget = (target, expired) => {
    const index = targets.indexOf(target);
    if (index >= 0) targets.splice(index, 1);
    if (expired) {
      combo = 0;
      particles.emit(target.group.position, 8, "#ff8666", 2.4, 0.5);
      updateHud();
    }
    disposeGroup(target.group);
  };

  const addTracer = (end, color) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([MUZZLE, end]);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    tracers.push({ line, life: 0.14, max: 0.14 });
  };

  const addFloater = (position, text, color) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.font = "800 58px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.fillText(text, 128, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1, depthWrite: false }),
    );
    sprite.position.copy(position);
    sprite.scale.set(1.8, 0.9, 1);
    scene.add(sprite);
    floaters.push({ sprite, life: 0.75, max: 0.75 });
  };

  const flashReticle = (hit) => {
    reticle.style.borderColor = hit ? "rgba(201,255,74,.95)" : "rgba(255,134,102,.95)";
    reticle.style.transform = "scale(1.35)";
    window.setTimeout(() => {
      reticle.style.borderColor = "rgba(201,255,74,.9)";
      reticle.style.transform = "scale(1)";
    }, 110);
  };

  const shoot = (ndcX, ndcY) => {
    if (!running || paused || finished) return;
    taps += 1;
    recoil = Math.max(recoil, 0.2);
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const hitsList = raycaster.intersectObjects(targets.map((target) => target.sphere), false);
    if (hitsList.length) {
      const hit = hitsList[0];
      const target = hit.object.userData.target;
      if (!target) return;
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      hits += 1;
      const points = 10 + Math.min(20, combo * 2);
      score += points;
      particles.emit(hit.point, 24, target.color, 4.2, 0.7, 2);
      addTracer(hit.point, target.color);
      addFloater(hit.point, `+${points}`, target.color);
      flashReticle(true);
      removeTarget(target, false);
      updateHud();
      if (combo > 0 && combo % 5 === 0) shell.announce(`${combo} hit combo.`);
    } else {
      combo = 0;
      const end = raycaster.ray.at(30, new THREE.Vector3());
      particles.emit(end, 5, "#ff8666", 1.8, 0.4);
      addTracer(end, "#ff8666");
      addFloater(end, "MISS", "#ff8666");
      flashReticle(false);
      updateHud();
    }
  };

  const reset = () => {
    targets.slice().forEach((target) => removeTarget(target, false));
    tracers.slice().forEach((tracer) => {
      scene.remove(tracer.line);
      tracer.line.geometry.dispose();
      tracer.line.material.dispose();
    });
    tracers.length = 0;
    floaters.slice().forEach((floater) => {
      scene.remove(floater.sprite);
      floater.sprite.material.map?.dispose();
      floater.sprite.material.dispose();
    });
    floaters.length = 0;
    timeLeft = ROUND_SECONDS;
    elapsed = 0;
    score = 0;
    combo = 0;
    bestCombo = 0;
    hits = 0;
    taps = 0;
    spawnTimer = 0.4;
    time = 0;
    recoil = 0;
    aimX = 0;
    aimY = 0;
    usingPointer = false;
    lastSecond = -1;
    running = true;
    paused = false;
    finished = false;
    reticle.style.display = "block";
    barFill.scale.x = 1;
    barFill.position.x = 0;
    barFill.material.color.set("#c9ff4a");
    barFill.material.emissive.set("#c9ff4a");
    shell.setScore(0);
    shell.setBest(shell.best);
    updateHud();
    drawTimer();
    shell.setPaused(false);
    stage.clock.getDelta();
  };

  const start = () => {
    reset();
    spawnTarget();
    spawnTarget();
    spawnTimer = 0.7;
    shell.hideOverlay();
    shell.setStatus("In play", "playing");
    shell.announce("Target range live. Shoot as many targets as you can in thirty seconds.");
    stage.clock.getDelta();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    running = false;
    paused = false;
    reticle.style.display = "none";
    timeLeft = Math.max(0, timeLeft);
    const accuracy = taps > 0 ? Math.round((hits / taps) * 100) : 0;
    shell.setScore(score, true);
    shell.setStatus("Range closed", "paused");
    shell.showOverlay({
      kicker: "Range closed",
      title: "Time.",
      text: "Thirty seconds gone. Tighten the crosshair, chain the combo and push the score higher.",
      actionLabel: "Shoot again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${hits} hits / ${accuracy}% accuracy / best combo ${bestCombo}`,
      mark: "restart",
    });
    shell.announce(`Range closed. ${hits} hits, ${accuracy} percent accuracy, score ${score}.`);
  };

  const pause = () => {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      reticle.style.display = "block";
      shell.setStatus("In play", "playing");
      stage.clock.getDelta();
    } else {
      paused = true;
      shell.setPaused(true);
      reticle.style.display = "none";
      shell.showOverlay({
        kicker: "Game paused",
        title: "Range on hold.",
        text: "The clock will wait. Resume when you are ready, or start a fresh thirty seconds.",
        actionLabel: "Resume",
        onAction: () => {
          paused = false;
          shell.setPaused(false);
          reticle.style.display = "block";
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
    timeLeft -= dt;
    elapsed = ROUND_SECONDS - timeLeft;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      finish();
      return;
    }

    const keyStep = 1.15 * dt;
    const left = input.down("ArrowLeft", "KeyA");
    const right = input.down("ArrowRight", "KeyD");
    const up = input.down("ArrowUp", "KeyW");
    const down = input.down("ArrowDown", "KeyS");
    if (left) { aimX -= keyStep; usingPointer = false; }
    if (right) { aimX += keyStep; usingPointer = false; }
    if (up) { aimY += keyStep; usingPointer = false; }
    if (down) { aimY -= keyStep; usingPointer = false; }
    if (usingPointer && input.pointer.active) {
      aimX = input.pointer.ndcX;
      aimY = input.pointer.ndcY;
    }
    aimX = clamp(aimX, -0.94, 0.94);
    aimY = clamp(aimY, -0.82, 0.82);

    if (input.consumePress("Space", "Enter")) shoot(aimX, aimY);
    if (input.consumeTap()) {
      aimX = input.pointer.ndcX;
      aimY = input.pointer.ndcY;
      usingPointer = true;
      shoot(aimX, aimY);
    }

    reticle.style.left = `${(aimX * 0.5 + 0.5) * 100}%`;
    reticle.style.top = `${(-aimY * 0.5 + 0.5) * 100}%`;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const maxTargets = elapsed > 18 ? 3 : 2;
      if (targets.length < maxTargets) spawnTarget();
      spawnTimer = rand(0.5, 0.82);
    }

    for (let i = targets.length - 1; i >= 0; i -= 1) {
      const target = targets[i];
      target.age += dt;
      if (target.age >= target.life) {
        removeTarget(target, true);
        continue;
      }
      const lifeRatio = 1 - target.age / target.life;
      target.group.scale.setScalar(target.radius * (0.52 + 0.48 * lifeRatio));
      target.group.position.x = target.base.x + Math.sin(time * 1.2 + target.phase) * 0.28;
      target.group.position.y = target.base.y + Math.sin(time * 2.1 + target.phase) * 0.11;
      target.group.position.z = target.base.z;
      target.ringA.rotation.z += dt * 1.6;
      target.ringB.rotation.x += dt * 1.2;
      target.glow.material.opacity = 0.28 + Math.sin(time * 3 + target.phase) * 0.08;
    }

    for (let i = tracers.length - 1; i >= 0; i -= 1) {
      const tracer = tracers[i];
      tracer.life -= dt;
      if (tracer.life <= 0) {
        scene.remove(tracer.line);
        tracer.line.geometry.dispose();
        tracer.line.material.dispose();
        tracers.splice(i, 1);
      } else {
        tracer.line.material.opacity = tracer.life / tracer.max;
      }
    }

    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const floater = floaters[i];
      floater.life -= dt;
      if (floater.life <= 0) {
        scene.remove(floater.sprite);
        floater.sprite.material.map?.dispose();
        floater.sprite.material.dispose();
        floaters.splice(i, 1);
      } else {
        floater.sprite.position.y += dt * 0.8;
        floater.sprite.material.opacity = floater.life / floater.max;
      }
    }

    particles.update(dt);
    dust.rotation.y += dt * 0.008;

    const ratio = clamp(timeLeft / ROUND_SECONDS, 0, 1);
    barFill.scale.x = Math.max(0.001, ratio);
    barFill.position.x = -4.5 + 4.5 * ratio;
    const low = timeLeft <= 8;
    barFill.material.color.set(low ? "#ff8666" : "#c9ff4a");
    barFill.material.emissive.set(low ? "#ff8666" : "#c9ff4a");

    const second = Math.ceil(timeLeft);
    if (second !== lastSecond) {
      lastSecond = second;
      drawTimer();
      updateHud();
    }

    recoil = Math.max(0, recoil - dt * 1.4);
    camera.position.set(BASE_CAM.x, BASE_CAM.y + recoil * 0.6, BASE_CAM.z + recoil * 1.8);
    camera.lookAt(0, 0.8, -6);

    reticle.style.boxShadow = `0 0 14px rgba(201,255,74,${0.35 + (combo > 0 ? 0.08 : 0)}), inset 0 0 10px rgba(201,255,74,.18)`;
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
      state: () => ({ game: "target-tap", score, timeLeft, combo, bestCombo, hits, taps, targets: targets.length, running, paused }),
      screenTargets: () => targets.map((target) => {
        const v = target.group.position.clone().project(camera);
        return { x: v.x, y: v.y, z: v.z };
      }),
      finish: () => finish(),
      spawnTargets: () => { spawnTarget(); spawnTarget(); },
    };
  }

  reset();
  running = false;
  reticle.style.display = "none";
  shell.showOverlay({
    kicker: "Skill / 3D / 009",
    title: "Target Tap 3D",
    text: "A 3D shooting range with targets at real depth. Track the spheres, chain the combo and score as much as you can in thirty seconds.",
    actionLabel: "Enter range",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Aim: mouse / touch / arrows · Shoot: click / tap / Space",
    mark: "play",
  });
  shell.setStatus("Ready to play");
  renderer.setAnimationLoop(animate);

  return {
    destroy() {
      reticle.remove();
      shell.canvas.style.cursor = "";
      dispose();
    },
  };
}
