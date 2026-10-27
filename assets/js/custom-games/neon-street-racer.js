import { W, clamp, fillRoundRect, lerp, rand, randInt, shuffle } from "./game-utils.js";

const HORIZON = 186;
const BOTTOM = 566;
const PLAYER_Z = 0.92;
const LANE_CENTRES = [-0.64, 0, 0.64];
const TRAFFIC_COLOURS = [
  { body: "#6d5bd0", dark: "#2e2364", glass: "#0b1025", light: "#f472b6" },
  { body: "#0e7490", dark: "#083344", glass: "#061923", light: "#facc15" },
  { body: "#9d4edd", dark: "#3c1361", glass: "#12051f", light: "#67e8f9" },
  { body: "#b45309", dark: "#451a03", glass: "#170b02", light: "#fb923c" },
];

function curveOffset(z, distance) {
  return Math.sin(distance * 0.013 + z * 2.9) * 82 * z * z;
}

function makeProjector(distance) {
  return (lateral, z) => {
    const safeZ = clamp(z, 0, 1.08);
    const t = Math.pow(safeZ, 1.28);
    const half = 30 + 425 * t;
    return {
      x: W / 2 + curveOffset(safeZ, distance) + lateral * half,
      y: HORIZON + (BOTTOM - HORIZON) * t,
      scale: 0.11 + 0.89 * t,
      half,
      t,
    };
  };
}

function drawBackdrop(ctx, state) {
  const { time, distance } = state;
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 100);
  sky.addColorStop(0, "#040712");
  sky.addColorStop(0.5, "#0b1028");
  sky.addColorStop(1, "#241348");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 90);

  const glow = ctx.createRadialGradient(478, 140, 8, 478, 140, 300);
  glow.addColorStop(0, "rgba(244,114,182,.24)");
  glow.addColorStop(0.45, "rgba(124,97,255,.13)");
  glow.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(100, 0, 760, 430);

  // Ringed neon moon.
  ctx.save();
  ctx.strokeStyle = "rgba(244,114,182,.7)";
  ctx.shadowColor = "#f472b6";
  ctx.shadowBlur = 22;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(704, 124, 58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(704, 124, 73, 0.15, Math.PI * 1.55);
  ctx.stroke();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#f9a8d4";
  ctx.beginPath();
  ctx.arc(704, 124, 47, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Fine star field.
  for (let index = 0; index < 52; index += 1) {
    const x = (index * 149 - distance * 0.05) % (W + 80);
    const y = 24 + ((index * 61) % 126);
    ctx.save();
    ctx.globalAlpha = 0.26 + (index % 5) * 0.1;
    ctx.fillStyle = index % 4 === 0 ? "#f9a8d4" : "#a5f3fc";
    ctx.fillRect(x, y, 1.4, 1.4);
    ctx.restore();
  }

  // City skyline with a moving neon horizon.
  for (let layer = 0; layer < 3; layer += 1) {
    const alpha = [0.4, 0.65, 0.9][layer];
    const speed = [0.06, 0.15, 0.28][layer];
    const scroll = distance * speed;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let index = 0; index < 24; index += 1) {
      const x = ((index * 73 - scroll) % (W + 130)) - 65;
      const width = 30 + (index % 6) * 12 + layer * 5;
      const height = 38 + (index % 8) * 13 + layer * 14;
      const y = HORIZON - height;
      ctx.fillStyle = ["#080b18", "#0d0f22", "#120e28"][layer];
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle =
        index % 5 === 0 ? "rgba(244,114,182,.42)" : "rgba(103,232,249,.34)";
      for (let row = 0; row < Math.floor(height / 17); row += 1) {
        for (let column = 0; column < 2; column += 1) {
          if ((index + row + column) % 3 !== 0) {
            ctx.fillRect(x + 6 + column * 13, y + 8 + row * 17, 4, 2);
          }
        }
      }
    }
    ctx.restore();
  }

  ctx.save();
  const haze = ctx.createLinearGradient(0, HORIZON - 34, 0, HORIZON + 38);
  haze.addColorStop(0, "rgba(124,97,255,0)");
  haze.addColorStop(0.55, "rgba(124,97,255,.18)");
  haze.addColorStop(1, "rgba(34,211,238,.08)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, HORIZON - 34, W, 72);
  ctx.restore();

  if (state.speed > 0.58 && state.running) {
    ctx.save();
    ctx.strokeStyle = "rgba(165,243,252,.2)";
    ctx.lineWidth = 1;
    for (let index = 0; index < 16; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const x = W / 2 + side * (280 + (index % 6) * 54);
      const y = 170 + ((index * 73 + time * 260) % 250);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - side * (18 + state.speed * 28), y + 30);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawRoad(ctx, project, state) {
  const roadA = "#111528";
  const roadB = "#0b0e1d";
  for (let index = 0; index < 48; index += 1) {
    const z1 = index / 48;
    const z2 = (index + 1) / 48;
    const left1 = project(-1, z1);
    const right1 = project(1, z1);
    const left2 = project(-1, z2);
    const right2 = project(1, z2);
    ctx.beginPath();
    ctx.moveTo(left1.x, left1.y);
    ctx.lineTo(right1.x, right1.y);
    ctx.lineTo(right2.x, right2.y);
    ctx.lineTo(left2.x, left2.y);
    ctx.closePath();
    ctx.fillStyle = index % 2 === 0 ? roadA : roadB;
    ctx.fill();
  }

  // Reflective shoulders.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    for (let index = 0; index <= 32; index += 1) {
      const z = index / 32;
      const point = project(side * 1.0, z);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    for (let index = 32; index >= 0; index -= 1) {
      const z = index / 32;
      const point = project(side * 1.22, z);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(6,10,22,.9)";
    ctx.fill();
  }

  // Neon edge rails.
  ctx.save();
  for (const side of [-1, 1]) {
    ctx.strokeStyle = side < 0 ? "#22d3ee" : "#a78bfa";
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let index = 0; index <= 40; index += 1) {
      const z = index / 40;
      const point = project(side, z);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Moving lane dashes.
  ctx.save();
  ctx.strokeStyle = "rgba(226,232,240,.7)";
  ctx.shadowColor = "#67e8f9";
  ctx.shadowBlur = 8;
  const scroll = (state.distance * 0.045) % 1;
  for (const boundary of [-0.33, 0.33]) {
    for (let index = 0; index < 20; index += 1) {
      const z1 = ((index / 20 + scroll) % 1);
      const z2 = Math.min(1, z1 + 0.028);
      if (z1 < 0.015) continue;
      const p1 = project(boundary, z1);
      const p2 = project(boundary, z2);
      ctx.lineWidth = Math.max(1, p1.scale * 3);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Trackside pylons.
  for (const side of [-1, 1]) {
    for (let index = 0; index < 9; index += 1) {
      const z = (index / 9 + (state.distance * 0.028) % 1) % 1;
      if (z < 0.04) continue;
      const point = project(side * 1.16, z);
      const height = 52 * point.scale;
      ctx.save();
      ctx.globalAlpha = 0.4 + point.scale * 0.5;
      ctx.strokeStyle = side < 0 ? "#22d3ee" : "#a78bfa";
      ctx.lineWidth = Math.max(1, 2 * point.scale);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x, point.y - height);
      ctx.stroke();
      ctx.fillStyle = index % 2 === 0 ? "#f472b6" : "#a5f3fc";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(point.x, point.y - height, 2.4 * point.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawCar(ctx, x, y, scale, colours, { player = false, lean = 0, time = 0, boost = false } = {}) {
  const s = scale;
  const w = (player ? 76 : 66) * s;
  const h = (player ? 50 : 43) * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.translate(0, Math.sin(time * 18) * 0.6 * s);

  // Ground shadow and underglow.
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.beginPath();
  ctx.ellipse(0, 3 * s, w * 0.52, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, w * 0.72);
  glow.addColorStop(0, player ? "rgba(34,211,238,.32)" : "rgba(124,97,255,.2)");
  glow.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-w, -6 * s, w * 2, 24 * s);

  // Wheels.
  ctx.fillStyle = "#03050b";
  fillRoundRect(ctx, -w * 0.56, -h * 0.4, w * 0.18, h * 0.5, 3 * s);
  ctx.fill();
  fillRoundRect(ctx, w * 0.38, -h * 0.4, w * 0.18, h * 0.5, 3 * s);
  ctx.fill();

  // Rear body.
  const body = ctx.createLinearGradient(0, -h, 0, 0);
  body.addColorStop(0, colours.body);
  body.addColorStop(1, colours.dark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.14);
  ctx.lineTo(-w * 0.46, -h * 0.6);
  ctx.quadraticCurveTo(-w * 0.33, -h * 0.76, -w * 0.12, -h * 0.78);
  ctx.lineTo(w * 0.14, -h * 0.78);
  ctx.quadraticCurveTo(w * 0.37, -h * 0.72, w * 0.47, -h * 0.53);
  ctx.lineTo(w * 0.51, -h * 0.13);
  ctx.lineTo(w * 0.34, 0);
  ctx.lineTo(-w * 0.36, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(231,254,255,.32)";
  ctx.lineWidth = Math.max(1, 1.1 * s);
  ctx.stroke();

  // Cabin and rear glass.
  ctx.fillStyle = colours.glass;
  ctx.beginPath();
  ctx.moveTo(-w * 0.29, -h * 0.64);
  ctx.quadraticCurveTo(0, -h * 0.88, w * 0.3, -h * 0.62);
  ctx.lineTo(w * 0.26, -h * 0.45);
  ctx.quadraticCurveTo(0, -h * 0.55, -w * 0.25, -h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(165,243,252,.25)";
  ctx.stroke();

  // Tail lights.
  ctx.save();
  ctx.shadowColor = colours.light;
  ctx.shadowBlur = 12 * s;
  ctx.fillStyle = colours.light;
  fillRoundRect(ctx, -w * 0.4, -h * 0.3, w * 0.24, 4 * s, 2 * s);
  ctx.fill();
  fillRoundRect(ctx, w * 0.17, -h * 0.3, w * 0.24, 4 * s, 2 * s);
  ctx.fill();
  ctx.restore();

  // Bumper and plate.
  ctx.fillStyle = "#070914";
  fillRoundRect(ctx, -w * 0.22, -h * 0.16, w * 0.44, 6 * s, 2 * s);
  ctx.fill();
  ctx.fillStyle = player ? "#a3e635" : "#67e8f9";
  ctx.globalAlpha = 0.8;
  ctx.fillRect(-w * 0.08, -h * 0.15, w * 0.16, 1.5 * s);

  if (player) {
    // Rear wing.
    ctx.fillStyle = "#07111a";
    fillRoundRect(ctx, -w * 0.46, -h * 0.84, w * 0.92, 4 * s, 2 * s);
    ctx.fill();
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();
    ctx.fillStyle = "#101a27";
    ctx.fillRect(-w * 0.36, -h * 0.82, 3 * s, h * 0.12);
    ctx.fillRect(w * 0.32, -h * 0.82, 3 * s, h * 0.12);

    // A small driver mark, not a real-world badge.
    ctx.strokeStyle = "rgba(163,230,53,.85)";
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(-4 * s, -h * 0.55);
    ctx.lineTo(2 * s, -h * 0.47);
    ctx.lineTo(-4 * s, -h * 0.39);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(3,7,14,.8)";
    ctx.fillRect(-w * 0.3, -h * 0.73, w * 0.6, 2 * s);
  }

  if (boost) {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(time * 22) * 0.18;
    const flame = ctx.createLinearGradient(0, 0, 0, 34 * s);
    flame.addColorStop(0, "#a5f3fc");
    flame.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, -h * 0.02);
    ctx.lineTo(-w * 0.12, 22 * s);
    ctx.lineTo(0, 6 * s);
    ctx.lineTo(w * 0.12, 22 * s);
    ctx.lineTo(w * 0.22, -h * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawParticles(ctx, particles) {
  particles.forEach((particle) => {
    ctx.save();
    ctx.globalAlpha = clamp(particle.life / particle.max, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export default function mountNeonStreetRacer(shell) {
  const ctx = shell.ctx;
  let running = false;
  let paused = false;
  let ended = false;
  let elapsed = 0;
  let distance = 0;
  let speed = 0.52;
  let carX = 0;
  let targetX = 0;
  let boostTimer = 0;
  let brakeTimer = 0;
  let overtakes = 0;
  let score = 0;
  let spawnClock = 0.8;
  let crashFlash = 0;
  let traffic = [];
  let particles = [];
  let raf = 0;
  let lastTime = performance.now();
  let lastHudScore = -1;
  let lastHudSpeed = -1;
  let lastHudOvertakes = -1;

  const getSpeedKph = () => Math.round(96 + speed * 168);
  const getScore = () => Math.floor(distance) + overtakes * 100;

  const updateHud = () => {
    score = getScore();
    const kmh = getSpeedKph();
    if (score !== lastHudScore) {
      lastHudScore = score;
      shell.setScore(score);
    }
    if (kmh !== lastHudSpeed || overtakes !== lastHudOvertakes) {
      lastHudSpeed = kmh;
      lastHudOvertakes = overtakes;
      shell.setExtra([
        { label: "Speed", value: `${kmh} km/h` },
        { label: "Overtakes", value: overtakes },
      ]);
    }
  };

  const reset = () => {
    running = false;
    paused = false;
    ended = false;
    elapsed = 0;
    distance = 0;
    speed = 0.52;
    carX = 0;
    targetX = 0;
    boostTimer = 0;
    brakeTimer = 0;
    overtakes = 0;
    score = 0;
    spawnClock = 0.8;
    crashFlash = 0;
    traffic = [];
    particles = [];
    lastHudScore = -1;
    lastHudSpeed = -1;
    lastHudOvertakes = -1;
    shell.setScore(0);
    shell.setExtra([
      { label: "Speed", value: `${getSpeedKph()} km/h` },
      { label: "Overtakes", value: 0 },
    ]);
  };

  const spawnParticles = (x, y, count, color) => {
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x,
        y,
        vx: rand(-190, 190),
        vy: rand(-210, -20),
        life: rand(0.3, 0.9),
        max: 0.9,
        size: rand(1.5, 4.5),
        color,
      });
    }
  };

  const updateParticles = (dt) => {
    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 310 * dt;
      particle.life -= dt;
    });
    particles = particles.filter((particle) => particle.life > 0);
  };

  const showGameOver = () => {
    if (!running && ended) return;
    running = false;
    paused = false;
    ended = true;
    crashFlash = 1;
    score = getScore();
    shell.setPaused(false);
    shell.setScore(score, true);
    shell.setStatus("Collision", "paused");
    shell.showOverlay({
      kicker: "Run complete",
      title: "Wall check.",
      text: "The line was there. Commit earlier, brake sooner and leave room for the next gap.",
      actionLabel: "Race again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${Math.floor(distance)} m / ${overtakes} overtakes / ${getSpeedKph()} km/h`,
      mark: "restart",
    });
    shell.announce(`Crashed at ${Math.floor(distance)} metres. Score ${score}.`);
  };

  const crash = () => {
    if (running) showGameOver();
  };

  const spawnTraffic = () => {
    const occupied = new Set(
      traffic.filter((car) => car.z < 0.42).map((car) => car.lane),
    );
    const free = [0, 1, 2].filter((lane) => !occupied.has(lane));
    if (!free.length) {
      spawnClock = 0.35;
      return;
    }
    const count =
      elapsed > 12 && free.length >= 2 && Math.random() < 0.24 ? 2 : 1;
    const chosen = shuffle(free).slice(0, count);
    chosen.forEach((lane, index) => {
      traffic.push({
        lane,
        x: LANE_CENTRES[lane] + rand(-0.045, 0.045),
        z: 0.018 + index * 0.012,
        relative: rand(0.52, 0.7),
        colours: TRAFFIC_COLOURS[randInt(0, TRAFFIC_COLOURS.length - 1)],
        passed: false,
        phase: rand(0, Math.PI * 2),
      });
    });
    spawnClock = clamp(1.08 - elapsed * 0.004, 0.62, 1.08) * rand(0.88, 1.2);
  };

  const update = (dt) => {
    elapsed += dt;
    boostTimer = Math.max(0, boostTimer - dt);
    brakeTimer = Math.max(0, brakeTimer - dt);
    crashFlash = Math.max(0, crashFlash - dt * 4);

    const base = lerp(0.52, 0.95, clamp(elapsed / 95, 0, 1));
    speed = clamp(
      base + (boostTimer > 0 ? 0.16 : 0) - (brakeTimer > 0 ? 0.2 : 0),
      0.3,
      1.08,
    );
    distance += speed * dt * 32;
    carX = lerp(carX, targetX, 1 - Math.exp(-9 * dt));

    spawnClock -= dt;
    if (spawnClock <= 0) spawnTraffic();

    traffic.forEach((car) => {
      car.z += speed * car.relative * dt;
      car.x = LANE_CENTRES[car.lane] + Math.sin(elapsed * 2 + car.phase) * 0.025;
    });

    traffic.forEach((car) => {
      if (
        car.z > 0.79 &&
        car.z < 0.985 &&
        Math.abs(car.x - carX) < 0.235
      ) {
        const screen = makeProjector(distance)(car.x, car.z);
        spawnParticles(screen.x, screen.y - 10, 26, car.colours.light);
        crash();
      }
      if (!car.passed && car.z > 1.015) {
        car.passed = true;
        overtakes += 1;
        const screen = makeProjector(distance)(car.x, car.z);
        spawnParticles(screen.x, screen.y, 4, "#67e8f9");
        updateHud();
      }
    });

    if (!running) return;

    traffic = traffic.filter((car) => car.z < 1.09);
    updateParticles(dt);
    updateHud();
  };

  const draw = (now) => {
    const time = now / 1000;
    const project = makeProjector(distance);
    const state = { time, elapsed, distance, speed, running, project };

    drawBackdrop(ctx, state);
    drawRoad(ctx, project, state);

    traffic
      .slice()
      .sort((a, b) => a.z - b.z)
      .forEach((car) => {
        const screen = project(car.x, car.z);
        drawCar(ctx, screen.x, screen.y, screen.scale, car.colours, {
          time: time + car.phase,
        });
      });

    const carScreen = project(carX, PLAYER_Z);
    drawCar(ctx, carScreen.x, carScreen.y, carScreen.scale, {
      body: "#d1fae5",
      dark: "#0f766e",
      glass: "#031b26",
      light: "#f472b6",
    }, {
      player: true,
      lean: (targetX - carX) * -0.16,
      time,
      boost: boostTimer > 0,
    });

    drawParticles(ctx, particles);

    if (crashFlash > 0) {
      ctx.save();
      ctx.globalAlpha = crashFlash * 0.22;
      ctx.fillStyle = "#f472b6";
      ctx.fillRect(0, 0, W, 600);
      ctx.restore();
    }

    const vignette = ctx.createRadialGradient(W / 2, 300, 230, W / 2, 300, 600);
    vignette.addColorStop(0, "rgba(2,5,14,0)");
    vignette.addColorStop(1, "rgba(2,5,14,.65)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, 600);
  };

  const frame = (now) => {
    const dt = Math.min(0.045, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    if (running && !paused) {
      update(dt);
    } else {
      updateParticles(dt);
      crashFlash = Math.max(0, crashFlash - dt * 4);
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
      kicker: "Race paused",
      title: "Hold the line.",
      text: "The road is still there. Pick your gap before you rejoin the traffic.",
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
    shell.announce(
      "Neon Street Racer started. Steer around traffic, boost for score and brake before contact.",
    );
  }

  const steerBy = (direction) => {
    if (!running || paused) return;
    targetX = clamp(targetX + direction * 0.27, -0.84, 0.84);
  };

  const handleDirection = (direction) => {
    if (direction === "left") steerBy(-1);
    if (direction === "right") steerBy(1);
    if (direction === "up" && running && !paused) boostTimer = 1.05;
    if (direction === "down" && running && !paused) brakeTimer = 0.85;
  };

  shell.onKey((event) => {
    if (shell.overlayVisible() || event.repeat) return;
    const key = event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D", "w", "W", "s", "S"].includes(key)) {
      event.preventDefault();
    }
    if (key === "ArrowLeft" || key === "a" || key === "A") steerBy(-1);
    if (key === "ArrowRight" || key === "d" || key === "D") steerBy(1);
    if (key === "ArrowUp" || key === "w" || key === "W") handleDirection("up");
    if (key === "ArrowDown" || key === "s" || key === "S") handleDirection("down");
  });

  const pointerSteer = (x) => {
    if (!running || paused) return;
    targetX = clamp((x / W - 0.5) * 1.9, -0.84, 0.84);
  };

  shell.onPointer((x) => pointerSteer(x));
  shell.onPointerMove((x, y, event) => {
    if (event.pointerType === "mouse" && event.buttons === 0) return;
    pointerSteer(x);
  });
  shell.enableSwipe(handleDirection);
  shell.enableDpad(handleDirection, "↑ boost · ↓ brake<br>← → steer");
  shell.setPauseHandler(togglePause);
  shell.setRestartHandler(start);

  reset();
  shell.setStatus("Ready to drive");
  shell.showOverlay({
    kicker: "Original street racer",
    title: "Neon Street Racer",
    text: "Thread a midnight highway at speed. Read the traffic, protect your line and take every clean gap before it closes.",
    actionLabel: "Start engine",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "← → steer · ↑ boost · ↓ brake · P pause",
    mark: "play",
  });
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
