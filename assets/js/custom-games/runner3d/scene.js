import { THREE, createStage, clamp, lerp } from "../three-kit.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

function makeSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
  gradient.addColorStop(0, "#01030a");
  gradient.addColorStop(0.2, "#040d1b");
  gradient.addColorStop(0.4, "#081d2f");
  gradient.addColorStop(0.56, "#10323e");
  gradient.addColorStop(0.67, "#294746");
  gradient.addColorStop(0.75, "#88523f");
  gradient.addColorStop(0.86, "#c47b4a");
  gradient.addColorStop(1, "#1a1514");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2048, 1024);

  let seed = 20261025;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 900; i += 1) {
    const x = rnd() * 2048;
    const y = rnd() * 575;
    const alpha = 0.12 + rnd() * 0.75;
    const radius = rnd() < 0.12 ? 1.4 + rnd() * 1.2 : 0.35 + rnd() * 0.85;
    ctx.fillStyle = `rgba(190, 220, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const moonX = 1330;
  const moonY = 333;
  const moonRadius = 45;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.4, moonX, moonY, moonRadius * 6.5);
  moonGlow.addColorStop(0, "rgba(218, 242, 255, 0.38)");
  moonGlow.addColorStop(0.22, "rgba(160, 210, 255, 0.16)");
  moonGlow.addColorStop(1, "rgba(80, 150, 220, 0)");
  ctx.fillStyle = moonGlow;
  ctx.fillRect(0, 0, 2048, 1024);
  ctx.fillStyle = "#e8f6ff";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(118, 157, 184, 0.22)";
  for (const crater of [[-14, -8, 9], [12, 12, 7], [18, -17, 4], [-8, 17, 5]]) {
    ctx.beginPath();
    ctx.arc(moonX + crater[0], moonY + crater[1], crater[2], 0, Math.PI * 2);
    ctx.fill();
  }

  const horizonGlow = ctx.createRadialGradient(1050, 600, 10, 1050, 600, 680);
  horizonGlow.addColorStop(0, "rgba(255, 181, 104, 0.26)");
  horizonGlow.addColorStop(0.45, "rgba(213, 126, 82, 0.1)");
  horizonGlow.addColorStop(1, "rgba(60, 50, 50, 0)");
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, 0, 2048, 1024);

  const cloudBands = [
    { y: 360, h: 28, color: "rgba(22, 34, 56, 0.45)", count: 9 },
    { y: 430, h: 34, color: "rgba(14, 24, 42, 0.56)", count: 11 },
    { y: 500, h: 24, color: "rgba(48, 42, 48, 0.42)", count: 8 },
  ];
  for (const band of cloudBands) {
    for (let i = 0; i < band.count; i += 1) {
      const x = rnd() * 2048;
      const y = band.y + rnd() * 70 - 35;
      const rx = 110 + rnd() * 230;
      const ry = 10 + rnd() * band.h;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      const cloud = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      cloud.addColorStop(0, band.color);
      cloud.addColorStop(0.72, band.color);
      cloud.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.fillStyle = "rgba(2, 8, 12, 0.72)";
  ctx.beginPath();
  ctx.moveTo(0, 590);
  for (let x = 0; x <= 2048; x += 55) {
    const y = 566 - Math.sin(x * 0.006) * 26 - rnd() * 28;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(2048, 1024);
  ctx.lineTo(0, 1024);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(1, 4, 7, 0.86)";
  ctx.beginPath();
  ctx.moveTo(0, 650);
  for (let x = 0; x <= 2048; x += 40) {
    const y = 625 - Math.sin(x * 0.012 + 1.7) * 22 - rnd() * 24;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(2048, 1024);
  ctx.lineTo(0, 1024);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

function makeMoonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(128, 128, 18, 128, 128, 126);
  glow.addColorStop(0, "rgba(230, 248, 255, 0.95)");
  glow.addColorStop(0.22, "rgba(198, 232, 255, 0.75)");
  glow.addColorStop(0.45, "rgba(130, 188, 245, 0.26)");
  glow.addColorStop(1, "rgba(40, 90, 150, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(240, 250, 255, 0.95)";
  ctx.beginPath();
  ctx.arc(128, 128, 30, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function makeVignetteTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 50, 128, 128, 150);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export function createRunnerScene(shell, quality) {
  const stage = createStage(shell, {
    fov: 56,
    near: 0.1,
    far: 260,
    background: "#050d15",
    fogColor: "#0b1b22",
    fogNear: 22,
    fogFar: 155,
    shadows: true,
  });
  const { renderer, scene, camera } = stage;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  let skyTexture = makeSkyTexture();
  scene.background = skyTexture;
  scene.backgroundIntensity = 0.95;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  let envTarget = pmrem.fromEquirectangular(skyTexture);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  const setSkyMap = (texture) => {
    if (!texture) return;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const generator = new THREE.PMREMGenerator(renderer);
    generator.compileEquirectangularShader();
    const next = generator.fromEquirectangular(texture);
    generator.dispose();
    if (envTarget) envTarget.dispose();
    envTarget = next;
    scene.environment = next.texture;
    scene.environmentIntensity = 0.4;
  };

  const moonTexture = makeMoonTexture();
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: moonTexture,
    color: "#dcefff",
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  moon.position.set(44, 32, -150);
  moon.scale.set(27, 27, 1);
  scene.add(moon);

  const hemi = new THREE.HemisphereLight("#7d9dff", "#081412", 0.34);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight("#94bbff", 1.55);
  sun.position.set(-26, 36, -14);
  sun.target.position.set(0, 0, -4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -26;
  sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const rim = new THREE.DirectionalLight("#ff9b62", 0.62);
  rim.position.set(14, 9, 16);
  scene.add(rim);

  const warmFill = new THREE.PointLight("#ff9f5b", 1.45, 11, 2);
  warmFill.position.set(0, 4.5, 5.5);
  scene.add(warmFill);

  const cameraBase = { x: 0, y: 3.02, z: 6.6 };
  camera.position.set(cameraBase.x, cameraBase.y, cameraBase.z);
  camera.lookAt(0, 1.0, -5.6);
  let currentX = 0;
  let currentY = cameraBase.y;
  let time = 0;

  const updateCamera = (dt, options = {}) => {
    const { playerX = 0, playerY = 0, shake = 0, mode = "running" } = options;
    time += dt;
    if (mode === "ready") {
      const orbit = Math.sin(time * 0.14) * 1.2;
      currentX = lerp(currentX, orbit, 1 - Math.exp(-2.5 * dt));
      currentY = lerp(currentY, 3.18, 1 - Math.exp(-2.5 * dt));
      camera.position.set(currentX, currentY, 6.55);
      camera.lookAt(0, 1.04, -4.8);
      return;
    }
    const targetX = playerX * 0.24;
    const targetY = cameraBase.y + playerY * 0.16;
    currentX = lerp(currentX, targetX, 1 - Math.exp(-6 * dt));
    currentY = lerp(currentY, targetY, 1 - Math.exp(-7 * dt));
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    camera.position.set(currentX + sx, currentY + sy, cameraBase.z);
    camera.lookAt(playerX * 0.22, 0.98 + playerY * 0.12, -6.0);
  };

  // Post-processing
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.65, 0.82);
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  const resizePost = () => {
    const width = Math.max(1, shell.stage.clientWidth || 960);
    const height = Math.max(1, shell.stage.clientHeight || 600);
    composer.setSize(width, height);
  };
  resizePost();
  const postObserver = new ResizeObserver(resizePost);
  postObserver.observe(shell.stage);

  let postEnabled = quality !== "low";
  let currentQuality = quality;

  const setQuality = (value) => {
    currentQuality = value;
    const ratio = value === "high" ? Math.min(window.devicePixelRatio || 1, 2) : value === "medium" ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    renderer.setPixelRatio(ratio);
    stage.resize();
    resizePost();
    const shadows = value !== "low";
    renderer.shadowMap.enabled = shadows;
    sun.castShadow = shadows;
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
    sun.shadow.mapSize.set(value === "high" ? 2048 : 1024, value === "high" ? 2048 : 1024);
    renderer.shadowMap.needsUpdate = true;
    bloomPass.strength = value === "high" ? 0.3 : value === "medium" ? 0.16 : 0;
    bloomPass.enabled = value !== "low";
    postEnabled = value !== "low";
    scene.traverse((object) => {
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          material.needsUpdate = true;
        });
      }
    });
  };
  setQuality(quality);

  let atmosphereTarget = {
    fogColor: new THREE.Color("#0b1b22"),
    fogNear: 22,
    fogFar: 155,
    sunColor: new THREE.Color("#94bbff"),
    sunIntensity: 1.55,
    hemiIntensity: 0.34,
    exposure: 0.95,
  };

  const applyAtmosphere = (target) => {
    if (!target) return;
    atmosphereTarget = {
      fogColor: new THREE.Color(target.fogColor || "#0b1b22"),
      fogNear: target.fogNear ?? 22,
      fogFar: target.fogFar ?? 155,
      sunColor: new THREE.Color(target.sunColor || "#94bbff"),
      sunIntensity: target.sunIntensity ?? 1.55,
      hemiIntensity: target.hemiIntensity ?? 0.34,
      exposure: target.exposure ?? 0.95,
    };
  };

  const updateEnvironmentMotion = (dt, speed) => {
    scene.backgroundRotation = scene.backgroundRotation || new THREE.Euler();
    scene.backgroundRotation.y += dt * 0.0012;
    scene.environmentRotation = scene.environmentRotation || new THREE.Euler();
    scene.environmentRotation.y += dt * 0.0007;
    sunGlowPulse(dt);
    const k = 1 - Math.exp(-1.4 * dt);
    if (scene.fog) {
      scene.fog.color.lerp(atmosphereTarget.fogColor, k);
      scene.fog.near = lerp(scene.fog.near, atmosphereTarget.fogNear, k);
      scene.fog.far = lerp(scene.fog.far, atmosphereTarget.fogFar, k);
    }
    sun.color.lerp(atmosphereTarget.sunColor, k);
    sun.intensity = lerp(sun.intensity, atmosphereTarget.sunIntensity, k);
    hemi.intensity = lerp(hemi.intensity, atmosphereTarget.hemiIntensity, k);
    renderer.toneMappingExposure = lerp(renderer.toneMappingExposure, atmosphereTarget.exposure, k);
    void speed;
  };

  let glowTime = 0;
  const sunGlowPulse = (dt) => {
    glowTime += dt;
    warmFill.intensity = 1.45 + Math.sin(glowTime * 4.2) * 0.22;
  };

  const render = () => {
    if (postEnabled) composer.render();
    else renderer.render(scene, camera);
  };

  const dispose = () => {
    postObserver.disconnect();
    composer.dispose?.();
    envTarget.dispose();
    skyTexture.dispose();
    stage.dispose();
  };

  return {
    ...stage,
    camera,
    sun,
    hemi,
    applyAtmosphere,
    setSkyMap,
    setQuality,
    updateCamera,
    updateEnvironmentMotion,
    render,
    dispose,
    getQuality: () => currentQuality,
  };
}
