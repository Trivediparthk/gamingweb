import { createRunnerScene } from "./runner3d/scene.js";
import { loadRunnerAssets } from "./runner3d/assets.js";
import { createEnvironment } from "./runner3d/environment.js";
import { createPlayer } from "./runner3d/player.js";
import { createObstacles } from "./runner3d/obstacles.js";
import { createCollectibles } from "./runner3d/collectibles.js";
import { RunnerAudio } from "./runner3d/audio.js";
import { createRunnerUI } from "./runner3d/ui.js";
import { bindRunnerControls } from "./runner3d/controls.js";
import { THREE, ParticleBurst, clamp, lerp, rand, randInt, show3DError } from "./three-kit.js";
import { storageGet, storageSet, isTouchDevice } from "../utilities.js";

const QUALITY_KEY = "robloxsplay:runner:quality";
const SOUND_KEY = "robloxsplay:runner:sound";
const BASE_SPEED = 13;
const POWER_TOTAL = { shield: 12, magnet: 8, boost: 5 };
const POWER_ORDER = ["shield", "magnet", "boost"];

export default function createRuinRunner(shell) {
  const storedQuality = storageGet(QUALITY_KEY, "medium");
  let quality = ["low", "medium", "high"].includes(storedQuality) ? storedQuality : "medium";
  let soundOn = storageGet(SOUND_KEY, "on") !== "off";

  let runnerScene;
  try {
    runnerScene = createRunnerScene(shell, quality);
  } catch (error) {
    show3DError(shell, error.message);
    return { destroy() {} };
  }

  const scene = runnerScene.scene;
  const audio = new RunnerAudio({ enabled: soundOn });
  let ui;
  let world = null;
  let assets = null;
  let disposed = false;
  let phase = "loading";
  let pausedFrom = "running";
  let countdown = 0;
  let lastCountdownLabel = "";
  let distance = 0;
  let coins = 0;
  let score = 0;
  let bonusScore = 0;
  let elapsed = 0;
  let speed = BASE_SPEED;
  let shieldTimer = 0;
  let magnetTimer = 0;
  let boostTimer = 0;
  let invulnerable = 0;
  let shake = 0;
  let moveAccumulator = 0;
  let nextSpawnGap = 20;
  let nextPowerupAt = 210;
  let hudTimer = 0;
  let lastScore = -1;
  let lastPowerKey = "";
  let gameOverTimer = 0;
  let frameEma = 0;
  let frameSample = 0;
  let perfTimer = 0;
  let lastManualQualityAt = 0;
  let contextLost = false;
  let boostDustTimer = 0;

  const touch = isTouchDevice();
  const isDebug = new URLSearchParams(window.location.search).has("debug3d");

  function applyQuality(value, persist = true, announce = true) {
    const next = ["low", "medium", "high"].includes(value) ? value : "medium";
    quality = next;
    runnerScene.setQuality(next);
    world?.environment.setQuality(next);
    world?.collectibles.setQuality(next);
    ui?.setQuality(next);
    if (persist) storageSet(QUALITY_KEY, next);
    lastManualQualityAt = performance.now();
    if (announce) {
      ui?.showToast(`Graphics ${next.toUpperCase()}`);
      shell.announce(`Graphics quality ${next}.`);
    }
  }

  function setSound(enabled, announce = true) {
    soundOn = Boolean(enabled);
    audio.setEnabled(soundOn);
    ui?.setSound(soundOn);
    storageSet(SOUND_KEY, soundOn ? "on" : "off");
    if (soundOn) {
      audio.ensure();
      if (phase === "running" || phase === "countdown") audio.startAmbient();
      audio.duck(phase === "paused");
      if (announce) audio.ui();
    }
    if (announce) shell.announce(soundOn ? "Sound on." : "Sound off.");
  }

  ui = createRunnerUI(shell, {
    soundEnabled: soundOn,
    quality,
    onSound: (enabled) => setSound(enabled),
    onQuality: (value) => applyQuality(value, true, true),
  });
  ui.showLoading();
  shell.setStatus("Loading 3D world");

  shell.canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
  });
  shell.canvas.addEventListener("webglcontextrestored", () => {
    contextLost = false;
  });

  const updateHud = (force = false) => {
    if (force || score !== lastScore) {
      lastScore = score;
      shell.setScore(score);
    }
    if (force || hudTimer <= 0) {
      hudTimer = 0.12;
      shell.setExtra([
        { label: "Distance", value: `${Math.floor(distance)}m` },
        { label: "Coins", value: coins },
      ]);
    }
  };

  const activePower = () => {
    for (const type of POWER_ORDER) {
      const seconds = type === "shield" ? shieldTimer : type === "magnet" ? magnetTimer : boostTimer;
      if (seconds > 0) return { type, seconds, total: POWER_TOTAL[type] };
    }
    return null;
  };

  const refreshPowerUi = () => {
    const power = activePower();
    const key = power ? `${power.type}:${Math.ceil(power.seconds)}` : "none";
    if (key === lastPowerKey) return;
    lastPowerKey = key;
    if (power) ui.setPowerup(power.type, power.seconds, power.total);
    else ui.hidePowerup();
  };

  function resetRun() {
    clearTimeout(gameOverTimer);
    distance = 0;
    coins = 0;
    score = 0;
    bonusScore = 0;
    elapsed = 0;
    speed = BASE_SPEED;
    shieldTimer = 0;
    magnetTimer = 0;
    boostTimer = 0;
    invulnerable = 0;
    shake = 0;
    moveAccumulator = 0;
    nextSpawnGap = 20;
    nextPowerupAt = 210;
    hudTimer = 0;
    lastScore = -1;
    lastPowerKey = "";
    boostDustTimer = 0;
    if (!world) return;
    world.player.reset();
    world.environment.reset();
    world.obstacles.reset();
    world.collectibles.reset();
    world.shieldBubble.visible = false;
    world.magnetRing.visible = false;
    ui.hidePowerup();
    ui.hideCountdown();
    shell.setScore(0);
    shell.setBest(shell.best);
    updateHud(true);
    runnerScene.camera.fov = 56;
    runnerScene.camera.updateProjectionMatrix();
  }

  function seedAhead() {
    const seeds = [
      [-46, 0.08],
      [-76, 0.12],
      [-106, 0.16],
    ];
    seeds.forEach(([z, difficulty]) => {
      const result = world.obstacles.spawnPattern(difficulty, z);
      const freeLane = result.freeLanes[0] ?? randInt(0, 2);
      world.collectibles.spawnCoinLine(freeLane, z, randInt(4, 7), Math.random() < 0.4);
    });
  }

  function start() {
    if (!world) return;
    resetRun();
    seedAhead();
    phase = "countdown";
    countdown = 3.35;
    lastCountdownLabel = "";
    shell.hideOverlay();
    shell.setPaused(false);
    shell.setStatus("Get ready", "playing");
    ui.showCountdown("3");
    ui.showHint(touch ? "Swipe to move · swipe up to jump · down to slide" : "Arrows / WASD · Space jump · Down slide");
    if (soundOn) {
      audio.ensure();
      audio.startAmbient();
    }
    audio.duck(false);
    audio.countdown(false);
    runnerScene.clock.getDelta();
    shell.announce("Ruin Runner. Three, two, one, go.");
  }

  function togglePause() {
    if (phase === "paused") {
      phase = pausedFrom;
      shell.setPaused(false);
      shell.hideOverlay();
      audio.duck(false);
      if (phase === "countdown") {
        ui.showCountdown(lastCountdownLabel || "3");
        shell.setStatus("Get ready", "playing");
      } else {
        shell.setStatus("In play", "playing");
      }
      runnerScene.clock.getDelta();
      return;
    }
    if (phase !== "countdown" && phase !== "running") return;
    pausedFrom = phase;
    phase = "paused";
    shell.setPaused(true);
    audio.duck(true);
    ui.hideCountdown();
    ui.hideHint();
    shell.setStatus("Paused", "paused");
    shell.showOverlay({
      kicker: "Run paused",
      title: "Hold the line.",
      text: "The ruins will wait. Resume the run, or start again from the trailhead.",
      actionLabel: "Resume",
      onAction: () => {
        phase = pausedFrom;
        shell.setPaused(false);
        shell.hideOverlay();
        audio.duck(false);
        if (phase === "countdown") {
          ui.showCountdown(lastCountdownLabel || "3");
          shell.setStatus("Get ready", "playing");
        } else {
          shell.setStatus("In play", "playing");
        }
        runnerScene.clock.getDelta();
      },
      secondaryLabel: "Restart",
      onSecondary: start,
      mark: "pause",
    });
    ui.decorateOverlay("pause");
  }

  function gameOver() {
    if (phase === "over" || !world) return;
    phase = "over";
    world.player.setGameOver();
    ui.hideCountdown();
    ui.hideHint();
    ui.hidePowerup();
    world.shieldBubble.visible = false;
    world.magnetRing.visible = false;
    world.effects.emit({ x: world.player.laneX(), y: world.player.height + 0.9, z: 0 }, 54, "#ff8666", 6, 1.0, 2);
    world.effects.emit({ x: world.player.laneX(), y: world.player.height + 0.9, z: 0 }, 28, "#ffcf6a", 4, 0.8, 1);
    shake = 1.1;
    audio.hit();
    audio.gameover();
    audio.duck(true);
    shell.setScore(score, true);
    shell.setStatus("Run ended", "paused");
    shell.announce(`Run over. Score ${score}. Distance ${Math.floor(distance)} metres.`);
    clearTimeout(gameOverTimer);
    gameOverTimer = window.setTimeout(() => {
      if (phase !== "over") return;
      shell.showOverlay({
        kicker: "The ruins claimed this run",
        title: "Run ended.",
        text: "Read the next gate, keep the combo and push the trail further. The trailhead is always open.",
        actionLabel: "Run again",
        onAction: start,
        secondaryLabel: "All games",
        onSecondary: () => {
          window.location.href = "/all-games.html";
        },
        showScore: true,
        bestLabel: "Best score",
        hint: `${Math.floor(distance)}m · ${coins} coins · ${score} points`,
        mark: "restart",
      });
      ui.decorateOverlay("over");
    }, 650);
  }

  function collectEvents(events) {
    if (events.coins > 0) {
      coins += events.coins;
      audio.coin();
      events.coinPositions.forEach((position) => {
        world.effects.emit(position, 4, "#ffcf6a", 1.6, 0.3);
      });
    }
    events.powerups.forEach((powerup) => {
      bonusScore += 50;
      if (powerup.type === "shield") shieldTimer = POWER_TOTAL.shield;
      if (powerup.type === "magnet") magnetTimer = POWER_TOTAL.magnet;
      if (powerup.type === "boost") boostTimer = POWER_TOTAL.boost;
      audio.powerup();
      world.effects.emit(powerup.position, 24, "#ffcf6a", 4, 0.7);
      shell.announce(
        powerup.type === "shield"
          ? "Shield active. One impact will be absorbed."
          : powerup.type === "magnet"
            ? "Coin magnet active."
            : "Boost active.",
      );
    });
  }

  function obstaclesHit() {
    const collider = world.player.getCollider();
    for (const item of world.obstacles.getActive()) {
      if (!item.collider) continue;
      const col = item.collider;
      if (Math.abs(item.z) > col.halfD + collider.halfD + 0.06) continue;
      const lane = world.environment.laneX[item.lane];
      if (Math.abs(lane - collider.x) > col.halfW + collider.halfW) continue;
      if (collider.y >= col.yMax || collider.y + collider.height <= col.yMin) continue;
      if (invulnerable > 0) continue;
      if (shieldTimer > 0) {
        shieldTimer = 0;
        invulnerable = 1.5;
        shake = Math.max(shake, 0.55);
        world.obstacles.deactivate(item);
        world.effects.emit({ x: lane, y: 1.2, z: item.z }, 38, "#58e5ff", 5.5, 0.8);
        audio.shieldBreak();
        lastPowerKey = "";
        refreshPowerUi();
        shell.announce("Shield absorbed the impact.");
        continue;
      }
      gameOver();
      return false;
    }
    return true;
  }

  function spawnAhead(difficulty, moved) {
    moveAccumulator += moved;
    if (moveAccumulator >= nextSpawnGap) {
      moveAccumulator = 0;
      const result = world.obstacles.spawnPattern(difficulty, -116);
      const freeLane = result.freeLanes[0] ?? randInt(0, 2);
      world.collectibles.spawnCoinLine(freeLane, -116, randInt(5, 8), Math.random() < 0.36);
      if (Math.random() < 0.35) {
        world.collectibles.spawnCoinLine(freeLane, -126, randInt(3, 5), false);
      }
      nextSpawnGap = clamp(rand(16, 22) - difficulty * 4, 11, 22);
    }
    if (distance >= nextPowerupAt) {
      const type = POWER_ORDER[randInt(0, POWER_ORDER.length - 1)];
      const lane = randInt(0, 2);
      if (world.collectibles.spawnPowerup(type, lane, -110)) {
        nextPowerupAt = distance + rand(240, 340);
      } else {
        nextPowerupAt = distance + 80;
      }
    }
  }

  function updateCountdown(dt) {
    countdown -= dt;
    const label = countdown > 2.35 ? "3" : countdown > 1.35 ? "2" : countdown > 0.35 ? "1" : "GO";
    if (label !== lastCountdownLabel) {
      lastCountdownLabel = label;
      ui.showCountdown(label);
      audio.countdown(label === "GO");
    }
    audio.update(dt);
    audio.tick(dt);
    const pEvents = world.player.update(dt, 4);
    if (pEvents.stepped) audio.step();
    world.environment.update(dt, 4);
    runnerScene.updateEnvironmentMotion(dt, 4);
    world.effects.update(dt);
    runnerScene.updateCamera(dt, { mode: "running", playerX: world.player.laneX(), playerY: world.player.height, shake });
    if (countdown <= 0) {
      phase = "running";
      countdown = 0;
      ui.hideCountdown();
      shell.setStatus("In play", "playing");
      runnerScene.clock.getDelta();
      shell.announce("Run.");
    }
  }

  function updateRunning(dt) {
    elapsed += dt;
    const difficulty = clamp(elapsed / 80, 0, 1);
    const base = BASE_SPEED + Math.min(12.5, elapsed * 0.13);
    speed = Math.min(30, base * (boostTimer > 0 ? 1.35 : 1));
    const moved = speed * dt;
    distance += moved;
    if (elapsed > 0.1) spawnAhead(difficulty, moved);

    const pEvents = world.player.update(dt, speed);
    if (pEvents.stepped) audio.step();
    if (pEvents.landed) {
      audio.land();
      shake = Math.max(shake, 0.16);
      world.player.emitDust(8, 1.0);
    }
    audio.tick(dt);
    audio.update(dt);

    world.obstacles.update(moved, dt);
    const events = world.collectibles.update(
      dt,
      moved,
      { x: world.player.laneX(), y: world.player.height },
      magnetTimer > 0,
    );
    collectEvents(events);
    world.environment.update(dt, speed);
    runnerScene.updateEnvironmentMotion(dt, speed);

    if (shieldTimer > 0) shieldTimer = Math.max(0, shieldTimer - dt);
    if (magnetTimer > 0) magnetTimer = Math.max(0, magnetTimer - dt);
    if (boostTimer > 0) boostTimer = Math.max(0, boostTimer - dt);
    if (invulnerable > 0) invulnerable = Math.max(0, invulnerable - dt);
    shake = Math.max(0, shake - dt * 1.8);
    hudTimer -= dt;

    score = Math.floor(distance) + coins * 10 + bonusScore;
    updateHud();
    refreshPowerUi();

    world.shieldBubble.visible = shieldTimer > 0;
    if (world.shieldBubble.visible) {
      const pulse = 1 + Math.sin(elapsed * 5) * 0.02;
      world.shieldBubble.scale.setScalar(pulse);
      world.shieldBubble.material.opacity = 0.1 + Math.sin(elapsed * 4) * 0.03;
    }
    world.magnetRing.visible = magnetTimer > 0;
    if (world.magnetRing.visible) {
      world.magnetRing.rotation.z += dt * 2.4;
      world.magnetRing.material.opacity = 0.45 + Math.sin(elapsed * 4) * 0.15;
    }

    if (boostTimer > 0) {
      boostDustTimer -= dt;
      if (boostDustTimer <= 0) {
        boostDustTimer = 0.055;
        world.effects.emit(
          { x: world.player.laneX() + rand(-0.4, 0.4), y: 0.15, z: 0.6 },
          2,
          Math.random() < 0.5 ? "#ffcf6a" : "#58e5ff",
          2.4,
          0.45,
        );
      }
    }

    const targetFov = boostTimer > 0 ? 63 : 56;
    if (Math.abs(runnerScene.camera.fov - targetFov) > 0.05) {
      runnerScene.camera.fov = lerp(runnerScene.camera.fov, targetFov, 1 - Math.exp(-3.5 * dt));
      runnerScene.camera.updateProjectionMatrix();
    }

    if (!obstaclesHit()) return;
    if (phase !== "running") return;

    world.effects.update(dt);
    runnerScene.updateCamera(dt, {
      mode: "running",
      playerX: world.player.laneX(),
      playerY: world.player.height,
      shake,
    });

    frameEma = frameEma ? lerp(frameEma, frameSample || dt, 0.06) : frameSample || dt;
    perfTimer += dt;
    if (perfTimer > 2.2) {
      perfTimer = 0;
      const fps = 1 / Math.max(0.0001, frameEma);
      if (fps < 42 && quality !== "low" && performance.now() - lastManualQualityAt > 7000) {
        applyQuality(quality === "high" ? "medium" : "low", false, false);
        ui.showToast("Graphics lowered to keep the run smooth");
      }
    }
  }

  function updateOver(dt) {
    world.player.update(dt, 0);
    world.effects.update(dt);
    world.environment.update(dt, 0);
    runnerScene.updateEnvironmentMotion(dt, 0);
    shake = Math.max(0, shake - dt * 1.4);
    runnerScene.updateCamera(dt, {
      mode: "running",
      playerX: world.player.laneX(),
      playerY: world.player.height,
      shake,
    });
  }

  function animate() {
    if (document.hidden || disposed) return;
    const rawDt = runnerScene.clock.getDelta();
    frameSample = rawDt;
    const dt = Math.min(rawDt, 0.05);
    if (!contextLost && world) {
      if (phase === "ready") {
        world.player.animateIdle(dt);
        world.environment.update(dt, 2.4);
        runnerScene.updateEnvironmentMotion(dt, 2.4);
        runnerScene.updateCamera(dt, { mode: "ready" });
        world.effects.update(dt);
      } else if (phase === "countdown") {
        updateCountdown(dt);
      } else if (phase === "running") {
        updateRunning(dt);
      } else if (phase === "over") {
        updateOver(dt);
      }
      runnerScene.render();
    }
  }

  function bindControls() {
    bindRunnerControls(shell, {
      canControl: () => phase === "running",
      left: () => {
        if (world?.player.moveLane(-1)) audio.noise({ duration: 0.08, gain: 0.02, type: "bandpass", freq: 620 });
      },
      right: () => {
        if (world?.player.moveLane(1)) audio.noise({ duration: 0.08, gain: 0.02, type: "bandpass", freq: 620 });
      },
      jump: () => {
        if (world?.player.jump()) {
          audio.jump();
          shake = Math.max(shake, 0.04);
        }
      },
      slide: () => {
        if (world?.player.slide()) audio.slide();
      },
      pause: togglePause,
    });
  }

  function disposeAssets() {
    if (!assets) return;
    const roots = [assets.character.scene, ...Object.values(assets.forest), ...Object.values(assets.dungeon)];
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    roots.forEach((root) => {
      root.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach((material) => {
            materials.add(material);
            Object.values(material).forEach((value) => {
              if (value && value.isTexture) textures.add(value);
            });
          });
        }
      });
    });
    geometries.forEach((g) => g.dispose?.());
    materials.forEach((m) => m.dispose?.());
    Object.values(assets.textures).forEach((texture) => texture.dispose?.());
    assets.hdri?.dispose?.();
    textures.forEach((t) => t.dispose?.());
  }

  async function init() {
    try {
      assets = await loadRunnerAssets((loaded, total, label) => ui.setLoading(loaded, total, label));
      if (disposed) return;

      runnerScene.setSkyMap(assets.hdri);
      const environment = createEnvironment(scene, assets, quality, runnerScene.applyAtmosphere);
      const player = createPlayer(scene, assets.character, quality);
      const obstacles = createObstacles(scene, assets, environment.laneX, quality);
      const collectibles = createCollectibles(scene, assets, environment.laneX);
      const effects = new ParticleBurst(scene, { max: 520, size: 0.15 });

      const lantern = new THREE.PointLight("#ffb066", 1.7, 12, 2);
      lantern.position.set(0, 1.5, 0.7);
      player.root.add(lantern);

      const shieldBubble = new THREE.Mesh(
        new THREE.SphereGeometry(1.12, 20, 14),
        new THREE.MeshBasicMaterial({
          color: "#58e5ff",
          transparent: true,
          opacity: 0.13,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      );
      shieldBubble.position.y = 0.95;
      shieldBubble.visible = false;
      player.root.add(shieldBubble);

      const magnetRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.95, 0.035, 8, 36),
        new THREE.MeshBasicMaterial({
          color: "#8c70ff",
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      magnetRing.rotation.x = Math.PI / 2;
      magnetRing.position.y = 0.92;
      magnetRing.visible = false;
      player.root.add(magnetRing);

      world = { environment, player, obstacles, collectibles, effects, shieldBubble, magnetRing };
      collectibles.setQuality(quality);
      applyQuality(quality, false, false);
      bindControls();
      shell.setPauseHandler(togglePause);
      shell.setRestartHandler(start);

      if (isDebug) {
        window.__robloxsplay3d = {
          state: () => ({
            phase,
            distance,
            coins,
            score,
            speed,
            quality,
            lane: player.lane,
            laneIndex: player.lane + 1,
            invulnerable,
            x: player.laneX(),
            y: player.height,
            sliding: player.isSliding,
            grounded: player.isGrounded,
            shield: shieldTimer,
            magnet: magnetTimer,
            boost: boostTimer,
            obstacles: obstacles.countActive(),
            coinsActive: collectibles.coins.filter((coin) => coin.active).length,
            powerupsActive: collectibles.powerups.filter((power) => power.active).length,
            zone: environment.zone,
            animation: player.animation,
            render: (() => {
              let meshes = 0;
              let instanced = 0;
              let skinned = 0;
              scene.traverse((object) => {
                if (object.isMesh) meshes += 1;
                if (object.isInstancedMesh) instanced += 1;
                if (object.isSkinnedMesh) skinned += 1;
              });
              return {
                meshes,
                instanced,
                skinned,
                geometries: runnerScene.renderer.info.memory.geometries,
                textures: runnerScene.renderer.info.memory.textures,
              };
            })(),
          }),
          skipCountdown: () => {
            if (phase !== "countdown") return;
            countdown = 0;
            phase = "running";
            ui.hideCountdown();
            shell.setStatus("In play", "playing");
            runnerScene.clock.getDelta();
          },
          spawnObstacle: (type, lane, z = -2.5) => obstacles.debugSpawn(type, lane, z),
          spawnCoin: (lane, z = -2.5) => collectibles.spawnCoinLine(lane, z, 1, false),
          powerup: (type, z = -2.5) => collectibles.spawnPowerup(type, player.lane + 1, z),
          gameOver: () => gameOver(),
          restart: () => {
            if (world) start();
          },
          clearObstacles: () => obstacles.reset(),
          clearPickups: () => collectibles.reset(),
          setQuality: (value) => applyQuality(value, true, false),
          setSound: (value) => setSound(value, false),
        };
      }

      resetRun();
      phase = "ready";
      shell.setStatus("Ready to play");
      ui.hideLoading();
      shell.showOverlay({
        kicker: "Original 3D endless runner",
        title: "Ruin Runner 3D",
        text: "The last temple automaton wakes under a broken moon. Sprint the causeway, read the gates, jump the stones and carry the light through the ruins as far as you can.",
        actionLabel: "Start run",
        onAction: start,
        secondaryLabel: "All games",
        onSecondary: () => {
          window.location.href = "/all-games.html";
        },
        hint: "Arrows / WASD or swipe · Space jump · Down slide · P pause",
        mark: "play",
      });
      ui.decorateOverlay("start");
      runnerScene.clock.getDelta();
      runnerScene.renderer.setAnimationLoop(animate);
    } catch (error) {
      console.error("RUIN RUNNER ASSET ERROR", error);
      ui?.showLoadingError(error.message, () => window.location.reload());
      shell.setStatus("Asset load failed", "paused");
    }
  }

  init();

  return {
    destroy() {
      if (disposed) return;
      disposed = true;
      clearTimeout(gameOverTimer);
      runnerScene.renderer.setAnimationLoop(null);
      audio.dispose();
      ui?.destroy();
      runnerScene.dispose();
      disposeAssets();
      if (world) {
        world.effects.dispose();
        world.player.dispose();
        world.obstacles.dispose();
        world.collectibles.dispose();
        world.environment.dispose();
      }
    },
  };
}
