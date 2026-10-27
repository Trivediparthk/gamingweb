import * as THREE from "../../vendor/three/three.module.js";

export { THREE };

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));

const glowTextures = new Map();

export function makeGlowTexture(inner = "#ffffff", outer = "rgba(255,255,255,0)") {
  const key = `${inner}|${outer}`;
  if (glowTextures.has(key)) return glowTextures.get(key);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.28, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  glowTextures.set(key, texture);
  return texture;
}

export function glowSprite(color = "#c9ff4a", scale = 1, opacity = 0.9) {
  const material = new THREE.SpriteMaterial({
    map: makeGlowTexture(color, "rgba(0,0,0,0)"),
    color: 0xffffff,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(scale);
  return sprite;
}

export function show3DError(shell, message) {
  console.error("3D game failed:", message);
  shell.setStatus("3D unavailable", "paused");
  shell.showOverlay({
    kicker: "3D unavailable",
    title: "WebGL could not start",
    text:
      message ||
      "This browser or device could not create a WebGL context. Try a recent Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is enabled.",
    actionLabel: "Retry",
    onAction: () => window.location.reload(),
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    mark: "restart",
  });
}

export function createStage(shell, options = {}) {
  const {
    fov = 55,
    near = 0.1,
    far = 220,
    background = "#05070d",
    fogColor = "#05070d",
    fogNear = 26,
    fogFar = 95,
    shadows = true,
  } = options;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: shell.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch (error) {
    throw new Error("WebGL is not available in this browser.");
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  if (fogFar > fogNear) scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

  const camera = new THREE.PerspectiveCamera(fov, 16 / 10, near, far);
  camera.position.set(0, 3, 10);

  let clockLast = performance.now();
  const clock = {
    getDelta() {
      const now = performance.now();
      const delta = Math.max(0, (now - clockLast) / 1000);
      clockLast = now;
      return delta;
    },
  };
  const controller = new AbortController();
  const { signal } = controller;

  const resize = () => {
    const width = Math.max(1, shell.stage.clientWidth || shell.canvas.clientWidth || 960);
    const height = Math.max(1, shell.stage.clientHeight || shell.canvas.clientHeight || 600);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(shell.stage);
  window.addEventListener("resize", resize, { signal });

  const onLost = (event) => {
    event.preventDefault();
    show3DError(shell, "The WebGL context was lost. Reload the page or try a different browser.");
  };
  shell.canvas.addEventListener("webglcontextlost", onLost, false);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    try {
      renderer.setAnimationLoop(null);
    } catch {
      /* no loop */
    }
    observer.disconnect();
    controller.abort();
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose?.();
      const materials = object.material
        ? Array.isArray(object.material)
          ? object.material
          : [object.material]
        : [];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value && value.isTexture && !glowTextures.has(value)) value.dispose?.();
        });
        material.dispose?.();
      });
    });
    renderer.dispose();
  };

  return { renderer, scene, camera, clock, resize, dispose, signal };
}

export function addStudioLights(scene, options = {}) {
  const {
    key = "#fff4e0",
    sky = "#8fb6ff",
    ground = "#0a101c",
    accentA = "#c9ff4a",
    accentB = "#8c70ff",
    keyIntensity = 2.4,
  } = options;

  const hemisphere = new THREE.HemisphereLight(sky, ground, 0.75);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(key, keyIntensity);
  sun.position.set(8, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  const a = new THREE.PointLight(accentA, 45, 42, 2);
  a.position.set(-9, 5, 3);
  scene.add(a);

  const b = new THREE.PointLight(accentB, 35, 40, 2);
  b.position.set(9, 4, -3);
  scene.add(b);

  const rim = new THREE.PointLight("#58e5ff", 18, 35, 2);
  rim.position.set(0, 7, -12);
  scene.add(rim);

  return { hemisphere, sun, accentA: a, accentB: b, rim };
}

export function createGridFloor(scene, options = {}) {
  const {
    size = 46,
    divisions = 46,
    y = -4,
    colorA = "#1d3550",
    colorB = "#0a1220",
    plane = true,
  } = options;

  if (plane) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({
        color: "#070b14",
        roughness: 0.35,
        metalness: 0.55,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = y - 0.01;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  const grid = new THREE.GridHelper(size, divisions, colorA, colorB);
  grid.position.y = y;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);
  return grid;
}

export function createStarfield(scene, options = {}) {
  const { count = 900, radius = 90, color = "#a9c4ff", size = 0.42, opacity = 0.75 } = options;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = radius * (0.45 + Math.random() * 0.55);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

export class ParticleBurst {
  constructor(scene, { max = 240, size = 0.14 } = {}) {
    this.max = max;
    this.cursor = 0;
    this.positions = new Float32Array(max * 3).fill(-9999);
    this.colors = new Float32Array(max * 3);
    this.velocities = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max).fill(1);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.material = new THREE.PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.gravity = 0;
  }

  emit(position, count = 18, color = "#c9ff4a", speed = 4, life = 0.8, gravity = 0) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i += 1) {
      const index = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const s = speed * (0.45 + Math.random() * 0.8);
      this.positions[index * 3] = position.x;
      this.positions[index * 3 + 1] = position.y;
      this.positions[index * 3 + 2] = position.z;
      this.velocities[index * 3] = Math.sin(phi) * Math.cos(theta) * s;
      this.velocities[index * 3 + 1] = Math.cos(phi) * s;
      this.velocities[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * s;
      this.colors[index * 3] = c.r;
      this.colors[index * 3 + 1] = c.g;
      this.colors[index * 3 + 2] = c.b;
      this.life[index] = life * (0.6 + Math.random() * 0.6);
      this.maxLife[index] = this.life[index];
      this.gravity = gravity;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  update(dt) {
    for (let i = 0; i < this.max; i += 1) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.positions[i * 3 + 1] = -9999;
        continue;
      }
      this.velocities[i * 3 + 1] -= this.gravity * dt;
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
      this.velocities[i * 3] *= 0.985;
      this.velocities[i * 3 + 2] *= 0.985;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
  }
}

export class Trail {
  constructor(scene, { color = "#58e5ff", count = 24, size = 0.1 } = {}) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i += 1) {
      const fade = 1 - i / count;
      this.colors[i * 3] = c.r * fade;
      this.colors[i * 3 + 1] = c.g * fade;
      this.colors[i * 3 + 2] = c.b * fade;
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.line = new THREE.Line(this.geometry, this.material);
    this.line.frustumCulled = false;
    scene.add(this.line);
  }

  update(position) {
    for (let i = this.count - 1; i > 0; i -= 1) {
      this.positions[i * 3] = this.positions[(i - 1) * 3];
      this.positions[i * 3 + 1] = this.positions[(i - 1) * 3 + 1];
      this.positions[i * 3 + 2] = this.positions[(i - 1) * 3 + 2];
    }
    this.positions[0] = position.x;
    this.positions[1] = position.y;
    this.positions[2] = position.z;
    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.line.removeFromParent();
  }
}

export class Input {
  constructor(canvas, { signal, isActive = () => true } = {}) {
    this.canvas = canvas;
    this.isActive = isActive;
    this.keys = Object.create(null);
    this.pressed = Object.create(null);
    this.pointer = { x: 0, y: 0, ndcX: 0, ndcY: 0, down: false, active: false };
    this._tap = false;
    this._down = false;

    window.addEventListener(
      "keydown",
      (event) => {
        if (!this.isActive()) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
        this.keys[event.code] = true;
        this.keys[event.key] = true;
        this.pressed[event.code] = true;
        this.pressed[event.key] = true;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
          event.preventDefault();
        }
      },
      { signal },
    );
    window.addEventListener(
      "keyup",
      (event) => {
        this.keys[event.code] = false;
        this.keys[event.key] = false;
      },
      { signal },
    );
    window.addEventListener("blur", () => {
      this.keys = Object.create(null);
      this.pressed = Object.create(null);
      this.pointer.down = false;
    }, { signal });

    const update = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = (event.clientY - rect.top) / Math.max(1, rect.height);
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.ndcX = x * 2 - 1;
      this.pointer.ndcY = -(y * 2 - 1);
      this.pointer.active = true;
    };

    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (!this.isActive()) return;
        event.preventDefault();
        update(event);
        this.pointer.down = true;
        this._down = true;
        this._tap = true;
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      },
      { signal },
    );
    canvas.addEventListener(
      "pointermove",
      (event) => {
        update(event);
      },
      { signal },
    );
    canvas.addEventListener(
      "pointerup",
      (event) => {
        update(event);
        this.pointer.down = false;
      },
      { signal },
    );
    canvas.addEventListener("pointercancel", () => {
      this.pointer.down = false;
    }, { signal });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault(), { signal });
  }

  down(...keys) {
    return keys.some((key) => this.keys[key]);
  }

  consumePress(...codes) {
    for (const code of codes) {
      if (this.pressed[code]) {
        this.pressed[code] = false;
        return true;
      }
    }
    return false;
  }

  consumeTap() {
    if (!this._tap) return false;
    this._tap = false;
    return true;
  }

  consumeDown() {
    if (!this._down) return false;
    this._down = false;
    return true;
  }
}

export function disposeObject(object) {
  object?.removeFromParent?.();
  object?.geometry?.dispose?.();
  if (object?.material) {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose?.());
  }
}
