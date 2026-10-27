import { W, clamp, fillRoundRect, lerp, rand, randInt } from "./game-utils.js";

const H = 600;
const RUN_SECONDS = 60;
const BAYS = [
  { x: 176, y: 214 },
  { x: 380, y: 214 },
  { x: 584, y: 214 },
  { x: 788, y: 214 },
  { x: 176, y: 334 },
  { x: 380, y: 334 },
  { x: 584, y: 334 },
  { x: 788, y: 334 },
  { x: 176, y: 452 },
  { x: 380, y: 452 },
  { x: 584, y: 452 },
  { x: 788, y: 452 },
];

const TYPES = {
  scout: {
    hp: 1,
    points: 60,
    radius: 41,
    body: "#1d5a58",
    trim: "#67e8f9",
    eye: "#a3e635",
    width: 58,
    height: 62,
    drift: 12,
    lifeMin: 2.1,
    lifeMax: 2.9,
  },
  zipper: {
    hp: 1,
    points: 100,
    radius: 35,
    body: "#6b214d",
    trim: "#f472b6",
    eye: "#fda4af",
    width: 48,
    height: 66,
    drift: 36,
    lifeMin: 1.8,
    lifeMax: 2.5,
  },
  brute: {
    hp: 2,
    points: 160,
    radius: 50,
    body: "#51422a",
    trim: "#facc15",
    eye: "#fb923c",
    width: 74,
    height: 74,
    drift: 8,
    lifeMin: 2.5,
    lifeMax: 3.4,
  },
};

const makeRng = (() => {
  let seed = 9301;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

function drawBackdrop(ctx, state) {
  const { time } = state;
  const wall = ctx.createLinearGradient(0, 0, 0, 480);
  wall.addColorStop(0, "#060b15");
  wall.addColorStop(0.55, "#0a1422");
  wall.addColorStop(1, "#0b1a26");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  // Huge range mark.
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = "#67e8f9";
  ctx.lineWidth = 1;
  for (let ring = 0; ring < 5; ring += 1) {
    ctx.beginPath();
    ctx.arc(480, 306, 88 + ring * 82, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.moveTo(0, 306);
  ctx.lineTo(W, 306);
  ctx.moveTo(480, 60);
  ctx.lineTo(480, 470);
  ctx.stroke();
  ctx.restore();

  // Panel grid.
  ctx.save();
  ctx.strokeStyle = "rgba(103,232,249,.09)";
  ctx.lineWidth = 1;
  for (let x = 40; x < W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 54);
    ctx.lineTo(x, 478);
    ctx.stroke();
  }
  for (let y = 70; y < 480; y += 58) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(W - 24, y);
    ctx.stroke();
  }
  ctx.restore();

  // Side frames.
  for (const side of [0, 1]) {
    const x = side === 0 ? 28 : W - 28;
    ctx.save();
    ctx.strokeStyle = side === 0 ? "#22d3ee" : "#a78bfa";
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 66);
    ctx.lineTo(x, 468);
    ctx.stroke();
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1;
    for (let marker = 90; marker < 460; marker += 34) {
      ctx.beginPath();
      ctx.moveTo(x - 7, marker);
      ctx.lineTo(x + 7, marker);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bay pads.
  BAYS.forEach((bay, index) => {
    ctx.save();
    ctx.translate(bay.x, bay.y);
    ctx.strokeStyle = index % 4 === 0 ? "rgba(103,232,249,.28)" : "rgba(165,243,252,.16)";
    ctx.lineWidth = 1.3;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, 45 + ring * 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(165,243,252,.38)";
    ctx.font = "500 10px 'Space Grotesk', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`B${String(index + 1).padStart(2, "0")}`, 0, 84);
    ctx.restore();
  });

  // Floor.
  ctx.save();
  ctx.fillStyle = "#061019";
  ctx.fillRect(0, 475, W, H - 475);
  ctx.strokeStyle = "rgba(34,211,238,.18)";
  ctx.lineWidth = 1;
  for (let index = -8; index <= 8; index += 1) {
    ctx.beginPath();
    ctx.moveTo(480 + index * 22, 475);
    ctx.lineTo(480 + index * 112, H);
    ctx.stroke();
  }
  for (let index = 0; index < 6; index += 1) {
    const y = 480 + index * index * 5.2;
    ctx.beginPath();
    ctx.moveTo(180 - index * 52, y);
    ctx.lineTo(780 + index * 52, y);
    ctx.stroke();
  }
  ctx.restore();

  // Header line and labels.
  ctx.save();
  ctx.fillStyle = "rgba(103,232,249,.7)";
  ctx.font = "600 11px 'Space Grotesk', 'Segoe UI', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("ROBLOXSPLAY // AIM LAB", 42, 42);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(165,243,252,.42)";
  ctx.fillText("RANGE 07 / LIVE", W - 42, 42);
  ctx.restore();

  // Timer rail.
  const remaining = Math.max(0, RUN_SECONDS - state.elapsed);
  const ratio = remaining / RUN_SECONDS;
  ctx.save();
  fillRoundRect(ctx, 322, 56, 316, 7, 3.5);
  ctx.fillStyle = "rgba(165,243,252,.12)";
  ctx.fill();
  const bar = ctx.createLinearGradient(322, 0, 638, 0);
  bar.addColorStop(0, "#22d3ee");
  bar.addColorStop(0.65, "#a3e635");
  bar.addColorStop(1, "#f472b6");
  ctx.fillStyle = bar;
  fillRoundRect(ctx, 322, 56, Math.max(4, 316 * ratio), 7, 3.5);
  ctx.fill();
  ctx.fillStyle = "rgba(165,243,252,.55)";
  ctx.font = "500 10px 'Space Grotesk', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${remaining.toFixed(1)} SECONDS`, 480, 79);
  ctx.restore();

  // Drifting range dust.
  ctx.save();
  for (let index = 0; index < 18; index += 1) {
    const x = (index * 127 + Math.sin(time * 0.4 + index) * 22) % W;
    const y = 100 + ((index * 61 + time * 12) % 350);
    ctx.globalAlpha = 0.12 + (index % 4) * 0.05;
    ctx.fillStyle = index % 3 === 0 ? "#f472b6" : "#67e8f9";
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRobot(ctx, robot, time) {
  const type = TYPES[robot.type];
  const rise = clamp(robot.age / 0.3, 0, 1);
  const fade = clamp((robot.life - robot.age) / 0.16, 0, 1);
  const bob = Math.sin(time * 3.4 + robot.phase) * 2.4;
  const y = robot.y + bob + (1 - rise) * 48;
  const alpha = Math.min(rise, fade);
  const scale = 0.8 + rise * 0.2;
  if (alpha <= 0) return;

  ctx.save();
  ctx.translate(robot.x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Base shadow.
  ctx.fillStyle = "rgba(0,0,0,.48)";
  ctx.beginPath();
  ctx.ellipse(0, 39, type.width * 0.46, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Treads / base.
  ctx.fillStyle = "#06131b";
  fillRoundRect(ctx, -type.width * 0.42, 25, type.width * 0.84, 16, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(165,243,252,.24)";
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let tread = -2; tread <= 2; tread += 1) {
    ctx.strokeStyle = "rgba(103,232,249,.18)";
    ctx.beginPath();
    ctx.moveTo(tread * 13, 29);
    ctx.lineTo(tread * 13, 38);
    ctx.stroke();
  }
  ctx.strokeStyle = type.trim;
  ctx.globalAlpha = alpha * 0.35;
  ctx.beginPath();
  ctx.moveTo(-type.width * 0.34, 40);
  ctx.lineTo(type.width * 0.34, 40);
  ctx.stroke();
  ctx.globalAlpha = alpha;

  // Arms.
  ctx.fillStyle = "#10202b";
  fillRoundRect(ctx, -type.width * 0.55, -4, 10, 27, 4);
  ctx.fill();
  fillRoundRect(ctx, type.width * 0.55 - 10, -4, 10, 27, 4);
  ctx.fill();
  ctx.fillStyle = type.trim;
  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.arc(-type.width * 0.5 + 5, 23, 2.2, 0, Math.PI * 2);
  ctx.arc(type.width * 0.5 - 5, 23, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;

  // Body.
  const body = ctx.createLinearGradient(0, -type.height * 0.7, 0, 26);
  body.addColorStop(0, type.body);
  body.addColorStop(1, "#08141d");
  ctx.fillStyle = body;
  fillRoundRect(
    ctx,
    -type.width / 2,
    -type.height * 0.62,
    type.width,
    type.height * 0.83,
    robot.type === "brute" ? 12 : 17,
  );
  ctx.fill();
  ctx.strokeStyle = "rgba(165,243,252,.22)";
  ctx.lineWidth = 1.3;
  ctx.stroke();

  if (robot.type === "brute") {
    ctx.fillStyle = "#3b3325";
    fillRoundRect(ctx, -type.width * 0.62, -type.height * 0.5, 16, 36, 5);
    ctx.fill();
    fillRoundRect(ctx, type.width * 0.62 - 16, -type.height * 0.5, 16, 36, 5);
    ctx.fill();
    ctx.strokeStyle = type.trim;
    ctx.globalAlpha = alpha * 0.55;
    ctx.stroke();
    ctx.globalAlpha = alpha;
  }

  // Head and visor.
  ctx.fillStyle = "#0b1b25";
  fillRoundRect(
    ctx,
    -type.width * 0.37,
    -type.height * 0.86,
    type.width * 0.74,
    type.height * 0.42,
    robot.type === "zipper" ? 8 : 13,
  );
  ctx.fill();
  ctx.strokeStyle = type.trim;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = alpha * 0.6;
  ctx.stroke();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = type.eye;
  ctx.shadowColor = type.eye;
  ctx.shadowBlur = 11;
  if (robot.type === "zipper") {
    ctx.beginPath();
    ctx.arc(-10, -type.height * 0.65, 3.2, 0, Math.PI * 2);
    ctx.arc(10, -type.height * 0.65, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    fillRoundRect(
      ctx,
      -type.width * 0.22,
      -type.height * 0.68,
      type.width * 0.44,
      5,
      2.5,
    );
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Antenna.
  ctx.strokeStyle = type.trim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -type.height * 0.86);
  ctx.lineTo(0, -type.height * 0.98);
  ctx.stroke();
  ctx.fillStyle = robot.type === "brute" ? "#fb923c" : "#a3e635";
  ctx.beginPath();
  ctx.arc(0, -type.height * 0.99, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Armour pips on brutes.
  if (robot.type === "brute") {
    for (let pip = 0; pip < type.hp; pip += 1) {
      ctx.fillStyle = pip < robot.hp ? "#facc15" : "rgba(250,204,21,.18)";
      ctx.fillRect(-10 + pip * 12, 18, 7, 3);
    }
  }

  // Hit flash.
  if (robot.flash > 0) {
    ctx.globalAlpha = clamp(robot.flash, 0, 1) * 0.65;
    ctx.fillStyle = "#ffffff";
    fillRoundRect(
      ctx,
      -type.width * 0.62,
      -type.height * 0.9,
      type.width * 1.24,
      type.height * 1.12,
      18,
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawParticles(ctx, particles) {
  particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = clamp(particle.life / particle.max, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawFloats(ctx, floats) {
  floats.forEach((float) => {
    ctx.save();
    ctx.globalAlpha = clamp(float.life / float.max, 0, 1);
    ctx.fillStyle = float.color;
    ctx.font = "700 17px 'Space Grotesk', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = float.color;
    ctx.shadowBlur = 10;
    ctx.fillText(float.text, float.x, float.y);
    ctx.restore();
  });
}

function drawCrosshair(ctx, aim, time, lastHit) {
  const pulse = 1 + Math.sin(time * 5) * 0.06;
  const radius = 22 * pulse;
  ctx.save();
  ctx.translate(aim.x, aim.y);
  ctx.strokeStyle = lastHit ? "#a3e635" : "#a5f3fc";
  ctx.fillStyle = lastHit ? "#a3e635" : "#a5f3fc";
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  for (let side = 0; side < 4; side += 1) {
    ctx.save();
    ctx.rotate((Math.PI / 2) * side);
    ctx.beginPath();
    ctx.moveTo(0, -radius - 7);
    ctx.lineTo(0, -radius + 4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function mountRobotTargetArena(shell) {
  const ctx = shell.ctx;
  const controller = new AbortController();
  const held = new Set();
  let running = false;
  let paused = false;
  let ended = false;
  let elapsed = 0;
  let score = 0;
  let combo = 0;
  let shots = 0;
  let hits = 0;
  let spawnClock = 0.7;
  let robots = [];
  let particles = [];
  let floats = [];
  let aim = { x: 480, y: 310 };
  let lastHit = 0;
  let raf = 0;
  let lastTime = performance.now();
  let lastHudTime = -1;
  let lastHudCombo = -1;
  let lastHudScore = -1;

  const getMultiplier = () => Math.min(5, 1 + Math.floor(combo / 4));
  const getAccuracy = () => (shots === 0 ? 0 : Math.round((hits / shots) * 100));

  const updateHud = () => {
    const remaining = Math.max(0, RUN_SECONDS - elapsed);
    const tenths = Math.floor(remaining * 10);
    if (score !== lastHudScore) {
      lastHudScore = score;
      shell.setScore(score);
    }
    if (tenths !== lastHudTime || combo !== lastHudCombo) {
      lastHudTime = tenths;
      lastHudCombo = combo;
      shell.setExtra([
        { label: "Time", value: `${remaining.toFixed(1)}s` },
        { label: "Combo", value: `x${getMultiplier()}` },
      ]);
    }
  };

  const spawnParticles = (x, y, color, count = 12, strength = 140) => {
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x,
        y,
        vx: rand(-strength, strength),
        vy: rand(-strength, strength * 0.4),
        life: rand(0.25, 0.72),
        max: 0.72,
        size: rand(1.3, 3.8),
        color,
      });
    }
  };

  const chooseType = () => {
    const roll = Math.random();
    if (elapsed > 12 && roll < 0.2) return "brute";
    if (elapsed > 5 && roll < 0.46) return "zipper";
    return "scout";
  };

  const spawnRobot = (preferredBay = -1) => {
    const occupied = new Set(robots.map((robot) => robot.bay));
    const free = BAYS.map((bay, index) => ({ bay, index })).filter(
      (entry) => !occupied.has(entry.index),
    );
    if (!free.length) return;
    const entry =
      preferredBay >= 0 && !occupied.has(preferredBay)
        ? { bay: BAYS[preferredBay], index: preferredBay }
        : free[randInt(0, free.length - 1)];
    const typeKey = chooseType();
    const type = TYPES[typeKey];
    const robot = {
      bay: entry.index,
      type: typeKey,
      baseX: entry.bay.x,
      x: entry.bay.x,
      y: entry.bay.y,
      age: 0,
      life: rand(type.lifeMin, type.lifeMax),
      phase: rand(0, Math.PI * 2),
      hp: type.hp,
      flash: 0,
      rise: 0,
    };
    robots.push(robot);
  };

  const reset = () => {
    held.clear();
    running = false;
    paused = false;
    ended = false;
    elapsed = 0;
    score = 0;
    combo = 0;
    shots = 0;
    hits = 0;
    spawnClock = 0.65;
    robots = [];
    particles = [];
    floats = [];
    aim = { x: 480, y: 310 };
    lastHit = 0;
    lastHudTime = -1;
    lastHudCombo = -1;
    lastHudScore = -1;
    spawnRobot(1);
    spawnRobot(5);
    spawnRobot(9);
    shell.setScore(0);
    shell.setExtra([
      { label: "Time", value: "60.0s" },
      { label: "Combo", value: "x1" },
    ]);
  };

  const addFloat = (x, y, text, color) => {
    floats.push({ x, y, text, color, life: 0.85, max: 0.85 });
  };

  const destroyRobot = (robot, index) => {
    const type = TYPES[robot.type];
    const multiplier = getMultiplier();
    combo += 1;
    const gained = type.points * multiplier;
    score += gained;
    addFloat(robot.x, robot.y - 34, `+${gained}`, type.eye);
    spawnParticles(robot.x, robot.y, type.trim, 18, 180);
    spawnParticles(robot.x, robot.y, "#ffffff", 5, 80);
    robots.splice(index, 1);
    lastHit = 0.4;
    updateHud();
  };

  const shoot = () => {
    if (!running || paused) return;
    shots += 1;
    let hitIndex = -1;
    let bestDistance = Infinity;
    robots.forEach((robot, index) => {
      const rise = clamp(robot.age / 0.3, 0, 1);
      if (rise < 0.58) return;
      const type = TYPES[robot.type];
      const distance = Math.hypot(aim.x - robot.x, aim.y - robot.y);
      if (distance <= type.radius && distance < bestDistance) {
        bestDistance = distance;
        hitIndex = index;
      }
    });

    if (hitIndex >= 0) {
      hits += 1;
      const robot = robots[hitIndex];
      const type = TYPES[robot.type];
      robot.hp -= 1;
      robot.flash = 0.18;
      if (robot.hp <= 0) {
        destroyRobot(robot, hitIndex);
      } else {
        spawnParticles(aim.x, aim.y, type.trim, 8, 100);
        addFloat(robot.x, robot.y - 34, "ARMOUR", "#facc15");
        lastHit = 0.18;
      }
    } else {
      combo = 0;
      spawnParticles(aim.x, aim.y, "#64748b", 6, 60);
      addFloat(aim.x, aim.y - 16, "MISS", "#94a3b8");
    }
    updateHud();
  };

  const endRun = () => {
    if (!running && ended) return;
    held.clear();
    running = false;
    paused = false;
    ended = true;
    score = Math.max(score, 0);
    shell.setPaused(false);
    shell.setScore(score, true);
    shell.setStatus("Time up", "paused");
    shell.showOverlay({
      kicker: "Range closed",
      title: "Sixty seconds.",
      text: "The range rewards clean reads. Track the next machine, not the last one.",
      actionLabel: "Run the range again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${getAccuracy()}% accuracy / ${hits} clean hits / ${shots} shots`,
      mark: "restart",
    });
    shell.announce(`Time up. Score ${score}. Accuracy ${getAccuracy()} percent.`);
  };

  const update = (dt) => {
    elapsed += dt;
    if (elapsed >= RUN_SECONDS) {
      elapsed = RUN_SECONDS;
      updateHud();
      endRun();
      return;
    }

    spawnClock -= dt;
    if (spawnClock <= 0) {
      if (robots.length < 5) spawnRobot();
      const interval = lerp(0.98, 0.48, clamp(elapsed / RUN_SECONDS, 0, 1));
      spawnClock = interval * rand(0.84, 1.18);
    }

    robots.forEach((robot) => {
      robot.age += dt;
      robot.flash = Math.max(0, robot.flash - dt);
      const type = TYPES[robot.type];
      robot.rise = clamp(robot.age / 0.3, 0, 1);
      robot.x =
        robot.baseX +
        Math.sin(robot.age * 3.2 + robot.phase) * type.drift;
    });
    robots = robots.filter((robot) => robot.age < robot.life);

    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 280 * dt;
      particle.life -= dt;
    });
    particles = particles.filter((particle) => particle.life > 0);

    floats.forEach((float) => {
      float.y -= 28 * dt;
      float.life -= dt;
    });
    floats = floats.filter((float) => float.life > 0);
    lastHit = Math.max(0, lastHit - dt);

    updateHud();
  };

  const draw = (now) => {
    const time = now / 1000;
    drawBackdrop(ctx, { time, elapsed });
    robots
      .slice()
      .sort((a, b) => a.y - b.y)
      .forEach((robot) => drawRobot(ctx, robot, time));
    drawParticles(ctx, particles);
    drawFloats(ctx, floats);

    // Range telemetry.
    ctx.save();
    ctx.fillStyle = "rgba(165,243,252,.44)";
    ctx.font = "500 10px 'Space Grotesk', 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`ACCURACY ${getAccuracy()}%`, 42, 512);
    ctx.textAlign = "right";
    ctx.fillText(`TARGETS ${robots.length} / 5`, W - 42, 512);
    ctx.restore();

    drawCrosshair(ctx, aim, time, lastHit > 0);
  };

  const frame = (now) => {
    const dt = Math.min(0.045, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;

    if (running && !paused) {
      const moveX =
        (held.has("arrowright") || held.has("d") ? 1 : 0) -
        (held.has("arrowleft") || held.has("a") ? 1 : 0);
      const moveY =
        (held.has("arrowdown") || held.has("s") ? 1 : 0) -
        (held.has("arrowup") || held.has("w") ? 1 : 0);
      if (moveX || moveY) {
        const length = Math.hypot(moveX, moveY) || 1;
        aim.x = clamp(aim.x + (moveX / length) * 460 * dt, 48, W - 48);
        aim.y = clamp(aim.y + (moveY / length) * 460 * dt, 108, 532);
      }
      update(dt);
    } else {
      particles.forEach((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 280 * dt;
        particle.life -= dt;
      });
      particles = particles.filter((particle) => particle.life > 0);
      floats.forEach((float) => {
        float.y -= 28 * dt;
        float.life -= dt;
      });
      floats = floats.filter((float) => float.life > 0);
      lastHit = Math.max(0, lastHit - dt);
    }

    draw(now);
    raf = requestAnimationFrame(frame);
  };

  const togglePause = () => {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      lastTime = performance.now();
      shell.setStatus("In play", "playing");
      return;
    }
    paused = true;
    shell.setPaused(true);
    shell.showOverlay({
      kicker: "Range paused",
      title: "Hold position.",
      text: "The clock is stopped. Read the bays and pick your first target.",
      actionLabel: "Resume",
      onAction: () => {
        paused = false;
        shell.setPaused(false);
        lastTime = performance.now();
        shell.setStatus("In play", "playing");
      },
      secondaryLabel: "Restart",
      onSecondary: start,
      mark: "pause",
    });
  };

  function start() {
    reset();
    shell.hideOverlay();
    running = true;
    paused = false;
    shell.setPaused(false);
    shell.setStatus("In play", "playing");
    lastTime = performance.now();
    shell.canvas.focus({ preventScroll: true });
    shell.announce(
      "Robot Target Arena started. Sixty seconds. Click or tap the robots to score.",
    );
  }

  const pointerMove = (x, y) => {
    aim.x = clamp(x, 40, W - 40);
    aim.y = clamp(y, 96, 540);
  };

  shell.onPointer((x, y) => {
    pointerMove(x, y);
    shoot();
  });
  shell.onPointerMove((x, y) => {
    if (running && !paused) pointerMove(x, y);
  });

  const keyDown = (event) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    if (shell.overlayVisible()) return;
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key)) {
      held.add(key);
      event.preventDefault();
      return;
    }
    if (key === " " || key === "enter") {
      event.preventDefault();
      if (!event.repeat) shoot();
    }
  };

  const keyUp = (event) => {
    held.delete(event.key.toLowerCase());
  };

  const clearHeld = () => held.clear();

  window.addEventListener("keydown", keyDown, { signal: controller.signal });
  window.addEventListener("keyup", keyUp, { signal: controller.signal });
  window.addEventListener("blur", clearHeld, { signal: controller.signal });

  shell.setPauseHandler(togglePause);
  shell.setRestartHandler(start);
  shell.canvas.style.cursor = "none";

  reset();
  shell.setStatus("Range ready");
  shell.showOverlay({
    kicker: "Original target range",
    title: "Robot Target Arena",
    text: "Sixty seconds against a bay of original training robots. Click, tap or aim with the keyboard and keep the combo alive.",
    actionLabel: "Enter the range",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Click / tap to fire · Arrow keys or WASD to aim · Space to fire",
    mark: "play",
  });
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      controller.abort();
      shell.canvas.style.cursor = "";
    },
  };
}
