import { THREE, clamp, lerp, rand } from "../three-kit.js";

const LANE_WIDTH = 2.2;

function makeDustTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(210,188,150,0.72)");
  g.addColorStop(0.45, "rgba(190,166,128,0.3)");
  g.addColorStop(1, "rgba(160,140,110,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.55, "rgba(0,0,0,0.24)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function createPlayer(scene, characterGltf, quality = "medium") {
  const root = new THREE.Group();
  scene.add(root);

  const model = characterGltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 1.96 / Math.max(0.001, size.y);
  model.scale.setScalar(scale);
  model.position.y = -bounds.min.y * scale;
  model.rotation.y = Math.PI;
  const isAutomaton = !!characterGltf.animations.find((clip) => clip.name === "Running");
  if (isAutomaton) {
    const core = new THREE.PointLight("#59e6ff", 0.5, 2.6, 2);
    core.position.set(0, 1.48, 0.12);
    root.add(core);
    const coreRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.032, 6, 20),
      new THREE.MeshBasicMaterial({
        color: "#5ce8ff",
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    coreRing.position.set(0, 1.02, 0.32);
    root.add(coreRing);
  }
  model.traverse((object) => {
    if (!object.isMesh) return;
    if (isAutomaton && object.name === "Head") {
      const list = Array.isArray(object.material) ? object.material : [object.material];
      const next = list.map((material) => {
        if (!material || material.name !== "Black") return material;
        const face = material.clone();
        face.color.set("#061017");
        face.emissive = new THREE.Color("#58e8ff");
        face.emissiveIntensity = 2.6;
        face.metalness = 0.25;
        face.roughness = 0.2;
        return face;
      });
      object.material = Array.isArray(object.material) ? next : next[0];
    }
    object.castShadow = true;
    object.receiveShadow = false;
    object.frustumCulled = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material) return;
      material.envMapIntensity = isAutomaton ? 1.35 : 0.9;
      if (isAutomaton) {
        if (material.name === "Main") {
          material.metalness = 0.58;
          material.roughness = 0.34;
        } else if (material.name === "Grey") {
          material.metalness = 0.45;
          material.roughness = 0.4;
        } else if (material.name === "Black") {
          material.metalness = 0.5;
          material.roughness = 0.28;
        }
      }
      material.needsUpdate = true;
    });
  });
  root.add(model);

  const clips = {};
  characterGltf.animations.forEach((clip) => {
    const filtered = clip.tracks.filter((track) => !/^(?:root|Root|RootNode|Armature|RobotArmature)\.position$/.test(track.name));
    if (filtered.length !== clip.tracks.length) {
      clip.tracks = filtered;
    }
    clips[clip.name] = clip;
  });

  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  const wanted = [
    "Idle",
    "Running_A",
    "Running_B",
    "Running_Strafe_Left",
    "Running_Strafe_Right",
    "Jump_Start",
    "Jump_Idle",
    "Jump_Land",
    "Dodge_Forward",
    "Death_A",
    "Running",
    "Jump",
    "Sitting",
    "Death",
  ];
  const oneShotClips = new Set(["Jump_Start", "Jump_Land", "Dodge_Forward", "Death_A", "Jump", "Sitting", "Death"]);
  wanted.forEach((name) => {
    if (!clips[name]) return;
    const action = mixer.clipAction(clips[name]);
    action.enabled = true;
    action.clampWhenFinished = oneShotClips.has(name);
    action.setLoop(oneShotClips.has(name) ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    actions[name] = action;
  });

  const clipFallbacks = {
    Idle: ["Idle", "Standing"],
    Running_A: ["Running_A", "Running", "Walk"],
    Jump_Start: ["Jump_Start", "Jump", "WalkJump"],
    Jump_Idle: ["Jump_Idle", "Jump", "WalkJump"],
    Jump_Land: ["Jump_Land", "Jump"],
    Dodge_Forward: ["Dodge_Forward", "Sitting", "WalkJump", "Punch"],
    Death_A: ["Death_A", "Death"],
  };
  const resolveClip = (name) => {
    if (actions[name]) return name;
    return (clipFallbacks[name] || []).find((candidate) => actions[candidate]) || name;
  };

  let current = null;
  let currentName = "";
  const play = (name, { fade = 0.18, timeScale = 1 } = {}) => {
    const clipName = resolveClip(name);
    const next = actions[clipName];
    if (!next) return;
    if (currentName === clipName) {
      next.setEffectiveTimeScale(timeScale);
      return;
    }
    next.reset();
    next.setEffectiveTimeScale(timeScale);
    next.setEffectiveWeight(1);
    next.play();
    if (current) current.crossFadeTo(next, fade, false);
    else next.fadeIn(fade);
    current = next;
    currentName = clipName;
  };

  const shadowTexture = makeShadowTexture();
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    color: "#000000",
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.renderOrder = 2;
  scene.add(shadow);

  const dustTexture = makeDustTexture();
  const dust = [];
  for (let i = 0; i < 22; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: dustTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const sprite = new THREE.Sprite(material);
    sprite.visible = false;
    scene.add(sprite);
    dust.push({ sprite, life: 0, max: 1, velocity: new THREE.Vector3(), size: 1 });
  }
  let dustCursor = 0;

  const emitDust = (count, strength = 1) => {
    for (let i = 0; i < count; i += 1) {
      const particle = dust[dustCursor];
      dustCursor = (dustCursor + 1) % dust.length;
      particle.life = rand(0.35, 0.75);
      particle.max = particle.life;
      particle.size = rand(0.3, 0.8) * strength;
      particle.sprite.position.set(x + rand(-0.3, 0.3), 0.12 + rand(0, 0.16), rand(-0.3, 0.3));
      particle.velocity.set(rand(-0.7, 0.7) * strength, rand(0.35, 1.1) * strength, rand(-0.8, 1.0) * strength);
      particle.sprite.scale.setScalar(particle.size);
      particle.sprite.material.opacity = 0.45;
      particle.sprite.visible = true;
    }
  };

  let lane = 0;
  let x = 0;
  let y = 0;
  let vy = 0;
  let grounded = true;
  let sliding = false;
  let slideTimer = 0;
  let over = false;
  let landTimer = 0;
  let jumpStartTimer = 0;
  let jumpIdle = false;
  let stepTimer = 0;
  let idleTime = 0;
  let lastLaneChange = 0;

  const reset = () => {
    lane = 0;
    x = 0;
    y = 0;
    vy = 0;
    grounded = true;
    sliding = false;
    slideTimer = 0;
    over = false;
    landTimer = 0;
    jumpStartTimer = 0;
    jumpIdle = false;
    stepTimer = 0;
    idleTime = 0;
    lastLaneChange = 0;
    root.position.set(0, 0, 0);
    model.rotation.set(0, Math.PI, 0);
    mixer.stopAllAction();
    Object.values(actions).forEach((action) => action.reset());
    current = null;
    currentName = "";
    play("Idle", { fade: 0.05 });
    dust.forEach((particle) => {
      particle.life = 0;
      particle.sprite.visible = false;
    });
    shadow.position.set(0, 0.02, 0.1);
    shadow.scale.set(1, 1, 1);
    shadow.material.opacity = 0.38;
  };

  const moveLane = (direction) => {
    if (over) return false;
    const next = clamp(lane + direction, -1, 1);
    if (next === lane) return false;
    lane = next;
    lastLaneChange = 0.22;
    return true;
  };

  const jump = () => {
    if (over || !grounded) return false;
    grounded = false;
    sliding = false;
    slideTimer = 0;
    vy = 8.4;
    jumpStartTimer = clips.Jump_Start ? clips.Jump_Start.duration : 0.25;
    jumpIdle = false;
    play("Jump_Start", { fade: 0.08 });
    emitDust(5, 1.1);
    return true;
  };

  const slide = () => {
    if (over) return false;
    if (!grounded) {
      vy = Math.min(vy, -12);
      return false;
    }
    sliding = true;
    slideTimer = 0.74;
    play("Dodge_Forward", { fade: 0.1 });
    return true;
  };

  const animateIdle = (dt) => {
    idleTime += dt;
    root.position.set(0, 0, 0);
    play("Idle", { fade: 0.2 });
    mixer.update(dt);
    shadow.position.set(0, 0.02, 0.1);
    shadow.scale.set(1, 1, 1);
    shadow.material.opacity = 0.38;
    dust.forEach((particle) => {
      if (particle.life <= 0) return;
      particle.life -= dt;
      particle.sprite.material.opacity = Math.max(0, particle.life / particle.max) * 0.4;
      particle.sprite.position.addScaledVector(particle.velocity, dt);
      particle.sprite.visible = particle.life > 0;
    });
    model.rotation.z = Math.sin(idleTime * 0.7) * 0.008;
  };

  const update = (dt, speed) => {
    let stepped = false;
    let landed = false;

    const targetX = lane * LANE_WIDTH;
    const previousX = x;
    x = lerp(x, targetX, 1 - Math.exp(-12 * dt));
    const vx = (x - previousX) / Math.max(0.001, dt);

    if (!grounded) {
      vy -= 23 * dt;
      y += vy * dt;
      if (y <= 0) {
        y = 0;
        vy = 0;
        grounded = true;
        landed = true;
        landTimer = clips.Jump_Land ? clips.Jump_Land.duration : 0.25;
        play("Jump_Land", { fade: 0.08 });
        emitDust(9, 1.2);
      }
    }

    if (sliding) {
      slideTimer -= dt;
      if (slideTimer <= 0) sliding = false;
    }

    if (!over) {
      if (!grounded) {
        if (jumpStartTimer > 0) {
          jumpStartTimer -= dt;
          if (jumpStartTimer <= 0 && !jumpIdle) {
            jumpIdle = true;
            play("Jump_Idle", { fade: 0.12 });
          }
        }
      } else if (landTimer > 0) {
        landTimer -= dt;
        if (landTimer <= 0) {
          if (sliding) play("Dodge_Forward", { fade: 0.12 });
          else play("Running_A", { fade: 0.16, timeScale: clamp(speed / 13.5, 0.9, 1.5) });
        }
      } else if (sliding) {
        // Dodge action is clamped at its end; hold until the collider timer expires.
      } else {
        play("Running_A", { fade: 0.16, timeScale: clamp(speed / 13.5, 0.9, 1.5) });
      }
    }

    if (over) {
      play("Death_A", { fade: 0.12 });
    }

    if (currentName === "Running_A" && current) current.setEffectiveTimeScale(clamp(speed / 13.5, 0.9, 1.5));

    lastLaneChange = Math.max(0, lastLaneChange - dt);
    const lean = clamp(-vx * 0.035, -0.16, 0.16) + (lane - targetX / LANE_WIDTH) * 0;
    model.rotation.z = lerp(model.rotation.z, lean, 1 - Math.exp(-9 * dt));
    model.rotation.x = lerp(model.rotation.x, over ? 0 : 0.02 + (grounded ? 0 : 0.04), 1 - Math.exp(-6 * dt));
    root.position.set(x, y, 0);

    shadow.position.set(x, 0.02, 0.15);
    const shadowScale = 1 + clamp(y / 4, 0, 0.7);
    shadow.scale.set(shadowScale, shadowScale, 1);
    shadow.material.opacity = 0.4 * (1 - clamp(y / 3.6, 0, 0.82));

    stepTimer -= dt;
    if (grounded && !sliding && !over && speed > 1 && stepTimer <= 0) {
      stepTimer = 0.3 / clamp(speed / 13.5, 0.8, 1.6);
      stepped = true;
      emitDust(1, 0.55);
    }

    dust.forEach((particle) => {
      if (particle.life <= 0) return;
      particle.life -= dt;
      if (particle.life <= 0) {
        particle.sprite.visible = false;
        return;
      }
      particle.velocity.y += 0.5 * dt;
      particle.sprite.position.addScaledVector(particle.velocity, dt);
      const ratio = particle.life / particle.max;
      particle.sprite.material.opacity = ratio * 0.42;
      particle.sprite.scale.setScalar(particle.size * (1.35 - ratio * 0.35));
    });

    mixer.update(dt);
    return { stepped, landed };
  };

  const getCollider = () => ({
    x,
    y,
    z: 0,
    halfW: 0.38,
    halfD: 0.34,
    height: sliding ? 0.8 : 1.7,
  });

  const setGameOver = () => {
    over = true;
    sliding = false;
    grounded = true;
    play("Death_A", { fade: 0.1 });
  };

  const dispose = () => {
    // The character's GLTF resources are part of the scene and are disposed by the stage.
    scene.remove(shadow, ...dust.map((particle) => particle.sprite));
    shadowMaterial.dispose();
    shadowTexture.dispose();
    dust.forEach((particle) => particle.sprite.material.dispose());
    dustTexture.dispose();
  };

  reset();

  return {
    root,
    reset,
    update,
    animateIdle,
    moveLane,
    jump,
    slide,
    getCollider,
    setGameOver,
    dispose,
    laneX: () => x,
    get lane() {
      return lane;
    },
    get height() {
      return y;
    },
    get isSliding() {
      return sliding;
    },
    get isGrounded() {
      return grounded;
    },
    get isOver() {
      return over;
    },
    get animation() {
      return currentName;
    },
    emitDust: (count, strength) => emitDust(count, strength),
  };
}

export { LANE_WIDTH };
